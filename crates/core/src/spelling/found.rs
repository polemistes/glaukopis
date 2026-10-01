//! Where dictionaries are found, and which of them a language is checked with.
//!
//! A dictionary of Hunspell is a pair of files named by the language they
//! are for, `en_US.aff` and `en_US.dic`. Some names say more than the
//! language: `en_GB-ise`, `de_DE_frami`. The language is taken from the
//! beginning of the name, and the rest is left aside.

use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;

/// Where a dictionary was found.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Source {
    /// Put in the data directory by the writer.
    Own,
    /// Came with the application.
    Application,
    /// Installed on the system.
    System,
}

/// A folder that dictionaries are looked for in.
#[derive(Debug, Clone)]
pub struct Place {
    pub dir: PathBuf,
    pub source: Source,
}

impl Place {
    pub fn new(dir: impl Into<PathBuf>, source: Source) -> Self {
        Place { dir: dir.into(), source }
    }
}

/// A dictionary that was found.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Found {
    /// The language it is for, as a tag: `en-US`, `nb-NO`.
    pub tag: String,
    /// The name of its files: `en_US`.
    pub name: String,
    pub source: Source,
    /// The folder its files are in.
    pub dir: PathBuf,
}

impl Found {
    pub fn aff(&self) -> PathBuf {
        self.dir.join(format!("{}.aff", self.name))
    }

    pub fn dic(&self) -> PathBuf {
        self.dir.join(format!("{}.dic", self.name))
    }

    /// More words for the dictionary, where there are: a list of the same
    /// name in `extra/` beside it, written as its own list is and read with
    /// its affix file. None of the dictionaries of the application has one
    /// now; a dictionary of one's own may (see `resources/dictionaries/README.md`).
    pub fn extra(&self) -> PathBuf {
        self.dir.join("extra").join(format!("{}.dic", self.name))
    }
}

/// The folders of the system that hold dictionaries: where Hunspell looks,
/// and where the packages of the systems put them.
pub fn system_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    // Where Hunspell is told to look.
    if let Some(path) = std::env::var_os("DICPATH") {
        dirs.extend(std::env::split_paths(&path).filter(|p| !p.as_os_str().is_empty()));
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    dirs.extend(
        [
            "/usr/share/hunspell",
            "/usr/share/myspell",
            "/usr/share/myspell/dicts",
            "/usr/local/share/hunspell",
            "/usr/local/share/myspell",
        ]
        .map(PathBuf::from),
    );
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = std::env::var_os("HOME") {
            dirs.push(PathBuf::from(home).join("Library/Spelling"));
        }
        dirs.extend(
            ["/Library/Spelling", "/opt/homebrew/share/hunspell", "/usr/local/share/hunspell"].map(PathBuf::from),
        );
    }
    dirs
}

/// The dictionaries in the places, one for each language: the first that
/// is found, in the order of the places.
pub fn find(places: &[Place]) -> Vec<Found> {
    let mut found: Vec<Found> = Vec::new();
    for place in places {
        let mut here = in_dir(&place.dir, place.source);
        // The plainest name first: `en_GB` before `en_GB-ise`.
        here.sort_by(|a, b| a.name.cmp(&b.name));
        for dictionary in here {
            if !found.iter().any(|f| f.tag == dictionary.tag) {
                found.push(dictionary);
            }
        }
    }
    found.sort_by(|a, b| a.tag.cmp(&b.tag));
    found
}

fn in_dir(dir: &Path, source: Source) -> Vec<Found> {
    let Ok(entries) = fs::read_dir(dir) else { return Vec::new() };
    entries
        .flatten()
        .filter_map(|entry| {
            let path = entry.path();
            if path.extension()? != "aff" {
                return None;
            }
            let name = path.file_stem()?.to_str()?.to_owned();
            let tag = tag_of_name(&name)?;
            let found = Found { tag, name, source, dir: dir.to_owned() };
            found.dic().is_file().then_some(found)
        })
        .collect()
}

/// The language a dictionary is for, from the name of its files: `en_US` is
/// `en-US`, `sr-Latn` is `sr-Latn`, `de_DE_frami` is `de-DE`. None when the
/// name does not begin with a language.
pub fn tag_of_name(name: &str) -> Option<String> {
    let mut parts = name.split(['_', '-']);
    let language = parts.next()?;
    if !(2..=3).contains(&language.len()) || !language.chars().all(|c| c.is_ascii_alphabetic()) {
        return None;
    }
    let mut tag = language.to_ascii_lowercase();
    let mut rest = parts.peekable();
    if let Some(script) = rest.next_if(|p| p.len() == 4 && p.chars().all(|c| c.is_ascii_alphabetic())) {
        tag.push('-');
        tag.push_str(&script[..1].to_ascii_uppercase());
        tag.push_str(&script[1..].to_ascii_lowercase());
    }
    if let Some(region) = rest.next_if(|p| {
        (p.len() == 2 && p.chars().all(|c| c.is_ascii_alphabetic()))
            || (p.len() == 3 && p.chars().all(|c| c.is_ascii_digit()))
    }) {
        tag.push('-');
        tag.push_str(&region.to_ascii_uppercase());
    }
    Some(tag)
}

/// A tag as the dictionaries are named by: the language in small letters
/// and the country in capitals, `nb-NO`; Norwegian without more is Bokmål.
pub fn normalise(language: &str) -> String {
    let mut parts = language.trim().split(['-', '_']).filter(|p| !p.is_empty());
    let first = parts.next().unwrap_or("en").to_ascii_lowercase();
    let mut tag = if first == "no" { "nb".to_owned() } else { first };
    for part in parts {
        tag.push('-');
        match part.len() {
            2 => tag.push_str(&part.to_ascii_uppercase()),
            4 => {
                tag.push_str(&part[..1].to_ascii_uppercase());
                tag.push_str(&part[1..].to_ascii_lowercase());
            }
            _ => tag.push_str(part),
        }
    }
    tag
}

/// The language of a tag, without its country: `en` of `en-GB`.
pub fn primary(tag: &str) -> &str {
    tag.split('-').next().unwrap_or(tag)
}

/// The country whose dictionary stands for a language as a whole, where it
/// is not the one written as the language is.
fn usual_region(language: &str) -> Option<&'static str> {
    Some(match language {
        "nb" | "nn" => "NO",
        "sv" => "SE",
        "da" => "DK",
        "el" => "GR",
        "cs" => "CZ",
        "uk" => "UA",
        "ca" | "eu" | "gl" => "ES",
        "et" => "EE",
        "sl" => "SI",
        "he" => "IL",
        "sr" => "RS",
        "ga" => "IE",
        "cy" | "gd" => "GB",
        _ => return None,
    })
}

/// The dictionaries a text in the language is checked with, from those
/// found: the one of the language as it is written; for English without a
/// country, or of a country without a dictionary of its own, the American
/// and the British both; for another language, the one that stands for it
/// as a whole (`de-DE` for `de`), or else the first there is. None, where
/// there is no dictionary of the language. A text without a language is in
/// English (ADR 0020).
pub fn choose<'a>(found: &'a [Found], language: Option<&str>) -> Vec<&'a Found> {
    let tag = normalise(language.filter(|l| !l.trim().is_empty()).unwrap_or("en"));
    if let Some(exact) = found.iter().find(|f| f.tag.eq_ignore_ascii_case(&tag)) {
        return vec![exact];
    }
    let language = primary(&tag);
    let of_language: Vec<&Found> = found.iter().filter(|f| primary(&f.tag) == language).collect();
    if language == "en" {
        let both: Vec<&Found> =
            ["en-US", "en-GB"].iter().filter_map(|t| of_language.iter().find(|f| f.tag == *t).copied()).collect();
        if !both.is_empty() {
            return both;
        }
    }
    let usual = format!("{language}-{}", usual_region(language).map_or(language.to_ascii_uppercase(), str::to_owned));
    let whole = of_language.iter().find(|f| f.tag == usual || f.tag == language);
    whole.or(of_language.first()).map(|f| vec![*f]).unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dictionary(dir: &Path, name: &str) {
        fs::create_dir_all(dir).unwrap();
        fs::write(dir.join(format!("{name}.aff")), "SET UTF-8\n").unwrap();
        fs::write(dir.join(format!("{name}.dic")), "1\nword\n").unwrap();
    }

    #[test]
    fn names_give_languages() {
        assert_eq!(tag_of_name("en_US").as_deref(), Some("en-US"));
        assert_eq!(tag_of_name("nb_NO").as_deref(), Some("nb-NO"));
        assert_eq!(tag_of_name("en_GB-ise").as_deref(), Some("en-GB"));
        assert_eq!(tag_of_name("de_DE_frami").as_deref(), Some("de-DE"));
        assert_eq!(tag_of_name("sr-Latn").as_deref(), Some("sr-Latn"));
        assert_eq!(tag_of_name("es_419").as_deref(), Some("es-419"));
        assert_eq!(tag_of_name("la").as_deref(), Some("la"));
        assert_eq!(tag_of_name("hyph_en_US"), None);
        assert_eq!(tag_of_name("médical"), None);
    }

    #[test]
    fn tags_are_written_as_the_dictionaries_are_named() {
        assert_eq!(normalise("en-gb"), "en-GB");
        assert_eq!(normalise("no"), "nb");
        assert_eq!(normalise("no_NO"), "nb-NO");
        assert_eq!(normalise("sr-latn-rs"), "sr-Latn-RS");
    }

    #[test]
    fn the_first_place_that_has_a_language_has_it() {
        let tmp = tempfile::tempdir().unwrap();
        let own = tmp.path().join("own");
        let application = tmp.path().join("application");
        let system = tmp.path().join("system");
        dictionary(&own, "nb_NO");
        dictionary(&application, "nb_NO");
        dictionary(&application, "en_US");
        dictionary(&system, "en_GB-ise");
        dictionary(&system, "en_GB");
        dictionary(&system, "de_DE");
        // A file of hyphenation, which is not a dictionary of words.
        fs::write(system.join("hyph_de_DE.dic"), "ISO8859-1\n").unwrap();
        // Half a dictionary.
        fs::write(system.join("fr_FR.aff"), "SET UTF-8\n").unwrap();

        let found = find(&[
            Place::new(&own, Source::Own),
            Place::new(&application, Source::Application),
            Place::new(&system, Source::System),
            Place::new(tmp.path().join("nowhere"), Source::System),
        ]);
        let listed: Vec<(&str, &str, Source)> =
            found.iter().map(|f| (f.tag.as_str(), f.name.as_str(), f.source)).collect();
        assert_eq!(
            listed,
            [
                ("de-DE", "de_DE", Source::System),
                ("en-GB", "en_GB", Source::System),
                ("en-US", "en_US", Source::Application),
                ("nb-NO", "nb_NO", Source::Own),
            ]
        );
    }

    #[test]
    fn a_language_is_checked_with_its_dictionaries() {
        let tmp = tempfile::tempdir().unwrap();
        for name in ["en_US", "en_GB", "nb_NO", "nn_NO", "de_AT", "de_DE", "sv_FI", "sv_SE", "el_GR"] {
            dictionary(tmp.path(), name);
        }
        let found = find(&[Place::new(tmp.path(), Source::System)]);
        let chosen = |language: Option<&str>| -> Vec<String> {
            choose(&found, language).iter().map(|f| f.tag.clone()).collect()
        };
        assert_eq!(chosen(Some("en-GB")), ["en-GB"]);
        assert_eq!(chosen(Some("en")), ["en-US", "en-GB"]);
        assert_eq!(chosen(Some("en-AU")), ["en-US", "en-GB"]);
        // A map that says nothing of its language is in English.
        assert_eq!(chosen(None), ["en-US", "en-GB"]);
        assert_eq!(chosen(Some("")), ["en-US", "en-GB"]);
        assert_eq!(chosen(Some("no")), ["nb-NO"]);
        assert_eq!(chosen(Some("nb")), ["nb-NO"]);
        assert_eq!(chosen(Some("nn")), ["nn-NO"]);
        assert_eq!(chosen(Some("de")), ["de-DE"]);
        assert_eq!(chosen(Some("de-CH")), ["de-DE"]);
        assert_eq!(chosen(Some("sv")), ["sv-SE"]);
        assert_eq!(chosen(Some("el")), ["el-GR"]);
        assert!(chosen(Some("la")).is_empty());
    }
}
