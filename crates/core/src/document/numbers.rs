//! The numbers of the lines of a numbered stretch: which show one, and what
//! it says; and the lines and stretches of a text. The same rules are kept
//! in TypeScript (`src/lib/project/model/lines.ts`), which the editor
//! follows; the documents are made by these. See ADR 0039, 0041 and 0067.
//!
//! A text is paragraphs, and a paragraph is lines, parted by line breaks.
//! A stretch is consecutive paragraphs with the same numbering settings,
//! whatever their kinds; its lines are numbered together. A line is counted
//! when its paragraph's kind is counted, the stretch counts every kind or
//! that one (`only`), its mark does not say otherwise, and it holds
//! something to read; an empty line, as between two stanzas, never is. A
//! stretch that is *counted* begins its count at the number it says
//! (`from`), taken up at its first counted line, or else at the first
//! counted line that was given a number by hand; the count goes on from
//! the last run of digits of a number given: after "1234" comes 1235,
//! after "1094a1" comes "1094a2", and after "11b" comes 12. One without
//! digits leaves the count as it was.
//!
//! Which numbers stand on the page: a counted line's, where its number can
//! be divided by `every`, so that a count from 1 or 41 every 5 shows 5 or
//! 45 first; and every number given to a line by hand, always, since the
//! writer put it there to be seen. A line marked `shown` always shows its
//! number, one marked `hidden` never. A line that is not counted shows only
//! what was given it by hand; a stretch whose numbering is *given* shows
//! only the numbers given by hand and counts nothing; one numbered *not at
//! all* shows nothing.

use super::{Block, Inline, Numbering, Side};

/// The number a line shows in the margin, and whether it was given by hand.
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
    // After the last character that is not a digit, at its own width: "§5"
    // has two bytes before its digit.
    let begin =
        label[..end].char_indices().rev().find(|(_, c)| !c.is_ascii_digit()).map_or(0, |(i, c)| i + c.len_utf8());
    let digits = &label[begin..end];
    let n = digits.parse::<i64>().ok()?;
    let width = if digits.len() > 1 && digits.starts_with('0') { digits.len() } else { 0 };
    Some(Count { prefix: label[..begin].to_owned(), next: n, width })
}

fn written(count: &Count, n: i64) -> String {
    let digits = format!("{:0width$}", n.unsigned_abs(), width = count.width);
    format!("{}{}{digits}", count.prefix, if n < 0 { "-" } else { "" })
}

/// What the count needs of a line: whether it takes it in (its kind is
/// counted, and the writer did not say otherwise), the number given it by
/// hand, and whether the writer said its number is always shown.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Counted<'a> {
    pub counted: bool,
    pub number: Option<&'a str>,
    pub shown: bool,
}

/// What each line of a stretch shows in the margin: its number, or
/// nothing. `every` is the stretch's, or the layout's; nought counts as
/// one. `from` is the number the stretch's count begins from, where it
/// says one. See the head of this file for which numbers stand on the page.
pub fn numbers(numbering: Numbering, every: u32, from: Option<&str>, lines: &[Counted]) -> Vec<Option<Shown>> {
    if numbering == Numbering::None {
        return vec![None; lines.len()];
    }
    let step = i64::from(every.max(1));
    let mut count: Option<Count> = None;
    // The number the count begins from, taken up at the first counted line
    // that has no number of its own before any number given.
    let mut begins = from.map(str::trim).filter(|f| !f.is_empty()).and_then(read_label);
    lines
        .iter()
        .map(|line| {
            let given = line.number.map(str::trim).unwrap_or("");
            if numbering == Numbering::Given || !line.counted {
                return (!given.is_empty()).then(|| Shown { label: given.to_owned(), set: true });
            }
            if !given.is_empty() {
                begins = None;
                if let Some(read) = read_label(given) {
                    count = Some(Count { next: read.next.saturating_add(1), ..read });
                }
                return Some(Shown { label: given.to_owned(), set: true });
            }
            if count.is_none() {
                count = begins.take();
            }
            let count = count.as_mut()?;
            let n = count.next;
            count.next = count.next.saturating_add(1);
            (n % step == 0 || line.shown).then(|| Shown { label: written(count, n), set: false })
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
    /// The number is always shown.
    pub shown: bool,
    /// The words in the margin, trimmed; nothing where there are none.
    pub margin: Option<&'a str>,
    pub indent: u32,
    /// The line begins where the line before ended.
    pub continues: bool,
}

impl<'a> Mark<'a> {
    /// What a line mark says; nothing of anything else.
    pub fn of(inline: &'a Inline) -> Option<Mark<'a>> {
        let Inline::LineMark { number, counted, hidden, shown, margin, indent, continues } = inline else {
            return None;
        };
        let given = |s: &'a Option<String>| s.as_deref().map(str::trim).filter(|s| !s.is_empty());
        Some(Mark {
            number: given(number),
            counted: *counted,
            hidden: *hidden,
            shown: *shown && !*hidden,
            margin: given(margin),
            indent: *indent,
            continues: *continues,
        })
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
pub struct Stretch<'a> {
    pub from: usize,
    pub to: usize,
    pub numbering: Numbering,
    pub every: Option<u32>,
    pub side: Option<Side>,
    /// The one kind whose lines are counted; nothing for every kind that is counted.
    pub only: Option<&'a str>,
    /// The number the count begins from; nothing where it begins at the first number given.
    pub begins: Option<&'a str>,
}

/// The numbered stretches of a text, in order: runs of consecutive
/// paragraphs whose numbering is not *none* and whose settings are the
/// same. Anything that is not a paragraph ends a stretch.
pub fn stretches(blocks: &[Block]) -> Vec<Stretch<'_>> {
    let mut out: Vec<Stretch> = Vec::new();
    let mut open = false;
    for (i, b) in blocks.iter().enumerate() {
        let Block::Paragraph { numbering, every, side, only, from, .. } = b else {
            open = false;
            continue;
        };
        if *numbering == Numbering::None {
            open = false;
            continue;
        }
        let only = only.as_deref();
        let begins = from.as_deref();
        if open
            && let Some(at) = out.last_mut()
            && at.to == i
            && at.numbering == *numbering
            && at.every == *every
            && at.side == *side
            && at.only == only
            && at.begins == begins
        {
            at.to = i + 1;
            continue;
        }
        out.push(Stretch { from: i, to: i + 1, numbering: *numbering, every: *every, side: *side, only, begins });
        open = true;
    }
    out
}

/// What each line of a stretch shows on the page, paragraph by paragraph
/// and line by line: the paragraphs of the stretch as their kind and their
/// content, how it is numbered, every how many (the stretch's, else the
/// layout's), the number its count begins from, where it says one, and
/// whether the lines of a kind are counted, as `facts` says of it and the
/// stretch's one kind (`only`) allows. A line marked hidden shows nothing.
pub fn stretch_numbers(
    paragraphs: &[(&str, &[Inline])],
    numbering: Numbering,
    every: u32,
    only: Option<&str>,
    from: Option<&str>,
    counted_kind: &dyn Fn(&str) -> bool,
) -> Vec<Vec<Option<Shown>>> {
    let lines: Vec<Vec<Line>> = paragraphs.iter().map(|(_, content)| lines_of(content)).collect();
    let mut counted: Vec<Counted> = Vec::new();
    for ((name, _), ls) in paragraphs.iter().zip(&lines) {
        let kind = counted_kind(name) && only.is_none_or(|o| o == *name);
        for l in ls {
            counted.push(Counted {
                counted: kind && l.mark.is_none_or(|m| m.counted) && !l.blank,
                number: l.mark.and_then(|m| m.number),
                shown: l.mark.is_some_and(|m| m.shown),
            });
        }
    }
    let mut flat = numbers(numbering, every, from, &counted).into_iter();
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

    fn line(number: Option<&'static str>, counted: bool) -> Counted<'static> {
        Counted { counted, number, shown: false }
    }

    fn always(number: Option<&'static str>) -> Counted<'static> {
        Counted { counted: true, number, shown: true }
    }

    fn plain(n: usize) -> Vec<Counted<'static>> {
        vec![line(None, true); n]
    }

    /// What stands on the page, line by line: "-" where nothing, "!" after a number given by hand.
    fn shown(numbering: Numbering, every: u32, lines: &[Counted]) -> Vec<String> {
        shown_from(numbering, every, None, lines)
    }

    /// The same, the stretch counting from the number given.
    fn shown_from(numbering: Numbering, every: u32, from: Option<&str>, lines: &[Counted]) -> Vec<String> {
        numbers(numbering, every, from, lines)
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
    fn count_from_the_number_the_stretch_begins_from_showing_it_only_where_it_falls_on_every() {
        let mut lines = plain(6);
        assert_eq!(shown_from(Numbering::Counted, 5, Some("1"), &lines), ["-", "-", "-", "-", "5", "-"]);
        assert_eq!(shown_from(Numbering::Counted, 5, Some("41"), &lines), ["-", "-", "-", "-", "45", "-"]);
        assert_eq!(shown_from(Numbering::Counted, 5, Some("45"), &lines), ["45", "-", "-", "-", "-", "50"]);
        assert_eq!(shown_from(Numbering::Counted, 1, Some("1"), &lines[..2]), ["1", "2"]);
        // Taken up at the first counted line: one not counted before it is passed over.
        lines.insert(0, line(None, false));
        assert_eq!(shown_from(Numbering::Counted, 5, Some("5"), &lines), ["-", "5", "-", "-", "-", "-", "10"]);
    }

    #[test]
    fn a_number_given_by_hand_is_shown_and_the_count_goes_on_from_it_whatever_the_stretch_begins_from() {
        let mut lines = vec![line(Some("41"), true)];
        lines.extend(plain(5));
        assert_eq!(shown_from(Numbering::Counted, 5, Some("1"), &lines), ["41!", "-", "-", "-", "45", "-"]);
        let mut lines = plain(2);
        lines.push(line(Some("12"), true));
        lines.extend(plain(3));
        assert_eq!(shown_from(Numbering::Counted, 5, Some("1"), &lines), ["-", "-", "12!", "-", "-", "15"]);
        assert_eq!(
            numbers(Numbering::Counted, 5, Some("1"), &lines[2..3]),
            [Some(Shown { label: "12".into(), set: true })]
        );
    }

    #[test]
    fn always_show_a_label_with_letters_and_go_on_from_it_after_11b_comes_12() {
        let mut lines = vec![line(Some("10"), true), line(None, true), line(Some("11b"), true)];
        lines.extend(plain(2));
        assert_eq!(shown(Numbering::Counted, 1, &lines), ["10!", "11", "11b!", "12", "13"]);
        let mut lines = vec![line(Some("10"), true), line(Some("11b"), true)];
        lines.extend(plain(4));
        assert_eq!(shown(Numbering::Counted, 5, &lines), ["10!", "11b!", "-", "-", "-", "15"]);
    }

    #[test]
    fn show_the_number_of_a_line_said_to_be_always_shown() {
        let lines = [line(Some("40"), true), line(None, true), always(None), line(None, true)];
        assert_eq!(shown(Numbering::Counted, 5, &lines), ["40!", "-", "42", "-"]);
        let lines = [always(Some("41")), line(None, true)];
        assert_eq!(shown(Numbering::Counted, 5, &lines), ["41!", "-"]);
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
    fn go_on_from_a_label_with_a_letter_of_more_than_one_byte_before_its_digits() {
        for (given, next) in [("§5", "§6"), ("ι1", "ι2"), ("α12", "α13"), ("¶3", "¶4"), ("–7", "–8")] {
            let mut lines = vec![line(Some(given), true)];
            lines.extend(plain(1));
            assert_eq!(shown(Numbering::Counted, 1, &lines), [format!("{given}!"), next.to_owned()]);
        }
    }

    #[test]
    fn a_label_of_the_largest_number_does_not_overflow_the_count() {
        let mut lines = vec![line(Some("9223372036854775807"), true)];
        lines.extend(plain(2));
        let shown = shown(Numbering::Counted, 1, &lines);
        assert_eq!(shown[0], "9223372036854775807!");
        assert_eq!(shown.len(), 3);
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
        numbered_only(paragraphs, numbering, every, None)
    }

    fn numbered_only(paragraphs: &[Block], numbering: Numbering, every: u32, only: Option<&str>) -> Vec<String> {
        let paras: Vec<(&str, &[Inline])> = paragraphs
            .iter()
            .filter_map(|b| match b {
                Block::Paragraph { name, content, .. } => Some((name.as_str(), content.as_slice())),
                _ => None,
            })
            .collect();
        let counted = |name: &str| crate::formats::kinds::facts(name, &[]).counted;
        shown_of(stretch_numbers(&paras, numbering, every, only, None, &counted))
    }

    #[test]
    fn a_stretch_counts_from_the_number_it_says_at_its_first_counted_line() {
        let paragraphs = vec![
            Block::of_kind("speaker", vec![w("Nurse")]),
            Block::of_kind("line", vec![w("one"), BR, w("two"), BR, w("three")]),
            Block::of_kind("line", vec![w("four"), BR, mark().number("40").done(), w("forty"), BR, w("forty-one")]),
        ];
        let paras: Vec<(&str, &[Inline])> = paragraphs
            .iter()
            .filter_map(|b| match b {
                Block::Paragraph { name, content, .. } => Some((name.as_str(), content.as_slice())),
                _ => None,
            })
            .collect();
        let counted = |name: &str| crate::formats::kinds::facts(name, &[]).counted;
        assert_eq!(
            shown_of(stretch_numbers(&paras, Numbering::Counted, 2, None, Some("1"), &counted)),
            ["-", "- 2 -", "4 40! -"]
        );
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
            counted("line", Some(2), "d").counting_only("line"),
        ];
        let found: Vec<(usize, usize, Option<u32>, Option<&str>)> =
            stretches(&blocks).iter().map(|s| (s.from, s.to, s.every, s.only)).collect();
        assert_eq!(
            found,
            [(1, 3, None, None), (3, 4, Some(2), None), (5, 6, Some(2), None), (6, 7, Some(2), Some("line"))]
        );
    }

    #[test]
    fn a_stretch_counts_only_the_lines_of_the_one_kind_said_passing_over_the_others_as_a_speaker_is() {
        let paragraphs = [
            Block::of_kind("line", vec![mark().number("1").done(), w("a"), BR, w("b")]),
            Block::of_kind("quote", vec![w("Quoted."), BR, mark().number("Q").done(), w("More.")]),
            Block::of_kind("line", vec![w("c")]),
        ];
        assert_eq!(numbered_only(&paragraphs, Numbering::Counted, 1, Some("line")), ["1! 2", "- Q!", "3"]);
    }

    #[test]
    fn a_stretch_shows_a_line_said_to_be_always_shown_in_a_count_every_five() {
        let paragraphs = [Block::of_kind(
            "line",
            vec![mark().number("40").done(), w("a"), BR, w("b"), BR, mark().shown().done(), w("c")],
        )];
        assert_eq!(numbered(&paragraphs, Numbering::Counted, 5), ["40! - 42"]);
    }

    #[test]
    fn the_one_kind_counted_and_a_line_always_shown_are_read_and_written_as_the_interface_sends_them() {
        let json = r#"{"kind":"paragraph","name":"line","indent":0,"numbering":"counted","only":"line","content":[{"kind":"linemark","shown":true},{"kind":"text","text":"a","marks":{}}]}"#;
        let block: Block = serde_json::from_str(json).unwrap();
        let Block::Paragraph { only, content, .. } = &block else { panic!() };
        assert_eq!(only.as_deref(), Some("line"));
        assert!(matches!(content[0], Inline::LineMark { shown: true, hidden: false, .. }));
        assert_eq!(serde_json::to_string(&block).unwrap(), json);
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
