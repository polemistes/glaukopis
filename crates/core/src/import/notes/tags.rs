//! The tags written in the text of a note: `#word`, as Obsidian reads them
//! (letters, digits, `_`, `-` and `/`, not digits alone, not inside a word,
//! a link, an address or code), and Bear's `#several words#`. They stay in
//! the text as they stand; these are the tags of the note besides.

/// The tags in a text in Markdown, each once, in the order they stand.
pub(super) fn tags_in(text: &str) -> Vec<String> {
    let mut tags: Vec<String> = Vec::new();
    let mut fence: Option<&str> = None;
    for line in text.lines() {
        let bare = line.trim_start();
        // Code set apart by fences is no text.
        if let Some(open) = fence {
            if bare.starts_with(open) {
                fence = None;
            }
            continue;
        }
        if bare.starts_with("```") {
            fence = Some("```");
            continue;
        }
        if bare.starts_with("~~~") {
            fence = Some("~~~");
            continue;
        }
        for tag in in_line(&without_code_and_links(line)) {
            if !tags.iter().any(|t| t.to_lowercase() == tag.to_lowercase()) {
                tags.push(tag);
            }
        }
    }
    tags
}

/// A line with its code, the addresses of its links and the addresses
/// written out made spaces: no tag stands in any of them.
fn without_code_and_links(line: &str) -> String {
    let chars: Vec<char> = line.chars().collect();
    let mut out = String::with_capacity(line.len());
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        // Code: as many backticks close it as opened it.
        if c == '`' {
            let run = chars[i..].iter().take_while(|&&c| c == '`').count();
            let close = (i + run..chars.len()).find(|&j| {
                chars[j..].iter().take_while(|&&c| c == '`').count() == run
                    && (j == 0 || chars[j - 1] != '`')
                    && chars.get(j + run) != Some(&'`')
            });
            if let Some(close) = close {
                out.push(' ');
                i = close + run;
                continue;
            }
        }
        // The address of a link: `](…)`.
        if c == '('
            && i > 0
            && chars[i - 1] == ']'
            && let Some(close) = chars[i..].iter().position(|&c| c == ')')
        {
            out.push(' ');
            i += close + 1;
            continue;
        }
        // An address between angles.
        if c == '<'
            && let Some(close) = chars[i..].iter().position(|&c| c == '>')
            && chars[i..i + close].iter().collect::<String>().contains(':')
        {
            out.push(' ');
            i += close + 1;
            continue;
        }
        out.push(c);
        i += 1;
    }
    // An address written out, to the next space.
    out.split(' ')
        .map(|w| if w.contains("://") || w.starts_with("www.") { "" } else { w })
        .collect::<Vec<_>>()
        .join(" ")
}

fn is_tag_char(c: char) -> bool {
    c.is_alphanumeric() || matches!(c, '_' | '-' | '/')
}

/// The tags in a line made bare of code and addresses.
fn in_line(line: &str) -> Vec<String> {
    let chars: Vec<char> = line.chars().collect();
    let mut tags = Vec::new();
    let mut i = 0;
    while i < chars.len() {
        let begins = chars[i] == '#' && (i == 0 || chars[i - 1].is_whitespace() || matches!(chars[i - 1], '(' | '['));
        let next = chars.get(i + 1).copied();
        if !begins || next.is_none_or(|c| c.is_whitespace() || c == '#') {
            i += 1;
            continue;
        }
        // Bear's tag of several words, closed by a sign of its own.
        if let Some(close) = chars[i + 1..].iter().position(|&c| c == '#').map(|p| i + 1 + p) {
            let words: String = chars[i + 1..close].iter().collect();
            let after = chars.get(close + 1).copied();
            if words.contains(' ')
                && !chars[close - 1].is_whitespace()
                && after.is_none_or(|c| c.is_whitespace() || c.is_ascii_punctuation())
                && words.chars().all(|c| is_tag_char(c) || c == ' ')
            {
                tags.push(words.trim().to_owned());
                i = close + 1;
                continue;
            }
        }
        let end = (i + 1..chars.len()).find(|&j| !is_tag_char(chars[j])).unwrap_or(chars.len());
        let word: String = chars[i + 1..end].iter().collect();
        let word = word.trim_end_matches(['/', '-']);
        if !word.is_empty() && !word.chars().all(|c| c.is_ascii_digit()) {
            tags.push(word.to_owned());
        }
        // Bear closes a tag of one word as well, where it is followed by more.
        i = if chars.get(end) == Some(&'#') { end + 1 } else { end };
    }
    tags
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tags_are_read_as_obsidian_and_bear_read_them() {
        let text = "#start of a line, and #tag/sub and #with-dash_and_9.\n\
                    Not in a#word, not #123, not `#code` nor\n\
                    ```\n#fenced\n```\n\
                    a [link](https://example.org/#anchor) or https://example.org/#frag or <https://x.org/#y>.\n\
                    # A heading is no tag\n\
                    Bear's #several words# and #one#, and #Start again.\n\
                    Æ: #ærlig.";
        assert_eq!(tags_in(text), ["start", "tag/sub", "with-dash_and_9", "several words", "one", "ærlig"]);
    }

    #[test]
    fn a_heading_and_signs_alone_are_no_tags() {
        assert!(tags_in("## Heading\n# \n#\n a # b\n\\#escaped &#39;").is_empty());
        assert_eq!(tags_in("(#inbrackets) [#too]"), ["inbrackets", "too"]);
    }
}
