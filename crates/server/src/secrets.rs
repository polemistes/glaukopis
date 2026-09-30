//! Tokens and invitation codes.

use sha2::{Digest, Sha256};

fn random(bytes: &mut [u8]) {
    getrandom::fill(bytes).expect("the system gives random numbers");
}

fn hex(bytes: &[u8]) -> String {
    const DIGITS: &[u8; 16] = b"0123456789abcdef";
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push(DIGITS[(b >> 4) as usize] as char);
        s.push(DIGITS[(b & 15) as usize] as char);
    }
    s
}

/// A token of 256 random bits.
pub fn token() -> String {
    let mut bytes = [0u8; 32];
    random(&mut bytes);
    hex(&bytes)
}

/// What is kept of a token.
pub fn hash(token: &str) -> String {
    hex(&Sha256::digest(token.trim().as_bytes()))
}

/// What is kept of an invitation code: the hash of the code as it is written
/// by `normalise_code`. The application computes the same, in
/// `glaukopis_core::sharing::code_hash`, to know a code of its own by it.
pub fn code_hash(code: &str) -> String {
    hash(&normalise_code(code))
}

/// Compares without telling by the time taken where two strings differ.
pub fn same(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;
    }
    a.bytes().zip(b.bytes()).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

/// Letters and digits that are not taken for one another when read out or
/// written down: no 0 and O, no 1, I and L.
const ALPHABET: &[u8] = b"23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/// An invitation code: twelve characters in three groups, about 59 bits.
pub fn code() -> String {
    let mut out = String::with_capacity(14);
    let mut bytes = [0u8; 24];
    random(&mut bytes);
    let mut made = 0;
    let mut i = 0;
    while made < 12 {
        if i == bytes.len() {
            random(&mut bytes);
            i = 0;
        }
        let b = bytes[i] as usize;
        i += 1;
        // Without bias: bytes that would favour the first letters are passed over.
        if b >= 256 - 256 % ALPHABET.len() {
            continue;
        }
        if made > 0 && made % 4 == 0 {
            out.push('-');
        }
        out.push(ALPHABET[b % ALPHABET.len()] as char);
        made += 1;
    }
    out
}

/// A code as it may have been typed, written as `code` writes one: in
/// capitals, in groups of four with hyphens between, and with the signs that
/// are taken for one another read as those of the alphabet. The application
/// has the same, in `glaukopis_core::sharing`; the two are held to agree by
/// the tests here.
pub fn normalise_code(typed: &str) -> String {
    let letters: String = typed
        .chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .map(|c| c.to_ascii_uppercase())
        .map(|c| match c {
            '0' | 'O' => 'Q',
            '1' | 'I' | 'L' => 'J',
            c => c,
        })
        .collect();
    letters.as_bytes().chunks(4).map(|c| std::str::from_utf8(c).unwrap_or("")).collect::<Vec<_>>().join("-")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tokens_and_codes() {
        let t = token();
        assert_eq!(t.len(), 64);
        assert_ne!(t, token());
        assert_eq!(hash(&t), hash(&format!(" {t}\n")));
        assert_ne!(hash(&t), t);
        assert!(same("abc", "abc") && !same("abc", "abd") && !same("abc", "ab"));

        let c = code();
        assert_eq!(c.len(), 14);
        assert!(c.split('-').all(|g| g.len() == 4 && g.bytes().all(|b| ALPHABET.contains(&b))));
        assert_eq!(normalise_code(&c.to_lowercase().replace('-', " ")), c);
        assert_eq!(normalise_code("abcd efgh jkmn"), "ABCD-EFGH-JKMN");
        // The application knows a code of its own by the same hash.
        for typed in [c.as_str(), "abcd efgh jk10", " Abcd-Efgh-Jkmn\n"] {
            assert_eq!(normalise_code(typed), glaukopis_core::sharing::normalise_code(typed));
            assert_eq!(code_hash(typed), glaukopis_core::sharing::code_hash(typed));
        }
    }
}
