//! Dates as BibLaTeX writes them: ISO 8601-2 (EDTF) level 1.
//!
//! `1979`, `1979-05`, `1979-05-12`, ranges with `/`, open ranges (`1979/`),
//! approximate (`~`) and uncertain (`?`) dates, negative years, seasons
//! (months 21 to 24), and unspecified digits (`19XX`).

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct DatePoint {
    pub year: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub month: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub day: Option<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BibDate {
    pub start: DatePoint,
    /// `Some(None)` is an open range: `1979/`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end: Option<Option<DatePoint>>,
    pub approximate: bool,
    pub uncertain: bool,
}

impl BibDate {
    pub fn year(&self) -> i32 {
        self.start.year
    }
}

fn point(s: &str) -> Option<DatePoint> {
    let s = s.trim();
    if s.is_empty() {
        return None;
    }
    let (negative, body) = match s.strip_prefix('-') {
        Some(rest) => (true, rest),
        None => (false, s),
    };
    let mut parts = body.split('-');
    let y = parts.next()?;
    if y.is_empty() || y.len() > 6 {
        return None;
    }
    // Unspecified digits count as zero: `19XX` is sorted and shown as the 1900s.
    let y_digits: String = y.chars().map(|c| if c == 'X' || c == 'x' { '0' } else { c }).collect();
    if !y_digits.chars().all(|c| c.is_ascii_digit()) {
        return None;
    }
    let mut year: i32 = y_digits.parse().ok()?;
    if negative {
        year = -year;
    }
    let month = match parts.next() {
        Some(m) => {
            let m: u8 = m.parse().ok()?;
            if !((1..=12).contains(&m) || (21..=24).contains(&m)) {
                return None;
            }
            Some(m)
        }
        None => None,
    };
    let day = match parts.next() {
        Some(d) => {
            let d: u8 = d.parse().ok()?;
            if !(1..=31).contains(&d) {
                return None;
            }
            Some(d)
        }
        None => None,
    };
    if parts.next().is_some() {
        return None;
    }
    Some(DatePoint { year, month, day })
}

fn strip_marks(s: &str) -> (&str, bool, bool) {
    let s = s.trim();
    if let Some(rest) = s.strip_suffix('%') {
        return (rest, true, true);
    }
    if let Some(rest) = s.strip_suffix('~') {
        return (rest, true, false);
    }
    if let Some(rest) = s.strip_suffix('?') {
        return (rest, false, true);
    }
    (s, false, false)
}

pub fn parse(value: &str) -> Option<BibDate> {
    let value = value.trim();
    if value.is_empty() {
        return None;
    }
    // A time of day, if any, is of no use to a bibliography.
    let value = value.split('T').next().unwrap_or(value);
    let (first, second) = match value.split_once('/') {
        Some((a, b)) => (a, Some(b)),
        None => (value, None),
    };
    let (first, approximate, uncertain) = strip_marks(first);
    let start = point(first)?;
    let end = match second {
        None => None,
        Some(s) => {
            let (s, _, _) = strip_marks(s);
            if s.is_empty() || s == ".." { Some(None) } else { Some(Some(point(s)?)) }
        }
    };
    Some(BibDate { start, end, approximate, uncertain })
}

/// The year for an entry, from `date` or else from `year`. A `year` that is
/// not a number ("forthcoming", "n.d.") gives none.
pub fn entry_year(date: Option<&str>, year: Option<&str>) -> Option<i32> {
    if let Some(d) = date.and_then(parse) {
        return Some(d.year());
    }
    let y = year?.trim();
    if let Some(d) = parse(y) {
        return Some(d.year());
    }
    // "1979a", "c. 1500", "[1979]": the first run of three or four digits.
    let digits: String = y.chars().skip_while(|c| !c.is_ascii_digit()).take_while(|c| c.is_ascii_digit()).collect();
    if (3..=4).contains(&digits.len()) { digits.parse().ok() } else { None }
}

/// The year as shown in lists: `1979`, `1979–85`, `c. 1500`, `44 BCE`, or the
/// literal text of a `year` that is not a date.
pub fn display_year(date: Option<&str>, year: Option<&str>) -> String {
    let parsed = date.and_then(parse).or_else(|| year.and_then(parse));
    match parsed {
        Some(d) => {
            let mut s = String::new();
            if d.approximate {
                s.push_str("c. ");
            }
            s.push_str(&format_year(d.start.year));
            match d.end {
                Some(Some(end)) if end.year != d.start.year => {
                    s.push('–');
                    s.push_str(&format_year(end.year));
                }
                Some(None) => s.push('–'),
                _ => {}
            }
            if d.uncertain {
                s.push('?');
            }
            s
        }
        None => year.or(date).map(|s| s.trim().to_owned()).unwrap_or_default(),
    }
}

fn format_year(year: i32) -> String {
    if year <= 0 {
        // Astronomical numbering: year 0 is 1 BCE.
        format!("{} BCE", 1 - year)
    } else {
        year.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn points_and_ranges() {
        assert_eq!(parse("1979").unwrap().start, DatePoint { year: 1979, month: None, day: None });
        assert_eq!(parse("1979-05-12").unwrap().start, DatePoint { year: 1979, month: Some(5), day: Some(12) });
        let r = parse("1979/1985-03").unwrap();
        assert_eq!(r.end, Some(Some(DatePoint { year: 1985, month: Some(3), day: None })));
        assert_eq!(parse("1979/").unwrap().end, Some(None));
        assert_eq!(parse("1979/..").unwrap().end, Some(None));
        assert!(parse("1979-13").is_none());
        assert!(parse("forthcoming").is_none());
        assert!(parse("").is_none());
        assert_eq!(parse("2004-22").unwrap().start.month, Some(22));
        assert_eq!(parse("2020-03-01T12:00:00").unwrap().start.day, Some(1));
    }

    #[test]
    fn marks_and_old_years() {
        let d = parse("1500~").unwrap();
        assert!(d.approximate && !d.uncertain);
        assert!(parse("1500?").unwrap().uncertain);
        assert_eq!(parse("-0043").unwrap().year(), -43);
        assert_eq!(parse("19XX").unwrap().year(), 1900);
    }

    #[test]
    fn years_for_entries() {
        assert_eq!(entry_year(Some("1979-05"), None), Some(1979));
        assert_eq!(entry_year(None, Some("1979")), Some(1979));
        assert_eq!(entry_year(None, Some("1979a")), Some(1979));
        assert_eq!(entry_year(None, Some("[c. 1500]")), Some(1500));
        assert_eq!(entry_year(None, Some("forthcoming")), None);
        assert_eq!(entry_year(Some("bad"), Some("2001")), Some(2001));
    }

    #[test]
    fn display() {
        assert_eq!(display_year(Some("1979"), None), "1979");
        assert_eq!(display_year(Some("1979/1985"), None), "1979–1985");
        assert_eq!(display_year(Some("1500~"), None), "c. 1500");
        assert_eq!(display_year(Some("-0043"), None), "44 BCE");
        assert_eq!(display_year(None, Some("forthcoming")), "forthcoming");
        assert_eq!(display_year(None, None), "");
    }
}
