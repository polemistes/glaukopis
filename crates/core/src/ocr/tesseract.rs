//! Tesseract, run on the picture of a page.

use std::path::Path;
use std::sync::atomic::AtomicBool;

use crate::error::{Error, IoContext, Result};
use crate::export::tools::{self, Tool};
use crate::tr;

/// What Tesseract made of a picture.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Read {
    /// The words with where each stands, as TSV: see `text::tsv_paragraphs`.
    pub tsv: Option<String>,
    /// A page of text alone, unseen, as large as the picture: to be laid
    /// over the page it was drawn from (`searchable.rs`).
    pub layer: Option<Vec<u8>>,
}

/// Whether a name is one Tesseract may be given for a language: `eng`,
/// `chi_sim`, `script/Latin`, and nothing that is not a name.
pub fn is_language(name: &str) -> bool {
    !name.is_empty()
        && !name.starts_with(['/', '.', '-'])
        && !name.contains("..")
        && name.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '_' | '/' | '-'))
}

/// How Tesseract is to take the page apart, by the name the interface gives
/// it: nothing for `""`, which leaves it to Tesseract's judgement (its
/// `--psm 3`); `column` for one column of text of differing sizes (4);
/// `block` for one uniform block of text (6); `sparse` for text scattered
/// about, in no order (11). A name that is none of these is as `""`.
pub fn psm_of(layout: &str) -> Option<u32> {
    match layout.trim() {
        "column" => Some(4),
        "block" => Some(6),
        "sparse" => Some(11),
        _ => None,
    }
}

/// With what Tesseract reads a picture: its languages, the likeliest first,
/// and how it takes the page apart (`psm_of`).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct With {
    pub languages: Vec<String>,
    pub psm: Option<u32>,
}

/// Reads a picture with the languages given, the likeliest first. `dpi` is
/// the resolution it was drawn at, nought where that is not known, and
/// Tesseract then judges it by the size of the letters. What is made is
/// written beside the picture, and read from there.
pub fn read(
    tesseract: &Tool,
    picture: &Path,
    dpi: u32,
    with: &With,
    text: bool,
    layer: bool,
    stop: &AtomicBool,
) -> Result<Read> {
    let base = picture.with_extension("");
    let mut c = tools::tesseract(tesseract);
    c.arg(picture).arg(&base);
    if dpi > 0 {
        c.arg("--dpi").arg(dpi.to_string());
    }
    c.arg("-l").arg(with.languages.join("+"));
    if let Some(psm) = with.psm {
        c.arg("--psm").arg(psm.to_string());
    }
    if layer {
        c.args(["-c", "textonly_pdf=1"]);
    }
    if text {
        c.arg("tsv");
    }
    if layer {
        c.arg("pdf");
    }
    // Several run at once, each on one core, as OCRmyPDF has them do; they
    // would otherwise fight for all of them.
    c.env("OMP_THREAD_LIMIT", "1");
    tools::run_command_until(c, "Tesseract", None, stop)?;

    let made = |ending: &str| base.with_extension(ending);
    let tsv = if text {
        let path = made("tsv");
        Some(std::fs::read_to_string(&path).context(|| tr!("io-reading", path = &path))?)
    } else {
        None
    };
    let layer = if layer {
        let path = made("pdf");
        let bytes = std::fs::read(&path).context(|| tr!("io-reading", path = &path))?;
        if !bytes.starts_with(b"%PDF") {
            return Err(Error::Program {
                program: "Tesseract".into(),
                message: format!("{} is no PDF", path.display()),
            });
        }
        Some(bytes)
    } else {
        None
    };
    Ok(Read { tsv, layer })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn names_of_languages() {
        for name in ["eng", "nor", "chi_sim", "script/Latin", "deu_latf"] {
            assert!(is_language(name), "{name}");
        }
        for name in ["", "../eng", "/etc/eng", "-l", "eng+nor", "en g", "a/../b"] {
            assert!(!is_language(name), "{name}");
        }
    }

    #[test]
    fn how_the_page_is_taken_apart() {
        assert_eq!(psm_of(""), None);
        assert_eq!(psm_of("column"), Some(4));
        assert_eq!(psm_of("block"), Some(6));
        assert_eq!(psm_of("sparse"), Some(11));
        assert_eq!(psm_of(" block "), Some(6));
        assert_eq!(psm_of("whatever"), None);
        assert_eq!(psm_of("3"), None);
    }
}
