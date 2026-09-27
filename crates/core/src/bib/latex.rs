//! Between the three forms of a field's value: raw, text and plain.
//! See the module documentation of `bib`.

use unicode_normalization::UnicodeNormalization;

/// The combining character for a LaTeX accent command.
fn combining(accent: char) -> Option<char> {
    Some(match accent {
        '`' => '\u{300}',
        '\'' => '\u{301}',
        '^' => '\u{302}',
        '~' => '\u{303}',
        '=' => '\u{304}',
        'u' => '\u{306}',
        '.' => '\u{307}',
        '"' => '\u{308}',
        'r' => '\u{30a}',
        'H' => '\u{30b}',
        'v' => '\u{30c}',
        'd' => '\u{323}',
        'c' => '\u{327}',
        'k' => '\u{328}',
        'b' => '\u{331}',
        _ => return None,
    })
}

/// Commands that stand for a character.
fn symbol(name: &str) -> Option<&'static str> {
    Some(match name {
        "ss" => "ß",
        "o" => "ø",
        "O" => "Ø",
        "ae" => "æ",
        "AE" => "Æ",
        "oe" => "œ",
        "OE" => "Œ",
        "aa" => "å",
        "AA" => "Å",
        "l" => "ł",
        "L" => "Ł",
        "i" => "ı",
        "j" => "ȷ",
        "dh" => "ð",
        "DH" => "Ð",
        "th" => "þ",
        "TH" => "Þ",
        "dj" => "đ",
        "DJ" => "Đ",
        "ng" => "ŋ",
        "NG" => "Ŋ",
        "textendash" => "–",
        "textemdash" => "—",
        "ldots" | "dots" | "textellipsis" => "…",
        "textquoteleft" => "‘",
        "textquoteright" => "’",
        "textquotedblleft" => "“",
        "textquotedblright" => "”",
        "guillemotleft" | "guillemetleft" => "«",
        "guillemotright" | "guillemetright" => "»",
        "textexclamdown" => "¡",
        "textquestiondown" => "¿",
        "copyright" | "textcopyright" => "©",
        "textregistered" => "®",
        "texttrademark" => "™",
        "S" | "textsection" => "§",
        "P" | "textparagraph" => "¶",
        "pounds" | "textsterling" => "£",
        "texteuro" | "euro" => "€",
        "textdegree" => "°",
        "textbackslash" => "\\",
        "slash" => "/",
        _ => return None,
    })
}

struct Cursor<'a> {
    chars: Vec<char>,
    pos: usize,
    _src: &'a str,
}

impl<'a> Cursor<'a> {
    fn new(src: &'a str) -> Self {
        Cursor { chars: src.chars().collect(), pos: 0, _src: src }
    }

    fn peek(&self) -> Option<char> {
        self.chars.get(self.pos).copied()
    }

    fn peek_at(&self, offset: usize) -> Option<char> {
        self.chars.get(self.pos + offset).copied()
    }

    fn next(&mut self) -> Option<char> {
        let c = self.peek();
        if c.is_some() {
            self.pos += 1;
        }
        c
    }

    /// With the cursor just after `{`: the content up to the matching `}`,
    /// which is consumed. When the brace is never closed, the rest.
    fn group(&mut self) -> String {
        let start = self.pos;
        let mut depth = 1;
        while let Some(c) = self.peek() {
            match c {
                '{' => depth += 1,
                '}' => {
                    depth -= 1;
                    if depth == 0 {
                        let inner: String = self.chars[start..self.pos].iter().collect();
                        self.pos += 1;
                        return inner;
                    }
                }
                _ => {}
            }
            self.pos += 1;
        }
        self.chars[start..].iter().collect()
    }

    fn command_name(&mut self) -> String {
        let start = self.pos;
        while let Some(c) = self.peek() {
            if c.is_ascii_alphabetic() {
                self.pos += 1;
            } else {
                break;
            }
        }
        self.chars[start..self.pos].iter().collect()
    }

    /// After a command made of letters: TeX swallows the spaces that follow,
    /// and an empty group is the usual way of ending the command.
    fn end_command(&mut self) {
        if self.peek() == Some('{') && self.peek_at(1) == Some('}') {
            self.pos += 2;
            return;
        }
        while self.peek() == Some(' ') {
            self.pos += 1;
        }
    }
}

/// Tries to read an accent or symbol command at the cursor, which stands on
/// the backslash. On success the cursor is moved past it.
fn read_character_command(cur: &mut Cursor) -> Option<String> {
    debug_assert_eq!(cur.peek(), Some('\\'));
    let save = cur.pos;
    cur.pos += 1;
    let first = cur.peek()?;

    // Accents.
    let is_letter_accent = first.is_ascii_alphabetic()
        && combining(first).is_some()
        && !cur.peek_at(1).is_some_and(|c| c.is_ascii_alphabetic());
    if (!first.is_ascii_alphabetic() && combining(first).is_some()) || is_letter_accent {
        let mark = combining(first).unwrap();
        cur.pos += 1;
        if is_letter_accent {
            while cur.peek() == Some(' ') {
                cur.pos += 1;
            }
        }
        let base: Option<String> = match cur.peek() {
            Some('{') => {
                cur.pos += 1;
                let inner = cur.group();
                let inner = inner.trim();
                match inner {
                    "\\i" => Some("i".into()),
                    "\\j" => Some("j".into()),
                    "" => Some(String::new()),
                    _ => {
                        let decoded = decode(inner);
                        let mut it = decoded.chars();
                        match (it.next(), it.next()) {
                            (Some(_), None) => Some(decoded),
                            // An accent over more than one letter: leave the source alone.
                            _ => None,
                        }
                    }
                }
            }
            Some('\\') => {
                let name_pos = cur.pos;
                cur.pos += 1;
                let name = cur.command_name();
                match name.as_str() {
                    "i" => {
                        cur.end_command();
                        Some("i".into())
                    }
                    "j" => {
                        cur.end_command();
                        Some("j".into())
                    }
                    _ => {
                        cur.pos = name_pos;
                        None
                    }
                }
            }
            Some(c) if c.is_alphabetic() => {
                cur.pos += 1;
                Some(c.to_string())
            }
            _ => None,
        };
        return match base {
            Some(base) if !base.is_empty() => {
                let mut s = base;
                s.push(mark);
                Some(s.nfc().collect())
            }
            Some(_) => {
                // `\'{}`: the accent alone.
                Some(String::new())
            }
            None => {
                cur.pos = save;
                None
            }
        };
    }

    // Escaped characters.
    if matches!(first, '&' | '%' | '#' | '_') {
        cur.pos += 1;
        return Some(first.to_string());
    }

    // Symbols named by letters.
    if first.is_ascii_alphabetic() {
        let name = cur.command_name();
        if let Some(s) = symbol(&name) {
            cur.end_command();
            return Some(s.to_owned());
        }
    }

    cur.pos = save;
    None
}

/// Raw to text.
pub fn decode(raw: &str) -> String {
    if !raw.contains(['\\', '{', '~', '-', '`', '\'']) {
        return raw.nfc().collect();
    }
    let mut cur = Cursor::new(raw);
    let mut out = String::with_capacity(raw.len());
    while let Some(c) = cur.peek() {
        match c {
            '\\' => {
                if let Some(s) = read_character_command(&mut cur) {
                    out.push_str(&s);
                } else {
                    // Some other command: copy the backslash and what follows it.
                    out.push('\\');
                    cur.pos += 1;
                    if let Some(next) = cur.peek() {
                        if next.is_ascii_alphabetic() {
                            out.push_str(&cur.command_name());
                        } else {
                            out.push(next);
                            cur.pos += 1;
                        }
                    }
                }
            }
            '{' => {
                cur.pos += 1;
                let inner = cur.group();
                // A group that holds only one accent or symbol was there for
                // TeX's sake: `{\"o}` is ö.
                let trimmed = inner.trim();
                if trimmed.starts_with('\\') {
                    let mut probe = Cursor::new(trimmed);
                    if let Some(s) = read_character_command(&mut probe)
                        && probe.pos == probe.chars.len()
                        && s.chars().count() <= 1
                    {
                        out.push_str(&s);
                        continue;
                    }
                }
                out.push('{');
                out.push_str(&decode(&inner));
                out.push('}');
            }
            '$' => {
                // Mathematics is left as it is.
                out.push('$');
                cur.pos += 1;
                while let Some(m) = cur.next() {
                    out.push(m);
                    if m == '\\' {
                        if let Some(e) = cur.next() {
                            out.push(e);
                        }
                    } else if m == '$' {
                        break;
                    }
                }
            }
            '~' => {
                out.push('\u{a0}');
                cur.pos += 1;
            }
            '-' => {
                let mut n = 0;
                while cur.peek() == Some('-') {
                    n += 1;
                    cur.pos += 1;
                }
                match n {
                    1 => out.push('-'),
                    2 => out.push('–'),
                    3 => out.push('—'),
                    _ => out.extend(std::iter::repeat_n('-', n)),
                }
            }
            '`' if cur.peek_at(1) == Some('`') => {
                out.push('“');
                cur.pos += 2;
            }
            '\'' if cur.peek_at(1) == Some('\'') => {
                out.push('”');
                cur.pos += 2;
            }
            _ => {
                out.push(c);
                cur.pos += 1;
            }
        }
    }
    out.nfc().collect()
}

/// Text to raw: what is written to a `.bib` file.
pub fn encode(text: &str, range_field: bool) -> String {
    let mut out = String::with_capacity(text.len() + 8);
    let mut chars = text.chars().peekable();
    let mut in_math = false;
    while let Some(c) = chars.next() {
        match c {
            '\\' => {
                out.push('\\');
                if let Some(next) = chars.next() {
                    out.push(next);
                }
            }
            '$' => {
                in_math = !in_math;
                out.push('$');
            }
            '&' | '%' | '#' | '_' if !in_math => {
                out.push('\\');
                out.push(c);
            }
            '–' if range_field => out.push_str("--"),
            _ => out.push(c),
        }
    }
    balance(&out)
}

/// Makes braces balance, so that a value can never break the file it is
/// written to: an unmatched `}` is dropped, a missing `}` is added.
pub fn balance(s: &str) -> String {
    let mut depth = 0usize;
    let mut out = String::with_capacity(s.len());
    let chars = s.chars();
    for c in chars {
        match c {
            '{' => {
                depth += 1;
                out.push(c);
            }
            '}' => {
                if depth > 0 {
                    depth -= 1;
                    out.push(c);
                }
            }
            _ => out.push(c),
        }
    }
    // A trailing backslash would escape the closing delimiter.
    if out.ends_with('\\') && !out.ends_with("\\\\") {
        out.pop();
    }
    out.extend(std::iter::repeat_n('}', depth));
    out
}

pub fn is_balanced(s: &str) -> bool {
    let mut depth = 0i64;
    for c in s.chars() {
        match c {
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth < 0 {
                    return false;
                }
            }
            _ => {}
        }
    }
    depth == 0
}

/// Greek letters as written in mathematics.
fn math_letter(name: &str) -> Option<char> {
    Some(match name {
        "alpha" => 'α',
        "beta" => 'β',
        "gamma" => 'γ',
        "delta" => 'δ',
        "epsilon" | "varepsilon" => 'ε',
        "zeta" => 'ζ',
        "eta" => 'η',
        "theta" | "vartheta" => 'θ',
        "iota" => 'ι',
        "kappa" => 'κ',
        "lambda" => 'λ',
        "mu" => 'μ',
        "nu" => 'ν',
        "xi" => 'ξ',
        "pi" => 'π',
        "rho" | "varrho" => 'ρ',
        "sigma" => 'σ',
        "tau" => 'τ',
        "upsilon" => 'υ',
        "phi" | "varphi" => 'φ',
        "chi" => 'χ',
        "psi" => 'ψ',
        "omega" => 'ω',
        "Gamma" => 'Γ',
        "Delta" => 'Δ',
        "Theta" => 'Θ',
        "Lambda" => 'Λ',
        "Xi" => 'Ξ',
        "Pi" => 'Π',
        "Sigma" => 'Σ',
        "Phi" => 'Φ',
        "Psi" => 'Ψ',
        "Omega" => 'Ω',
        "times" => '×',
        "pm" => '±',
        "infty" => '∞',
        _ => return None,
    })
}

/// Text to plain: for lists, labels, searching and comparing.
pub fn plain(text: &str) -> String {
    if !text.contains(['\\', '{', '}', '$']) {
        return super::parser::normalise_space(text);
    }
    let mut cur = Cursor::new(text);
    let mut out = String::with_capacity(text.len());
    plain_into(&mut cur, &mut out, false);
    super::parser::normalise_space(&out)
}

fn plain_into(cur: &mut Cursor, out: &mut String, in_group: bool) {
    while let Some(c) = cur.peek() {
        match c {
            '\\' => {
                cur.pos += 1;
                match cur.peek() {
                    Some(n) if n.is_ascii_alphabetic() => {
                        let name = cur.command_name();
                        if let Some(letter) = math_letter(&name) {
                            out.push(letter);
                            continue;
                        }
                        while cur.peek() == Some(' ') {
                            cur.pos += 1;
                        }
                        let quoted = matches!(name.as_str(), "mkbibquote" | "enquote" | "textquote");
                        if matches!(name.as_str(), "par" | "newline" | "linebreak") {
                            out.push(' ');
                        }
                        // An optional argument is dropped.
                        if cur.peek() == Some('[') {
                            while let Some(x) = cur.next() {
                                if x == ']' {
                                    break;
                                }
                            }
                        }
                        if cur.peek() == Some('{') {
                            cur.pos += 1;
                            if quoted {
                                out.push('“');
                            }
                            plain_into(cur, out, true);
                            if quoted {
                                out.push('”');
                            }
                        } else if !out.ends_with(' ') && cur.peek().is_some_and(|c| c.is_alphanumeric()) {
                            out.push(' ');
                        }
                    }
                    Some('\\') => {
                        out.push(' ');
                        cur.pos += 1;
                    }
                    Some('-') | Some('/') => {
                        cur.pos += 1;
                    }
                    Some(',') | Some(';') | Some(' ') => {
                        out.push(' ');
                        cur.pos += 1;
                    }
                    Some(n) => {
                        out.push(n);
                        cur.pos += 1;
                    }
                    None => {}
                }
            }
            '{' => {
                cur.pos += 1;
                plain_into(cur, out, true);
            }
            '}' => {
                cur.pos += 1;
                if in_group {
                    return;
                }
            }
            '$' => {
                cur.pos += 1;
            }
            _ => {
                out.push(c);
                cur.pos += 1;
            }
        }
    }
}

/// For comparing and searching: lower case, without diacritics, punctuation
/// turned to spaces. Greek, Cyrillic and other scripts are kept.
pub fn fold(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    for c in plain(text).nfd() {
        if unicode_normalization::char::is_combining_mark(c) {
            continue;
        }
        match c {
            'ß' => out.push_str("ss"),
            'ø' | 'Ø' => out.push('o'),
            'æ' | 'Æ' => out.push_str("ae"),
            'œ' | 'Œ' => out.push_str("oe"),
            'ł' | 'Ł' => out.push('l'),
            'đ' | 'Đ' | 'ð' | 'Ð' => out.push('d'),
            'þ' | 'Þ' => out.push_str("th"),
            'ı' => out.push('i'),
            'ς' => out.push('σ'),
            c if c.is_alphanumeric() => out.extend(c.to_lowercase()),
            _ => {
                if !out.ends_with(' ') && !out.is_empty() {
                    out.push(' ');
                }
            }
        }
    }
    let trimmed = out.trim_end().len();
    out.truncate(trimmed);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accents() {
        assert_eq!(decode(r#"G{\"o}del"#), "Gödel");
        assert_eq!(decode(r#"G\"odel"#), "Gödel");
        assert_eq!(decode(r#"G\"{o}del"#), "Gödel");
        assert_eq!(decode(r#"{\'E}cole"#), "École");
        assert_eq!(decode(r#"Fran{\c c}ois"#), "François");
        assert_eq!(decode(r#"Fran\c{c}ois"#), "François");
        assert_eq!(decode(r#"Dvo\v{r}{\'a}k"#), "Dvořák");
        assert_eq!(decode(r#"na\"{\i}ve"#), "naïve");
        assert_eq!(decode(r#"na{\"\i}ve"#), "naïve");
        assert_eq!(decode(r#"Erd\H{o}s"#), "Erdős");
        assert_eq!(decode(r#"\.{Z}ubr"#), "Żubr");
    }

    #[test]
    fn symbols() {
        assert_eq!(decode(r#"Stra{\ss}e"#), "Straße");
        assert_eq!(decode(r#"S\o ren"#), "Søren");
        assert_eq!(decode(r#"S{\o}ren \AA{}s"#), "Søren Ås");
        assert_eq!(decode(r#"\AE sir"#), "Æsir");
        assert_eq!(decode(r#"R \& D, 5\%, \#1, a\_b"#), "R & D, 5%, #1, a_b");
        assert_eq!(decode("pp. 45--67 --- and ``so''"), "pp. 45–67 — and “so”");
        assert_eq!(decode("J.~Smith"), "J.\u{a0}Smith");
    }

    #[test]
    fn what_is_kept() {
        assert_eq!(decode(r#"The {Iliad} and \emph{Odyssey}"#), r#"The {Iliad} and \emph{Odyssey}"#);
        assert_eq!(decode(r#"{{Double}} braces"#), r#"{{Double}} braces"#);
        assert_eq!(decode(r#"$\alpha$-decay -- $x_1$"#), r#"$\alpha$-decay – $x_1$"#);
        assert_eq!(decode(r#"\mkbibquote{Wrath}"#), r#"\mkbibquote{Wrath}"#);
        assert_eq!(decode("Ἰλιάς"), "Ἰλιάς");
    }

    #[test]
    fn a_name_in_braces_is_not_an_accent_group() {
        assert_eq!(decode(r#"{\'Ecole Normale}"#), "{École Normale}");
    }

    #[test]
    fn encoding() {
        assert_eq!(encode("R & D, 5%, #1, a_b", false), r#"R \& D, 5\%, \#1, a\_b"#);
        assert_eq!(encode(r#"already \& escaped"#, false), r#"already \& escaped"#);
        assert_eq!(encode(r#"$x_1$ & y_2"#, false), r#"$x_1$ \& y\_2"#);
        assert_eq!(encode("45–67", true), "45--67");
        assert_eq!(encode("45–67", false), "45–67");
    }

    #[test]
    fn round_trip() {
        for text in ["R & D", "Gödel, Escher, Bach", "The {Iliad}", "100% of #1", "a_b $x_i$", "«Ὀδύσσεια»"]
        {
            assert_eq!(decode(&encode(text, false)), text, "{text}");
        }
    }

    #[test]
    fn balancing() {
        assert_eq!(balance("a {b"), "a {b}");
        assert_eq!(balance("a } b"), "a  b");
        assert_eq!(balance("ends with \\"), "ends with ");
        assert!(is_balanced("{a{b}}"));
        assert!(!is_balanced("}{"));
    }

    #[test]
    fn plain_text() {
        assert_eq!(plain(r#"The {Iliad} and \emph{Odyssey}"#), "The Iliad and Odyssey");
        assert_eq!(plain(r#"{{Double}} braces"#), "Double braces");
        assert_eq!(plain(r#"On \mkbibquote{Wrath} in Homer"#), "On “Wrath” in Homer");
        assert_eq!(plain(r#"\textsc{nasa} report"#), "nasa report");
        assert_eq!(plain(r#"$\alpha$-decay"#), "α-decay");
    }

    #[test]
    fn folding() {
        assert_eq!(fold("The Best of the {Achaeans}: Concepts"), "the best of the achaeans concepts");
        assert_eq!(fold("Gödel, Søren & Straße"), "godel soren strasse");
        assert_eq!(fold("Ἰλιάς"), "ιλιασ");
        assert_eq!(fold("«L’Été»"), "l ete");
    }
}
