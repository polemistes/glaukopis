//! From the shapes of Pandoc to those of the application: the blocks and
//! lines of the document in sections, what it says of itself, and what is
//! counted of it.

use super::locating::{locator, terms_for};
use super::pictures::{name_of, width_for};
use super::plain::{clean, text_of};
use super::*;

// =========================================================================
// From the shapes of Pandoc to ours
// =========================================================================

type Marks = BTreeMap<String, Value>;

/// Something that stands in a line, or something that the line is divided by.
enum Piece {
    Inline(Inline),
    Block(Block),
}

#[derive(Default)]
struct Tally {
    code: usize,
    definitions: usize,
    rules: usize,
    raw: usize,
    /// Notes on headings, which stand in the text under them.
    moved: usize,
    /// What is said of figures and tables: what was made of it.
    said: captions::Taken,
    /// Headings where a map has none: in quotations, lists, tables.
    headings: usize,
    /// Pictures that were left out, with why.
    lost: Vec<(String, String)>,
    cited: usize,
    not_found: usize,
    /// Citations of EndNote that Pandoc read.
    endnote: usize,
}

struct Part {
    /// The level the file gives the heading; 0 for what stands before the first.
    level: i64,
    heading: Vec<Inline>,
    /// The notes of the heading.
    notes: Vec<Inline>,
    blocks: Vec<Block>,
}

pub(super) struct Reading<'a, 'b> {
    keys: &'a Keys<'a>,
    take_in: &'a mut TakeIn<'b>,
    /// The words that say what a locator counts, with what they say.
    terms: Vec<(String, String)>,
    /// In a name, where a citation is the text it was written as.
    naming: bool,
    /// What programs that keep references made in the file.
    made: &'a [made::Citation],
    /// The mark of the citation that the text now read is of: it stands
    /// between the signs that were set around it before Pandoc read.
    within: Option<Value>,
    /// What the file says of the works that a program cites in it, by what
    /// the citations call them, where Pandoc read citations that a program
    /// made. Tags are not read in such a file.
    told: Option<Vec<(String, Value)>>,
    /// Figures that stood where none can stand, to stand after it.
    hoisted: Vec<Block>,
    tally: Tally,
}

pub(super) fn tag(v: &Value) -> &str {
    v.get("t").and_then(Value::as_str).unwrap_or("")
}

fn inner(v: &Value) -> &Value {
    v.get("c").unwrap_or(&Value::Null)
}

pub(super) fn list(v: &Value) -> &[Value] {
    v.as_array().map(Vec::as_slice).unwrap_or(&[])
}

/// The classes and the named values of what Pandoc calls attributes.
fn classes(attr: &Value) -> Vec<&str> {
    list(&attr[1]).iter().filter_map(Value::as_str).collect()
}

pub(super) fn named<'v>(attr: &'v Value, name: &str) -> Option<&'v str> {
    list(&attr[2]).iter().find(|pair| pair[0].as_str() == Some(name)).and_then(|pair| pair[1].as_str())
}

pub(super) fn with(marks: &Marks, name: &str, value: Value) -> Marks {
    let mut out = marks.clone();
    // Raised and lowered at once is not a thing.
    match name {
        "sup" => {
            out.remove("sub");
        }
        "sub" => {
            out.remove("sup");
        }
        _ => {}
    }
    out.insert(name.to_owned(), value);
    out
}

fn push_text(out: &mut Vec<Piece>, text: &str, marks: &Marks) {
    if text.is_empty() {
        return;
    }
    if let Some(Piece::Inline(Inline::Text { text: before, marks: same })) = out.last_mut()
        && same == marks
    {
        before.push_str(text);
        return;
    }
    out.push(Piece::Inline(Inline::Text { text: clean(text), marks: marks.clone() }));
}

/// The text of inline content of Pandoc as it was written, with what was
/// written raw.
pub(super) fn written(inlines: &[Value]) -> String {
    let mut out = String::new();
    for v in inlines {
        let c = inner(v);
        match tag(v) {
            "Str" => out.push_str(&made::without_signs(c.as_str().unwrap_or(""))),
            "Space" | "SoftBreak" | "LineBreak" => out.push(' '),
            "Emph" | "Underline" | "Strong" | "Strikeout" | "Superscript" | "Subscript" | "SmallCaps" => {
                out.push_str(&written(list(c)));
            }
            "Quoted" => {
                let double = tag(&c[0]) != "SingleQuote";
                out.push(if double { '“' } else { '‘' });
                out.push_str(&written(list(&c[1])));
                out.push(if double { '”' } else { '’' });
            }
            "Cite" => out.push_str(&written(list(&c[1]))),
            "Code" | "Math" | "RawInline" => out.push_str(c[1].as_str().unwrap_or("")),
            "Link" | "Image" | "Span" => out.push_str(&written(list(&c[1]))),
            _ => {}
        }
    }
    out
}

/// Without the room at the ends, and without the texts that hold nothing.
pub(super) fn trim(line: &mut Vec<Inline>) {
    while let Some(first) = line.first_mut() {
        match first {
            Inline::Text { text, .. } => {
                let kept = text.trim_start();
                if kept.is_empty() {
                    line.remove(0);
                } else {
                    if kept.len() != text.len() {
                        *text = kept.to_owned();
                    }
                    break;
                }
            }
            Inline::Break => {
                line.remove(0);
            }
            _ => break,
        }
    }
    while let Some(last) = line.last_mut() {
        match last {
            Inline::Text { text, .. } => {
                let kept = text.trim_end();
                if kept.is_empty() {
                    line.pop();
                } else {
                    if kept.len() != text.len() {
                        *text = kept.to_owned();
                    }
                    break;
                }
            }
            Inline::Break => {
                line.pop();
            }
            _ => break,
        }
    }
}

/// Puts texts that follow each other with the same marks together.
pub(super) fn join(line: Vec<Inline>) -> Vec<Inline> {
    let mut out: Vec<Inline> = Vec::with_capacity(line.len());
    for i in line {
        if let Inline::Text { text, marks } = &i
            && let Some(Inline::Text { text: before, marks: same }) = out.last_mut()
            && same == marks
        {
            before.push_str(text);
            continue;
        }
        out.push(i);
    }
    out
}

/// Blocks as one line: the paragraphs joined. Figures cannot stand in a
/// line, and are set aside.
fn line_of(blocks: Vec<Block>, aside: &mut Vec<Block>) -> Vec<Inline> {
    fn walk(blocks: Vec<Block>, out: &mut Vec<Inline>, aside: &mut Vec<Block>) {
        let apart = |out: &mut Vec<Inline>| {
            if !out.is_empty() {
                out.push(text_of(" "));
            }
        };
        for b in blocks {
            match b {
                Block::Paragraph { content } | Block::Script { content, .. } | Block::Passage { content, .. } => {
                    if !content.is_empty() {
                        apart(out);
                        out.extend(content);
                    }
                }
                Block::Blockquote { content } => walk(content, out, aside),
                Block::Verse { lines, .. } => {
                    for l in lines {
                        if !l.content.is_empty() {
                            apart(out);
                            out.extend(l.content);
                        }
                    }
                }
                Block::Parallel { left, right } => {
                    walk(left, out, aside);
                    walk(right, out, aside);
                }
                Block::BulletList { items } | Block::OrderedList { items, .. } => {
                    for item in items {
                        walk(item, out, aside);
                    }
                }
                Block::Equation { tex, .. } => {
                    apart(out);
                    out.push(Inline::Math { tex });
                }
                Block::Table(table) => {
                    if !table.caption.is_empty() {
                        apart(out);
                        out.extend(table.caption);
                    }
                    for row in table.rows {
                        for cell in row {
                            walk(cell.content, out, aside);
                        }
                    }
                }
                Block::Row { items } => walk(items, out, aside),
                figure @ Block::Figure { .. } => aside.push(figure),
            }
        }
    }
    let mut out = Vec::new();
    walk(blocks, &mut out, aside);
    join(out)
}

/// What a cell of a table can hold: paragraphs.
fn paragraphs_of(blocks: Vec<Block>, aside: &mut Vec<Block>) -> Vec<Block> {
    let mut out = Vec::new();
    for b in blocks {
        match b {
            paragraph @ Block::Paragraph { .. } => out.push(paragraph),
            Block::Script { content, .. } | Block::Passage { content, .. } => out.push(Block::Paragraph { content }),
            Block::Blockquote { content } => out.extend(paragraphs_of(content, aside)),
            Block::Verse { lines, .. } => {
                out.extend(lines.into_iter().map(|l| Block::Paragraph { content: l.content }));
            }
            Block::Parallel { left, right } => {
                out.extend(paragraphs_of(left, aside));
                out.extend(paragraphs_of(right, aside));
            }
            Block::BulletList { items } | Block::OrderedList { items, .. } => {
                for item in items {
                    out.extend(paragraphs_of(item, aside));
                }
            }
            Block::Equation { tex, .. } => out.push(Block::Paragraph { content: vec![Inline::Math { tex }] }),
            Block::Row { items } => out.extend(paragraphs_of(items, aside)),
            other => {
                let line = line_of(vec![other], aside);
                if !line.is_empty() {
                    out.push(Block::Paragraph { content: line });
                }
            }
        }
    }
    out
}

/// A width in hundredths, where the file gives one so.
fn percent(attr: &Value) -> Option<u8> {
    let said = named(attr, "width")?.trim();
    let number: f64 = said.strip_suffix('%')?.trim().parse().ok()?;
    (number.is_finite() && number > 0.0).then(|| number.round().clamp(10.0, 100.0) as u8)
}

fn stand_of(align: &Value) -> Option<Stand> {
    match tag(align) {
        "AlignCenter" => Some(Stand::Center),
        "AlignRight" => Some(Stand::Right),
        // To the left is where what a cell holds stands when nothing is said.
        _ => None,
    }
}

impl Reading<'_, '_> {
    /// Text, under the mark of the citation it is of, if it is of one.
    fn push(&self, out: &mut Vec<Piece>, text: &str, marks: &Marks) {
        match &self.within {
            Some(mark) => push_text(out, text, &with(marks, found::MARK, mark.clone())),
            None => push_text(out, text, marks),
        }
    }

    /// Text of the file, in which the signs may stand that a citation made
    /// by a program is set between.
    fn text(&mut self, text: &str, marks: &Marks, out: &mut Vec<Piece>) {
        let mut rest = text;
        while let Some(at) = rest.find([made::BEGIN, made::END]) {
            self.push(out, &rest[..at], marks);
            let begins = rest[at..].starts_with(made::BEGIN);
            rest = &rest[at + if begins { made::BEGIN } else { made::END }.len_utf8()..];
            self.within = None;
            if !begins {
                continue;
            }
            // Which of them it is.
            let Some(end) = rest.find(made::NUMBERED) else { continue };
            let citation = rest[..end].parse::<usize>().ok().and_then(|number| self.made.get(number));
            rest = &rest[end + made::NUMBERED.len_utf8()..];
            // A name has no marks but those of names.
            if let Some(citation) = citation.filter(|_| !self.naming) {
                self.within = Some(cited::mark(citation.by, citation.items.clone(), CiteMode::Normal));
            }
        }
        self.push(out, rest, marks);
    }

    fn inlines(&mut self, inlines: &[Value], marks: &Marks, out: &mut Vec<Piece>) {
        for v in inlines {
            let c = inner(v);
            match tag(v) {
                "Str" => self.text(c.as_str().unwrap_or(""), marks, out),
                "Space" | "SoftBreak" => self.push(out, " ", marks),
                "LineBreak" => out.push(Piece::Inline(Inline::Break)),
                "Emph" => self.inlines(list(c), &with(marks, "em", Value::Bool(true)), out),
                "Strong" => self.inlines(list(c), &with(marks, "strong", Value::Bool(true)), out),
                "Strikeout" => self.inlines(list(c), &with(marks, "strike", Value::Bool(true)), out),
                "Superscript" => self.inlines(list(c), &with(marks, "sup", Value::Bool(true)), out),
                "Subscript" => self.inlines(list(c), &with(marks, "sub", Value::Bool(true)), out),
                "SmallCaps" => self.inlines(list(c), &with(marks, "smallcaps", Value::Bool(true)), out),
                "Underline" => self.inlines(list(c), marks, out),
                "Quoted" => {
                    let double = tag(&c[0]) != "SingleQuote";
                    self.push(out, if double { "“" } else { "‘" }, marks);
                    self.inlines(list(&c[1]), marks, out);
                    self.push(out, if double { "”" } else { "’" }, marks);
                }
                "Code" => self.text(c[1].as_str().unwrap_or(""), marks, out),
                "Math" => {
                    let tex = c[1].as_str().unwrap_or("").trim().to_owned();
                    if tex.is_empty() {
                        continue;
                    }
                    if tag(&c[0]) == "DisplayMath" {
                        out.push(Piece::Block(Block::Equation {
                            id: String::new(),
                            tex,
                            numbered: false,
                            align: None,
                        }));
                    } else {
                        out.push(Piece::Inline(Inline::Math { tex }));
                    }
                }
                "RawInline" => self.tally.raw += 1,
                "Link" => {
                    let href = c[2][0].as_str().unwrap_or("").trim();
                    // A link to a place in the document itself leads nowhere in a map.
                    if href.is_empty() || href.starts_with('#') {
                        self.inlines(list(&c[1]), marks, out);
                    } else {
                        self.inlines(list(&c[1]), &with(marks, "link", json!({ "href": href })), out);
                    }
                }
                "Span" => {
                    if classes(&c[0]).contains(&"smallcaps") {
                        self.inlines(list(&c[1]), &with(marks, "smallcaps", Value::Bool(true)), out);
                    } else {
                        self.inlines(list(&c[1]), marks, out);
                    }
                }
                "Image" => {
                    let named = c[2][0].as_str().unwrap_or("");
                    let title = c[2][1].as_str().unwrap_or("").trim();
                    if let Some(title) = title.strip_prefix("fig:") {
                        // As Pandoc once said that a picture is a figure: what
                        // stands with it is what is said of it.
                        let mut pieces = Vec::new();
                        self.inlines(list(&c[1]), &Marks::new(), &mut pieces);
                        let line: Vec<Inline> = pieces
                            .into_iter()
                            .filter_map(|p| match p {
                                Piece::Inline(i) => Some(i),
                                Piece::Block(_) => None,
                            })
                            .collect();
                        let line = captions::said(line, &mut self.tally.said);
                        if let Some(mut figure) = self.figure(&c[0], title.trim(), named) {
                            if let Block::Figure { caption, numbered, .. } = &mut figure {
                                *numbered = !line.is_empty();
                                *caption = line;
                            }
                            out.push(Piece::Block(figure));
                        } else if !line.is_empty() {
                            out.push(Piece::Block(Block::Paragraph { content: line }));
                        }
                    } else {
                        let shows = written(list(&c[1]));
                        let shows = if shows.trim().is_empty() { title } else { shows.trim() };
                        if let Some(figure) = self.figure(&c[0], shows, named) {
                            out.push(Piece::Block(figure));
                        }
                    }
                }
                "Note" => {
                    // What a note holds is not of the citation the note stands in.
                    let around = self.within.take();
                    let blocks = self.blocks(list(c));
                    self.within = around;
                    let mut content = line_of(blocks, &mut self.hoisted);
                    // A note within a note is not a thing.
                    content.retain(|i| !matches!(i, Inline::Footnote { .. }));
                    trim(&mut content);
                    if !content.is_empty() {
                        out.push(Piece::Inline(Inline::Footnote { content, place: None }));
                    }
                }
                "Cite" => self.cite(c, marks, out),
                _ => {}
            }
        }
    }

    /// A work in a citation of Pandoc, in its parts: the words before it,
    /// where in it, what that counts, the words after, and whether its
    /// author is left out.
    fn cited(&self, one: &Value) -> (Option<String>, Option<String>, Option<String>, Option<String>, bool) {
        let prefix = written(list(&one["citationPrefix"])).replace('\u{a0}', " ");
        let suffix = written(list(&one["citationSuffix"]));
        let (locator, label, after) = locator(&suffix, &self.terms);
        let prefix = Some(prefix.trim().to_owned()).filter(|p| !p.is_empty());
        (prefix, locator, label, after, tag(&one["citationMode"]) == "SuppressAuthor")
    }

    fn cite(&mut self, c: &Value, marks: &Marks, out: &mut Vec<Piece>) {
        let citations = list(&c[0]);
        let as_written = written(list(&c[1]));
        if self.naming {
            push_text(out, &as_written, marks);
            return;
        }
        let key = |one: &Value| one["citationId"].as_str().unwrap_or("").to_owned();
        let mode = match citations.first() {
            Some(first) if tag(&first["citationMode"]) == "AuthorInText" => CiteMode::Intext,
            _ => CiteMode::Normal,
        };
        if let Some(told) = &self.told {
            // Made by a program, and read by Pandoc: the text it showed,
            // with what the file says of each work.
            let items = citations
                .iter()
                .map(|one| {
                    let (prefix, locator, label, suffix, suppress_author) = self.cited(one);
                    let data = told.iter().find(|(id, _)| *id == key(one)).map(|(_, data)| data.clone());
                    FoundItem { data, locator, label, prefix, suffix, suppress_author, ..Default::default() }
                })
                .collect();
            self.tally.endnote += 1;
            let around = self.within.replace(cited::mark(By::Mendeley, items, mode));
            self.inlines(list(&c[1]), marks, out);
            self.within = around;
            return;
        }
        let known: Vec<Option<String>> = citations.iter().map(|one| (self.keys)(&key(one))).collect();
        for id in &known {
            if id.is_some() {
                self.tally.cited += 1;
            } else {
                self.tally.not_found += 1;
            }
        }
        if known.iter().any(Option::is_none) {
            // Not a citation until every work of it is known: it stands as
            // it was written, with what it says of each work, of those the
            // library has as well.
            let items = citations
                .iter()
                .map(|one| {
                    let (prefix, locator, label, suffix, suppress_author) = self.cited(one);
                    FoundItem {
                        key: Some(key(one)),
                        locator,
                        label,
                        prefix,
                        suffix,
                        suppress_author,
                        ..Default::default()
                    }
                })
                .collect();
            push_text(out, &as_written, &with(marks, found::MARK, cited::mark(By::Key, items, mode)));
            return;
        }
        let items = citations
            .iter()
            .zip(known)
            .filter_map(|(one, id)| {
                let (prefix, locator, label, suffix, suppress_author) = self.cited(one);
                Some(CiteItem { id: id?, locator, label, prefix, suffix, suppress_author })
            })
            .collect();
        out.push(Piece::Inline(Inline::Citation { items, mode }));
    }

    /// A picture of the document as a figure, if it can be taken in.
    fn figure(&mut self, attr: &Value, shows: &str, named: &str) -> Option<Block> {
        match (self.take_in)(named) {
            Ok(picture) => Some(Block::Figure {
                id: String::new(),
                width: percent(attr).unwrap_or_else(|| width_for(&picture)),
                file: picture.hash,
                extension: picture.extension,
                name: picture.name,
                caption: Vec::new(),
                alt: shows.to_owned(),
                // One of which nothing is said has no number either.
                numbered: false,
                align: None,
                wrap: None,
            }),
            Err(why) => {
                self.tally.lost.push((name_of(named), why));
                None
            }
        }
    }

    /// A line of Pandoc as blocks: paragraphs, and what divides them.
    fn paragraph(&mut self, inlines: &[Value], marks: &Marks, out: &mut Vec<Block>) {
        let mut pieces = Vec::new();
        self.inlines(inlines, marks, &mut pieces);
        // A citation ends where the paragraph does, whatever the signs say.
        self.within = None;
        // A paragraph that is marked as saying something of a figure or a
        // table may hold the picture itself, before its words: the mark is
        // of the words.
        let marked = match pieces.first_mut() {
            Some(Piece::Inline(Inline::Text { text, .. })) if text.starts_with(lifting::MARK) => {
                *text = text[lifting::MARK.len()..].to_owned();
                true
            }
            _ => false,
        };
        let mut line: Vec<Inline> = Vec::new();
        let end = |line: &mut Vec<Inline>, out: &mut Vec<Block>| {
            let mut content = std::mem::take(line);
            trim(&mut content);
            if !content.is_empty() {
                if marked {
                    content.insert(0, text_of(lifting::MARK));
                    content = join(content);
                }
                out.push(Block::Paragraph { content });
            }
        };
        for piece in pieces {
            match piece {
                Piece::Inline(i) => line.push(i),
                Piece::Block(b) => {
                    end(&mut line, out);
                    out.push(b);
                }
            }
        }
        end(&mut line, out);
    }

    fn blocks(&mut self, blocks: &[Value]) -> Vec<Block> {
        let mut out = Vec::new();
        for b in blocks {
            self.block(b, &mut out);
        }
        out
    }

    fn block(&mut self, b: &Value, out: &mut Vec<Block>) {
        let c = inner(b);
        match tag(b) {
            "Para" | "Plain" => self.paragraph(list(c), &Marks::new(), out),
            "LineBlock" => {
                let mut lines: Vec<Value> = Vec::new();
                for (i, line) in list(c).iter().enumerate() {
                    if i > 0 {
                        lines.push(json!({ "t": "LineBreak" }));
                    }
                    lines.extend(list(line).iter().cloned());
                }
                self.paragraph(&lines, &Marks::new(), out);
            }
            "Header" => {
                // Not where a map has its headings: in a quotation, a list, a table.
                self.tally.headings += 1;
                self.paragraph(list(&c[2]), &with(&Marks::new(), "strong", Value::Bool(true)), out);
            }
            "BlockQuote" => {
                let content = self.blocks(list(c));
                if !content.is_empty() {
                    out.push(Block::Blockquote { content });
                }
            }
            "BulletList" => {
                let items = self.items(list(c));
                if !items.is_empty() {
                    out.push(Block::BulletList { items });
                }
            }
            "OrderedList" => {
                let items = self.items(list(&c[1]));
                let start = c[0][0].as_u64().and_then(|n| u32::try_from(n).ok()).filter(|n| *n > 0).unwrap_or(1);
                if !items.is_empty() {
                    out.push(Block::OrderedList { start, items });
                }
            }
            "DefinitionList" => {
                self.tally.definitions += 1;
                for entry in list(c) {
                    self.paragraph(list(&entry[0]), &with(&Marks::new(), "strong", Value::Bool(true)), out);
                    for definition in list(&entry[1]) {
                        for b in list(definition) {
                            self.block(b, out);
                        }
                    }
                }
            }
            "CodeBlock" => {
                self.tally.code += 1;
                for line in c[1].as_str().unwrap_or("").lines().filter(|l| !l.trim().is_empty()) {
                    out.push(Block::Paragraph { content: vec![text_of(&clean(line))] });
                }
            }
            "HorizontalRule" => self.tally.rules += 1,
            "RawBlock" => self.tally.raw += 1,
            "Table" => self.table(c, out),
            "Figure" => self.pandoc_figure(c, out),
            "Div" => {
                for b in list(&c[1]) {
                    self.block(b, out);
                }
            }
            _ => {}
        }
        out.append(&mut self.hoisted);
    }

    fn items(&mut self, items: &[Value]) -> Vec<Vec<Block>> {
        items.iter().map(|item| self.blocks(list(item))).filter(|item| !item.is_empty()).collect()
    }

    /// What is said of a figure or a table: a line, in which no note
    /// stands, and without a word and a number before it.
    fn said(&mut self, blocks: &[Value]) -> Vec<Inline> {
        let converted = self.blocks(blocks);
        let line = line_of(converted, &mut self.hoisted);
        captions::said(line, &mut self.tally.said)
    }

    /// What Pandoc calls a figure: something with a caption, most often a picture.
    fn pandoc_figure(&mut self, c: &Value, out: &mut Vec<Block>) {
        let caption = self.said(list(&c[1][1]));
        let mut within = self.blocks(list(&c[2]));
        let figures = within.iter().filter(|b| matches!(b, Block::Figure { .. })).count();
        if figures == 1 {
            for b in &mut within {
                if let Block::Figure { caption: said, alt, numbered, .. } = b {
                    // What is said of it twice is said once.
                    if captions::said_twice(alt, &document::plain(&caption)) {
                        alt.clear();
                    }
                    *numbered = !caption.is_empty();
                    *said = caption.clone();
                }
            }
        } else if !caption.is_empty() {
            within.push(Block::Paragraph { content: caption });
        }
        out.extend(within);
    }

    fn table(&mut self, c: &Value, out: &mut Vec<Block>) {
        let caption = self.said(list(&c[1][1]));
        let columns: Vec<Option<Stand>> = list(&c[2]).iter().map(|spec| stand_of(&spec[0])).collect();
        let shares: f64 = list(&c[2]).iter().filter_map(|spec| inner(&spec[1]).as_f64()).sum();
        let mut rows: Vec<Vec<Cell>> = Vec::new();
        self.rows(list(&c[3][1]), true, 0, &columns, &mut rows);
        for body in list(&c[4]) {
            let heads = body[1].as_u64().unwrap_or(0) as usize;
            self.rows(list(&body[2]), true, 0, &columns, &mut rows);
            self.rows(list(&body[3]), false, heads, &columns, &mut rows);
        }
        self.rows(list(&c[5][1]), false, 0, &columns, &mut rows);
        if rows.is_empty() {
            if !caption.is_empty() {
                out.push(Block::Paragraph { content: caption });
            }
            return;
        }
        out.push(Block::Table(Table {
            id: String::new(),
            numbered: !caption.is_empty(),
            caption,
            rows,
            align: None,
            wrap: None,
            width: if shares > 0.0 { (shares * 100.0).round().clamp(10.0, 100.0) as u8 } else { 0 },
        }));
    }

    /// Rows of one part of a table. `heads` are the columns at the left
    /// whose cells are headings of their rows.
    fn rows(
        &mut self,
        rows: &[Value],
        header: bool,
        heads: usize,
        columns: &[Option<Stand>],
        out: &mut Vec<Vec<Cell>>,
    ) {
        // For every column, how many rows a cell from above still takes.
        let mut taken: Vec<usize> = Vec::new();
        for row in rows {
            let mut cells: Vec<Cell> = Vec::new();
            let mut at = 0usize;
            for cell in list(&row[1]) {
                while taken.get(at).is_some_and(|rows| *rows > 0) {
                    at += 1;
                }
                let rowspan = cell[2].as_u64().unwrap_or(1).clamp(1, 1000) as u16;
                let colspan = cell[3].as_u64().unwrap_or(1).clamp(1, 1000) as u16;
                let blocks = self.blocks(list(&cell[4]));
                let mut content = paragraphs_of(blocks, &mut self.hoisted);
                if content.is_empty() {
                    content.push(Block::Paragraph { content: Vec::new() });
                }
                cells.push(Cell {
                    content,
                    colspan,
                    rowspan,
                    header: header || at < heads,
                    align: stand_of(&cell[1]).or_else(|| columns.get(at).copied().flatten()),
                });
                for column in at..at + usize::from(colspan) {
                    if taken.len() <= column {
                        taken.resize(column + 1, 0);
                    }
                    taken[column] = usize::from(rowspan);
                }
                at += usize::from(colspan);
            }
            for rows in &mut taken {
                *rows = rows.saturating_sub(1);
            }
            if !cells.is_empty() {
                out.push(cells);
            }
        }
    }

    /// A name: text with the marks a name can have. The notes that stood
    /// in it are given beside it.
    fn name(&mut self, inlines: &[Value]) -> (Vec<Inline>, Vec<Inline>) {
        let mut pieces = Vec::new();
        self.naming = true;
        self.inlines(inlines, &Marks::new(), &mut pieces);
        self.naming = false;
        self.within = None;
        let mut line: Vec<Inline> = Vec::new();
        let mut notes: Vec<Inline> = Vec::new();
        for piece in pieces {
            match piece {
                Piece::Inline(Inline::Text { text, marks }) => {
                    let marks = marks
                        .into_iter()
                        .filter(|(name, _)| matches!(name.as_str(), "em" | "smallcaps" | "sup" | "sub"))
                        .collect();
                    line.push(Inline::Text { text, marks });
                }
                Piece::Inline(Inline::Break) => line.push(text_of(" ")),
                Piece::Inline(Inline::Math { tex }) | Piece::Block(Block::Equation { tex, .. }) => {
                    line.push(text_of(&tex));
                }
                Piece::Inline(note @ Inline::Footnote { .. }) => {
                    self.tally.moved += 1;
                    notes.push(note);
                }
                Piece::Block(figure @ Block::Figure { .. }) => self.hoisted.push(figure),
                _ => {}
            }
        }
        let mut line = join(line);
        trim(&mut line);
        (line, notes)
    }

    /// The document in its parts, as the file has them.
    fn parts(&mut self, blocks: &[Value], parts: &mut Vec<Part>) {
        for b in blocks {
            match tag(b) {
                "Header" => {
                    let c = inner(b);
                    let (heading, notes) = self.name(list(&c[2]));
                    if heading.is_empty() {
                        // A heading that says nothing divides nothing.
                        if let Some(part) = parts.last_mut() {
                            part.notes.extend(notes);
                        }
                        continue;
                    }
                    parts.push(Part { level: c[0].as_i64().unwrap_or(1).max(1), heading, notes, blocks: Vec::new() });
                }
                "Div" => self.parts(list(&inner(b)[1]), parts),
                _ => {
                    let mut out = Vec::new();
                    self.block(b, &mut out);
                    if let Some(part) = parts.last_mut() {
                        part.blocks.extend(out);
                    }
                }
            }
        }
    }
}

/// The text of what a file says of itself.
fn meta_text(v: &Value) -> String {
    let c = inner(v);
    let text = match tag(v) {
        "MetaString" => c.as_str().unwrap_or("").to_owned(),
        "MetaBool" => String::new(),
        "MetaInlines" => written(list(c)),
        "MetaBlocks" => {
            list(c).iter().map(meta_block).filter(|p| !p.trim().is_empty()).collect::<Vec<_>>().join("\n\n")
        }
        "MetaList" => list(c).iter().map(meta_text).filter(|p| !p.is_empty()).collect::<Vec<_>>().join(", "),
        _ => String::new(),
    };
    text.replace('\u{a0}', " ").trim().to_owned()
}

fn meta_block(b: &Value) -> String {
    let c = inner(b);
    match tag(b) {
        "Para" | "Plain" => written(list(c)),
        "LineBlock" => list(c).iter().map(|l| written(list(l))).collect::<Vec<_>>().join("\n"),
        "BlockQuote" => list(c).iter().map(meta_block).collect::<Vec<_>>().join("\n\n"),
        "Div" => list(&c[1]).iter().map(meta_block).collect::<Vec<_>>().join("\n\n"),
        _ => String::new(),
    }
}

fn meta_list(v: &Value) -> Vec<&Value> {
    match tag(v) {
        "MetaList" => list(inner(v)).iter().collect(),
        "" => Vec::new(),
        _ => vec![v],
    }
}

fn authors_of(meta: &Value) -> Vec<Author> {
    let mut out = Vec::new();
    let given = meta.get("author").or_else(|| meta.get("authors"));
    for one in given.map(meta_list).unwrap_or_default() {
        let author = if tag(one) == "MetaMap" {
            let of = |name: &str| inner(one).get(name).map(meta_text).filter(|t| !t.is_empty());
            Author {
                name: of("name").unwrap_or_default(),
                affiliation: of("affiliation").or_else(|| of("institute")),
                email: of("email"),
                orcid: of("orcid"),
            }
        } else {
            Author { name: meta_text(one), ..Default::default() }
        };
        if !author.name.is_empty() {
            out.push(author);
        }
    }
    out
}

/// The headings under which a document has the list of what it cites.
const BIBLIOGRAPHIES: [&str; 22] = [
    "references",
    "reference list",
    "list of references",
    "bibliography",
    "select bibliography",
    "selected bibliography",
    "works cited",
    "literature",
    "literature cited",
    "sources",
    "litteratur",
    "litteraturliste",
    "referanser",
    "referenser",
    "kilder",
    "literatur",
    "literaturverzeichnis",
    "bibliographie",
    "références",
    "bibliografia",
    "bibliografía",
    "referencias",
];

fn is_bibliography(heading: &str) -> bool {
    let said = heading.trim().trim_end_matches([':', '.']).trim();
    // Without a number before it.
    let said = said.trim_start_matches(|c: char| c.is_ascii_digit() || c == '.' || c.is_whitespace());
    let lower = said.to_lowercase();
    BIBLIOGRAPHIES.contains(&lower.as_str())
}

fn is_word_char(c: char) -> bool {
    c.is_alphabetic() || c.is_numeric()
}

/// The words of a text, as the application counts them: letters and
/// digits in runs, with apostrophes and hyphens inside them.
pub fn count_words(text: &str) -> usize {
    let chars: Vec<char> = text.chars().collect();
    let mut count = 0;
    let mut i = 0;
    while i < chars.len() {
        if !is_word_char(chars[i]) {
            i += 1;
            continue;
        }
        count += 1;
        while i < chars.len() {
            if is_word_char(chars[i]) {
                i += 1;
            } else if matches!(chars[i], '\'' | '’' | '-') && chars.get(i + 1).is_some_and(|c| is_word_char(*c)) {
                i += 2;
            } else {
                break;
            }
        }
    }
    count
}

pub(super) fn count(sections: &[Section], cited: usize, not_found: usize) -> Counts {
    /// The citations that were found, by their ids, with whether a program made them.
    type Found = Vec<(String, bool)>;
    fn line(inlines: &[Inline], text: &mut String, notes: &mut usize, found: &mut Found) {
        for i in inlines {
            match i {
                Inline::Text { text: t, marks } => {
                    text.push_str(t);
                    // The pieces of one citation have one id, and are counted once.
                    if let Some((id, made)) = marks.get(found::MARK).and_then(cited::counted)
                        && !found.iter().any(|(has, _)| has == id)
                    {
                        found.push((id.to_owned(), made));
                    }
                }
                Inline::Break => text.push(' '),
                Inline::Math { .. } | Inline::CrossRef { .. } => text.push_str(" x "),
                Inline::Footnote { content, .. } => {
                    *notes += 1;
                    text.push(' ');
                    line(content, text, notes, found);
                    text.push(' ');
                }
                Inline::Citation { .. } => {}
            }
        }
    }
    let mut counts =
        Counts { parts: sections.iter().filter(|s| s.level > 0).count(), cited, not_found, ..Default::default() };
    let mut text = String::new();
    let mut notes = 0usize;
    let mut found = Found::new();
    for section in sections {
        document::walk(
            &section.blocks,
            &mut |b| match b {
                Block::Figure { .. } => counts.figures += 1,
                Block::Table(_) => counts.tables += 1,
                Block::Equation { .. } => counts.equations += 1,
                _ => {}
            },
            &mut |l| {
                line(l, &mut text, &mut notes, &mut found);
                text.push('\n');
            },
        );
    }
    counts.words = count_words(&text);
    counts.notes = notes;
    counts.found = found.len();
    counts.found_made = found.iter().filter(|(_, made)| *made).count();
    counts
}

/// What Pandoc gives of what a file says of itself, as JSON is written.
fn meta_value(v: &Value) -> Value {
    let c = inner(v);
    match tag(v) {
        "MetaBool" => c.clone(),
        "MetaList" => Value::Array(list(c).iter().map(meta_value).collect()),
        "MetaMap" => Value::Object(
            c.as_object()
                .map(|all| all.iter().map(|(name, v)| (name.clone(), meta_value(v))).collect())
                .unwrap_or_default(),
        ),
        _ => Value::String(meta_text(v)),
    }
}

/// A date as Pandoc writes it (1979, 1979-05, 1979-05-02), in the form of
/// CSL. What is written otherwise is kept as it is written.
pub(super) fn csl_date(said: &str) -> Value {
    let parts: Vec<&str> = said.trim().split('-').collect();
    let numbers = !parts.is_empty()
        && parts.len() <= 3
        && parts.iter().all(|part| !part.is_empty() && part.chars().all(|c| c.is_ascii_digit()));
    if numbers { json!({ "date-parts": [parts] }) } else { json!({ "raw": said.trim() }) }
}

/// What a file says of the works that are cited in it by a program, as
/// Pandoc read it, in the form of CSL: by what the citations call the works.
pub(super) fn told_of(meta: &Value) -> Vec<(String, Value)> {
    const DATES: [&str; 5] = ["issued", "accessed", "original-date", "event-date", "submitted"];
    let mut out = Vec::new();
    for one in meta.get("references").map(meta_list).unwrap_or_default() {
        let Value::Object(mut said) = meta_value(one) else { continue };
        let Some(id) = said.get("id").and_then(Value::as_str).map(str::to_owned) else { continue };
        for name in DATES {
            if let Some(date) = said.get_mut(name)
                && let Some(text) = date.as_str()
            {
                *date = csl_date(text);
            }
        }
        if let Some(data) = made::data(&Value::Object(said)) {
            out.push((id, data));
        }
    }
    out
}

/// What is said of the citations that were found, where there are any.
pub(super) fn found_remark(counts: &Counts) -> Option<String> {
    if counts.found == 0 {
        return None;
    }
    // How many of them a program that keeps references made: none, all, or some.
    let made = match counts.found_made {
        0 => "none",
        all if all == counts.found => "all",
        _ => "some",
    };
    Some(tr!("core-import-document-found", count = counts.found, made = made, some = counts.found_made))
}

/// As `convert`, of a file in which programs that keep references made
/// something, which was read before Pandoc read the file.
pub(super) fn convert_with(
    doc: &Value,
    stem: &str,
    properties: &Properties,
    made: &made::Made,
    keys: &Keys,
    take_in: &mut TakeIn,
) -> Imported {
    let empty = json!({});
    let meta = doc.get("meta").unwrap_or(&empty);
    let of = |names: &[&str]| names.iter().find_map(|n| meta.get(*n)).map(meta_text).filter(|t| !t.is_empty());
    let language = of(&["lang", "language"]);

    let mut reading = Reading {
        keys,
        take_in,
        terms: terms_for(language.as_deref()),
        naming: false,
        made: &made.citations,
        within: None,
        told: (made.endnote > 0).then(|| told_of(meta)),
        hoisted: Vec::new(),
        tally: Tally::default(),
    };

    let mut parts = vec![Part { level: 0, heading: Vec::new(), notes: Vec::new(), blocks: Vec::new() }];
    // The title the document gives itself.
    let mut title: Vec<Inline> = Vec::new();
    if let Some(given) = meta.get("title") {
        let (name, notes) = match tag(given) {
            "MetaInlines" => reading.name(list(inner(given))),
            "MetaBlocks" => {
                let lines: Vec<Value> = list(inner(given))
                    .iter()
                    .filter(|b| matches!(tag(b), "Para" | "Plain"))
                    .flat_map(|b| {
                        let mut line = list(inner(b)).to_vec();
                        line.push(json!({ "t": "Space" }));
                        line
                    })
                    .collect();
                reading.name(&lines)
            }
            _ => (vec![text_of(&meta_text(given))], Vec::new()),
        };
        title = name;
        parts[0].notes = notes;
    }
    title.retain(|i| !matches!(i, Inline::Text { text, .. } if text.is_empty()));
    let mut from_properties = !title.is_empty();
    // Whether the title is what the file says of itself, which is without marks.
    let mut bare = false;
    if title.is_empty()
        && let Some(given) = properties.title.as_deref().map(str::trim).filter(|t| !t.is_empty())
    {
        title = vec![text_of(given)];
        from_properties = true;
        bare = true;
    }

    reading.parts(list(doc.get("blocks").unwrap_or(&Value::Null)), &mut parts);
    // What was set aside at the very end.
    let left = std::mem::take(&mut reading.hoisted);
    if let Some(last) = parts.last_mut() {
        last.blocks.extend(left);
    }

    // One heading alone at the top, in a document without a title, is the title.
    if title.is_empty() && parts.len() > 1 {
        let top = parts.iter().skip(1).map(|p| p.level).min().unwrap_or(1);
        let alone = parts.iter().skip(1).filter(|p| p.level == top).count() == 1;
        if alone && parts[1].level == top {
            let first = parts.remove(1);
            title = first.heading;
            parts[0].notes.extend(first.notes);
            parts[0].blocks.extend(first.blocks);
        }
    }
    if title.is_empty() {
        let untitled = tr!("core-import-document-untitled");
        title = vec![text_of(if stem.trim().is_empty() { &untitled } else { stem.trim() })];
    } else if from_properties {
        // The title as it is set at the top of the page is not part of the
        // text, nor a part of the document: as a paragraph, or as a heading
        // before all others.
        let said = document::plain(&title);
        if let Some(Block::Paragraph { content }) = parts[0].blocks.first()
            && document::plain(content) == said
            && !content.iter().any(|i| matches!(i, Inline::Footnote { .. } | Inline::Citation { .. }))
        {
            let set = parts[0].blocks.remove(0);
            // As it is set there, it has the marks the writer gave it.
            if bare && let Block::Paragraph { content } = set {
                let mut name: Vec<Inline> = content
                    .into_iter()
                    .filter_map(|i| match i {
                        Inline::Text { text, marks } => Some(Inline::Text {
                            text,
                            marks: marks
                                .into_iter()
                                .filter(|(name, _)| matches!(name.as_str(), "em" | "smallcaps" | "sup" | "sub"))
                                .collect(),
                        }),
                        Inline::Break => Some(text_of(" ")),
                        _ => None,
                    })
                    .collect();
                name = join(name);
                trim(&mut name);
                if document::plain(&name) == said {
                    title = name;
                }
            }
        } else if parts.len() > 1 && document::plain(&parts[1].heading) == said {
            let first = parts.remove(1);
            parts[0].notes.extend(first.notes);
            parts[0].blocks.extend(first.blocks);
        }
    }

    // The levels, made to begin at one and to go down by one at a time.
    let mut above: Vec<i64> = Vec::new();
    let mut sections: Vec<Section> = Vec::new();
    let mut bibliography: Option<String> = None;
    for mut part in parts {
        captions::attach(&mut part.blocks, &mut reading.tally.said);
        part.heading = captions::unmarked(part.heading);
        part.notes = captions::unmarked(part.notes);
        captions::unmark(&mut part.blocks);
        if !part.notes.is_empty() {
            match part.blocks.first_mut() {
                Some(Block::Paragraph { content }) => {
                    let mut with_notes = std::mem::take(&mut part.notes);
                    with_notes.append(content);
                    *content = with_notes;
                }
                _ => part.blocks.insert(0, Block::Paragraph { content: std::mem::take(&mut part.notes) }),
            }
        }
        if part.level == 0 {
            if !part.blocks.is_empty() {
                sections.push(Section { level: 0, heading: Vec::new(), blocks: part.blocks });
            }
            continue;
        }
        while above.last().is_some_and(|l| *l >= part.level) {
            above.pop();
        }
        above.push(part.level);
        let said = document::plain(&part.heading);
        if bibliography.is_none() && !part.blocks.is_empty() && is_bibliography(&said) {
            bibliography = Some(said);
        }
        sections.push(Section { level: above.len().min(12) as u8, heading: part.heading, blocks: part.blocks });
    }

    let tally = reading.tally;
    let mut remarks: Vec<String> = Vec::new();
    let counts = count(&sections, tally.cited, tally.not_found);
    if let Some(remark) = found_remark(&counts) {
        remarks.push(remark);
    }
    // Where EndNote keeps what it says apart from the field, Pandoc does not read it.
    let unread = made.endnote.saturating_sub(tally.endnote);
    if unread > 0 {
        remarks.push(tr!("core-import-document-endnote", count = unread));
    }
    if let Some(heading) = &bibliography {
        remarks.push(tr!("core-import-document-bibliography", heading = heading));
    } else if made.list {
        remarks.push(tr!("core-import-document-bibliography-made"));
    }
    for (name, why) in &tally.lost {
        remarks.push(tr!("core-import-document-picture-left-out", name = name, why = why));
    }
    if tally.moved > 0 {
        remarks.push(tr!("core-import-document-heading-notes", count = tally.moved));
    }
    if tally.said.labels > 0 {
        let first = tally.said.first.clone().unwrap_or_else(|| tr!("core-import-document-label-example"));
        remarks.push(tr!("core-import-document-labels", count = tally.said.labels, first = first));
    }
    if tally.said.bracketed > 0 {
        remarks.push(tr!("core-import-document-caption-notes", count = tally.said.bracketed));
    }
    if tally.headings > 0 {
        remarks.push(tr!("core-import-document-headings", count = tally.headings));
    }
    if tally.code > 0 {
        remarks.push(tr!("core-import-document-code", count = tally.code));
    }
    if tally.definitions > 0 {
        remarks.push(tr!("core-import-document-definitions", count = tally.definitions));
    }
    if tally.rules > 0 {
        remarks.push(tr!("core-import-document-rules", count = tally.rules));
    }
    if tally.raw > 0 {
        remarks.push(tr!("core-import-document-raw", count = tally.raw));
    }

    let keywords: Vec<String> = match meta.get("keywords").or_else(|| meta.get("keyword")).or_else(|| meta.get("tags"))
    {
        Some(given) if tag(given) == "MetaList" => {
            list(inner(given)).iter().map(meta_text).filter(|k| !k.is_empty()).collect()
        }
        Some(given) => {
            meta_text(given).split([',', ';']).map(|k| k.trim().to_owned()).filter(|k| !k.is_empty()).collect()
        }
        None => properties.keywords.clone(),
    };
    let mut authors = authors_of(meta);
    if authors.is_empty() {
        authors = properties
            .authors
            .iter()
            .filter(|a| !a.trim().is_empty())
            .map(|a| Author { name: a.trim().to_owned(), ..Default::default() })
            .collect();
    }

    Imported {
        file: String::new(),
        kind: String::new(),
        title: captions::unmarked(title),
        subtitle: of(&["subtitle"]),
        authors,
        date: of(&["date"]),
        abstract_text: of(&["abstract"]),
        keywords,
        language,
        counts,
        sections,
        remarks,
        pictures: Vec::new(),
    }
}
