//! The numbers of the lines of a numbered stretch: which show one, and what
//! it says; and the lines and stretches of a text. The same rules are kept
//! in TypeScript (`src/lib/project/model/lines.ts`), which the editor
//! follows; the documents are made by these. See ADR 0039 and 0041.
//!
//! A text is paragraphs, and a paragraph is lines, parted by line breaks.
//! A stretch is consecutive paragraphs with the same numbering settings,
//! whatever their kinds; its lines are numbered together. A line is counted
//! when its paragraph's kind is counted, its mark does not say otherwise,
//! and it holds something to read; an empty line, as between two stanzas,
//! never is. A stretch that is *counted* begins its count at the first
//! counted line that was given a number by hand. A number given by hand
//! ("1234", "567a", "1094a1") is shown on its line, and the count goes on
//! from its last run of digits: after "1234" comes 1235, after "1094a1"
//! comes "1094a2", and after "567a" comes 568. One without digits is shown
//! and leaves the count as it was. A line that is not counted shows only
//! what was given it by hand. Of the others, those whose number can be
//! divided by `every` show it. A line marked hidden is counted and shows
//! nothing. A stretch whose numbering is *given* shows only the numbers
//! given by hand, and counts nothing; one numbered *not at all* shows
//! nothing.

use super::{Block, Inline, Numbering, Side};

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

// ---- the lines of a paragraph, and the stretches of a text ----

/// What a line mark says, read from it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Mark<'a> {
    /// The number or label given by hand, trimmed; nothing where none was.
    pub number: Option<&'a str>,
    pub counted: bool,
    pub hidden: bool,
    /// The words in the margin, trimmed; nothing where there are none.
    pub margin: Option<&'a str>,
    pub indent: u32,
}

impl<'a> Mark<'a> {
    /// What a line mark says; nothing of anything else.
    pub fn of(inline: &'a Inline) -> Option<Mark<'a>> {
        let Inline::LineMark { number, counted, hidden, margin, indent } = inline else { return None };
        let given = |s: &'a Option<String>| s.as_deref().map(str::trim).filter(|s| !s.is_empty());
        Some(Mark { number: given(number), counted: *counted, hidden: *hidden, margin: given(margin), indent: *indent })
    }
}

/// A line of a paragraph: the mark that begins it, if any, what stands in
/// it after the mark, and whether it holds nothing to read.
#[derive(Debug, Clone, PartialEq)]
pub struct Line<'a> {
    pub mark: Option<Mark<'a>>,
    pub content: &'a [Inline],
    pub blank: bool,
}

/// Whether inline content holds nothing to read: no words, or only spaces
/// and marks of lines.
fn blank_of(content: &[Inline]) -> bool {
    content.iter().all(|i| match i {
        Inline::Text { text, .. } => text.trim().is_empty(),
        Inline::LineMark { .. } | Inline::Break => true,
        _ => false,
    })
}

/// The lines of a paragraph's content, parted by its line breaks; a
/// paragraph without one is one line, and an empty paragraph one blank line.
pub fn lines_of(content: &[Inline]) -> Vec<Line<'_>> {
    content
        .split(|i| matches!(i, Inline::Break))
        .map(|line| {
            let mark = line.first().and_then(Mark::of);
            let rest = if mark.is_some() { &line[1..] } else { line };
            Line { mark, content: rest, blank: blank_of(rest) }
        })
        .collect()
}

/// A stretch of a text: the indices of its paragraphs among the blocks
/// given, from and to (not included), and its settings.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Stretch {
    pub from: usize,
    pub to: usize,
    pub numbering: Numbering,
    pub every: Option<u32>,
    pub side: Option<Side>,
}

/// The numbered stretches of a text, in order: runs of consecutive
/// paragraphs whose numbering is not *none* and whose settings are the
/// same. Anything that is not a paragraph ends a stretch.
pub fn stretches(blocks: &[Block]) -> Vec<Stretch> {
    let mut out: Vec<Stretch> = Vec::new();
    let mut open = false;
    for (i, b) in blocks.iter().enumerate() {
        let Block::Paragraph { numbering, every, side, .. } = b else {
            open = false;
            continue;
        };
        if *numbering == Numbering::None {
            open = false;
            continue;
        }
        if open
            && let Some(at) = out.last_mut()
            && at.to == i
            && at.numbering == *numbering
            && at.every == *every
            && at.side == *side
        {
            at.to = i + 1;
            continue;
        }
        out.push(Stretch { from: i, to: i + 1, numbering: *numbering, every: *every, side: *side });
        open = true;
    }
    out
}

/// What each line of a stretch shows, paragraph by paragraph and line by
/// line: the paragraphs of the stretch as their kind and their content, how
/// it is numbered, every how many (the stretch's, else the layout's), and
/// whether the lines of a kind are counted, as `facts` says of it.
pub fn stretch_numbers(
    paragraphs: &[(&str, &[Inline])],
    numbering: Numbering,
    every: u32,
    counted_kind: &dyn Fn(&str) -> bool,
) -> Vec<Vec<Option<Shown>>> {
    let lines: Vec<Vec<Line>> = paragraphs.iter().map(|(_, content)| lines_of(content)).collect();
    let mut counted: Vec<(bool, Option<&str>)> = Vec::new();
    for ((name, _), ls) in paragraphs.iter().zip(&lines) {
        let kind = counted_kind(name);
        for l in ls {
            counted.push((kind && l.mark.is_none_or(|m| m.counted) && !l.blank, l.mark.and_then(|m| m.number)));
        }
    }
    let mut flat = numbers(numbering, every, &counted).into_iter();
    lines
        .iter()
        .map(|ls| {
            ls.iter()
                .map(|l| {
                    let shown = flat.next().flatten();
                    if l.mark.is_some_and(|m| m.hidden) { None } else { shown }
                })
                .collect()
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

    // ---- lines, stretches, and the numbers of a stretch ----
    // The same cases as `src/lib/project/model/lines.test.ts`.

    use crate::document::fixtures::{mark, text as w};

    const BR: Inline = Inline::Break;

    fn shown_of(rows: Vec<Vec<Option<Shown>>>) -> Vec<String> {
        rows.into_iter()
            .map(|r| {
                r.into_iter()
                    .map(|s| s.map_or("-".to_owned(), |s| if s.set { format!("{}!", s.label) } else { s.label }))
                    .collect::<Vec<_>>()
                    .join(" ")
            })
            .collect()
    }

    fn numbered(paragraphs: &[Block], numbering: Numbering, every: u32) -> Vec<String> {
        let paras: Vec<(&str, &[Inline])> = paragraphs
            .iter()
            .filter_map(|b| match b {
                Block::Paragraph { name, content, .. } => Some((name.as_str(), content.as_slice())),
                _ => None,
            })
            .collect();
        let counted = |name: &str| crate::formats::kinds::facts(name, &[]).counted;
        shown_of(stretch_numbers(&paras, numbering, every, &counted))
    }

    #[test]
    fn the_lines_of_a_paragraph_are_parted_by_its_line_breaks_each_with_the_mark_that_begins_it() {
        let content = vec![mark().number("45").done(), w("one"), BR, w("two"), BR, mark().hidden().done(), w("three")];
        let lines = lines_of(&content);
        let said: Vec<(Option<String>, usize, bool)> = lines
            .iter()
            .map(|l| {
                let m = l.mark.map(|m| m.number.map_or_else(|| m.hidden.to_string(), str::to_owned));
                (m, l.content.len(), l.blank)
            })
            .collect();
        assert_eq!(said, [(Some("45".into()), 1, false), (None, 1, false), (Some("true".into()), 1, false)]);
    }

    #[test]
    fn an_empty_paragraph_is_one_blank_line_and_two_breaks_hold_a_blank_line() {
        assert_eq!(lines_of(&[]).iter().map(|l| l.blank).collect::<Vec<_>>(), [true]);
        let content = [w("a"), BR, BR, w("b")];
        assert_eq!(lines_of(&content).iter().map(|l| l.blank).collect::<Vec<_>>(), [false, true, false]);
    }

    #[test]
    fn stretches_are_runs_of_paragraphs_with_the_same_numbering_settings_whatever_their_kinds() {
        let counted = |name: &str, every: Option<u32>, words: &str| {
            Block::of_kind(name, vec![w(words)]).numbered(Numbering::Counted, every, None)
        };
        let blocks = vec![
            Block::paragraph(vec![w("prose")]),
            counted("speaker", None, "Nurse"),
            counted("line", None, "a"),
            counted("text", Some(2), "b"),
            Block::Break { what: crate::document::BreakKind::Page },
            counted("line", Some(2), "c"),
        ];
        let found: Vec<(usize, usize, Option<u32>)> =
            stretches(&blocks).iter().map(|s| (s.from, s.to, s.every)).collect();
        assert_eq!(found, [(1, 3, None), (3, 4, Some(2)), (5, 6, Some(2))]);
    }

    #[test]
    fn a_stretch_counts_lines_across_stanzas_and_through_a_speaker_and_passes_over_an_empty_line() {
        let paragraphs = [
            Block::of_kind("speaker", vec![w("Nurse")]),
            Block::of_kind("line", vec![mark().number("1").done(), w("one"), BR, w("two"), BR, w("three")]),
            Block::of_kind("line", vec![w("four"), BR, BR, w("five")]),
        ];
        assert_eq!(numbered(&paragraphs, Numbering::Counted, 1), ["-", "1! 2 3", "4 - 5"]);
    }

    #[test]
    fn a_stretch_counts_a_line_marked_hidden_showing_nothing_on_it_and_passes_over_one_not_counted() {
        let paragraphs = [Block::of_kind(
            "line",
            vec![
                mark().number("1").done(),
                w("a"),
                BR,
                mark().hidden().done(),
                w("b"),
                BR,
                w("c"),
                BR,
                mark().uncounted().done(),
                w("d"),
                BR,
                w("e"),
            ],
        )];
        assert_eq!(numbered(&paragraphs, Numbering::Counted, 2), ["1! - - - 4"]);
    }

    #[test]
    fn a_stretch_numbers_prose_paragraph_by_paragraph_each_one_line() {
        let paragraphs =
            [Block::paragraph(vec![mark().number("1").done(), w("First.")]), Block::paragraph(vec![w("Second.")])];
        assert_eq!(numbered(&paragraphs, Numbering::Counted, 1), ["1!", "2"]);
    }

    #[test]
    fn a_stretch_shows_only_what_was_given_where_the_numbering_is_given() {
        let paragraphs = [Block::of_kind(
            "line",
            vec![mark().number("45").done(), w("a"), BR, w("b"), BR, mark().number("77").done(), w("c")],
        )];
        assert_eq!(numbered(&paragraphs, Numbering::Given, 1), ["45! - 77!"]);
    }
}
