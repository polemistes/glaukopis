//! What a note in Markdown says of itself in the lines before its text,
//! between two lines of `---` at the very top, as Obsidian, Joplin and
//! others write them: its title, its tags, when it was made and where it
//! was clipped from. A small reader of these shapes, not of all that YAML
//! can say: what it does not know it passes over.

/// What the lines before a text say.
#[derive(Debug, Default, PartialEq)]
pub(super) struct Front {
    pub(super) title: Option<String>,
    pub(super) tags: Vec<String>,
    /// As it is written: made ISO where it is read.
    pub(super) created: Option<String>,
    pub(super) source: Option<String>,
}

/// The lines before the text, read, and the text after them. A text
/// without them is all text.
pub(super) fn split(text: &str) -> (Front, &str) {
    let mut lines = text.split_inclusive('\n');
    let Some(first) = lines.next() else { return (Front::default(), text) };
    if first.trim_end() != "---" {
        return (Front::default(), text);
    }
    let mut at = first.len();
    let mut said: Vec<&str> = Vec::new();
    for line in lines {
        at += line.len();
        let bare = line.trim_end();
        if bare == "---" || bare == "..." {
            return (read(&said), &text[at..]);
        }
        said.push(line.trim_end_matches(['\n', '\r']));
    }
    // Never closed: no lines before the text, but text that begins so.
    (Front::default(), text)
}

/// What a value says, without the quotes around it.
fn unquoted(value: &str) -> String {
    let value = value.trim();
    for quote in ['"', '\''] {
        if value.len() >= 2 && value.starts_with(quote) && value.ends_with(quote) {
            return value[1..value.len() - 1].to_owned();
        }
    }
    value.to_owned()
}

/// The items of a list in brackets: `[a, "b c", d]`.
fn bracketed(value: &str) -> Vec<String> {
    let inner = value.trim().trim_start_matches('[').trim_end_matches(']');
    let mut items = Vec::new();
    let mut current = String::new();
    let mut quote: Option<char> = None;
    for c in inner.chars() {
        match (c, quote) {
            ('"' | '\'', None) => quote = Some(c),
            (c, Some(q)) if c == q => quote = None,
            (',', None) => items.push(std::mem::take(&mut current)),
            _ => current.push(c),
        }
    }
    items.push(current);
    items.into_iter().map(|i| i.trim().to_owned()).filter(|i| !i.is_empty()).collect()
}

/// A tag as the lines before a text give it: without the sign before it.
fn tag_of(said: &str) -> Option<String> {
    let tag = unquoted(said);
    let tag = tag.trim().trim_start_matches('#').trim();
    (!tag.is_empty()).then(|| tag.to_owned())
}

fn read(lines: &[&str]) -> Front {
    let mut front = Front::default();
    let mut i = 0;
    while i < lines.len() {
        let line = lines[i];
        i += 1;
        // Only what stands at the left edge is named; what is set in belongs to what is above it.
        if line.starts_with([' ', '\t', '#', '-']) || line.trim().is_empty() {
            continue;
        }
        let Some((key, value)) = line.split_once(':') else { continue };
        let key = key.trim().to_ascii_lowercase();
        let value = value.trim();
        // The lines set in under it, which may be the items of a list.
        let mut under: Vec<&str> = Vec::new();
        while i < lines.len() && (lines[i].starts_with([' ', '\t', '-']) || lines[i].trim().is_empty()) {
            under.push(lines[i]);
            i += 1;
        }
        let said = || Some(unquoted(value)).filter(|v| !v.is_empty());
        match key.as_str() {
            "title" => front.title = said().or(front.title),
            "created" | "date" | "created_at" | "creation_date" => {
                if front.created.is_none() || key == "created" {
                    front.created = said().or(front.created.take());
                }
            }
            "source" | "source_url" | "url" => {
                if front.source.is_none() || key == "source" {
                    front.source = said().or(front.source.take());
                }
            }
            "tags" | "tag" | "keywords" => {
                let mut tags: Vec<String> = if value.starts_with('[') {
                    bracketed(value).iter().filter_map(|t| tag_of(t)).collect()
                } else if value.is_empty() {
                    under.iter().filter_map(|l| l.trim_start().strip_prefix('-')).filter_map(tag_of).collect()
                } else if value.contains(',') {
                    value.split(',').filter_map(tag_of).collect()
                } else if value.split_whitespace().all(|w| w.starts_with('#')) {
                    value.split_whitespace().filter_map(tag_of).collect()
                } else {
                    tag_of(value).into_iter().collect()
                };
                for tag in tags.drain(..) {
                    if !front.tags.iter().any(|t| t.eq_ignore_ascii_case(&tag)) {
                        front.tags.push(tag);
                    }
                }
            }
            _ => {}
        }
    }
    front
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_lines_before_the_text_are_read_and_taken_off() {
        let text = "---\ntitle: \"A note: with a colon\"\ntags:\n  - one\n  - \"two words\"\n  - '#three'\ncreated: 2021-03-04 12:13:14Z\nsource: https://example.org/page\naliases: [x, y]\nnested:\n  key: value\n---\n# Heading\nText.\n";
        let (front, body) = split(text);
        assert_eq!(front.title.as_deref(), Some("A note: with a colon"));
        assert_eq!(front.tags, ["one", "two words", "three"]);
        assert_eq!(front.created.as_deref(), Some("2021-03-04 12:13:14Z"));
        assert_eq!(front.source.as_deref(), Some("https://example.org/page"));
        assert_eq!(body, "# Heading\nText.\n");
    }

    #[test]
    fn tags_are_read_in_brackets_by_commas_and_by_their_signs() {
        assert_eq!(split("---\ntags: [a, \"b, c\", d]\n---\n").0.tags, ["a", "b, c", "d"]);
        assert_eq!(split("---\ntags: a, b ,c\n---\n").0.tags, ["a", "b", "c"]);
        assert_eq!(split("---\ntags: #a #b\n---\n").0.tags, ["a", "b"]);
        assert_eq!(split("---\ntag: single\n---\n").0.tags, ["single"]);
        assert_eq!(
            split("---\ndate: 2020-01-02\nurl: https://a.example\n---\n").0.created.as_deref(),
            Some("2020-01-02")
        );
    }

    #[test]
    fn a_text_without_them_is_all_text() {
        let (front, body) = split("Text.\n---\nmore\n");
        assert_eq!((front, body), (Front::default(), "Text.\n---\nmore\n"));
        // Never closed: all text.
        let (front, body) = split("---\ntitle: x\nno end\n");
        assert_eq!((front, body), (Front::default(), "---\ntitle: x\nno end\n"));
        // Windows' line ends.
        let (front, body) = split("---\r\ntitle: x\r\n---\r\nText.");
        assert_eq!((front.title.as_deref(), body), (Some("x"), "Text."));
    }
}
