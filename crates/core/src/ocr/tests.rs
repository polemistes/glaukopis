//! Reading PDFs and pictures with Tesseract, with files made here: a page of
//! text set by Typst, a picture of it, and a scan, which is a PDF whose only
//! content is the picture. The tests that need Typst or Tesseract are passed
//! over where they are not installed.

use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;

use lopdf::{Document, Object, dictionary};

use super::*;
use crate::export::tools::{Configured, discover};

/// A page of text, with a word broken at the end of a line.
const PAGE: &str = r#"#set page(width: 150mm, height: 100mm, margin: 14mm)
#set text(size: 12pt)
The wrath of Achilles is the subject of the Iliad. Homer sings of the quar-\
rel between the king and the hero, and of all that came of it.

Many scholars have written of the poem since then; the oral theory of Milman Parry changed the field.
"#;

struct Kit {
    tmp: tempfile::TempDir,
    tools: Tools,
}

/// Typst, and Tesseract with English where `reading`. Nothing where they are
/// not installed: the test is then passed over.
fn kit(reading: bool) -> Option<Kit> {
    let tools = discover(&Configured::default());
    if tools.typst.is_none() {
        eprintln!("Typst is not installed; the test is passed over");
        return None;
    }
    if reading && (tools.tesseract.is_none() || !tools.ocr_languages.iter().any(|l| l == "eng")) {
        eprintln!("Tesseract with English is not installed; the test is passed over");
        return None;
    }
    Some(Kit { tmp: tempfile::tempdir().unwrap(), tools })
}

impl Kit {
    fn path(&self, name: &str) -> PathBuf {
        self.tmp.path().join(name)
    }

    fn work(&self) -> PathBuf {
        self.path("work")
    }

    /// Sets Typst source as a PDF, or as a picture where the name ends so.
    fn typeset(&self, name: &str, source: &str) -> PathBuf {
        let input = self.path(&format!("{name}.typ"));
        std::fs::write(&input, source).unwrap();
        let output = self.path(name);
        let typst = &self.tools.typst.as_ref().unwrap().path;
        let mut args = vec!["compile".to_owned(), input.display().to_string(), output.display().to_string()];
        if name.ends_with(".png") {
            args.extend(["--ppi".to_owned(), "300".to_owned()]);
        }
        tools::run(typst, "Typst", &args, None, None).unwrap();
        output
    }

    /// A PDF whose only content is a picture of the page: a scan.
    fn scan(&self, name: &str) -> PathBuf {
        self.typeset("page.png", PAGE);
        self.typeset(
            name,
            "#set page(width: 150mm, height: 100mm, margin: 0pt)\n#image(\"page.png\", width: 100%, height: 100%)\n",
        )
    }

    fn asked(&self) -> Asked {
        Asked { languages: vec!["eng".into()], all: false }
    }
}

fn nothing(_: Progress) {}

fn never() -> AtomicBool {
    AtomicBool::new(false)
}

/// Whether a text has the words, whatever the lines and spaces between them.
fn has(text: &str, words: &str) -> bool {
    let plain = |t: &str| t.split_whitespace().collect::<Vec<_>>().join(" ");
    plain(text).contains(&plain(words))
}

#[test]
fn a_scan_is_read_into_paragraphs() {
    let Some(kit) = kit(true) else { return };
    let scan = kit.scan("scan.pdf");
    let looked = look(&scan, &kit.tools).unwrap();
    assert_eq!((looked.pages, looked.with_text, looked.picture, looked.searchable), (1, 0, false, true));

    let mut told = Vec::new();
    let read = read_pdf(&scan, &kit.tools, &kit.work(), &kit.asked(), None, &mut |p| told.push(p), &never()).unwrap();
    assert_eq!(told, vec![Progress { done: 1, total: 1, page: 1 }]);
    assert_eq!(read.pages.len(), 1);
    let page = &read.pages[0];
    assert!(page.read);
    assert_eq!(page.label, "1");
    assert_eq!(page.paragraphs.len(), 2, "{:?}", page.paragraphs);
    // The word broken at the end of the line is whole again.
    assert!(has(&page.paragraphs[0], "The wrath of Achilles is the subject of the Iliad"), "{:?}", page.paragraphs);
    assert!(has(&page.paragraphs[0], "the quarrel between the king"), "{:?}", page.paragraphs);
    assert!(has(&page.paragraphs[1], "the oral theory of Milman Parry"), "{:?}", page.paragraphs);
    assert_eq!(read.remarks, vec![tr!("ocr-remark-read", count = 1)]);

    let imported = imported_pdf("scan.pdf", "A scan", read);
    assert_eq!(imported.sections.len(), 1);
    assert_eq!(imported.sections[0].level, 1);
    assert_eq!(imported.sections[0].heading, vec![Inline::Text { text: "1".into(), marks: BTreeMap::new() }]);
    assert_eq!(imported.sections[0].blocks.len(), 2);
    assert_eq!(imported.counts.parts, 1);
    assert!(imported.counts.words > 30, "{}", imported.counts.words);
    assert_eq!(imported.kind, tr!("ocr-kind-pdf"));
}

#[test]
fn a_pdf_that_has_text_is_taken_as_it_is() {
    let Some(kit) = kit(false) else { return };
    let pdf = kit.typeset("text.pdf", PAGE);
    let looked = look(&pdf, &kit.tools).unwrap();
    assert_eq!((looked.pages, looked.with_text), (1, 1));

    // No Tesseract is needed for it.
    let tools = Tools { tesseract: None, ..kit.tools.clone() };
    let mut told = 0;
    let read = read_pdf(&pdf, &tools, &kit.work(), &Asked::default(), None, &mut |_| told += 1, &never()).unwrap();
    assert_eq!(told, 0);
    let page = &read.pages[0];
    assert!(!page.read);
    assert_eq!(
        page.paragraphs,
        vec![
            "The wrath of Achilles is the subject of the Iliad. Homer sings of the quarrel between the king and the \
             hero, and of all that came of it.",
            "Many scholars have written of the poem since then; the oral theory of Milman Parry changed the field.",
        ]
    );
    assert!(read.remarks.is_empty(), "{:?}", read.remarks);
}

#[test]
fn a_scan_without_tesseract_cannot_be_read() {
    let Some(kit) = kit(false) else { return };
    kit.typeset("page.png", PAGE);
    let scan = kit.typeset("scan.pdf", "#set page(width: 150mm, height: 100mm, margin: 0pt)\n#image(\"page.png\")\n");
    let tools = Tools { tesseract: None, ..kit.tools.clone() };
    let err = read_pdf(&scan, &tools, &kit.work(), &Asked::default(), None, &mut nothing, &never()).unwrap_err();
    assert_eq!(err.kind(), "missing-program");
    let err = make_searchable(&scan, &tools, &kit.work(), &Asked::default(), &mut nothing, &never()).unwrap_err();
    assert_eq!(err.kind(), "missing-program");
}

/// The pages of a PDF drawn by hayro, as grey.
fn drawn(pdf: &[u8]) -> Vec<drawing::Drawn> {
    let pdf = hayro::hayro_syntax::Pdf::new(pdf.to_vec()).unwrap();
    (0..pdf.pages().len()).map(|i| drawing::draw_with_hayro(&pdf, i).unwrap()).collect()
}

/// The unseen glyphs of a page as hayro interprets it, on the picture of
/// the page: where each begins, and which ways are along the line and up
/// from it, an em long each.
#[derive(Default)]
struct Unseen {
    glyphs: Vec<(Point, Vec2, Vec2)>,
}

use hayro::hayro_interpret::{
    BlendMode, ClipPath, Device, GlyphDrawMode, Image, Paint, PathDrawMode, SoftMask, font::Glyph,
};
use hayro::vello_cpu::kurbo::{Affine, BezPath, Point, Rect, Vec2};

impl<'a> Device<'a> for Unseen {
    fn set_soft_mask(&mut self, _: Option<SoftMask<'a>>) {}
    fn set_blend_mode(&mut self, _: BlendMode) {}
    fn draw_path(&mut self, _: &BezPath, _: Affine, _: &Paint<'a>, _: &PathDrawMode) {}
    fn push_clip_path(&mut self, _: &ClipPath) {}
    fn push_transparency_group(&mut self, _: f32, _: Option<SoftMask<'a>>, _: BlendMode) {}
    fn draw_glyph(&mut self, _: &Glyph<'a>, transform: Affine, glyph: Affine, _: &Paint<'a>, mode: &GlyphDrawMode) {
        if matches!(mode, GlyphDrawMode::Invisible) {
            // Glyphs are drawn in thousandths of an em.
            let full = transform * glyph;
            let origin = full * Point::ZERO;
            self.glyphs.push((
                origin,
                full * Point::new(1000.0, 0.0) - origin,
                full * Point::new(0.0, 1000.0) - origin,
            ));
        }
    }
    fn draw_image(&mut self, _: Image<'a, '_>, _: Affine) {}
    fn pop_clip_path(&mut self) {}
    fn pop_transparency_group(&mut self) {}
}

/// Whether the unseen text of a page lies where its words are drawn: of
/// its glyphs, how many stand on ink, looked for from where each begins,
/// along the line and up from it, in the picture of the page as it was.
fn on_the_ink(original: &[u8], searchable: &[u8], page: usize) -> (usize, usize) {
    use hayro::hayro_interpret::{Context, InterpreterCache, InterpreterSettings, TransformExt, interpret_page};
    let before = hayro::hayro_syntax::Pdf::new(original.to_vec()).unwrap();
    let picture = drawing::draw_with_hayro(&before, page).unwrap();
    let after = hayro::hayro_syntax::Pdf::new(searchable.to_vec()).unwrap();
    let shown = &after.pages()[page];
    let scale = f64::from(picture.dpi) / 72.0;
    let initial = Affine::scale(scale) * shown.initial_transform(true).to_kurbo();
    let bounds = Rect::new(0.0, 0.0, f64::from(picture.width), f64::from(picture.height));
    let cache = InterpreterCache::new();
    let mut context = Context::new(initial, bounds, &cache, shown.xref(), InterpreterSettings::default());
    let mut unseen = Unseen::default();
    interpret_page(shown, &mut context, &mut unseen);

    let ink = |p: Point| {
        let (x, y) = (p.x.round() as i64, p.y.round() as i64);
        x >= 0
            && y >= 0
            && (x as u32) < picture.width
            && (y as u32) < picture.height
            && picture.grey[y as usize * picture.width as usize + x as usize] < 128
    };
    let on = unseen
        .glyphs
        .iter()
        .filter(|(origin, along, up)| {
            (0..8).any(|i| (0..8).any(|j| ink(*origin + *along * (f64::from(i) / 10.0) + *up * (f64::from(j) / 10.0))))
        })
        .count();
    (on, unseen.glyphs.len())
}

#[test]
fn a_scan_made_searchable_looks_the_same_and_its_text_can_be_read() {
    let Some(kit) = kit(true) else { return };
    let scan = kit.scan("scan.pdf");
    let before = std::fs::read(&scan).unwrap();
    let made = make_searchable(&scan, &kit.tools, &kit.work(), &kit.asked(), &mut nothing, &never()).unwrap();
    assert_eq!((made.read, made.with_text, made.failed.len()), (1, 0, 0));
    let after = made.pdf.unwrap();
    // The file itself is untouched, and what was there is there to the byte, the text after it.
    assert_eq!(std::fs::read(&scan).unwrap(), before);
    assert!(after.starts_with(&before));

    // It looks the same.
    assert_eq!(drawn(&after), drawn(&before));
    // Its text can be read, and lies where the words are.
    let text = pdf_extract::extract_text_from_mem(&after).unwrap();
    assert!(has(&text, "The wrath of Achilles is the subject of the Iliad"), "{text}");
    assert!(has(&text, "Milman Parry"), "{text}");
    let (on, of) = on_the_ink(&before, &after, 0);
    assert!(of > 100 && on * 100 >= of * 95, "{on} of {of} letters are on the ink");

    // Made searchable again, nothing is to be done: the page has text now.
    let again = kit.path("again.pdf");
    std::fs::write(&again, &after).unwrap();
    let made = make_searchable(&again, &kit.tools, &kit.work(), &kit.asked(), &mut nothing, &never()).unwrap();
    assert_eq!((made.pdf.is_none(), made.read, made.with_text), (true, 0, 1));
}

#[test]
fn a_page_of_little_text_is_made_searchable_once() {
    let Some(kit) = kit(true) else { return };
    kit.typeset(
        "title.png",
        "#set page(width: 150mm, height: 100mm, margin: 14mm)\n#set text(size: 20pt)\n#align(center)[The Iliad]\n",
    );
    let scan = kit.typeset(
        "title.pdf",
        "#set page(width: 150mm, height: 100mm, margin: 0pt)\n#image(\"title.png\", width: 100%, height: 100%)\n",
    );
    let made = make_searchable(&scan, &kit.tools, &kit.work(), &kit.asked(), &mut nothing, &never()).unwrap();
    assert_eq!(made.read, 1);
    let once = kit.path("once.pdf");
    std::fs::write(&once, made.pdf.unwrap()).unwrap();
    let text = pdf_extract::extract_text(&once).unwrap();
    assert!(has(&text, "The Iliad"), "{text}");

    // It has text now, if little: it is not read again.
    let looked = look(&once, &kit.tools).unwrap();
    assert_eq!(looked.with_text, 1);
    let made = make_searchable(&once, &kit.tools, &kit.work(), &kit.asked(), &mut nothing, &never()).unwrap();
    assert_eq!((made.pdf.is_none(), made.read), (true, 0));
}

/// Sets what a page says of itself, and writes the PDF anew.
fn with_page(pdf: &Path, change: impl FnOnce(&mut lopdf::Dictionary)) {
    let mut doc = Document::load(pdf).unwrap();
    let id = doc.get_pages()[&1];
    change(doc.get_dictionary_mut(id).unwrap());
    doc.save(pdf).unwrap();
}

#[test]
fn the_text_lies_on_the_words_of_pages_turned_and_cropped() {
    let Some(kit) = kit(true) else { return };
    let page = kit.typeset("page.png", PAGE);

    // A page stored turned a quarter against the clock, which is to be shown
    // turned a quarter with it: shown upright.
    let upright = image::open(&page).unwrap();
    upright.rotate270().save(kit.path("turned.png")).unwrap();
    let turned = kit.typeset(
        "turned.pdf",
        "#set page(width: 100mm, height: 150mm, margin: 0pt)\n#image(\"turned.png\", width: 100%, height: 100%)\n",
    );
    with_page(&turned, |page| page.set("Rotate", 90));

    // A page with a margin around what is shown of it, and its origin elsewhere.
    let cropped = kit.typeset(
        "cropped.pdf",
        "#set page(width: 170mm, height: 120mm, margin: 10mm)\n#image(\"page.png\", width: 100%, height: 100%)\n",
    );
    let mm = 72.0 / 25.4;
    with_page(&cropped, |page| {
        let crop = [10.0 * mm, 10.0 * mm, 160.0 * mm, 110.0 * mm];
        page.set("CropBox", crop.iter().map(|n| Object::Real(*n)).collect::<Vec<_>>());
    });

    // And one turned half round, standing on its head as it is stored.
    upright.rotate180().save(kit.path("headlong.png")).unwrap();
    let headlong = kit.typeset(
        "headlong.pdf",
        "#set page(width: 150mm, height: 100mm, margin: 0pt)\n#image(\"headlong.png\", width: 100%, height: 100%)\n",
    );
    with_page(&headlong, |page| page.set("Rotate", 180));

    upright.rotate90().save(kit.path("other-way.png")).unwrap();
    let other_way = kit.typeset(
        "other-way.pdf",
        "#set page(width: 100mm, height: 150mm, margin: 0pt)\n#image(\"other-way.png\", width: 100%, height: 100%)\n",
    );
    with_page(&other_way, |page| page.set("Rotate", -90));

    for pdf in [turned, cropped, headlong, other_way] {
        let before = std::fs::read(&pdf).unwrap();
        let made = make_searchable(&pdf, &kit.tools, &kit.work(), &kit.asked(), &mut nothing, &never()).unwrap();
        let after = made.pdf.unwrap();
        assert_eq!(drawn(&after), drawn(&before), "{}", pdf.display());
        let text = pdf_extract::extract_text_from_mem(&after).unwrap();
        assert!(has(&text, "Milman Parry"), "{}: {text}", pdf.display());
        let (on, of) = on_the_ink(&before, &after, 0);
        assert!(of > 100 && on * 100 >= of * 95, "{}: {on} of {of} letters are on the ink", pdf.display());
    }
}

#[test]
fn pages_that_have_text_are_left_as_they_are() {
    let Some(kit) = kit(true) else { return };
    kit.typeset("page.png", PAGE);
    let mixed = kit.typeset(
        "mixed.pdf",
        &format!("{PAGE}\n#page(margin: 0pt)[#image(\"page.png\", width: 100%, height: 100%)]\n"),
    );
    let looked = look(&mixed, &kit.tools).unwrap();
    assert_eq!((looked.pages, looked.with_text), (2, 1));

    let read = read_pdf(&mixed, &kit.tools, &kit.work(), &kit.asked(), None, &mut nothing, &never()).unwrap();
    assert_eq!(read.pages.iter().map(|p| p.read).collect::<Vec<_>>(), vec![false, true]);
    assert!(has(&read.pages[1].paragraphs[1], "Milman Parry"), "{:?}", read.pages[1]);
    assert_eq!(read.remarks, vec![tr!("ocr-remark-read", count = 1), tr!("ocr-remark-text", count = 1)]);

    let laid = |pdf: &[u8]| -> Vec<bool> {
        let doc = Document::load_mem(pdf).unwrap();
        doc.get_pages()
            .values()
            .map(|id| {
                let page = doc.get_dictionary(*id).unwrap();
                let resources = doc.dereference(page.get(b"Resources").unwrap()).unwrap().1.as_dict().unwrap();
                resources
                    .get(b"XObject")
                    .ok()
                    .and_then(|x| doc.dereference(x).ok())
                    .and_then(|(_, x)| x.as_dict().ok())
                    .is_some_and(|x| x.iter().any(|(name, _)| name.starts_with(b"GlaukopisText")))
            })
            .collect()
    };
    let made = make_searchable(&mixed, &kit.tools, &kit.work(), &kit.asked(), &mut nothing, &never()).unwrap();
    assert_eq!((made.read, made.with_text), (1, 1));
    assert_eq!(laid(made.pdf.as_ref().unwrap()), vec![false, true]);

    // Unless all are to be read.
    let all = Asked { all: true, ..kit.asked() };
    let made = make_searchable(&mixed, &kit.tools, &kit.work(), &all, &mut nothing, &never()).unwrap();
    assert_eq!(made.read, 2);
    assert_eq!(laid(made.pdf.as_ref().unwrap()), vec![true, true]);
    // The font of the text is taken in once.
    let doc = Document::load_mem(made.pdf.as_ref().unwrap()).unwrap();
    let fonts = doc
        .objects
        .values()
        .filter(|o| {
            o.as_dict().ok().and_then(|d| d.get(b"FontName").ok()).and_then(|n| n.as_name().ok())
                == Some(b"GlyphLessFont".as_slice())
        })
        .count();
    assert_eq!(fonts, 1);
}

#[test]
fn a_picture_is_read() {
    let Some(kit) = kit(true) else { return };
    let page = kit.typeset("page.png", PAGE);
    let bytes = std::fs::read(&page).unwrap();
    let read = read_picture(&bytes, &kit.tools, &kit.work(), &kit.asked(), None, &never()).unwrap();
    assert_eq!(read.len(), 2, "{read:?}");
    assert!(has(&read[0], "Homer sings of the quarrel"), "{read:?}");

    let imported = imported_picture("page.png", "The page", read);
    assert!(imported.sections.iter().all(|s| s.level == 0));
    assert_eq!(imported.counts.parts, 0);

    let svg = br#"<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><text>Hi</text></svg>"#;
    let err = read_picture(svg, &kit.tools, &kit.work(), &kit.asked(), None, &never()).unwrap_err();
    assert_eq!(err.to_string(), tr!("ocr-drawing"));
}

#[test]
fn a_reading_can_be_stopped_and_asks_for_languages_there_are() {
    let Some(kit) = kit(true) else { return };
    let scan = kit.scan("scan.pdf");
    let stop = AtomicBool::new(true);
    let err = read_pdf(&scan, &kit.tools, &kit.work(), &kit.asked(), None, &mut nothing, &stop).unwrap_err();
    assert_eq!(err.kind(), tools::STOPPED);
    let err = make_searchable(&scan, &kit.tools, &kit.work(), &kit.asked(), &mut nothing, &stop).unwrap_err();
    assert_eq!(err.kind(), tools::STOPPED);

    let klingon = Asked { languages: vec!["tlh".into()], all: false };
    let err = read_pdf(&scan, &kit.tools, &kit.work(), &klingon, None, &mut nothing, &never()).unwrap_err();
    assert_eq!(err.to_string(), tr!("ocr-no-language", language = "tlh"));
    // What is made on the way is gone.
    assert!(std::fs::read_dir(kit.work()).map(|d| d.count()).unwrap_or(0) == 0);
}

#[test]
fn a_scan_is_known_by_the_doi_and_the_isbn_printed_in_it() {
    let Some(kit) = kit(true) else { return };
    kit.typeset(
        "title.png",
        &PAGE.replace("The wrath", "Classical Quarterly 69.1 (2019), doi:10.1017/S0009838819000235\n\nThe wrath"),
    );
    kit.typeset(
        "imprint.png",
        "#set page(width: 150mm, height: 100mm, margin: 14mm)\n#set text(size: 11pt)\n\
         Printed in the United States of America.\n\nISBN 978-0-8018-2388-6\n",
    );
    let scan = kit.typeset(
        "scan.pdf",
        "#set page(width: 150mm, height: 100mm, margin: 0pt)\n#image(\"title.png\", width: 100%, height: 100%)\n\
         #pagebreak()\n#image(\"imprint.png\", width: 100%, height: 100%)\n",
    );
    // Without its text, the file says nothing of what it is.
    let unknown = crate::import::pdf::identify(&scan).unwrap();
    assert_eq!((unknown.doi.as_deref(), unknown.isbns.len(), unknown.has_text), (None, 0, false));

    let mut asked = 0;
    let facts = crate::import::pdf::identify_scan(&scan, |count| {
        asked = count;
        first_pages(&scan, &kit.tools, &kit.work(), count, &never())
    })
    .unwrap();
    assert_eq!(asked, 2);
    assert_eq!(facts.doi.as_deref(), Some("10.1017/s0009838819000235"));
    assert_eq!(facts.isbns, vec!["9780801823886"]);
    assert!(!facts.has_text, "it is still a scan");
    assert!(facts.beginning.starts_with("Classical Quarterly"), "{}", facts.beginning);

    // A file with text is not read.
    let text = kit.typeset("text.pdf", PAGE);
    crate::import::pdf::identify_scan(&text, |_| panic!("a file with text was read")).unwrap();
}

#[test]
fn what_is_not_a_pdf_is_said_to_be_none() {
    let tmp = tempfile::tempdir().unwrap();
    let path = tmp.path().join("letter.pdf");
    std::fs::write(&path, "Dear reader").unwrap();
    let err = look(&path, &Tools::default()).unwrap_err();
    assert_eq!(err.to_string(), tr!("ocr-not-pdf", file = "letter.pdf"));
    let looked = look(Path::new("photo.JPG"), &Tools::default()).unwrap();
    assert!(looked.picture && looked.pages == 1);
}

#[test]
fn a_pdf_that_opens_without_a_password_but_is_locked_is_read_and_not_changed() {
    let Some(kit) = kit(true) else { return };
    let scan = kit.scan("scan.pdf");
    let mut doc = Document::load(&scan).unwrap();
    if doc.trailer.get(b"ID").is_err() {
        let id = Object::String(b"0123456789abcdef".to_vec(), lopdf::StringFormat::Hexadecimal);
        doc.trailer.set("ID", vec![id.clone(), id]);
    }
    // Locked against being changed, with a password for that; none to open it.
    let version = lopdf::EncryptionVersion::V2 {
        document: &doc,
        owner_password: "owner",
        user_password: "",
        key_length: 128,
        permissions: lopdf::Permissions::default(),
    };
    let state = lopdf::EncryptionState::try_from(version).unwrap();
    doc.encrypt(&state).unwrap();
    let locked = kit.path("locked.pdf");
    doc.save(&locked).unwrap();

    let looked = look(&locked, &kit.tools).unwrap();
    assert_eq!((looked.locked, looked.searchable, looked.pages, looked.with_text), (true, false, 1, 0));
    let read = read_pdf(&locked, &kit.tools, &kit.work(), &kit.asked(), None, &mut nothing, &never()).unwrap();
    assert!(has(&read.pages[0].paragraphs.join(" "), "Milman Parry"), "{:?}", read.pages);
    let err = make_searchable(&locked, &kit.tools, &kit.work(), &kit.asked(), &mut nothing, &never()).unwrap_err();
    assert_eq!(err.kind(), "locked");
    assert_eq!(err.to_string(), tr!("ocr-searchable-locked"));
}

#[test]
fn a_locked_pdf_is_not_made_searchable() {
    // Encryption named in the trailer is enough for lopdf to take the file as locked.
    let mut doc = Document::with_version("1.7");
    let pages = doc.new_object_id();
    let page = doc.add_object(dictionary! { "Type" => "Page", "Parent" => pages, "MediaBox" => vec![0.into(), 0.into(), 100.into(), 100.into()] });
    doc.objects.insert(
        pages,
        Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => vec![page.into()], "Count" => 1 }),
    );
    let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages });
    doc.trailer.set("Root", catalog);
    let encrypt = doc.add_object(dictionary! { "Filter" => "Standard", "V" => 99, "R" => 99 });
    doc.trailer.set("Encrypt", encrypt);
    let mut bytes = Vec::new();
    doc.save_to(&mut bytes).unwrap();
    match searchable::open(&bytes) {
        Err(e) => assert!(["locked", "invalid"].contains(&e.kind()), "{e}"),
        Ok(_) => panic!("a locked PDF was opened to be changed"),
    }
}
