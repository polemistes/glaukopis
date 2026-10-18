//! Beta Code in the text itself: Greek kept in Latin letters, as the
//! Thesaurus Linguae Graecae keeps it (`mh=nin a)/eide qea\`). The marks
//! follow their letter in any order; a capital is a `*` with its marks
//! between it and the letter or after the letter (`*)a`, `*a)`).
//!
//! A line is taken for Beta Code only when it plainly is, since lines of
//! code, formulas and lettered lists have brackets and slashes after letters
//! as well (`print(x)`, `f(x) = g(x)`, `(a) (b)`, `km/h`):
//!
//! - three letters at least, and one in five, carry a mark;
//! - one mark at least is an accent, a dieresis or an iota (`/ \ = + |`),
//!   or a capital is marked with `*`: brackets alone are not enough;
//! - every mark that follows a letter stands on a vowel, or is a breathing
//!   on a rho, as in Greek, never on another consonant (`f(`, `t(`, `m/`);
//! - no word without a mark is a common word of a language written in Latin
//!   letters.

use unicode_normalization::UnicodeNormalization;

use super::mend_sigmas;

/// Common words of languages written in Latin letters, which say a line is
/// not Beta Code. None of them is a Greek word as Beta Code may write it
/// without marks (such as `de`, `te`, `per`, `kai`, `ton`), and only words
/// without a mark are compared with them.
const COMMON: &[&str] = &[
    // English
    "the", "and", "with", "that", "for", "this", "from", "which", "are", "was",
    // Norwegian, Danish, Swedish
    "det", "som", "ikke", "med", "og", "och", "att", "inte", "eller", "jeg", // German
    "der", "die", "das", "und", "nicht", "mit", "ist", "sich", "auf", "auch", // Dutch
    "het", "een", "van", "niet", "zijn", // French
    "les", "des", "est", "une", "dans", "pour", "qui", "avec", "sur", // Italian, Spanish, Portuguese
    "che", "della", "non", "gli", "sono", "los", "las", "del", "por", "con", "para", "uma", "com", // Latin
    "quod", "sunt", "atque", "enim", "cum", // Polish, Czech
    "nie", "jest", "oraz", "jako", "nebo",
];

/// The vowels of Beta Code, on which its accents, dieresis and iota stand.
fn vowel(c: char) -> bool {
    matches!(c.to_ascii_lowercase(), 'a' | 'e' | 'h' | 'i' | 'o' | 'u' | 'w')
}

fn breathing(c: char) -> bool {
    matches!(c, ')' | '(')
}

fn letter(c: char) -> Option<char> {
    Some(match c.to_ascii_lowercase() {
        'a' => 'α',
        'b' => 'β',
        'g' => 'γ',
        'd' => 'δ',
        'e' => 'ε',
        'z' => 'ζ',
        'h' => 'η',
        'q' => 'θ',
        'i' => 'ι',
        'k' => 'κ',
        'l' => 'λ',
        'm' => 'μ',
        'n' => 'ν',
        'c' => 'ξ',
        'o' => 'ο',
        'p' => 'π',
        'r' => 'ρ',
        's' | 'j' => 'σ',
        't' => 'τ',
        'u' => 'υ',
        'f' => 'φ',
        'x' => 'χ',
        'y' => 'ψ',
        'w' => 'ω',
        'v' => 'ϝ',
        _ => return None,
    })
}

/// A mark of Beta Code, with the place it takes among the marks of a
/// letter for the composed forms to be found: breathing and dieresis,
/// accent, iota.
fn mark(c: char) -> Option<(u8, char)> {
    Some(match c {
        ')' => (0, '\u{0313}'),
        '(' => (0, '\u{0314}'),
        '+' => (0, '\u{0308}'),
        '/' => (1, '\u{0301}'),
        '\\' => (1, '\u{0300}'),
        '=' => (1, '\u{0342}'),
        '|' => (2, '\u{0345}'),
        _ => return None,
    })
}

/// Whether a line is Beta Code, by the rules above.
fn recognised(line: &str) -> bool {
    let chars: Vec<char> = line.chars().collect();
    let letters = chars.iter().filter(|c| c.is_ascii_alphabetic()).count();
    // A mark directly after a consonant is not Greek, but a breathing on a rho.
    let foreign = chars.windows(2).any(|w| {
        w[0].is_ascii_alphabetic()
            && mark(w[1]).is_some()
            && !(vowel(w[0]) || (w[0].eq_ignore_ascii_case(&'r') && breathing(w[1])))
    });
    if foreign {
        return false;
    }
    // An accent, dieresis or iota among the marks of a letter, or a capital.
    let accented = chars.iter().enumerate().any(|(i, &c)| {
        mark(c).is_some()
            && !breathing(c)
            && chars[..i]
                .iter()
                .rev()
                .find(|&&p| mark(p).is_none())
                .is_some_and(|&p| p.is_ascii_alphabetic() || p == '*')
    }) || chars.windows(2).any(|w| w[0] == '*' && (w[1].is_ascii_alphabetic() || mark(w[1]).is_some()));
    if !accented {
        return false;
    }
    let marked = chars
        .iter()
        .enumerate()
        .filter(|&(i, c)| {
            c.is_ascii_alphabetic()
                && (chars.get(i + 1).is_some_and(|&n| mark(n).is_some())
                    || (i > 0
                        && mark(chars[i - 1]).is_some()
                        && chars[..i].iter().rev().find(|&&p| mark(p).is_none()) == Some(&'*')))
        })
        .count();
    if letters == 0 || marked < 3 || marked * 5 < letters {
        return false;
    }
    let common =
        line.split_whitespace().filter(|word| !word.chars().any(|c| mark(c).is_some() || c == '*')).any(|word| {
            let word = word.trim_matches(|c: char| !c.is_ascii_alphabetic());
            COMMON.contains(&word.to_ascii_lowercase().as_str())
        });
    !common
}

/// Beta Code in a line, where it is that: the line in Greek.
pub(super) fn beta_code(line: &str) -> Option<String> {
    if !recognised(line) {
        return None;
    }
    let chars: Vec<char> = line.chars().collect();
    let mut out = String::with_capacity(line.len() * 2);
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        // A capital: `*`, its marks, the letter, and any marks after it.
        let (capital, mut marks, at) = if c == '*' {
            let mut j = i + 1;
            let mut before = Vec::new();
            while let Some(m) = chars.get(j).and_then(|&n| mark(n)) {
                before.push(m);
                j += 1;
            }
            (true, before, j)
        } else {
            (false, Vec::new(), i)
        };
        let Some(base) = chars.get(at).and_then(|&l| letter(l)) else {
            out.push(match c {
                ':' => '\u{0387}',
                '\'' => '\u{1fbd}',
                other => other,
            });
            i += 1;
            continue;
        };
        let mut j = at + 1;
        // The sigmas by their number: what is wanted is σ, made ς at the end of a word below.
        if base == 'σ' && chars.get(j).is_some_and(|d| matches!(d, '1' | '2' | '3')) {
            j += 1;
        }
        while let Some(m) = chars.get(j).and_then(|&n| mark(n)) {
            marks.push(m);
            j += 1;
        }
        marks.sort_by_key(|(place, _)| *place);
        let base = if capital { base.to_uppercase().next().unwrap_or(base) } else { base };
        out.push(base);
        out.extend(marks.iter().map(|(_, m)| *m));
        i = j;
    }
    Some(mend_sigmas(&out.nfc().collect::<String>()))
}
