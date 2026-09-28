//! From lines to paragraphs: the text of a page as it is kept.
//!
//! Tesseract tells the words of a page with where each stands, line by line
//! and paragraph by paragraph (its TSV). The text that a PDF has is told
//! line by line with where each line stands, and its paragraphs are found
//! here by the room between the lines and where they begin and end.
//!
//! A word that was broken at the end of a line is joined again. Whether
//! "for-" and "skning" make "forskning", or "Oslo-" and "avtalen" make
//! "Oslo-avtalen", a dictionary of the language tells best, where there is
//! one. Where there is none, a rule: the hyphen goes when the next line
//! begins with a small letter and the part before it does not look like a
//! name.

/// Whether a word is a word of the language, as a dictionary knows.
pub type IsWord<'a> = dyn Fn(&str) -> bool + Sync + 'a;

/// A line of a page, and where it stands: from the top left of the page,
/// in points or in dots, as long as it is the same for all its lines.
#[derive(Debug, Clone, PartialEq)]
pub struct Line {
    pub text: String,
    pub left: f32,
    pub right: f32,
    pub top: f32,
    pub bottom: f32,
}

impl Line {
    fn height(&self) -> f32 {
        (self.bottom - self.top).max(0.0)
    }
}

// ---------------------------------------------------------------------------
// What Tesseract read
// ---------------------------------------------------------------------------

/// The paragraphs of what Tesseract read, from its TSV, each as its lines.
/// A row of the TSV is a page, a block, a paragraph, a line or a word, by
/// its level; the words (level 5) say which of the others they are in.
pub fn tsv_paragraphs(tsv: &str) -> Vec<Vec<Line>> {
    let mut paragraphs: Vec<Vec<Line>> = Vec::new();
    // The page, block, paragraph and line of the word before.
    let mut last: Option<[u32; 4]> = None;
    for row in tsv.lines().skip(1) {
        let columns: Vec<&str> = row.split('\t').collect();
        if columns.len() < 12 || columns[0] != "5" {
            continue;
        }
        let text = columns[11..].join(" ");
        let text = text.trim();
        if text.is_empty() {
            continue;
        }
        let number = |i: usize| columns[i].trim().parse::<u32>().unwrap_or(0);
        let measure = |i: usize| columns[i].trim().parse::<f32>().unwrap_or(0.0);
        let at = [number(1), number(2), number(3), number(4)];
        let (left, top, width, height) = (measure(6), measure(7), measure(8), measure(9));
        if last.is_none_or(|l| l[..3] != at[..3]) {
            paragraphs.push(Vec::new());
        }
        let lines = paragraphs.last_mut().expect("a paragraph was begun");
        if last != Some(at) || lines.is_empty() {
            lines.push(Line { text: String::new(), left, right: left + width, top, bottom: top + height });
        }
        let line = lines.last_mut().expect("a line was begun");
        if !line.text.is_empty() {
            line.text.push(' ');
        }
        line.text.push_str(text);
        line.left = line.left.min(left);
        line.right = line.right.max(left + width);
        line.top = line.top.min(top);
        line.bottom = line.bottom.max(top + height);
        last = Some(at);
    }
    paragraphs
}

// ---------------------------------------------------------------------------
// The text a PDF has
// ---------------------------------------------------------------------------

fn median(mut values: Vec<f32>) -> Option<f32> {
    if values.is_empty() {
        return None;
    }
    values.sort_by(f32::total_cmp);
    Some(values[values.len() / 2])
}

/// Lines of a page, in the order in which they are read, gathered into
/// paragraphs by where they stand. A paragraph ends where the room to the
/// next line is larger than the room between lines on the page, where the
/// next line goes up (a new column) or is in another size of letter, where
/// it begins further in than the line before (an indent), and where a line
/// that ends a sentence ends short of the lines beside it.
pub fn by_place(lines: Vec<Line>) -> Vec<Vec<Line>> {
    // The room from one line to the next, where they follow each other down the page.
    let steps: Vec<f32> = lines
        .windows(2)
        .filter_map(|w| {
            let step = w[1].top - w[0].top;
            let near = 3.0 * w[0].height().max(w[1].height());
            (step > 0.0 && step < near).then_some(step)
        })
        .collect();
    let step = median(steps);

    let mut paragraphs: Vec<Vec<Line>> = Vec::new();
    for (i, line) in lines.iter().enumerate() {
        let apart = match i.checked_sub(1).map(|p| &lines[p]) {
            None => true,
            Some(before) => {
                let height = before.height().max(line.height()).max(1.0);
                let down = line.top - before.top;
                let wide = step.is_some_and(|step| down > 1.3 * step);
                let up = down < -0.5 * height;
                let beside = line.left > before.right && down.abs() < height;
                let sized = (line.height() - before.height()).abs() > 0.25 * height;
                let indented = line.left - before.left > 0.8 * height;
                let right = lines.get(i.saturating_sub(2)).map_or(line.right, |l| l.right).max(line.right);
                let short = before.right < right - 2.0 * height && ends_sentence(&before.text);
                wide || up || beside || sized || indented || short
            }
        };
        if apart {
            paragraphs.push(Vec::new());
        }
        paragraphs.last_mut().expect("a paragraph was begun").push(line.clone());
    }
    paragraphs
}

// ---------------------------------------------------------------------------
// Lines joined
// ---------------------------------------------------------------------------

/// Signs that a word is broken at the end of a line: the hyphen, the hyphen
/// of Unicode, and the sign of negation, which some fonts and programs set
/// for it.
const HYPHENS: [char; 3] = ['-', '\u{2010}', '¬'];

/// How a line ends, for the next to be joined to it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Ending {
    /// With a soft hyphen: a word broken where it may be, which is joined again.
    Soft,
    /// With a hyphen right after a letter or a digit.
    Hyphen,
    /// With a dash or a slash right after a letter or a digit, as in
    /// `1914–` and `and/`: what follows goes on without a space.
    Close,
    /// Otherwise: a space between.
    Space,
}

fn ending(text: &str) -> Ending {
    let mut back = text.chars().rev();
    let (Some(last), before) = (back.next(), back.next()) else { return Ending::Space };
    let after_word = before.is_some_and(char::is_alphanumeric);
    match last {
        '\u{ad}' => Ending::Soft,
        c if HYPHENS.contains(&c) && after_word => Ending::Hyphen,
        '–' | '—' | '/' if after_word => Ending::Close,
        _ => Ending::Space,
    }
}

/// Whether a text ends a sentence, whatever closes after the full stop.
fn ends_sentence(text: &str) -> bool {
    text.trim_end().trim_end_matches(['"', '\'', '”', '’', '»', ')', ']', '*']).ends_with(['.', '!', '?', ':', '…'])
}

/// Whether the part of a word before the hyphen looks like a name: it has
/// capitals after its first letter (`NATO`, `McLuhan`), or begins with one
/// where no sentence begins.
fn looks_like_name(head: &str, begins_sentence: bool) -> bool {
    let mut letters = head.chars();
    let first = letters.next().is_some_and(char::is_uppercase);
    letters.any(char::is_uppercase) || (first && !begins_sentence)
}

/// Whether the hyphen between `head`, the end of one line, and the word
/// that begins the next goes, the two being one word; or stays, the word
/// having a hyphen of its own.
fn hyphen_goes(head: &str, next: &str, begins_sentence: bool, is_word: Option<&IsWord>) -> bool {
    let tail: String = next.chars().take_while(|c| c.is_alphabetic()).collect();
    if head.is_empty() || tail.is_empty() || !head.chars().all(char::is_alphabetic) {
        return false;
    }
    if let Some(is_word) = is_word {
        if is_word(&format!("{head}{tail}")) {
            return true;
        }
        // Two words the dictionary knows, and no word of them together: a word with a hyphen.
        if is_word(head) && is_word(&tail) {
            return false;
        }
    }
    tail.starts_with(char::is_lowercase) && !looks_like_name(head, begins_sentence)
}

/// The last word of a text, without the sign that ends it and what stands
/// before it (a bracket, a quotation mark), and whether a sentence begins
/// with it.
fn last_word(text: &str) -> (&str, bool) {
    let body = &text[..text.len() - text.chars().next_back().map_or(0, char::len_utf8)];
    let (before, word) = match body.rfind(char::is_whitespace) {
        Some(at) => (&body[..at], &body[at..]),
        None => ("", body),
    };
    let word = word.trim_start_matches(|c: char| !c.is_alphanumeric());
    let before = before.trim_end();
    (word, before.is_empty() || ends_sentence(before))
}

/// Joins what follows to what went before, as the end of one line to the
/// beginning of the next.
fn join_to(out: &mut String, next: &str, is_word: Option<&IsWord>) {
    let next = next.trim();
    if next.is_empty() {
        return;
    }
    if out.is_empty() {
        out.push_str(next);
        return;
    }
    match ending(out) {
        Ending::Soft => {
            out.pop();
        }
        Ending::Hyphen => {
            let (head, begins) = last_word(out);
            let first = next.split_whitespace().next().unwrap_or("");
            if hyphen_goes(head, first, begins, is_word) {
                out.pop();
            }
        }
        Ending::Close => {}
        Ending::Space => out.push(' '),
    }
    out.push_str(next);
}

/// The lines of a paragraph as one text: a word broken at the end of a
/// line is joined again, and lines are otherwise set apart by a space.
pub fn join_lines<'s>(lines: impl IntoIterator<Item = &'s str>, is_word: Option<&IsWord>) -> String {
    let mut out = String::new();
    for line in lines {
        join_to(&mut out, line, is_word);
    }
    out
}

/// Whether a paragraph is only the number of the page: `17`, `- 17 -`,
/// `[17]`, or one in small Roman numerals, `xiv`, as the pages before the
/// text are numbered.
fn is_page_number(text: &str) -> bool {
    let bare = text.trim_matches(|c: char| c.is_whitespace() || matches!(c, '-' | '–' | '—' | '[' | ']' | '(' | ')'));
    let digits = (1..=4).contains(&bare.len()) && bare.bytes().all(|b| b.is_ascii_digit());
    let roman = (1..=7).contains(&bare.len()) && bare.chars().all(|c| "ivxlc".contains(c));
    digits || roman
}

/// Whether a paragraph goes on in the next: it does not end a sentence, and
/// the next begins with a small letter, as where the text of a column went
/// on in the next, or a figure stood between.
fn goes_on(before: &str, next: &str) -> bool {
    next.chars().next().is_some_and(char::is_lowercase) && !ends_sentence(before)
}

/// The paragraphs of a page as they are kept. Lines without a letter or a
/// digit are left out: they are what is made of a rule across the page or
/// of a picture. A paragraph that goes on after something came between is
/// joined again, and the number of the page, standing alone at its head or
/// its foot, is left out.
pub fn page_paragraphs(groups: Vec<Vec<Line>>, is_word: Option<&IsWord>) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for lines in groups {
        let lines = lines.iter().map(|l| l.text.as_str()).filter(|t| t.chars().any(char::is_alphanumeric));
        let text = join_lines(lines, is_word);
        if text.is_empty() {
            continue;
        }
        match out.last_mut() {
            Some(before) if goes_on(before, &text) => join_to(before, &text, is_word),
            _ => out.push(text),
        }
    }
    if out.first().is_some_and(|p| is_page_number(p)) {
        out.remove(0);
    }
    if out.last().is_some_and(|p| is_page_number(p)) {
        out.pop();
    }
    out
}

/// A word broken at the foot of one page is joined again with its end at
/// the head of the next, on the page where it begins. `pages` are the
/// paragraphs of each page, in order.
pub fn mend_across(pages: &mut [Vec<String>], is_word: Option<&IsWord>) {
    for i in 1..pages.len() {
        let (before, after) = pages.split_at_mut(i);
        let (Some(last), Some(first)) = (before[i - 1].last_mut(), after[0].first_mut()) else { continue };
        if ending(last) != Ending::Hyphen {
            continue;
        }
        let (word, rest) = match first.split_once(char::is_whitespace) {
            Some((word, rest)) => (word.to_owned(), rest.trim_start().to_owned()),
            None => (first.clone(), String::new()),
        };
        if !word.starts_with(char::is_lowercase) {
            continue;
        }
        join_to(last, &word, is_word);
        *first = rest;
        if first.is_empty() {
            after[0].remove(0);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn line(text: &str, left: f32, top: f32, right: f32) -> Line {
        Line { text: text.to_owned(), left, right, top, bottom: top + 10.0 }
    }

    #[test]
    fn words_broken_at_the_end_of_a_line_by_the_rule() {
        let join = |lines: &[&str]| join_lines(lines.iter().copied(), None);
        assert_eq!(join(&["Den nye for-", "skningen er god."]), "Den nye forskningen er god.");
        // A name keeps its hyphen, and so does a word with a number or capitals in it.
        assert_eq!(join(&["etter at Oslo-", "avtalen kom"]), "etter at Oslo-avtalen kom");
        assert_eq!(join(&["the wrath of Achil-", "les"]), "the wrath of Achil-les");
        assert_eq!(join(&["mange NATO-", "land"]), "mange NATO-land");
        assert_eq!(join(&["på 1990-", "tallet"]), "på 1990-tallet");
        // Where a sentence begins, a capital says nothing.
        assert_eq!(join(&["Det var slik. For-", "skningen gikk"]), "Det var slik. Forskningen gikk");
        assert_eq!(join(&["For-", "skningen gikk"]), "Forskningen gikk");
        // What follows with a capital is another word.
        assert_eq!(join(&["pre-", "Columbian art"]), "pre-Columbian art");
        // A dash with a space before it is a dash; one after a number binds.
        assert_eq!(join(&["the hero –", "and his wrath"]), "the hero – and his wrath");
        assert_eq!(join(&["in 1914–", "1918"]), "in 1914–1918");
        assert_eq!(join(&["and/", "or"]), "and/or");
        // A soft hyphen always goes.
        assert_eq!(join(&["hyphen\u{ad}", "ation"]), "hyphenation");
        assert_eq!(join(&["(Achil-", "les) wept"]), "(Achilles) wept");
        assert_eq!(join(&["  one ", "", " two  "]), "one two");
    }

    #[test]
    fn words_broken_at_the_end_of_a_line_by_the_dictionary() {
        let known = ["forskning", "well", "known", "Oslo", "avtale"];
        let is_word = |word: &str| known.contains(&word);
        let join = |lines: &[&str]| join_lines(lines.iter().copied(), Some(&is_word));
        assert_eq!(join(&["for-", "skning"]), "forskning");
        // Two words, and no word of them together.
        assert_eq!(join(&["a well-", "known tale"]), "a well-known tale");
        // Where the dictionary does not tell, the rule does.
        assert_eq!(join(&["gam-", "mel"]), "gammel");
        assert_eq!(join(&["fra Bergen-", "kanten"]), "fra Bergen-kanten");
    }

    #[test]
    fn what_tesseract_read_as_paragraphs() {
        let tsv = "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n\
                   1\t1\t0\t0\t0\t0\t0\t0\t1654\t1181\t-1\t\n\
                   4\t1\t1\t1\t1\t0\t142\t140\t1369\t43\t-1\t\n\
                   5\t1\t1\t1\t1\t1\t142\t140\t233\t43\t91.8\tForskningen\n\
                   5\t1\t1\t1\t1\t2\t393\t141\t44\t42\t92.7\tpå\n\
                   5\t1\t1\t1\t2\t1\t143\t200\t143\t32\t92.2\tHomer.\n\
                   5\t1\t1\t2\t1\t1\t200\t300\t143\t32\t92.2\tDen\n\
                   5\t1\t1\t2\t1\t2\t350\t300\t10\t32\t12.0\t \n\
                   5\t1\t1\t2\t1\t3\t380\t300\t143\t32\t92.2\tandre\n";
        let read = tsv_paragraphs(tsv);
        assert_eq!(read.len(), 2);
        assert_eq!(read[0].iter().map(|l| l.text.as_str()).collect::<Vec<_>>(), vec!["Forskningen på", "Homer."]);
        assert_eq!(read[0][0], line("Forskningen på", 142.0, 140.0, 437.0).with_bottom(183.0));
        assert_eq!(read[1][0].text, "Den andre");
        assert!(tsv_paragraphs("").is_empty());
    }

    impl Line {
        fn with_bottom(mut self, bottom: f32) -> Line {
            self.bottom = bottom;
            self
        }
    }

    #[test]
    fn paragraphs_of_a_page_by_where_the_lines_stand() {
        let lines = vec![
            // A heading in larger letters.
            Line { text: "The wrath".into(), left: 50.0, right: 150.0, top: 40.0, bottom: 58.0 },
            line("Sing, goddess, the wrath of the war-", 50.0, 70.0, 300.0),
            line("rior, son of Peleus, that brought", 50.0, 82.0, 300.0),
            line("countless woes.", 50.0, 94.0, 140.0),
            // An indent.
            line("Many a brave soul it sent", 62.0, 106.0, 300.0),
            line("to Hades.", 50.0, 118.0, 100.0),
            // Room between.
            line("So the will of Zeus", 50.0, 150.0, 300.0),
        ];
        let paragraphs = page_paragraphs(by_place(lines), None);
        assert_eq!(
            paragraphs,
            vec![
                "The wrath",
                "Sing, goddess, the wrath of the warrior, son of Peleus, that brought countless woes.",
                "Many a brave soul it sent to Hades.",
                "So the will of Zeus",
            ]
        );
    }

    #[test]
    fn what_is_not_text_is_left_out_and_what_goes_on_is_joined() {
        let group = |texts: &[&str]| texts.iter().map(|t| line(t, 0.0, 0.0, 0.0)).collect::<Vec<_>>();
        let paragraphs = page_paragraphs(
            vec![
                group(&["- 17 -"]),
                group(&["The singer of"]),
                group(&["|| ~~ —"]),
                group(&["tales sang; his art was", "old."]),
                group(&["Then came the book."]),
                group(&["xiv"]),
            ],
            None,
        );
        assert_eq!(paragraphs, vec!["The singer of tales sang; his art was old.", "Then came the book."]);
        // A chapter numbered in capitals is kept.
        assert_eq!(page_paragraphs(vec![group(&["IV"]), group(&["Text."])], None), vec!["IV", "Text."]);
    }

    #[test]
    fn a_word_broken_at_the_foot_of_a_page() {
        let mut pages = vec![
            vec!["First.".to_owned(), "The wrath of the war-".to_owned()],
            vec!["rior was great.".to_owned()],
            vec!["Ends here, con-".to_owned()],
            vec!["Chapter 2".to_owned()],
            vec!["word-".to_owned()],
            vec!["alone".to_owned(), "Next.".to_owned()],
        ];
        mend_across(&mut pages, None);
        assert_eq!(pages[0], vec!["First.", "The wrath of the warrior"]);
        assert_eq!(pages[1], vec!["was great."]);
        assert_eq!(pages[2], vec!["Ends here, con-"]);
        assert_eq!(pages[4], vec!["wordalone"]);
        assert_eq!(pages[5], vec!["Next."]);
    }
}
