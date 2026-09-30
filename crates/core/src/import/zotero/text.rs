//! Values of Zotero's fields brought into the form the library holds them in.

use crate::bib::parser::normalise_space;

/// A value that stands on one line.
pub(super) fn line(value: &str) -> String {
    dollars(&normalise_space(value))
}

/// A value of several paragraphs, as an abstract is: the line breaks are
/// kept, empty lines are not.
pub(super) fn paragraphs(value: &str) -> String {
    let lines: Vec<String> = value.lines().map(normalise_space).filter(|l| !l.is_empty()).collect();
    dollars(&lines.join("\n"))
}

/// Whether what stands between two dollar signs is mathematics, as in
/// `$\alpha$-decay` or `$n$-gram`, and not what stands between two prices.
fn is_mathematics(content: &str) -> bool {
    if content.is_empty() || content.starts_with(char::is_whitespace) || content.ends_with(char::is_whitespace) {
        return false;
    }
    content.contains(['\\', '^', '_', '{', '=', '+', '<', '>'])
        || (content.chars().count() <= 3 && content.chars().all(char::is_alphabetic))
}

/// In a `.bib` file a dollar sign begins mathematics. Zotero knows no
/// mathematics, so a dollar sign there is nearly always money, and is
/// written `\$`. Pairs that can only be mathematics are left as they are.
fn dollars(text: &str) -> String {
    if !text.contains('$') {
        return text.to_owned();
    }
    let signs: Vec<usize> = text.match_indices('$').map(|(i, _)| i).filter(|&i| !text[..i].ends_with('\\')).collect();
    let mut money: Vec<usize> = Vec::new();
    let mut n = 0;
    while n < signs.len() {
        match signs.get(n + 1) {
            Some(&close) if is_mathematics(&text[signs[n] + 1..close]) => n += 2,
            _ => {
                money.push(signs[n]);
                n += 1;
            }
        }
    }
    let mut out = String::with_capacity(text.len() + money.len());
    for (i, c) in text.char_indices() {
        if money.contains(&i) {
            out.push('\\');
        }
        out.push(c);
    }
    out
}

const ORDINALS: [&str; 12] = [
    "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh",
    "twelfth",
];

const EDITION_WORDS: [&str; 16] = [
    "ed", "edn", "edition", "aufl", "auflage", "utg", "utgave", "utgåva", "uppl", "upplaga", "udg", "udgave", "éd",
    "édition", "edición", "edizione",
];

/// The number of an edition from "2nd ed.", "3. Aufl." or "Second edition".
/// BibLaTeX wants the number alone, which styles print in their own way and
/// by which editions can be compared. What says more ("2nd, revised") is
/// left as it is.
pub(super) fn edition(value: &str) -> String {
    let value = normalise_space(value);
    let lower = value.to_lowercase();
    let mut words = lower.split(' ').map(|w| w.trim_end_matches('.'));
    let number = words.next().and_then(|word| {
        if let Some(n) = ORDINALS.iter().position(|o| *o == word) {
            return Some(n + 1);
        }
        let digits: String = word.chars().take_while(char::is_ascii_digit).collect();
        let ending = &word[digits.len()..];
        matches!(ending, "" | "st" | "nd" | "rd" | "th" | "e" | "ème" | "a" | "ª")
            .then(|| digits.parse::<usize>().ok())
            .flatten()
    });
    let rest: Vec<&str> = words.collect();
    match (number, rest.as_slice()) {
        (Some(n), []) => n.to_string(),
        (Some(n), [word]) if EDITION_WORDS.contains(word) => n.to_string(),
        _ => value,
    }
}

/// A publisher, place or institution. These are lists in BibLaTeX, with
/// "and" between the members. Zotero has one field, in which several are
/// separated by semicolons, and in which an "and" is part of a name:
/// "Thames and Hudson" is one publisher.
pub(super) fn list(value: &str) -> String {
    value
        .split(';')
        .map(line)
        .filter(|member| !member.is_empty())
        .map(|member| keep_and(&member))
        .collect::<Vec<_>>()
        .join(" and ")
}

/// Puts the "and" of a name in braces, where it is not in braces already.
fn keep_and(name: &str) -> String {
    let mut out = String::with_capacity(name.len() + 4);
    let mut depth = 0i32;
    // Up to where the text has been written already.
    let mut written = 0;
    for (i, c) in name.char_indices() {
        if i < written {
            continue;
        }
        match c {
            '{' => depth += 1,
            '}' => depth -= 1,
            _ => {}
        }
        if depth == 0 && name.get(i..i + 5).is_some_and(|s| s.eq_ignore_ascii_case(" and ")) {
            out.push_str(" {");
            out.push_str(&name[i + 1..i + 4]);
            out.push('}');
            // The space after it is left, as it may begin the next "and".
            written = i + 4;
            continue;
        }
        out.push(c);
    }
    out
}

/// A DOI without the address of the resolver before it.
pub(super) fn doi(value: &str) -> String {
    crate::written::identifiers::doi::without_resolver(value).to_owned()
}

/// The kind of thesis as BibLaTeX names it, where the text says which it is:
/// `phdthesis` or `mathesis`, which are printed in the language of the
/// document. Otherwise the text as given.
pub(super) fn thesis_type(value: &str) -> String {
    let value = line(value);
    let lower = value.to_lowercase().replace('.', "");
    let words: Vec<&str> = lower.split(|c: char| !c.is_alphanumeric()).filter(|w| !w.is_empty()).collect();
    // "Ph. D." and "M. A." are two words each.
    let pair = |first: &str, second: &[&str]| words.windows(2).any(|w| w[0] == first && second.contains(&w[1]));
    let doctoral = pair("ph", &["d"])
        || words.iter().any(|w| matches!(*w, "phd" | "dphil") || w.starts_with("doctor") || w.starts_with("doktor"));
    let masters = pair("m", &["a", "sc", "s", "phil"])
        || words.iter().any(|w| {
            matches!(*w, "ma" | "msc" | "ms" | "mphil") || w.starts_with("master") || w.starts_with("magister")
        });
    match (doctoral, masters) {
        (true, false) => "phdthesis".into(),
        (false, true) => "mathesis".into(),
        _ => value,
    }
}

/// The name of one of Zotero's fields in words: `runningTime` is "running time".
pub(super) fn label(field: &str) -> String {
    let mut out = String::with_capacity(field.len() + 4);
    let mut after_lower = false;
    for c in field.chars() {
        if c.is_uppercase() && after_lower {
            out.push(' ');
            out.extend(c.to_lowercase());
        } else {
            out.push(c);
        }
        after_lower = c.is_lowercase();
    }
    out
}

/// A value cut to a length that fits a remark.
pub(super) fn shorten(value: &str, length: usize) -> String {
    let value = normalise_space(value);
    if value.chars().count() <= length {
        return value;
    }
    let mut cut: String = value.chars().take(length).collect();
    cut.truncate(cut.trim_end().len());
    cut.push('…');
    cut
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lines_and_paragraphs() {
        assert_eq!(line("  The  wrath\n of Achilles "), "The wrath of Achilles");
        assert_eq!(paragraphs("One  line.\r\n\r\n\r\n  Another. \n"), "One line.\nAnother.");
    }

    #[test]
    fn money_and_mathematics() {
        assert_eq!(line("A Fistful of $"), "A Fistful of \\$");
        assert_eq!(line("Between $5 and $10"), "Between \\$5 and \\$10");
        assert_eq!(line("From $100-$200"), "From \\$100-\\$200");
        assert_eq!(line("$\\alpha$-decay and $n$-grams for $5"), "$\\alpha$-decay and $n$-grams for \\$5");
        assert_eq!(line("Already \\$5"), "Already \\$5");
        assert_eq!(line("$x_1 + x_2$"), "$x_1 + x_2$");
    }

    #[test]
    fn editions() {
        assert_eq!(edition("2"), "2");
        assert_eq!(edition("2nd"), "2");
        assert_eq!(edition("2nd ed."), "2");
        assert_eq!(edition("3rd edition"), "3");
        assert_eq!(edition("3. Aufl."), "3");
        assert_eq!(edition("4. utg."), "4");
        assert_eq!(edition("2e éd."), "2");
        assert_eq!(edition("Second edition"), "2");
        assert_eq!(edition("First"), "1");
        assert_eq!(edition("2nd rev. ed."), "2nd rev. ed.");
        assert_eq!(edition("Revised edition"), "Revised edition");
        assert_eq!(edition("1979 printing"), "1979 printing");
    }

    #[test]
    fn publishers_and_places() {
        assert_eq!(list("Thames and Hudson"), "Thames {and} Hudson");
        assert_eq!(list("London; New York"), "London and New York");
        assert_eq!(list(" Cambridge, MA ;"), "Cambridge, MA");
        assert_eq!(list("Faber AND Faber; Harper & Row"), "Faber {AND} Faber and Harper & Row");
        assert_eq!(list("{Thames and Hudson}"), "{Thames and Hudson}");
        assert_eq!(list("A and and B"), "A {and} {and} B");
        assert_eq!(list("Ἀθῆναι and Ρώμη"), "Ἀθῆναι {and} Ρώμη");
        assert_eq!(list("Sand and"), "Sand and");
    }

    #[test]
    fn identifiers() {
        assert_eq!(doi("https://doi.org/10.1017/S0009838800012345"), "10.1017/S0009838800012345");
        assert_eq!(doi("HTTP://dx.doi.org/10.2307/123"), "10.2307/123");
        assert_eq!(doi("doi: 10.2307/123 "), "10.2307/123");
        assert_eq!(doi("10.2307/123"), "10.2307/123");
    }

    #[test]
    fn theses() {
        let doctoral = [
            "PhD thesis",
            "Ph.D. dissertation",
            "Ph. D.",
            "Doctoral dissertation",
            "Doktorgradsavhandling",
            "DPhil thesis",
            "Thèse de doctorat",
        ];
        for text in doctoral {
            assert_eq!(thesis_type(text), "phdthesis", "{text}");
        }
        let masters = [
            "Master's thesis",
            "Masters thesis",
            "MA thesis",
            "M.A.",
            "M. A. thesis",
            "M.Sc. thesis",
            "Masteroppgave",
            "Magisterarbeit",
            "MPhil",
        ];
        for text in masters {
            assert_eq!(thesis_type(text), "mathesis", "{text}");
        }
        let others = [
            "Dissertation",
            "Habilitationsschrift",
            "Hovedoppgave",
            "Bachelor thesis",
            "Master's and PhD theses",
            "Monograph draft",
        ];
        for text in others {
            assert_eq!(thesis_type(text), text, "{text}");
        }
    }

    #[test]
    fn labels_and_cuts() {
        assert_eq!(label("runningTime"), "running time");
        assert_eq!(label("archiveLocation"), "archive location");
        assert_eq!(label("ISBN"), "ISBN");
        assert_eq!(label("scale"), "scale");
        assert_eq!(shorten("short", 10), "short");
        assert_eq!(shorten("a rather long value", 9), "a rather…");
    }
}
