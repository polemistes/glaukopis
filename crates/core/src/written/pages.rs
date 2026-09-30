//! Pages, and the ranges of them: with the en dash that a range has
//! however the dash was typed, `151-172`, `151--172` and `151 – 172` alike.

use crate::bib::parser::normalise_space;

/// The dashes and hyphens that are typed between the first and the last
/// of a range.
pub fn is_dash(c: char) -> bool {
    matches!(c, '-' | '\u{2010}' | '\u{2011}' | '\u{2012}' | '–' | '—' | '\u{2212}')
}

/// Whether a word can be the number of a page: `151`, `S12`, `e1234`, `xiv`.
fn is_page_number(word: &str) -> bool {
    !word.is_empty()
        && (word.chars().any(|c| c.is_ascii_digit())
            || word.chars().all(|c| matches!(c.to_ascii_lowercase(), 'i' | 'v' | 'x' | 'l' | 'c' | 'd' | 'm')))
}

/// Pages, with an en dash between the first and the last of each range.
/// What is no range stays as it was: `front-matter`, `45-`, and numbers
/// joined by more than one dash, `3-10-15`, which count something else.
pub fn ranges(value: &str) -> String {
    let chars: Vec<char> = normalise_space(value).chars().collect();
    let mut out = String::with_capacity(chars.len());
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if !(is_dash(c) || (c == ' ' && chars.get(i + 1).copied().is_some_and(is_dash))) {
            out.push(c);
            i += 1;
            continue;
        }
        // A run of dashes, with the spaces around it.
        let mut end = i;
        while end < chars.len() && (is_dash(chars[end]) || chars[end] == ' ') {
            end += 1;
        }
        let before: String = out.chars().rev().take_while(|c| c.is_alphanumeric()).collect();
        let after: String = chars[end..].iter().take_while(|c| c.is_alphanumeric()).collect();
        let chained = out.chars().rev().nth(before.chars().count()).is_some_and(is_dash)
            || chars.get(end + after.chars().count()).copied().is_some_and(is_dash);
        if !chained && is_page_number(&before) && is_page_number(&after) {
            out.push('–');
        } else {
            out.extend(&chars[i..end]);
        }
        i = end;
    }
    out
}

/// Ranges whose last page was shortened, written out: in `1695–9` the 9
/// stands for 1699. What `ranges` gave is what is read.
pub fn written_out(ranged: &str) -> String {
    let mut out = String::with_capacity(ranged.len() + 8);
    let mut rest = ranged;
    while let Some(at) = rest.find('–') {
        let (before, after) = (&rest[..at], &rest[at + '–'.len_utf8()..]);
        // The words on either side of the dash.
        let from_at =
            before.len() - before.chars().rev().take_while(|c| c.is_alphanumeric()).map(char::len_utf8).sum::<usize>();
        let from = &before[from_at..];
        let to = &after[..after.find(|c: char| !c.is_alphanumeric()).unwrap_or(after.len())];
        out.push_str(before);
        out.push('–');
        out.push_str(&whole(from, to));
        rest = &after[to.len()..];
    }
    out.push_str(rest);
    out
}

/// The last page of a range as it would be written in full, where both are numbers.
fn whole(from: &str, to: &str) -> String {
    let number = |s: &str| !s.is_empty() && s.bytes().all(|b| b.is_ascii_digit());
    if number(from) && number(to) && to.len() < from.len() {
        let full = format!("{}{to}", &from[..from.len() - to.len()]);
        if full.parse::<u64>().ok() > from.parse::<u64>().ok() {
            return full;
        }
    }
    to.to_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn page_ranges() {
        assert_eq!(ranges("151-172"), "151–172");
        assert_eq!(ranges("151--172"), "151–172");
        assert_eq!(ranges("151 - 172"), "151–172");
        assert_eq!(ranges("151–172"), "151–172");
        assert_eq!(ranges("151—172"), "151–172");
        assert_eq!(ranges("12-15, 20-25"), "12–15, 20–25");
        assert_eq!(ranges("S12-S15"), "S12–S15");
        assert_eq!(ranges("xiv-xx"), "xiv–xx");
        assert_eq!(ranges("e1234"), "e1234");
        assert_eq!(ranges("45"), "45");
        assert_eq!(ranges("45-"), "45-");
        assert_eq!(ranges("front-matter"), "front-matter");
        assert_eq!(ranges("12 ff."), "12 ff.");
        assert_eq!(ranges("3-10-15"), "3-10-15");
        assert_eq!(ranges("i-iv"), "i–iv");
    }

    #[test]
    fn shortened_ranges_written_out() {
        assert_eq!(written_out("1695–9"), "1695–1699");
        assert_eq!(written_out("1695–99, 201–5"), "1695–1699, 201–205");
        assert_eq!(written_out("405–450"), "405–450");
        // A last page that would come before the first is left.
        assert_eq!(written_out("1695–1"), "1695–1");
        assert_eq!(written_out("S12–S15"), "S12–S15");
        assert_eq!(written_out("xiv–xx"), "xiv–xx");
        assert_eq!(written_out("e1234–5"), "e1234–5");
    }
}
