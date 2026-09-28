//! The references of the library for a work that is cited.
//!
//! A text has many citations, and each is looked up. What the library has
//! is therefore laid out for looking things up in once ([`Shelf`]), and
//! kept until the library is another or has been changed.

use std::collections::{HashMap, HashSet};
use std::hash::{DefaultHasher, Hash, Hasher};
use std::sync::{Arc, Mutex};

use serde_json::Value;

use super::{FoundItem, Suggestion, Sure, zotero_key};
use crate::bib::date::entry_year;
use crate::bib::latex::{fold, plain};
use crate::bib::names::{Person, short_list};
use crate::duplicates::{self, Certainty, Reason, without_article};
use crate::library::Library;
use crate::library::entry::{Draft, Entry};
use crate::lookup::csl;

/// How many references are given for one work at most.
const MOST: usize = 8;

/// The words that stand before a family name and are part of it to some,
/// and not to others: "van Beethoven", "de Jong".
pub(super) const PARTICLES: [&str; 30] = [
    "van", "von", "de", "der", "den", "des", "di", "da", "do", "dos", "das", "del", "della", "degli", "du", "le", "la",
    "los", "las", "af", "av", "ten", "ter", "te", "zu", "zur", "vom", "el", "al", "ibn",
];

/// What is compared of one entry.
#[derive(Debug, Default)]
pub(super) struct Work {
    /// For each of those who stand first, the forms their family name is
    /// written in, folded: "beethoven" and "van beethoven".
    names: Vec<Vec<String>>,
    /// The same of those who stand behind them: the editors of a work that
    /// has authors.
    behind: Vec<Vec<String>>,
    /// The words of the given names of those who stand first, folded.
    given: Vec<String>,
    /// The year, and the year it first came out where that is another.
    years: Vec<i32>,
    /// The title without its subtitle, the short title, and the whole
    /// title: folded, without an article before them, in words.
    titles: Vec<Vec<String>>,
    /// Those who stand first, as lists show them: "Nagy and Lord".
    people: String,
    /// The title as it is shown, cut short.
    title: String,
}

/// A word that follows a name in a text, folded.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct Said {
    pub word: String,
    /// Whether something that parts stands after it: a comma, a bracket, a
    /// full stop, the end.
    pub ends: bool,
}

/// The words of a text that name a work.
#[derive(Debug, Default)]
pub(super) struct Words<'a> {
    /// The family names, folded.
    pub names: &'a [String],
    /// The years, without the letters after them.
    pub years: &'a [i32],
    /// The entries whose title follows the name, and how many of the words
    /// of the title do.
    pub titled: &'a [(usize, usize)],
}

/// What the library has, laid out for looking things up in.
#[derive(Debug, Default)]
pub(super) struct Shelf {
    ids: Vec<String>,
    works: Vec<Work>,
    prints: duplicates::Index,
    by_zotero: HashMap<String, Vec<usize>>,
    by_name: HashMap<String, Vec<usize>>,
    by_year: HashMap<i32, Vec<usize>>,
    by_title_word: HashMap<String, Vec<usize>>,
    /// The first words of the names, by which a text is looked through.
    firsts: HashSet<String>,
    /// How many words the longest name has.
    longest: usize,
}

/// The forms a family name is written in, folded.
fn forms_of(person: &Person) -> Vec<String> {
    let family = fold(&person.family);
    if family.is_empty() || (person.literal && family == "others") {
        return Vec::new();
    }
    let mut forms = vec![family.clone()];
    let prefix = fold(&person.prefix);
    if !prefix.is_empty() {
        forms.push(format!("{prefix} {family}"));
    }
    if !person.literal {
        // The particle may be written as part of the name: "De Jong".
        let mut rest = family.as_str();
        while let Some((first, more)) = rest.split_once(' ') {
            if !PARTICLES.contains(&first) {
                break;
            }
            rest = more;
        }
        if rest != family {
            forms.push(rest.to_owned());
        }
    }
    forms
}

fn words_of(title: &str) -> Vec<String> {
    without_article(&fold(title)).split(' ').filter(|w| !w.is_empty()).map(str::to_owned).collect()
}

/// A word that tells a title from others: not "of", not "the".
fn tells(word: &str) -> bool {
    word.chars().count() >= 4
}

fn cut(text: &str, most: usize) -> String {
    if text.chars().count() <= most {
        return text.to_owned();
    }
    let cut: String = text.chars().take(most).collect();
    let cut = match cut.rfind(' ') {
        Some(space) if space > most / 2 => &cut[..space],
        _ => cut.as_str(),
    };
    format!("{}…", cut.trim_end_matches([',', ';', ':', '.', ' ', '–', '-']))
}

impl Work {
    fn new(entry: &Entry) -> Self {
        let creators = entry.creators();
        let names: Vec<Vec<String>> = creators.iter().map(forms_of).filter(|f| !f.is_empty()).collect();
        let mut behind: Vec<Vec<String>> = Vec::new();
        for field in ["editor", "translator", "bookauthor"] {
            for person in entry.people(field) {
                let forms = forms_of(&person);
                if !forms.is_empty() && !names.contains(&forms) && !behind.contains(&forms) {
                    behind.push(forms);
                }
            }
        }
        let mut years: Vec<i32> = entry.year().into_iter().collect();
        for field in ["origdate", "eventdate"] {
            if let Some(year) = entry_year(entry.get(field), None)
                && !years.contains(&year)
            {
                years.push(year);
            }
        }
        let main = entry.get("title").map(plain).unwrap_or_default();
        let mut titles: Vec<Vec<String>> = Vec::new();
        for title in [main.clone(), entry.get("shorttitle").map(plain).unwrap_or_default(), entry.title_plain()] {
            let words = words_of(&title);
            if !words.is_empty() && !titles.contains(&words) {
                titles.push(words);
            }
        }
        let given: Vec<String> =
            creators.iter().flat_map(|p| fold(&p.given).split(' ').map(str::to_owned).collect::<Vec<_>>()).collect();
        Work { names, behind, given, years, titles, people: short_list(&creators), title: cut(&main, 48) }
    }

    /// How many of the names stand first in the work, and whether the first
    /// of them is the first of the work.
    fn named(&self, names: &[String]) -> (usize, bool) {
        let agree = names.iter().filter(|name| self.names.iter().any(|forms| forms.contains(name))).count();
        let first = match (names.first(), self.names.first()) {
            (Some(name), Some(forms)) => forms.contains(name),
            _ => false,
        };
        (agree, first)
    }

    fn year_away(&self, years: &[i32]) -> Option<i32> {
        years.iter().flat_map(|y| self.years.iter().map(move |mine| (y - mine).abs())).min()
    }
}

impl Shelf {
    fn new(library: &Library) -> Self {
        let entries = library.entries();
        let mut shelf = Shelf { prints: duplicates::Index::new(entries), ..Default::default() };
        for (i, entry) in entries.iter().enumerate() {
            let work = Work::new(entry);
            for key in &entry.zotero {
                shelf.by_zotero.entry(key.clone()).or_default().push(i);
            }
            for forms in &work.names {
                for form in forms {
                    let words = form.split(' ').count();
                    shelf.longest = shelf.longest.max(words);
                    shelf.firsts.insert(form.split(' ').next().unwrap_or(form).to_owned());
                    let list = shelf.by_name.entry(form.clone()).or_default();
                    if !list.contains(&i) {
                        list.push(i);
                    }
                }
            }
            for year in &work.years {
                shelf.by_year.entry(*year).or_default().push(i);
            }
            let mut seen: Vec<&String> = Vec::new();
            for word in work.titles.iter().flatten().filter(|w| tells(w)) {
                if !seen.contains(&word) {
                    seen.push(word);
                    shelf.by_title_word.entry(word.clone()).or_default().push(i);
                }
            }
            shelf.ids.push(entry.id.clone());
            shelf.works.push(work);
        }
        shelf
    }

    pub(super) fn is_empty(&self) -> bool {
        self.works.is_empty()
    }

    /// Whether a word, folded, may begin the name of one who stands first
    /// in a work of the library.
    pub(super) fn begins_a_name(&self, word: &str) -> bool {
        self.firsts.contains(word)
    }

    pub(super) fn longest_name(&self) -> usize {
        self.longest
    }

    /// The works in which one of this name, folded, stands first.
    pub(super) fn named(&self, name: &str) -> &[usize] {
        self.by_name.get(name).map_or(&[], Vec::as_slice)
    }

    /// Whether a word, folded, is a given name of one who stands first in
    /// one of these works.
    pub(super) fn is_given(&self, works: &[usize], word: &str) -> bool {
        works.iter().filter_map(|&i| self.works.get(i)).any(|work| work.given.iter().any(|given| given == word))
    }

    /// Whether one so named has a work of one of these years.
    pub(super) fn has(&self, name: &str, years: &[i32]) -> bool {
        self.named(name).iter().any(|&i| self.works[i].year_away(years) == Some(0))
    }

    /// How many of the words that follow a name are the title of a work, or
    /// a short form of it: "Best of the Achaeans", and "Singer" for "The
    /// Singer of Tales" where nothing but the word stands there. None,
    /// where they are not.
    pub(super) fn title_run(&self, work: usize, following: &[Said]) -> usize {
        let Some(work) = self.works.get(work) else { return 0 };
        let mut most = 0;
        for title in &work.titles {
            // An article may stand before what is said of the title.
            let skip = match following.first() {
                Some(first) if !first.ends && without_article(&format!("{} x", first.word)) == "x" => 1,
                _ => 0,
            };
            for begin in [0, skip] {
                let (mut at, mut next, mut telling) = (begin, 0, 0);
                while at < following.len() {
                    let Some(found) = title[next..].iter().position(|w| *w == following[at].word) else { break };
                    next += found + 1;
                    telling += usize::from(tells(&following[at].word));
                    at += 1;
                    if following[at - 1].ends {
                        break;
                    }
                }
                let run = at - begin;
                if run == 0 {
                    continue;
                }
                let whole = run == title.len() && next == title.len();
                let alone = at == following.len() || following[at - 1].ends;
                let is_title = whole || (telling > 0 && (run >= 2 || alone));
                if is_title && at > most {
                    most = at;
                }
            }
        }
        most
    }

    /// The references for words that name a work: by the names and the
    /// year, or by the names and the title. Nothing is certain.
    pub(super) fn by_words(&self, said: &Words) -> Vec<Suggestion> {
        let mut near: Vec<usize> = Vec::new();
        for name in said.names {
            for &i in self.named(name) {
                if !near.contains(&i) {
                    near.push(i);
                }
            }
        }
        // A work is cited by the one who stands first in it: where the
        // first name is the first of some works, it is one of those.
        if near.iter().any(|&i| self.works[i].named(said.names).1) {
            near.retain(|&i| self.works[i].named(said.names).1);
        }
        // (the work, how sure, the order among those as sure, why)
        let mut found: Vec<(usize, Sure, (usize, usize, usize, i32), String)> = Vec::new();
        for i in near {
            let work = &self.works[i];
            let (agree, first) = work.named(said.names);
            let all = agree == said.names.len();
            let as_many = work.names.len() == said.names.len();
            let away = work.year_away(said.years);
            let titled = said.titled.iter().find(|(w, _)| *w == i).map_or(0, |(_, run)| *run);
            let names = usize::from(all) * 2 + usize::from(first) * 2 + usize::from(as_many);
            let (sure, why) = if away == Some(0) {
                let year = said.years.iter().find(|y| work.years.contains(y)).copied().unwrap_or_default();
                (Sure::Likely, format!("{}, {year}", work.people))
            } else if titled > 0 {
                (Sure::Likely, format!("{}, {}", work.people, work.title))
            } else if said.years.is_empty() {
                (Sure::Possible, work.people.clone())
            } else {
                (Sure::Possible, format!("{}, another year", work.people))
            };
            // The year that is said first is that of what is cited; the
            // other is the year the work first came out.
            let main = said.years.first().is_some_and(|year| work.years.first() == Some(year));
            found.push((i, sure, (names, titled, usize::from(main), -away.unwrap_or(0)), why));
        }
        if found.is_empty()
            && let Some(name) = said.names.first()
        {
            // The year, and a name that is written a little otherwise, or
            // is that of one who stands behind the first.
            for year in said.years {
                for &i in self.by_year.get(year).map_or(&[][..], Vec::as_slice) {
                    let work = &self.works[i];
                    let behind = work.behind.iter().any(|forms| forms.contains(name));
                    let alike = work
                        .names
                        .iter()
                        .flatten()
                        .map(|form| strsim::normalized_levenshtein(form, name))
                        .fold(0.0, f64::max);
                    // One letter of four may be another: "Nagi".
                    if !(behind || alike >= 0.75) || found.iter().any(|(w, ..)| *w == i) {
                        continue;
                    }
                    let why = if behind {
                        format!("{year}, and the name is of one who stands behind {}", work.people)
                    } else {
                        format!("{year}, and a name like {}", work.people)
                    };
                    found.push((i, Sure::Possible, (usize::from(behind), 0, (alike * 100.0) as usize, 0), why));
                }
            }
        }
        // Where a work has the name and the year, the other works of the
        // author are not what is meant.
        if found.iter().any(|(_, sure, ..)| *sure == Sure::Likely) {
            found.retain(|(_, sure, ..)| *sure == Sure::Likely);
        }
        found.sort_by(|a, b| b.1.cmp(&a.1).then(b.2.cmp(&a.2)).then(a.0.cmp(&b.0)));
        found.truncate(MOST);
        found.into_iter().map(|(i, sure, _, why)| Suggestion { reference: self.ids[i].clone(), sure, why }).collect()
    }

    /// The references that are like what is said of a work, where they are
    /// not the same by what duplicates are told by: two of author, year and
    /// title, or the title where nothing else is said.
    fn loosely(&self, entry: &Entry) -> Vec<(usize, Sure, String)> {
        let names: Vec<String> = entry.creators().iter().filter_map(|p| forms_of(p).into_iter().next()).collect();
        let years: Vec<i32> = entry.year().into_iter().collect();
        let titles: Vec<Vec<String>> = [entry.get("title").map(plain).unwrap_or_default(), entry.title_plain()]
            .iter()
            .map(|t| words_of(t))
            .collect();
        let said: Vec<String> = titles.iter().filter(|t| !t.is_empty()).map(|t| t.join(" ")).collect();

        let mut near: Vec<usize> = Vec::new();
        let lists = names
            .iter()
            .filter_map(|name| self.by_name.get(name))
            .chain(titles.iter().flatten().filter(|w| tells(w)).filter_map(|word| self.by_title_word.get(word)));
        for list in lists {
            for &i in list {
                if !near.contains(&i) {
                    near.push(i);
                }
            }
        }

        let mut found: Vec<(usize, (usize, usize), String)> = Vec::new();
        for i in near {
            let work = &self.works[i];
            let author = work.named(&names).0 > 0;
            let year = work.year_away(&years) == Some(0);
            let alike = work
                .titles
                .iter()
                .map(|t| t.join(" "))
                .flat_map(|mine| said.iter().map(move |theirs| strsim::normalized_levenshtein(&mine, theirs)))
                .fold(0.0, f64::max);
            let title = alike >= 0.6;
            let agree = usize::from(author) + usize::from(year) + usize::from(title);
            let only_title = names.is_empty() && years.is_empty() && alike >= 0.8;
            if agree < 2 && !only_title {
                continue;
            }
            let mut same: Vec<&str> = Vec::new();
            if author {
                same.push("author");
            }
            if year {
                same.push("year");
            }
            if alike >= 0.95 {
                same.push("title");
            }
            let mut why = match same.len() {
                0 => String::new(),
                1 => format!("the same {}", same[0]),
                2 => format!("the same {} and {}", same[0], same[1]),
                _ => format!("the same {}, {} and {}", same[0], same[1], same[2]),
            };
            if title && alike < 0.95 {
                why.push_str(if why.is_empty() { "a title like it" } else { ", and a title like it" });
            }
            found.push((i, (agree, (alike * 1000.0) as usize), why));
        }
        found.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
        found.into_iter().map(|(i, _, why)| (i, Sure::Possible, why)).collect()
    }
}

/// What tells one state of a library from another.
fn stamp(library: &Library) -> u64 {
    let mut hasher = DefaultHasher::new();
    library.dir().hash(&mut hasher);
    for entry in library.entries() {
        entry.id.hash(&mut hasher);
        entry.key.hash(&mut hasher);
        entry.entry_type.hash(&mut hasher);
        entry.fields.hash(&mut hasher);
        entry.zotero.hash(&mut hasher);
    }
    hasher.finish()
}

/// What the library has, laid out. It is laid out anew when the library is
/// another than the last time, or has been changed.
pub(super) fn shelf(library: &Library) -> Arc<Shelf> {
    static KEPT: Mutex<Option<(u64, Arc<Shelf>)>> = Mutex::new(None);
    let stamp = stamp(library);
    let mut kept = KEPT.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    if let Some((of, shelf)) = kept.as_ref()
        && *of == stamp
    {
        return shelf.clone();
    }
    let shelf = Arc::new(Shelf::new(library));
    *kept = Some((stamp, shelf.clone()));
    shelf
}

/// What has been found for one work, from what is most certain to what is
/// least.
#[derive(Default)]
struct Gathered {
    found: Vec<(usize, Sure, String)>,
    certain: Option<usize>,
}

impl Gathered {
    /// What was found by one means. Where the means calls several certain,
    /// it cannot tell which of them it is, and none is: the library has the
    /// work more than once, and the writer says which is meant.
    fn add(&mut self, hits: Vec<(usize, Sure, String)>) {
        let mut certain: Vec<usize> = hits.iter().filter(|(_, sure, _)| *sure == Sure::Certain).map(|h| h.0).collect();
        certain.sort_unstable();
        certain.dedup();
        for (work, sure, why) in hits {
            let alone = certain.len() == 1 && self.certain.is_none_or(|known| known == work);
            let sure = if sure == Sure::Certain && !alone { Sure::Likely } else { sure };
            if sure == Sure::Certain {
                self.certain = Some(work);
            }
            match self.found.iter_mut().find(|(known, ..)| *known == work) {
                Some(known) if sure > known.1 => *known = (work, sure, why),
                Some(_) => {}
                None => self.found.push((work, sure, why)),
            }
        }
    }
}

fn why_of(certainty: Certainty, reasons: &[Reason]) -> String {
    let has = |reason: Reason| reasons.contains(&reason);
    match certainty {
        Certainty::Certain if has(Reason::Doi) => "the same DOI".into(),
        Certainty::Certain if has(Reason::Isbn) => "the same ISBN".into(),
        Certainty::Certain => "alike in all that tells one work from another".into(),
        // The DOI or the ISBN of the book that both are in.
        Certainty::Probable if has(Reason::Doi) && !has(Reason::TitleAuthorYear) => {
            "the same DOI, and another title".into()
        }
        Certainty::Probable if has(Reason::Isbn) && !has(Reason::TitleAuthorYear) => {
            "the same ISBN, and another title".into()
        }
        Certainty::Probable => "the same title, author and year".into(),
    }
}

pub(super) fn suggest(library: &Library, item: &FoundItem) -> Vec<Suggestion> {
    let shelf = shelf(library);
    if shelf.is_empty() {
        return Vec::new();
    }
    let mut gathered = Gathered::default();

    // The key of the item in Zotero.
    let mut same: Vec<usize> = Vec::new();
    for key in item.uris.iter().filter_map(|uri| zotero_key(uri)) {
        for &i in shelf.by_zotero.get(&key).map_or(&[][..], Vec::as_slice) {
            if !same.contains(&i) {
                same.push(i);
            }
        }
    }
    gathered.add(same.into_iter().map(|i| (i, Sure::Certain, "the same item in Zotero".to_owned())).collect());

    // The tag: the citation key of an entry, or one it had, or one that an
    // entry had that was merged into it.
    let tag = item.key.as_deref().map(|key| key.trim().trim_start_matches('@')).filter(|key| !key.is_empty());
    if let Some(tag) = tag
        && let Some(entry) = library.by_key(tag).or_else(|| library.resolve(tag))
        && let Some(i) = shelf.ids.iter().position(|id| *id == entry.id)
    {
        let why = if entry.key.to_lowercase() == tag.to_lowercase() {
            "the same citation key"
        } else {
            "a citation key it had before"
        };
        gathered.add(vec![(i, Sure::Certain, why.to_owned())]);
    }

    // What the file says of the work.
    if let Some(said) = item.data.as_ref().and_then(csl::convert) {
        let entry = said.draft.to_entry();
        let hits = shelf.prints.find(&duplicates::fingerprint(&entry), None);
        gathered.add(
            hits.into_iter()
                .map(|hit| {
                    let sure = match hit.certainty {
                        Certainty::Certain => Sure::Certain,
                        Certainty::Probable => Sure::Likely,
                    };
                    (hit.index, sure, why_of(hit.certainty, &hit.reasons))
                })
                .collect(),
        );
        gathered.add(shelf.loosely(&entry));
    }

    let mut found = gathered.found;
    // The order within those that are as sure is that of what is most certain.
    found.sort_by(|a, b| b.1.cmp(&a.1));
    found.truncate(MOST);
    found.into_iter().map(|(i, sure, why)| Suggestion { reference: shelf.ids[i].clone(), sure, why }).collect()
}

pub(super) fn draft(data: &Value) -> Option<Draft> {
    let draft = csl::convert(data)?.draft;
    let titled = draft.get("title").is_some();
    let by_someone = draft.names.get("author").is_some_and(|people| !people.is_empty());
    (titled || by_someone).then_some(draft)
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::library::draft_from_source;

    /// A small library, such as a classicist may have.
    fn library() -> (tempfile::TempDir, Library) {
        let tmp = tempfile::tempdir().unwrap();
        let mut library = Library::open_at(&tmp.path().join("library")).unwrap();
        for source in [
            "@book{nagy1979, author={Nagy, Gregory}, title={The Best of the Achaeans}, subtitle={Concepts of the Hero in Archaic Greek Poetry}, date={1979}, isbn={0801823889}, glaukopis-zotero={ABCD2345}}",
            "@book{nagy1990, author={Nagy, Gregory}, title={Pindar's Homer}, subtitle={The Lyric Possession of an Epic Past}, date={1990}}",
            "@book{lord1960, author={Lord, Albert B.}, title={The Singer of Tales}, date={1960}, ids={Lord:1960}}",
            "@article{west1988, author={West, M. L.}, title={The Rise of the Greek Epic}, journaltitle={JHS}, volume={108}, date={1988}, pages={151--172}, doi={10.2307/632637}}",
            "@incollection{nagy1997, author={Nagy, Gregory}, editor={Morris, Ian and Powell, Barry}, title={Homeric Scholia}, booktitle={A New Companion to Homer}, date={1997}, glaukopis-zotero={WXYZ6789}}",
        ] {
            library.add(&draft_from_source(source).unwrap()).unwrap();
        }
        (tmp, library)
    }

    fn keys(library: &Library, found: &[Suggestion]) -> Vec<(String, Sure)> {
        found.iter().map(|s| (library.get(&s.reference).unwrap().key.clone(), s.sure)).collect()
    }

    fn one(library: &Library, item: &FoundItem) -> (String, Sure, String) {
        let found = suggest(library, item);
        assert!(!found.is_empty(), "nothing was found for {item:?}");
        (library.get(&found[0].reference).unwrap().key.clone(), found[0].sure, found[0].why.clone())
    }

    #[test]
    fn the_same_item_in_zotero_is_certain() {
        let (_tmp, library) = library();
        let item = FoundItem {
            uris: vec!["http://zotero.org/users/123/items/ABCD2345".into()],
            // What the file says of it is of no weight beside the key.
            data: Some(
                json!({"type": "book", "title": "Something the writer changed since", "author": [{"family": "Nagy"}]}),
            ),
            ..Default::default()
        };
        assert_eq!(one(&library, &item), ("nagy1979".into(), Sure::Certain, "the same item in Zotero".into()));
        let certain = suggest(&library, &item).iter().filter(|s| s.sure == Sure::Certain).count();
        assert_eq!(certain, 1);

        let other = FoundItem { uris: vec!["http://zotero.org/users/123/items/NONE0000".into()], ..Default::default() };
        assert!(suggest(&library, &other).is_empty());
    }

    #[test]
    fn the_tag_is_certain_and_so_is_one_the_entry_had_before() {
        let (_tmp, mut library) = library();
        let tagged = |key: &str| FoundItem { key: Some(key.into()), ..Default::default() };
        assert_eq!(
            one(&library, &tagged("nagy1979")),
            ("nagy1979".into(), Sure::Certain, "the same citation key".into())
        );
        assert_eq!(one(&library, &tagged("Nagy1979")).1, Sure::Certain);
        assert_eq!(
            one(&library, &tagged("Lord:1960")),
            ("lord1960".into(), Sure::Certain, "a citation key it had before".into())
        );
        assert!(suggest(&library, &tagged("nobody2000")).is_empty());

        // The key of an entry that was merged into another.
        let kept = library.by_key("nagy1990").unwrap().clone();
        let gone = library
            .add(&draft_from_source("@book{pindar, author={Nagy, G.}, title={Pindar's Homer}, date={1990}}").unwrap())
            .unwrap();
        library.merge(&kept.id, &gone.id, &Draft::from_entry(&kept)).unwrap();
        assert_eq!(one(&library, &tagged("pindar")).0, "nagy1990");
        // And its id, which a text may hold.
        assert_eq!(one(&library, &tagged(&gone.id)).0, "nagy1990");
    }

    #[test]
    fn what_the_file_says_of_the_work_finds_it_as_duplicates_are_found() {
        let (_tmp, library) = library();
        let said = |data: Value| FoundItem { data: Some(data), ..Default::default() };

        let by_doi = said(
            json!({"type": "article-journal", "title": "The rise of the Greek epic", "DOI": "https://doi.org/10.2307/632637"}),
        );
        assert_eq!(one(&library, &by_doi), ("west1988".into(), Sure::Certain, "the same DOI".into()));

        let by_isbn = said(json!({
            "type": "book", "title": "The Best of the Achaeans", "ISBN": "978-0-8018-2388-6",
            "author": [{"family": "Nagy", "given": "Gregory"}], "issued": {"date-parts": [["1999"]]}
        }));
        assert_eq!(one(&library, &by_isbn), ("nagy1979".into(), Sure::Certain, "the same ISBN".into()));

        let alike = said(json!({
            "type": "book", "title": "The Singer of Tales",
            "author": [{"family": "Lord", "given": "Albert B."}], "issued": {"date-parts": [[1960]]}
        }));
        assert_eq!(
            one(&library, &alike),
            ("lord1960".into(), Sure::Certain, "alike in all that tells one work from another".into())
        );

        // As Mendeley says it: no key that the library knows, and the year a little off.
        let likely = said(json!({
            "type": "book", "title": "The singer of tales",
            "author": [{"family": "Lord", "given": "A."}], "issued": {"date-parts": [[1961]]}
        }));
        assert_eq!(one(&library, &likely), ("lord1960".into(), Sure::Likely, "the same title, author and year".into()));
    }

    #[test]
    fn what_is_only_like_it_is_possible() {
        let (_tmp, library) = library();
        let said = |data: Value| FoundItem { data: Some(data), ..Default::default() };

        // The author and the year, and another title.
        let item = said(json!({
            "type": "book", "title": "Homer and Pindar", "author": [{"family": "Nagy"}], "issued": {"date-parts": [[1990]]}
        }));
        assert_eq!(one(&library, &item), ("nagy1990".into(), Sure::Possible, "the same author and year".into()));

        // The author, and a title like it; the year is another.
        let item = said(json!({
            "type": "chapter", "title": "The Homeric Scholia", "author": [{"family": "Nagy"}],
            "container-title": "Companion", "issued": {"date-parts": [[2011]]}
        }));
        let found = suggest(&library, &item);
        assert_eq!(keys(&library, &found), vec![("nagy1997".into(), Sure::Possible)]);
        assert_eq!(found[0].why, "the same author and title");

        // The author alone is nothing.
        let item = said(json!({
            "type": "book", "title": "Greek Mythology and Poetics", "author": [{"family": "Nagy"}],
            "issued": {"date-parts": [[1992]]}
        }));
        assert!(suggest(&library, &item).is_empty());
    }

    #[test]
    fn where_the_library_has_the_work_twice_none_is_certain() {
        let (_tmp, mut library) = library();
        let twice = draft_from_source(
            "@article{west1988b, author={West, Martin}, title={The Rise of the Greek Epic}, date={1988}, doi={10.2307/632637}}",
        )
        .unwrap();
        library.insert(&twice, false).unwrap();
        let item = FoundItem {
            data: Some(
                json!({"type": "article-journal", "title": "The Rise of the Greek Epic", "DOI": "10.2307/632637"}),
            ),
            ..Default::default()
        };
        let found = suggest(&library, &item);
        assert_eq!(keys(&library, &found), vec![("west1988".into(), Sure::Likely), ("west1988b".into(), Sure::Likely)]);

        // The tag says which of them is meant.
        let item = FoundItem { key: Some("west1988b".into()), ..item };
        let found = suggest(&library, &item);
        assert_eq!(
            keys(&library, &found),
            vec![("west1988b".into(), Sure::Certain), ("west1988".into(), Sure::Likely)]
        );
    }

    #[test]
    fn a_library_that_is_changed_is_laid_out_anew() {
        let (_tmp, mut library) = library();
        let item = FoundItem { key: Some("parry1971".into()), ..Default::default() };
        assert!(suggest(&library, &item).is_empty());
        library
            .add(
                &draft_from_source(
                    "@book{parry1971, author={Parry, Milman}, title={The Making of Homeric Verse}, date={1971}}",
                )
                .unwrap(),
            )
            .unwrap();
        assert_eq!(one(&library, &item).0, "parry1971");
        let said = FoundItem {
            data: Some(
                json!({"type": "book", "title": "The Making of Homeric Verse", "author": [{"family": "Parry"}], "issued": {"date-parts": [[1971]]}}),
            ),
            ..Default::default()
        };
        assert_eq!(one(&library, &said).0, "parry1971");
    }

    #[test]
    fn what_a_file_says_of_a_work_can_be_added_to_the_library() {
        let made = draft(&json!({
            "id": "http://zotero.org/users/123/items/QRST2345",
            "type": "book", "title": "The Making of Homeric Verse",
            "author": [{"family": "Parry", "given": "Milman"}],
            "publisher": "Clarendon Press", "publisher-place": "Oxford",
            "issued": {"date-parts": [["1971"]]}
        }))
        .unwrap();
        assert_eq!(made.entry_type, "book");
        assert_eq!(made.get("title"), Some("The Making of Homeric Verse"));
        assert_eq!(made.get("date"), Some("1971"));
        assert_eq!(made.names["author"][0].family, "Parry");

        // A title alone, or an author alone, is something; less is nothing.
        assert!(draft(&json!({"type": "book", "title": "Anonymous Verses"})).is_some());
        assert!(draft(&json!({"type": "book", "author": [{"family": "Parry"}]})).is_some());
        assert!(draft(&json!({"type": "book", "editor": [{"family": "Parry"}]})).is_none());
        assert!(draft(&json!({"type": "book", "publisher": "Clarendon Press"})).is_none());
        assert!(draft(&json!("Parry 1971")).is_none());
    }

    #[test]
    fn the_title_that_follows_a_name() {
        let (_tmp, library) = library();
        let shelf = shelf(&library);
        let said = |words: &[(&str, bool)]| -> Vec<Said> {
            words.iter().map(|(word, ends)| Said { word: (*word).to_owned(), ends: *ends }).collect()
        };
        let nagy1979 = shelf.named("nagy")[0];
        let lord = shelf.named("lord")[0];
        assert_eq!(
            shelf.title_run(
                nagy1979,
                &said(&[("best", false), ("of", false), ("the", false), ("achaeans", true), ("73", true)])
            ),
            4
        );
        assert_eq!(
            shelf.title_run(
                nagy1979,
                &said(&[("the", false), ("best", false), ("of", false), ("the", false), ("achaeans", true)])
            ),
            5
        );
        // A short form of one word, where nothing else stands there.
        assert_eq!(shelf.title_run(lord, &said(&[("singer", true), ("12", true)])), 1);
        assert_eq!(
            shelf.title_run(lord, &said(&[("singer", false), ("from", false), ("novi", false), ("pazar", true)])),
            0
        );
        assert_eq!(shelf.title_run(lord, &said(&[("of", false), ("the", false), ("guslar", true)])), 0);
        assert_eq!(shelf.title_run(lord, &said(&[("was", false), ("born", false)])), 0);
    }
}
