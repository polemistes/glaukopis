//! Beta Code in the text itself: Greek kept in Latin letters, as the
//! Thesaurus Linguae Graecae keeps it (`mh=nin a)/eide qea\`). The marks
//! follow their letter in any order; a capital is a `*` with its marks
//! between it and the letter or after the letter (`*)a`, `*a)`).
//!
//! A line is taken for Beta Code only when it plainly is: when at least one
//! in eight of its letters, and two at least, carry a mark of Beta Code, and
//! no word of it is a common English or Norwegian one.

use unicode_normalization::UnicodeNormalization;

use super::mend_sigmas;

/// Words of English and Norwegian that say a line is not Beta Code.
const COMMON: &[&str] = &["the", "and", "with", "that", "for", "det", "som", "ikke", "med", "og"];

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

/// Whether a line is Beta Code, by the rule above.
fn recognised(line: &str) -> bool {
    let chars: Vec<char> = line.chars().collect();
    let letters = chars.iter().filter(|c| c.is_ascii_alphabetic()).count();
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
    if letters == 0 || marked < 2 || marked * 8 < letters {
        return false;
    }
    let common =
        line.split(|c: char| !c.is_ascii_alphabetic()).any(|word| COMMON.contains(&word.to_ascii_lowercase().as_str()));
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
