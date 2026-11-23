//! The helper Firefox starts for the plugin of the notebook (native
//! messaging): the application itself, in another role. Started with the
//! path of its manifest as its first argument (`firefox::MANIFEST_FILE`; the
//! plugin's id is the second), it is the helper and nothing else: it speaks
//! on its input and output, writes what it is handed into the notebook's
//! inbox (`inbox`), and ends when Firefox closes its input. No window, no
//! claim on the data folder, which it never makes; nothing is fetched.
//!
//! Each message is four bytes of length, in the byte order of the machine,
//! then that many bytes of UTF-8 JSON; each is answered with one small
//! message the same way:
//!
//! ```text
//! {"kind":"hello"}                               → {"ok":true,"version":"0.2.12"}
//! {"kind":"page"|"selection"|"image"|"region",
//!  "url","title","when","text","html","alt","name",
//!  "image":"<base64 of a PNG or a JPEG>"}        → {"ok":true}
//! what goes wrong                                → {"ok":false,"error":"<a word>"}
//! ```
//!
//! The words: `not-understood` (no JSON, or a kind not known, or `note`,
//! which is the window's of a note, or `shared`, which is what another app
//! hands over on a phone, neither ever the plugin's), `too-large`
//! (a message over 96 MB, which ends the helper, or a picture over 50 MB),
//! `not-a-picture`, `no-data-folder` (Glaukopis was never started for this
//! user), `not-written`. The plugin says them to the writer in its own words.

use std::ffi::OsString;
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};

use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use serde_json::{Value, json};

use super::firefox::MANIFEST_FILE;
use super::inbox::{Collected, Inbox, Kind, MAX_PICTURE};
use crate::error::{Error, Result};
use crate::paths::{self, Holds};

/// The longest message read: past it, what follows cannot be read past.
pub const MAX_MESSAGE: usize = 96 * 1024 * 1024;

/// What the helper answers to `hello`: the application's version.
const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Where the application is the helper: its first argument a path whose
/// file is the manifest. Then it speaks on its input and output, and gives
/// the code to end with; else `None`, and nothing is done.
pub fn serve(args: &[OsString]) -> Option<i32> {
    let first = args.get(1)?;
    if Path::new(first).file_name()? != MANIFEST_FILE {
        return None;
    }
    let inbox = data_root(&paths::settings_place())
        .map(|root| Inbox::in_data_folder(&root))
        .ok_or_else(|| Error::not_found(paths::default_root().display().to_string()));
    Some(host(io::stdin().lock(), io::stdout().lock(), inbox))
}

/// The data folder as the application finds it at its start
/// (`GLAUKOPIS_DATA_DIR`, else the folder the writer chose, else the usual
/// one), where it holds Glaukopis's data; none where it does not, as when
/// Glaukopis has never been started for this user. While a move is under
/// way, which the application finishes at its next start, the folder moved
/// from, while it is there: what is written there is moved with the rest.
pub fn data_root(place: &Path) -> Option<PathBuf> {
    root_in(place, paths::data_dir_from_environment().then(paths::default_root), paths::default_root)
}

/// The data folder: that of the environment where it names one, else as
/// the file of the location in `place` says, else the `usual` one.
fn root_in(place: &Path, environment: Option<PathBuf>, usual: impl FnOnce() -> PathBuf) -> Option<PathBuf> {
    let root = match environment {
        Some(root) => root,
        None => match paths::location(place).ok()? {
            Some(location) => match location.moving_from {
                Some(from) if from.is_dir() => from,
                _ => location.folder,
            },
            None => usual(),
        },
    };
    (paths::what_holds(&root) == Holds::Glaukopis).then_some(root)
}

/// Speaks with Firefox until the input ends (how Firefox ends it: then the
/// code is 0). Nothing but answers is ever written to `output`.
pub fn host(mut input: impl Read, mut output: impl Write, inbox: Result<Inbox>) -> i32 {
    loop {
        let mut length = [0u8; 4];
        match input.read_exact(&mut length) {
            Ok(()) => {}
            Err(e) if e.kind() == io::ErrorKind::UnexpectedEof => return 0,
            Err(_) => return 1,
        }
        let length = u32::from_ne_bytes(length) as usize;
        if length > MAX_MESSAGE {
            let _ = say(&mut output, &refused("too-large"));
            return 1;
        }
        let mut message = vec![0u8; length];
        match input.read_exact(&mut message) {
            Ok(()) => {}
            // Ended in the middle of a message: there is nothing to answer.
            Err(e) if e.kind() == io::ErrorKind::UnexpectedEof => return 0,
            Err(_) => return 1,
        }
        let answer = answer(&message, inbox.as_ref());
        drop(message);
        if say(&mut output, &answer).is_err() {
            return 1;
        }
    }
}

/// Writes one message: its length, then itself.
fn say(output: &mut impl Write, message: &Value) -> io::Result<()> {
    let bytes = serde_json::to_vec(message)?;
    output.write_all(&(bytes.len() as u32).to_ne_bytes())?;
    output.write_all(&bytes)?;
    output.flush()
}

fn refused(word: &str) -> Value {
    json!({ "ok": false, "error": word })
}

/// The answer to one message.
fn answer(message: &[u8], inbox: std::result::Result<&Inbox, &Error>) -> Value {
    let Ok(mut message) = serde_json::from_slice::<Value>(message) else { return refused("not-understood") };
    if message.get("kind").and_then(Value::as_str) == Some("hello") {
        return json!({ "ok": true, "version": VERSION });
    }
    let image = message.as_object_mut().and_then(|fields| fields.remove("image"));
    let Ok(mut collected) = serde_json::from_value::<Collected>(message) else { return refused("not-understood") };
    // A note written in a window of its own, and a thing another app handed
    // over on a phone, are no kinds the plugin hands over, and the text and
    // the files of a note are none of the plugin's.
    if matches!(collected.kind, Kind::Note | Kind::Shared) {
        return refused("not-understood");
    }
    collected.doc = Value::Null;
    collected.files.clear();
    let wants_picture = matches!(collected.kind, Kind::Image | Kind::Region);
    let picture = match image {
        Some(Value::String(encoded)) => match picture(&encoded) {
            Ok(picture) => Some(picture),
            Err(word) => return refused(word),
        },
        None | Some(Value::Null) if !wants_picture => None,
        _ => return refused("not-a-picture"),
    };
    let inbox = match inbox {
        Ok(inbox) => inbox,
        Err(_) => return refused("no-data-folder"),
    };
    match inbox.put(&collected, picture.as_deref()) {
        Ok(_) => json!({ "ok": true }),
        Err(error) => {
            eprintln!("glaukopis: what the plugin handed over was not written: {error}");
            refused("not-written")
        }
    }
}

/// A picture from its base64 (a `data:` address is taken as well): a PNG
/// or a JPEG, known by its first bytes, of at most `MAX_PICTURE` bytes.
fn picture(encoded: &str) -> std::result::Result<Vec<u8>, &'static str> {
    let encoded = match encoded.strip_prefix("data:") {
        Some(address) => address.split_once(',').map_or("", |(_, data)| data),
        None => encoded,
    };
    let encoded = encoded.trim();
    if encoded.len() / 4 * 3 > MAX_PICTURE + 3 {
        return Err("too-large");
    }
    let bytes = B64.decode(encoded).map_err(|_| "not-a-picture")?;
    if bytes.len() > MAX_PICTURE {
        return Err("too-large");
    }
    let png = bytes.starts_with(b"\x89PNG\r\n\x1a\n");
    let jpeg = bytes.starts_with(&[0xFF, 0xD8, 0xFF]);
    if !(png || jpeg) {
        return Err("not-a-picture");
    }
    Ok(bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A PNG of one pixel, made here.
    fn png() -> Vec<u8> {
        let mut bytes = std::io::Cursor::new(Vec::new());
        image::RgbImage::from_pixel(1, 1, image::Rgb([200, 30, 30]))
            .write_to(&mut bytes, image::ImageFormat::Png)
            .unwrap();
        bytes.into_inner()
    }

    fn framed(messages: &[Value]) -> Vec<u8> {
        let mut out = Vec::new();
        for message in messages {
            let bytes = serde_json::to_vec(message).unwrap();
            out.extend_from_slice(&(bytes.len() as u32).to_ne_bytes());
            out.extend_from_slice(&bytes);
        }
        out
    }

    fn answers(mut output: &[u8]) -> Vec<Value> {
        let mut out = Vec::new();
        while !output.is_empty() {
            let length = u32::from_ne_bytes(output[..4].try_into().unwrap()) as usize;
            out.push(serde_json::from_slice(&output[4..4 + length]).unwrap());
            output = &output[4 + length..];
        }
        out
    }

    struct Helper {
        _tmp: tempfile::TempDir,
        dir: PathBuf,
    }

    impl Helper {
        fn new() -> Self {
            let tmp = tempfile::tempdir().unwrap();
            let dir = tmp.path().join("data").join("notebook").join("inbox");
            Helper { _tmp: tmp, dir }
        }

        fn inbox(&self) -> Inbox {
            Inbox::at(&self.dir)
        }

        /// Runs the helper over `input`: its code, and its answers.
        fn run(&self, input: &[u8]) -> (i32, Vec<Value>) {
            let mut output = Vec::new();
            let code = host(input, &mut output, Ok(self.inbox()));
            (code, answers(&output))
        }
    }

    fn page() -> Value {
        json!({
            "kind": "page",
            "url": "https://example.org/an-article",
            "title": "An article",
            "when": "2026-11-15T12:00:00.000Z",
            "text": "What it says.",
            "html": "<p>What it says.</p>",
        })
    }

    #[test]
    fn hello_is_answered_with_the_version() {
        let helper = Helper::new();
        let (code, answers) = helper.run(&framed(&[json!({"kind": "hello"})]));
        assert_eq!(code, 0, "the input ended: the helper ends quietly");
        assert_eq!(answers, vec![json!({"ok": true, "version": env!("CARGO_PKG_VERSION")})]);
        assert!(helper.inbox().ids().is_empty());
    }

    #[test]
    fn a_page_is_written_into_the_inbox() {
        let helper = Helper::new();
        let (code, answers) = helper.run(&framed(&[page()]));
        assert_eq!((code, answers), (0, vec![json!({"ok": true})]));
        let inbox = helper.inbox();
        let ids = inbox.ids();
        assert_eq!(ids.len(), 1);
        let (collected, picture) = inbox.read(&ids[0]).unwrap();
        assert_eq!(collected.kind, Kind::Page);
        assert_eq!(collected.url, "https://example.org/an-article");
        assert_eq!(collected.title, "An article");
        assert_eq!(collected.when, "2026-11-15T12:00:00.000Z");
        assert_eq!(collected.text, "What it says.");
        assert_eq!(collected.html, "<p>What it says.</p>");
        assert_eq!(picture, None);
    }

    #[test]
    fn the_text_and_the_files_of_a_note_are_none_of_the_plugins() {
        let helper = Helper::new();
        let mut message = page();
        message["doc"] = json!({"type": "doc", "content": []});
        message["files"] = json!([{"hash": "a".repeat(64), "name": "not here.pdf"}]);
        let (code, answers) = helper.run(&framed(&[message]));
        assert_eq!((code, answers), (0, vec![json!({"ok": true})]));
        let inbox = helper.inbox();
        let (collected, _) = inbox.read(&inbox.ids()[0]).unwrap();
        assert!(collected.doc.is_null() && collected.files.is_empty());
    }

    #[test]
    fn a_region_with_a_picture_is_written_with_it() {
        let helper = Helper::new();
        let png = png();
        let message =
            json!({"kind": "region", "url": "https://example.org/", "title": "A map", "image": B64.encode(&png)});
        let (_, answers) = helper.run(&framed(&[message]));
        assert_eq!(answers, vec![json!({"ok": true})]);
        let inbox = helper.inbox();
        let (collected, picture) = inbox.read(&inbox.ids()[0]).unwrap();
        assert_eq!(collected.kind, Kind::Region);
        assert_eq!(collected.title, "A map");
        assert_eq!(picture, Some(png));
    }

    #[test]
    fn two_messages_are_answered_one_after_the_other_and_kept_in_order() {
        let helper = Helper::new();
        let mut second = page();
        second["kind"] = json!("selection");
        second["text"] = json!("A part.");
        let (code, answers) = helper.run(&framed(&[json!({"kind": "hello"}), page(), second]));
        assert_eq!(code, 0);
        assert_eq!(answers.len(), 3);
        assert_eq!(answers[1], json!({"ok": true}));
        assert_eq!(answers[2], json!({"ok": true}));
        let inbox = helper.inbox();
        let kinds: Vec<Kind> = inbox.ids().iter().map(|id| inbox.read(id).unwrap().0.kind).collect();
        assert_eq!(kinds, vec![Kind::Page, Kind::Selection]);
    }

    #[test]
    fn what_is_not_understood_is_said_and_the_helper_goes_on() {
        let helper = Helper::new();
        let mut input = Vec::new();
        input.extend_from_slice(&4u32.to_ne_bytes());
        input.extend_from_slice(b"oops");
        input.extend(framed(&[json!({"kind": "video", "url": "x"}), json!({"url": "no kind"}), json!([1, 2])]));
        input.extend(framed(&[json!({"kind": "page", "title": 3})]));
        // A note of the window of its own is not the plugin's to hand over, nor a thing another app shared.
        input.extend(framed(&[json!({"kind": "note", "text": "Words."})]));
        input.extend(framed(&[json!({"kind": "shared", "text": "Words.", "title": "A subject"})]));
        input.extend(framed(&[json!({"kind": "hello"})]));
        let (code, answers) = helper.run(&input);
        assert_eq!(code, 0);
        let refused = json!({"ok": false, "error": "not-understood"});
        assert_eq!(answers[..7], vec![refused; 7][..]);
        assert_eq!(answers[7]["ok"], json!(true), "it went on");
        assert!(helper.inbox().ids().is_empty());
    }

    #[test]
    fn a_picture_that_is_none_is_refused() {
        let helper = Helper::new();
        let gif = B64.encode(b"GIF89a\x01\x00\x01\x00");
        let (_, answers) = helper.run(&framed(&[
            json!({"kind": "image", "image": gif}),
            json!({"kind": "image", "image": "@@ not base64 @@"}),
            json!({"kind": "image"}),
            json!({"kind": "region", "image": 12}),
        ]));
        assert_eq!(answers, vec![json!({"ok": false, "error": "not-a-picture"}); 4]);
        assert!(helper.inbox().ids().is_empty());
    }

    #[test]
    fn a_picture_too_large_is_refused_and_the_helper_goes_on() {
        let helper = Helper::new();
        let mut large = b"\xFF\xD8\xFF".to_vec();
        large.resize(MAX_PICTURE + 1, 0);
        let (code, answers) =
            helper.run(&framed(&[json!({"kind": "image", "image": B64.encode(&large)}), json!({"kind": "hello"})]));
        assert_eq!(code, 0);
        assert_eq!(answers[0], json!({"ok": false, "error": "too-large"}));
        assert_eq!(answers[1]["ok"], json!(true));
    }

    #[test]
    fn a_length_too_large_is_refused_and_ends_it() {
        let helper = Helper::new();
        let mut input = ((MAX_MESSAGE + 1) as u32).to_ne_bytes().to_vec();
        input.extend(framed(&[json!({"kind": "hello"})]));
        let (code, answers) = helper.run(&input);
        assert_eq!(code, 1);
        assert_eq!(answers, vec![json!({"ok": false, "error": "too-large"})], "nothing after it is read");
    }

    #[test]
    fn input_ending_in_the_middle_of_a_message_ends_it_and_nothing_is_written() {
        let helper = Helper::new();
        let mut input = framed(&[page()]);
        input.truncate(input.len() - 5);
        assert_eq!(helper.run(&input), (0, vec![]));
        assert_eq!(helper.run(&input[..2]), (0, vec![]), "in the middle of the length");
        assert_eq!(helper.run(&[]), (0, vec![]));
        assert!(helper.inbox().ids().is_empty());
        assert!(!helper.dir.exists());
    }

    #[test]
    fn without_a_data_folder_a_thing_is_refused_and_hello_answered() {
        let mut output = Vec::new();
        let none = Err(Error::not_found("data"));
        let code = host(&framed(&[json!({"kind": "hello"}), page()])[..], &mut output, none);
        assert_eq!(code, 0);
        let answers = answers(&output);
        assert_eq!(answers[0]["ok"], json!(true));
        assert_eq!(answers[1], json!({"ok": false, "error": "no-data-folder"}));
    }

    #[test]
    fn what_cannot_be_written_is_said() {
        let tmp = tempfile::tempdir().unwrap();
        let blocked = tmp.path().join("a file");
        std::fs::write(&blocked, "in the way").unwrap();
        let mut output = Vec::new();
        let code = host(&framed(&[page()])[..], &mut output, Ok(Inbox::at(blocked.join("inbox"))));
        assert_eq!(code, 0);
        assert_eq!(answers(&output), vec![json!({"ok": false, "error": "not-written"})]);
    }

    #[test]
    fn the_role_is_taken_only_for_the_manifest() {
        let args = |list: &[&str]| list.iter().map(OsString::from).collect::<Vec<_>>();
        assert_eq!(serve(&args(&["glaukopis"])), None);
        assert_eq!(serve(&args(&["glaukopis", "--glaukopis-isolated", "text", "a", "b"])), None);
        assert_eq!(serve(&args(&["glaukopis", "/tmp/org.glaukopis.notebook.json.bak"])), None);
        assert_eq!(serve(&args(&["glaukopis", "/tmp/org.glaukopis.notebook"])), None);
        assert_eq!(serve(&args(&["glaukopis", "notebook@glaukopis"])), None);
        assert_eq!(serve(&args(&["glaukopis", "/tmp/"])), None);
    }

    #[test]
    fn the_data_folder_is_found_as_the_application_finds_it_and_never_made() {
        let tmp = tempfile::tempdir().unwrap();
        let place = tmp.path().join("settings");
        let usual = tmp.path().join("usual");
        let chosen = tmp.path().join("chosen");
        let usual_now = || usual.clone();
        // Never started: none, and nothing is made.
        assert_eq!(root_in(&place, None, usual_now), None);
        assert!(!usual.exists());
        // Started: the usual folder.
        paths::DataDir::open(&usual).unwrap();
        assert_eq!(root_in(&place, None, usual_now), Some(usual.clone()));
        // A folder chosen, not there (its disk unplugged): none.
        let location = paths::Location { folder: chosen.clone(), moving_from: None };
        paths::set_location(&place, &location).unwrap();
        assert_eq!(root_in(&place, None, usual_now), None);
        paths::DataDir::open(&chosen).unwrap();
        assert_eq!(root_in(&place, None, usual_now), Some(chosen.clone()));
        // A move under way: the folder moved from, while it is there.
        let location = paths::Location { folder: tmp.path().join("new"), moving_from: Some(chosen.clone()) };
        paths::set_location(&place, &location).unwrap();
        assert_eq!(root_in(&place, None, usual_now), Some(chosen.clone()));
        // The environment wins; a folder of other things is none.
        assert_eq!(root_in(&place, Some(usual.clone()), usual_now), Some(usual.clone()));
        let other = tmp.path().join("other");
        std::fs::create_dir_all(&other).unwrap();
        std::fs::write(other.join("something"), "else").unwrap();
        assert_eq!(root_in(&place, Some(other), usual_now), None);
    }

    #[test]
    fn the_inbox_of_a_data_folder_is_where_the_application_looks() {
        let tmp = tempfile::tempdir().unwrap();
        let data = paths::DataDir::open(tmp.path().join("data")).unwrap();
        assert_eq!(Inbox::in_data_folder(data.root()).dir(), Inbox::new(&data).dir());
        assert_eq!(paths::what_holds(data.root()), Holds::Glaukopis);
    }
}
