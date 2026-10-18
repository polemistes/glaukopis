//! Reference styles: CSL files, those that come with the application and the
//! user's own, which are fetched, imported or made by changing another.

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

use serde::{Deserialize, Serialize};

use crate::bib::latex::fold;
use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::net::Client;
use crate::tr;

const REPOSITORY: &str = "https://raw.githubusercontent.com/citation-style-language/styles/master";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StyleSummary {
    pub id: String,
    pub title: String,
    /// note, author-date, numeric, label or author; empty when the style does not say.
    pub kind: String,
    /// Whether it is the user's own: fetched, imported or changed.
    pub own: bool,
    /// Whether the style makes a bibliography.
    pub bibliography: bool,
}

/// An entry of the index of all styles there are.
#[derive(Debug, Clone, Deserialize)]
struct IndexEntry {
    i: String,
    t: String,
    #[serde(default)]
    s: Option<String>,
    #[serde(default)]
    p: Option<String>,
    #[serde(default)]
    f: Option<String>,
    #[serde(default)]
    c: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Found {
    pub id: String,
    pub title: String,
    pub kind: String,
    /// The style this one takes its form from, when it is only a name for another.
    pub parent: Option<String>,
    pub fields: Vec<String>,
    pub installed: bool,
}

pub struct Styles {
    bundled: PathBuf,
    index: PathBuf,
    /// The index, read when it is first asked for.
    read_index: OnceLock<Vec<IndexEntry>>,
    own: PathBuf,
}

fn check_id(id: &str) -> Result<()> {
    let ok = !id.is_empty()
        && id.len() <= 120
        && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
        && !id.starts_with('-');
    if ok { Ok(()) } else { Err(Error::invalid(tr!("core-export-style-bad-id", id = id))) }
}

/// What a style says about itself, read from its beginning.
pub fn describe(xml: &str) -> (String, String, bool) {
    let head: String = xml.chars().take(8000).collect();
    let between = |open: &str, close: &str| -> Option<String> {
        let a = head.find(open)? + open.len();
        let b = head[a..].find(close)? + a;
        Some(unescape(head[a..b].trim()))
    };
    let title = between("<title>", "</title>").unwrap_or_default();
    let kind = head
        .find("citation-format=\"")
        .map(|i| i + "citation-format=\"".len())
        .and_then(|i| head[i..].find('"').map(|j| head[i..i + j].to_owned()))
        .unwrap_or_default();
    (title, kind, xml.contains("<bibliography"))
}

fn unescape(text: &str) -> String {
    text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&apos;", "'")
        .replace("&#38;", "&")
}

pub fn escape(text: &str) -> String {
    text.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}

/// Whether the text is a style at all, and one that stands on its own.
fn check_style(xml: &str) -> Result<()> {
    let doc = roxmltree::Document::parse(xml)
        .map_err(|e| Error::invalid(tr!("core-export-not-a-style", error = e.to_string())))?;
    let root = doc.root_element();
    if root.tag_name().name() != "style" {
        return Err(Error::invalid(tr!("core-export-not-a-style-begin")));
    }
    if !root.children().any(|c| c.tag_name().name() == "citation") {
        return Err(Error::invalid(tr!("core-export-dependent-style")));
    }
    Ok(())
}

impl Styles {
    pub fn new(resources: &Path, own: &Path) -> Self {
        Styles {
            bundled: resources.join("csl").join("styles"),
            index: resources.join("csl").join("index.json"),
            read_index: OnceLock::new(),
            own: own.to_owned(),
        }
    }

    fn summarise(path: &Path, own: bool) -> Option<StyleSummary> {
        let id = path.file_stem()?.to_string_lossy().into_owned();
        let xml = fs::read_to_string(path).ok()?;
        let (title, kind, bibliography) = describe(&xml);
        Some(StyleSummary { title: if title.is_empty() { id.clone() } else { title }, id, kind, own, bibliography })
    }

    /// The styles that can be used as they are: those that came with the
    /// application, and the user's own.
    pub fn list(&self) -> Vec<StyleSummary> {
        let mut by_id: HashMap<String, StyleSummary> = HashMap::new();
        for (dir, own) in [(&self.bundled, false), (&self.own, true)] {
            let Ok(entries) = fs::read_dir(dir) else { continue };
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().is_some_and(|e| e == "csl")
                    && let Some(s) = Self::summarise(&path, own)
                {
                    by_id.insert(s.id.clone(), s);
                }
            }
        }
        let mut out: Vec<StyleSummary> = by_id.into_values().collect();
        out.sort_by_key(|s| (fold(&s.title), s.own, s.id.clone()));
        out
    }

    pub fn path(&self, id: &str) -> Result<PathBuf> {
        check_id(id)?;
        for dir in [&self.own, &self.bundled] {
            let path = dir.join(format!("{id}.csl"));
            if path.is_file() {
                return Ok(path);
            }
        }
        Err(Error::not_found(tr!("core-export-the-reference-style", id = id)))
    }

    /// The path of a style, or of the one used when it is not there.
    pub fn path_or_default(&self, id: &str) -> Result<PathBuf> {
        self.path(id).or_else(|_| self.path("chicago-notes-bibliography")).or_else(|_| {
            self.list()
                .first()
                .ok_or_else(|| Error::not_found(tr!("core-export-any-reference-style")))
                .and_then(|s| self.path(&s.id))
        })
    }

    pub fn get(&self, id: &str) -> Result<StyleSummary> {
        let path = self.path(id)?;
        let own = path.starts_with(&self.own);
        Self::summarise(&path, own).ok_or_else(|| Error::not_found(tr!("core-export-the-reference-style", id = id)))
    }

    pub fn read(&self, id: &str) -> Result<String> {
        let path = self.path(id)?;
        fs::read_to_string(&path).context(|| tr!("io-reading", path = &path))
    }

    /// The index of all styles there are, which comes with the
    /// application. One that cannot be read is said in the log, once: the
    /// search then finds nothing, and a style is fetched as one that stands
    /// on its own, and if it is not, as one that names another.
    fn index(&self) -> &[IndexEntry] {
        self.read_index.get_or_init(|| {
            let read = fs::read_to_string(&self.index)
                .map_err(|e| e.to_string())
                .and_then(|text| serde_json::from_str(&text).map_err(|e| e.to_string()));
            read.unwrap_or_else(|error| {
                tracing::warn!(path = %self.index.display(), %error, "the index of the styles could not be read");
                Vec::new()
            })
        })
    }

    /// Searches all styles there are, by the words of their titles.
    pub fn search(&self, query: &str, limit: usize) -> Vec<Found> {
        let words: Vec<String> = fold(query).split(' ').filter(|w| !w.is_empty()).map(str::to_owned).collect();
        if words.is_empty() {
            return Vec::new();
        }
        let installed: std::collections::HashSet<String> = self.list().into_iter().map(|s| s.id).collect();
        let mut hits: Vec<(i32, &IndexEntry)> = Vec::new();
        for e in self.index() {
            let hay = format!(" {} {} {}", fold(&e.t), fold(e.s.as_deref().unwrap_or("")), e.i.replace('-', " "));
            if !words.iter().all(|w| hay.contains(&format!(" {w}"))) {
                continue;
            }
            // Short titles first: "Nature" before "Nature Reviews Cancer". Those that
            // stand on their own before those that name another.
            let mut score = e.t.chars().count() as i32;
            if e.p.is_some() {
                score += 15;
            }
            if fold(&e.t) == words.join(" ") {
                score -= 100;
            }
            if installed.contains(&e.i) {
                score -= 30;
            }
            hits.push((score, e));
        }
        hits.sort_by(|a, b| a.0.cmp(&b.0).then_with(|| a.1.t.cmp(&b.1.t)));
        hits.into_iter()
            .take(limit)
            .map(|(_, e)| Found {
                id: e.i.clone(),
                title: e.t.clone(),
                kind: e.f.clone().unwrap_or_default(),
                parent: e.p.clone(),
                fields: e.c.clone(),
                installed: installed.contains(&e.i),
            })
            .collect()
    }

    /// Fetches a style from the repository of styles and keeps it as the
    /// user's own. A style that only names another is kept with the form of
    /// the one it names, under its own name.
    pub fn fetch(&self, id: &str, client: &Client) -> Result<StyleSummary> {
        check_id(id)?;
        let names_another = self.index().iter().any(|e| e.i == id && e.p.is_some());
        let independent = || client.get_ok(&format!("{REPOSITORY}/{id}.csl"), None);
        let dependent = || client.get_ok(&format!("{REPOSITORY}/dependent/{id}.csl"), None);
        // The dependent's own file is read, not only the index's word for
        // it: it says which form it takes and in what locale, and the locale
        // is most often why it exists. Either may have changed since the
        // index was made, so each way falls back on the other.
        let as_named = |dependent: String| -> Result<String> {
            let parent =
                parent_of(&dependent).ok_or_else(|| Error::not_found(tr!("core-export-the-style", id = id)))?;
            check_id(&parent)?;
            let form = client.get_ok(&format!("{REPOSITORY}/{parent}.csl"), None)?;
            Ok(named_form(&dependent, &form, id))
        };
        let xml = if names_another {
            match dependent() {
                Ok(found) => as_named(found)?,
                Err(first) => independent().map_err(|_| first)?,
            }
        } else {
            match independent() {
                Ok(found) => found,
                Err(first) => as_named(dependent().map_err(|_| first)?)?,
            }
        };
        check_style(&xml)?;
        self.store(id, &xml)
    }

    fn store(&self, id: &str, xml: &str) -> Result<StyleSummary> {
        check_id(id)?;
        let path = self.own.join(format!("{id}.csl"));
        write_atomic(&path, xml.as_bytes())?;
        Self::summarise(&path, true).ok_or_else(|| Error::invalid(tr!("core-export-style-unreadable")))
    }

    /// Takes a style from a file.
    pub fn import(&self, file: &Path) -> Result<StyleSummary> {
        let xml = fs::read_to_string(file).context(|| tr!("io-reading", path = file))?;
        check_style(&xml)?;
        let stem = file.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
        let id = self.free_id(&crate::formats::slug(&stem));
        self.store(&id, &xml)
    }

    /// An id that no style has.
    pub fn free_id(&self, wanted: &str) -> String {
        let base = if wanted.is_empty() { "style".to_owned() } else { wanted.to_owned() };
        let taken =
            |id: &str| self.own.join(format!("{id}.csl")).exists() || self.bundled.join(format!("{id}.csl")).exists();
        if !taken(&base) {
            return base;
        }
        (2..).map(|n| format!("{base}-{n}")).find(|id| !taken(id)).expect("there is always another number")
    }

    /// Saves a style the user has changed. `id` is empty for a new one.
    pub fn save(&self, id: &str, title: &str, xml: &str) -> Result<StyleSummary> {
        check_style(xml)?;
        let title = title.split_whitespace().collect::<Vec<_>>().join(" ");
        if title.is_empty() {
            return Err(Error::invalid(tr!("core-export-style-needs-name")));
        }
        let own_already = !id.is_empty() && self.own.join(format!("{id}.csl")).is_file();
        let id = if own_already { id.to_owned() } else { self.free_id(&crate::formats::slug(&title)) };
        self.store(&id, &rename(xml, &id, &title))
    }

    pub fn delete(&self, id: &str) -> Result<()> {
        check_id(id)?;
        let path = self.own.join(format!("{id}.csl"));
        if !path.is_file() {
            return Err(Error::invalid(tr!("core-export-style-own-only")));
        }
        fs::remove_file(&path).context(|| tr!("io-removing", path = &path))
    }
}

fn parent_of(xml: &str) -> Option<String> {
    let at = xml.find("rel=\"independent-parent\"")?;
    let start = xml[..at].rfind("<link")?;
    let end = xml[start..].find('>')? + start;
    let tag = &xml[start..end];
    let href = tag.find("href=\"")? + 6;
    let close = tag[href..].find('"')? + href;
    tag[href..close].trim_end_matches('/').rsplit('/').next().map(str::to_owned)
}

/// The form of the style a dependent names, kept as the dependent: under
/// its title and id, and in its locale where it has one, which overrides
/// the form's, as the specification of CSL has it.
fn named_form(dependent: &str, form: &str, id: &str) -> String {
    let mut out = rename(form, id, &describe(dependent).0);
    if let Some(locale) = default_locale(dependent)
        && let Some(tag) = style_tag(&out)
    {
        let attribute = format!(" default-locale=\"{}\"", escape(&locale));
        match attribute_value(&out[tag.clone()], "default-locale") {
            // From the blank before the name to the closing quotation mark.
            Some(value) => {
                let name = out[tag.start..tag.start + value.start].rfind("default-locale").unwrap_or(0);
                let blank = out[tag.start..tag.start + name].trim_end().len();
                out.replace_range(tag.start + blank..tag.start + value.end + 1, &attribute);
            }
            None => out.insert_str(tag.end, &attribute),
        }
    }
    out
}

/// The locale a style is written for, where it says.
fn default_locale(xml: &str) -> Option<String> {
    let tag = style_tag(xml)?;
    let tag = &xml[tag];
    let value = attribute_value(tag, "default-locale")?;
    Some(unescape(&tag[value]).trim().to_owned()).filter(|l| !l.is_empty())
}

/// The start tag of a style, `<style …`, without its closing `>`.
fn style_tag(xml: &str) -> Option<std::ops::Range<usize>> {
    let (start, _) =
        xml.match_indices("<style").find(|(i, _)| xml[i + 6..].starts_with(|c: char| c.is_whitespace() || c == '>'))?;
    let end = start + xml[start..].find('>')?;
    Some(start..end)
}

/// Where the value of an attribute stands in a tag, within its quotation
/// marks, which may be single or double.
fn attribute_value(tag: &str, name: &str) -> Option<std::ops::Range<usize>> {
    let (at, _) = tag.match_indices(name).find(|(i, _)| {
        tag[..*i].ends_with(char::is_whitespace) && tag[i + name.len()..].trim_start().starts_with('=')
    })?;
    let after = &tag[at + name.len()..];
    let after_equals = after.trim_start()[1..].trim_start();
    let quote = after_equals.chars().next().filter(|c| *c == '"' || *c == '\'')?;
    let start = tag.len() - after_equals.len() + 1;
    let end = start + tag[start..].find(quote)?;
    Some(start..end)
}

/// Gives a style another title and id, leaving all else as it is.
pub fn rename(xml: &str, id: &str, title: &str) -> String {
    let mut out = xml.to_owned();
    if let (Some(a), Some(b)) = (out.find("<title>"), out.find("</title>"))
        && a < b
    {
        out.replace_range(a + 7..b, &escape(title));
    }
    if let Some(a) = out.find("<id>")
        && let Some(b) = out[a..].find("</id>")
    {
        out.replace_range(a + 4..a + b, &format!("https://glaukopis.invalid/styles/{id}"));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    const STYLE: &str = r#"<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0">
  <info>
    <title>Test &amp; Trial</title>
    <id>http://www.zotero.org/styles/test</id>
    <category citation-format="author-date"/>
  </info>
  <citation><layout><text variable="title"/></layout></citation>
  <bibliography><layout><text variable="title"/></layout></bibliography>
</style>"#;

    const DEPENDENT: &str = r#"<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" version="1.0" default-locale="en-GB">
  <info>
    <title>The Classical Quarterly</title>
    <id>http://www.zotero.org/styles/the-classical-quarterly</id>
    <link href="http://www.zotero.org/styles/some-parent" rel="independent-parent"/>
  </info>
</style>"#;

    fn styles() -> (tempfile::TempDir, Styles) {
        let tmp = tempfile::tempdir().unwrap();
        let resources = tmp.path().join("resources");
        fs::create_dir_all(resources.join("csl/styles")).unwrap();
        fs::write(resources.join("csl/styles/test.csl"), STYLE).unwrap();
        fs::write(
            resources.join("csl/index.json"),
            r#"[{"i":"nature","t":"Nature","f":"numeric"},{"i":"nature-reviews-cancer","t":"Nature Reviews Cancer","p":"nature","f":"numeric"},{"i":"test","t":"Test & Trial","f":"author-date"}]"#,
        )
        .unwrap();
        let s = Styles::new(&resources, &tmp.path().join("own"));
        (tmp, s)
    }

    #[test]
    fn what_a_style_says_of_itself() {
        assert_eq!(describe(STYLE), ("Test & Trial".into(), "author-date".into(), true));
        assert_eq!(parent_of(DEPENDENT).as_deref(), Some("some-parent"));
        assert!(check_style(STYLE).is_ok());
        assert!(check_style(DEPENDENT).is_err());
        assert!(check_style("<html/>").is_err());
        assert!(check_style("not xml").is_err());
    }

    #[test]
    fn renaming() {
        let out = rename(STYLE, "mine", "Mine <2>");
        assert_eq!(describe(&out).0, "Mine <2>");
        assert!(out.contains("<id>https://glaukopis.invalid/styles/mine</id>"));
        assert!(check_style(&out).is_ok());
    }

    /// A style that names another is kept as the other's form under its own
    /// name, and in its own locale: the usual reason it exists.
    #[test]
    fn a_style_that_names_another_keeps_its_own_locale() {
        let kept = named_form(DEPENDENT, STYLE, "the-classical-quarterly");
        assert_eq!(describe(&kept).0, "The Classical Quarterly");
        assert_eq!(default_locale(&kept).as_deref(), Some("en-GB"));
        assert!(kept.contains("<id>https://glaukopis.invalid/styles/the-classical-quarterly</id>"));
        assert!(check_style(&kept).is_ok());
        // Where the form has a locale of its own, the dependent's takes its place.
        let american = STYLE.replace("version=\"1.0\">", "version=\"1.0\" default-locale='en-US'>");
        let kept = named_form(DEPENDENT, &american, "the-classical-quarterly");
        assert_eq!(default_locale(&kept).as_deref(), Some("en-GB"));
        assert_eq!(kept.matches("default-locale").count(), 1);
        // A dependent without one has the form's.
        let plain = DEPENDENT.replace(" default-locale=\"en-GB\"", "");
        assert_eq!(default_locale(&named_form(&plain, &american, "q")).as_deref(), Some("en-US"));
        assert_eq!(default_locale(&named_form(&plain, STYLE, "q")), None);
    }

    #[test]
    fn listing_saving_deleting() {
        let (tmp, s) = styles();
        assert_eq!(s.list().len(), 1);
        assert!(s.path("test").is_ok());
        assert!(s.path("../test").is_err());

        let saved = s.save("test", "Test, as my publisher wants it", STYLE).unwrap();
        assert_eq!(saved.id, "test-as-my-publisher-wants-it");
        assert!(saved.own);
        assert_eq!(s.list().len(), 2);
        // Changing one's own keeps its id.
        let again = s.save(&saved.id, "Another name", STYLE).unwrap();
        assert_eq!(again.id, saved.id);
        assert_eq!(s.get(&saved.id).unwrap().title, "Another name");

        let file = tmp.path().join("From a Colleague.csl");
        fs::write(&file, STYLE).unwrap();
        assert_eq!(s.import(&file).unwrap().id, "from-a-colleague");
        fs::write(&file, DEPENDENT).unwrap();
        assert!(s.import(&file).is_err());

        assert!(s.delete("test").is_err());
        s.delete(&saved.id).unwrap();
        assert_eq!(s.path_or_default("gone").unwrap().file_name().unwrap(), "test.csl");
    }

    #[test]
    fn searching_all_styles() {
        let (_tmp, s) = styles();
        let found = s.search("nature", 10);
        assert_eq!(found.iter().map(|f| f.id.as_str()).collect::<Vec<_>>(), vec!["nature", "nature-reviews-cancer"]);
        assert_eq!(found[1].parent.as_deref(), Some("nature"));
        assert_eq!(s.search("cancer nat", 10).len(), 1);
        assert!(s.search("test", 10)[0].installed);
        assert!(s.search("  ", 10).is_empty());
    }
}
