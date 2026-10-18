//! A PDF that keeps its Greek as the Oxford text of Aristophanes does
//! (ADR 0044): a font whose glyphs are named by what they are
//! (`etaasperacute`, `alphatildeiota`), and a map from glyph to Unicode that
//! gives the plain letters rightly, Latin signs for the accented ones, and a
//! control character for the sigmas. For the tests, the contract, and the
//! end-to-end scripts; nothing in the application uses it.

use lopdf::content::{Content, Operation};
use lopdf::{Document, Object, Stream, StringFormat, dictionary};

/// The lines of the page, as they are to be read: what a right translation gives.
pub const LINES: [&str; 4] = [
    "ἥσθην ἀπειλαῖς, ἐγέλασα ψολοκομπίαις,",
    "ἀπεπυδάρισα μόθωνα, περιεκόκκασα.",
    "οὔτοι μὰ τὴν Δήμητρα, εἰ μὴ ἐκφάγω",
    "ἐκ τῆσδε τῆς γῆς, οὐδέποτε βιώσομαι.",
];

/// The name of the font, as a subset of it is named in a PDF.
pub const FONT: &str = "FCIOCM+PorsonGreekSF";

/// The glyph each character of the lines is drawn with, by its name in
/// the font: a letter, then its marks, as Porson names them.
fn glyph_of(c: char) -> &'static str {
    match c {
        ' ' => "space",
        ',' => "comma",
        '.' => "period",
        'α' => "alpha",
        'ά' => "alphaacute",
        'ὰ' => "alphagrave",
        'ἀ' => "alphalenis",
        'β' => "beta",
        'γ' => "gamma",
        'δ' => "delta",
        'Δ' => "Delta",
        'ε' => "epsilon",
        'έ' => "epsilonacute",
        'ἐ' => "epsilonlenis",
        'η' => "eta",
        'ή' => "etaacute",
        'ὴ' => "etagrave",
        'ῆ' => "etatilde",
        'ἥ' => "etaasperacute",
        'θ' => "theta",
        'ι' => "iota",
        'ί' => "iotaacute",
        'ῖ' => "iotatilde",
        'ἰ' => "iotalenis",
        'κ' => "kappa",
        'λ' => "lambda",
        'μ' => "mu",
        'ν' => "nu",
        'ο' => "omicron",
        'ό' => "omicronacute",
        'π' => "pi",
        'ρ' => "rho",
        'σ' => "sigma",
        'ς' => "sigmafinalt",
        'τ' => "tau",
        'υ' => "upsilon",
        'ὔ' => "upsilonlenisacute",
        'ὐ' => "upsilonlenis",
        'φ' => "phi",
        'ψ' => "psi",
        'ω' => "omega",
        'ώ' => "omegaacute",
        other => panic!("the fixture has no glyph for {other:?}"),
    }
}

/// What the PDF's own map gives for a glyph, as the book's does: the plain
/// letters and signs rightly, the accented letters as Latin signs, the
/// sigmas as a control character.
fn mapped(name: &str, c: char) -> String {
    match name {
        "sigma" | "sigmafinalt" => "\u{13}".into(),
        n if n.len() > 1 && glyph_names_plain(n) => c.to_string(),
        "space" | "comma" | "period" => c.to_string(),
        _ => {
            const SIGNS: [&str; 6] = ["%", ">", "=", "9", "\\", "<"];
            SIGNS[name.len() % SIGNS.len()].into()
        }
    }
}

/// Whether a name is that of a plain Greek letter, which the book's map gives rightly.
fn glyph_names_plain(name: &str) -> bool {
    matches!(
        name.to_ascii_lowercase().as_str(),
        "alpha"
            | "beta"
            | "gamma"
            | "delta"
            | "epsilon"
            | "eta"
            | "theta"
            | "iota"
            | "kappa"
            | "lambda"
            | "mu"
            | "nu"
            | "omicron"
            | "pi"
            | "rho"
            | "tau"
            | "upsilon"
            | "phi"
            | "psi"
            | "omega"
    )
}

/// The right map of the fixture's font: each code with the letter it draws.
pub fn right_map() -> Vec<(u32, String)> {
    let mut out = vec![(32, " ".to_owned())];
    let mut seen: Vec<&'static str> = Vec::new();
    for c in LINES.iter().flat_map(|l| l.chars()) {
        let name = glyph_of(c);
        if name != "space" && !seen.contains(&name) {
            seen.push(name);
            out.push((32 + seen.len() as u32, c.to_string()));
        }
    }
    out
}

/// A PDF of one page whose content, packed with Flate, unpacks to `unpacked`
/// bytes: of a line drawn over and over, which reads as no text.
pub fn inflating_pdf(unpacked: usize) -> Vec<u8> {
    use std::io::Write;
    let line = b"0 0 m 1 1 l S\n";
    let mut packer = flate2::write::ZlibEncoder::new(Vec::new(), flate2::Compression::best());
    let mut left = unpacked;
    while left > 0 {
        let n = left.min(line.len());
        packer.write_all(&line[..n]).expect("packed in memory");
        left -= n;
    }
    let packed = packer.finish().expect("packed in memory");
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let content = doc.add_object(Stream::new(dictionary! { "Filter" => "FlateDecode" }, packed));
    let page = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "Contents" => content,
        "MediaBox" => vec![0.into(), 0.into(), 400.into(), 360.into()],
    });
    doc.objects.insert(
        pages_id,
        Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => vec![page.into()], "Count" => 1 }),
    );
    let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
    doc.trailer.set("Root", catalog);
    let mut out = Vec::new();
    doc.save_to(&mut out).expect("the fixture is written");
    out
}

/// The PDF: one page with the four lines, in the font described above.
pub fn porson_pdf() -> Vec<u8> {
    let mut codes: Vec<(&'static str, char)> = Vec::new();
    let code_of = |codes: &mut Vec<(&'static str, char)>, c: char| -> u8 {
        let name = glyph_of(c);
        if name == "space" {
            return 32;
        }
        let at = match codes.iter().position(|(n, _)| *n == name) {
            Some(at) => at,
            None => {
                codes.push((name, c));
                codes.len() - 1
            }
        };
        33 + at as u8
    };
    let mut strings: Vec<Vec<u8>> = Vec::new();
    for line in LINES {
        strings.push(line.chars().map(|c| code_of(&mut codes, c)).collect());
    }

    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let mut differences: Vec<Object> = vec![33.into()];
    differences.extend(codes.iter().map(|(name, _)| Object::Name(name.as_bytes().to_vec())));
    let mut cmap = String::from(
        "/CIDInit /ProcSet findresource begin 12 dict begin begincmap\n\
         /CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n\
         /CMapName /Adobe-Identity-UCS def /CMapType 2 def\n\
         1 begincodespacerange <00> <FF> endcodespacerange\n",
    );
    cmap.push_str(&format!("{} beginbfchar\n<20> <0020>\n", codes.len() + 1));
    for (at, (name, c)) in codes.iter().enumerate() {
        let units: String = mapped(name, *c).encode_utf16().map(|u| format!("{u:04X}")).collect();
        cmap.push_str(&format!("<{:02X}> <{units}>\n", 33 + at));
    }
    cmap.push_str("endbfchar\nendcmap CMapName currentdict /CMap defineresource pop end end\n");
    let to_unicode = doc.add_object(Stream::new(dictionary! {}, cmap.into_bytes()));
    let font = doc.add_object(dictionary! {
        "Type" => "Font",
        "Subtype" => "Type1",
        "BaseFont" => FONT,
        "Encoding" => dictionary! { "Type" => "Encoding", "Differences" => differences },
        "ToUnicode" => to_unicode,
        "FirstChar" => 32,
        "LastChar" => 255,
        "Widths" => vec![Object::Integer(520); 224],
    });
    let resources = doc.add_object(dictionary! { "Font" => dictionary! { "F1" => font } });
    let mut operations = vec![
        Operation::new("BT", vec![]),
        Operation::new("Tf", vec!["F1".into(), 12.into()]),
        Operation::new("Td", vec![40.into(), 300.into()]),
    ];
    for (i, string) in strings.into_iter().enumerate() {
        if i > 0 {
            operations.push(Operation::new("Td", vec![0.into(), (-18).into()]));
        }
        operations.push(Operation::new("Tj", vec![Object::String(string, StringFormat::Hexadecimal)]));
    }
    operations.push(Operation::new("ET", vec![]));
    let content = Content { operations }.encode().expect("the content is written");
    let content = doc.add_object(Stream::new(dictionary! {}, content));
    let page = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "Contents" => content,
        "Resources" => resources,
        "MediaBox" => vec![0.into(), 0.into(), 400.into(), 360.into()],
    });
    doc.objects.insert(
        pages_id,
        Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => vec![page.into()], "Count" => 1 }),
    );
    let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
    doc.trailer.set("Root", catalog);
    let mut out = Vec::new();
    doc.save_to(&mut out).expect("the fixture is written");
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Writes `e2e/fixtures/porson.pdf`, for the end-to-end scripts. Run by hand when the fixture changes.
    #[test]
    #[ignore]
    fn write_porson_fixture() {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../e2e/fixtures/porson.pdf");
        std::fs::write(path, porson_pdf()).unwrap();
    }

    #[test]
    fn the_pdf_is_wrong_as_the_book_is() {
        let pdf = porson_pdf();
        let text = pdf_text::extract_text_from_mem(&pdf).unwrap();
        assert!(!text.contains('ἥ') && !text.contains('σ'), "the PDF's own map is wrong: {text}");
        assert!(text.contains('θ') && text.contains('%') || text.contains('>'), "{text}");
    }
}
