//! The entities of HTML and XML, as services and Zotero send them in
//! titles, names and notes: `&amp;`, `&#8211;`, `&#x2013;`, and those with
//! names that are met there.

/// What an entity with a name stands for. A soft hyphen stands for nothing.
fn named(name: &str) -> Option<&'static str> {
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

/// What the entity that follows an ampersand stands for, and how much of
/// what follows the ampersand it takes up, its semicolon with it: for
/// `amp;…`, "&" and 4. None where no entity begins there.
pub fn at(after: &str) -> Option<(String, usize)> {
    let end = after.char_indices().take(11).find(|&(_, c)| c == ';')?.0;
    let name = &after[..end];
    let text = match name.strip_prefix('#') {
        Some(number) => {
            let code = match number.strip_prefix(['x', 'X']) {
                Some(hex) => u32::from_str_radix(hex, 16).ok()?,
                None => number.parse::<u32>().ok()?,
            };
            char::from_u32(code).filter(|c| !c.is_control() || c.is_whitespace())?.to_string()
        }
        None => named(name)?.to_owned(),
    };
    Some((text, end + 1))
}

/// A text with its entities resolved. An ampersand that begins none stays.
pub fn resolve(text: &str) -> String {
    if !text.contains('&') {
        return text.to_owned();
    }
    let mut out = String::with_capacity(text.len());
    let mut rest = text;
    while let Some(i) = rest.find('&') {
        out.push_str(&rest[..i]);
        let tail = &rest[i + 1..];
        match at(tail) {
            Some((said, len)) => {
                out.push_str(&said);
                rest = &tail[len..];
            }
            None => {
                out.push('&');
                rest = tail;
            }
        }
    }
    out.push_str(rest);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn entities_are_resolved() {
        assert_eq!(resolve("Tom &amp; Jerry"), "Tom & Jerry");
        assert_eq!(resolve("1998&#8211;2001, &#x2013;"), "1998–2001, –");
        assert_eq!(resolve("Fr&aelig;nkel&shy;s"), "Frænkels");
        assert_eq!(resolve("R&D; &unknown; &"), "R&D; &unknown; &");
        assert_eq!(resolve("a&#0;b &#10;"), "a&#0;b \n");
        assert_eq!(at("amp; more"), Some(("&".into(), 4)));
        assert_eq!(at("verylongname;"), None);
    }
}
