//! What is pasted, read from the clipboard through GTK on Linux, where the
//! page would otherwise have WebKitGTK read it (record 0048). WebKitGTK
//! 2.54 asks the clipboard which formats it holds and does not look at the
//! answer when there is none: an empty clipboard, or a program that holds it
//! and does not answer, ends the whole application. GTK's own answer, read
//! here, says so instead.

use serde::Serialize;
use tauri::AppHandle;

/// What the clipboard holds, as much of it as a paste uses.
#[derive(Serialize, Default, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Pasted {
    pub text: Option<String>,
    pub html: Option<String>,
    /// A picture copied as one, and the files of pictures copied in a file manager.
    pub pictures: Vec<PastedPicture>,
    /// The other files copied in a file manager, by where they are: what a
    /// note written in a window of its own takes in (record 0109).
    pub files: Vec<String>,
    /// The address it was copied from, where the program that holds the
    /// clipboard says one, on Linux. Firefox says the site, not the page
    /// (`http://host`; tried with Firefox 159). Only an address of the web,
    /// `http` or `https`.
    pub url: Option<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PastedPicture {
    /// The file's name; empty for a picture copied as one.
    pub name: String,
    pub mime: String,
    /// The bytes, in base64, of a picture copied as one; empty for a file.
    pub data: String,
    /// Where the file is, of one copied in a file manager, which the page
    /// takes in from there (`picture_add_file`): its bytes do not travel to
    /// the page and back, three times their size in base64.
    pub path: Option<String>,
}

/// The clipboard, or with `primary` the text last selected anywhere, which
/// the middle button pastes. Nothing at all where it cannot be read.
#[tauri::command(async)]
pub fn clipboard_read(app: AppHandle, primary: bool) -> Pasted {
    #[cfg(target_os = "linux")]
    {
        linux::read(&app, primary)
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (app, primary);
        Pasted::default()
    }
}

#[cfg(target_os = "linux")]
mod linux {
    use std::cell::RefCell;
    use std::path::PathBuf;
    use std::rc::Rc;
    use std::sync::mpsc;
    use std::time::Duration;

    use base64::Engine;
    use base64::engine::general_purpose::STANDARD as B64;
    use gtk::gdk;
    use tauri::AppHandle;

    use super::{Pasted, PastedPicture};

    /// How long a program that holds the clipboard is waited for.
    const WAIT: Duration = Duration::from_secs(10);

    /// Where Firefox says the address a selection was copied from: the site, not the page.
    const PAGE: &str = "text/x-moz-url-priv";

    pub fn read(app: &AppHandle, primary: bool) -> Pasted {
        let (tx, rx) = mpsc::channel();
        if app.run_on_main_thread(move || ask(primary, tx)).is_err() {
            return Pasted::default();
        }
        let Ok((mut pasted, files)) = rx.recv_timeout(WAIT) else {
            tracing::warn!(primary, "the clipboard did not answer in time; nothing is pasted");
            return Pasted::default();
        };
        for path in files {
            if let Some(picture) = picture_file(&path) {
                pasted.pictures.push(picture);
            } else if path.is_file()
                && let Some(path) = path.to_str()
            {
                pasted.files.push(path.to_owned());
            }
        }
        pasted
    }

    /// What is still to be asked of the clipboard, one request after another.
    enum Step {
        Html,
        Page,
        Text,
        Image,
        Files,
    }

    struct Asking {
        steps: Vec<Step>,
        pasted: Pasted,
        files: Vec<PathBuf>,
        tx: mpsc::Sender<(Pasted, Vec<PathBuf>)>,
    }

    /// On the main thread: the formats first, then each that a paste uses,
    /// with GTK's requests, which wait for the clipboard without holding the
    /// window still.
    fn ask(primary: bool, tx: mpsc::Sender<(Pasted, Vec<PathBuf>)>) {
        let selection = if primary { gdk::SELECTION_PRIMARY } else { gdk::SELECTION_CLIPBOARD };
        let clipboard = gtk::Clipboard::get(&selection);
        clipboard.request_contents(&gdk::Atom::intern("TARGETS"), move |clipboard, data| {
            // None where the clipboard is empty or its holder did not answer.
            let Some(targets) = data.targets() else {
                let _ = tx.send((Pasted::default(), Vec::new()));
                return;
            };
            let mut steps = Vec::new();
            if targets.iter().any(|t| t.name() == "text/html") {
                steps.push(Step::Html);
            }
            if targets.iter().any(|t| t.name() == PAGE) {
                steps.push(Step::Page);
            }
            if data.targets_include_text() {
                steps.push(Step::Text);
            }
            if data.targets_include_image(false) {
                steps.push(Step::Image);
            }
            if data.targets_include_uri() {
                steps.push(Step::Files);
            }
            steps.reverse();
            next(clipboard, Rc::new(RefCell::new(Asking { steps, pasted: Pasted::default(), files: Vec::new(), tx })));
        });
    }

    fn next(clipboard: &gtk::Clipboard, asking: Rc<RefCell<Asking>>) {
        let step = asking.borrow_mut().steps.pop();
        let Some(step) = step else {
            let mut done = asking.borrow_mut();
            let gathered = (std::mem::take(&mut done.pasted), std::mem::take(&mut done.files));
            let _ = done.tx.send(gathered);
            return;
        };
        match step {
            Step::Html => clipboard.request_contents(&gdk::Atom::intern("text/html"), move |clipboard, data| {
                if data.length() > 0 {
                    asking.borrow_mut().pasted.html = Some(html_of(&data.data()));
                }
                next(clipboard, asking);
            }),
            Step::Page => clipboard.request_contents(&gdk::Atom::intern(PAGE), move |clipboard, data| {
                if data.length() > 0 {
                    asking.borrow_mut().pasted.url = url_of(&data.data());
                }
                next(clipboard, asking);
            }),
            Step::Text => clipboard.request_text(move |clipboard, text| {
                asking.borrow_mut().pasted.text = text.map(str::to_owned);
                next(clipboard, asking);
            }),
            Step::Image => clipboard.request_image(move |clipboard, pixbuf| {
                match pixbuf.map(|p| p.save_to_bufferv("png", &[])) {
                    Some(Ok(bytes)) => asking.borrow_mut().pasted.pictures.push(PastedPicture {
                        name: String::new(),
                        mime: "image/png".into(),
                        data: B64.encode(bytes),
                        path: None,
                    }),
                    Some(Err(error)) => tracing::warn!(%error, "a picture on the clipboard could not be read"),
                    None => {}
                }
                next(clipboard, asking);
            }),
            Step::Files => clipboard.request_uris(move |clipboard, uris| {
                let files = uris.iter().filter_map(|uri| gtk::glib::filename_from_uri(uri).ok().map(|(path, _)| path));
                asking.borrow_mut().files.extend(files);
                next(clipboard, asking);
            }),
        }
    }

    /// The address of a page as Firefox says it: in UTF-16, the least byte
    /// first, perhaps with a mark of the order of its bytes and a nought at
    /// its end; its first line, where it is an address of the web.
    pub(super) fn url_of(bytes: &[u8]) -> Option<String> {
        let units = |bytes: &[u8], little: bool| -> String {
            let units: Vec<u16> = bytes
                .as_chunks::<2>()
                .0
                .iter()
                .map(|&c| if little { u16::from_le_bytes(c) } else { u16::from_be_bytes(c) })
                .collect();
            String::from_utf16_lossy(&units)
        };
        let text = match bytes {
            [0xff, 0xfe, rest @ ..] => units(rest, true),
            [0xfe, 0xff, rest @ ..] => units(rest, false),
            // UTF-16 of an address has a nought after every letter; UTF-8 has none.
            [_, 0, ..] => units(bytes, true),
            _ => String::from_utf8_lossy(bytes).into_owned(),
        };
        let line = text.trim_matches(|c: char| c == '\0' || c.is_whitespace()).lines().next()?.trim();
        let web = line.starts_with("http://") || line.starts_with("https://");
        (web && !line.contains(char::is_whitespace)).then(|| line.to_owned())
    }

    /// HTML as programs put it on the clipboard: mostly UTF-8, from some in
    /// UTF-16 with a mark of the order of its bytes.
    pub(super) fn html_of(bytes: &[u8]) -> String {
        let utf16 = |bytes: &[u8], little: bool| {
            let units: Vec<u16> = bytes
                .as_chunks::<2>()
                .0
                .iter()
                .map(|&c| if little { u16::from_le_bytes(c) } else { u16::from_be_bytes(c) })
                .collect();
            String::from_utf16_lossy(&units)
        };
        let text = match bytes {
            [0xff, 0xfe, rest @ ..] => utf16(rest, true),
            [0xfe, 0xff, rest @ ..] => utf16(rest, false),
            [0xef, 0xbb, 0xbf, rest @ ..] => String::from_utf8_lossy(rest).into_owned(),
            _ => String::from_utf8_lossy(bytes).into_owned(),
        };
        text.trim_end_matches('\0').to_owned()
    }

    /// A file copied in a file manager, where it is a picture: by its path,
    /// from which the page takes it in.
    fn picture_file(path: &std::path::Path) -> Option<PastedPicture> {
        let extension = path.extension()?.to_str()?.to_ascii_lowercase();
        let mime = match extension.as_str() {
            "png" => "image/png",
            "jpg" | "jpeg" => "image/jpeg",
            "gif" => "image/gif",
            "webp" => "image/webp",
            "tif" | "tiff" => "image/tiff",
            "bmp" => "image/bmp",
            "svg" => "image/svg+xml",
            _ => return None,
        };
        if !std::fs::metadata(path).ok()?.is_file() {
            return None;
        }
        Some(PastedPicture {
            name: path.file_name()?.to_string_lossy().into_owned(),
            mime: mime.into(),
            data: String::new(),
            path: Some(path.to_str()?.to_owned()),
        })
    }
}

#[cfg(all(test, target_os = "linux"))]
mod tests {
    use super::linux::{html_of, url_of};

    #[test]
    fn the_page_copied_from_as_firefox_says_it() {
        let utf16 = |text: &str, mark: bool| {
            let mut out = if mark { vec![0xff, 0xfe] } else { Vec::new() };
            out.extend(text.encode_utf16().flat_map(u16::to_le_bytes));
            out
        };
        let page = "https://example.org/ἄνδρα?x=1";
        assert_eq!(url_of(&utf16(page, false)).as_deref(), Some(page));
        assert_eq!(url_of(&utf16(&format!("{page}\0"), true)).as_deref(), Some(page));
        assert_eq!(url_of(&utf16("http://example.org/a\nThe title", false)).as_deref(), Some("http://example.org/a"));
        assert_eq!(url_of(b"https://example.org/b").as_deref(), Some("https://example.org/b"));
        assert_eq!(url_of(&utf16("file:///home/someone/page.html", false)), None);
        assert_eq!(url_of(&utf16("about:blank", false)), None);
        assert_eq!(url_of(b""), None);
    }

    #[test]
    fn html_in_utf8_and_utf16() {
        assert_eq!(html_of("<b>ἄνδρα</b>".as_bytes()), "<b>ἄνδρα</b>");
        let mut le = vec![0xff, 0xfe];
        le.extend("<i>μοι</i>".encode_utf16().flat_map(u16::to_le_bytes));
        assert_eq!(html_of(&le), "<i>μοι</i>");
        let mut be = vec![0xfe, 0xff];
        be.extend("ἔννεπε".encode_utf16().flat_map(u16::to_be_bytes));
        assert_eq!(html_of(&be), "ἔννεπε");
        assert_eq!(html_of(b"<p>a</p>\0"), "<p>a</p>");
    }
}
