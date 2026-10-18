//! The names of the glyphs reach the device: those the standard knows, those
//! it does not, and a code that the PDF's map does not give a character for.

use lopdf::content::{Content, Operation};
use lopdf::{dictionary, Document, Object, Stream};
use pdf_text::{Glyph, MediaBox, OutputDev, OutputError, Transform};

#[derive(Default)]
struct Seen {
    glyphs: Vec<(String, Option<String>, u32, String, bool)>,
}

impl OutputDev for Seen {
    fn begin_page(&mut self, _: u32, _: &MediaBox, _: Option<(f64, f64, f64, f64)>) -> Result<(), OutputError> {
        Ok(())
    }
    fn end_page(&mut self) -> Result<(), OutputError> {
        Ok(())
    }
    fn output_character(&mut self, _: &Transform, _: f64, _: f64, _: f64, _: &str) -> Result<(), OutputError> {
        panic!("output_glyph is called in its place");
    }
    fn output_glyph(&mut self, _: &Transform, _: f64, _: f64, _: f64, char: &str, glyph: &Glyph) -> Result<(), OutputError> {
        self.glyphs.push((
            char.to_owned(),
            glyph.name.map(str::to_owned),
            glyph.code,
            glyph.font_name.to_owned(),
            glyph.font.is_some(),
        ));
        Ok(())
    }
    fn begin_word(&mut self) -> Result<(), OutputError> {
        Ok(())
    }
    fn end_word(&mut self) -> Result<(), OutputError> {
        Ok(())
    }
    fn end_line(&mut self) -> Result<(), OutputError> {
        Ok(())
    }
}

#[test]
fn the_names_of_the_glyphs_reach_the_device() {
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    // The PDF's own map says only that 65 is V, as a font's broken map would.
    let cmap = b"/CIDInit /ProcSet findresource begin 12 dict begin begincmap\n\
        1 begincodespacerange <00> <FF> endcodespacerange\n\
        1 beginbfchar <41> <0056> endbfchar\n\
        endcmap CMapName currentdict /CMap defineresource pop end end\n";
    let to_unicode = doc.add_object(Stream::new(dictionary! {}, cmap.to_vec()));
    let font = doc.add_object(dictionary! {
        "Type" => "Font",
        "Subtype" => "Type1",
        "BaseFont" => "ABCDEF+Helvetica",
        "Encoding" => dictionary! {
            "Type" => "Encoding",
            "BaseEncoding" => "WinAnsiEncoding",
            "Differences" => vec![65.into(), Object::Name(b"etaasper".to_vec()), Object::Name(b"alphatildeiota".to_vec()), Object::Name(b"Osmall".to_vec())],
        },
        "ToUnicode" => to_unicode,
        "FirstChar" => 32,
        "LastChar" => 126,
        "Widths" => vec![Object::Integer(500); 95],
    });
    let resources = doc.add_object(dictionary! { "Font" => dictionary! { "F1" => font } });
    let content = Content {
        operations: vec![
            Operation::new("BT", vec![]),
            Operation::new("Tf", vec!["F1".into(), 12.into()]),
            Operation::new("Td", vec![72.into(), 700.into()]),
            Operation::new("Tj", vec![Object::string_literal("ABCa")]),
            Operation::new("ET", vec![]),
        ],
    };
    let content = doc.add_object(Stream::new(dictionary! {}, content.encode().unwrap()));
    let page = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "Contents" => content,
        "Resources" => resources,
        "MediaBox" => vec![0.into(), 0.into(), 595.into(), 842.into()],
    });
    doc.objects.insert(pages_id, Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => vec![page.into()], "Count" => 1 }));
    let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
    doc.trailer.set("Root", catalog);

    let mut seen = Seen::default();
    pdf_text::output_doc(&doc, &mut seen).unwrap();
    let got: Vec<(&str, Option<&str>, u32)> =
        seen.glyphs.iter().map(|(c, n, code, _, _)| (c.as_str(), n.as_deref(), *code)).collect();
    assert_eq!(
        got,
        vec![
            // The PDF's map, wrong, and the name, right.
            ("V", Some("etaasper"), 65),
            // A name the standard does not know, and nothing in the map: nothing, with the name.
            ("", Some("alphatildeiota"), 66),
            // A name the standard knows, into the private-use range.
            ("\u{f76f}", Some("Osmall"), 67),
            // A plain letter, named by the base encoding.
            ("a", Some("a"), 97),
        ]
    );
    let (_, _, _, font_name, has_id) = &seen.glyphs[0];
    assert_eq!(font_name, "Helvetica", "without the prefix of the subset");
    assert!(has_id, "the font's object, as the page names it");
}

#[test]
fn names_of_a_code_are_read_as_the_glyph_list_gives_them() {
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    // No map of the PDF's own: the names alone say the characters.
    let font = doc.add_object(dictionary! {
        "Type" => "Font",
        "Subtype" => "Type1",
        "BaseFont" => "Greek",
        "Encoding" => dictionary! {
            "Type" => "Encoding",
            "BaseEncoding" => "WinAnsiEncoding",
            "Differences" => vec![
                65.into(),
                Object::Name(b"uni0391".to_vec()),
                Object::Name(b"u1F00".to_vec()),
                Object::Name(b"uni1f00".to_vec()),
                Object::Name(b"uniD800".to_vec()),
                Object::Name(b"u03B2".to_vec()),
            ],
        },
        "FirstChar" => 32,
        "LastChar" => 126,
        "Widths" => vec![Object::Integer(500); 95],
    });
    let resources = doc.add_object(dictionary! { "Font" => dictionary! { "F1" => font } });
    let content = Content {
        operations: vec![
            Operation::new("BT", vec![]),
            Operation::new("Tf", vec!["F1".into(), 12.into()]),
            Operation::new("Td", vec![72.into(), 700.into()]),
            Operation::new("Tj", vec![Object::string_literal("ABCDE")]),
            Operation::new("ET", vec![]),
        ],
    };
    let content = doc.add_object(Stream::new(dictionary! {}, content.encode().unwrap()));
    let page = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "Contents" => content,
        "Resources" => resources,
        "MediaBox" => vec![0.into(), 0.into(), 595.into(), 842.into()],
    });
    doc.objects.insert(pages_id, Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => vec![page.into()], "Count" => 1 }));
    let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
    doc.trailer.set("Root", catalog);

    let mut seen = Seen::default();
    pdf_text::output_doc(&doc, &mut seen).unwrap();
    let got: Vec<&str> = seen.glyphs.iter().map(|(c, ..)| c.as_str()).collect();
    // The digits in small letters, and a surrogate, are not names of a code.
    assert_eq!(got, vec!["Α", "ἀ", "", "", "β"]);
}
