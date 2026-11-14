//! The newest version of Glaukopis, as the project's site says it (record
//! 0099), so that the installations of Windows and macOS can say that a
//! newer one is out. Those of Linux are updated by the system's packages,
//! and do not ask.
//!
//! The site holds, beside the installers, a file [`VERSION_FILE`] of one
//! field, `{"version": "0.2.12"}`, put there with the installers of each
//! release. Nothing is sent in asking for it but what any request carries.

use serde::Deserialize;

use crate::error::{Error, Result};
use crate::languages;
use crate::tr;

/// Where the version is asked for: the folder of the installers, which is
/// that of the language packages as well.
pub const DEFAULT_SERVER: &str = languages::DEFAULT_SERVER;

/// The file that names the newest version.
pub const VERSION_FILE: &str = "version.json";

/// The most the file may be.
const LIMIT: u64 = 64 * 1024;

#[derive(Deserialize)]
struct Offered {
    version: String,
}

/// The version the server names as the newest, where it is newer than
/// `current`. The server is an address or, as for the language packages,
/// a folder of this computer.
pub fn newer(server: &str, current: &str) -> Result<Option<String>> {
    let bytes = languages::get(server, VERSION_FILE, LIMIT)?;
    let offered: Offered = serde_json::from_slice(&bytes)
        .map_err(|e| Error::invalid(tr!("core-packages-version", server = server, message = e.to_string())))?;
    let version = offered.version.trim();
    Ok(is_newer(version, current).then(|| version.to_owned()))
}

/// Whether `offered` is a later version than `current`, both written as
/// numbers between dots (`0.2.12`). What is not so written is never newer.
pub fn is_newer(offered: &str, current: &str) -> bool {
    match (numbers(offered), numbers(current)) {
        (Some(mut a), Some(mut b)) => {
            let n = a.len().max(b.len());
            a.resize(n, 0);
            b.resize(n, 0);
            a > b
        }
        _ => false,
    }
}

fn numbers(version: &str) -> Option<Vec<u64>> {
    let version = version.trim();
    let version = version.strip_prefix('v').unwrap_or(version);
    version.split('.').map(|part| part.parse().ok()).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn newer_by_its_numbers_not_its_letters() {
        assert!(is_newer("0.2.12", "0.2.11"));
        assert!(is_newer("0.2.10", "0.2.9"));
        assert!(is_newer("0.3.0", "0.2.11"));
        assert!(is_newer("1.0", "0.9.9"));
        assert!(is_newer("v0.2.12", "0.2.11"));
        assert!(!is_newer("0.2.11", "0.2.11"));
        assert!(!is_newer("0.2.11.0", "0.2.11"));
        assert!(!is_newer("0.2.9", "0.2.10"));
    }

    #[test]
    fn what_is_not_a_version_is_never_newer() {
        assert!(!is_newer("", "0.2.11"));
        assert!(!is_newer("0.3.0-beta", "0.2.11"));
        assert!(!is_newer("next", "0.2.11"));
        assert!(!is_newer("0.3.0", "dev"));
    }

    #[test]
    fn read_from_a_folder() {
        let dir = tempfile::tempdir().unwrap();
        std::fs::write(dir.path().join(VERSION_FILE), r#"{"version": " 0.2.12 "}"#).unwrap();
        let server = dir.path().to_str().unwrap();
        assert_eq!(newer(server, "0.2.11").unwrap().as_deref(), Some("0.2.12"));
        assert_eq!(newer(server, "0.2.12").unwrap(), None);
        std::fs::write(dir.path().join(VERSION_FILE), "0.2.12").unwrap();
        assert!(newer(server, "0.2.11").is_err());
    }
}
