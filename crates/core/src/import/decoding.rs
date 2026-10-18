//! The bytes of a file of text, as letters: one reading for every file of
//! text that is brought in, a `.bib`, a `.txt` or a `.csv`, so that the same
//! file reads the same whatever it is brought in as.

use encoding_rs::{Encoding, UTF_16BE, UTF_16LE, WINDOWS_1252};

/// The text of a file, and whether it was taken for Western European
/// (Windows-1252, which holds Latin-1) because it is neither UTF-8 nor
/// UTF-16. That is a guess, and the one who brings the file in is told.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Decoded {
    pub text: String,
    pub western: bool,
}

/// Reads the bytes of a file of text: in the encoding its mark at the
/// beginning names (UTF-8 or UTF-16 of either order); as UTF-16 without the
/// mark where its zero bytes say so; as UTF-8 where it is that; and
/// otherwise as Windows-1252, which is said in `western`.
pub fn decode_text(bytes: &[u8]) -> Decoded {
    if let Some((encoding, mark)) = Encoding::for_bom(bytes) {
        return Decoded { text: encoding.decode_without_bom_handling(&bytes[mark..]).0.into_owned(), western: false };
    }
    if let Some(encoding) = unmarked_utf16(bytes) {
        let (text, faults) = encoding.decode_without_bom_handling(bytes);
        if !faults {
            return Decoded { text: text.into_owned(), western: false };
        }
    }
    match std::str::from_utf8(bytes) {
        Ok(text) => Decoded { text: text.to_owned(), western: false },
        Err(_) => Decoded { text: WINDOWS_1252.decode_without_bom_handling(bytes).0.into_owned(), western: true },
    }
}

/// Which UTF-16 the bytes are in, where they have no mark to say: a file of
/// text in UTF-8 or a Western encoding has no zero byte, while one in UTF-16
/// has one in every letter of the Latin alphabet, space and line break, on
/// the side of the order it is written in (the second byte of each pair in
/// little-endian), and almost none on the other side. Text in another
/// alphabet has fewer, at its spaces and signs, so a few on one side and
/// none to speak of on the other are enough.
fn unmarked_utf16(bytes: &[u8]) -> Option<&'static Encoding> {
    if bytes.len() < 2 || !bytes.len().is_multiple_of(2) {
        return None;
    }
    let pairs = bytes.len() / 2;
    let (mut first, mut second) = (0usize, 0usize);
    for pair in bytes.as_chunks::<2>().0 {
        first += usize::from(pair[0] == 0);
        second += usize::from(pair[1] == 0);
    }
    let enough = (pairs / 50).max(1);
    if second >= enough && first * 20 <= second {
        Some(UTF_16LE)
    } else if first >= enough && second * 20 <= first {
        Some(UTF_16BE)
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn utf16(text: &str, big: bool) -> Vec<u8> {
        text.encode_utf16().flat_map(|u| if big { u.to_be_bytes() } else { u.to_le_bytes() }).collect()
    }

    fn read(bytes: &[u8]) -> (String, bool) {
        let d = decode_text(bytes);
        (d.text, d.western)
    }

    #[test]
    fn every_encoding_a_text_file_comes_in() {
        let text = "@book{a, title = {Gödel – “x” ἀρετή}}";
        assert_eq!(read(text.as_bytes()), (text.into(), false));
        assert_eq!(read(&[b"\xef\xbb\xbf", text.as_bytes()].concat()), (text.into(), false));
        // UTF-16 with its mark, as Notepad and EndNote save "Unicode".
        assert_eq!(read(&[&[0xff, 0xfe][..], &utf16(text, false)].concat()), (text.into(), false));
        assert_eq!(read(&[&[0xfe, 0xff][..], &utf16(text, true)].concat()), (text.into(), false));
        // And without it.
        assert_eq!(read(&utf16(text, false)), (text.into(), false));
        assert_eq!(read(&utf16(text, true)), (text.into(), false));
        let greek = "μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος οὐλομένην, ἣ μυρί᾽ Ἀχαιοῖς ἄλγε᾽ ἔθηκε";
        assert_eq!(read(&utf16(greek, false)), (greek.into(), false));
        // What is neither is read as Western European, and that is said.
        assert_eq!(
            read(&[b'G', 0xf6, b'd', b'e', b'l', b' ', 0x96, b' ', 0x93, b'x', 0x94]),
            ("Gödel – “x”".into(), true)
        );
        assert_eq!(read(b""), (String::new(), false));
        // Two bytes of a Western file are not taken for a letter of UTF-16.
        assert_eq!(read(&[b'a', 0xe5]), ("aå".into(), true));
    }
}
