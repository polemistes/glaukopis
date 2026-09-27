//! Markup in what Zotero holds.
//!
//! Notes are HTML. Titles may hold a little of it: Zotero lets italics,
//! bold, superscript, subscript and small capitals be written as tags, and
//! words be marked whose capitals are to be kept. Abstracts are plain text,
//! but those fetched from publishers often arrive with tags in them.

/// A tag at a place in the text.
struct Tag {
    /// In lower case: `p`, `span`, `jats:p`. `!` for comments and declarations.
    name: String,
    closing: bool,
    /// What stands between the name and the closing bracket, in lower case.
    attributes: String,
    /// Where the text goes on.
    end: usize,
}

/// Reads the tag that begins at `at`, where a `<` stands. A `<` that begins
/// no tag ("a < b") gives none.
fn tag(chars: &[char], at: usize) -> Option<Tag> {
    let mut i = at + 1;
    if chars.get(i) == Some(&'!') || chars.get(i) == Some(&'?') {
        let comment = chars.get(i + 1) == Some(&'-') && chars.get(i + 2) == Some(&'-');
        let mut j = i + 1;
        while j < chars.len() {
            if chars[j] == '>' && (!comment || (j >= at + 6 && chars[j - 1] == '-' && chars[j - 2] == '-')) {
                return Some(Tag { name: "!".into(), closing: false, attributes: String::new(), end: j + 1 });
            }
            j += 1;
        }
        return None;
    }
    let closing = chars.get(i) == Some(&'/');
    if closing {
        i += 1;
    }
    if !chars.get(i).is_some_and(char::is_ascii_alphabetic) {
        return None;
    }
    let mut name = String::new();
    while let Some(&c) = chars.get(i) {
        if c.is_ascii_alphanumeric() || c == ':' || c == '-' {
            name.push(c.to_ascii_lowercase());
            i += 1;
        } else {
            break;
        }
    }
    if !chars.get(i).is_some_and(|&c| c.is_whitespace() || c == '/' || c == '>') {
        return None;
    }
    let mut attributes = String::new();
    let mut quote: Option<char> = None;
    while let Some(&c) = chars.get(i) {
        match (quote, c) {
            (None, '>') => return Some(Tag { name, closing, attributes: attributes.to_lowercase(), end: i + 1 }),
            (None, '"' | '\'') => quote = Some(c),
            (Some(q), c) if c == q => quote = None,
            _ => {}
        }
        attributes.push(c);
        i += 1;
    }
    None
}

fn named_entity(name: &str) -> Option<&'static str> {
    Some(match name {
        "amp" => "&",
        "lt" => "<",
        "gt" => ">",
        "quot" => "\"",
        "apos" => "'",
        "nbsp" => "\u{a0}",
        "shy" => "",
        "ndash" => "–",
        "mdash" => "—",
        "hellip" => "…",
        "lsquo" => "‘",
        "rsquo" => "’",
        "sbquo" => "‚",
        "ldquo" => "“",
        "rdquo" => "”",
        "bdquo" => "„",
        "laquo" => "«",
        "raquo" => "»",
        "lsaquo" => "‹",
        "rsaquo" => "›",
        "copy" => "©",
        "reg" => "®",
        "trade" => "™",
        "sect" => "§",
        "para" => "¶",
        "deg" => "°",
        "middot" => "·",
        "bull" => "•",
        "times" => "×",
        "minus" => "−",
        "euro" => "€",
        "pound" => "£",
        "dagger" => "†",
        "szlig" => "ß",
        "aelig" => "æ",
        "AElig" => "Æ",
        "oslash" => "ø",
        "Oslash" => "Ø",
        "aring" => "å",
        "Aring" => "Å",
        "auml" => "ä",
        "Auml" => "Ä",
        "ouml" => "ö",
        "Ouml" => "Ö",
        "uuml" => "ü",
        "Uuml" => "Ü",
        "eacute" => "é",
        "Eacute" => "É",
        "egrave" => "è",
        "agrave" => "à",
        "ccedil" => "ç",
        _ => return None,
    })
}

/// Reads the entity that begins at `at`, where a `&` stands: `&amp;`,
/// `&#8211;`, `&#x2013;`. An ampersand that begins none gives none.
fn entity(chars: &[char], at: usize) -> Option<(String, usize)> {
    let end = (at + 1..chars.len().min(at + 12)).find(|&i| chars[i] == ';')?;
    let name: String = chars[at + 1..end].iter().collect();
    let text = match name.strip_prefix('#') {
        Some(number) => {
            let code = match number.strip_prefix(['x', 'X']) {
                Some(hex) => u32::from_str_radix(hex, 16).ok()?,
                None => number.parse::<u32>().ok()?,
            };
            char::from_u32(code).filter(|c| !c.is_control() || c.is_whitespace())?.to_string()
        }
        None => named_entity(&name)?.to_owned(),
    };
    Some((text, end + 1))
}

/// Plain text being put together: runs of white space become one space, and
/// a new line is begun only where there is something on the line before.
#[derive(Default)]
struct Plain {
    out: String,
    space: bool,
    /// An item of a list has begun; its mark is written with its first word.
    item: bool,
}

impl Plain {
    fn push(&mut self, c: char) {
        if c.is_whitespace() && c != '\u{a0}' && c != '\u{202f}' {
            self.space = true;
            return;
        }
        if self.item {
            self.out.push_str("- ");
            self.item = false;
        } else if self.space && !self.out.is_empty() && !self.out.ends_with('\n') {
            self.out.push(' ');
        }
        self.space = false;
        self.out.push(c);
    }

    fn push_str(&mut self, text: &str) {
        for c in text.chars() {
            self.push(c);
        }
    }

    fn new_line(&mut self) {
        self.space = false;
        if !self.out.is_empty() && !self.out.ends_with('\n') {
            self.out.push('\n');
        }
    }

    fn finish(self) -> String {
        self.out.trim().to_owned()
    }
}

/// Tags that begin and end a line of their own.
fn is_block(name: &str) -> bool {
    matches!(
        name,
        "p" | "div"
            | "br"
            | "li"
            | "ul"
            | "ol"
            | "dl"
            | "dt"
            | "dd"
            | "h1"
            | "h2"
            | "h3"
            | "h4"
            | "h5"
            | "h6"
            | "blockquote"
            | "pre"
            | "table"
            | "tr"
            | "hr"
            | "section"
            | "article"
            | "header"
            | "footer"
            | "title"
            | "jats:p"
            | "jats:title"
            | "jats:sec"
    )
}

/// HTML as plain text: each paragraph, heading and list item on a line of
/// its own, without the markup.
pub(super) fn plain(html: &str) -> String {
    let chars: Vec<char> = html.chars().collect();
    let mut out = Plain::default();
    // Inside `script` or `style`, whose content is not text.
    let mut hidden: Option<String> = None;
    let mut preformatted = 0usize;
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if c == '<'
            && let Some(tag) = tag(&chars, i)
        {
            i = tag.end;
            if let Some(name) = &hidden {
                if tag.closing && tag.name == *name {
                    hidden = None;
                }
                continue;
            }
            match tag.name.as_str() {
                "script" | "style" if !tag.closing => hidden = Some(tag.name.clone()),
                "pre" if !tag.closing => preformatted += 1,
                "pre" => preformatted = preformatted.saturating_sub(1),
                // Cells of a table stand apart.
                "td" | "th" => out.push(' '),
                _ => {}
            }
            if is_block(&tag.name) {
                out.new_line();
            }
            if tag.name == "li" {
                out.item = !tag.closing;
            }
            continue;
        }
        i += 1;
        if hidden.is_some() {
            continue;
        }
        match c {
            '&' => match entity(&chars, i - 1) {
                Some((text, end)) => {
                    out.push_str(&text);
                    i = end;
                }
                None => out.push('&'),
            },
            '\n' if preformatted > 0 => out.new_line(),
            c => out.push(c),
        }
    }
    out.finish()
}

/// Whether plain text has HTML in it. A closing tag is what tells: "a < b"
/// and "<Homer>" have none.
pub(super) fn has_tags(text: &str) -> bool {
    let chars: Vec<char> = text.chars().collect();
    (0..chars.len()).any(|i| chars[i] == '<' && tag(&chars, i).is_some_and(|t| t.closing))
}

/// What a tag of Zotero's rich text opens with in BibLaTeX.
fn opening(tag: &Tag) -> Option<&'static str> {
    Some(match tag.name.as_str() {
        "i" | "em" => "\\emph{",
        "b" | "strong" => "\\textbf{",
        "sup" => "\\textsuperscript{",
        "sub" => "\\textsubscript{",
        "sc" => "\\textsc{",
        "span" if tag.attributes.contains("small-caps") => "\\textsc{",
        // Words whose capitals a style must not change.
        "span" if tag.attributes.contains("nocase") => "{",
        _ => return None,
    })
}

/// A title in the form the library holds it: Zotero's tags for italics and
/// the like become the commands of BibLaTeX. Tags Zotero does not know are
/// left standing, since they are then part of the title.
pub(super) fn rich_text(title: &str) -> String {
    if !title.contains(['<', '&']) {
        return title.to_owned();
    }
    let chars: Vec<char> = title.chars().collect();
    let mut out = String::with_capacity(title.len() + 16);
    // The names of the tags that are open, the innermost last.
    let mut open: Vec<String> = Vec::new();
    let mut i = 0;
    while i < chars.len() {
        match chars[i] {
            '<' => {
                if let Some(tag) = tag(&chars, i) {
                    if !tag.closing {
                        if let Some(command) = opening(&tag) {
                            out.push_str(command);
                            open.push(tag.name.clone());
                            i = tag.end;
                            continue;
                        }
                    } else if let Some(position) = open.iter().rposition(|name| *name == tag.name) {
                        // What was opened within it and never closed ends here as well.
                        for _ in position..open.len() {
                            out.push('}');
                        }
                        open.truncate(position);
                        i = tag.end;
                        continue;
                    }
                }
                out.push('<');
                i += 1;
            }
            '&' => match entity(&chars, i) {
                Some((text, end)) => {
                    out.push_str(&text);
                    i = end;
                }
                None => {
                    out.push('&');
                    i += 1;
                }
            },
            c => {
                out.push(c);
                i += 1;
            }
        }
    }
    for _ in open {
        out.push('}');
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn notes() {
        assert_eq!(
            plain(
                "<div class=\"zotero-note znv1\"><h1>On  the wrath</h1>\n<p>The <em>first</em> word &amp; the last.</p>\
                 <p>Second&nbsp;paragraph<br/>with a break.</p></div>"
            ),
            "On the wrath\nThe first word & the last.\nSecond\u{a0}paragraph\nwith a break."
        );
        assert_eq!(
            plain(
                "<div data-schema-version=\"8\"><ul><li>one</li><li><p>two</p></li></ul>\
                 <p>a &lt; b, 5 > 3 &#8211; &#x201c;so&#x201D;</p></div>"
            ),
            "- one\n- two\na < b, 5 > 3 – “so”"
        );
    }

    #[test]
    fn what_is_not_text_and_what_is_not_markup() {
        assert_eq!(
            plain("<p>a</p><style>p { color: red }</style><script>if (a < b) {}</script><!-- hidden --><p>b</p>"),
            "a\nb"
        );
        // In HTML a tag that is not known is a tag all the same.
        assert_eq!(plain("R&D; if a < b then <Homer> & co"), "R&D; if a < b then & co");
        assert_eq!(plain("<p title=\"a > b\">x</p>"), "x");
        assert_eq!(plain("<pre>one\n  two</pre>"), "one\ntwo");
        assert_eq!(plain("<table><tr><td>a</td><td>b</td></tr><tr><td>c</td></tr></table>"), "a b\nc");
        assert_eq!(plain("unfinished <b"), "unfinished <b");
        assert_eq!(plain("&#0;&#xD800;&bogus;"), "&#0;&#xD800;&bogus;");
        assert_eq!(plain(""), "");
    }

    #[test]
    fn abstracts_with_tags() {
        assert!(has_tags("<jats:p>An abstract.</jats:p>"));
        assert!(has_tags("One <i>word</i>."));
        assert!(!has_tags("a < b and c > d"));
        assert!(!has_tags("The <Homer> of the title"));
        assert_eq!(
            plain("<jats:title>Abstract</jats:title><jats:p>An <jats:italic>abstract</jats:italic>.</jats:p>"),
            "Abstract\nAn abstract."
        );
    }

    #[test]
    fn titles() {
        assert_eq!(rich_text("The <i>Iliad</i> and the <b>Odyssey</b>"), "The \\emph{Iliad} and the \\textbf{Odyssey}");
        assert_eq!(
            rich_text("H<sub>2</sub>O and E=mc<sup>2</sup>"),
            "H\\textsubscript{2}O and E=mc\\textsuperscript{2}"
        );
        assert_eq!(
            rich_text(
                "A <span style=\"font-variant:small-caps;\">nasa</span> report on <span class=\"nocase\">Mars</span>"
            ),
            "A \\textsc{nasa} report on {Mars}"
        );
        assert_eq!(rich_text("Dogs &amp; cats"), "Dogs & cats");
        // Never closed, closed twice, unknown.
        assert_eq!(rich_text("The <i>Iliad"), "The \\emph{Iliad}");
        assert_eq!(rich_text("The Iliad</i>"), "The Iliad</i>");
        assert_eq!(rich_text("a < b <Homer> <span>x</span>"), "a < b <Homer> <span>x</span>");
        assert_eq!(rich_text("<i>a <b>b</i> c"), "\\emph{a \\textbf{b}} c");
    }
}
