//! Glaukopis: a form XObject that draws itself, or two that draw each other,
//! is drawn once on its path, not until the stack is gone; the text of the
//! page around it, and in it, is read.

use lopdf::{dictionary, Document, Object, Stream};

/// A page that shows a word and draws the form `X`, whose content shows a
/// word and draws `X` again, or `Y`, which draws `X`.
fn page_with_forms(each_other: bool) -> Vec<u8> {
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let font = doc.add_object(dictionary! { "Type" => "Font", "Subtype" => "Type1", "BaseFont" => "Helvetica" });
    let x = doc.new_object_id();
    let y = doc.new_object_id();
    let form = |content: &[u8], draws: (&str, lopdf::ObjectId)| {
        Object::Stream(Stream::new(
            dictionary! {
                "Type" => "XObject",
                "Subtype" => "Form",
                "BBox" => vec![0.into(), 0.into(), 200.into(), 200.into()],
                "Resources" => dictionary! {
                    "Font" => dictionary! { "F1" => font },
                    "XObject" => dictionary! { draws.0 => draws.1 },
                },
            },
            content.to_vec(),
        ))
    };
    if each_other {
        doc.objects.insert(x, form(b"BT /F1 12 Tf 10 50 Td (Inside) Tj ET /Y Do", ("Y", y)));
        doc.objects.insert(y, form(b"/X Do", ("X", x)));
    } else {
        doc.objects.insert(x, form(b"BT /F1 12 Tf 10 50 Td (Inside) Tj ET /X Do", ("X", x)));
    }
    let content = doc.add_object(Stream::new(dictionary! {}, b"BT /F1 12 Tf 10 100 Td (Outside) Tj ET /X Do".to_vec()));
    let page = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "Contents" => content,
        "MediaBox" => vec![0.into(), 0.into(), 200.into(), 200.into()],
        "Resources" => dictionary! {
            "Font" => dictionary! { "F1" => font },
            "XObject" => dictionary! { "X" => x },
        },
    });
    doc.objects.insert(
        pages_id,
        Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => vec![page.into()], "Count" => 1 }),
    );
    let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
    doc.trailer.set("Root", catalog);
    let mut out = Vec::new();
    doc.save_to(&mut out).unwrap();
    out
}

/// A page that shows a word and draws `X`, a form whose content packs small
/// and unpacks to `unpacked` bytes, and `P`, a picture.
fn page_with_a_large_form(unpacked: usize) -> Vec<u8> {
    use std::io::Write;
    let mut packer = flate2::write::ZlibEncoder::new(Vec::new(), flate2::Compression::best());
    let line = b"0 0 m 1 1 l S\n";
    for _ in 0..unpacked / line.len() {
        packer.write_all(line).unwrap();
    }
    let packed = packer.finish().unwrap();
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let font = doc.add_object(dictionary! { "Type" => "Font", "Subtype" => "Type1", "BaseFont" => "Helvetica" });
    let x = doc.add_object(Stream::new(
        dictionary! {
            "Type" => "XObject",
            "Subtype" => "Form",
            "Filter" => "FlateDecode",
            "BBox" => vec![0.into(), 0.into(), 200.into(), 200.into()],
        },
        packed,
    ));
    let p = doc.add_object(Stream::new(
        dictionary! {
            "Type" => "XObject", "Subtype" => "Image", "Width" => 1, "Height" => 1,
            "ColorSpace" => "DeviceGray", "BitsPerComponent" => 8,
        },
        b"(Not text) Tj".to_vec(),
    ));
    let content = doc.add_object(Stream::new(dictionary! {}, b"BT /F1 12 Tf 10 100 Td (Outside) Tj ET /X Do BT /F1 12 Tf /P Do ET".to_vec()));
    let page = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "Contents" => content,
        "MediaBox" => vec![0.into(), 0.into(), 200.into(), 200.into()],
        "Resources" => dictionary! {
            "Font" => dictionary! { "F1" => font },
            "XObject" => dictionary! { "X" => x, "P" => p },
        },
    });
    doc.objects.insert(
        pages_id,
        Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => vec![page.into()], "Count" => 1 }),
    );
    let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
    doc.trailer.set("Root", catalog);
    let mut out = Vec::new();
    doc.save_to(&mut out).unwrap();
    out
}

/// A form that unpacks without end is not unpacked, nor a picture read as
/// if it were a form; the text of the page is read all the same.
#[test]
fn a_form_that_unpacks_without_end_is_passed_over() {
    let pdf = page_with_a_large_form(40 << 20);
    assert!(pdf.len() < 1 << 20, "it packs small: {}", pdf.len());
    let text = pdf_text::extract_text_from_mem(&pdf).unwrap();
    assert!(text.contains("Outside") && !text.contains("Not text"), "{}", text);
}

#[test]
fn a_form_that_draws_itself_is_drawn_once() {
    for each_other in [false, true] {
        let pdf = page_with_forms(each_other);
        // On a thread of the size the application gives its own, that an
        // overflow is not hidden by a large one.
        let text = std::thread::Builder::new()
            .stack_size(2 << 20)
            .spawn(move || pdf_text::extract_text_from_mem(&pdf).unwrap())
            .unwrap()
            .join()
            .unwrap();
        assert!(text.contains("Outside"), "{}", text);
        assert_eq!(text.matches("Inside").count(), 1, "{}", text);
    }
}
