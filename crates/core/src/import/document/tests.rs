use super::convert::{convert_with, csl_date, found_remark, told_of};
use super::locating::{locator, terms_for};
use super::pictures::{name_of, picture_bytes};
use super::plain::{decode, plain, text_of};
use super::*;
use crate::pictures::fixtures::PNG;

fn none(_: &str) -> Option<String> {
    None
}

fn library(key: &str) -> Option<String> {
    match key {
        "nagy1979" => Some("r1".to_owned()),
        "west1988" => Some("r2".to_owned()),
        _ => None,
    }
}

fn a_picture(named: &str) -> std::result::Result<Picture, String> {
    if named.ends_with(".emf") {
        return Err("it is of a kind that is not read (EMF)".to_owned());
    }
    Ok(Picture {
        hash: "a".repeat(64),
        extension: "png".into(),
        name: name_of(named),
        width: Some(480),
        height: Some(300),
        ..Default::default()
    })
}

fn read_json(json: &str, keys: &Keys) -> Imported {
    let value: Value = serde_json::from_str(json).unwrap();
    convert(&value, "the file", &Properties::default(), keys, &mut a_picture)
}

fn words(text: &str) -> String {
    let tokens: Vec<String> =
        text.split(' ').map(|w| format!(r#"{{"t":"Str","c":{}}}"#, serde_json::to_string(w).unwrap())).collect();
    tokens.join(r#",{"t":"Space"},"#)
}

fn para(text: &str) -> String {
    format!(r#"{{"t":"Para","c":[{}]}}"#, words(text))
}

fn header(level: u8, text: &str) -> String {
    format!(r#"{{"t":"Header","c":[{level},["",[],[]],[{}]]}}"#, words(text))
}

fn doc(meta: &str, blocks: &[String]) -> String {
    format!(r#"{{"pandoc-api-version":[1,23,1],"meta":{meta},"blocks":[{}]}}"#, blocks.join(","))
}

fn text(s: &str) -> Inline {
    text_of(s)
}

fn marked(s: &str, marks: &[&str]) -> Inline {
    Inline::Text { text: s.into(), marks: marks.iter().map(|m| ((*m).to_owned(), Value::Bool(true))).collect() }
}

fn paragraph(content: Vec<Inline>) -> Block {
    Block::Paragraph { content }
}

/// What the mark of a citation that was found holds, of a piece of text.
fn found_of(inline: &Inline) -> Option<found::Found> {
    let Inline::Text { marks, .. } = inline else { return None };
    serde_json::from_value(marks.get(found::MARK)?.clone()).ok()
}

/// The citations that were found in a line, each once, in the order
/// they stand in, with their text: all its pieces together.
fn found_in(line: &[Inline]) -> Vec<(String, found::Found)> {
    let mut out: Vec<(String, found::Found)> = Vec::new();
    for inline in line {
        match inline {
            Inline::Text { text, .. } => {
                let Some(found) = found_of(inline) else { continue };
                assert_eq!(found.id.len(), 12, "{found:?}");
                assert!(found.id.chars().all(|c| c.is_ascii_alphanumeric()), "{found:?}");
                match out.iter_mut().find(|(_, has)| has.id == found.id) {
                    Some((all, has)) => {
                        assert_eq!(*has, found, "the pieces of one citation hold the same");
                        all.push_str(text);
                    }
                    None => out.push((text.clone(), found)),
                }
            }
            Inline::Footnote { content, .. } => out.extend(found_in(content)),
            _ => {}
        }
    }
    out
}

/// The citations that were found in a document.
fn all_found(read: &Imported) -> Vec<(String, found::Found)> {
    let mut out = Vec::new();
    for section in &read.sections {
        document::walk(&section.blocks, &mut |_| {}, &mut |l| out.extend(found_in(l)));
    }
    out
}

/// A text as it is written, without the ids of the citations that were
/// found in it, which are made anew every time a file is read.
fn without_ids(sections: &[Section]) -> Value {
    fn walk(value: &mut Value) {
        match value {
            Value::Object(fields) => {
                if let Some(Value::Object(found)) = fields.get_mut(found::MARK)
                    && found.contains_key("id")
                {
                    found.insert("id".into(), Value::String(String::new()));
                }
                fields.values_mut().for_each(walk);
            }
            Value::Array(all) => all.iter_mut().for_each(walk),
            _ => {}
        }
    }
    let mut written = serde_json::to_value(sections).unwrap();
    walk(&mut written);
    written
}

/// A work as a tag cites it.
fn by_key(key: &str) -> FoundItem {
    FoundItem { key: Some(key.into()), ..Default::default() }
}

#[test]
fn the_kind_is_told_from_the_ending() {
    assert_eq!(Format::of(Path::new("/a/b/Thesis.DOCX")), Some(Format::Docx));
    assert_eq!(Format::of(Path::new("notes.markdown")), Some(Format::Markdown));
    assert_eq!(Format::of(Path::new("notes.txt")), Some(Format::Plain));
    assert_eq!(Format::of(Path::new("paper.pdf")), None);
    assert_eq!(Format::of(Path::new("no ending")), None);
    for ending in ENDINGS {
        assert!(Format::of(Path::new(&format!("x.{ending}"))).is_some(), "{ending}");
    }
}

#[test]
fn headings_become_parts_in_their_order() {
    let read = read_json(
        &doc(
            r#"{"title":{"t":"MetaInlines","c":[{"t":"Str","c":"Wrath"}]}}"#,
            &[
                para("Before the first."),
                header(2, "One"),
                para("Under one."),
                header(4, "Deep"),
                header(3, "Less deep"),
                header(2, "Two"),
                header(1, "Above"),
                header(3, "Under it"),
            ],
        ),
        &none,
    );
    assert_eq!(read.title, vec![text("Wrath")]);
    let shape: Vec<(u8, String)> = read.sections.iter().map(|s| (s.level, document::plain(&s.heading))).collect();
    assert_eq!(
        shape,
        vec![
            (0, String::new()),
            (1, "One".into()),
            (2, "Deep".into()),
            (2, "Less deep".into()),
            (1, "Two".into()),
            (1, "Above".into()),
            (2, "Under it".into()),
        ]
    );
    assert_eq!(read.sections[0].blocks, vec![paragraph(vec![text("Before the first.")])]);
    assert_eq!(read.sections[1].blocks, vec![paragraph(vec![text("Under one.")])]);
    assert_eq!(read.counts.parts, 6);
    assert_eq!(read.counts.words, 5);
}

#[test]
fn one_heading_alone_at_the_top_is_the_title() {
    let read = read_json(
        &doc(
            "{}",
            &[header(1, "The wrath"), para("Of the centre."), header(2, "One"), header(3, "Within"), header(2, "Two")],
        ),
        &none,
    );
    assert_eq!(read.title, vec![text("The wrath")]);
    let shape: Vec<(u8, String)> = read.sections.iter().map(|s| (s.level, document::plain(&s.heading))).collect();
    assert_eq!(shape, vec![(0, String::new()), (1, "One".into()), (2, "Within".into()), (1, "Two".into())]);

    // Two at the top: neither is the title, which is then what the file is called.
    let read = read_json(&doc("{}", &[header(1, "One"), header(1, "Two")]), &none);
    assert_eq!(read.title, vec![text("the file")]);
    assert_eq!(read.sections.len(), 2);

    // One at the top that is not the first is a part like the others.
    let read = read_json(&doc("{}", &[header(2, "One"), header(1, "Two")]), &none);
    assert_eq!(read.title, vec![text("the file")]);
    assert_eq!(read.sections.iter().map(|s| s.level).collect::<Vec<_>>(), vec![1, 1]);
}

#[test]
fn marks_breaks_and_links() {
    let read = read_json(
            &doc(
                "{}",
                &[r##"{"t":"Para","c":[
                    {"t":"Emph","c":[{"t":"Str","c":"mênis"},{"t":"Space"},{"t":"Strong","c":[{"t":"Str","c":"both"}]}]},
                    {"t":"Space"},
                    {"t":"SmallCaps","c":[{"t":"Str","c":"Small"}]},
                    {"t":"Str","c":"H"},{"t":"Subscript","c":[{"t":"Str","c":"2"}]},
                    {"t":"Superscript","c":[{"t":"Str","c":"3"}]},
                    {"t":"Strikeout","c":[{"t":"Str","c":"gone"}]},
                    {"t":"LineBreak"},
                    {"t":"Link","c":[["",[],[]],[{"t":"Str","c":"a"},{"t":"Space"},{"t":"Str","c":"link"}],["https://example.org",""]]},
                    {"t":"Link","c":[["",[],[]],[{"t":"Str","c":"within"}],["#part",""]]},
                    {"t":"Quoted","c":[{"t":"DoubleQuote"},[{"t":"Str","c":"said"}]]},
                    {"t":"RawInline","c":["html","<br>"]},
                    {"t":"Code","c":[["",[],[]],"x = 1"]}
                ]}"##
                .to_owned()],
            ),
            &none,
        );
    let mut link = BTreeMap::new();
    link.insert("link".to_owned(), json!({ "href": "https://example.org" }));
    assert_eq!(
        read.sections[0].blocks,
        vec![paragraph(vec![
            marked("mênis ", &["em"]),
            marked("both", &["em", "strong"]),
            text(" "),
            marked("Small", &["smallcaps"]),
            text("H"),
            marked("2", &["sub"]),
            marked("3", &["sup"]),
            marked("gone", &["strike"]),
            Inline::Break,
            Inline::Text { text: "a link".into(), marks: link },
            text("within“said”x = 1"),
        ])]
    );
    assert!(read.remarks.iter().any(|r| r.starts_with("1 piece written in HTML or TeX")), "{:?}", read.remarks);
}

#[test]
fn notes_are_one_line() {
    let read = read_json(
        &doc(
            "{}",
            &[format!(
                r#"{{"t":"Para","c":[{{"t":"Str","c":"Text."}},{{"t":"Note","c":[{},{}]}}]}}"#,
                para("The note."),
                para("And more.")
            )],
        ),
        &none,
    );
    assert_eq!(
        read.sections[0].blocks,
        vec![paragraph(vec![
            text("Text."),
            Inline::Footnote { content: vec![text("The note. And more.")], place: None },
        ])]
    );
    assert_eq!(read.counts.notes, 1);
    assert_eq!(read.counts.words, 5);
}

#[test]
fn a_note_on_a_heading_stands_under_it() {
    let read = read_json(
        &doc(
            "{}",
            &[
                header(1, "One"),
                format!(
                    r#"{{"t":"Header","c":[1,["",[],[]],[{{"t":"Str","c":"Two"}},{{"t":"Note","c":[{}]}}]]}}"#,
                    para("With thanks.")
                ),
                para("The text."),
            ],
        ),
        &none,
    );
    assert_eq!(read.sections[1].heading, vec![text("Two")]);
    assert_eq!(
        read.sections[1].blocks,
        vec![paragraph(
            vec![Inline::Footnote { content: vec![text("With thanks.")], place: None }, text("The text."),]
        )]
    );
    assert!(read.remarks.iter().any(|r| r.starts_with("A note on a heading")), "{:?}", read.remarks);
}

#[test]
fn mathematics_in_the_line_and_by_itself() {
    let read = read_json(
        &doc(
            "{}",
            &[r#"{"t":"Para","c":[{"t":"Str","c":"Where"},{"t":"Space"},
                    {"t":"Math","c":[{"t":"InlineMath"},"x_i \\leq \\alpha"]},
                    {"t":"Space"},{"t":"Str","c":"and"},
                    {"t":"Math","c":[{"t":"DisplayMath"},"a^2 + b^2 = c^2"]},
                    {"t":"Str","c":"holds."}]}"#
                .to_owned()],
        ),
        &none,
    );
    assert_eq!(
        read.sections[0].blocks,
        vec![
            paragraph(vec![text("Where "), Inline::Math { tex: "x_i \\leq \\alpha".into() }, text(" and")]),
            Block::Equation { id: String::new(), tex: "a^2 + b^2 = c^2".into(), numbered: false, align: None },
            paragraph(vec![text("holds.")]),
        ]
    );
    assert_eq!(read.counts.equations, 1);
}

#[test]
fn lists_quotations_and_what_has_no_place() {
    let read = read_json(
        &doc(
            "{}",
            &[
                format!(r#"{{"t":"BlockQuote","c":[{}]}}"#, para("Sing, goddess.")),
                format!(
                    r#"{{"t":"BulletList","c":[[{}],[{},{{"t":"OrderedList","c":[[3,{{"t":"Decimal"}},{{"t":"Period"}}],[[{}]]]}}]]}}"#,
                    para("one"),
                    para("two"),
                    para("nested")
                ),
                r#"{"t":"CodeBlock","c":[["",[],[]],"first line\n\nsecond line"]}"#.to_owned(),
                format!(r#"{{"t":"DefinitionList","c":[[[{}],[[{}]]]]}}"#, words("Term"), para("What it means.")),
                r#"{"t":"HorizontalRule"}"#.to_owned(),
                r#"{"t":"RawBlock","c":["html","<hr>"]}"#.to_owned(),
                format!(r#"{{"t":"Div","c":[["",[],[]],[{}]]}}"#, para("In a division.")),
                r#"{"t":"LineBlock","c":[[{"t":"Str","c":"A"}],[{"t":"Str","c":"B"}]]}"#.to_owned(),
            ],
        ),
        &none,
    );
    assert_eq!(
        read.sections[0].blocks,
        vec![
            Block::Blockquote { content: vec![paragraph(vec![text("Sing, goddess.")])] },
            Block::BulletList {
                items: vec![
                    vec![paragraph(vec![text("one")])],
                    vec![
                        paragraph(vec![text("two")]),
                        Block::OrderedList { start: 3, items: vec![vec![paragraph(vec![text("nested")])]] },
                    ],
                ],
            },
            paragraph(vec![text("first line")]),
            paragraph(vec![text("second line")]),
            paragraph(vec![marked("Term", &["strong"])]),
            paragraph(vec![text("What it means.")]),
            paragraph(vec![text("In a division.")]),
            paragraph(vec![text("A"), Inline::Break, text("B")]),
        ]
    );
    let all = read.remarks.join("\n");
    assert!(all.contains("1 block of code is brought in as plain paragraphs"), "{all}");
    assert!(all.contains("1 list of terms"), "{all}");
    assert!(all.contains("1 line across the page is left out"), "{all}");
    assert!(all.contains("1 piece written in HTML or TeX"), "{all}");
}

#[test]
fn pictures_become_figures() {
    let image = |src: &str, width: &str| {
        format!(r#"{{"t":"Image","c":[["",[],[{width}]],[{}],["{src}",""]]}}"#, words("A round shield"))
    };
    let read = read_json(
        &doc(
            "{}",
            &[
                format!(
                    r#"{{"t":"Figure","c":[["",[],[]],[null,[{}]],[{{"t":"Plain","c":[{}]}}]]}}"#,
                    para("The shield of Achilles"),
                    image("pictures/The%20shield.png", r#"["width","50%"]"#)
                ),
                format!(r#"{{"t":"Para","c":[{}]}}"#, image("media/image2.png", r#"["width","3in"]"#)),
                format!(
                    r#"{{"t":"Figure","c":[["",[],[]],[null,[{}]],[{{"t":"Plain","c":[{}]}}]]}}"#,
                    para("A drawing from Word"),
                    image("media/image1.emf", "")
                ),
            ],
        ),
        &none,
    );
    assert_eq!(
        read.sections[0].blocks,
        vec![
            Block::Figure {
                id: String::new(),
                file: "a".repeat(64),
                extension: "png".into(),
                name: "The shield.png".into(),
                caption: vec![text("The shield of Achilles")],
                alt: "A round shield".into(),
                width: 50,
                numbered: true,
                align: None,
                wrap: None,
            },
            Block::Figure {
                id: String::new(),
                file: "a".repeat(64),
                extension: "png".into(),
                name: "image2.png".into(),
                caption: vec![],
                alt: "A round shield".into(),
                // As suits a picture of 480 points.
                width: 50,
                numbered: false,
                align: None,
                wrap: None,
            },
            paragraph(vec![text("A drawing from Word")]),
        ]
    );
    assert_eq!(read.counts.figures, 2);
    assert!(
        read.remarks
            .contains(&"The picture “image1.emf” is left out: it is of a kind that is not read (EMF).".to_owned()),
        "{:?}",
        read.remarks
    );
}

#[test]
fn what_stands_with_a_picture_that_is_said_to_be_a_figure_is_said_of_it() {
    // As Pandoc gives a picture in a frame of an ODT that it reads as it is.
    let read = read_json(
        &doc(
            "{}",
            &[format!(
                r#"{{"t":"Para","c":[{{"t":"Image","c":[["",[],[["width","6cm"]]],[{}],["Pictures/1.png","fig:"]]}},{{"t":"Str","c":"After."}}]}}"#,
                words("Figure 1: The shield")
            )],
        ),
        &none,
    );
    assert_eq!(
        read.sections[0].blocks,
        vec![
            Block::Figure {
                id: String::new(),
                file: "a".repeat(64),
                extension: "png".into(),
                name: "1.png".into(),
                caption: vec![text("The shield")],
                alt: String::new(),
                width: 50,
                numbered: true,
                align: None,
                wrap: None,
            },
            paragraph(vec![text("After.")]),
        ]
    );
    assert!(read.remarks[0].starts_with("1 caption began with a word and a number, such as “Figure 1:”. It is"));
}

#[test]
fn tables_with_headings_and_spans() {
    let cell = |align: &str, rows: u8, columns: u8, text: &str| {
        format!(
            r#"[["",[],[]],{{"t":"{align}"}},{rows},{columns},[{}]]"#,
            if text.is_empty() { String::new() } else { format!(r#"{{"t":"Plain","c":[{}]}}"#, words(text)) }
        )
    };
    let row = |cells: &[String]| format!(r#"[["",[],[]],[{}]]"#, cells.join(","));
    let table = format!(
        r#"{{"t":"Table","c":[["",[],[]],[null,[{}]],
                [[{{"t":"AlignLeft"}},{{"t":"ColWidth","c":0.3}}],[{{"t":"AlignRight"}},{{"t":"ColWidth","c":0.3}}],[{{"t":"AlignDefault"}},{{"t":"ColWidth","c":0.2}}]],
                [["",[],[]],[{}]],
                [[["",[],[]],1,[],[{},{}]]],
                [["",[],[]],[]]]}}"#,
        para("Forms of the word"),
        row(&[cell("AlignDefault", 1, 1, "Form"), cell("AlignDefault", 1, 2, "Where")]),
        row(&[
            cell("AlignDefault", 2, 1, "mênis"),
            cell("AlignDefault", 1, 1, "12"),
            cell("AlignCenter", 1, 1, "Iliad")
        ]),
        row(&[cell("AlignDefault", 1, 1, "3"), cell("AlignDefault", 1, 1, "")]),
    );
    let read = read_json(&doc("{}", &[table]), &none);
    let Block::Table(table) = &read.sections[0].blocks[0] else { panic!("{:?}", read.sections[0].blocks) };
    assert_eq!(table.caption, vec![text("Forms of the word")]);
    assert!(table.numbered);
    assert_eq!(table.width, 80);
    type Shape = (String, u16, u16, bool, Option<Stand>);
    let shape: Vec<Vec<Shape>> = table
        .rows
        .iter()
        .map(|row| {
            row.iter()
                .map(|c| {
                    let said = match &c.content[0] {
                        Block::Paragraph { content } => document::plain(content),
                        other => panic!("{other:?}"),
                    };
                    (said, c.colspan, c.rowspan, c.header, c.align)
                })
                .collect()
        })
        .collect();
    assert_eq!(
        shape,
        vec![
            vec![("Form".into(), 1, 1, true, None), ("Where".into(), 2, 1, true, Some(Stand::Right))],
            vec![
                ("mênis".into(), 1, 2, true, None),
                ("12".into(), 1, 1, false, Some(Stand::Right)),
                ("Iliad".into(), 1, 1, false, Some(Stand::Center)),
            ],
            // The first column is taken from above: these stand in the second and the third.
            vec![("3".into(), 1, 1, false, Some(Stand::Right)), (String::new(), 1, 1, false, None)],
        ]
    );
    assert_eq!(table.columns(), 3);
    assert_eq!(read.counts.tables, 1);
}

#[test]
fn citations_by_key() {
    let citation = |key: &str, prefix: &str, suffix: &str, mode: &str| {
        format!(
            r#"{{"citationId":"{key}","citationPrefix":[{}],"citationSuffix":[{}],"citationMode":{{"t":"{mode}"}},"citationNoteNum":1,"citationHash":0}}"#,
            if prefix.is_empty() { String::new() } else { words(prefix) },
            if suffix.is_empty() { String::new() } else { words(suffix) },
        )
    };
    let cite = |citations: &[String], as_written: &str| {
        format!(r#"{{"t":"Cite","c":[[{}],[{}]]}}"#, citations.join(","), words(as_written))
    };
    let read = read_json(
        &doc(
            "{}",
            &[format!(
                r#"{{"t":"Para","c":[{},{{"t":"Space"}},{},{{"t":"Space"}},{},{{"t":"Space"}},{},{{"t":"Space"}},{}]}}"#,
                cite(
                    &[citation("nagy1979", "see", ", 73–75 and passim", "NormalCitation")],
                    "[see @nagy1979, 73–75 and passim]"
                ),
                cite(&[citation("west1988", "", "chap. 3", "AuthorInText")], "@west1988 [chap. 3]"),
                cite(&[citation("nokey", "", ", 12", "NormalCitation")], "[@nokey, 12]"),
                cite(
                    &[citation("other", "cf.", "", "NormalCitation"), citation("nagy1979", "", "", "SuppressAuthor"),],
                    "[cf. @other; -@nagy1979]"
                ),
                cite(&[citation("nokey", "", "p. 5", "AuthorInText")], "@nokey [p. 5]"),
            )],
        ),
        &library,
    );
    let Block::Paragraph { content } = &read.sections[0].blocks[0] else { panic!() };
    assert_eq!(
        content[..4],
        [
            Inline::Citation {
                items: vec![CiteItem {
                    id: "r1".into(),
                    locator: Some("73–75".into()),
                    prefix: Some("see".into()),
                    suffix: Some("and passim".into()),
                    ..Default::default()
                }],
                mode: CiteMode::Normal,
            },
            text(" "),
            Inline::Citation {
                items: vec![CiteItem {
                    id: "r2".into(),
                    locator: Some("3".into()),
                    label: Some("chapter".into()),
                    ..Default::default()
                }],
                mode: CiteMode::Intext,
            },
            text(" "),
        ]
    );
    // Where the library has not every work, the whole is the text it
    // was written as, with what it says of each work: of the one the
    // library has as well.
    assert_eq!(document::plain(&content[4..]), "[@nokey, 12] [cf. @other; -@nagy1979] @nokey [p. 5]");
    assert_eq!(content.len(), 9);
    assert_eq!(content[5], text(" "));
    let found = found_in(content);
    let told: Vec<(&str, By, CiteMode, &[FoundItem])> =
        found.iter().map(|(text, found)| (text.as_str(), found.by, found.mode, found.items.as_slice())).collect();
    assert_eq!(
        told,
        vec![
            (
                "[@nokey, 12]",
                By::Key,
                CiteMode::Normal,
                &[FoundItem { locator: Some("12".into()), ..by_key("nokey") }][..]
            ),
            (
                "[cf. @other; -@nagy1979]",
                By::Key,
                CiteMode::Normal,
                &[
                    FoundItem { prefix: Some("cf.".into()), ..by_key("other") },
                    FoundItem { suppress_author: true, ..by_key("nagy1979") },
                ][..]
            ),
            (
                "@nokey [p. 5]",
                By::Key,
                CiteMode::Intext,
                &[FoundItem { locator: Some("5".into()), ..by_key("nokey") }][..]
            ),
        ]
    );
    assert!(!found.iter().any(|(_, found)| found.left));
    assert_eq!((read.counts.cited, read.counts.not_found), (3, 3));
    assert_eq!((read.counts.found, read.counts.found_made), (3, 0));
    assert_eq!(
        read.remarks,
        vec![
            "3 citations were found that are not yet tied to references of your library. They stand as the text \
                 they were written as, and can be gone through when the map is made, and later."
        ]
    );
}

#[test]
fn a_citation_that_was_found_keeps_the_marks_it_stands_in_and_is_text_in_a_name() {
    let cite = r#"{"t":"Cite","c":[[{"citationId":"nokey","citationPrefix":[],"citationSuffix":[],"citationMode":{"t":"NormalCitation"},"citationNoteNum":1,"citationHash":0}],[{"t":"Str","c":"[@nokey]"}]]}"#;
    let read = read_json(
        &doc(
            "{}",
            &[
                format!(r#"{{"t":"Header","c":[1,["",[],[]],[{},{{"t":"Space"}},{cite}]]}}"#, words("One")),
                format!(
                    r#"{{"t":"Para","c":[{{"t":"Emph","c":[{},{{"t":"Space"}},{cite}]}},{{"t":"Note","c":[{{"t":"Para","c":[{cite}]}}]}}]}}"#,
                    words("As")
                ),
            ],
        ),
        &library,
    );
    assert_eq!(read.title, vec![text("One [@nokey]")]);
    let Block::Paragraph { content } = &read.sections[0].blocks[0] else { panic!() };
    assert_eq!(content[0], marked("As ", &["em"]));
    let Inline::Text { text: said, marks } = &content[1] else { panic!() };
    assert_eq!(said, "[@nokey]");
    assert_eq!(marks.keys().collect::<Vec<_>>(), vec!["em", "found"]);
    let found = all_found(&read);
    assert_eq!(found.len(), 2);
    assert_ne!(found[0].1.id, found[1].1.id);
    // In the name nothing was found; in the text and in the note, one each.
    assert_eq!((read.counts.found, read.counts.found_made, read.counts.notes), (2, 0, 1));
    assert!(read.remarks[0].starts_with("2 citations were found"), "{:?}", read.remarks);
}

#[test]
fn what_is_said_of_the_citations_that_were_found() {
    let said = |found: usize, found_made: usize| {
        found_remark(&Counts { found, found_made, ..Default::default() }).unwrap_or_default()
    };
    assert_eq!(said(0, 0), "");
    assert_eq!(
        said(1, 0),
        "1 citation was found that is not yet tied to a reference of your library. It stands as the text it was \
             written as, and can be gone through when the map is made, and later."
    );
    assert!(said(1, 1).starts_with(
        "1 citation was found that is not yet tied to a reference of your library, made by a program that keeps \
             references. It stands"
    ));
    assert!(said(4, 4).contains("of your library, all made by a program that keeps references. They stand"));
    assert!(said(4, 1).contains("of your library, 1 of them made by a program that keeps references. They"));
}

#[test]
fn locators_in_their_parts() {
    let terms = terms_for(Some("nb"));
    let parts = |suffix: &str| {
        let (locator, label, after) = locator(suffix, &terms);
        (locator.unwrap_or_default(), label.unwrap_or_default(), after.unwrap_or_default())
    };
    assert_eq!(parts(", 73"), ("73".into(), String::new(), String::new()));
    assert_eq!(parts(", pp. 33-35, 38"), ("33-35, 38".into(), String::new(), String::new()));
    assert_eq!(parts(" p.\u{a0}5"), ("5".into(), String::new(), String::new()));
    assert_eq!(parts(", 12 f."), ("12 f.".into(), String::new(), String::new()));
    assert_eq!(parts(", vol. 2, for the rest"), ("2".into(), "volume".into(), "for the rest".into()));
    assert_eq!(parts(", ch. iv"), ("iv".into(), "chapter".into(), String::new()));
    assert_eq!(parts(", kap. 3"), ("3".into(), "chapter".into(), String::new()));
    assert_eq!(parts(", and passim"), (String::new(), String::new(), "and passim".into()));
    assert_eq!(parts(" {ii, A}, as said"), ("ii, A".into(), String::new(), "as said".into()));
    assert_eq!(parts(", part of it"), (String::new(), String::new(), "part of it".into()));
    assert_eq!(parts(""), (String::new(), String::new(), String::new()));
}

#[test]
fn what_the_document_says_of_itself() {
    let read = read_json(
        &doc(
            r#"{
                  "title":{"t":"MetaInlines","c":[{"t":"Str","c":"Wrath"},{"t":"Space"},{"t":"Emph","c":[{"t":"Str","c":"and"}]},{"t":"Space"},{"t":"Strong","c":[{"t":"Str","c":"hero"}]}]},
                  "subtitle":{"t":"MetaInlines","c":[{"t":"Str","c":"A"},{"t":"Space"},{"t":"Str","c":"study"}]},
                  "author":{"t":"MetaList","c":[
                    {"t":"MetaMap","c":{"name":{"t":"MetaInlines","c":[{"t":"Str","c":"A."},{"t":"Space"},{"t":"Str","c":"Scholar"}]},"affiliation":{"t":"MetaInlines","c":[{"t":"Str","c":"Oslo"}]}}},
                    {"t":"MetaInlines","c":[{"t":"Str","c":"B."},{"t":"Space"},{"t":"Str","c":"Other"}]}]},
                  "date":{"t":"MetaInlines","c":[{"t":"Str","c":"2026-01-02"}]},
                  "abstract":{"t":"MetaBlocks","c":[{"t":"Para","c":[{"t":"Str","c":"Short."}]},{"t":"Para","c":[{"t":"Str","c":"Two."}]}]},
                  "keywords":{"t":"MetaList","c":[{"t":"MetaInlines","c":[{"t":"Str","c":"wrath"}]},{"t":"MetaInlines","c":[{"t":"Str","c":"epic"}]}]},
                  "lang":{"t":"MetaInlines","c":[{"t":"Str","c":"en-GB"}]}
                }"#,
            &[para("Wrath and hero"), para("The text.")],
        ),
        &none,
    );
    assert_eq!(read.title, vec![text("Wrath "), marked("and", &["em"]), text(" hero")]);
    assert_eq!(read.subtitle.as_deref(), Some("A study"));
    assert_eq!(
        read.authors,
        vec![
            Author { name: "A. Scholar".into(), affiliation: Some("Oslo".into()), ..Default::default() },
            Author { name: "B. Other".into(), ..Default::default() },
        ]
    );
    assert_eq!(read.date.as_deref(), Some("2026-01-02"));
    assert_eq!(read.abstract_text.as_deref(), Some("Short.\n\nTwo."));
    assert_eq!(read.keywords, vec!["wrath", "epic"]);
    assert_eq!(read.language.as_deref(), Some("en-GB"));
    // The title as it is set at the top of the page is not part of the text.
    assert_eq!(read.sections[0].blocks, vec![paragraph(vec![text("The text.")])]);
}

#[test]
fn the_title_set_as_a_heading_is_no_part() {
    let read = read_json(
        &doc(
            r#"{"title":{"t":"MetaInlines","c":[{"t":"Str","c":"Wrath"}]}}"#,
            &[para("Before."), header(1, "Wrath"), para("Under the title."), header(2, "One"), header(1, "Two")],
        ),
        &none,
    );
    assert_eq!(read.title, vec![text("Wrath")]);
    let shape: Vec<(u8, String)> = read.sections.iter().map(|s| (s.level, document::plain(&s.heading))).collect();
    assert_eq!(shape, vec![(0, String::new()), (1, "One".into()), (1, "Two".into())]);
    assert_eq!(
        read.sections[0].blocks,
        vec![paragraph(vec![text("Before.")]), paragraph(vec![text("Under the title.")])]
    );
}

#[test]
fn a_list_of_what_is_cited_is_kept_and_said() {
    let read = read_json(
        &doc("{}", &[header(1, "One"), header(1, "Works Cited:"), para("Nagy, G. 1979."), header(1, "Literature")]),
        &none,
    );
    assert_eq!(read.sections.len(), 3);
    assert_eq!(read.sections[1].blocks.len(), 1);
    assert_eq!(read.remarks.iter().filter(|r| r.contains("a list of what it cites")).count(), 1);
    assert!(read.remarks[0].contains("under “Works Cited:”"), "{:?}", read.remarks);
}

#[test]
fn words_are_counted_as_the_application_counts_them() {
    assert_eq!(count_words("The hero's well-known wrath — 24 books; l'ire."), 7);
    assert_eq!(count_words("μῆνιν ἄειδε θεά"), 3);
    assert_eq!(count_words(" - ' "), 0);
}

#[test]
fn text_without_marks() {
    let read = plain("One line\nof a paragraph.\r\n\r\nAnother.\n\n\n", "notes");
    assert_eq!(
        read.sections[0].blocks,
        vec![paragraph(vec![text("One line of a paragraph.")]), paragraph(vec![text("Another.")])]
    );
    assert_eq!(read.title, vec![text("notes")]);
    let read = plain("A paragraph to a line.\nAnd another.\n", "notes");
    assert_eq!(read.sections[0].blocks.len(), 2);
    assert_eq!(decode(b"\xef\xbb\xbfna\xc3\xafve"), "naïve");
    assert_eq!(decode(b"na\xefve \x93so\x94"), "naïve “so”");
    assert_eq!(decode(&[0xff, 0xfe, b'a', 0, 0xe5, 0]), "aå");
    assert!(plain("", "empty").sections.is_empty());
}

// ---- with Pandoc ----

struct Setup {
    tmp: tempfile::TempDir,
    tools: Tools,
    pictures: Pictures,
}

/// Nothing, when Pandoc is not installed: the tests that need it are
/// then passed over.
fn setup() -> Option<Setup> {
    let tools = tools::discover(&tools::Configured::default());
    if tools.pandoc.is_none() {
        crate::testing::passed_over("Pandoc is not installed");
        return None;
    }
    let tmp = tempfile::tempdir().unwrap();
    let pictures = Pictures::open(tmp.path().join("pictures")).unwrap();
    Some(Setup { tmp, tools, pictures })
}

impl Setup {
    fn desk(&self) -> PathBuf {
        let desk = self.tmp.path().join("desk");
        fs::create_dir_all(&desk).unwrap();
        desk
    }

    fn read(&self, path: &Path) -> Result<Imported> {
        let work = self.tmp.path().join("work");
        let _ = fs::remove_dir_all(&work);
        fs::create_dir_all(&work).unwrap();
        read(path, &self.tools, &self.pictures, &work, &library, &AtomicBool::new(false))
    }

    fn pandoc(&self, args: &[&str]) {
        let program = &self.tools.pandoc.as_ref().unwrap().path;
        tools::run(program, "Pandoc", args, None, Some(&self.desk())).unwrap();
    }
}

const EVERYTHING: &str = r#"---
title: Wrath and the *hero*
subtitle: A study
author:
  - A. Scholar
date: 2026-01-02
lang: en-GB
---

Before the first heading, with a note.[^1]

# The word

A wrath [@nagy1979, 73] that @west1988 [chap. 3] knows and [@nokey, 12] does not.
It is *more* than **anger**, H~2~O, x^2^, ~~gone~~, [a link](https://example.org).
Where $x_i \leq \alpha$ holds:

$$a^2 + b^2 = c^2$$

> Sing, goddess, the wrath.

- one
- two
    1. nested

### Deep

| Form  | Lines |
|:------|------:|
| mênis |    12 |

: Forms of the word

![The shield of Achilles](shield.png){width=50%}

## Less deep

```
a line of code
```

# References

Nagy, G. 1979. The Best of the Achaeans.

[^1]: The note.

    In two paragraphs.
"#;

fn everything(setup: &Setup) -> PathBuf {
    let desk = setup.desk();
    fs::write(desk.join("shield.png"), PNG).unwrap();
    let path = desk.join("wrath.md");
    fs::write(&path, EVERYTHING).unwrap();
    path
}

fn shape(read: &Imported) -> Vec<(u8, String)> {
    read.sections.iter().map(|s| (s.level, document::plain(&s.heading))).collect()
}

fn kinds(blocks: &[Block]) -> Vec<&'static str> {
    blocks
        .iter()
        .map(|b| match b {
            Block::Paragraph { .. } => "paragraph",
            Block::Blockquote { .. } => "blockquote",
            Block::BulletList { .. } => "bullet_list",
            Block::OrderedList { .. } => "ordered_list",
            Block::Equation { .. } => "equation",
            Block::Table(_) => "table",
            Block::Row { .. } => "row",
            Block::Figure { .. } => "figure",
            Block::Verse { .. } => "verse",
            Block::Parallel { .. } => "parallel",
        })
        .collect()
}

#[test]
fn markdown_with_everything_in_it() {
    let Some(s) = setup() else { return };
    let read = s.read(&everything(&s)).unwrap();
    assert_eq!(read.file, "wrath.md");
    assert_eq!(read.kind, "Markdown");
    assert_eq!(read.title, vec![text("Wrath and the "), marked("hero", &["em"])]);
    assert_eq!(read.subtitle.as_deref(), Some("A study"));
    assert_eq!(read.authors.len(), 1);
    assert_eq!(read.language.as_deref(), Some("en-GB"));
    assert_eq!(
        shape(&read),
        vec![
            (0, String::new()),
            (1, "The word".into()),
            (2, "Deep".into()),
            (2, "Less deep".into()),
            (1, "References".into()),
        ]
    );
    assert_eq!(
        read.sections[0].blocks,
        vec![paragraph(vec![
            text("Before the first heading, with a note."),
            Inline::Footnote { content: vec![text("The note. In two paragraphs.")], place: None },
        ])]
    );
    assert_eq!(kinds(&read.sections[1].blocks), vec!["paragraph", "equation", "blockquote", "bullet_list"]);
    let Block::Paragraph { content } = &read.sections[1].blocks[0] else { panic!() };
    assert_eq!(
        content[1],
        Inline::Citation {
            items: vec![CiteItem { id: "r1".into(), locator: Some("73".into()), ..Default::default() }],
            mode: CiteMode::Normal,
        }
    );
    assert_eq!(
        content[3],
        Inline::Citation {
            items: vec![CiteItem {
                id: "r2".into(),
                locator: Some("3".into()),
                label: Some("chapter".into()),
                ..Default::default()
            }],
            mode: CiteMode::Intext,
        }
    );
    assert_eq!(content[4], text(" knows and "));
    assert_eq!(content[6], text(" does not. It is "));
    let found = found_in(content);
    assert_eq!(found.len(), 1);
    assert_eq!(found[0].0, "[@nokey, 12]");
    assert_eq!(found[0].1.by, By::Key);
    assert_eq!(found[0].1.items, vec![FoundItem { locator: Some("12".into()), ..by_key("nokey") }]);
    assert!(content.contains(&Inline::Math { tex: "x_i \\leq \\alpha".into() }));
    assert_eq!(kinds(&read.sections[2].blocks), vec!["table", "figure"]);
    let Block::Figure { caption, alt, width, numbered, file, extension, name, .. } = &read.sections[2].blocks[1] else {
        panic!()
    };
    assert_eq!(caption, &vec![text("The shield of Achilles")]);
    assert_eq!((alt.as_str(), *width, *numbered), ("", 50, true));
    assert_eq!(name, "shield.png");
    assert!(s.pictures.has(file, extension));
    assert_eq!(read.pictures, vec![file.clone()]);
    assert_eq!(
        read.counts,
        Counts {
            parts: 4,
            words: 65,
            notes: 1,
            figures: 1,
            tables: 1,
            equations: 1,
            cited: 2,
            not_found: 1,
            found: 1,
            found_made: 0,
        }
    );
    let all = read.remarks.join("\n");
    assert!(all.contains("1 citation was found that is not yet tied to a reference of your library."), "{all}");
    assert!(all.contains("under “References”"), "{all}");
    assert!(all.contains("1 block of code"), "{all}");

    // Read again, the picture is in the store already, and is not one to be taken out.
    let again = s.read(&everything(&s)).unwrap();
    assert!(again.pictures.is_empty());
    // What was found gets an id of its own every time.
    assert_eq!(without_ids(&again.sections), without_ids(&read.sections));
    assert_ne!(again.sections, read.sections);
}

#[test]
fn word_and_opendocument_made_of_the_same() {
    let Some(s) = setup() else { return };
    let source = everything(&s);
    for (ending, kind) in [("docx", "Word (DOCX)"), ("odt", "OpenDocument (ODT)")] {
        let made = s.desk().join(format!("wrath.{ending}"));
        s.pandoc(&[source.to_str().unwrap(), "-o", made.to_str().unwrap()]);
        let read = s.read(&made).unwrap();
        assert_eq!(read.kind, kind);
        assert_eq!(document::plain(&read.title), "Wrath and the hero", "{ending}");
        let headings: Vec<(u8, String)> = shape(&read).into_iter().filter(|(level, _)| *level > 0).collect();
        assert_eq!(
            headings,
            vec![(1, "The word".into()), (2, "Deep".into()), (2, "Less deep".into()), (1, "References".into()),],
            "{ending}"
        );
        assert_eq!(read.counts.notes, 1, "{ending}");
        assert_eq!(read.counts.tables, 1, "{ending}");
        assert_eq!(read.counts.figures, 1, "{ending}: {:?}", read.remarks);
        // Citations that are text stay text.
        assert_eq!((read.counts.cited, read.counts.not_found), (0, 0), "{ending}");
        assert_eq!((read.counts.found, read.counts.found_made), (0, 0), "{ending}");
        let word = read.sections.iter().find(|s| document::plain(&s.heading) == "The word").unwrap();
        let Block::Paragraph { content } = &word.blocks[0] else { panic!("{ending}") };
        assert!(document::plain(content).starts_with("A wrath [@nagy1979, 73] that @west1988"), "{ending}");
        assert!(kinds(&word.blocks).contains(&"blockquote"), "{ending}");
        assert!(kinds(&word.blocks).contains(&"bullet_list"), "{ending}");
        let figure = read
            .sections
            .iter()
            .flat_map(|s| &s.blocks)
            .find_map(|b| match b {
                Block::Figure { file, extension, .. } => Some((file.clone(), extension.clone())),
                _ => None,
            })
            .unwrap();
        assert!(s.pictures.has(&figure.0, &figure.1), "{ending}");
        assert!(read.remarks.iter().any(|r| r.contains("under “References”")), "{ending}");
    }
}

#[test]
fn the_other_kinds_are_read() {
    let Some(s) = setup() else { return };
    let desk = s.desk();
    let small = "---\ntitle: Wrath\n---\n\nBefore.\n\n# One\n\nUnder *one*.[^1]\n\n## Within\n\nDeeper.\n\n# Two\n\nUnder two.\n\n[^1]: A note.\n";
    fs::write(desk.join("small.md"), small).unwrap();
    let writers = [
        ("html", "html"),
        ("tex", "latex"),
        ("rtf", "rtf"),
        ("epub", "epub"),
        ("org", "org"),
        ("rst", "rst"),
        ("adoc", "asciidoc"),
        ("dbk", "docbook"),
        ("jats", "jats"),
        ("fb2", "fb2"),
        ("opml", "opml"),
        ("mediawiki", "mediawiki"),
        ("textile", "textile"),
        ("dj", "djot"),
        ("muse", "muse"),
        ("ipynb", "ipynb"),
    ];
    for (ending, writer) in writers {
        let made = desk.join(format!("small.{ending}"));
        s.pandoc(&["small.md", "-s", "-t", writer, "-o", made.to_str().unwrap()]);
        check(&s, &made, ending);
    }
    // Typst as it is written by hand: what Pandoc writes around a whole
    // document of that kind, it does not read itself.
    let made = desk.join("small.typ");
    fs::write(
            &made,
            "#set document(title: \"Wrath\")\n\nBefore.\n\n= One\nUnder _one_.#footnote[A note.]\n\n== Within\nDeeper.\n\n= Two\nUnder two.\n",
        )
        .unwrap();
    check(&s, &made, "typ");

    fn check(s: &Setup, made: &Path, ending: &str) {
        let read = s.read(made).unwrap_or_else(|e| panic!("{ending}: {e}"));
        let headings: Vec<String> =
            read.sections.iter().filter(|s| s.level > 0).map(|s| document::plain(&s.heading)).collect();
        assert!(headings.contains(&"Within".to_owned()), "{ending}: {headings:?}");
        let all: String = read
            .sections
            .iter()
            .map(|s| {
                let mut text = String::new();
                document::walk(&s.blocks, &mut |_| {}, &mut |l| {
                    text.push_str(&document::plain(l));
                    text.push(' ');
                });
                text
            })
            .collect();
        assert!(all.contains("Deeper."), "{ending}: {all}");
        assert!(all.contains("Under two."), "{ending}: {all}");
    }
}

#[test]
fn latex_with_citations_and_parts_of_its_own() {
    let Some(s) = setup() else { return };
    let desk = s.desk();
    fs::write(desk.join("part.tex"), "\\section{From another file}\nRead from beside it.\n").unwrap();
    let path = desk.join("paper.tex");
    fs::write(
            &path,
            "\\documentclass{article}\n\\title{Wrath}\n\\author{A. Scholar \\and B. Other}\n\\begin{document}\n\\maketitle\n\\section{One}\nAs \\cite[73]{nagy1979} and \\cite{nokey} say.\\footnote{A note.} And \\textcite[see][chap. 3]{nagy1979,other}.\n\\input{part}\n\\end{document}\n",
        )
        .unwrap();
    let read = s.read(&path).unwrap();
    assert_eq!(document::plain(&read.title), "Wrath");
    assert_eq!(read.authors.len(), 2);
    assert_eq!(shape(&read), vec![(1, "One".into()), (1, "From another file".into())]);
    let Block::Paragraph { content } = &read.sections[0].blocks[0] else { panic!() };
    assert_eq!(
        content[1],
        Inline::Citation {
            items: vec![CiteItem { id: "r1".into(), locator: Some("73".into()), ..Default::default() }],
            mode: CiteMode::Normal,
        }
    );
    let found = found_in(content);
    assert_eq!(found.len(), 2, "{content:?}");
    assert_eq!(found[0].0, "\\cite{nokey}");
    assert_eq!(found[0].1.items, vec![by_key("nokey")]);
    // One of two that the library has, and one that is named as the author is: all of it is text.
    assert_eq!(found[1].0, "\\textcite[see][chap. 3]{nagy1979,other}");
    assert_eq!((found[1].1.by, found[1].1.mode), (By::Key, CiteMode::Intext));
    assert_eq!(
        found[1].1.items,
        vec![
            FoundItem { prefix: Some("see".into()), ..by_key("nagy1979") },
            FoundItem { locator: Some("3".into()), label: Some("chapter".into()), ..by_key("other") },
        ]
    );
    assert_eq!((read.counts.cited, read.counts.not_found, read.counts.notes), (2, 2, 1));
    assert_eq!((read.counts.found, read.counts.found_made), (2, 0));
}

#[test]
fn failures_in_plain_words() {
    let Some(s) = setup() else { return };
    let desk = s.desk();
    let broken = desk.join("broken.docx");
    fs::write(&broken, "This only says that it is one.").unwrap();
    let said = s.read(&broken).unwrap_err().to_string();
    assert!(said.starts_with("“broken.docx” could not be read as Word (DOCX)."), "{said}");

    let unknown = desk.join("paper.pdf");
    fs::write(&unknown, "%PDF").unwrap();
    let said = s.read(&unknown).unwrap_err().to_string();
    assert!(said.contains("is not of a kind that can be brought in as a document"), "{said}");

    let large = desk.join("large.md");
    let file = fs::File::create(&large).unwrap();
    file.set_len(MAX_BYTES + 1).unwrap();
    let said = s.read(&large).unwrap_err().to_string();
    assert!(said.contains("is larger than 50 MB"), "{said}");

    // Without Pandoc, text without marks is read all the same, and the rest is not.
    let none = Tools::default();
    let work = s.tmp.path().join("work");
    let text = desk.join("notes.txt");
    fs::write(&text, "A line.\n").unwrap();
    let stop = AtomicBool::new(false);
    assert!(read(&text, &none, &s.pictures, &work, &library, &stop).is_ok());
    let error = read(&everything(&s), &none, &s.pictures, &work, &library, &stop).unwrap_err();
    assert_eq!(error.kind(), "missing-program");

    // Stopped before it began, nothing is read.
    let stop = AtomicBool::new(true);
    let error = read(&everything(&s), &s.tools, &s.pictures, &work, &library, &stop).unwrap_err();
    assert_eq!(error.to_string(), "The reading was stopped.");
}

// ---- files as word processors write them ----

/// A document of `crates/core/tests/documents`. Those of LibreOffice
/// were made of the `.fodt` beside them, which was written by hand, by
/// `soffice --headless --convert-to odt` and `--convert-to docx`.
fn written(name: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/documents").join(name)
}

fn all_text(read: &Imported) -> String {
    let mut text = String::new();
    for section in &read.sections {
        text.push_str(&document::plain(&section.heading));
        text.push('\n');
        document::walk(&section.blocks, &mut |_| {}, &mut |l| {
            text.push_str(&document::plain(l));
            text.push('\n');
        });
    }
    text
}

const CAPTIONS: &str = "3 captions began with a word and a number, such as “Figure 1:”. They are left out: the map \
                            numbers its figures and tables itself. Where the text names one of them by its number, \
                            that is text as it was written, and does not follow the numbers of the map.";
const TRACKED: &str = "The document has changes that are tracked. The text is brought in as it stands when all of \
                           them are accepted.";

#[test]
fn a_picture_in_a_frame_with_what_is_said_of_it() {
    let Some(s) = setup() else { return };
    for (name, keywords, shows) in [
        ("captions.odt", vec!["Homer", "the shield"], ["", ""]),
        // LibreOffice writes the keywords of a DOCX with nothing but room between them.
        ("captions.docx", vec!["Homer", "the", "shield"], ["A round shield", "The river round the rim"]),
    ] {
        let read = s.read(&written(name)).unwrap();
        assert_eq!(read.title, vec![text("The shield of "), marked("Achilles", &["em"])], "{name}");
        assert_eq!(read.authors, vec![Author { name: "A. Scholar".into(), ..Default::default() }], "{name}");
        assert_eq!(read.keywords, keywords, "{name}");
        // What the file says of the language is what the computer was set to.
        assert_eq!(read.language, None, "{name}");
        assert_eq!(
            shape(&read),
            vec![
                (0, String::new()),
                (1, "The shield".into()),
                // Written as a paragraph of the style of a heading.
                (2, "What is on it".into()),
                (1, "The river".into()),
            ],
            "{name}"
        );
        assert_eq!(read.remarks, vec![CAPTIONS, TRACKED], "{name}");

        // The frame stood in the paragraph that is before it now.
        assert_eq!(kinds(&read.sections[1].blocks), vec!["paragraph", "paragraph", "figure"], "{name}");
        assert_eq!(
            read.sections[1].blocks[..2],
            [
                paragraph(vec![text("Hephaestus makes it, as Figure 1 shows. This was put in. The end.")]),
                paragraph(vec![text("He looks at the shield.")]),
            ],
            "{name}"
        );
        let Block::Figure { caption, numbered, alt, file, extension, .. } = &read.sections[1].blocks[2] else {
            panic!("{name}")
        };
        assert_eq!(caption, &vec![text("The shield, with its "), marked("rings", &["em"])], "{name}");
        assert!(*numbered, "{name}");
        assert_eq!(alt, shows[0], "{name}");
        assert!(s.pictures.has(file, extension), "{name}");
        assert_eq!(s.pictures.get(file).unwrap().width, Some(120), "{name}");

        // What is said of the table stood over it.
        assert_eq!(kinds(&read.sections[2].blocks), vec!["table", "paragraph"], "{name}");
        let Block::Table(table) = &read.sections[2].blocks[0] else { panic!("{name}") };
        assert_eq!(table.caption, vec![text("What the shield shows")], "{name}");
        assert!(table.numbered, "{name}");
        assert_eq!(table.rows.len(), 3, "{name}");
        assert!(table.rows[0].iter().all(|c| c.header), "{name}");
        // What names the table is text, and no caption.
        assert_eq!(
            read.sections[2].blocks[1],
            paragraph(vec![text("Table 1 shows that the rings are many.")]),
            "{name}"
        );

        // A picture in the line, and what is said of it in the paragraph under it.
        assert_eq!(kinds(&read.sections[3].blocks), vec!["figure", "paragraph"], "{name}");
        let Block::Figure { caption, numbered, alt, file, extension, .. } = &read.sections[3].blocks[0] else {
            panic!("{name}")
        };
        assert_eq!(caption, &vec![text("Ocean, the river")], "{name}");
        assert!(*numbered, "{name}");
        assert_eq!(alt, shows[1], "{name}");
        assert!(s.pictures.has(file, extension), "{name}");
        assert_eq!(s.pictures.get(file).unwrap().width, Some(60), "{name}");
        // Called after the document, and not what the file calls it within.
        let called = s.pictures.get(file).unwrap().name;
        assert!(called.starts_with("captions ") && !called.contains("1000"), "{name}: {called}");

        assert_eq!(read.counts.figures, 2, "{name}");
        let all = all_text(&read);
        // What was taken out with the changes tracked is not in the text; what was put in is.
        assert!(!all.contains("taken out"), "{name}: {all}");
        assert!(all.contains("This was put in."), "{name}: {all}");
        assert!(!all.contains(lifting::MARK), "{name}: {all}");
        assert!(!all.contains("Figure 1:") && !all.contains("Table 1:"), "{name}: {all}");
    }
}

#[test]
fn a_frame_that_holds_text_alone() {
    let Some(s) = setup() else { return };
    // In these the picture was lost when LibreOffice read what they were made of: they hold none.
    for name in ["book.odt", "book.docx"] {
        let read = s.read(&written(name)).unwrap();
        assert_eq!(document::plain(&read.title), "The wrath of Achilles", "{name}");
        assert_eq!(read.authors, vec![Author { name: "Robert Emil Berge".into(), ..Default::default() }], "{name}");
        assert_eq!(read.keywords, vec!["Homer", "wrath"], "{name}");
        assert_eq!(read.language, None, "{name}");
        let forms = read.sections.iter().find(|s| document::plain(&s.heading) == "Its forms").unwrap();
        assert_eq!(kinds(&forms.blocks), vec!["table", "paragraph"], "{name}");
        let Block::Table(table) = &forms.blocks[0] else { panic!("{name}") };
        assert_eq!(table.caption, vec![text("Forms of the word")], "{name}");
        assert!(table.numbered, "{name}");
        let iliad = read.sections.iter().find(|s| document::plain(&s.heading) == "In the Iliad").unwrap();
        assert_eq!(
            iliad.blocks,
            vec![
                paragraph(vec![text("He looks at the shield.")]),
                paragraph(vec![text("Figure : The shield of Achilles")]),
            ],
            "{name}"
        );
        assert_eq!(read.counts.figures, 0, "{name}");
        assert_eq!(read.remarks.len(), 2, "{name}: {:?}", read.remarks);
        assert!(read.remarks[0].starts_with("1 caption began with a word and a number, such as “Table 1:”. It is"));
        assert_eq!(read.remarks[1], TRACKED, "{name}");
    }
}

#[test]
fn pictures_that_the_file_holds_and_the_text_has_not_are_told_of() {
    let Some(s) = setup() else { return };
    // The same, with the second picture taken out of the text and left in the file.
    let source = written("captions.odt");
    let mut archive = zip::ZipArchive::new(fs::File::open(&source).unwrap()).unwrap();
    let mut content = String::new();
    std::io::Read::read_to_string(&mut archive.by_name("content.xml").unwrap(), &mut content).unwrap();
    let from = content.find(r#"<draw:frame draw:style-name="fr3""#).unwrap();
    let to = from + content[from..].find("</draw:frame>").unwrap() + "</draw:frame>".len();
    content.replace_range(from..to, "");
    let made = s.desk().join("wanting.odt");
    lifting::write_copy(&mut archive, &made, &[("content.xml".to_owned(), content)]).unwrap();

    let read = s.read(&made).unwrap();
    assert_eq!(read.counts.figures, 1);
    assert_eq!(
        read.remarks,
        vec![
            "2 captions began with a word and a number, such as “Figure 1:”. They are left out: the map numbers \
                 its figures and tables itself. Where the text names one of them by its number, that is text as it \
                 was written, and does not follow the numbers of the map.",
            "1 picture that the file holds is not in the text that was read, and is left out. It may stand in \
                 the head or the foot of the pages, or in a drawing.",
            TRACKED,
        ]
    );
    // What was said of it had nothing to be said of, and stands as it was written.
    let river = read.sections.iter().find(|s| document::plain(&s.heading) == "The river").unwrap();
    assert_eq!(river.blocks[0], paragraph(vec![text("Figure 1. Ocean, the river")]));
}

#[test]
fn what_is_said_of_figures_and_tables_as_word_has_it() {
    let Some(s) = setup() else { return };
    let desk = s.desk();
    fs::write(desk.join("shield.png"), PNG).unwrap();
    // A paragraph of the style of captions under a picture in the line,
    // and over a table; and the ways of Pandoc itself.
    fs::write(
        desk.join("word.md"),
        r#"---
title: The shield
---

Before it, Figure 1 is named.

![A round shield](shield.png)\

::: {custom-style="Caption"}
Figure 1: The shield of *Achilles*
:::

::: {custom-style="Caption"}
Table 1 Rings
:::

| Ring  | Shows |
|-------|-------|
| first | stars |

::: {custom-style="Caption"}
Of nothing that stands here
:::

Text between.

| Ring   | Shows  |
|--------|--------|
| second | cities |

: Table 2: As Pandoc writes what is said of a table

![Figure 2. As Pandoc writes what is said of a figure](shield.png)
"#,
    )
    .unwrap();
    s.pandoc(&["word.md", "-o", "word.docx"]);
    let read = s.read(&desk.join("word.docx")).unwrap();
    let blocks = &read.sections[0].blocks;
    assert_eq!(
        kinds(blocks),
        vec!["paragraph", "figure", "table", "paragraph", "paragraph", "table", "figure"],
        "{blocks:?}"
    );
    let said: Vec<(String, bool)> = blocks
        .iter()
        .filter_map(|b| match b {
            Block::Figure { caption, numbered, .. } => Some((document::plain(caption), *numbered)),
            Block::Table(table) => Some((document::plain(&table.caption), table.numbered)),
            _ => None,
        })
        .collect();
    assert_eq!(
        said,
        vec![
            ("The shield of Achilles".to_owned(), true),
            ("Rings".to_owned(), true),
            ("As Pandoc writes what is said of a table".to_owned(), true),
            ("As Pandoc writes what is said of a figure".to_owned(), true),
        ]
    );
    let Block::Figure { caption, alt, .. } = &blocks[1] else { panic!() };
    assert_eq!(caption, &vec![text("The shield of "), marked("Achilles", &["em"])]);
    assert_eq!(alt, "A round shield");
    assert_eq!(blocks[0], paragraph(vec![text("Before it, Figure 1 is named.")]));
    assert_eq!(blocks[3], paragraph(vec![text("Of nothing that stands here")]));
    assert_eq!(blocks[4], paragraph(vec![text("Text between.")]));
    assert_eq!(read.remarks.len(), 1);
    assert!(read.remarks[0].starts_with("4 captions began with a word and a number, such as “"));
    assert!(!all_text(&read).contains(lifting::MARK));
    // What the second shows was said in the words that are said of it.
    let Block::Figure { alt, .. } = &blocks[6] else { panic!() };
    assert_eq!(alt, "");

    // The same in Markdown, where nothing says what a paragraph is but its shape and its place.
    fs::write(
            desk.join("shape.md"),
            "![](shield.png)\\\n\nFigur 1 – Skjoldet\n\nTabell 1. Ringene\n\n| Ring  | Shows |\n|-------|-------|\n| first | stars |\n\nTabell 1 viser ringene.\n",
        )
        .unwrap();
    let read = s.read(&desk.join("shape.md")).unwrap();
    let blocks = &read.sections[0].blocks;
    assert_eq!(kinds(blocks), vec!["figure", "table", "paragraph"], "{blocks:?}");
    let Block::Figure { caption, numbered, .. } = &blocks[0] else { panic!() };
    assert_eq!((document::plain(caption).as_str(), *numbered), ("Skjoldet", true));
    let Block::Table(table) = &blocks[1] else { panic!() };
    assert_eq!((document::plain(&table.caption).as_str(), table.numbered), ("Ringene", true));
    assert_eq!(blocks[2], paragraph(vec![text("Tabell 1 viser ringene.")]));
}

// ---- citations that programs made ----

fn zotero(key: &str) -> Vec<String> {
    vec![format!("http://zotero.org/users/1234567/items/{key}")]
}

/// What the documents say of the works they cite: see `cited.py` beside them.
fn nagy() -> Value {
    json!({
        "type": "book",
        "event-place": "Baltimore",
        "ISBN": "978-0-8018-2200-6",
        "publisher": "Johns Hopkins University Press",
        "publisher-place": "Baltimore",
        "title": "The Best of the Achaeans: Concepts of the Hero in Archaic Greek Poetry",
        "author": [{ "family": "Nagy", "given": "Gregory" }],
        "issued": { "date-parts": [["1979"]] }
    })
}

fn west() -> Value {
    json!({
        "type": "article-journal",
        "container-title": "The Journal of Hellenic Studies",
        "DOI": "10.2307/632637",
        "page": "151-172",
        "title": "The Rise of the Greek Epic",
        "volume": "108",
        "author": [{ "family": "West", "given": "M. L." }],
        "issued": { "date-parts": [["1988"]] }
    })
}

fn lord() -> Value {
    json!({
        "type": "book",
        "event-place": "Cambridge, Mass.",
        "publisher": "Harvard University Press",
        "title": "The Singer of Tales",
        "author": [{ "family": "Lord", "given": "Albert B." }],
        "issued": { "date-parts": [["1960"]] }
    })
}

#[test]
fn what_zotero_made_is_found_with_all_that_the_file_says_of_it() {
    let Some(s) = setup() else { return };
    // As fields and as reference marks, and as bookmarks with what is
    // cited in the properties of the document.
    for name in ["cited.docx", "cited.odt", "bookmarks.docx", "bookmarks.odt"] {
        let read = s.read(&written(name)).unwrap();
        let found = all_found(&read);
        let shown: Vec<&str> = found.iter().map(|(text, _)| text.as_str()).collect();
        let mut expected = vec![
            "(Nagy 1979, 73)",
            "(see Nagy 1979, chap. 2; West 1988; 1960, 12 and elsewhere)",
            "(Lord, The Singer of Tales, 12)",
            "Nagy, The Best of the Achaeans, 73",
        ];
        if name == "cited.docx" {
            expected.push("(West 1988)");
        }
        assert_eq!(shown, expected, "{name}");
        for (_, found) in &found[..4] {
            assert_eq!((found.by, found.mode, found.left), (By::Zotero, CiteMode::Normal, false), "{name}");
        }
        let nagy_73 = FoundItem {
            uris: zotero("ABCD2345"),
            data: Some(nagy()),
            locator: Some("73".into()),
            ..Default::default()
        };
        let lord_12 = FoundItem {
            uris: zotero("QRST2345"),
            data: Some(lord()),
            locator: Some("12".into()),
            ..Default::default()
        };
        assert_eq!(found[0].1.items, vec![nagy_73.clone()], "{name}");
        // Three works, in a field whose code is cut into several runs.
        assert_eq!(
            found[1].1.items,
            vec![
                FoundItem {
                    uris: zotero("ABCD2345"),
                    data: Some(nagy()),
                    locator: Some("2".into()),
                    label: Some("chapter".into()),
                    prefix: Some("see".into()),
                    ..Default::default()
                },
                FoundItem { uris: zotero("WXYZ6789"), data: Some(west()), ..Default::default() },
                FoundItem { suffix: Some("and elsewhere".into()), suppress_author: true, ..lord_12.clone() },
            ],
            "{name}"
        );
        assert_eq!(found[2].1.items, vec![lord_12], "{name}");
        assert_eq!(found[3].1.items, vec![nagy_73], "{name}");

        // What stands in italics within a citation is a piece of it, and is in italics.
        let word = read.sections.iter().find(|s| document::plain(&s.heading) == "The word").unwrap();
        let Block::Paragraph { content } = &word.blocks[1] else { panic!("{name}") };
        let pieces: Vec<(&str, Vec<&str>)> = content
            .iter()
            .filter_map(|i| match i {
                Inline::Text { text, marks } => Some((text.as_str(), marks.keys().map(String::as_str).collect())),
                _ => None,
            })
            .collect();
        assert_eq!(
            pieces,
            vec![
                ("Much is written of it ", vec![]),
                ("(see Nagy 1979, chap. 2; West 1988; 1960, 12 and elsewhere)", vec!["found"]),
                (". The singer ", vec![]),
                ("(Lord, ", vec!["found"]),
                ("The Singer of Tales", vec!["em", "found"]),
                (", 12)", vec!["found"]),
                (" is another matter.", vec![]),
            ],
            "{name}"
        );

        // In a note, with what else the note says.
        let Block::Paragraph { content } = &word.blocks[2] else { panic!("{name}") };
        assert_eq!(content[0], text("Not all agree."), "{name}");
        let Inline::Footnote { content: note, .. } = &content[1] else { panic!("{name}") };
        assert_eq!(note.len(), 5, "{name}: {note:?}");
        assert_eq!(note[0], text("See "), "{name}");
        assert_eq!(note[4], text("; but he says otherwise elsewhere."), "{name}");
        assert!(note[1..4].iter().all(|piece| found_of(piece).is_some_and(|f| f.id == found[3].1.id)), "{name}");
        assert_eq!(content[2], text(" And so it stands."), "{name}");

        let made = expected.len();
        assert_eq!((read.counts.found, read.counts.found_made), (made, made), "{name}");
        assert_eq!((read.counts.cited, read.counts.not_found, read.counts.notes), (0, 0, 1), "{name}");
        assert!(
            read.remarks[0].starts_with(&format!(
                "{made} citations were found that are not yet tied to references of your library, all made by a \
                     program that keeps references."
            )),
            "{name}: {:?}",
            read.remarks
        );
        // The list of the works is text, and is told of where a program made it.
        let works = read.sections.iter().find(|s| document::plain(&s.heading) == "Works").unwrap();
        assert_eq!(works.blocks.len(), 3, "{name}");
        assert!(all_found(&Imported { sections: vec![works.clone()], ..Default::default() }).is_empty());
        let told = read.remarks.iter().filter(|r| r.contains("a list of what it cites, made by the program")).count();
        assert_eq!(told, usize::from(name.starts_with("cited")), "{name}: {:?}", read.remarks);
        assert_eq!(read.remarks.len(), 1 + told, "{name}: {:?}", read.remarks);
        let all = all_text(&read);
        assert!(!all.contains([made::BEGIN, made::NUMBERED, made::END]), "{name}: {all}");
    }
}

#[test]
fn what_mendeley_made_is_found_as_well() {
    let Some(s) = setup() else { return };
    let read = s.read(&written("cited.docx")).unwrap();
    let found = all_found(&read);
    let (shown, found) = found.last().unwrap();
    assert_eq!(shown, "(West 1988)");
    assert_eq!(found.by, By::Mendeley);
    assert_eq!(
        found.items,
        vec![FoundItem {
            uris: vec!["http://www.mendeley.com/documents/?uuid=0c6e6bd1-9f3b-4f2a-8b1e-2f4f3c1d9a77".into()],
            data: Some(west()),
            ..Default::default()
        }]
    );
}

#[test]
fn tags_that_the_library_has_and_has_not_in_files_of_text() {
    let Some(s) = setup() else { return };
    // As each kind of file writes them; the library has `nagy1979` and `west1988`.
    let files = [
        (
            "tags.md",
            vec![
                "[see @nagy1979, chap. 2; @lord1960; -@west1988, 12 and elsewhere]",
                "[@lord1960, 12]",
                "@lord1960",
                "[@nagy1979, 73; @parry1971]",
            ],
        ),
        (
            "tags.tex",
            vec![
                "\\parencite[see][chap. 2]{nagy1979,lord1960}",
                "\\cite[12]{lord1960}",
                "\\citeauthor{lord1960}",
                "\\cite[73]{nagy1979,parry1971}",
            ],
        ),
        (
            "tags.org",
            vec![
                "[cite:see @nagy1979 chap. 2; @lord1960; @west1988 p. 12 and elsewhere]",
                "[cite:@lord1960 p. 12]",
                "[cite:@nagy1979 p. 73; @parry1971]",
            ],
        ),
    ];
    for (name, expected) in files {
        let read = s.read(&written(name)).unwrap();
        let found = all_found(&read);
        let shown: Vec<&str> = found.iter().map(|(text, _)| text.as_str()).collect();
        assert_eq!(shown, expected, "{name}");
        assert!(found.iter().all(|(_, found)| found.by == By::Key && !found.left), "{name}");
        let keys = |at: usize| -> Vec<&str> { found[at].1.items.iter().filter_map(|i| i.key.as_deref()).collect() };
        assert_eq!(keys(1), vec!["lord1960"], "{name}");
        assert_eq!(found[1].1.items[0].locator.as_deref(), Some("12"), "{name}");
        // The one in the note names a work the library has, and one it has not.
        assert_eq!(keys(found.len() - 1), vec!["nagy1979", "parry1971"], "{name}");
        let word = &read.sections[0];
        let Block::Paragraph { content } = &word.blocks[2] else { panic!("{name}") };
        let Inline::Footnote { content: note, .. } = &content[1] else { panic!("{name}") };
        assert_eq!(note[0], text("See "), "{name}");
        assert_eq!(found_of(&note[1]).map(|f| f.id), Some(found[found.len() - 1].1.id.clone()), "{name}");
        assert_eq!(note[2], text("; but he says otherwise elsewhere."), "{name}");
        // Those of which the library has every work are citations.
        let Block::Paragraph { content } = &word.blocks[0] else { panic!("{name}") };
        let cited: Vec<(&str, Option<&str>, CiteMode)> = content
            .iter()
            .filter_map(|i| match i {
                Inline::Citation { items, mode } => Some((items[0].id.as_str(), items[0].locator.as_deref(), *mode)),
                _ => None,
            })
            .collect();
        assert_eq!(cited, vec![("r1", Some("73"), CiteMode::Normal), ("r2", Some("3"), CiteMode::Intext)], "{name}");
        assert!(found_in(content).is_empty(), "{name}");
        assert_eq!((read.counts.found, read.counts.found_made), (expected.len(), 0), "{name}");
        assert_eq!(read.counts.cited + read.counts.not_found, if name == "tags.md" { 9 } else { 8 }, "{name}");
        assert_eq!(
            read.remarks,
            vec![format!(
                "{} citations were found that are not yet tied to references of your library. They stand as \
                     the text they were written as, and can be gone through when the map is made, and later.",
                expected.len()
            )],
            "{name}"
        );
    }
    // Three works, of which the library has two: what is said of each is kept.
    let read = s.read(&written("tags.md")).unwrap();
    assert_eq!(
        all_found(&read)[0].1.items,
        vec![
            FoundItem {
                locator: Some("2".into()),
                label: Some("chapter".into()),
                prefix: Some("see".into()),
                ..by_key("nagy1979")
            },
            by_key("lord1960"),
            FoundItem {
                locator: Some("12".into()),
                suffix: Some("and elsewhere".into()),
                suppress_author: true,
                ..by_key("west1988")
            },
        ]
    );
}

#[test]
fn what_endnote_made_is_found_where_pandoc_reads_it() {
    let Some(s) = setup() else { return };
    let read = s.read(&written("endnote.docx")).unwrap();
    let found = all_found(&read);
    assert_eq!(found.len(), 1, "{found:?}");
    let (shown, found) = &found[0];
    assert_eq!(shown, "(see Nagy 1979, 73)");
    assert_eq!((found.by, found.mode), (By::Mendeley, CiteMode::Normal));
    assert_eq!(
        found.items,
        vec![FoundItem {
            data: Some(json!({
                "type": "book",
                "title": "The Best of the Achaeans",
                "author": [{ "family": "Nagy", "given": "Gregory" }],
                "issued": { "date-parts": [["1979"]] },
                "publisher": "Johns Hopkins University Press",
                "publisher-place": "Baltimore"
            })),
            locator: Some("73".into()),
            prefix: Some("see".into()),
            ..Default::default()
        }]
    );
    let word = read.sections.iter().find(|s| document::plain(&s.heading) == "The word").unwrap();
    let Block::Paragraph { content } = &word.blocks[0] else { panic!() };
    assert_eq!(content[0], text("The wrath of Achilles is what the poem is of "));
    assert_eq!(content[2], text(", as is often said."));
    // Where EndNote keeps what it says apart from the field, the text is text, and that is said.
    assert!(all_text(&read).contains("The singer (Lord, The Singer of Tales, 12) is another matter."));
    assert_eq!((read.counts.found, read.counts.found_made), (1, 1));
    assert_eq!((read.counts.cited, read.counts.not_found), (0, 0));
    assert_eq!(read.remarks.len(), 2, "{:?}", read.remarks);
    assert_eq!(
        read.remarks[1],
        "1 citation made by EndNote is brought in as the text it shows, and is not among those that were found: \
             what EndNote says of the works could not be read."
    );
}

#[test]
fn what_pandoc_says_of_works_in_the_form_of_csl() {
    assert_eq!(csl_date("1979"), json!({ "date-parts": [["1979"]] }));
    assert_eq!(csl_date("1979-05-02"), json!({ "date-parts": [["1979", "05", "02"]] }));
    assert_eq!(csl_date("spring 1979"), json!({ "raw": "spring 1979" }));
    let meta: Value = serde_json::from_str(
            r#"{"references":{"t":"MetaList","c":[{"t":"MetaMap","c":{
                "id":{"t":"MetaString","c":"12"},
                "abstract":{"t":"MetaInlines","c":[{"t":"Str","c":"Long."}]},
                "issued":{"t":"MetaString","c":"1979-05"},
                "title":{"t":"MetaInlines","c":[{"t":"Str","c":"The"},{"t":"Space"},{"t":"Emph","c":[{"t":"Str","c":"Best"}]}]},
                "author":{"t":"MetaList","c":[{"t":"MetaMap","c":{"family":{"t":"MetaString","c":"Nagy"}}}]}
            }},{"t":"MetaMap","c":{"title":{"t":"MetaString","c":"Without what it is called by"}}}]}}"#,
        )
        .unwrap();
    assert_eq!(
        told_of(&meta),
        vec![(
            "12".to_owned(),
            json!({ "issued": { "date-parts": [["1979", "05"]] }, "title": "The Best", "author": [{ "family": "Nagy" }] })
        )]
    );
}

#[test]
fn the_same_text_without_anything_of_a_program_has_nothing_found() {
    let Some(s) = setup() else { return };
    let read = s.read(&written("plain.docx")).unwrap();
    assert!(all_found(&read).is_empty());
    assert_eq!((read.counts.found, read.counts.found_made), (0, 0));
    assert!(read.remarks.is_empty(), "{:?}", read.remarks);
    assert!(all_text(&read).contains("is what the poem is of (Nagy 1979, 73), as is often said."));
}

#[test]
fn signs_that_do_not_end_and_signs_in_a_name() {
    use made::{BEGIN, END, NUMBERED};
    let made = made::Made {
        citations: vec![made::Citation { by: By::Zotero, items: vec![FoundItem::default()] }],
        ..Default::default()
    };
    let value: Value = serde_json::from_str(&doc(
        "{}",
        &[
            header(1, &format!("One {BEGIN}0{NUMBERED}(Nagy 1979){END}")),
            para(&format!("Open {BEGIN}0{NUMBERED}(Nagy 1979) to the end")),
            para(&format!("The next, {BEGIN}7{NUMBERED}unknown{END} and {END}closed.")),
        ],
    ))
    .unwrap();
    let read = convert_with(&value, "the file", &Properties::default(), &made, &none, &mut a_picture);
    assert_eq!(read.title, vec![text("One (Nagy 1979)")]);
    let found = all_found(&read);
    assert_eq!(found.len(), 1);
    assert_eq!(found[0].0, "(Nagy 1979) to the end");
    assert_eq!(read.sections[0].blocks[1], paragraph(vec![text("The next, unknown and closed.")]));
}

#[test]
fn a_file_named_from_where_the_work_is_done() {
    let Some(s) = setup() else { return };
    let here = std::env::current_dir().unwrap();
    let source = written("captions.odt");
    let Ok(named) = source.strip_prefix(&here) else { return };
    let read = s.read(named).unwrap();
    assert_eq!(read.counts.figures, 2);
}

#[test]
fn a_file_that_holds_its_pictures_brings_none_from_elsewhere() {
    let tmp = tempfile::tempdir().unwrap();
    let work = tmp.path().join("work");
    let media = work.join("media");
    fs::create_dir_all(media.join("media")).unwrap();
    fs::write(media.join("media").join("image1.png"), b"inside").unwrap();
    fs::write(tmp.path().join("secret.png"), b"elsewhere").unwrap();
    let beside = tmp.path().join("beside");
    fs::create_dir_all(&beside).unwrap();
    fs::write(beside.join("drawn.png"), b"beside").unwrap();

    let inside = media.join("media").join("image1.png");
    assert_eq!(picture_bytes(&inside.display().to_string(), &beside, &media, true).unwrap(), b"inside");
    assert_eq!(picture_bytes("media/image1.png", &beside, &media, true).unwrap(), b"inside");
    let outside = tmp.path().join("secret.png").display().to_string();
    let refused = tr!("core-import-document-picture-outside");
    assert_eq!(picture_bytes(&outside, &beside, &media, true).unwrap_err(), refused);
    assert_eq!(picture_bytes(&format!("file://{outside}"), &beside, &media, true).unwrap_err(), refused);
    assert_eq!(picture_bytes("../../secret.png", &beside, &media, true).unwrap_err(), refused);
    // A text of one's own names pictures beside it, and where it likes.
    assert_eq!(picture_bytes("drawn.png", &beside, &media, false).unwrap(), b"beside");
    assert_eq!(picture_bytes(&outside, &beside, &media, false).unwrap(), b"elsewhere");
}

#[test]
fn pictures_that_cannot_be_taken_in() {
    let Some(s) = setup() else { return };
    let desk = s.desk();
    fs::write(desk.join("drawing.emf"), b"not read").unwrap();
    let path = desk.join("pictures.md");
    fs::write(
        &path,
        "![Far away](https://example.org/far.png)\n\n![Not there](missing.png)\n\n![From Word](drawing.emf)\n",
    )
    .unwrap();
    let read = s.read(&path).unwrap();
    assert_eq!(read.counts.figures, 0);
    assert_eq!(
        read.remarks,
        vec![
            "The picture “far.png” is left out: it is on the network, and nothing is fetched from there.",
            "The picture “missing.png” is left out: the file was not found where the document says it is.",
            "The picture “drawing.emf” is left out: it is of a kind that is not read (EMF).",
        ]
    );
    // What was said of them is kept.
    assert_eq!(kinds(&read.sections[0].blocks), vec!["paragraph", "paragraph", "paragraph"]);
}
