//! The names of languages, as babel has them: what BibLaTeX's `langid`
//! holds, and by which an entry is hyphenated in the language it is written
//! in. A name that babel does not know would stop the typesetting, so only
//! those are given that it knows.

use crate::bib::parser::normalise_space;

/// Languages as babel names them, each with the codes and names by which it
/// is found: in Zotero's field of the language, in the records of catalogues
/// (ISO 639-1 and 639-2, the bibliographic codes and the others), in CSL.
const LANGUAGES: &[(&str, &[&str])] = &[
    ("afrikaans", &["af", "afr", "afrikaans"]),
    ("albanian", &["sq", "sqi", "alb", "albanian", "shqip"]),
    ("ancientgreek", &["grc", "ancient greek", "greek, ancient", "classical greek", "altgriechisch", "gammelgresk"]),
    ("arabic", &["ar", "ara", "arabic", "العربية"]),
    ("armenian", &["hy", "hye", "arm", "armenian"]),
    ("basque", &["eu", "eus", "baq", "basque", "euskara"]),
    ("bulgarian", &["bg", "bul", "bulgarian", "български"]),
    ("catalan", &["ca", "cat", "catalan", "català"]),
    ("chinese", &["zh", "zho", "chi", "chinese", "中文"]),
    ("coptic", &["cop", "coptic"]),
    ("croatian", &["hr", "hrv", "croatian", "hrvatski"]),
    ("czech", &["cs", "ces", "cze", "cz", "czech", "čeština"]),
    ("danish", &["da", "dan", "danish", "dansk"]),
    ("dutch", &["nl", "nld", "dut", "dutch", "nederlands"]),
    ("english", &["en", "eng", "english", "engelsk", "englisch", "anglais"]),
    ("esperanto", &["eo", "epo", "esperanto"]),
    ("estonian", &["et", "est", "estonian", "eesti"]),
    ("finnish", &["fi", "fin", "finnish", "suomi"]),
    ("french", &["fr", "fra", "fre", "french", "français", "francais", "fransk", "französisch"]),
    ("galician", &["gl", "glg", "galician", "galego"]),
    ("georgian", &["ka", "kat", "geo", "georgian"]),
    ("german", &["de", "deu", "ger", "german", "deutsch", "tysk", "allemand"]),
    ("greek", &["el", "ell", "gre", "greek", "modern greek", "ελληνικά", "gresk", "griechisch"]),
    ("hebrew", &["he", "heb", "iw", "hebrew", "עברית"]),
    ("hindi", &["hi", "hin", "hindi"]),
    ("icelandic", &["is", "isl", "ice", "icelandic", "íslenska"]),
    ("indonesian", &["id", "ind", "indonesian"]),
    ("irish", &["ga", "gle", "irish", "gaeilge"]),
    ("italian", &["it", "ita", "italian", "italiano", "italiensk", "italienisch", "italien"]),
    ("japanese", &["ja", "jpn", "japanese", "日本語"]),
    ("korean", &["ko", "kor", "korean", "한국어"]),
    ("latin", &["la", "lat", "latin", "latina", "latein"]),
    ("latvian", &["lv", "lav", "latvian"]),
    ("lithuanian", &["lt", "lit", "lithuanian"]),
    ("magyar", &["hu", "hun", "hungarian", "magyar"]),
    ("norsk", &["nb", "nob", "no", "nor", "norwegian", "norsk", "bokmål", "norwegian bokmål", "norsk bokmål"]),
    ("nynorsk", &["nn", "nno", "nynorsk", "norwegian nynorsk", "norsk nynorsk"]),
    ("persian", &["fa", "fas", "per", "persian", "farsi", "فارسی"]),
    ("polish", &["pl", "pol", "polish", "polski"]),
    ("portuguese", &["pt", "por", "portuguese", "português"]),
    ("romanian", &["ro", "ron", "rum", "romanian", "română"]),
    ("russian", &["ru", "rus", "russian", "русский"]),
    ("sanskrit", &["sa", "san", "sanskrit"]),
    ("scottish", &["gd", "gla", "scottish gaelic", "gaelic"]),
    ("serbian", &["sr", "srp", "serbian"]),
    ("slovak", &["sk", "slk", "slo", "slovak"]),
    ("slovene", &["sl", "slv", "slovene", "slovenian"]),
    ("spanish", &["es", "spa", "spanish", "español", "espanol", "castellano", "spansk", "spanisch", "espagnol"]),
    ("swedish", &["sv", "swe", "swedish", "svenska", "svensk"]),
    ("syriac", &["syr", "syc", "syriac"]),
    ("thai", &["th", "tha", "thai"]),
    ("turkish", &["tr", "tur", "turkish", "türkçe"]),
    ("ukrainian", &["uk", "ukr", "ukrainian", "українська"]),
    ("vietnamese", &["vi", "vie", "vietnamese"]),
    ("welsh", &["cy", "cym", "wel", "welsh", "cymraeg"]),
];

/// The forms of a language that babel has a name of their own for, by the
/// code of the language and of the country.
const VARIANTS: &[(&str, &str, &str)] = &[
    ("en", "us", "american"),
    ("en", "gb", "british"),
    ("en", "uk", "british"),
    ("en", "ca", "canadian"),
    ("en", "au", "australian"),
    ("en", "nz", "newzealand"),
    ("de", "at", "austrian"),
    ("de", "ch", "swissgerman"),
    ("fr", "ca", "canadien"),
    ("pt", "br", "brazil"),
];

/// The name by which babel knows a language, from a code (`en`, `en-GB`,
/// `deu`) or a name ("English", "Deutsch"). This is what BibLaTeX's `langid`
/// holds, and by it the entry is hyphenated.
pub fn babel(language: &str) -> Option<&'static str> {
    let lower = normalise_space(language).to_lowercase();
    let lower = lower.trim_end_matches('.');
    let find = |word: &str| LANGUAGES.iter().find(|(_, known)| known.contains(&word)).map(|(name, _)| *name);
    if let Some(name) = find(lower) {
        return Some(name);
    }
    // A code with more to it: `en-GB`, `de_AT`, `sr-Latn-RS`.
    let mut tags = lower.split(['-', '_']);
    let code = tags.next().filter(|code| (2..=3).contains(&code.len()))?;
    let base = find(code)?;
    let region = tags.find(|tag| tag.len() == 2);
    let variant = region.and_then(|region| {
        VARIANTS.iter().find(|(of, country, _)| find(of) == Some(base) && *country == region).map(|(_, _, name)| *name)
    });
    Some(variant.unwrap_or(base))
}

/// Several languages in one field, "grc; en" or "Latin and German", as a
/// list for BibLaTeX's `language`. None when any of them is not known.
pub fn several(value: &str) -> Option<String> {
    let lower = value.replace(" and ", ";").replace(" & ", ";");
    let names: Vec<&str> = lower
        .split([';', ',', '/'])
        .map(str::trim)
        .filter(|part| !part.is_empty())
        .map(babel)
        .collect::<Option<_>>()?;
    (names.len() > 1).then(|| names.join(" and "))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn languages_known_and_unknown() {
        assert_eq!(babel("en"), Some("english"));
        assert_eq!(babel("en-US"), Some("american"));
        assert_eq!(babel("en_GB"), Some("british"));
        assert_eq!(babel("eng"), Some("english"));
        assert_eq!(babel("English"), Some("english"));
        assert_eq!(babel("de-DE"), Some("german"));
        assert_eq!(babel("de-AT"), Some("austrian"));
        assert_eq!(babel("Deutsch"), Some("german"));
        assert_eq!(babel("nb"), Some("norsk"));
        assert_eq!(babel("nb-NO"), Some("norsk"));
        assert_eq!(babel("Norsk"), Some("norsk"));
        assert_eq!(babel("nn"), Some("nynorsk"));
        assert_eq!(babel("grc"), Some("ancientgreek"));
        assert_eq!(babel("Ancient Greek"), Some("ancientgreek"));
        assert_eq!(babel("el"), Some("greek"));
        assert_eq!(babel("pt-BR"), Some("brazil"));
        assert_eq!(babel("sr-Latn-RS"), Some("serbian"));
        assert_eq!(babel("la"), Some("latin"));
        assert_eq!(babel(" FRE "), Some("french"));
        assert_eq!(babel("ger"), Some("german"));
        assert_eq!(babel("nob"), Some("norsk"));
        assert_eq!(babel("en-AU"), Some("australian"));
        assert_eq!(babel("Klingon"), None);
        for unknown in ["und", "mul", "zxx", "|||", "xx", "tlh"] {
            assert_eq!(babel(unknown), None, "{unknown}");
        }
        assert_eq!(babel("english-ish"), None);
        assert_eq!(babel(""), None);
        assert_eq!(several("grc; en").as_deref(), Some("ancientgreek and english"));
        assert_eq!(several("Latin and German").as_deref(), Some("latin and german"));
        assert_eq!(several("lat/ger/xx"), None);
        assert_eq!(several("en"), None);
    }
}
