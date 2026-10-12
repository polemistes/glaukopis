//! The numbers of the paragraphs of a numbered passage: which show one, and
//! what it says. The same rule is kept in TypeScript
//! (`src/lib/project/model/lines.ts`), which the editor follows; the
//! documents are made by this one. See ADR 0039 and 0040.
//!
//! A passage that is *counted* counts its counted paragraphs, those whose
//! kind is counted, less those the writer said are not, and the count
//! begins at the first of them that was given a number by hand. A number
//! given by hand ("1234", "567a", "1094a1") is shown on its paragraph, and
//! the count goes on from its last run of digits: after "1234" comes 1235,
//! after "1094a1" comes "1094a2", and after "567a" comes 568. One without
//! digits is shown and leaves the count as it was. A paragraph that is not
//! counted shows only what was given it by hand. Of the others, those whose
//! number can be divided by `every` show it. A passage whose numbering is
//! *given* shows only the numbers given by hand, and counts nothing; one
//! numbered *not at all* shows nothing.

use super::Numbering;

/// The number a paragraph shows in the margin, and whether it was given by hand.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Shown {
    pub label: String,
    pub set: bool,
}

/// The count as it stands: what comes before the digits, the number of the
/// next paragraph counted, and how many digits it has where they began with
/// a nought ("0567").
struct Count {
    prefix: String,
    next: i64,
    width: usize,
}

/// A number given by hand, read for the count: what stands before its last
/// run of digits, that run, and how many digits it has where it begins with
/// a nought.
fn read_label(label: &str) -> Option<Count> {
    let end = label.rfind(|c: char| c.is_ascii_digit())? + 1;
    let begin = label[..end].rfind(|c: char| !c.is_ascii_digit()).map_or(0, |i| i + 1);
    let digits = &label[begin..end];
    let n = digits.parse::<i64>().ok()?;
    let width = if digits.len() > 1 && digits.starts_with('0') { digits.len() } else { 0 };
    Some(Count { prefix: label[..begin].to_owned(), next: n, width })
}

fn written(count: &Count, n: i64) -> String {
    let digits = format!("{:0width$}", n.unsigned_abs(), width = count.width);
    format!("{}{}{digits}", count.prefix, if n < 0 { "-" } else { "" })
}

/// What each paragraph of a passage shows in the margin: its number, or
/// nothing. Each paragraph is given as whether the count takes it in (its
/// kind is counted, and the writer did not say otherwise) and the number
/// given it by hand. `every` is the passage's, or the layout's; nought
/// counts as one.
pub fn numbers(numbering: Numbering, every: u32, lines: &[(bool, Option<&str>)]) -> Vec<Option<Shown>> {
    if numbering == Numbering::None {
        return vec![None; lines.len()];
    }
    let step = i64::from(every.max(1));
    let mut count: Option<Count> = None;
    lines
        .iter()
        .map(|(counted, number)| {
            let given = number.map(str::trim).unwrap_or("");
            if numbering == Numbering::Given || !counted {
                return (!given.is_empty()).then(|| Shown { label: given.to_owned(), set: true });
            }
            if !given.is_empty() {
                if let Some(read) = read_label(given) {
                    count = Some(Count { next: read.next + 1, ..read });
                }
                return Some(Shown { label: given.to_owned(), set: true });
            }
            let count = count.as_mut()?;
            let n = count.next;
            count.next += 1;
            (n % step == 0).then(|| Shown { label: written(count, n), set: false })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn line(number: Option<&'static str>, counted: bool) -> (bool, Option<&'static str>) {
        (counted, number)
    }

    fn plain(n: usize) -> Vec<(bool, Option<&'static str>)> {
        vec![(true, None); n]
    }

    fn shown(numbering: Numbering, every: u32, lines: &[(bool, Option<&str>)]) -> Vec<String> {
        numbers(numbering, every, lines)
            .into_iter()
            .map(|s| s.map_or("-".to_owned(), |s| if s.set { format!("{}!", s.label) } else { s.label }))
            .collect()
    }

    // The same cases as `src/lib/project/model/lines.test.ts`: the two must count alike.
    #[test]
    fn show_nothing_where_nothing_is_numbered() {
        let mut lines = vec![line(Some("1"), true)];
        lines.extend(plain(3));
        assert_eq!(shown(Numbering::None, 5, &lines), ["-", "-", "-", "-"]);
    }

    #[test]
    fn count_from_the_first_number_given_every_so_many_and_not_what_is_not_counted() {
        let mut lines = vec![line(None, false), line(Some("1"), true)];
        lines.extend(plain(5));
        assert_eq!(shown(Numbering::Counted, 5, &lines), ["-", "1!", "-", "-", "-", "5", "-"]);
    }

    #[test]
    fn show_nothing_before_the_first_number_given() {
        let mut lines = plain(2);
        lines.push(line(Some("1234"), true));
        lines.extend(plain(6));
        assert_eq!(shown(Numbering::Counted, 5, &lines), ["-", "-", "1234!", "1235", "-", "-", "-", "-", "1240"]);
    }

    #[test]
    fn go_on_from_the_digits_of_a_label_keeping_what_stands_before_them() {
        let mut lines = vec![line(Some("1094a1"), true)];
        lines.extend(plain(2));
        lines.push(line(Some("567a"), true));
        lines.push(line(None, true));
        assert_eq!(shown(Numbering::Counted, 1, &lines), ["1094a1!", "1094a2", "1094a3", "567a!", "568"]);
    }

    #[test]
    fn keep_the_noughts_a_label_began_with() {
        let mut lines = vec![line(Some("0098"), true)];
        lines.extend(plain(2));
        assert_eq!(shown(Numbering::Counted, 1, &lines), ["0098!", "0099", "0100"]);
    }

    #[test]
    fn leave_the_count_as_it_was_after_a_label_without_digits() {
        let lines = [line(Some("10"), true), line(Some("*"), true), line(None, true)];
        assert_eq!(shown(Numbering::Counted, 1, &lines), ["10!", "*!", "11"]);
    }

    #[test]
    fn pass_over_a_paragraph_that_is_not_counted_showing_only_its_own_label() {
        let lines = [line(Some("10"), true), line(None, false), line(Some("b"), false), line(None, true)];
        assert_eq!(shown(Numbering::Counted, 1, &lines), ["10!", "-", "b!", "11"]);
    }

    #[test]
    fn count_every_so_many_by_the_numbers_not_by_the_lines() {
        let mut lines = vec![line(Some("1235"), true)];
        lines.extend(plain(2));
        lines.push(line(Some("1239"), true));
        lines.push(line(None, true));
        assert_eq!(shown(Numbering::Counted, 5, &lines), ["1235!", "-", "-", "1239!", "1240"]);
    }

    #[test]
    fn show_only_what_was_given_where_the_numbering_is_given() {
        let lines = [
            line(Some("45"), true),
            line(Some("77"), true),
            line(None, true),
            line(Some("46"), false),
            line(None, true),
        ];
        assert_eq!(shown(Numbering::Given, 5, &lines), ["45!", "77!", "-", "46!", "-"]);
    }

    #[test]
    fn take_every_number_as_at_least_one() {
        let lines = [line(Some("1"), true), line(None, true)];
        assert_eq!(shown(Numbering::Counted, 0, &lines), ["1!", "2"]);
    }
}
