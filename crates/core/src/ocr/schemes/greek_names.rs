//! Composed Greek glyph names, as Porson and other scholarly fonts name
//! their glyphs: a letter, then any of `asper`, `lenis`, `acute`, `grave`,
//! `tilde`, `dieresis`, `iota`, in any order, capital or small
//! (`etaasper` ἡ, `Alphalenisacute` Ἄ, `omegatildeiota` ῷ). A name of marks
//! alone is the spacing sign (`asperacute` ῞), and `lenis` alone is the
//! elision mark ᾽, which `mend_greek` composes with a capital after it.

use unicode_normalization::UnicodeNormalization;

/// The letters by their names, small; the longest are tried first where
/// one name begins another.
const LETTERS: &[(&str, char, char)] = &[
    ("sigmafinalt", 'ς', 'Σ'),
    ("sigmafinal", 'ς', 'Σ'),
    ("sigmalunate", 'σ', 'Σ'),
    ("sigma1", 'ς', 'Σ'),
    ("sigma", 'σ', 'Σ'),
    ("alpha", 'α', 'Α'),
    ("beta", 'β', 'Β'),
    ("gamma", 'γ', 'Γ'),
    ("delta", 'δ', 'Δ'),
    ("epsilon", 'ε', 'Ε'),
    ("zeta", 'ζ', 'Ζ'),
    ("eta", 'η', 'Η'),
    ("theta", 'θ', 'Θ'),
    ("iota", 'ι', 'Ι'),
    ("kappa", 'κ', 'Κ'),
    ("lambda", 'λ', 'Λ'),
    ("lamda", 'λ', 'Λ'),
    ("mu", 'μ', 'Μ'),
    ("nu", 'ν', 'Ν'),
    ("xi", 'ξ', 'Ξ'),
    ("omicron", 'ο', 'Ο'),
    ("pi", 'π', 'Π'),
    ("rho", 'ρ', 'Ρ'),
    ("tau", 'τ', 'Τ'),
    ("upsilon", 'υ', 'Υ'),
    ("phi", 'φ', 'Φ'),
    ("chi", 'χ', 'Χ'),
    ("psi", 'ψ', 'Ψ'),
    ("omega", 'ω', 'Ω'),
    ("digamma", 'ϝ', 'Ϝ'),
    ("stigma", 'ϛ', 'Ϛ'),
    ("koppa", 'ϟ', 'Ϟ'),
    ("sampi", 'ϡ', 'Ϡ'),
];

/// The marks by their names: Porson's, and the names of Unicode.
const MARKS: &[(&str, Mark)] = &[
    ("asper", Mark::Asper),
    ("dasia", Mark::Asper),
    ("lenis", Mark::Lenis),
    ("psili", Mark::Lenis),
    ("acute", Mark::Acute),
    ("oxia", Mark::Acute),
    ("tonos", Mark::Acute),
    ("grave", Mark::Grave),
    ("varia", Mark::Grave),
    ("tilde", Mark::Tilde),
    ("perispomeni", Mark::Tilde),
    ("dieresis", Mark::Dieresis),
    ("diaeresis", Mark::Dieresis),
    ("dialytika", Mark::Dieresis),
    ("iota", Mark::Iota),
    ("ypogegrammeni", Mark::Iota),
    ("prosgegrammeni", Mark::Iota),
    ("macron", Mark::Macron),
    ("breve", Mark::Breve),
];

/// A mark, in the order in which it follows its letter for the composed
/// forms to be found: length, breathing and dieresis, accent, iota.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum Mark {
    Macron,
    Breve,
    Asper,
    Lenis,
    Dieresis,
    Acute,
    Grave,
    Tilde,
    Iota,
}

impl Mark {
    fn combining(self) -> char {
        match self {
            Mark::Macron => '\u{0304}',
            Mark::Breve => '\u{0306}',
            Mark::Asper => '\u{0314}',
            Mark::Lenis => '\u{0313}',
            Mark::Dieresis => '\u{0308}',
            Mark::Acute => '\u{0301}',
            Mark::Grave => '\u{0300}',
            Mark::Tilde => '\u{0342}',
            Mark::Iota => '\u{0345}',
        }
    }
}

/// The spacing signs of marks standing alone, and the combining marks each
/// gives a capital after it.
const SPACING: &[(&[Mark], char, &[char])] = &[
    (&[Mark::Asper], '\u{1ffe}', &['\u{0314}']),
    (&[Mark::Lenis], '\u{1fbd}', &['\u{0313}']),
    (&[Mark::Asper, Mark::Acute], '\u{1fde}', &['\u{0314}', '\u{0301}']),
    (&[Mark::Lenis, Mark::Acute], '\u{1fce}', &['\u{0313}', '\u{0301}']),
    (&[Mark::Asper, Mark::Grave], '\u{1fdd}', &['\u{0314}', '\u{0300}']),
    (&[Mark::Lenis, Mark::Grave], '\u{1fcd}', &['\u{0313}', '\u{0300}']),
    (&[Mark::Asper, Mark::Tilde], '\u{1fdf}', &['\u{0314}', '\u{0342}']),
    (&[Mark::Lenis, Mark::Tilde], '\u{1fcf}', &['\u{0313}', '\u{0342}']),
    (&[Mark::Acute], '\u{0384}', &['\u{0301}']),
    (&[Mark::Grave], '\u{1fef}', &['\u{0300}']),
    (&[Mark::Tilde], '\u{1fc0}', &['\u{0342}']),
    (&[Mark::Dieresis], '\u{a8}', &[]),
    (&[Mark::Dieresis, Mark::Acute], '\u{0385}', &[]),
    (&[Mark::Dieresis, Mark::Grave], '\u{1fed}', &[]),
    (&[Mark::Dieresis, Mark::Tilde], '\u{1fc1}', &[]),
    (&[Mark::Iota], '\u{037a}', &[]),
    (&[Mark::Macron], '\u{af}', &[]),
    (&[Mark::Breve], '\u{2d8}', &[]),
];

/// The combining marks a spacing sign gives the capital after it, where it
/// is one that stands before a capital in print: a breathing or an accent.
/// The psili ᾿ U+1FBF counts as the elision mark ᾽ does.
pub(super) fn marks_of_spacing(c: char) -> Option<&'static [char]> {
    let c = if c == '\u{1fbf}' { '\u{1fbd}' } else { c };
    SPACING.iter().find(|(_, sign, marks)| *sign == c && !marks.is_empty()).map(|(_, _, marks)| *marks)
}

/// Whether a name is that of marks alone, breathings and accents with no
/// letter: a glyph that stands over the letter before it.
pub(super) fn is_marks_name(name: &str) -> bool {
    parse(name).is_some_and(|p| p.letter.is_none() && !p.marks.is_empty())
}

/// The combining marks of a spacing sign that stands after the letter it
/// belongs to: the Greek spacing signs of the table, and the accents of the
/// Latin fonts (´ ` ¨ ˜) that a Greek font's map may give for its own.
pub(super) fn marks_after(c: char) -> Option<Vec<char>> {
    let c = if c == '\u{1fbf}' { '\u{1fbd}' } else { c };
    match c {
        '\u{b4}' => return Some(vec!['\u{0301}']),
        '`' => return Some(vec!['\u{0300}']),
        '\u{2dc}' => return Some(vec!['\u{0342}']),
        _ => {}
    }
    SPACING
        .iter()
        .find(|(_, sign, _)| *sign == c)
        .filter(|(marks, ..)| !marks.iter().any(|m| matches!(m, Mark::Macron | Mark::Breve)))
        .map(|(marks, ..)| marks.iter().map(|m| m.combining()).collect())
}

/// A name taken apart: its letter, capital or not, and its marks.
struct Parsed {
    letter: Option<char>,
    marks: Vec<Mark>,
}

fn parse(name: &str) -> Option<Parsed> {
    let mut chars = name.chars();
    let first = chars.next()?;
    let capital = first.is_ascii_uppercase();
    let lower = name.to_ascii_lowercase();
    if !lower.bytes().all(|b| b.is_ascii_lowercase() || b == b'1') {
        return None;
    }
    let mut rest = lower.as_str();
    let mut letter = None;
    // The longest letter that begins the name.
    if let Some((spelled, small, cap)) =
        LETTERS.iter().filter(|(spelled, ..)| rest.starts_with(spelled)).max_by_key(|(spelled, ..)| spelled.len())
    {
        letter = Some(if capital { *cap } else { *small });
        rest = &rest[spelled.len()..];
    } else if capital {
        // Marks alone are not written with a capital.
        return None;
    }
    let mut marks = Vec::new();
    while !rest.is_empty() {
        let (spelled, mark) =
            MARKS.iter().filter(|(spelled, _)| rest.starts_with(spelled)).max_by_key(|(spelled, _)| spelled.len())?;
        if marks.contains(mark) {
            return None;
        }
        marks.push(*mark);
        rest = &rest[spelled.len()..];
    }
    if letter.is_none() && marks.is_empty() {
        return None;
    }
    marks.sort();
    Some(Parsed { letter, marks })
}

/// The text a Greek glyph name stands for.
pub(super) fn by_name(name: &str) -> Option<String> {
    let parsed = parse(name)?;
    match parsed.letter {
        Some(letter) => Some(
            std::iter::once(letter)
                .chain(parsed.marks.iter().map(|m| m.combining()))
                .collect::<String>()
                .nfc()
                .collect(),
        ),
        None => {
            SPACING.iter().find(|(marks, ..)| *marks == parsed.marks.as_slice()).map(|(_, sign, _)| sign.to_string())
        }
    }
}

/// Whether a name says a Greek letter or sign beyond doubt: a letter, a
/// breathing, or more than one mark. An accent alone (`acute`, `tilde`)
/// names the Latin sign as well.
pub(super) fn says_greek(name: &str) -> bool {
    parse(name).is_some_and(|p| {
        p.letter.is_some()
            || p.marks.len() > 1
            || p.marks.iter().any(|m| matches!(m, Mark::Asper | Mark::Lenis | Mark::Iota))
    })
}
