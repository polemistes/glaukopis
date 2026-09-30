//! What a locator counts, as the styles of every language say it: the
//! terms of the locales of CSL (`resources/csl/locator-terms.json`), read
//! once, for the kinds of locator the application knows. By them a citation
//! that was written is read ("p. 73", "S. 73", "kap. 4"), and one that is
//! set is told to Pandoc.

use std::collections::BTreeMap;
use std::sync::OnceLock;

const TERMS_JSON: &str = include_str!("../../../../resources/csl/locator-terms.json");

/// For every locale, the words for every kind of locator, in their forms
/// (`long`, `short`, `symbol`), each in the singular and the plural.
pub type Terms = BTreeMap<String, BTreeMap<String, BTreeMap<String, Vec<String>>>>;

pub fn terms() -> &'static Terms {
    static TERMS: OnceLock<Terms> = OnceLock::new();
    TERMS.get_or_init(|| serde_json::from_str(TERMS_JSON).expect("the bundled locator terms are valid"))
}

/// The kinds of locator the application knows, as CSL names them.
pub const LABELS: [&str; 15] = [
    "page",
    "chapter",
    "section",
    "paragraph",
    "line",
    "verse",
    "book",
    "volume",
    "part",
    "column",
    "folio",
    "figure",
    "note",
    "number",
    "sub-verbo",
];

/// The locale whose words stand for a language tag: the tag itself where
/// there is a locale of it, else the variant that stands for the language
/// as a whole, else American English.
pub fn locale_for(language: Option<&str>) -> &'static str {
    let lang = language.unwrap_or("en-US").trim();
    let all = terms();
    let find = |name: &str| all.keys().find(|k| k.eq_ignore_ascii_case(name)).map(String::as_str);
    if let Some(exact) = find(lang) {
        return exact;
    }
    let primary = lang.split(['-', '_']).next().unwrap_or("en").to_ascii_lowercase();
    let usual = match primary.as_str() {
        "en" => "en-US",
        "de" => "de-DE",
        "fr" => "fr-FR",
        "es" => "es-ES",
        "pt" => "pt-PT",
        "zh" => "zh-CN",
        "sr" => "sr-Latn-RS",
        "no" => "nb-NO",
        _ => "",
    };
    if let Some(found) = find(usual) {
        return found;
    }
    let mut candidates: Vec<&str> = all
        .keys()
        .filter(|k| k.split('-').next().is_some_and(|p| p.eq_ignore_ascii_case(&primary)))
        .map(String::as_str)
        .collect();
    candidates.sort_unstable();
    candidates.first().copied().or_else(|| find("en-US")).unwrap_or("en-US")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_terms_are_there_for_every_kind() {
        let english = &terms()["en-US"];
        for label in LABELS {
            assert!(english.contains_key(label), "{label}");
        }
        assert_eq!(english["page"]["short"], ["p.", "pp."]);
    }

    #[test]
    fn locales_for_languages() {
        assert_eq!(locale_for(Some("nb")), "nb-NO");
        assert_eq!(locale_for(Some("no")), "nb-NO");
        assert_eq!(locale_for(Some("en")), "en-US");
        assert_eq!(locale_for(Some("en-GB")), "en-GB");
        assert_eq!(locale_for(Some("de-AT")), "de-AT");
        assert_eq!(locale_for(Some("de")), "de-DE");
        assert_eq!(locale_for(Some("el")), "el-GR");
        assert_eq!(locale_for(Some("xx")), "en-US");
        assert_eq!(locale_for(None), "en-US");
    }
}
