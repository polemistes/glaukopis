//! Dates as Zotero keeps them.
//!
//! Zotero stores a date as what it understood of it, followed by what was
//! typed: `1979-05-00 May 1979`, with zeros for the parts it did not find.
//! What was typed often says more than what Zotero understood (a range, a
//! season, "c."), so it is looked at first.

use crate::bib::date as edtf;

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum Date {
    /// In the form BibLaTeX wants: `1979`, `1979-05`, `1979/1985`.
    Understood(String),
    /// Nothing that could be read as a date: the text as typed, for `year`.
    Text(String),
}

/// The leading `YYYY-MM-DD` of a value, and the text that follows it.
fn parts(value: &str) -> Option<((u32, u32, u32), &str)> {
    let head = value.get(..10)?;
    let b = head.as_bytes();
    let digits = |from: usize, to: usize| b[from..to].iter().all(u8::is_ascii_digit);
    if !(digits(0, 4) && b[4] == b'-' && digits(5, 7) && b[7] == b'-' && digits(8, 10)) {
        return None;
    }
    let rest = &value[10..];
    if !(rest.is_empty() || rest.starts_with(' ')) {
        return None;
    }
    let number = |from: usize, to: usize| head[from..to].parse::<u32>().ok();
    Some(((number(0, 4)?, number(5, 7)?, number(8, 10)?), rest.trim()))
}

/// One end of a date, written strictly: `1979`, `1979-05`, `1979-05-12`,
/// `-0043`, `19XX`, with `~`, `?` or `%` after it.
fn is_point(text: &str) -> bool {
    let text = text.strip_suffix(['~', '?', '%']).unwrap_or(text);
    let text = text.strip_prefix('-').unwrap_or(text);
    let mut pieces = text.split('-');
    let Some(year) = pieces.next() else { return false };
    if year.len() != 4 || !year.chars().all(|c| c.is_ascii_digit() || c == 'X') {
        return false;
    }
    let two = |piece: &str| (piece.len() == 2).then(|| piece.parse::<u32>().ok()).flatten();
    let month = match pieces.next() {
        None => return true,
        Some(piece) => match two(piece) {
            Some(m) if (1..=12).contains(&m) || (21..=24).contains(&m) => m,
            _ => return false,
        },
    };
    match pieces.next() {
        None => true,
        Some(piece) => month <= 12 && two(piece).is_some_and(|d| (1..=31).contains(&d)) && pieces.next().is_none(),
    }
}

/// The text, when it is already written the way BibLaTeX writes dates.
fn iso(text: &str) -> Option<String> {
    // A time of day is of no use to a bibliography.
    let text = match text.split_once('T') {
        Some((day, time)) if time.starts_with(|c: char| c.is_ascii_digit()) => day,
        _ => text,
    };
    let (start, end) = match text.split_once('/') {
        Some((start, end)) => (start.trim(), Some(end.trim())),
        None => (text.trim(), None),
    };
    if !is_point(start) {
        return None;
    }
    let written = match end {
        None => start.to_owned(),
        Some("") | Some("..") => format!("{start}/"),
        Some(end) if is_point(end) => format!("{start}/{end}"),
        Some(_) => return None,
    };
    // The application's own reading of dates has the last word.
    edtf::parse(&written).map(|_| written)
}

/// `1979–1985` and `1979-85`, as ranges of years are typed.
fn year_range(text: &str) -> Option<String> {
    let (start, end) = text.split_once(['-', '–', '—', '‒', '‐'])?;
    let (start, end) = (start.trim(), end.trim());
    let all_digits = |s: &str| !s.is_empty() && s.chars().all(|c| c.is_ascii_digit());
    if start.len() != 4 || !all_digits(start) || !all_digits(end) {
        return None;
    }
    let from: u32 = start.parse().ok()?;
    let to: u32 = match end.len() {
        4 => end.parse().ok()?,
        // Up to twelve, two digits may be a month.
        2 => {
            let short: u32 = end.parse().ok()?;
            if short <= 12 {
                return None;
            }
            from / 100 * 100 + short
        }
        _ => return None,
    };
    (to > from).then(|| format!("{from:04}/{to:04}"))
}

/// Whether the text says "about": `c. 1500`, `ca 1500`, `circa 1500`, `~1500`.
fn is_approximate(text: &str) -> bool {
    let lower = text.trim_start_matches(['[', '(']).trim_start().to_lowercase();
    ["circa", "ca.", "ca", "c.", "c", "~"].iter().any(|mark| {
        lower.strip_prefix(mark).is_some_and(|rest| rest.trim_start().starts_with(|c: char| c.is_ascii_digit()))
    })
}

fn is_uncertain(text: &str) -> bool {
    text.trim_end_matches([']', ')', ' ']).ends_with('?')
}

/// The number by which a season is written in a date: spring is 21, winter 24.
fn season(text: &str) -> Option<u32> {
    const SEASONS: &[(&str, u32)] = &[
        ("spring", 21),
        ("summer", 22),
        ("autumn", 23),
        ("fall", 23),
        ("winter", 24),
        ("frühling", 21),
        ("frühjahr", 21),
        ("sommer", 22),
        ("herbst", 23),
        ("printemps", 21),
        ("été", 22),
        ("automne", 23),
        ("hiver", 24),
        ("vår", 21),
        ("sommar", 22),
        ("høst", 23),
        ("höst", 23),
        ("vinter", 24),
    ];
    let lower = text.to_lowercase();
    let mut found = lower
        .split(|c: char| !c.is_alphabetic())
        .filter_map(|word| SEASONS.iter().find(|(name, _)| *name == word).map(|(_, n)| *n));
    let first = found.next()?;
    // Two seasons are a span of time that a single date cannot hold.
    found.next().is_none().then_some(first)
}

/// Reads the value of one of Zotero's date fields.
pub(super) fn read(value: &str) -> Option<Date> {
    let value = value.trim();
    if value.is_empty() {
        return None;
    }
    let (understood, text) = match parts(value) {
        Some((numbers, "")) => (Some(numbers), &value[..10]),
        Some((numbers, text)) => (Some(numbers), text),
        None => (None, value),
    };
    if let Some(date) = iso(text).or_else(|| year_range(text)) {
        return Some(Date::Understood(date));
    }
    match understood {
        Some((year, month, day)) if year > 0 => {
            let mut date = format!("{year:04}");
            if (1..=12).contains(&month) {
                date.push_str(&format!("-{month:02}"));
                if (1..=31).contains(&day) {
                    date.push_str(&format!("-{day:02}"));
                }
            } else if let Some(season) = season(text) {
                date.push_str(&format!("-{season}"));
            }
            match (is_approximate(text), is_uncertain(text)) {
                (true, true) => date.push('%'),
                (true, false) => date.push('~'),
                (false, true) => date.push('?'),
                (false, false) => {}
            }
            // Should the application not accept what was put together, the year alone will do.
            Some(Date::Understood(if edtf::parse(&date).is_some() { date } else { format!("{year:04}") }))
        }
        _ => Some(Date::Text(text.to_owned())),
    }
}

/// A value without what Zotero has put before what was typed.
pub(super) fn as_typed(value: &str) -> &str {
    match parts(value.trim()) {
        Some((_, typed)) if !typed.is_empty() => typed,
        _ => value,
    }
}

/// The day of a moment in time, as Zotero writes the day something was
/// accessed: `2019-05-12 14:33:21`.
pub(super) fn day(value: &str) -> Option<String> {
    let ((year, month, day), _) = parts(value.trim())?;
    if year == 0 || !(1..=12).contains(&month) || !(1..=31).contains(&day) {
        return None;
    }
    Some(format!("{year:04}-{month:02}-{day:02}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn understood(value: &str) -> String {
        match read(value) {
            Some(Date::Understood(date)) => date,
            other => panic!("{value}: {other:?}"),
        }
    }

    #[test]
    fn what_zotero_understood() {
        assert_eq!(understood("1979-00-00 1979"), "1979");
        assert_eq!(understood("1979-05-00 May 1979"), "1979-05");
        assert_eq!(understood("1979-05-12 12. mai 1979"), "1979-05-12");
        assert_eq!(understood("2019-05-12 5/12/2019"), "2019-05-12");
        assert_eq!(understood("0800-00-00 800"), "0800");
        assert_eq!(understood("1979-05-12 1979-05-12"), "1979-05-12");
        // Without the text, and without Zotero's reading.
        assert_eq!(understood("1979-05-00"), "1979-05");
        assert_eq!(understood("1979"), "1979");
        // A day without a month means nothing.
        assert_eq!(understood("1979-00-12 1979"), "1979");
    }

    #[test]
    fn what_the_text_says_beyond_that() {
        assert_eq!(understood("1979-00-00 1979-1985"), "1979/1985");
        assert_eq!(understood("1979-00-00 1979–85"), "1979/1985");
        assert_eq!(understood("1979-00-00 1979/1985"), "1979/1985");
        assert_eq!(understood("1999-12-00 1999-12"), "1999-12");
        assert_eq!(understood("1500-00-00 c. 1500"), "1500~");
        assert_eq!(understood("1500-00-00 ca 1500"), "1500~");
        assert_eq!(understood("1979-00-00 [1979?]"), "1979?");
        assert_eq!(understood("1979-00-00 1979?"), "1979?");
        assert_eq!(understood("2005-00-00 Spring 2005"), "2005-21");
        assert_eq!(understood("2005-00-00 Høst 2005"), "2005-23");
        assert_eq!(understood("2005-00-00 Spring/Summer 2005"), "2005");
        assert_eq!(understood("0000-00-00 -0043"), "-0043");
        assert_eq!(understood("2020-03-01 2020-03-01T12:00:00Z"), "2020-03-01");
        assert_eq!(understood("1985-00-00 1985-1979"), "1985");
    }

    #[test]
    fn what_cannot_be_understood() {
        assert_eq!(read("0000-00-00 forthcoming"), Some(Date::Text("forthcoming".into())));
        assert_eq!(read("in press"), Some(Date::Text("in press".into())));
        assert_eq!(read("0000-05-12 12 May"), Some(Date::Text("12 May".into())));
        assert_eq!(read("  "), None);
        assert_eq!(read("Ἰλιάς ραψῳδία"), Some(Date::Text("Ἰλιάς ραψῳδία".into())));
    }

    #[test]
    fn as_it_was_typed() {
        assert_eq!(as_typed("1979-05-00 May 1979"), "May 1979");
        assert_eq!(as_typed("1979-05-12"), "1979-05-12");
        assert_eq!(as_typed("Oil on canvas"), "Oil on canvas");
    }

    #[test]
    fn days_of_access() {
        assert_eq!(day("2019-05-12 14:33:21").as_deref(), Some("2019-05-12"));
        assert_eq!(day("2019-05-12").as_deref(), Some("2019-05-12"));
        assert_eq!(day("2019-00-00 2019"), None);
        assert_eq!(day("yesterday"), None);
    }
}
