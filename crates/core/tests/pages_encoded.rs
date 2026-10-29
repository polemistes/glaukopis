//! How a page drawn to be shown is best written as a PNG: the time to
//! encode it and its size, for the ways the `image` crate offers, on pages
//! of the fixtures, of a book set by Typst and of a scan with the grain of
//! paper. What `colour_png` (`src/ocr/drawing.rs`) writes is chosen from
//! these numbers: the time saved against the bytes added, at about a
//! millisecond a megabyte across the bridge. Run by hand:
//! `cargo test -p glaukopis-core --release --test pages_encoded -- --ignored --nocapture`.

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant};

use glaukopis_core::export::tools;
use glaukopis_core::ocr::drawing::{self, Pages};
use image::ImageEncoder;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};

/// A way of writing a PNG: as `colour_png` writes it, as `PngEncoder::new`
/// makes the encoder, or with the packing and the filter given.
#[derive(Clone, Copy)]
enum Way {
    Chosen,
    New,
    With(CompressionType, FilterType),
}

/// The ways tried, by name.
const WAYS: [(&str, Way); 10] = [
    ("colour_png, as chosen", Way::Chosen),
    ("new (the crate's default)", Way::New),
    ("Fast, Adaptive", Way::With(CompressionType::Fast, FilterType::Adaptive)),
    ("Fast, Up", Way::With(CompressionType::Fast, FilterType::Up)),
    ("Fast, Sub", Way::With(CompressionType::Fast, FilterType::Sub)),
    ("Fast, Paeth", Way::With(CompressionType::Fast, FilterType::Paeth)),
    ("Fast, none", Way::With(CompressionType::Fast, FilterType::NoFilter)),
    ("Level 1, Adaptive", Way::With(CompressionType::Level(1), FilterType::Adaptive)),
    ("Default (balanced), Adaptive", Way::With(CompressionType::Default, FilterType::Adaptive)),
    ("Uncompressed", Way::With(CompressionType::Uncompressed, FilterType::NoFilter)),
];

fn encode(picture: &image::RgbImage, way: Way) -> Vec<u8> {
    let mut out = Vec::new();
    let encoder = match way {
        Way::Chosen => return drawing::colour_png(picture).unwrap(),
        Way::New => PngEncoder::new(&mut out),
        Way::With(compression, filter) => PngEncoder::new_with_quality(&mut out, compression, filter),
    };
    encoder.write_image(picture.as_raw(), picture.width(), picture.height(), image::ExtendedColorType::Rgb8).unwrap();
    out
}

fn median(mut times: Vec<Duration>) -> Duration {
    times.sort();
    times[times.len() / 2]
}

/// A book of four hundred pages of text, as the other measures make it.
fn book(dir: &Path, typst: &Path) -> PathBuf {
    let paragraph = "The wrath of Achilles is the subject of the Iliad, and Homer sings of the quarrel \
                     between the king and the hero, and of all that came of it. "
        .repeat(6);
    let mut text = String::from("#set page(paper: \"a5\", numbering: \"i\")\n#set text(size: 10pt)\n");
    for chapter in 1..=40 {
        text.push_str(&format!("= Chapter {chapter}\n"));
        for _ in 0..30 {
            text.push_str(&paragraph);
            text.push_str("\n\n");
        }
    }
    std::fs::write(dir.join("book.typ"), text).unwrap();
    let pdf = dir.join("book.pdf");
    let ran = std::process::Command::new(typst).arg("compile").arg(dir.join("book.typ")).arg(&pdf).status();
    assert!(ran.unwrap().success());
    pdf
}

/// A scan of a page: a picture of text at 300 dots to the inch, on paper
/// with a grain, as a JPEG, the whole of an A5 page.
fn scan(dir: &Path, typst: &Path) -> PathBuf {
    let page = "#set page(paper: \"a5\", margin: 18mm)\n#set text(size: 11pt)\n".to_owned()
        + &"The wrath of Achilles is the subject of the Iliad, and Homer sings of the quarrel. ".repeat(25);
    std::fs::write(dir.join("page.typ"), page).unwrap();
    let clean = dir.join("page.png");
    let ran = std::process::Command::new(typst)
        .args(["compile", "--ppi", "300"])
        .arg(dir.join("page.typ"))
        .arg(&clean)
        .status();
    assert!(ran.unwrap().success());
    let mut picture = image::open(&clean).unwrap().into_rgb8();
    // The grain of paper, and its colour: a hash of the place, as noise.
    for (x, y, pixel) in picture.enumerate_pixels_mut() {
        let grain = ((x.wrapping_mul(2_654_435_761) ^ y.wrapping_mul(40_503)).wrapping_mul(2_246_822_519) >> 27) as u8;
        let [r, g, b] = pixel.0;
        pixel.0 = [r.saturating_sub(grain + 8), g.saturating_sub(grain + 14), b.saturating_sub(grain + 30)];
    }
    let jpeg = dir.join("scan.jpg");
    picture.save(&jpeg).unwrap();
    std::fs::write(
        dir.join("scan.typ"),
        "#set page(paper: \"a5\", margin: 0pt)\n#image(\"scan.jpg\", width: 100%, height: 100%)\n",
    )
    .unwrap();
    let pdf = dir.join("scan.pdf");
    let ran = std::process::Command::new(typst).arg("compile").arg(dir.join("scan.typ")).arg(&pdf).status();
    assert!(ran.unwrap().success());
    pdf
}

#[test]
#[ignore]
fn measure_the_encoding_of_pages() {
    let dir = tempfile::tempdir().unwrap();
    let fixtures = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../e2e/fixtures");
    let mut files: Vec<(PathBuf, usize)> = vec![(fixtures.join("porson.pdf"), 0), (fixtures.join("structure.pdf"), 0)];
    if let Some(typst) = tools::find("typst", None, &[]) {
        files.push((book(dir.path(), &typst), 100));
        files.push((scan(dir.path(), &typst), 0));
    } else {
        eprintln!("The program Typst is not installed: the book and the scan are passed over");
    }
    let width = 1800;
    for (file, index) in &files {
        let bytes = Arc::new(std::fs::read(file).unwrap());
        let Pages::Hayro(pdf) = Pages::open(file, bytes, None).unwrap() else { panic!("hayro opens it") };
        let mut draws = Vec::new();
        let mut picture = None;
        for _ in 0..5 {
            let started = Instant::now();
            picture = Some(drawing::draw_wide_with_hayro(&pdf, *index, width).unwrap());
            draws.push(started.elapsed());
        }
        let picture = picture.unwrap();
        println!(
            "{}, page {}, {}×{}: drawn by hayro in {:?}",
            file.file_name().unwrap().to_string_lossy(),
            index + 1,
            picture.width(),
            picture.height(),
            median(draws)
        );
        for (name, way) in WAYS {
            let mut times = Vec::new();
            let mut size = 0;
            for _ in 0..5 {
                let started = Instant::now();
                size = encode(&picture, way).len();
                times.push(started.elapsed());
            }
            let time = median(times);
            let megabytes = size as f64 / f64::from(1 << 20);
            // The cost in all: the encoding, and the bytes at a millisecond a megabyte.
            let cost = time.as_secs_f64() * 1000.0 + megabytes;
            println!("  {name:<30} {:>8.1} ms {megabytes:>7.3} MB   cost {cost:>7.1}", time.as_secs_f64() * 1000.0);
        }
    }
}
