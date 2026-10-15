//! Adobe's expert names, which the standard list of glyph names sends into
//! the private-use range or does not know: old-style figures to digits,
//! small capitals to the small letters they stand for, superior and
//! inferior figures, and the ligatures to their letters.

use unicode_normalization::UnicodeNormalization;

const DIGITS: [&str; 10] = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const SUPERIOR: [char; 10] = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
const INFERIOR: [char; 10] = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

/// Signs by their names, read plainly where an expert set gives them a
/// figure's or a small capital's form.
const SIGNS: &[(&str, &str)] = &[
    ("comma", ","),
    ("period", "."),
    ("hyphen", "-"),
    ("parenleft", "("),
    ("parenright", ")"),
    ("dollar", "$"),
    ("cent", "¢"),
    ("exclam", "!"),
    ("exclamdown", "¡"),
    ("question", "?"),
    ("questiondown", "¿"),
    ("ampersand", "&"),
];

/// The accents of the small capitals, as combining marks, and the spacing
/// accents they stand for alone (`Gravesmall`).
const ACCENTS: &[(&str, char, char)] = &[
    ("grave", '\u{0300}', '`'),
    ("acute", '\u{0301}', '´'),
    ("circumflex", '\u{0302}', 'ˆ'),
    ("tilde", '\u{0303}', '˜'),
    ("macron", '\u{0304}', '¯'),
    ("breve", '\u{0306}', '˘'),
    ("dotaccent", '\u{0307}', '˙'),
    ("dieresis", '\u{0308}', '¨'),
    ("ring", '\u{030a}', '˚'),
    ("hungarumlaut", '\u{030b}', '˝'),
    ("caron", '\u{030c}', 'ˇ'),
    ("cedilla", '\u{0327}', '¸'),
    ("ogonek", '\u{0328}', '˛'),
];

/// Letters whose names are more than one capital.
const LETTERS: &[(&str, &str)] =
    &[("AE", "æ"), ("OE", "œ"), ("Eth", "ð"), ("Thorn", "þ"), ("Lslash", "ł"), ("Oslash", "ø"), ("Germandbls", "ß")];

/// The text an expert name stands for.
pub(super) fn by_name(name: &str) -> Option<String> {
    if let Some(figure) = name.strip_suffix("oldstyle") {
        return digit(figure).map(|d| d.to_string()).or_else(|| sign(figure));
    }
    if let Some(figure) = name.strip_suffix("superior") {
        return digit(figure)
            .map(|d| SUPERIOR[d].to_string())
            .or_else(|| sign(figure))
            .or_else(|| single_small(figure));
    }
    if let Some(figure) = name.strip_suffix("inferior") {
        return digit(figure).map(|d| INFERIOR[d].to_string()).or_else(|| sign(figure));
    }
    if let Some(capital) = name.strip_suffix("small") {
        return small_capital(capital);
    }
    if let Some(sign) = name.strip_suffix("fitted") {
        return digit(sign).map(|d| d.to_string());
    }
    ligature(name)
}

fn digit(name: &str) -> Option<usize> {
    DIGITS.iter().position(|d| *d == name)
}

fn sign(name: &str) -> Option<String> {
    SIGNS.iter().find(|(n, _)| *n == name).map(|(_, s)| (*s).to_owned())
}

/// A small letter written as a superior one (`asuperior`): the letter.
fn single_small(name: &str) -> Option<String> {
    let mut chars = name.chars();
    match (chars.next(), chars.next()) {
        (Some(c), None) if c.is_ascii_lowercase() => Some(c.to_string()),
        _ => None,
    }
}

/// A small capital by the name of its capital (`A`, `Agrave`, `AE`,
/// `Oslash`), or of an accent alone (`Gravesmall`), or of a sign
/// (`exclamsmall`): the small letter, the accent or the sign.
fn small_capital(name: &str) -> Option<String> {
    if let Some(sign) = sign(name) {
        return Some(sign);
    }
    let lower = name.to_ascii_lowercase();
    if name.starts_with(|c: char| c.is_ascii_uppercase())
        && let Some((_, _, spacing)) = ACCENTS.iter().find(|(n, ..)| *n == lower)
    {
        return Some(spacing.to_string());
    }
    let (letter, rest) = if let Some((spelled, letter)) =
        LETTERS.iter().filter(|(spelled, _)| name.starts_with(spelled)).max_by_key(|(spelled, _)| spelled.len())
    {
        ((*letter).to_owned(), &name[spelled.len()..])
    } else {
        let first = name.chars().next().filter(char::is_ascii_uppercase)?;
        (first.to_ascii_lowercase().to_string(), &name[1..])
    };
    if rest.is_empty() {
        return Some(letter);
    }
    let (_, mark, _) = ACCENTS.iter().find(|(n, ..)| *n == rest)?;
    Some(format!("{letter}{mark}").nfc().collect())
}

/// A ligature of Latin letters: `ff`, `ffi`, `f_f_l`, `s_t`.
fn ligature(name: &str) -> Option<String> {
    if matches!(name, "ff" | "fi" | "fl" | "ffi" | "ffl") {
        return Some(name.to_owned());
    }
    let parts: Vec<&str> = name.split('_').collect();
    if parts.len() < 2 {
        return None;
    }
    parts.iter().all(|p| p.len() == 1 && p.bytes().all(|b| b.is_ascii_alphabetic())).then(|| parts.concat())
}
