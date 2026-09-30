//! What is said after a work that is cited, in the words of the language of
//! the document: the locator, what it counts, and the words after it.

use crate::written::pages::is_dash;
use crate::written::{locators, roman};

/// The words that say what a locator counts, in English and in the
/// language of the document, the longest first.
pub(super) fn terms_for(language: Option<&str>) -> Vec<(String, String)> {
    let mut out: Vec<(String, String)> = Vec::new();
    let mut add = |word: &str, label: &str| {
        let word = word.trim().to_lowercase();
        if !word.is_empty() && !out.iter().any(|(w, _)| *w == word) {
            out.push((word, label.to_owned()));
        }
    };
    let all = locators::terms();
    let mut locales: Vec<&str> = vec!["en-US", "en-GB"];
    if let Some(language) = language.map(str::trim).filter(|l| !l.is_empty()) {
        locales.insert(0, locators::locale_for(Some(language)));
    }
    for locale in locales {
        let Some(of_locale) = all.get(locale) else { continue };
        for label in locators::LABELS {
            let Some(forms) = of_locale.get(label) else { continue };
            for words in forms.values() {
                for word in words {
                    add(word, label);
                }
            }
        }
    }
    for (word, label) in [("chap.", "chapter"), ("chaps.", "chapter"), ("sect.", "section"), ("§", "section")] {
        add(word, label);
    }
    out.sort_by_key(|(word, _)| std::cmp::Reverse(word.chars().count()));
    out
}

/// A number in Roman letters, or a range of two: `xii`, `XIV`, `xii-xv`.
fn is_roman(word: &str) -> bool {
    let letters: Vec<char> = word.chars().collect();
    let mut pieces = letters.split(|c| is_dash(*c)).peekable();
    pieces.peek().is_some() && pieces.all(roman::is_one)
}

/// What is said after a work that is cited, in its parts: the locator, what
/// it counts, and the words after it.
pub(super) fn locator(suffix: &str, terms: &[(String, String)]) -> (Option<String>, Option<String>, Option<String>) {
    let some = |text: &str| {
        let text = text.trim().trim_start_matches([',', ';']).trim();
        (!text.is_empty()).then(|| text.to_owned())
    };
    let clean = suffix.replace('\u{a0}', " ");
    let rest = clean.trim().trim_start_matches(',').trim_start();
    if rest.is_empty() {
        return (None, None, None);
    }
    let label_of = |text: &str| -> (Option<String>, usize) {
        let lower = text.to_lowercase();
        for (word, label) in terms {
            if !lower.starts_with(word.as_str()) {
                continue;
            }
            // The word whole, and something counted after it.
            let after = &text[lower.char_indices().nth(word.chars().count()).map_or(lower.len(), |(i, _)| i)..];
            let next = after.chars().next();
            let whole = word.ends_with('.') || word == "§" || next.is_none_or(|c| c.is_whitespace());
            if whole && after.trim_start().chars().next().is_some_and(|c| c.is_alphanumeric()) {
                return (Some(label.clone()), text.len() - after.len());
            }
        }
        (None, 0)
    };
    // In braces, it is the locator and nothing else.
    if let Some(within) = rest.strip_prefix('{')
        && let Some(end) = within.find('}')
    {
        let said = within[..end].trim();
        let (label, at) = label_of(said);
        let label = label.filter(|l| l != "page");
        return (some(&said[at..]), label, some(&within[end + 1..]));
    }
    let (label, at) = label_of(rest);
    let after = rest[at..].trim_start();
    let mut taken = 0usize;
    let mut words = 0usize;
    for word in after.split_whitespace() {
        let bare = word.trim_end_matches([',', ';', '.', ':']);
        let counted = bare.chars().any(|c| c.is_ascii_digit());
        let fits = if words == 0 {
            match label {
                Some(_) => counted || is_roman(bare),
                None => bare.chars().next().is_some_and(|c| c.is_ascii_digit()),
            }
        } else {
            counted || matches!(bare, "f" | "ff" | "sq" | "sqq")
        };
        if !fits {
            break;
        }
        // Where the word ends in what was written.
        let start = after[taken..].find(word).map_or(taken, |i| taken + i);
        taken = start + word.len();
        words += 1;
        // A full stop or a colon ends the locator; a comma may go on to another number.
        if word.ends_with(['.', ':', ';']) && !matches!(bare, "f" | "ff" | "sq" | "sqq") {
            break;
        }
    }
    if words == 0 {
        return (None, None, some(rest));
    }
    let found = after[..taken].trim_end_matches([',', ';', ':']);
    // "f." and "ff." keep their stop; a number does not.
    let found = if found.ends_with('.') && !found.ends_with("f.") && !found.ends_with("q.") {
        found.trim_end_matches('.')
    } else {
        found
    };
    (some(found), label.filter(|l| l != "page"), some(&after[taken..]))
}
