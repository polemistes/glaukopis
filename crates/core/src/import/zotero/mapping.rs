//! From an item of Zotero to an entry of BibLaTeX.
//!
//! The choices follow Zotero's own export to BibLaTeX and that of Better
//! BibTeX, which between them are what users of Zotero and LaTeX know. Where
//! the two differ, the one is followed whose result this application shows
//! in its form for the type.

use std::collections::{BTreeMap, HashSet};

use crate::bib::is_name_field;
use crate::bib::names::{Person, parse_list};
use crate::bib::parser::normalise_space;
use crate::library::entry::{Draft, FIELD_ZOTERO};

use super::database::{Creator, Item};
use super::dates::{self, Date};
use super::extra::{Eprint, Extra, archive_kind, arxiv};
use super::{markup, text};

/// The type of BibLaTeX for a type of Zotero.
fn type_for(kind: &str) -> &'static str {
    match kind {
        "artwork" => "artwork",
        "audioRecording" | "podcast" | "radioBroadcast" => "audio",
        "bill" | "statute" => "legislation",
        "blogPost" | "forumPost" | "preprint" | "webpage" => "online",
        "book" => "book",
        "bookSection" => "incollection",
        "case" | "hearing" => "jurisdiction",
        "computerProgram" => "software",
        "conferencePaper" => "inproceedings",
        "dataset" => "dataset",
        "dictionaryEntry" | "encyclopediaArticle" => "inreference",
        "email" | "letter" => "letter",
        "film" => "movie",
        "journalArticle" | "magazineArticle" | "newspaperArticle" => "article",
        "manuscript" | "presentation" => "unpublished",
        "patent" => "patent",
        "report" => "report",
        "standard" => "standard",
        "thesis" => "thesis",
        "tvBroadcast" | "videoRecording" => "video",
        _ => "misc",
    }
}

/// The fields of one item. It is remembered which of them have been asked
/// for, so that those no one asked for can be told to the user.
struct Fields<'a> {
    values: &'a BTreeMap<String, String>,
    taken: HashSet<&'a str>,
}

impl<'a> Fields<'a> {
    fn new(values: &'a BTreeMap<String, String>) -> Self {
        Fields { values, taken: HashSet::new() }
    }

    fn peek(&self, name: &str) -> Option<&'a str> {
        self.values.get(name).map(|v| v.trim()).filter(|v| !v.is_empty())
    }

    /// The first of the fields named that has a value. Zotero has many
    /// names for one thing: the "university" of a thesis is the
    /// "institution" of a report and the "studio" of a film. An item has
    /// one of them, and all count as dealt with.
    fn take(&mut self, names: &[&str]) -> Option<&'a str> {
        let mut found = None;
        for name in names {
            if let Some((name, _)) = self.values.get_key_value(*name) {
                // What was taken once is not given out again.
                if self.taken.insert(name.as_str()) {
                    found = found.or_else(|| self.peek(name));
                }
            }
        }
        found
    }

    /// What has a value and was not asked for.
    fn left(&self) -> impl Iterator<Item = (&'a str, &'a str)> + '_ {
        self.values
            .iter()
            .filter(|(name, value)| !self.taken.contains(name.as_str()) && !value.trim().is_empty())
            .map(|(name, value)| (name.as_str(), value.as_str()))
    }
}

/// Sets a field that has no value yet. What is set first stays.
fn set(draft: &mut Draft, name: &str, value: impl Into<String>) {
    let value: String = value.into();
    let value = value.trim();
    if !value.is_empty() && !draft.fields.contains_key(name) {
        draft.fields.insert(name.to_owned(), value.to_owned());
    }
}

/// Keeps count of quotation marks that are open. The same mark opens in
/// one language and closes in another.
fn quotation(open: &mut Vec<char>, mark: char) {
    let closes = matches!(
        (open.last(), mark),
        (Some('“'), '”')
            | (Some('„'), '“' | '”')
            | (Some('”'), '”')
            | (Some('«'), '»')
            | (Some('»'), '«')
            | (Some('‹'), '›')
            | (Some('›'), '‹')
    );
    if closes {
        open.pop();
    } else {
        open.push(mark);
    }
}

/// Title and subtitle, where there is no doubt: the title has one colon
/// followed by a space that stands outside quotation marks, brackets and
/// braces. With two such colons there is no telling which divides.
fn subtitle(title: &str) -> Option<(String, String)> {
    let mut braces = 0i32;
    let mut brackets = 0i32;
    let mut straight = false;
    let mut quotes: Vec<char> = Vec::new();
    let mut found: Option<usize> = None;
    let mut chars = title.char_indices().peekable();
    while let Some((i, c)) = chars.next() {
        match c {
            '{' => braces += 1,
            '}' => braces -= 1,
            '(' | '[' => brackets += 1,
            ')' | ']' => brackets -= 1,
            '"' => straight = !straight,
            '“' | '”' | '„' | '«' | '»' | '‹' | '›' => quotation(&mut quotes, c),
            ':' if chars.peek().is_some_and(|(_, next)| next.is_whitespace())
                && braces == 0
                && brackets == 0
                && !straight
                && quotes.is_empty() =>
            {
                if found.is_some() {
                    return None;
                }
                found = Some(i);
            }
            _ => {}
        }
    }
    let at = found?;
    let (main, sub) = (title[..at].trim(), title[at + 1..].trim());
    (main.chars().count() > 1 && sub.chars().count() > 1).then(|| (main.to_owned(), sub.to_owned()))
}

/// "Jr." and its like, which BibLaTeX keeps apart from the name.
fn is_suffix(word: &str) -> bool {
    matches!(word.trim_end_matches('.').to_lowercase().as_str(), "jr" | "sr" | "jun" | "sen" | "ii" | "iii" | "iv")
}

/// Splits "Martin Luther, Jr." at its comma.
fn without_suffix(name: &str) -> (String, Option<String>) {
    match name.rsplit_once(',') {
        Some((before, after)) if is_suffix(after.trim()) && !before.trim().is_empty() => {
            (before.trim().to_owned(), Some(after.trim().to_owned()))
        }
        _ => (name.to_owned(), None),
    }
}

fn person(creator: &Creator) -> Option<Person> {
    let (first, last) = (normalise_space(&creator.first), normalise_space(&creator.last));
    if first.is_empty() || last.is_empty() || creator.single {
        let name = [first, last].into_iter().filter(|n| !n.is_empty()).collect::<Vec<_>>().join(" ");
        if name.is_empty() {
            return None;
        }
        // One name of one word is a person known by that name: Homer. More
        // words in one piece are an institution, or a name that must not be
        // turned around: Thomas Aquinas.
        return Some(if !creator.single && !name.contains(' ') {
            Person::new(name, "")
        } else {
            Person::literal(name)
        });
    }
    let (family, suffix) = without_suffix(&last);
    let (mut given, other_suffix) = without_suffix(&first);
    // A comma left in the given name would be read as the end of it.
    if given.contains(',') {
        given = format!("{{{given}}}");
    }
    Some(Person { family, given, suffix: suffix.or(other_suffix).unwrap_or_default(), ..Default::default() })
}

/// The number in an archive of preprints, from wherever Zotero has it.
fn eprint(fields: &mut Fields, extra: &Extra, kind: &str) -> Option<Eprint> {
    let mut found = None;
    // "Archive" and "Loc. in Archive", when the archive is one of preprints.
    if let (Some(archive), Some(id)) = (fields.peek("archive").and_then(archive_kind), fields.peek("archiveLocation")) {
        fields.take(&["archive", "archiveLocation"]);
        // For arXiv the call number is, by custom, the subject class.
        let class = if archive == "arxiv" { fields.take(&["callNumber"]).map(str::to_owned) } else { None };
        found = Some(Eprint { kind: archive.into(), id: id.to_owned(), class });
    }
    // The number of a preprint in its repository.
    if let (None, Some(id)) = (&found, fields.peek("archiveID")) {
        let named = id.get(..6).is_some_and(|start| start.eq_ignore_ascii_case("arxiv:"));
        let repository = fields.peek("repository");
        if named || repository.and_then(archive_kind) == Some("arxiv") {
            found = arxiv(id);
        } else if let Some(repository) = repository {
            let kind = archive_kind(repository).map(str::to_owned).unwrap_or_else(|| text::line(repository));
            found = Some(Eprint { kind, id: id.to_owned(), class: None });
        }
        if found.is_some() {
            fields.take(&["archiveID"]);
        }
    }
    // The number in PubMed, for which Zotero has a field of late.
    if found.is_none() {
        found = fields.take(&["PMID"]).map(|id| Eprint { kind: "pubmed".into(), id: id.to_owned(), class: None });
    }
    if found.is_none() {
        found = extra.eprint.clone();
    }
    if found.is_none() && kind == "preprint" {
        let doi = fields.peek("DOI").map(text::doi).unwrap_or_default();
        let url = fields.peek("url").unwrap_or_default();
        let id = match doi.get(..15) {
            Some(start) if start.eq_ignore_ascii_case("10.48550/arxiv.") => Some(&doi[15..]),
            _ => url.split_once("arxiv.org/abs/").map(|(_, id)| id.split(['?', '#']).next().unwrap_or(id)),
        };
        found = id.and_then(arxiv);
    }
    // The repository has then been named.
    if let Some(found) = &found {
        let same = fields
            .peek("repository")
            .is_some_and(|r| archive_kind(r) == Some(found.kind.as_str()) || text::line(r) == found.kind);
        if same {
            fields.take(&["repository"]);
        }
    }
    found
}

const IN_A_BOOK: [&str; 6] = ["incollection", "inbook", "inproceedings", "inreference", "suppbook", "bookinbook"];

/// The type of the entry, from the type of the item and what the item has.
fn entry_type(item: &Item, fields: &Fields, extra: &Extra, eprint: Option<&Eprint>) -> String {
    if let Some(named) = &extra.entry_type {
        return named.clone();
    }
    let has = |role: &str| item.creators.iter().any(|c| c.role == role);
    // A work in several volumes, when it is the whole of it and not one volume.
    let whole = fields.peek("volume").is_none()
        && fields.peek("numberOfVolumes").and_then(|n| n.parse::<u32>().ok()).is_some_and(|n| n > 1);
    let edited = !has("author") && has("editor");
    match item.kind.as_str() {
        "book" => match (edited, whole) {
            (false, false) => "book",
            (false, true) => "mvbook",
            (true, false) => "collection",
            (true, true) => "mvcollection",
        },
        // A part of a book by one author, who is named as the author of the book.
        "bookSection" if has("bookAuthor") => "inbook",
        "journalArticle" | "magazineArticle" | "newspaperArticle" if has("reviewedAuthor") => "review",
        // A preprint on arXiv is cited as an article with its number there.
        "preprint" if eprint.is_some_and(|e| e.kind == "arxiv") => "article",
        kind => type_for(kind),
    }
    .to_owned()
}

/// The creators of an item as the names of an entry. What BibLaTeX has no
/// place for is told in `notes`. Names the entry has already are left alone.
fn names(item: &Item, draft: &mut Draft, notes: &mut Vec<String>) {
    let mut found: BTreeMap<&str, Vec<Person>> = BTreeMap::new();
    let has_author = item.creators.iter().any(|c| c.role == "author");
    let mut series: Vec<Person> = Vec::new();
    let mut others: Vec<Person> = Vec::new();
    for creator in &item.creators {
        let Some(person) = person(creator) else { continue };
        let field = match creator.role.as_str() {
            "author" => "author",
            "editor" => "editor",
            "translator" => "translator",
            "bookAuthor" => "bookauthor",
            "commenter" => "commentator",
            // Who stands first for works of a kind that has no author.
            "artist" | "cartographer" | "creator" | "director" | "interviewee" | "inventor" | "performer"
            | "podcaster" | "presenter" | "programmer" | "sponsor"
                if !has_author =>
            {
                "author"
            }
            "seriesEditor" => {
                series.push(person);
                continue;
            }
            // Those a work is written to or about have no part in making it.
            role @ ("recipient" | "reviewedAuthor") => {
                notes.push(format!(
                    "Zotero names {} as {}, which BibLaTeX has no field for. The name was left out.",
                    person.display(),
                    text::label(role)
                ));
                continue;
            }
            _ => {
                others.push(person);
                continue;
            }
        };
        found.entry(field).or_default().push(person);
    }
    for (field, people) in found {
        draft.names.entry(field.to_owned()).or_insert(people);
    }
    // BibLaTeX has further editors, each kind with its role. The editors of
    // the series come first; all others are those who worked along.
    let further = [(series, "redactor"), (others, "collaborator")];
    for ((people, role), field) in further.into_iter().filter(|(p, _)| !p.is_empty()).zip(["editora", "editorb"]) {
        if !draft.names.contains_key(field) {
            draft.names.insert(field.to_owned(), people);
            set(draft, &format!("{field}type"), role);
        }
    }
}

/// Makes the entry for an item. The second value holds what the user
/// should know about it.
pub(super) fn entry(item: &Item) -> (Draft, Vec<String>) {
    let mut notes = Vec::new();
    let mut fields = Fields::new(&item.fields);
    let extra = Extra::read(fields.take(&["extra"]).unwrap_or_default());
    let kind = item.kind.as_str();

    let eprint = eprint(&mut fields, &extra, kind);
    let mut draft = Draft { entry_type: entry_type(item, &fields, &extra, eprint.as_ref()), ..Default::default() };
    let entry_type = draft.entry_type.clone();
    let entry_type = entry_type.as_str();

    // What Better BibTeX was told to write comes before all else.
    for (name, value) in &extra.forced {
        if is_name_field(name) {
            draft.names.insert(name.clone(), parse_list(value));
        } else {
            set(&mut draft, name, value);
        }
    }

    if let Some(key) = fields.take(&["citationKey"]).and_then(crate::library::keys::sanitise_key).or(extra.key.clone())
    {
        draft.key = key;
    }

    // Titles.
    if let Some(title) = fields.take(&["title", "caseName", "nameOfAct", "subject"]) {
        let title = text::line(&markup::rich_text(title));
        // What is written to someone has a subject, not a subtitle.
        let formal = !matches!(kind, "email" | "instantMessage" | "forumPost");
        match subtitle(&title).filter(|_| formal && !draft.fields.contains_key("title")) {
            Some((main, sub)) => {
                set(&mut draft, "title", main);
                set(&mut draft, "subtitle", sub);
            }
            None => set(&mut draft, "title", title),
        }
    }
    set(&mut draft, "shorttitle", text::line(&markup::rich_text(fields.take(&["shortTitle"]).unwrap_or_default())));

    // What the work is in.
    // Decisions of courts are found in the reports of them, as articles are in journals.
    if let Some(journal) = fields.take(&["publicationTitle", "reporter"]) {
        let field = if IN_A_BOOK.contains(&entry_type) { "booktitle" } else { "journaltitle" };
        set(&mut draft, field, text::line(&markup::rich_text(journal)));
    }
    if let Some(book) = fields.take(&["bookTitle", "proceedingsTitle", "encyclopediaTitle", "dictionaryTitle"]) {
        set(&mut draft, "booktitle", text::line(&markup::rich_text(book)));
    }
    // The site a page is on is what stands behind it, as far as can be known.
    if let Some(site) = fields.take(&["websiteTitle", "blogTitle", "forumTitle"]) {
        set(&mut draft, "organization", text::list(site));
    }
    // The programme a broadcast is part of, or the title of a part of a standard.
    set(&mut draft, "titleaddon", text::line(fields.take(&["programTitle", "partTitle"]).unwrap_or_default()));
    set(&mut draft, "shortjournal", text::line(fields.take(&["journalAbbreviation"]).unwrap_or_default()));
    set(&mut draft, "eventtitle", text::line(fields.take(&["conferenceName", "meetingName"]).unwrap_or_default()));
    set(&mut draft, "eventtitleaddon", text::line(fields.take(&["sessionTitle"]).unwrap_or_default()));
    if let Some(series) = fields.take(&["series"]).or_else(|| fields.take(&["seriesTitle"])) {
        set(&mut draft, "series", text::line(series));
    }

    // Numbers.
    set(&mut draft, "volume", text::line(fields.take(&["volume", "reporterVolume", "codeVolume"]).unwrap_or_default()));
    set(&mut draft, "volumes", text::line(fields.take(&["numberOfVolumes"]).unwrap_or_default()));
    set(&mut draft, "part", text::line(fields.take(&["partNumber"]).unwrap_or_default()));
    set(&mut draft, "edition", text::edition(fields.take(&["edition"]).unwrap_or_default()));
    if let Some(issue) = fields.take(&["issue"]) {
        // To BibLaTeX the issue of a journal is a number. Its `issue` is for
        // those that are named: "Spring".
        let field = if issue.chars().any(|c| c.is_ascii_digit()) { "number" } else { "issue" };
        set(&mut draft, field, text::line(issue));
    }
    let number = fields.take(&[
        "number",
        "reportNumber",
        "patentNumber",
        "billNumber",
        "docketNumber",
        "documentNumber",
        "publicLawNumber",
        "episodeNumber",
        "identifier",
        "seriesNumber",
        "archiveID",
    ]);
    set(&mut draft, "number", text::line(number.unwrap_or_default()));
    set(&mut draft, "pages", text::pages(fields.take(&["pages", "firstPage", "codePages"]).unwrap_or_default()));
    set(&mut draft, "pagetotal", text::line(fields.take(&["numPages"]).unwrap_or_default()));
    set(&mut draft, "version", text::line(fields.take(&["versionNumber"]).unwrap_or_default()));

    // Who published it, and where.
    set(&mut draft, "organization", text::list(fields.take(&["organization"]).unwrap_or_default()));
    set(&mut draft, "institution", text::list(fields.take(&["court"]).unwrap_or_default()));
    let publisher = fields.take(&[
        "publisher",
        "university",
        "institution",
        "label",
        "distributor",
        "studio",
        "network",
        "company",
        "repository",
    ]);
    if let Some(publisher) = publisher {
        let field = match entry_type {
            "thesis" | "report" | "unpublished" => "institution",
            "software" | "online" => "organization",
            _ => "publisher",
        };
        set(&mut draft, field, text::list(publisher));
    }
    // The country of a patent is where it holds.
    if kind == "patent"
        && let Some(country) = fields.take(&["country"])
    {
        set(&mut draft, "location", text::list(country));
    }
    if let Some(place) = fields.take(&["place", "repositoryLocation"]) {
        if draft.fields.contains_key("location") {
            notes.push(left_out("place", place));
        }
        // A talk is given at a place; nothing is published there.
        match kind {
            "presentation" => set(&mut draft, "venue", text::line(place)),
            _ => set(&mut draft, "location", text::list(place)),
        }
    }
    set(&mut draft, "venue", text::line(fields.take(&["eventPlace"]).unwrap_or_default()));
    set(&mut draft, "origpublisher", text::list(fields.take(&["originalPublisher"]).unwrap_or_default()));
    set(&mut draft, "origlocation", text::list(fields.take(&["originalPlace"]).unwrap_or_default()));
    if let Some(holder) = fields.take(&["assignee"]) {
        draft.names.entry("holder".into()).or_insert_with(|| vec![Person::literal(text::line(holder))]);
    }

    // When.
    if let Some(date) = fields.take(&["date", "dateDecided", "dateEnacted", "issueDate"])
        && !draft.fields.contains_key("date")
        && !draft.fields.contains_key("year")
    {
        match dates::read(date) {
            Some(Date::Understood(date)) => set(&mut draft, "date", date),
            Some(Date::Text(words)) => set(&mut draft, "year", words),
            None => {}
        }
    }

    if let Some(date) = fields.take(&["originalDate"]) {
        match dates::read(date) {
            Some(Date::Understood(date)) => set(&mut draft, "origdate", date),
            _ => notes.push(left_out("originalDate", date)),
        }
    }
    set(&mut draft, "pubstate", text::line(fields.take(&["status"]).unwrap_or_default()));

    // Where it is found.
    set(&mut draft, "doi", text::doi(fields.take(&["DOI"]).unwrap_or_default()));
    set(&mut draft, "isbn", normalise_space(fields.take(&["ISBN"]).unwrap_or_default()));
    set(&mut draft, "issn", normalise_space(fields.take(&["ISSN"]).unwrap_or_default()));
    set(&mut draft, "url", fields.take(&["url"]).unwrap_or_default());
    // The day of access says something only of an address.
    let accessed = fields.take(&["accessDate"]).and_then(dates::day);
    if let (Some(day), true) = (accessed, draft.fields.contains_key("url")) {
        set(&mut draft, "urldate", day);
    }
    if let Some(eprint) = eprint
        && !draft.fields.contains_key("eprint")
    {
        set(&mut draft, "eprint", eprint.id);
        set(&mut draft, "eprinttype", eprint.kind);
        set(&mut draft, "eprintclass", eprint.class.unwrap_or_default());
    }
    let held: Vec<String> = ["archive", "archiveLocation", "callNumber"]
        .iter()
        .filter_map(|name| fields.take(&[*name]))
        .map(text::line)
        .collect();
    set(&mut draft, "library", held.join(", "));

    // What kind of thing it is.
    let named = fields.take(&[
        "type",
        "thesisType",
        "reportType",
        "letterType",
        "manuscriptType",
        "mapType",
        "postType",
        "websiteType",
        "presentationType",
        "genre",
    ]);
    match (entry_type, named) {
        ("thesis", Some(named)) => set(&mut draft, "type", text::thesis_type(named)),
        ("unpublished", Some(named)) => set(&mut draft, "howpublished", text::line(named)),
        (_, Some(named)) => set(&mut draft, "type", text::line(named)),
        // Nothing else tells a letter from a message sent by e-mail.
        (_, None) if kind == "email" => set(&mut draft, "type", "E-mail"),
        (_, None) => {}
    }
    let medium = fields.take(&[
        "medium",
        "artworkMedium",
        "audioRecordingFormat",
        "videoRecordingFormat",
        "interviewMedium",
        "audioFileType",
        "format",
    ]);
    if let Some(medium) = medium {
        let field = if entry_type == "artwork" { "type" } else { "howpublished" };
        if draft.fields.contains_key(field) {
            notes.push(left_out("medium", medium));
        }
        set(&mut draft, field, text::line(medium));
    }
    match kind {
        "magazineArticle" => set(&mut draft, "entrysubtype", "magazine"),
        "newspaperArticle" => set(&mut draft, "entrysubtype", "newspaper"),
        // What Zotero has a type for and BibLaTeX has not keeps Zotero's name for it.
        _ if entry_type == "misc" && type_for(kind) == "misc" && !matches!(kind, "document" | "") => {
            set(&mut draft, "entrysubtype", kind.to_lowercase())
        }
        _ => {}
    }
    set(&mut draft, "entrysubtype", extra.subtype.clone().unwrap_or_default());

    // The language.
    if let Some(language) = fields.take(&["language"]) {
        match (text::babel(language), text::languages(language)) {
            (Some(name), _) => set(&mut draft, "langid", name),
            (None, Some(several)) => set(&mut draft, "language", several),
            (None, None) => set(&mut draft, "language", text::line(language)),
        }
    }

    // The user's own words.
    if let Some(summary) = fields.take(&["abstractNote"]) {
        let summary = if markup::has_tags(summary) { markup::plain(summary) } else { summary.to_owned() };
        set(&mut draft, "abstract", text::paragraphs(&summary));
    }
    let tags: Vec<String> = item
        .tags
        .iter()
        // A comma within a keyword would make two of it.
        .map(|tag| normalise_space(tag).replace(',', ";"))
        .filter(|tag| !tag.is_empty())
        .fold(Vec::new(), |mut tags, tag| {
            if !tags.contains(&tag) {
                tags.push(tag);
            }
            tags
        });
    set(&mut draft, "keywords", tags.join(", "));

    names(item, &mut draft, &mut notes);

    // What Extra holds stands in where Zotero's own fields were empty.
    for (name, value) in &extra.found {
        set(&mut draft, name, value);
    }
    set(&mut draft, "note", extra.note());

    // Where an entry came from and whose it is are not part of it.
    fields.take(&["libraryCatalog", "rights"]);
    let left: Vec<String> = fields.left().map(|(name, value)| left_out(name, value)).collect();
    notes.extend(left);

    // What the entry is in Zotero: by this a citation that Zotero made, in a
    // text that is brought in, finds the entry.
    set(&mut draft, FIELD_ZOTERO, item.key.trim());

    (draft, notes)
}

fn left_out(field: &str, value: &str) -> String {
    format!(
        "Zotero’s field “{}” has no counterpart in BibLaTeX and was left out: {}",
        text::label(field),
        text::shorten(dates::as_typed(value), 80)
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn item(kind: &str, fields: &[(&str, &str)], creators: &[(&str, &str, &str)]) -> Item {
        Item {
            id: 1,
            key: "ABCD2345".into(),
            kind: kind.into(),
            fields: fields.iter().map(|(n, v)| (n.to_string(), v.to_string())).collect(),
            creators: creators
                .iter()
                .map(|(role, first, last)| Creator {
                    role: role.to_string(),
                    first: first.to_string(),
                    last: last.to_string(),
                    single: false,
                })
                .collect(),
            tags: Vec::new(),
        }
    }

    fn draft(kind: &str, fields: &[(&str, &str)], creators: &[(&str, &str, &str)]) -> Draft {
        entry(&item(kind, fields, creators)).0
    }

    fn type_of(kind: &str, fields: &[(&str, &str)], creators: &[(&str, &str, &str)]) -> String {
        draft(kind, fields, creators).entry_type
    }

    /// The fields of the entry made of an item that has these fields and
    /// nothing else. The key of the item, which every entry has, is not
    /// among them.
    fn mapped(kind: &str, fields: &[(&str, &str)]) -> Vec<(String, String)> {
        draft(kind, fields, &[]).fields.into_iter().filter(|(name, _)| name != FIELD_ZOTERO).collect()
    }

    #[test]
    fn the_key_of_the_item_is_kept() {
        let d = draft("book", &[("title", "Iliad")], &[]);
        assert_eq!(d.get(FIELD_ZOTERO), Some("ABCD2345"));
        assert_eq!(d.zotero(), vec!["ABCD2345"]);
        assert_eq!(d.to_entry().zotero, vec!["ABCD2345"]);
        assert_eq!(d.to_entry().get(FIELD_ZOTERO), None);
    }

    fn pairs(fields: &[(&str, &str)]) -> Vec<(String, String)> {
        fields.iter().map(|(name, value)| (name.to_string(), value.to_string())).collect()
    }

    #[test]
    fn types() {
        for (kind, expected) in [
            ("journalArticle", "article"),
            ("book", "book"),
            ("bookSection", "incollection"),
            ("thesis", "thesis"),
            ("conferencePaper", "inproceedings"),
            ("report", "report"),
            ("webpage", "online"),
            ("blogPost", "online"),
            ("manuscript", "unpublished"),
            ("presentation", "unpublished"),
            ("letter", "letter"),
            ("email", "letter"),
            ("encyclopediaArticle", "inreference"),
            ("dictionaryEntry", "inreference"),
            ("magazineArticle", "article"),
            ("newspaperArticle", "article"),
            ("film", "movie"),
            ("videoRecording", "video"),
            ("audioRecording", "audio"),
            ("podcast", "audio"),
            ("artwork", "artwork"),
            ("patent", "patent"),
            ("statute", "legislation"),
            ("bill", "legislation"),
            ("case", "jurisdiction"),
            ("computerProgram", "software"),
            ("dataset", "dataset"),
            ("preprint", "online"),
            ("standard", "standard"),
            ("interview", "misc"),
            ("document", "misc"),
            ("somethingNew", "misc"),
            ("", "misc"),
        ] {
            assert_eq!(type_of(kind, &[("title", "T")], &[]), expected, "{kind}");
        }
        assert_eq!(draft("magazineArticle", &[], &[]).get("entrysubtype"), Some("magazine"));
        assert_eq!(draft("newspaperArticle", &[], &[]).get("entrysubtype"), Some("newspaper"));
        assert_eq!(draft("interview", &[], &[]).get("entrysubtype"), Some("interview"));
        assert_eq!(draft("somethingNew", &[], &[]).get("entrysubtype"), Some("somethingnew"));
        assert_eq!(draft("document", &[], &[]).get("entrysubtype"), None);
        assert_eq!(draft("email", &[], &[]).get("type"), Some("E-mail"));
    }

    #[test]
    fn types_that_depend_on_what_the_item_has() {
        let editor = [("editor", "Robert", "Fowler")];
        let author = [("author", "Gregory", "Nagy"), ("editor", "Robert", "Fowler")];
        assert_eq!(type_of("book", &[], &editor), "collection");
        assert_eq!(type_of("book", &[], &author), "book");
        assert_eq!(type_of("book", &[("numberOfVolumes", "3")], &author), "mvbook");
        assert_eq!(type_of("book", &[("numberOfVolumes", "3")], &editor), "mvcollection");
        assert_eq!(type_of("book", &[("numberOfVolumes", "3"), ("volume", "2")], &author), "book");
        assert_eq!(type_of("book", &[("numberOfVolumes", "1")], &author), "book");
        assert_eq!(type_of("bookSection", &[], &[("author", "A", "B"), ("bookAuthor", "A", "B")]), "inbook");
        assert_eq!(type_of("preprint", &[("archiveID", "arXiv:2301.12345")], &[]), "article");
        assert_eq!(type_of("preprint", &[("url", "https://arxiv.org/abs/2301.12345v1?x")], &[]), "article");
        assert_eq!(type_of("document", &[("extra", "type: dataset")], &[]), "dataset");
        assert_eq!(type_of("book", &[("extra", "tex.entrytype: commentary")], &[]), "commentary");

        let (review, notes) = entry(&item(
            "journalArticle",
            &[("title", "Review of The Best of the Achaeans")],
            &[("author", "M. L.", "West"), ("reviewedAuthor", "Gregory", "Nagy")],
        ));
        assert_eq!(review.entry_type, "review");
        assert_eq!(review.names.keys().collect::<Vec<_>>(), vec!["author"]);
        assert_eq!(
            notes,
            vec![
                "Zotero names Gregory Nagy as reviewed author, which BibLaTeX has no field for. \
                 The name was left out."
            ]
        );
    }

    #[test]
    fn titles_and_subtitles() {
        let split = |title: &str| subtitle(title).map(|(a, b)| format!("{a} | {b}"));
        assert_eq!(
            split("The Best of the Achaeans: Concepts of the Hero").as_deref(),
            Some("The Best of the Achaeans | Concepts of the Hero")
        );
        assert_eq!(split("Krig og fred : en studie").as_deref(), Some("Krig og fred | en studie"));
        assert_eq!(split("Reading John 3:16: A Study").as_deref(), Some("Reading John 3:16 | A Study"));
        assert_eq!(split("“Wrath: A Word”: Its History").as_deref(), Some("“Wrath: A Word” | Its History"));
        assert_eq!(split("„Zorn: ein Wort“ und mehr"), None);
        assert_eq!(split("Plato: Republic: Book 1"), None);
        assert_eq!(split("The Iliad (Books 1–12: A Commentary)"), None);
        assert_eq!(split("\\emph{Iliad: A Poem} of War"), None);
        assert_eq!(split("Review of \"Homer: Poet\" by X"), None);
        assert_eq!(split("At 10:30 and no later"), None);
        assert_eq!(split("No subtitle here"), None);
        assert_eq!(split("Ends with a colon: "), None);

        let d = draft("book", &[("title", "The <i>Iliad</i>: A Commentary"), ("shortTitle", "Iliad")], &[]);
        assert_eq!(d.get("title"), Some("The \\emph{Iliad}"));
        assert_eq!(d.get("subtitle"), Some("A Commentary"));
        assert_eq!(d.get("shorttitle"), Some("Iliad"));
        let d = draft("email", &[("subject", "Re: your letter")], &[]);
        assert_eq!(d.get("title"), Some("Re: your letter"));
        assert_eq!(d.get("subtitle"), None);
    }

    #[test]
    fn what_the_work_is_in() {
        let d = draft(
            "journalArticle",
            &[
                ("publicationTitle", "Journal of Hellenic Studies"),
                ("journalAbbreviation", "JHS"),
                ("issue", "2"),
                ("volume", "108"),
                ("series", "New Series"),
                ("seriesTitle", "Homerica"),
            ],
            &[],
        );
        assert_eq!(d.get("journaltitle"), Some("Journal of Hellenic Studies"));
        assert_eq!(d.get("shortjournal"), Some("JHS"));
        assert_eq!(d.get("number"), Some("2"));
        assert_eq!(d.get("volume"), Some("108"));
        assert_eq!(d.get("series"), Some("New Series"));
        let (_, notes) = entry(&item("journalArticle", &[("series", "New Series"), ("seriesTitle", "Homerica")], &[]));
        assert_eq!(
            notes,
            vec!["Zotero’s field “series title” has no counterpart in BibLaTeX and was left out: Homerica"]
        );

        assert_eq!(mapped("journalArticle", &[("issue", "Spring")]), pairs(&[("issue", "Spring")]));
        assert_eq!(mapped("journalArticle", &[("issue", "3/4")]), pairs(&[("number", "3/4")]));
        assert_eq!(
            mapped("conferencePaper", &[("proceedingsTitle", "Proceedings"), ("conferenceName", "The Meeting")]),
            pairs(&[("booktitle", "Proceedings"), ("eventtitle", "The Meeting")])
        );
        assert_eq!(
            mapped("encyclopediaArticle", &[("encyclopediaTitle", "Brill’s New Pauly")]),
            pairs(&[("booktitle", "Brill’s New Pauly")])
        );
        assert_eq!(
            mapped("blogPost", &[("blogTitle", "Classics and Computing")]),
            pairs(&[("organization", "Classics {and} Computing")])
        );
        assert_eq!(mapped("tvBroadcast", &[("programTitle", "Horizon")]), pairs(&[("titleaddon", "Horizon")]));
        assert_eq!(
            mapped("book", &[("series", "Hermes Einzelschriften"), ("seriesNumber", "12")]),
            pairs(&[("number", "12"), ("series", "Hermes Einzelschriften")])
        );
    }

    #[test]
    fn publishers_by_type() {
        assert_eq!(
            mapped("book", &[("publisher", "Thames and Hudson"), ("place", "London; New York")]),
            pairs(&[("location", "London and New York"), ("publisher", "Thames {and} Hudson")])
        );
        assert_eq!(
            mapped("thesis", &[("university", "Universitetet i Oslo")]),
            pairs(&[("institution", "Universitetet i Oslo")])
        );
        assert_eq!(
            mapped("report", &[("institution", "NASA"), ("reportNumber", "TR-1"), ("reportType", "Technical report")]),
            pairs(&[("institution", "NASA"), ("number", "TR-1"), ("type", "Technical report")])
        );
        assert_eq!(
            mapped("computerProgram", &[("company", "Anthropic"), ("versionNumber", "2.1")]),
            pairs(&[("organization", "Anthropic"), ("version", "2.1")])
        );
        assert_eq!(
            mapped(
                "presentation",
                &[("place", "Oslo"), ("meetingName", "Norsk klassisk forbund"), ("presentationType", "Lecture")]
            ),
            pairs(&[("eventtitle", "Norsk klassisk forbund"), ("howpublished", "Lecture"), ("venue", "Oslo")])
        );
        assert_eq!(
            mapped("artwork", &[("artworkMedium", "Oil on canvas"), ("artworkSize", "73 × 92 cm")]),
            pairs(&[("type", "Oil on canvas")])
        );
        assert_eq!(
            mapped("film", &[("distributor", "Toho"), ("genre", "Drama"), ("videoRecordingFormat", "35 mm")]),
            pairs(&[("howpublished", "35 mm"), ("publisher", "Toho"), ("type", "Drama")])
        );
        assert_eq!(
            mapped(
                "book",
                &[
                    ("originalDate", "1929-00-00 1929"),
                    ("originalPublisher", "Weidmann"),
                    ("originalPlace", "Berlin"),
                    ("format", "E-book"),
                ]
            ),
            pairs(&[
                ("howpublished", "E-book"),
                ("origdate", "1929"),
                ("origlocation", "Berlin"),
                ("origpublisher", "Weidmann"),
            ])
        );
        assert_eq!(
            mapped(
                "standard",
                &[
                    ("organization", "ISO"),
                    ("number", "8601"),
                    ("partNumber", "2"),
                    ("partTitle", "Extensions"),
                    ("status", "Published"),
                ]
            ),
            pairs(&[
                ("number", "8601"),
                ("organization", "ISO"),
                ("part", "2"),
                ("pubstate", "Published"),
                ("titleaddon", "Extensions"),
            ])
        );
        assert_eq!(
            mapped("conferencePaper", &[("place", "Leiden"), ("eventPlace", "Oslo")]),
            pairs(&[("location", "Leiden"), ("venue", "Oslo")])
        );
        assert_eq!(
            mapped("presentation", &[("meetingName", "The Meeting"), ("sessionTitle", "Epic")]),
            pairs(&[("eventtitle", "The Meeting"), ("eventtitleaddon", "Epic")])
        );

        let (d, notes) = entry(&item(
            "patent",
            &[
                ("country", "Norway"),
                ("place", "Oslo"),
                ("assignee", "Norsk Hydro"),
                ("patentNumber", "NO 123"),
                ("issueDate", "1999-03-02 1999-03-02"),
            ],
            &[("inventor", "Kari", "Nordmann")],
        ));
        assert_eq!(d.get("location"), Some("Norway"));
        assert_eq!(d.get("number"), Some("NO 123"));
        assert_eq!(d.get("date"), Some("1999-03-02"));
        assert_eq!(d.names["holder"], vec![Person::literal("Norsk Hydro")]);
        assert_eq!(d.names["author"], vec![Person::new("Nordmann", "Kari")]);
        assert_eq!(notes, vec!["Zotero’s field “place” has no counterpart in BibLaTeX and was left out: Oslo"]);
        let (_, notes) = entry(&item("patent", &[("filingDate", "1998-01-05 5 January 1998")], &[]));
        assert_eq!(
            notes,
            vec!["Zotero’s field “filing date” has no counterpart in BibLaTeX and was left out: 5 January 1998"]
        );
        assert_eq!(
            mapped("manuscript", &[("institution", "Institutt for filosofi"), ("number", "12")]),
            pairs(&[("institution", "Institutt for filosofi"), ("number", "12")])
        );

        assert_eq!(
            mapped(
                "case",
                &[
                    ("caseName", "Donoghue v Stevenson"),
                    ("court", "HL"),
                    ("dateDecided", "1932-00-00 1932"),
                    ("firstPage", "562"),
                    ("reporter", "AC"),
                    ("reporterVolume", "1"),
                ]
            ),
            pairs(&[
                ("date", "1932"),
                ("institution", "HL"),
                ("journaltitle", "AC"),
                ("pages", "562"),
                ("title", "Donoghue v Stevenson"),
                ("volume", "1"),
            ])
        );
    }

    #[test]
    fn identifiers_dates_and_language() {
        assert_eq!(
            mapped(
                "webpage",
                &[
                    ("url", "https://example.org/a_b?c=1"),
                    ("accessDate", "2019-05-12 14:33:21"),
                    ("date", "0000-00-00 n.d."),
                    ("language", "en-GB"),
                    ("DOI", "https://doi.org/10.1/X"),
                    ("ISBN", "978-0-8018-2388-6  0801823889"),
                ]
            ),
            pairs(&[
                ("doi", "10.1/X"),
                ("isbn", "978-0-8018-2388-6 0801823889"),
                ("langid", "british"),
                ("url", "https://example.org/a_b?c=1"),
                ("urldate", "2019-05-12"),
                ("year", "n.d."),
            ])
        );
        // A day of access without an address says nothing.
        assert_eq!(mapped("book", &[("accessDate", "2019-05-12 14:33:21")]), pairs(&[]));
        assert_eq!(mapped("book", &[("language", "Klingon")]), pairs(&[("language", "Klingon")]));
        assert_eq!(mapped("book", &[("language", "grc; la")]), pairs(&[("language", "ancientgreek and latin")]));
    }

    #[test]
    fn archives_and_preprints() {
        assert_eq!(
            mapped(
                "manuscript",
                &[
                    ("archive", "Bodleian Library"),
                    ("archiveLocation", "MS. Auct. T. 2. 26"),
                    ("callNumber", "PA4037"),
                    ("manuscriptType", "Codex"),
                ]
            ),
            pairs(&[("howpublished", "Codex"), ("library", "Bodleian Library, MS. Auct. T. 2. 26, PA4037")])
        );
        assert_eq!(mapped("book", &[("callNumber", "PA4037 .N3")]), pairs(&[("library", "PA4037 .N3")]));

        // An archive of preprints is not where a book is held.
        assert_eq!(
            mapped(
                "journalArticle",
                &[("archive", "arXiv"), ("archiveLocation", "2301.12345"), ("callNumber", "hep-th")]
            ),
            pairs(&[("eprint", "2301.12345"), ("eprintclass", "hep-th"), ("eprinttype", "arxiv")])
        );

        let (d, notes) = entry(&item(
            "preprint",
            &[("repository", "arXiv"), ("archiveID", "arXiv:2301.12345"), ("DOI", "10.48550/arXiv.2301.12345")],
            &[],
        ));
        assert_eq!(d.entry_type, "article");
        assert_eq!(
            d.fields.into_iter().filter(|(name, _)| name != FIELD_ZOTERO).collect::<Vec<_>>(),
            pairs(&[("doi", "10.48550/arXiv.2301.12345"), ("eprint", "2301.12345"), ("eprinttype", "arxiv")])
        );
        assert!(notes.is_empty(), "{notes:?}");

        let d = draft("preprint", &[("repository", "SSRN"), ("archiveID", "4012345")], &[]);
        assert_eq!(d.entry_type, "online");
        assert_eq!(
            d.fields.into_iter().filter(|(name, _)| name != FIELD_ZOTERO).collect::<Vec<_>>(),
            pairs(&[("eprint", "4012345"), ("eprinttype", "SSRN")])
        );

        assert_eq!(
            mapped("preprint", &[("repository", "OSF Preprints"), ("archiveID", "abc12")]),
            pairs(&[("eprint", "abc12"), ("eprinttype", "OSF Preprints")])
        );
        assert_eq!(mapped("preprint", &[("repository", "OSF Preprints")]), pairs(&[("organization", "OSF Preprints")]));
        assert_eq!(mapped("preprint", &[("archiveID", "abc12")]), pairs(&[("number", "abc12")]));
        assert_eq!(
            mapped("journalArticle", &[("extra", "PMID: 12345")]),
            pairs(&[("eprint", "12345"), ("eprinttype", "pubmed")])
        );
        let (d, notes) = entry(&item("journalArticle", &[("PMID", "12345"), ("PMCID", "PMC99")], &[]));
        assert_eq!(
            d.fields.into_iter().filter(|(name, _)| name != FIELD_ZOTERO).collect::<Vec<_>>(),
            pairs(&[("eprint", "12345"), ("eprinttype", "pubmed")])
        );
        assert_eq!(notes, vec!["Zotero’s field “PMCID” has no counterpart in BibLaTeX and was left out: PMC99"]);
    }
    #[test]
    fn people() {
        let one = |first: &str, last: &str, single: bool| {
            person(&Creator { role: "author".into(), first: first.into(), last: last.into(), single })
        };
        assert_eq!(one("Gregory", "Nagy", false), Some(Person::new("Nagy", "Gregory")));
        assert_eq!(one("", "British Museum", true), Some(Person::literal("British Museum")));
        assert_eq!(one("", "UNESCO", true), Some(Person::literal("UNESCO")));
        assert_eq!(one("", "Homer", false), Some(Person::new("Homer", "")));
        assert_eq!(one("", "Thomas Aquinas", false), Some(Person::literal("Thomas Aquinas")));
        assert_eq!(one("Hesiod", "", false), Some(Person::new("Hesiod", "")));
        assert_eq!(one(" ", "", false), None);
        let king =
            Person { family: "King".into(), given: "Martin Luther".into(), suffix: "Jr.".into(), ..Default::default() };
        assert_eq!(one("Martin Luther, Jr.", "King", false), Some(king.clone()));
        assert_eq!(one("Martin Luther", "King, Jr.", false), Some(king));
        assert_eq!(one("John, of Salisbury", "X", false).map(|p| p.given), Some("{John, of Salisbury}".to_owned()));
        // What is written can be read again as the same.
        let people = [
            one("Vincent", "van Gogh", false),
            one("Martin Luther, Jr.", "King", false),
            one("John, of Salisbury", "X", false),
            one("", "Barnes and Noble", true),
        ];
        for p in people {
            let p = p.unwrap();
            let written = crate::bib::names::format_list(std::slice::from_ref(&p));
            assert_eq!(crate::bib::names::format_list(&parse_list(&written)), written);
        }
    }

    #[test]
    fn roles() {
        let d = draft(
            "bookSection",
            &[],
            &[
                ("author", "Gregory", "Nagy"),
                ("editor", "Robert", "Fowler"),
                ("translator", "Anne", "Carson"),
                ("bookAuthor", "Albert", "Lord"),
                ("seriesEditor", "Hugh", "Lloyd-Jones"),
                ("contributor", "Milman", "Parry"),
            ],
        );
        assert_eq!(d.names["author"], vec![Person::new("Nagy", "Gregory")]);
        assert_eq!(d.names["editor"], vec![Person::new("Fowler", "Robert")]);
        assert_eq!(d.names["translator"], vec![Person::new("Carson", "Anne")]);
        assert_eq!(d.names["bookauthor"], vec![Person::new("Lord", "Albert")]);
        assert_eq!(d.names["editora"], vec![Person::new("Lloyd-Jones", "Hugh")]);
        assert_eq!(d.get("editoratype"), Some("redactor"));
        assert_eq!(d.names["editorb"], vec![Person::new("Parry", "Milman")]);
        assert_eq!(d.get("editorbtype"), Some("collaborator"));

        let d = draft("book", &[], &[("author", "A", "B"), ("contributor", "C", "D")]);
        assert_eq!(d.names["editora"], vec![Person::new("D", "C")]);
        assert_eq!(d.get("editoratype"), Some("collaborator"));
        assert!(!d.names.contains_key("editorb"));

        // Who stands first where there is no author.
        let d = draft("film", &[], &[("director", "Akira", "Kurosawa"), ("producer", "Sojiro", "Motoki")]);
        assert_eq!(d.names["author"], vec![Person::new("Kurosawa", "Akira")]);
        assert_eq!(d.names["editora"], vec![Person::new("Motoki", "Sojiro")]);
        let d = draft("videoRecording", &[], &[("creator", "Agnès", "Varda"), ("narrator", "C", "D")]);
        assert_eq!(d.names["author"], vec![Person::new("Varda", "Agnès")]);
        let d = draft("interview", &[], &[("interviewee", "A", "B"), ("interviewer", "C", "D")]);
        assert_eq!(d.names["author"], vec![Person::new("B", "A")]);
        assert_eq!(d.names["editora"], vec![Person::new("D", "C")]);
        let d = draft("blogPost", &[], &[("author", "A", "B"), ("commenter", "C", "D")]);
        assert_eq!(d.names["commentator"], vec![Person::new("D", "C")]);

        let (d, notes) = entry(&item("letter", &[], &[("author", "A", "B"), ("recipient", "Albert", "Lord")]));
        assert_eq!(d.names.len(), 1);
        assert_eq!(
            notes,
            vec!["Zotero names Albert Lord as recipient, which BibLaTeX has no field for. The name was left out."]
        );
    }

    #[test]
    fn extra_fills_and_overrides() {
        let (d, notes) = entry(&item(
            "book",
            &[
                ("title", "The Singer of Tales"),
                ("date", "2000-00-00 2000"),
                ("DOI", "10.1/field"),
                (
                    "extra",
                    "Citation Key: lord2000\nDOI: 10.1/extra\nISBN: 0674002830\noriginal-date: 1960\n\
                     tex.shorthand: ST\ntex.title: The {Singer} of Tales\n\
                     tex.editor: Mitchell, Stephen and Nagy, Gregory\nRead in 2019",
                ),
                ("libraryCatalog", "Library of Congress"),
                ("rights", "All rights reserved"),
                ("runningTime", "1:32:00"),
            ],
            &[("author", "Albert B.", "Lord"), ("editor", "Someone", "Else")],
        ));
        assert_eq!(d.key, "lord2000");
        assert_eq!(d.get("doi"), Some("10.1/field"));
        assert_eq!(d.get("isbn"), Some("0674002830"));
        assert_eq!(d.get("origdate"), Some("1960"));
        assert_eq!(d.get("date"), Some("2000"));
        assert_eq!(d.get("shorthand"), Some("ST"));
        assert_eq!(d.get("title"), Some("The {Singer} of Tales"));
        assert_eq!(d.get("note"), Some("Read in 2019"));
        // Names written for Better BibTeX stand in place of Zotero's of the same kind.
        assert_eq!(d.names["author"], vec![Person::new("Lord", "Albert B.")]);
        assert_eq!(d.names["editor"], vec![Person::new("Mitchell", "Stephen"), Person::new("Nagy", "Gregory")]);
        assert_eq!(
            notes,
            vec!["Zotero’s field “running time” has no counterpart in BibLaTeX and was left out: 1:32:00"]
        );

        let d = draft("book", &[("citationKey", "native2026"), ("extra", "Citation Key: pinned")], &[]);
        assert_eq!(d.key, "native2026");
        assert_eq!(draft("book", &[("title", "T")], &[]).key, "");
    }

    #[test]
    fn text_of_the_user() {
        let mut it = item(
            "journalArticle",
            &[
                ("abstractNote", "<jats:p>First  paragraph.</jats:p>\n<jats:p>Costs $5.</jats:p>"),
                ("pages", "151-172"),
                ("edition", "2nd ed."),
                ("thesisType", "PhD thesis"),
            ],
            &[],
        );
        it.tags = vec!["Homer".into(), "epic, Greek".into(), " ".into(), "Homer".into()];
        let (d, _) = entry(&it);
        assert_eq!(d.get("abstract"), Some("First paragraph.\nCosts \\$5."));
        assert_eq!(d.get("pages"), Some("151–172"));
        assert_eq!(d.get("edition"), Some("2"));
        assert_eq!(d.get("keywords"), Some("Homer, epic; Greek"));
        assert_eq!(d.get("type"), Some("PhD thesis"));
        assert_eq!(draft("thesis", &[("thesisType", "PhD thesis")], &[]).get("type"), Some("phdthesis"));
        assert_eq!(
            mapped("thesis", &[("thesisType", "Habilitationsschrift")]),
            pairs(&[("type", "Habilitationsschrift")])
        );
        assert_eq!(draft("thesis", &[], &[]).get("type"), None);
    }
}
