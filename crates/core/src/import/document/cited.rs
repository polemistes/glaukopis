//! Citations that a file has and that are not citations of the application
//! yet: what is known of them, as the mark `found` holds it.
//!
//! Such a citation stands in the text as the text it was in the file, under
//! the mark (see `crate::found`). It is made by a tag that names a work the
//! library does not have, or by a program that keeps references, which says
//! in the file what is cited (`made.rs` reads that).

use serde_json::Value;

use crate::document::CiteMode;
use crate::found::{By, Found, FoundItem};

const ALPHABET: &[u8; 62] = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/// An id of twelve letters and digits, as the ids of figures are: see
/// `newId` in `src/lib/util/id.ts`.
pub(super) fn fresh() -> String {
    let random = uuid::Uuid::new_v4();
    // Two of its bytes say what kind of id it is, and are the same every time.
    let bytes = random.as_bytes();
    bytes[..6].iter().chain(&bytes[9..15]).map(|b| char::from(ALPHABET[usize::from(b % 62)])).collect()
}

/// What the mark holds, of a citation that gets its id here.
pub(super) fn mark(by: By, items: Vec<FoundItem>, mode: CiteMode) -> Value {
    let found = Found { id: fresh(), by, items, mode, left: false };
    // What is written is text, numbers and lists of them: it cannot fail.
    serde_json::to_value(found).unwrap_or(Value::Null)
}

/// The id of the citation that a mark is of, and whether a program made it.
/// Nothing, of what the writer has said is to be left as text.
pub(super) fn counted(mark: &Value) -> Option<(&str, bool)> {
    if mark.get("left").and_then(Value::as_bool).unwrap_or(false) {
        return None;
    }
    let id = mark.get("id")?.as_str()?;
    let made = matches!(mark.get("by").and_then(Value::as_str), Some("zotero" | "mendeley"));
    Some((id, made))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ids_are_twelve_letters_and_digits_and_not_the_same() {
        let one = fresh();
        assert_eq!(one.len(), 12);
        assert!(one.chars().all(|c| c.is_ascii_alphanumeric()), "{one}");
        assert_ne!(one, fresh());
    }

    #[test]
    fn what_is_left_as_text_is_not_counted() {
        let made = mark(By::Zotero, Vec::new(), CiteMode::Normal);
        let (id, by_a_program) = counted(&made).unwrap();
        assert_eq!((id.len(), by_a_program), (12, true));
        assert!(!counted(&mark(By::Key, Vec::new(), CiteMode::Normal)).unwrap().1);
        let mut left = made.clone();
        left["left"] = Value::Bool(true);
        assert!(counted(&left).is_none());
    }
}
