//! What identifies a work: its DOI, its ISBNs, its number at arXiv. What
//! each is, and the one form in which it is kept and compared, for the
//! library, the lookup, the reading of PDFs and the imports alike. Finding
//! them in running text, where a line may divide them, is left to those who
//! read such text.

/// DOIs: `10.1017/S0009838800012345`.
pub mod doi {
    /// Where a DOI is given as an address, or with its name before it.
    const RESOLVERS: [&str; 7] = [
        "https://doi.org/",
        "http://doi.org/",
        "https://dx.doi.org/",
        "http://dx.doi.org/",
        "doi.org/",
        "dx.doi.org/",
        "doi:",
    ];

    /// A DOI without the address of the resolver or `doi:` before it, and
    /// otherwise as it was written.
    pub fn without_resolver(value: &str) -> &str {
        let value = value.trim();
        for prefix in RESOLVERS {
            if value.get(..prefix.len()).is_some_and(|p| p.eq_ignore_ascii_case(prefix)) {
                return value[prefix.len()..].trim();
            }
        }
        value
    }

    /// The form in which DOIs are kept and compared: in small letters, as
    /// they are the same in either, without the resolver, and without the
    /// punctuation of a sentence after them. None where it is none.
    pub fn normalise(doi: &str) -> Option<String> {
        let d = without_resolver(doi).to_lowercase();
        let d = d.trim_end_matches(['.', ',', ';']);
        (d.starts_with("10.") && d.contains('/')).then(|| d.to_owned())
    }

    /// Whether what stands before the slash is a prefix: `10.` and a
    /// registrant of four to nine digits, which may be subdivided, as in
    /// `10.1000.10`.
    pub fn is_prefix(prefix: &str) -> bool {
        let Some(numbers) = prefix.strip_prefix("10.") else { return false };
        let mut numbers = numbers.split('.');
        let registrant = numbers.next().unwrap_or("");
        let digits = |n: &str| !n.is_empty() && n.bytes().all(|b| b.is_ascii_digit());
        (4..=9).contains(&registrant.len()) && digits(registrant) && numbers.all(digits)
    }

    /// Without what follows a DOI in running text: the punctuation of the
    /// sentence, and brackets that were opened before it began.
    pub fn trim_end(doi: &str) -> &str {
        let mut d = doi;
        while let Some(last) = d.chars().next_back() {
            let open = match last {
                '.' | ',' | ';' | ':' | '\'' | '!' | '?' | '"' | '”' => None,
                ')' => Some('('),
                ']' => Some('['),
                '}' => Some('{'),
                '>' => Some('<'),
                _ => return d,
            };
            if open.is_some_and(|open| d.matches(open).count() >= d.matches(last).count()) {
                return d;
            }
            d = &d[..d.len() - last.len_utf8()];
        }
        d
    }
}

/// ISBNs, of ten digits and of thirteen: `0-8018-2388-9`, `978-0-8018-2388-6`.
pub mod isbn {
    /// Whether the last digit of an ISBN agrees with the others: of ten,
    /// the last of which may be `X`, or of thirteen, beginning with 978 or
    /// 979. The digits alone, without hyphens.
    pub fn is_valid(digits: &str) -> bool {
        let values: Vec<u32> = digits
            .chars()
            .enumerate()
            .filter_map(|(i, c)| match c {
                'X' | 'x' if i == 9 && digits.len() == 10 => Some(10),
                c => c.to_digit(10),
            })
            .collect();
        if values.len() != digits.chars().count() {
            return false;
        }
        match values.len() {
            10 => values.iter().enumerate().map(|(i, v)| v * (10 - i as u32)).sum::<u32>() % 11 == 0,
            13 => {
                (digits.starts_with("978") || digits.starts_with("979"))
                    && values.iter().enumerate().map(|(i, v)| v * if i % 2 == 0 { 1 } else { 3 }).sum::<u32>() % 10 == 0
            }
            _ => false,
        }
    }

    /// The ISBNs in a field, each as an ISBN-13 without hyphens, in the
    /// order they stand in, each once.
    pub fn normalise(field: &str) -> Vec<String> {
        let mut out = Vec::new();
        let mut current = String::new();
        let flush = |current: &mut String, out: &mut Vec<String>| {
            if let Some(isbn) = to13(current)
                && !out.contains(&isbn)
            {
                out.push(isbn);
            }
            current.clear();
        };
        for c in field.chars() {
            match c {
                '0'..='9' | 'X' | 'x' => current.push(c.to_ascii_uppercase()),
                '-' | '\u{2010}' | '\u{2011}' | '–' => {}
                ' ' if !current.is_empty() && current.len() < 10 => {} // spaces used as hyphens
                _ => flush(&mut current, &mut out),
            }
            if current.len() == 13 {
                flush(&mut current, &mut out);
            }
        }
        flush(&mut current, &mut out);
        out
    }

    fn to13(digits: &str) -> Option<String> {
        match digits.len() {
            13 if digits.chars().all(|c| c.is_ascii_digit()) => Some(digits.to_owned()),
            10 if digits[..9].chars().all(|c| c.is_ascii_digit()) => {
                let body = format!("978{}", &digits[..9]);
                let sum: u32 = body
                    .chars()
                    .enumerate()
                    .map(|(i, c)| c.to_digit(10).unwrap_or(0) * if i % 2 == 0 { 1 } else { 3 })
                    .sum();
                let check = (10 - sum % 10) % 10;
                Some(format!("{body}{check}"))
            }
            _ => None,
        }
    }

    /// An ISBN-13 beginning with 978 as an ISBN-10, for catalogues that
    /// index older books that way.
    pub fn to10(isbn13: &str) -> Option<String> {
        let body = isbn13.strip_prefix("978")?;
        if body.len() != 10 {
            return None;
        }
        let nine = &body[..9];
        let sum: u32 = nine.chars().enumerate().map(|(i, c)| c.to_digit(10).unwrap_or(0) * (10 - i as u32)).sum();
        let check = (11 - sum % 11) % 11;
        let check = if check == 10 { 'X' } else { char::from_digit(check, 10)? };
        Some(format!("{nine}{check}"))
    }
}

/// Numbers at arXiv: `2301.01234v2` since 2007, `hep-th/9901001` before.
pub mod arxiv {
    /// The archives of the numbers before 2007, which were written with them.
    const ARCHIVES: &[&str] = &[
        "acc-phys", "adap-org", "alg-geom", "ao-sci", "astro-ph", "atom-ph", "bayes-an", "chao-dyn", "chem-ph",
        "cmp-lg", "comp-gas", "cond-mat", "cs", "dg-ga", "funct-an", "gr-qc", "hep-ex", "hep-lat", "hep-ph", "hep-th",
        "math", "math-ph", "mtrl-th", "nlin", "nucl-ex", "nucl-th", "patt-sol", "physics", "plasm-ph", "q-alg",
        "q-bio", "q-fin", "quant-ph", "solv-int", "stat", "supr-con",
    ];

    /// The number that begins at the beginning of `s`, without its version,
    /// and the length of both as they are written: `2301.01234v2`, with a
    /// number of four digits after the point until 2014 and of five since;
    /// `hep-th/9901001`, `math.AG/0601001v1`, whose archive is given in small
    /// letters. A letter or a digit straight after it makes it none.
    pub fn at(s: &str) -> Option<(String, usize)> {
        let bytes = s.as_bytes();
        let digits =
            |from: usize| bytes.get(from..).map_or(0, |rest| rest.iter().take_while(|b| b.is_ascii_digit()).count());
        let month =
            |yymm: &str| yymm.get(2..4).and_then(|m| m.parse::<u8>().ok()).is_some_and(|m| (1..=12).contains(&m));
        let (id, len) = if bytes.first().is_some_and(u8::is_ascii_digit) {
            // The year and the month, a point, and the number.
            let number = digits(5);
            if digits(0) != 4 || bytes.get(4) != Some(&b'.') || !(4..=5).contains(&number) || !month(&s[..4]) {
                return None;
            }
            (s[..5 + number].to_owned(), 5 + number)
        } else {
            // The archive, perhaps with its subject class, and a number of
            // seven digits that begins with the year and the month.
            let slash = s.find('/')?;
            let (name, class) = match s[..slash].split_once('.') {
                Some((name, class)) => (name, Some(class)),
                None => (&s[..slash], None),
            };
            let class_ok = class.is_none_or(|c| c.len() == 2 && c.bytes().all(|b| b.is_ascii_uppercase()));
            let name = name.to_ascii_lowercase();
            if !ARCHIVES.contains(&name.as_str()) || !class_ok || digits(slash + 1) != 7 {
                return None;
            }
            let number = &s[slash + 1..slash + 8];
            if !month(number) {
                return None;
            }
            let class = class.map(|c| format!(".{c}")).unwrap_or_default();
            (format!("{name}{class}/{number}"), slash + 8)
        };
        let version = match bytes.get(len) {
            Some(b'v') if digits(len + 1) > 0 => 1 + digits(len + 1),
            _ => 0,
        };
        if bytes.get(len + version).is_some_and(|b| b.is_ascii_alphanumeric()) {
            return None;
        }
        Some((id, len + version))
    }

    /// A number that stands by itself, with its version where one is given.
    pub fn whole(text: &str) -> Option<String> {
        let (id, len) = at(text)?;
        // The number is as long as it was written: only the archive is made small.
        (len == text.len()).then(|| format!("{id}{}", &text[id.len()..]))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dois() {
        assert_eq!(
            doi::normalise(" https://doi.org/10.1017/S0009838800012345. ").as_deref(),
            Some("10.1017/s0009838800012345")
        );
        assert_eq!(doi::normalise("doi:10.2307/123").as_deref(), Some("10.2307/123"));
        assert_eq!(doi::normalise("DOI: 10.2307/123").as_deref(), Some("10.2307/123"));
        assert_eq!(doi::normalise("not a doi"), None);
        assert_eq!(doi::without_resolver("https://dx.doi.org/10.1000/ABC"), "10.1000/ABC");
        assert_eq!(doi::without_resolver("10.1000/ABC"), "10.1000/ABC");
        assert_eq!(doi::without_resolver("https://example.org/10.1000/x"), "https://example.org/10.1000/x");
        assert!(doi::is_prefix("10.1017") && doi::is_prefix("10.1000.10") && doi::is_prefix("10.123456789"));
        assert!(!doi::is_prefix("10.123") && !doi::is_prefix("10.1234567890") && !doi::is_prefix("11.1234"));
        assert!(!doi::is_prefix("10.1000.") && !doi::is_prefix("10.12a4"));
        assert_eq!(doi::trim_end("10.1000/abc)."), "10.1000/abc");
        assert_eq!(doi::trim_end("10.1002/(SICI)1097-4571(199806)"), "10.1002/(SICI)1097-4571(199806)");
        assert_eq!(doi::trim_end("10.1000/a[1]"), "10.1000/a[1]");
        assert_eq!(doi::trim_end("10.1000/abc”,"), "10.1000/abc");
    }

    #[test]
    fn isbns() {
        assert_eq!(isbn::normalise("0-8018-2388-9"), vec!["9780801823886"]);
        assert_eq!(isbn::normalise("978-0-8018-2388-6 (pbk.), 080442957X"), vec!["9780801823886", "9780804429573"]);
        assert_eq!(isbn::normalise("9780801823886 9780804429573"), vec!["9780801823886", "9780804429573"]);
        assert!(isbn::normalise("12345").is_empty());
        assert_eq!(isbn::to10("9780801823886").as_deref(), Some("0801823889"));
        assert_eq!(isbn::to10("9780804429573").as_deref(), Some("080442957X"));
        assert!(isbn::is_valid("9780674033818") && isbn::is_valid("080442957X") && isbn::is_valid("0674033809"));
        assert!(isbn::is_valid("080442957x"));
        assert!(!isbn::is_valid("9780674033819") && !isbn::is_valid("0674033818") && !isbn::is_valid("9770674033811"));
        assert!(!isbn::is_valid("X674033817") && !isbn::is_valid("97806740338") && !isbn::is_valid(""));
    }

    #[test]
    fn numbers_at_arxiv() {
        assert_eq!(arxiv::at("2301.01234v2 [hep-th]"), Some(("2301.01234".into(), 12)));
        assert_eq!(arxiv::at("1706.03762"), Some(("1706.03762".into(), 10)));
        assert_eq!(arxiv::at("hep-th/9901001 and"), Some(("hep-th/9901001".into(), 14)));
        assert_eq!(arxiv::at("math.AG/0601001v1"), Some(("math.AG/0601001".into(), 17)));
        assert_eq!(arxiv::at("HEP-TH/9901001"), Some(("hep-th/9901001".into(), 14)));
        // Not a month; a number that runs on; an archive that never was.
        for none in
            ["2313.01234", "2301.012345", "2301.0123a", "1706.123", "hep-th/9913001", "abc/9901001", "cs.ag/9901001"]
        {
            assert_eq!(arxiv::at(none), None, "{none}");
        }
        assert_eq!(arxiv::whole("1706.03762v5").as_deref(), Some("1706.03762v5"));
        assert_eq!(arxiv::whole("Math.GT/0309136").as_deref(), Some("math.GT/0309136"));
        assert_eq!(arxiv::whole("1706.03762 more"), None);
    }
}
