//! Recognising the same work twice.
//!
//! A match is **certain** when the identifiers agree (DOI; ISBN of a whole
//! book) or when everything that can be compared is identical. It is
//! **probable** when title, first author and year agree closely. Parts of the
//! same book share its ISBN and sometimes its DOI, editions share a title, and
//! volumes share almost everything: each of these is told apart.

use std::collections::HashMap;

use serde::Serialize;

use crate::bib::latex::fold;
use crate::library::entry::Entry;
use crate::library::schema::is_whole_book;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Certainty {
    Probable,
    Certain,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum Reason {
    Doi,
    Isbn,
    Identical,
    TitleAuthorYear,
    File,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Match {
    /// Position in the list the index was built from.
    pub index: usize,
    pub certainty: Certainty,
    pub reasons: Vec<Reason>,
}

#[derive(Debug, Clone, Default)]
pub struct Fingerprint {
    doi: Option<String>,
    isbns: Vec<String>,
    /// Title and subtitle, folded, without a leading article.
    title: String,
    /// The title alone.
    main_title: String,
    families: Vec<String>,
    year: Option<i32>,
    entry_type: String,
    whole_book: bool,
    container: String,
    volume: String,
    number: String,
    first_page: String,
    edition: String,
}

const ARTICLES: &[&str] = &[
    "the ", "a ", "an ", "der ", "die ", "das ", "ein ", "eine ", "le ", "la ", "les ", "l ", "un ", "une ", "il ",
    "lo ", "i ", "gli ", "el ", "los ", "las ", "den ", "det ", "de ", "en ", "et ",
];

pub(crate) fn without_article(folded: &str) -> &str {
    for a in ARTICLES {
        if let Some(rest) = folded.strip_prefix(a)
            && !rest.is_empty()
        {
            return rest;
        }
    }
    folded
}

pub fn normalise_doi(doi: &str) -> Option<String> {
    let d = doi.trim().to_lowercase();
    let d = d
        .trim_start_matches("https://")
        .trim_start_matches("http://")
        .trim_start_matches("dx.doi.org/")
        .trim_start_matches("doi.org/")
        .trim_start_matches("doi:")
        .trim();
    let d = d.trim_end_matches(['.', ',', ';']);
    (d.starts_with("10.") && d.contains('/')).then(|| d.to_owned())
}

/// ISBNs in a field, each as an ISBN-13 without hyphens.
pub fn normalise_isbns(field: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut current = String::new();
    let flush = |current: &mut String, out: &mut Vec<String>| {
        if let Some(isbn) = to_isbn13(current)
            && !out.contains(&isbn)
        {
            out.push(isbn);
        }
        current.clear();
    };
    for c in field.chars() {
        match c {
            '0'..='9' | 'X' | 'x' => current.push(c.to_ascii_uppercase()),
            '-' | '\u{2010}' | '\u{2011}' | '–' => {}
            ' ' if !current.is_empty() && current.len() < 10 => {} // spaces used as hyphens
            _ => flush(&mut current, &mut out),
        }
        if current.len() == 13 {
            flush(&mut current, &mut out);
        }
    }
    flush(&mut current, &mut out);
    out
}

fn to_isbn13(digits: &str) -> Option<String> {
    match digits.len() {
        13 if digits.chars().all(|c| c.is_ascii_digit()) => Some(digits.to_owned()),
        10 if digits[..9].chars().all(|c| c.is_ascii_digit()) => {
            let body = format!("978{}", &digits[..9]);
            let sum: u32 =
                body.chars().enumerate().map(|(i, c)| c.to_digit(10).unwrap() * if i % 2 == 0 { 1 } else { 3 }).sum();
            let check = (10 - sum % 10) % 10;
            Some(format!("{body}{check}"))
        }
        _ => None,
    }
}

/// An ISBN-13 beginning with 978 as an ISBN-10, for catalogues that index older books that way.
pub fn to_isbn10(isbn13: &str) -> Option<String> {
    let body = isbn13.strip_prefix("978")?;
    if body.len() != 10 {
        return None;
    }
    let nine = &body[..9];
    let sum: u32 = nine.chars().enumerate().map(|(i, c)| c.to_digit(10).unwrap_or(0) * (10 - i as u32)).sum();
    let check = (11 - sum % 11) % 11;
    let check = if check == 10 { 'X' } else { char::from_digit(check, 10)? };
    Some(format!("{nine}{check}"))
}

pub fn fingerprint(entry: &Entry) -> Fingerprint {
    let main = fold(entry.get("title").unwrap_or(""));
    let full = fold(&entry.title_plain());
    let pages = entry.get("pages").unwrap_or("");
    let first_page: String = pages.chars().take_while(|c| c.is_alphanumeric()).collect();
    Fingerprint {
        doi: entry.get("doi").and_then(normalise_doi),
        isbns: entry.get("isbn").map(normalise_isbns).unwrap_or_default(),
        title: without_article(&full).to_owned(),
        main_title: without_article(&main).to_owned(),
        families: entry.creators().iter().map(|p| p.family_key()).filter(|f| !f.is_empty()).collect(),
        year: entry.year(),
        entry_type: entry.entry_type.clone(),
        whole_book: is_whole_book(&entry.entry_type),
        container: fold(&entry.container_plain()),
        volume: fold(entry.get("volume").unwrap_or("")),
        number: fold(entry.get("number").or_else(|| entry.get("issue")).unwrap_or("")),
        first_page: first_page.to_lowercase(),
        edition: fold(entry.get("edition").unwrap_or("")),
    }
}

fn similarity(a: &str, b: &str) -> f64 {
    if a.is_empty() || b.is_empty() {
        return 0.0;
    }
    if a == b {
        return 1.0;
    }
    strsim::normalized_levenshtein(a, b)
}

/// How alike two titles are, allowing for one of them lacking its subtitle.
fn title_similarity(a: &Fingerprint, b: &Fingerprint) -> f64 {
    let mut best = similarity(&a.title, &b.title);
    for (x, y) in [(&a.main_title, &b.title), (&a.title, &b.main_title), (&a.main_title, &b.main_title)] {
        // A main title of one or two words agrees with too much to count on its own.
        if x.split(' ').count() >= 3 && y.split(' ').count() >= 3 {
            best = best.max(similarity(x, y));
        }
    }
    best
}

fn differ(a: &str, b: &str) -> bool {
    !a.is_empty() && !b.is_empty() && a != b
}

fn same_first_family(a: &Fingerprint, b: &Fingerprint) -> Option<bool> {
    match (a.families.first(), b.families.first()) {
        (Some(x), Some(y)) => {
            Some(x == y || similarity(x, y) >= 0.85 || a.families.contains(y) || b.families.contains(x))
        }
        _ => None,
    }
}

/// Compares two fingerprints.
pub fn compare(a: &Fingerprint, b: &Fingerprint) -> Option<(Certainty, Vec<Reason>)> {
    let titles = title_similarity(a, b);
    let mut reasons = Vec::new();
    let mut certainty = None;

    // Different volumes or parts of one work are different entries, whatever else agrees.
    let told_apart = differ(&a.volume, &b.volume) && a.whole_book && b.whole_book;

    if let (Some(x), Some(y)) = (&a.doi, &b.doi) {
        if x == y {
            reasons.push(Reason::Doi);
            // A DOI shared by entries with different titles is the DOI of the
            // book they are both in.
            certainty = Some(if titles >= 0.5 || a.title.is_empty() || b.title.is_empty() {
                Certainty::Certain
            } else {
                Certainty::Probable
            });
        } else if titles < 0.98 {
            // Different DOIs: different works, unless the titles are the same
            // (a preprint and its published form).
            return None;
        }
    }

    if a.whole_book && b.whole_book && !told_apart && a.isbns.iter().any(|i| b.isbns.contains(i)) {
        reasons.push(Reason::Isbn);
        let c = if titles >= 0.6 || a.title.is_empty() || b.title.is_empty() {
            Certainty::Certain
        } else {
            Certainty::Probable
        };
        certainty = Some(certainty.map_or(c, |old: Certainty| old.max(c)));
    }

    if !a.title.is_empty() && titles >= 0.9 && !told_apart {
        let family = same_first_family(a, b);
        let year_ok = match (a.year, b.year) {
            (Some(x), Some(y)) => (x - y).abs() <= 1,
            _ => true,
        };
        let container_ok = a.container.is_empty()
            || b.container.is_empty()
            || similarity(&a.container, &b.container) >= 0.8
            || a.container.contains(&b.container)
            || b.container.contains(&a.container);
        let placed_apart = differ(&a.volume, &b.volume)
            || (differ(&a.first_page, &b.first_page) && a.container == b.container && !a.container.is_empty());
        let editions_apart = differ(&a.edition, &b.edition);
        // Short titles ("Introduction", "Review") need the author to agree.
        let short = a.title.split(' ').count() < 3;
        let family_ok = match family {
            Some(same) => same,
            None => !short,
        };

        if family_ok && year_ok && container_ok && !placed_apart && !editions_apart {
            let identical = titles >= 0.999
                && a.families == b.families
                && a.year == b.year
                && a.year.is_some()
                && !a.families.is_empty()
                && a.entry_type == b.entry_type
                && a.container == b.container
                && a.number == b.number;
            if identical {
                reasons.push(Reason::Identical);
                certainty = Some(Certainty::Certain);
            } else {
                reasons.push(Reason::TitleAuthorYear);
                certainty = Some(certainty.unwrap_or(Certainty::Probable));
            }
        }
    }

    certainty.map(|c| (c, reasons))
}

/// An index over a list of entries, for finding what matches a candidate
/// without comparing it to every entry.
#[derive(Debug, Default, Clone)]
pub struct Index {
    prints: Vec<Fingerprint>,
    by_doi: HashMap<String, Vec<usize>>,
    by_isbn: HashMap<String, Vec<usize>>,
    by_word: HashMap<String, Vec<usize>>,
}

/// The words of a title that an index is kept by: the first four of more than three letters.
fn index_words(title: &str) -> Vec<&str> {
    let mut words: Vec<&str> = title.split(' ').filter(|w| w.chars().count() > 3).take(4).collect();
    if words.is_empty() {
        words = title.split(' ').filter(|w| !w.is_empty()).take(2).collect();
    }
    words
}

impl Index {
    pub fn new<'a>(entries: impl IntoIterator<Item = &'a Entry>) -> Self {
        let mut index = Index::default();
        for e in entries {
            index.push(fingerprint(e));
        }
        index
    }

    pub fn len(&self) -> usize {
        self.prints.len()
    }

    pub fn is_empty(&self) -> bool {
        self.prints.is_empty()
    }

    pub fn push(&mut self, print: Fingerprint) -> usize {
        let i = self.prints.len();
        if let Some(doi) = &print.doi {
            self.by_doi.entry(doi.clone()).or_default().push(i);
        }
        for isbn in &print.isbns {
            self.by_isbn.entry(isbn.clone()).or_default().push(i);
        }
        for w in index_words(&print.title) {
            self.by_word.entry(w.to_owned()).or_default().push(i);
        }
        self.prints.push(print);
        i
    }

    fn candidates(&self, print: &Fingerprint) -> Vec<usize> {
        let mut out: Vec<usize> = Vec::new();
        if let Some(doi) = &print.doi {
            out.extend(self.by_doi.get(doi).into_iter().flatten());
        }
        for isbn in &print.isbns {
            out.extend(self.by_isbn.get(isbn).into_iter().flatten());
        }
        for w in index_words(&print.title) {
            out.extend(self.by_word.get(w).into_iter().flatten());
        }
        out.sort_unstable();
        out.dedup();
        out
    }

    /// The entries that match, the most certain first.
    pub fn find(&self, print: &Fingerprint, except: Option<usize>) -> Vec<Match> {
        let mut out: Vec<Match> = self
            .candidates(print)
            .into_iter()
            .filter(|&i| Some(i) != except)
            .filter_map(|i| {
                compare(print, &self.prints[i]).map(|(certainty, reasons)| Match { index: i, certainty, reasons })
            })
            .collect();
        out.sort_by(|a, b| b.certainty.cmp(&a.certainty).then(a.index.cmp(&b.index)));
        out
    }
}

/// Groups of entries that match one another, for "Find duplicates".
#[derive(Debug, Clone, Serialize)]
pub struct Group {
    pub ids: Vec<String>,
    pub certainty: Certainty,
    pub reasons: Vec<Reason>,
}

pub fn find_groups(entries: &[Entry]) -> Vec<Group> {
    let index = Index::new(entries);
    let mut parent: Vec<usize> = (0..entries.len()).collect();
    fn root(parent: &mut [usize], mut i: usize) -> usize {
        while parent[i] != i {
            parent[i] = parent[parent[i]];
            i = parent[i];
        }
        i
    }
    let mut info: HashMap<(usize, usize), (Certainty, Vec<Reason>)> = HashMap::new();
    for i in 0..entries.len() {
        for m in index.find(&index.prints[i], Some(i)) {
            if m.index > i {
                let (a, b) = (root(&mut parent, i), root(&mut parent, m.index));
                if a != b {
                    parent[b.max(a)] = a.min(b);
                }
                info.insert((i, m.index), (m.certainty, m.reasons));
            }
        }
    }
    let mut groups: HashMap<usize, Group> = HashMap::new();
    for ((a, _), (certainty, reasons)) in info {
        let r = root(&mut parent, a);
        let g =
            groups.entry(r).or_insert(Group { ids: Vec::new(), certainty: Certainty::Certain, reasons: Vec::new() });
        // A group is as certain as its weakest link.
        g.certainty = g.certainty.min(certainty);
        for reason in reasons {
            if !g.reasons.contains(&reason) {
                g.reasons.push(reason);
            }
        }
    }
    for (i, entry) in entries.iter().enumerate() {
        let r = root(&mut parent, i);
        if let Some(g) = groups.get_mut(&r) {
            g.ids.push(entry.id.clone());
        }
    }
    let mut out: Vec<Group> = groups.into_values().filter(|g| g.ids.len() > 1).collect();
    let position: HashMap<&str, usize> = entries.iter().enumerate().map(|(i, e)| (e.id.as_str(), i)).collect();
    out.sort_by_key(|g| position.get(g.ids[0].as_str()).copied().unwrap_or(0));
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::library::draft_from_source;

    fn entry(src: &str) -> Entry {
        let mut e = draft_from_source(src).unwrap().to_entry();
        e.id = e.key.clone();
        e
    }

    fn cmp(a: &str, b: &str) -> Option<(Certainty, Vec<Reason>)> {
        compare(&fingerprint(&entry(a)), &fingerprint(&entry(b)))
    }

    #[test]
    fn identifiers() {
        assert_eq!(
            normalise_doi(" https://doi.org/10.1017/S0009838800012345. ").as_deref(),
            Some("10.1017/s0009838800012345")
        );
        assert_eq!(normalise_doi("doi:10.2307/123").as_deref(), Some("10.2307/123"));
        assert_eq!(normalise_doi("not a doi"), None);
        assert_eq!(normalise_isbns("0-8018-2388-9"), vec!["9780801823886"]);
        assert_eq!(normalise_isbns("978-0-8018-2388-6 (pbk.), 080442957X"), vec!["9780801823886", "9780804429573"]);
        assert_eq!(normalise_isbns("9780801823886 9780804429573"), vec!["9780801823886", "9780804429573"]);
        assert!(normalise_isbns("12345").is_empty());
        assert_eq!(to_isbn10("9780801823886").as_deref(), Some("0801823889"));
        assert_eq!(to_isbn10("9780804429573").as_deref(), Some("080442957X"));
    }

    #[test]
    fn the_same_doi_is_certain() {
        let r = cmp(
            "@article{a, title={Wrath in Homer}, author={Muellner, L.}, doi={10.1000/xyz}}",
            "@article{b, title={Wrath in {Homer}}, author={Leonard Muellner}, doi={https://doi.org/10.1000/XYZ}}",
        );
        assert_eq!(r.unwrap().0, Certainty::Certain);
    }

    #[test]
    fn chapters_of_one_book_are_not_each_other() {
        // They share the ISBN and the year; the titles differ.
        assert_eq!(
            cmp(
                "@incollection{a, author={Nagy, G.}, title={Homeric Questions}, booktitle={A Companion}, isbn={9780801823886}, date={2004}}",
                "@incollection{b, author={Lord, A.}, title={Oral Poetry and Its Singers}, booktitle={A Companion}, isbn={9780801823886}, date={2004}}",
            ),
            None
        );
        // Two introductions by the same author in different books.
        assert_eq!(
            cmp(
                "@incollection{a, author={Nagy, G.}, title={Introduction}, booktitle={Greek Epic Fragments}, date={2004}}",
                "@incollection{b, author={Nagy, G.}, title={Introduction}, booktitle={The Homeric Hymns Reconsidered}, date={2004}}",
            ),
            None
        );
    }

    #[test]
    fn the_same_book_described_twice() {
        let r = cmp(
            "@book{a, author={Nagy, Gregory}, title={The Best of the Achaeans}, subtitle={Concepts of the Hero in Archaic Greek Poetry}, date={1979}, isbn={0801823889}}",
            "@book{b, author={G. Nagy}, title={Best of the Achaeans: Concepts of the hero in archaic Greek poetry}, year={1979}, isbn={978-0-8018-2388-6}}",
        )
        .unwrap();
        assert_eq!(r.0, Certainty::Certain);
        assert!(r.1.contains(&Reason::Isbn));

        // Without identifiers, and one lacking the subtitle: probable.
        let r = cmp(
            "@book{a, author={Nagy, Gregory}, title={The Best of the Achaeans}, subtitle={Concepts of the Hero in Archaic Greek Poetry}, date={1979}}",
            "@book{b, author={Nagy, G.}, title={The Best of the Achaeans}, year={1980}}",
        )
        .unwrap();
        assert_eq!(r, (Certainty::Probable, vec![Reason::TitleAuthorYear]));
    }

    #[test]
    fn identical_entries_are_certain() {
        let r = cmp(
            "@article{a, author={West, M. L.}, title={The Rise of the Greek Epic}, journaltitle={JHS}, volume={108}, date={1988}, pages={151--172}}",
            "@article{b, author={West, Martin L.}, title={The rise of the Greek epic}, journal={JHS}, volume={108}, year={1988}, pages={151-172}}",
        )
        .unwrap();
        assert_eq!(r, (Certainty::Certain, vec![Reason::Identical]));
    }

    #[test]
    fn editions_volumes_and_authors_tell_apart() {
        assert_eq!(
            cmp(
                "@book{a, author={Kirk, G. S.}, title={The Iliad: A Commentary}, volume={1}, date={1985}}",
                "@book{b, author={Kirk, G. S.}, title={The Iliad: A Commentary}, volume={2}, date={1985}}",
            ),
            None
        );
        assert_eq!(
            cmp(
                "@book{a, author={Lord, A.}, title={The Singer of Tales}, date={1960}}",
                "@book{b, author={Lord, A.}, title={The Singer of Tales}, edition={2}, date={2000}}",
            ),
            None
        );
        assert_eq!(
            cmp(
                "@book{a, author={Smith, J.}, title={A History of Greece}, date={1990}}",
                "@book{b, author={Jones, P.}, title={A History of Greece}, date={1990}}",
            ),
            None
        );
    }

    #[test]
    fn index_and_groups() {
        let entries = vec![
            entry("@book{a, author={Nagy, G.}, title={The Best of the Achaeans}, date={1979}}"),
            entry("@book{b, author={Lord, A.}, title={The Singer of Tales}, date={1960}}"),
            entry("@book{c, author={Nagy, Gregory}, title={Best of the Achaeans}, date={1979}}"),
            entry("@article{d, title={Something Else Entirely}, doi={10.1/x}}"),
            entry("@article{e, title={Something else entirely}, doi={10.1/X}}"),
            entry("@book{f, author={Nagy, G.}, title={The best of the Achaeans}, date={1979}}"),
        ];
        let index = Index::new(&entries);
        let m = index.find(&fingerprint(&entries[2]), Some(2));
        assert_eq!(m.iter().map(|m| m.index).collect::<Vec<_>>(), vec![0, 5]);

        let groups = find_groups(&entries);
        assert_eq!(groups.len(), 2);
        assert_eq!(groups[0].ids, vec!["a", "c", "f"]);
        assert_eq!(groups[1].ids, vec!["d", "e"]);
        assert_eq!(groups[1].certainty, Certainty::Certain);
    }

    #[test]
    fn greek_titles() {
        let r = cmp(
            "@book{a, author={Μαρωνίτης, Δ. Ν.}, title={Ομηρικά μεγαθέματα}, date={1999}}",
            "@book{b, author={Μαρωνίτης, Δ.}, title={Ὁμηρικὰ μεγαθέματα}, date={1999}}",
        );
        assert!(r.is_some());
    }
}
