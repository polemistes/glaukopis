//! Numbers in the letters of the Romans: the pages before the first of a
//! book, the chapters and books that are cited, the kings in titles.

const NUMERALS: [(u32, &str); 13] = [
    (1000, "m"),
    (900, "cm"),
    (500, "d"),
    (400, "cd"),
    (100, "c"),
    (90, "xc"),
    (50, "l"),
    (40, "xl"),
    (10, "x"),
    (9, "ix"),
    (5, "v"),
    (4, "iv"),
    (1, "i"),
];

/// A number in small Roman letters: 14 is `xiv`. Nothing for nought; a
/// number above 3999, which the Romans did not write so, in digits.
pub fn of(mut number: u32) -> String {
    if number > 3999 {
        return number.to_string();
    }
    let mut out = String::new();
    for (value, letters) in NUMERALS {
        while number >= value {
            out.push_str(letters);
            number -= value;
        }
    }
    out
}

/// The value of a number in Roman letters of either case, however it was
/// written: `xiv` and `XIIII` alike.
pub fn value(letters: &[char]) -> Option<u32> {
    let value = |c: char| match c.to_ascii_lowercase() {
        'i' => 1,
        'v' => 5,
        'x' => 10,
        'l' => 50,
        'c' => 100,
        'd' => 500,
        'm' => 1000,
        _ => 0,
    };
    let mut total: i64 = 0;
    for (i, c) in letters.iter().enumerate() {
        let here = value(*c);
        if here == 0 {
            return None;
        }
        let next = letters.get(i + 1).map_or(0, |n| value(*n));
        total += if here < next { -here } else { here };
    }
    u32::try_from(total).ok().filter(|n| *n > 0)
}

/// Whether letters are a number written as the Romans wrote it, in either
/// case: `xiv`, `XIV`; not `xiiii`, `vx` or `iix`. Whether a word such as
/// `mix` or `civil` is taken for one is for those who read it to say.
pub fn is_one(letters: &[char]) -> bool {
    let written: String = letters.iter().map(|c| c.to_ascii_lowercase()).collect();
    value(letters).is_some_and(|value| of(value) == written)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn chars(s: &str) -> Vec<char> {
        s.chars().collect()
    }

    #[test]
    fn numbers_written_and_read() {
        assert_eq!(of(1994), "mcmxciv");
        assert_eq!(of(14), "xiv");
        assert_eq!(of(0), "");
        assert_eq!(of(3999), "mmmcmxcix");
        assert_eq!(of(u32::MAX), u32::MAX.to_string());
        assert_eq!(value(&chars("XIV")), Some(14));
        assert_eq!(value(&chars("xiiii")), Some(14));
        assert_eq!(value(&chars("xiz")), None);
        assert!(is_one(&chars("xiv")) && is_one(&chars("XIV")) && is_one(&chars("MCMXCIV")));
        assert!(!is_one(&chars("xiiii")) && !is_one(&chars("vx")) && !is_one(&chars("iix")));
        // A word may be a number.
        assert!(is_one(&chars("mix")) && !is_one(&chars("civil")));
        assert!(!is_one(&chars("")));
    }
}
