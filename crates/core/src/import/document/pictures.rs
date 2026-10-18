//! The pictures of a document: what it calls them, where they are, what
//! they hold, and how wide a figure stands where the file does not say.

use super::*;

pub(super) fn name_of(named: &str) -> String {
    let last = named.rsplit(['/', '\\']).next().unwrap_or(named);
    let last = last.split(['?', '#']).next().unwrap_or(last);
    let name = unescape(last);
    if name.trim().is_empty() || named.starts_with("data:") { tr!("core-pictures-unnamed") } else { name }
}

pub(super) fn kind_of_name(named: &str) -> Option<String> {
    let name = name_of(named);
    let (_, ending) = name.rsplit_once('.')?;
    (!ending.is_empty() && ending.len() <= 5 && ending.chars().all(|c| c.is_ascii_alphanumeric()))
        .then(|| ending.to_ascii_uppercase())
}

/// `%20` and its like, as addresses have them.
fn unescape(text: &str) -> String {
    let bytes = text.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%'
            && i + 2 < bytes.len()
            && let Some(byte) =
                std::str::from_utf8(&bytes[i + 1..i + 3]).ok().and_then(|h| u8::from_str_radix(h, 16).ok())
        {
            out.push(byte);
            i += 3;
            continue;
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8(out).unwrap_or_else(|_| text.to_owned())
}

/// What a picture holds, by what the document calls it.
pub(super) fn picture_bytes(
    named: &str,
    beside: &Path,
    media: &Path,
    held: bool,
) -> std::result::Result<Vec<u8>, String> {
    let lower = named.to_ascii_lowercase();
    if let Some(rest) = named.strip_prefix("data:") {
        let (kind, content) = rest.split_once(',').ok_or_else(|| tr!("core-import-document-picture-unreadable"))?;
        return if kind.ends_with(";base64") {
            let clean: String = content.chars().filter(|c| !c.is_whitespace()).collect();
            base64::engine::general_purpose::STANDARD
                .decode(clean)
                .map_err(|_| tr!("core-import-document-picture-unreadable"))
        } else {
            Ok(unescape(content).into_bytes())
        };
    }
    if lower.starts_with("http://") || lower.starts_with("https://") || lower.starts_with("//") {
        return Err(tr!("core-import-document-picture-network"));
    }
    let plain = named.strip_prefix("file://").unwrap_or(named);
    let plain = unescape(plain.split(['?', '#']).next().unwrap_or(plain));
    let path = PathBuf::from(&plain);
    // A document of one's own names its pictures, and is let take only
    // those in its own folder and below: one received from someone else
    // may name any picture on this computer, which would then go into the
    // project, and to those it is shared with.
    if !held {
        return match includes::Folder::new(beside).place(&beside.join(&path)) {
            includes::Place::Within(found) => read_picture(&found),
            includes::Place::Outside => Err(tr!("core-import-document-picture-outside-folder")),
            includes::Place::Missing => Err(tr!("core-import-document-picture-not-found")),
        };
    }
    let candidates: Vec<PathBuf> = if path.is_absolute() {
        vec![path]
    } else {
        vec![media.join(&path), media.parent().unwrap_or(media).join(&path)]
    };
    let found = candidates.into_iter().find(|c| c.is_file());
    let Some(found) = found else {
        return Err(tr!("core-import-document-picture-not-taken-out"));
    };
    // A file that holds its pictures has them within it, and Pandoc took them
    // out to where the work is done. One that names a picture elsewhere on
    // this computer, as a Word file may link one, would bring that into the
    // project, and to those it is shared with.
    let work = media.parent().unwrap_or(media);
    let within = match (found.canonicalize(), work.canonicalize()) {
        (Ok(found), Ok(work)) => found.starts_with(work),
        _ => false,
    };
    if !within {
        return Err(tr!("core-import-document-picture-outside"));
    }
    read_picture(&found)
}

fn read_picture(found: &Path) -> std::result::Result<Vec<u8>, String> {
    match fs::metadata(found) {
        Ok(m) if m.len() > crate::pictures::MAX_BYTES => return Err(tr!("core-import-document-picture-too-large")),
        _ => {}
    }
    fs::read(found).map_err(|_| tr!("core-import-document-picture-file-unreadable"))
}

/// How wide a figure is when the file does not say: as suits what the
/// picture holds. As `widthFor` in `src/lib/editor/commands.ts`.
pub(super) fn width_for(picture: &Picture) -> u8 {
    match picture.width {
        None | Some(0) => {
            if picture.extension == "svg" {
                60
            } else {
                100
            }
        }
        Some(width) => {
            let share = (f64::from(width) / 9.5 / 5.0).round() * 5.0;
            share.clamp(25.0, 100.0) as u8
        }
    }
}
