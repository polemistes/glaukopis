//! An entry of the library, and the forms in which the interface sees it.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::bib::date::{display_year, entry_year};
use crate::bib::latex::{fold, plain};
use crate::bib::names::{Person, format_list, parse_list, short_list};
use crate::bib::{RawEntry, is_name_field};

pub const FIELD_ID: &str = "glaukopis-id";
pub const FIELD_ADDED: &str = "glaukopis-added";
pub const FIELD_MODIFIED: &str = "glaukopis-modified";
pub const FIELD_MERGED: &str = "glaukopis-merged";
pub use crate::found::FIELD_ZOTERO;

/// The keys of items in Zotero that a field holds, parted by spaces. What is
/// no key of Zotero's is left out.
pub fn zotero_keys(field: &str) -> Vec<String> {
    let mut keys: Vec<String> = Vec::new();
    for word in field.split(|c: char| c.is_whitespace() || c == ',') {
        let key = word.to_ascii_uppercase();
        if key.len() == 8 && key.chars().all(|c| c.is_ascii_alphanumeric()) && !keys.contains(&key) {
            keys.push(key);
        }
    }
    keys
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Entry {
    pub id: String,
    pub key: String,
    pub entry_type: String,
    /// In text form, in the order given. The application's own fields are not
    /// among them; they are the struct's other members.
    pub fields: Vec<(String, String)>,
    pub added: String,
    pub modified: String,
    /// Ids of entries that were merged into this one. A citation of one of
    /// them resolves to this entry.
    pub merged: Vec<String>,
    /// The keys of the items in Zotero that the entry was made of, by which a
    /// citation that Zotero made finds it. Several, of an entry that others
    /// were merged into.
    pub zotero: Vec<String>,
}

impl Entry {
    pub fn get(&self, name: &str) -> Option<&str> {
        self.fields.iter().find(|(n, _)| n == name).map(|(_, v)| v.as_str()).filter(|v| !v.trim().is_empty())
    }

    pub fn set(&mut self, name: &str, value: impl Into<String>) {
        let value = value.into();
        if value.trim().is_empty() {
            self.remove(name);
        } else if let Some(f) = self.fields.iter_mut().find(|(n, _)| n == name) {
            f.1 = value;
        } else {
            self.fields.push((name.to_owned(), value));
        }
    }

    pub fn remove(&mut self, name: &str) -> Option<String> {
        let i = self.fields.iter().position(|(n, _)| n == name)?;
        Some(self.fields.remove(i).1)
    }

    pub fn people(&self, field: &str) -> Vec<Person> {
        self.get(field).map(parse_list).unwrap_or_default()
    }

    /// Those who stand first in a citation: the authors, or else the editors,
    /// or else the translators.
    pub fn creators(&self) -> Vec<Person> {
        for field in ["author", "editor", "translator", "bookauthor", "commentator"] {
            let people = self.people(field);
            if !people.is_empty() {
                return people;
            }
        }
        if let Some(org) = self.get("organization").or_else(|| self.get("institution"))
            && self.get("author").is_none()
            && matches!(self.entry_type.as_str(), "online" | "report" | "manual" | "standard" | "dataset")
        {
            return vec![Person::literal(plain(org))];
        }
        Vec::new()
    }

    pub fn year(&self) -> Option<i32> {
        entry_year(self.get("date"), self.get("year"))
    }

    pub fn title_plain(&self) -> String {
        let title = self.get("title").map(plain).unwrap_or_default();
        match self.get("subtitle").map(plain) {
            Some(sub) if !sub.is_empty() => {
                if title.is_empty() {
                    sub
                } else if title.ends_with(['?', '!', ':', '.']) {
                    format!("{title} {sub}")
                } else {
                    format!("{title}: {sub}")
                }
            }
            _ => title,
        }
    }

    /// What the entry is contained in: the journal or the book.
    pub fn container_plain(&self) -> String {
        for field in ["journaltitle", "booktitle", "maintitle", "eventtitle", "series"] {
            if let Some(v) = self.get(field) {
                // A series is a container only for books.
                if field == "series" && self.entry_type == "article" {
                    continue;
                }
                return plain(v);
            }
        }
        String::new()
    }

    pub fn attachments(&self) -> Vec<String> {
        self.get("file").map(split_files).unwrap_or_default()
    }

    pub fn set_attachments(&mut self, paths: &[String]) {
        self.set("file", join_files(paths));
    }

    pub fn summary(&self) -> Summary {
        let creators = self.creators();
        let is_editor = self.get("author").is_none() && self.get("editor").is_some();
        let mut authors = short_list(&creators);
        if is_editor && !authors.is_empty() {
            authors.push_str(if creators.len() > 1 { " (eds.)" } else { " (ed.)" });
        }
        let authors_sort =
            creators.iter().map(|p| fold(&format!("{} {}", p.family, p.given))).collect::<Vec<_>>().join(" ");
        let title = self.title_plain();
        let container = self.container_plain();

        // Everything a search may hit, folded.
        let mut hay = String::new();
        for field in ["author", "editor", "translator", "bookauthor", "commentator"] {
            for p in self.people(field) {
                hay.push_str(&fold(&p.display()));
                hay.push(' ');
            }
        }
        for text in [&title, &container] {
            hay.push_str(&fold(text));
            hay.push(' ');
        }
        for field in [
            "publisher",
            "location",
            "series",
            "keywords",
            "shorthand",
            "shorttitle",
            "origtitle",
            "institution",
            "organization",
            "note",
            "doi",
            "isbn",
            "abstract",
            "annotation",
            "library",
        ] {
            if let Some(v) = self.get(field) {
                hay.push_str(&fold(v));
                hay.push(' ');
            }
        }
        let year_text = display_year(self.get("date"), self.get("year"));
        hay.push_str(&fold(&year_text));
        hay.push(' ');
        hay.push_str(&self.key.to_lowercase());

        Summary {
            id: self.id.clone(),
            key: self.key.clone(),
            entry_type: self.entry_type.clone(),
            authors,
            authors_sort,
            year: year_text,
            year_number: self.year(),
            title,
            container,
            attachments: self.attachments().len(),
            has_note: self.get("annotation").is_some(),
            added: self.added.clone(),
            modified: self.modified.clone(),
            search: hay,
        }
    }

    pub fn view(&self) -> EntryView {
        let mut fields = BTreeMap::new();
        let mut names = BTreeMap::new();
        for (name, value) in &self.fields {
            if name == "file" {
                continue;
            }
            if is_name_field(name) && !matches!(name.as_str(), "shortauthor" | "shorteditor" | "sortname") {
                names.insert(name.clone(), parse_list(value));
            } else {
                fields.insert(name.clone(), value.clone());
            }
        }
        EntryView {
            id: self.id.clone(),
            key: self.key.clone(),
            entry_type: self.entry_type.clone(),
            fields,
            names,
            attachments: self.attachments(),
            added: self.added.clone(),
            modified: self.modified.clone(),
            summary: self.summary(),
        }
    }

    /// The entry as BibLaTeX, without the application's own fields.
    pub fn to_bib(&self, with_internal: bool, with_files: bool) -> String {
        let mut out = String::new();
        let merged = self.merged.join(",");
        let zotero = self.zotero.join(" ");
        let mut fields: Vec<(&str, &str)> = self
            .fields
            .iter()
            .filter(|(n, _)| with_files || n != "file")
            .map(|(n, v)| (n.as_str(), v.as_str()))
            .collect();
        if with_internal {
            fields.push((FIELD_ID, &self.id));
            fields.push((FIELD_ADDED, &self.added));
            fields.push((FIELD_MODIFIED, &self.modified));
            if !merged.is_empty() {
                fields.push((FIELD_MERGED, &merged));
            }
            if !zotero.is_empty() {
                fields.push((FIELD_ZOTERO, &zotero));
            }
        }
        crate::bib::write_entry(&mut out, &self.entry_type, &self.key, fields);
        out
    }
}

/// The `file` field: paths separated by semicolons. A semicolon or backslash
/// within a path is escaped with a backslash.
pub fn split_files(value: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut current = String::new();
    let mut chars = value.chars();
    while let Some(c) = chars.next() {
        match c {
            '\\' => {
                if let Some(n) = chars.next() {
                    current.push(n);
                }
            }
            ';' => {
                let path = current.trim().to_owned();
                if !path.is_empty() {
                    out.push(path);
                }
                current.clear();
            }
            _ => current.push(c),
        }
    }
    let path = current.trim().to_owned();
    if !path.is_empty() {
        out.push(path);
    }
    out
}

pub fn join_files(paths: &[String]) -> String {
    paths.iter().map(|p| p.replace('\\', r"\\").replace(';', r"\;")).collect::<Vec<_>>().join(";")
}

/// What lists show of an entry.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Summary {
    pub id: String,
    pub key: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub authors: String,
    pub authors_sort: String,
    pub year: String,
    pub year_number: Option<i32>,
    pub title: String,
    pub container: String,
    pub attachments: usize,
    /// Whether the user has written something about the work: its `annotation`.
    pub has_note: bool,
    pub added: String,
    pub modified: String,
    pub search: String,
}

/// The whole entry, for the form.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EntryView {
    pub id: String,
    pub key: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub fields: BTreeMap<String, String>,
    pub names: BTreeMap<String, Vec<Person>>,
    pub attachments: Vec<String>,
    pub added: String,
    pub modified: String,
    pub summary: Summary,
}

/// An entry as the form hands it back, or as an import proposes it.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Draft {
    /// Empty to have a key made.
    pub key: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub fields: BTreeMap<String, String>,
    pub names: BTreeMap<String, Vec<Person>>,
}

impl Draft {
    pub fn from_entry(entry: &Entry) -> Self {
        let view = entry.view();
        Draft { key: view.key, entry_type: view.entry_type, fields: view.fields, names: view.names }
    }

    /// From an entry read from a `.bib` file: values decoded, aliases of types
    /// and fields resolved, `year` and `month` joined into `date`.
    pub fn from_raw(raw: &RawEntry) -> Self {
        let schema = super::schema::schema();
        let mut draft = Draft { key: raw.key.clone(), ..Default::default() };

        match schema.type_aliases.get(&raw.entry_type) {
            Some(alias) => {
                draft.entry_type = alias.entry_type.clone();
                for (k, v) in &alias.set {
                    draft.fields.insert(k.clone(), v.clone());
                }
            }
            None => draft.entry_type = raw.entry_type.clone(),
        }

        for (name, value) in &raw.fields {
            if name == FIELD_ZOTERO {
                // What the entry is in Zotero goes with it wherever it is
                // brought in. The other fields of the application are those
                // of the library they were written in.
                let keys = zotero_keys(value);
                if !keys.is_empty() {
                    draft.fields.insert(name.clone(), keys.join(" "));
                }
                continue;
            }
            if name.starts_with("glaukopis-") {
                continue;
            }
            let name = schema.field_aliases.get(name).cloned().unwrap_or_else(|| name.clone());
            let text = if crate::bib::is_verbatim_field(&name) {
                value.trim().to_owned()
            } else {
                crate::bib::latex::decode(value)
            };
            if text.trim().is_empty() {
                continue;
            }
            if is_name_field(&name) && !matches!(name.as_str(), "shortauthor" | "shorteditor" | "sortname") {
                draft.names.insert(name, parse_list(&text));
            } else {
                // A value given under the proper name wins over one given under an alias.
                draft.fields.entry(name).or_insert(text);
            }
        }

        draft.join_date();
        draft
    }

    /// `year = 1979, month = 5` becomes `date = 1979-05`, when both are plain.
    fn join_date(&mut self) {
        if self.fields.contains_key("date") {
            return;
        }
        let Some(year) = self.fields.get("year").map(|y| y.trim().to_owned()) else { return };
        if !(year.len() <= 4 && !year.is_empty() && year.chars().all(|c| c.is_ascii_digit())) {
            return;
        }
        let month = self.fields.get("month").and_then(|m| month_number(m));
        let has_month_field = self.fields.contains_key("month");
        if has_month_field && month.is_none() {
            // A month we cannot read: leave year and month as they are.
            return;
        }
        let date = match month {
            Some(m) => format!("{year:0>4}-{m:02}"),
            None => format!("{year:0>4}"),
        };
        self.fields.insert("date".into(), date);
        self.fields.remove("year");
        self.fields.remove("month");
    }

    pub fn get(&self, name: &str) -> Option<&str> {
        self.fields.get(name).map(String::as_str).filter(|v| !v.trim().is_empty())
    }

    /// The keys of the items in Zotero the draft was made of. They are no
    /// field of the entry that is made of the draft, but a member of it.
    pub fn zotero(&self) -> Vec<String> {
        self.fields.get(FIELD_ZOTERO).map(|v| zotero_keys(v)).unwrap_or_default()
    }

    /// All fields as they are stored, names formatted.
    pub fn stored_fields(&self) -> Vec<(String, String)> {
        let mut out: Vec<(String, String)> = Vec::new();
        for (name, people) in &self.names {
            let value = format_list(people);
            if !value.is_empty() {
                out.push((name.clone(), value));
            }
        }
        for (name, value) in &self.fields {
            if name.starts_with("glaukopis-") || self.names.contains_key(name) {
                continue;
            }
            let name = name.to_ascii_lowercase();
            let value = if crate::bib::parser::has_paragraphs(&name) {
                crate::bib::parser::normalise_paragraphs(value)
            } else {
                crate::bib::parser::normalise_space(value)
            };
            if !value.is_empty() {
                out.push((name, value));
            }
        }
        out
    }

    /// The draft as an entry that is not in any library, for comparing and showing.
    pub fn to_entry(&self) -> Entry {
        Entry {
            id: String::new(),
            key: self.key.clone(),
            entry_type: self.entry_type.clone(),
            fields: self.stored_fields(),
            added: String::new(),
            modified: String::new(),
            merged: Vec::new(),
            zotero: self.zotero(),
        }
    }
}

fn month_number(text: &str) -> Option<u8> {
    let t = text.trim().trim_end_matches('.').to_ascii_lowercase();
    if let Ok(n) = t.parse::<u8>() {
        return (1..=12).contains(&n).then_some(n);
    }
    const NAMES: [&str; 12] = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
    ];
    if t.len() < 3 {
        return None;
    }
    NAMES.iter().position(|n| n.starts_with(&t)).map(|i| i as u8 + 1)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bib::parse;

    fn draft(src: &str) -> Draft {
        Draft::from_raw(parse(src).entries().next().unwrap())
    }

    #[test]
    fn aliases_and_dates() {
        let d = draft(
            r#"@phdthesis{x, author={Mu{\~n}oz, Ana}, title={A {T}hesis}, school={Universidad},
                 year=2001, month=mar, address={Madrid}, journal={J}}"#,
        );
        assert_eq!(d.entry_type, "thesis");
        assert_eq!(d.get("type"), Some("phdthesis"));
        assert_eq!(d.get("institution"), Some("Universidad"));
        assert_eq!(d.get("location"), Some("Madrid"));
        assert_eq!(d.get("journaltitle"), Some("J"));
        assert_eq!(d.get("date"), Some("2001-03"));
        assert!(d.get("year").is_none());
        assert_eq!(d.names["author"][0].family, "Muñoz");
    }

    #[test]
    fn a_year_that_is_not_a_number_stays() {
        let d = draft("@book{x, year={forthcoming}}");
        assert_eq!(d.get("year"), Some("forthcoming"));
        assert!(d.get("date").is_none());
        let d = draft("@book{x, year={1990}, month={Michaelmas}}");
        assert_eq!(d.get("year"), Some("1990"));
    }

    #[test]
    fn summary_and_search() {
        let mut e = draft(
            r#"@incollection{k, author={Nagy, Gregory and Lord, Albert}, title={Homeric {Questions}},
               subtitle={A Reply}, booktitle={Essays}, date={1996}, file={a/b.pdf;c\;d.pdf}}"#,
        )
        .to_entry();
        e.id = "1".into();
        let s = e.summary();
        assert_eq!(s.authors, "Nagy and Lord");
        assert_eq!(s.title, "Homeric Questions: A Reply");
        assert_eq!(s.container, "Essays");
        assert_eq!(s.year, "1996");
        assert_eq!(s.attachments, 2);
        assert!(s.search.contains("gregory nagy"));
        assert!(s.search.contains("homeric questions"));
        assert_eq!(e.attachments(), vec!["a/b.pdf", "c;d.pdf"]);
    }

    #[test]
    fn editors_stand_in_for_authors() {
        let e = draft("@collection{k, editor={Fowler, Robert}, title={Companion}}").to_entry();
        assert_eq!(e.summary().authors, "Fowler (ed.)");
    }

    #[test]
    fn internal_fields_are_written_only_on_request() {
        let mut e = draft("@book{k, title={T}}").to_entry();
        e.id = "abc".into();
        e.added = "2026-01-01T00:00:00Z".into();
        e.modified = e.added.clone();
        assert!(e.to_bib(true, true).contains("glaukopis-id"));
        assert!(!e.to_bib(false, true).contains("glaukopis"));
    }
}
