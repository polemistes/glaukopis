//! Where Zotero keeps its data on this system.
//!
//! Since version 5 the data directory is `Zotero` in the user's home, unless
//! the user has chosen another, which is then written in the settings of
//! Zotero's profile. Before that the data were kept within the profile.

use std::fs;
use std::path::{Path, PathBuf};

use super::database::DATABASE;

fn home() -> Option<PathBuf> {
    let name = if cfg!(windows) { "USERPROFILE" } else { "HOME" };
    std::env::var_os(name).filter(|v| !v.is_empty()).map(PathBuf::from)
}

/// The profiles of Zotero: on Linux, macOS and Windows, and where Flatpak
/// and Snap keep them.
fn profiles(home: &Path) -> Vec<PathBuf> {
    let homes = [
        ".zotero/zotero",
        "Library/Application Support/Zotero/Profiles",
        "AppData/Roaming/Zotero/Zotero/Profiles",
        ".var/app/org.zotero.Zotero/.zotero/zotero",
        "snap/zotero-snap/common/.zotero/zotero",
        "snap/zotero-snap/current/.zotero/zotero",
    ];
    let mut found = Vec::new();
    for dir in homes {
        let Ok(entries) = fs::read_dir(home.join(dir)) else { continue };
        let mut profiles: Vec<PathBuf> = entries.flatten().map(|e| e.path()).filter(|p| p.is_dir()).collect();
        profiles.sort();
        found.extend(profiles);
    }
    found
}

/// The text of a setting in a `prefs.js`, where a line reads
/// `user_pref("name", "value");`.
fn setting(prefs: &str, name: &str) -> Option<String> {
    let start = format!("user_pref(\"{name}\"");
    let line = prefs.lines().map(str::trim).find(|line| line.starts_with(&start))?;
    let value = line[start.len()..].trim_start().strip_prefix(',')?.trim_start().strip_prefix('"')?;
    let mut out = String::new();
    let mut chars = value.chars();
    while let Some(c) = chars.next() {
        match c {
            '"' => return Some(out),
            '\\' => match chars.next()? {
                'u' => {
                    let code: String = chars.by_ref().take(4).collect();
                    out.push(char::from_u32(u32::from_str_radix(&code, 16).ok()?)?);
                }
                'x' => {
                    let code: String = chars.by_ref().take(2).collect();
                    out.push(char::from_u32(u32::from_str_radix(&code, 16).ok()?)?);
                }
                other => out.push(other),
            },
            c => out.push(c),
        }
    }
    None
}

/// What the profiles have for a setting that names a directory.
fn directories(home: &Path, name: &str) -> Vec<PathBuf> {
    profiles(home)
        .iter()
        .filter_map(|profile| fs::read(profile.join("prefs.js")).ok())
        .filter_map(|bytes| setting(&String::from_utf8_lossy(&bytes), name))
        .filter(|dir| !dir.trim().is_empty())
        .map(PathBuf::from)
        .collect()
}

fn find_under(home: &Path) -> Vec<PathBuf> {
    // Where the user has told Zotero to keep its data comes first.
    let mut places = directories(home, "extensions.zotero.dataDir");
    for dir in [
        "Zotero",
        ".var/app/org.zotero.Zotero/Zotero",
        ".var/app/org.zotero.Zotero/data/Zotero",
        "snap/zotero-snap/common/Zotero",
        "snap/zotero-snap/current/Zotero",
    ] {
        places.push(home.join(dir));
    }
    places.extend(profiles(home).into_iter().map(|profile| profile.join("zotero")));

    let mut found: Vec<PathBuf> = Vec::new();
    let mut seen: Vec<PathBuf> = Vec::new();
    for place in places {
        if !place.join(DATABASE).is_file() {
            continue;
        }
        // The same directory may be reached by more than one path.
        let real = fs::canonicalize(&place).unwrap_or_else(|_| place.clone());
        if !seen.contains(&real) {
            seen.push(real);
            found.push(place);
        }
    }
    found
}

pub(super) fn find() -> Vec<PathBuf> {
    home().map(|home| find_under(&home)).unwrap_or_default()
}

/// The directories that Zotero has been told linked files are kept under.
/// A link to a file is then kept as a path from there.
pub(super) fn linked_file_bases() -> Vec<PathBuf> {
    let Some(home) = home() else { return Vec::new() };
    directories(&home, "extensions.zotero.baseAttachmentPath").into_iter().filter(|dir| dir.is_dir()).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn settings() {
        let prefs = "// Mozilla User Preferences\n\
            user_pref(\"extensions.zotero.dataDir\", \"/home/me/Skole/Zotero \\\"ny\\\"\");\n\
            user_pref(\"extensions.zotero.useDataDir\", true);\n\
            user_pref(\"extensions.zotero.baseAttachmentPath\", \"C:\\\\Users\\\\me\\\\B\\u00f8ker\");\n\
            user_pref(\"extensions.zotero.broken\", \"no end\n";
        assert_eq!(setting(prefs, "extensions.zotero.dataDir").as_deref(), Some("/home/me/Skole/Zotero \"ny\""));
        assert_eq!(setting(prefs, "extensions.zotero.baseAttachmentPath").as_deref(), Some("C:\\Users\\me\\Bøker"));
        assert_eq!(setting(prefs, "extensions.zotero.useDataDir"), None);
        assert_eq!(setting(prefs, "extensions.zotero.broken"), None);
        assert_eq!(setting(prefs, "extensions.zotero.absent"), None);
    }

    #[test]
    fn the_usual_places() {
        let home = tempfile::tempdir().unwrap();
        let data = |dir: &str| {
            let dir = home.path().join(dir);
            fs::create_dir_all(&dir).unwrap();
            fs::write(dir.join(DATABASE), b"").unwrap();
            dir
        };
        assert!(find_under(home.path()).is_empty());

        let usual = data("Zotero");
        let chosen = data("Dokumenter/Referanser");
        let old = data(".zotero/zotero/abcd1234.default/zotero");
        let snap = data("snap/zotero-snap/common/Zotero");
        // A directory without a database is not one of Zotero's.
        fs::create_dir_all(home.path().join(".var/app/org.zotero.Zotero/Zotero")).unwrap();
        fs::write(
            home.path().join(".zotero/zotero/abcd1234.default/prefs.js"),
            format!("user_pref(\"extensions.zotero.dataDir\", \"{}\");\n", chosen.display()),
        )
        .unwrap();
        assert_eq!(find_under(home.path()), vec![chosen.clone(), usual.clone(), snap, old]);

        // The usual place chosen by name is found once.
        fs::write(
            home.path().join(".zotero/zotero/abcd1234.default/prefs.js"),
            format!("user_pref(\"extensions.zotero.dataDir\", \"{}\");\n", usual.display()),
        )
        .unwrap();
        assert_eq!(find_under(home.path()).len(), 3);
    }
}
