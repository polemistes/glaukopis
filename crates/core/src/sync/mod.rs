//! The same on every computer of the writer (record 0120; the plan is
//! `docs/plans/the-same-on-every-device.md`).
//!
//! A writer's computers share a home on a server: the computers that may
//! enter it, the documents it keeps, and one store of files. This computer
//! is brought to be the same as the home by one thread, one request at a
//! time. A document is brought to be the same by one call, the exchange:
//! the computer says what it last saw of the server's document and sends
//! what it has made since, worked out from the bytes on disk (`whole`); the
//! server answers with what it had beyond that, which is added to the log
//! of the document as a change that came from elsewhere.
//!
//! What the computer keeps of all this is in `kept`.

pub mod arrangement;
pub mod engine;
pub mod facts;
pub mod files;
pub mod home;
pub mod kept;
pub mod library;
pub mod mirror;
pub mod remote;
pub mod settings;
pub mod shelves;
pub mod whole;
pub mod wrote;

pub use engine::{Hears, Knows, State, Status, Sync};
pub use kept::Takes;

use crate::paths::DataDir;

/// Whether the notebook was refused when the device whose data is in
/// `data` last exchanged it, too large or not readable here; or the
/// synchronization stopped on the device for a later form, of the notebook
/// or of any other document of its home, and its notebook was not
/// exchanged since. The engine keeps it from one run to the next
/// (`sync/notebook-refused.json`). Such a device lacks notes that others
/// wrote, and must sweep no file out of the store by what its own notes
/// hold. False where nothing is kept, as on a device in no home, whose
/// `sync/` went when it left.
pub fn notebook_refused(data: &DataDir) -> bool {
    kept::Kept::new(data).noted::<bool>(engine::NOTEBOOK_REFUSED).unwrap_or(false)
}

/// The form of the texts this version of the application writes and reads
/// (record 0111), as the interface says it in `src/lib/editor/form.ts`; a
/// test holds the two to be the same. The server is told it with every
/// exchange, and sends nothing of a project in a later form.
pub const FORM: u32 = 2;

/// What the system calls this device: offered as its name among the
/// writer's devices, which the writer may change before it is sent
/// anywhere. Nothing where the system says none. On Android, the model
/// (`SM-S908B`), since the name of the host is `localhost` on every phone.
pub fn device() -> String {
    #[cfg(target_os = "android")]
    {
        let mut value = [0u8; libc::PROP_VALUE_MAX as usize];
        // SAFETY: the name is a string ended by a nought, and the buffer is as
        // long as a property's value may be, which the system ends by a nought.
        let len = unsafe { libc::__system_property_get(c"ro.product.model".as_ptr(), value.as_mut_ptr().cast()) };
        let len = usize::try_from(len).unwrap_or(0).min(value.len());
        String::from_utf8_lossy(&value[..len]).trim().to_owned()
    }
    #[cfg(all(unix, not(target_os = "android")))]
    {
        let mut name = [0u8; 256];
        // SAFETY: the buffer is ours and its length is given; the name is ended by a nought within it.
        let said = unsafe { libc::gethostname(name.as_mut_ptr().cast(), name.len() - 1) };
        if said == 0 {
            let end = name.iter().position(|b| *b == 0).unwrap_or(name.len());
            return String::from_utf8_lossy(&name[..end]).trim().to_owned();
        }
        String::new()
    }
    #[cfg(not(unix))]
    {
        std::env::var("COMPUTERNAME").unwrap_or_default().trim().to_owned()
    }
}

/// Bytes in hex, as the server writes digests and state vectors.
pub fn hex(bytes: &[u8]) -> String {
    const DIGITS: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        out.push(DIGITS[(byte >> 4) as usize] as char);
        out.push(DIGITS[(byte & 15) as usize] as char);
    }
    out
}

/// What hex says, where it is hex.
pub fn unhex(text: &str) -> Option<Vec<u8>> {
    let digit = |b: u8| match b {
        b'0'..=b'9' => Some(b - b'0'),
        b'a'..=b'f' => Some(b - b'a' + 10),
        b'A'..=b'F' => Some(b - b'A' + 10),
        _ => None,
    };
    let bytes = text.as_bytes();
    if !bytes.len().is_multiple_of(2) {
        return None;
    }
    bytes.chunks(2).map(|pair| Some(digit(pair[0])? << 4 | digit(pair[1])?)).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hex_is_read_as_it_is_written() {
        let bytes = [0u8, 1, 15, 16, 171, 255];
        assert_eq!(hex(&bytes), "00010f10abff");
        assert_eq!(unhex(&hex(&bytes)).as_deref(), Some(&bytes[..]));
        assert_eq!(unhex("ABff").as_deref(), Some(&[171u8, 255][..]));
        assert_eq!(unhex("abc"), None);
        assert_eq!(unhex("zz"), None);
        assert_eq!(unhex("").as_deref(), Some(&[][..]));
    }

    #[test]
    fn the_form_of_the_texts_is_the_one_the_interface_says() {
        let said = include_str!("../../../../src/lib/editor/form.ts");
        let line = said.lines().find(|l| l.starts_with("export const FORM = ")).expect("the interface says its form");
        let form: u32 = line.trim_start_matches("export const FORM = ").trim_end_matches(';').trim().parse().unwrap();
        assert_eq!(FORM, form, "raise `sync::FORM` with `FORM` in src/lib/editor/form.ts");
    }
}
