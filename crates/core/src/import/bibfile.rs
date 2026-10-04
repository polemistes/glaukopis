//! Importing `.bib` files, as written by hand or by JabRef, Zotero, Mendeley,
//! BibDesk, EndNote and others.

use std::path::{Path, PathBuf};

use crate::bib;
use crate::error::{IoContext, Result};
use crate::found::zotero_key;
use crate::library::entry::{Draft, FIELD_ZOTERO, zotero_keys};
use crate::tr;

use super::Candidate;

/// Fields that reference managers add for their own purposes.
fn is_foreign_bookkeeping(name: &str) -> bool {
    name.starts_with("bdsk-")
        || name.starts_with("__")
        || matches!(
            name,
            "owner"
                | "timestamp"
                | "creationdate"
                | "modificationdate"
                | "date-added"
                | "date-modified"
                | "mendeley-groups"
                | "mendeley-tags"
                | "citeulike-article-id"
                | "priority"
                | "readstatus"
                | "ranking"
                | "qualityassured"
                | "relevance"
                | "printed"
                | "groups"
                | "jabref-meta"
                | "zotero-key"
                | "uri"
                | "local-url"
                | "rating"
                | "read"
        )
}

/// Reads bytes as UTF-8, or as Windows-1252 when they are not valid UTF-8,
/// which is how older files were written.
pub fn decode_bytes(bytes: &[u8]) -> String {
    match std::str::from_utf8(bytes) {
        Ok(s) => s.to_owned(),
        Err(_) => bytes.iter().map(|&b| windows_1252(b)).collect(),
    }
}

fn windows_1252(b: u8) -> char {
    const HIGH: [char; 32] = [
        '€', '\u{81}', '‚', 'ƒ', '„', '…', '†', '‡', 'ˆ', '‰', 'Š', '‹', 'Œ', '\u{8d}', 'Ž', '\u{8f}', '\u{90}', '‘',
        '’', '“', '”', '•', '–', '—', '˜', '™', 'š', '›', 'œ', '\u{9d}', 'ž', 'Ÿ',
    ];
    match b {
        0x80..=0x9f => HIGH[(b - 0x80) as usize],
        _ => b as char,
    }
}

pub fn read_file(path: &Path) -> Result<(Vec<Candidate>, Vec<String>)> {
    let bytes = std::fs::read(path).context(|| tr!("io-reading", path = path))?;
    let text = decode_bytes(&bytes);
    Ok(read_text(&text, path.parent()))
}

/// Reads BibLaTeX source. Paths of attached files are resolved against `base`.
pub fn read_text(text: &str, base: Option<&Path>) -> (Vec<Candidate>, Vec<String>) {
    let parsed = bib::parse(text);
    let mut warnings: Vec<String> = parsed
        .warnings
        .iter()
        .map(|w| tr!("core-library-line-sentence", line = w.line, message = &w.message))
        .collect();
    let mut out = Vec::new();

    for raw in parsed.entries() {
        let mut draft = Draft::from_raw(raw);
        let mut notes = Vec::new();

        let groups = draft.fields.get("groups").cloned();
        // What the entry is in Zotero, where the file says it: by it a
        // citation that Zotero made finds the entry.
        let mut keys: Vec<String> = draft.fields.get("zotero-key").map(|v| zotero_keys(v)).unwrap_or_default();
        for name in ["uri", "url"] {
            if let Some(key) = draft.fields.get(name).and_then(|v| zotero_key(v))
                && !keys.contains(&key)
            {
                keys.push(key);
            }
        }
        draft.fields.retain(|name, _| !is_foreign_bookkeeping(name));
        if !keys.is_empty() {
            draft.fields.insert(FIELD_ZOTERO.to_owned(), keys.join(" "));
        }

        let mut files = Vec::new();
        if let Some(value) = draft.fields.remove("file") {
            for named in parse_file_field(&value) {
                match resolve(&named, base) {
                    Some(p) => files.push(p.display().to_string()),
                    None => notes.push(tr!("core-import-file-not-found", name = &named)),
                }
            }
        }

        let collections = groups
            .map(|g| g.split(',').map(|name| vec![name.trim().to_owned()]).filter(|path| !path[0].is_empty()).collect())
            .unwrap_or_default();

        if draft.fields.is_empty() && draft.names.is_empty() {
            warnings.push(tr!("core-import-empty-entry", line = raw.line, key = &raw.key));
            continue;
        }

        out.push(Candidate {
            origin: if raw.key.is_empty() {
                tr!("core-import-origin-line", line = raw.line)
            } else {
                tr!("core-import-origin-key-line", key = &raw.key, line = raw.line)
            },
            draft,
            files,
            collections,
            notes,
        });
    }
    (out, warnings)
}

/// The paths named in a `file` field, in any of the forms in use:
/// `path`, `:path:PDF`, `Description:path:application/pdf`, several separated
/// by semicolons, with `\:`, `\;` and `\\` as escapes.
pub fn parse_file_field(value: &str) -> Vec<String> {
    let mut out = Vec::new();
    for part in split_unescaped(value, ';') {
        let pieces = split_unescaped(&part, ':');
        let path = match pieces.len() {
            0 => continue,
            1 => pieces[0].clone(),
            // `C:\path` on Windows, or `description:path`.
            2 => {
                if pieces[0].len() == 1 && pieces[0].chars().all(|c| c.is_ascii_alphabetic()) {
                    format!("{}:{}", pieces[0], pieces[1])
                } else {
                    pieces[1].clone()
                }
            }
            _ => {
                // description : path : type. A drive letter adds a piece.
                if pieces.len() >= 4 && pieces[1].len() == 1 && pieces[1].chars().all(|c| c.is_ascii_alphabetic()) {
                    format!("{}:{}", pieces[1], pieces[2])
                } else {
                    pieces[1].clone()
                }
            }
        };
        let path = path.trim().to_owned();
        if !path.is_empty() {
            out.push(path);
        }
    }
    out
}

fn split_unescaped(value: &str, sep: char) -> Vec<String> {
    let mut out = Vec::new();
    let mut current = String::new();
    let mut chars = value.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\\' {
            match chars.peek() {
                Some(&n) if n == ':' || n == ';' || n == '\\' => {
                    // Keep the escape of the other separator for the next split.
                    if n != sep && n != '\\' {
                        current.push('\\');
                    }
                    current.push(n);
                    chars.next();
                }
                _ => current.push(c),
            }
        } else if c == sep {
            out.push(std::mem::take(&mut current));
        } else {
            current.push(c);
        }
    }
    out.push(current);
    out
}

fn resolve(named: &str, base: Option<&Path>) -> Option<PathBuf> {
    let named = named.strip_prefix("file://").unwrap_or(named);
    let direct = PathBuf::from(named);
    let mut tries: Vec<PathBuf> = Vec::new();
    if direct.is_absolute() {
        tries.push(direct.clone());
    }
    if let Some(base) = base {
        tries.push(base.join(&direct));
    }
    // Mendeley writes absolute paths without the leading slash.
    #[cfg(unix)]
    tries.push(Path::new("/").join(&direct));
    if let Some(home) = std::env::var_os("HOME")
        && let Some(rest) = named.strip_prefix("~/")
    {
        tries.push(PathBuf::from(home).join(rest));
    }
    tries.into_iter().find(|p| p.is_file())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn file_fields() {
        assert_eq!(parse_file_field("paper.pdf"), vec!["paper.pdf"]);
        assert_eq!(parse_file_field(":papers/nagy.pdf:PDF"), vec!["papers/nagy.pdf"]);
        assert_eq!(
            parse_file_field("Full Text:files/12/a.pdf:application/pdf;Snapshot:files/13/b.html:text/html"),
            vec!["files/12/a.pdf", "files/13/b.html"]
        );
        assert_eq!(parse_file_field(r":C\:\\Users\\me\\a.pdf:PDF"), vec![r"C:\Users\me\a.pdf"]);
        assert_eq!(parse_file_field(r"a\;b.pdf"), vec!["a;b.pdf"]);
        assert_eq!(parse_file_field(":home/me/x.pdf:pdf"), vec!["home/me/x.pdf"]);
        assert!(parse_file_field("").is_empty());
    }

    #[test]
    fn old_encodings() {
        assert_eq!(decode_bytes("Gödel".as_bytes()), "Gödel");
        assert_eq!(decode_bytes(&[b'G', 0xf6, b'd', b'e', b'l', b' ', 0x96, b' ', 0x93, b'x', 0x94]), "Gödel – “x”");
    }

    #[test]
    fn a_file_from_a_reference_manager() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(tmp.path().join("files/12")).unwrap();
        std::fs::write(tmp.path().join("files/12/nagy.pdf"), b"%PDF").unwrap();
        let bib = tmp.path().join("export.bib");
        std::fs::write(
            &bib,
            r#"@comment{jabref-meta: databaseType:biblatex;}
@book{nagy1979,
  author = {Nagy, Gregory},
  title = {The Best of the {Achaeans}},
  year = {1979},
  file = {Full Text:files/12/nagy.pdf:application/pdf;:gone.pdf:PDF},
  groups = {Homer, Epic poetry},
  owner = {me},
  timestamp = {2019-01-01},
  bdsk-file-1 = {YnBsaXN0},
  zotero-key = {ABCD2345},
  uri = {http://zotero.org/users/123/items/WXYZ6789},
}
@book{empty,}
@article{broken, title = }
"#,
        )
        .unwrap();
        let (candidates, warnings) = read_file(&bib).unwrap();
        assert_eq!(candidates.len(), 1);
        let c = &candidates[0];
        assert_eq!(c.files.len(), 1);
        assert!(c.files[0].ends_with("files/12/nagy.pdf"));
        assert_eq!(c.notes, vec!["The file “gone.pdf” was not found."]);
        assert_eq!(c.collections, vec![vec!["Homer".to_owned()], vec!["Epic poetry".to_owned()]]);
        assert_eq!(c.draft.get("date"), Some("1979"));
        assert!(c.draft.get("owner").is_none() && c.draft.get("bdsk-file-1").is_none());
        assert_eq!(c.draft.zotero(), vec!["ABCD2345", "WXYZ6789"]);
        assert!(c.draft.get("uri").is_none());
        assert_eq!(c.origin, "nagy1979, line 2");
        assert_eq!(warnings.len(), 2, "{warnings:?}");
    }
}
