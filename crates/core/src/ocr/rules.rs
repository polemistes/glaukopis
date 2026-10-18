//! Rules of text that the reading of a page by its lines (`text.rs`), the
//! shape of a file (`shape.rs`) and the document made of that shape
//! (`shaped.rs`) all keep: where a sentence ends, where a paragraph begins
//! with a small letter, what a page number looks like, and the middle of a
//! set of measures. Kept here once, so that a PDF read with its shape and
//! the same read without it join and leave out alike.

/// What may close after the sign that ends a sentence: quotation marks,
/// brackets, the star of a note.
const CLOSERS: [char; 8] = ['"', '\'', '”', '’', '»', ')', ']', '*'];

/// What may open before the first letter of a text: quotation marks,
/// brackets, dashes.
const OPENERS: [char; 11] = ['"', '\'', '“', '‘', '„', '«', '‹', '(', '[', '–', '—'];

/// Whether a letter is of the Greek script.
fn greek(c: char) -> bool {
    matches!(c, '\u{370}'..='\u{3FF}' | '\u{1F00}'..='\u{1FFF}')
}

/// Whether a text ends a sentence, whatever closes after its last sign. A
/// sentence ends with `.`, `!`, `?`, `:` or `…`, and with the Greek signs
/// that end one: the question mark, which is written `;` (Unicode makes its
/// own sign, U+037E, that semicolon), after a Greek letter, and the raised
/// dot (U+0387, made U+00B7). A semicolon after a letter of another script
/// is within a sentence.
pub(super) fn ends_sentence(text: &str) -> bool {
    let text = text.trim_end().trim_end_matches(CLOSERS);
    if text.ends_with(['.', '!', '?', ':', '…', '·', '\u{387}', '\u{37E}']) {
        return true;
    }
    text.strip_suffix(';').and_then(|before| before.chars().next_back()).is_some_and(greek)
}

/// Whether a text begins with a small letter, after what may open before
/// it: as a paragraph does that goes on from the one before. A number
/// before the letter (`3 ὁ δὲ`, a section) begins anew.
pub(super) fn begins_small(text: &str) -> bool {
    text.trim_start_matches(|c: char| c.is_whitespace() || OPENERS.contains(&c))
        .chars()
        .next()
        .is_some_and(char::is_lowercase)
}

/// The middle value of a set of measures, the upper of the two middle ones
/// where there is an even number of them; None of none.
pub(super) fn median(mut values: Vec<f32>) -> Option<f32> {
    if values.is_empty() {
        return None;
    }
    values.sort_by(f32::total_cmp);
    Some(values[values.len() / 2])
}

/// The value of a number in Roman numerals, of one case, written as they are written.
pub(super) fn roman(text: &str) -> Option<i64> {
    if text.is_empty() || text.len() > 7 {
        return None;
    }
    let lower = text.to_ascii_lowercase();
    if text != lower && text != text.to_ascii_uppercase() {
        return None;
    }
    let value = |c: char| match c {
        'i' => Some(1),
        'v' => Some(5),
        'x' => Some(10),
        'l' => Some(50),
        'c' => Some(100),
        'd' => Some(500),
        'm' => Some(1000),
        _ => None,
    };
    let values: Vec<i64> = lower.chars().map(value).collect::<Option<_>>()?;
    let mut total = 0;
    for (i, v) in values.iter().enumerate() {
        if values.get(i + 1).is_some_and(|next| next > v) { total -= v } else { total += v }
    }
    // Written back as numerals are written, or it is a word of such letters (`civil`, `vil`).
    (total > 0 && to_roman(total) == lower).then_some(total)
}

fn to_roman(mut n: i64) -> String {
    const NUMERALS: [(i64, &str); 13] = [
        (1000, "m"),
        (900, "cm"),
        (500, "d"),
        (400, "cd"),
        (100, "c"),
        (90, "xc"),
        (50, "l"),
        (40, "xl"),
        (10, "x"),
        (9, "ix"),
        (5, "v"),
        (4, "iv"),
        (1, "i"),
    ];
    let mut out = String::new();
    for (value, numeral) in NUMERALS {
        while n >= value {
            out.push_str(numeral);
            n -= value;
        }
    }
    out
}

/// Whether a text is a number in figures of one to four digits.
pub(super) fn digits(text: &str) -> bool {
    (1..=4).contains(&text.len()) && text.bytes().all(|b| b.is_ascii_digit())
}

/// A page number as a line has it, `17`, `- 17 -`, `[17]`, `xiv`, `XIV` or
/// `A-3`: the form (what stands before the number, `i` or `I` for the case
/// of the numerals) and the value, for numbers to be stepped.
pub(super) fn page_number(text: &str) -> Option<(String, i64)> {
    let bare = text.trim_matches(|c: char| c.is_whitespace() || matches!(c, '-' | '–' | '—' | '[' | ']' | '(' | ')'));
    if digits(bare) {
        return Some((String::new(), bare.parse().ok()?));
    }
    if let Some(value) = roman(bare) {
        let form = if bare.starts_with(|c: char| c.is_ascii_uppercase()) { "I" } else { "i" };
        return Some((form.to_owned(), value));
    }
    let (prefix, number) = bare.split_once(['-', '–', '.'])?;
    ((1..=3).contains(&prefix.chars().count()) && prefix.chars().all(char::is_alphabetic) && digits(number))
        .then(|| Some((format!("{prefix}-"), number.parse().ok()?)))
        .flatten()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn where_a_sentence_ends() {
        for ended in ["Old.", "old!", "Old?", "thus:", "and so…", "»Old.", "(old.)", "“Old.”*"] {
            assert!(ends_sentence(ended), "{ended}");
        }
        // The Greek question mark, as Unicode makes it and as it is written,
        // and the raised dot, as Unicode makes it and as it is written.
        for ended in ["τί ἔφη;", "τί ἔφη\u{37E}", "ἔφη·", "ἔφη\u{387}", "ἦ γάρ;»"] {
            assert!(ends_sentence(ended), "{ended}");
        }
        // A semicolon in another script, a closing mark without a stop
        // before it, a comma: the sentence goes on.
        for open in ["his art was old;", "the \"word\"", "the word»", "and then,", "the (word)", ""] {
            assert!(!ends_sentence(open), "{open}");
        }
    }

    #[test]
    fn what_begins_with_a_small_letter() {
        for small in ["and so", "«ἀλλὰ", "(and", " — or", "ὁ δὲ"] {
            assert!(begins_small(small), "{small}");
        }
        for not in ["And", "3 ὁ δὲ", "1. the", "", "«Ἀλλὰ"] {
            assert!(!begins_small(not), "{not}");
        }
    }

    #[test]
    fn numerals_and_page_numbers() {
        assert_eq!(roman("xiv"), Some(14));
        assert_eq!(roman("MCMXCIX"), Some(1999));
        for word in ["civil", "vil", "il", "iiii", "Xiv", ""] {
            assert_eq!(roman(word), None, "{word}");
        }
        assert_eq!(page_number("- 17 -"), Some((String::new(), 17)));
        assert_eq!(page_number("A-3"), Some(("A-".into(), 3)));
        assert_eq!(page_number("[17]"), Some((String::new(), 17)));
        assert_eq!(page_number("XIV"), Some(("I".into(), 14)));
        assert_eq!(page_number("xiv"), Some(("i".into(), 14)));
        assert_eq!(page_number("civil"), None);
        assert_eq!(page_number("Chapter"), None);
        assert_eq!(page_number("12345"), None);
        assert_eq!(median(vec![3.0, 1.0, 2.0, 10.0]), Some(3.0));
        assert_eq!(median(Vec::new()), None);
    }
}
