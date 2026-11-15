//! Firefox set up to start the helper (`host`) for this user: a small file,
//! the native manifest, that names the helper, the program to start, and
//! the plugin that may start it.
//!
//! Where Firefox looks for it, for one user: on Linux in
//! `~/.mozilla/native-messaging-hosts/` (a Firefox in a Snap looks there
//! too), on the Mac in `~/Library/Application Support/Mozilla/NativeMessagingHosts/`;
//! on Windows the file may be anywhere, and a key of the registry,
//! `HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\org.glaukopis.notebook`,
//! holds its path as its default value: the file is kept in a folder of the
//! application's own, beside its settings (`%APPDATA%\glaukopis-native-messaging-hosts`). `GLAUKOPIS_FIREFOX_HOSTS_DIR`,
//! where it is set, is the folder, and nothing else is written or read:
//! no key of the registry either.

use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::tr;

/// The helper's name to Firefox.
pub const HOST_NAME: &str = "org.glaukopis.notebook";
/// The file that tells Firefox of the helper.
pub const MANIFEST_FILE: &str = "org.glaukopis.notebook.json";
/// The plugin's id, the one plugin that may start the helper.
pub const EXTENSION_ID: &str = "notebook@glaukopis";
/// The variable that says where the file is written and read instead.
pub const HOSTS_DIR_VARIABLE: &str = "GLAUKOPIS_FIREFOX_HOSTS_DIR";

/// What is shown of the helper, by Firefox's own question in a Snap: one plain English line.
const DESCRIPTION: &str = "Glaukopis: takes what the Glaukopis plugin collects into the notebook";
/// The key of the registry on Windows.
const REGISTRY_KEY: &str = r"HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\org.glaukopis.notebook";

/// Whether Firefox is set up to start the helper for this user.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Setup {
    /// Whether the file is there and names this program.
    pub installed: bool,
    /// Where the file is, or would be.
    pub manifest: String,
    /// The program it names where it names another than this one.
    pub other: Option<String>,
}

/// The file as Firefox reads it.
#[derive(Debug, Serialize, Deserialize)]
struct Manifest {
    name: String,
    #[serde(default)]
    description: String,
    path: String,
    #[serde(rename = "type")]
    kind: String,
    #[serde(default)]
    allowed_extensions: Vec<String>,
}

/// The file in `dir`.
pub fn manifest_path(dir: &Path) -> PathBuf {
    dir.join(MANIFEST_FILE)
}

/// Whether the file in `dir` is there and names `exe`; and the program it
/// names where that is another.
pub fn state(dir: &Path, exe: &Path) -> Setup {
    let path = manifest_path(dir);
    let manifest = path.display().to_string();
    let named = fs::read(&path).ok().and_then(|bytes| serde_json::from_slice::<Manifest>(&bytes).ok());
    match named {
        Some(named) if named.name == HOST_NAME => {
            let this = same_program(Path::new(&named.path), exe)
                && named.allowed_extensions.iter().any(|id| id == EXTENSION_ID);
            Setup { installed: this, manifest, other: (!this).then_some(named.path) }
        }
        _ => Setup { installed: false, manifest, other: None },
    }
}

/// Whether two paths are of one program.
fn same_program(a: &Path, b: &Path) -> bool {
    a == b || matches!((a.canonicalize(), b.canonicalize()), (Ok(a), Ok(b)) if a == b)
}

/// Writes the file into `dir`, made where it is not there, naming `exe`.
pub fn set_up(dir: &Path, exe: &Path) -> Result<Setup> {
    let manifest = Manifest {
        name: HOST_NAME.into(),
        description: DESCRIPTION.into(),
        path: exe.display().to_string(),
        kind: "stdio".into(),
        allowed_extensions: vec![EXTENSION_ID.into()],
    };
    let bytes = serde_json::to_vec_pretty(&manifest)?;
    fs::create_dir_all(dir).context(|| tr!("io-creating", path = dir))?;
    write_atomic(&manifest_path(dir), &bytes)?;
    Ok(state(dir, exe))
}

/// Removes the file from `dir`; one not there is gone already.
pub fn remove(dir: &Path) -> Result<()> {
    let path = manifest_path(dir);
    match fs::remove_file(&path) {
        Err(e) if e.kind() != std::io::ErrorKind::NotFound => Err(Error::io(tr!("io-removing", path = &path), e)),
        _ => Ok(()),
    }
}

/// Where the file is for this user, and whether a key of the registry
/// points to it (on Windows, where the variable does not say the folder).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Place {
    pub dir: PathBuf,
    pub registry: bool,
}

impl Place {
    /// The place of this user on this system, or the folder the variable names.
    pub fn of_this_user() -> Place {
        if let Some(dir) = std::env::var_os(HOSTS_DIR_VARIABLE).filter(|v| !v.is_empty()) {
            return Place { dir: PathBuf::from(dir), registry: false };
        }
        Place::of_the_system()
    }

    /// Where Firefox looks on this system.
    fn of_the_system() -> Place {
        if cfg!(target_os = "windows") {
            // Beside the settings, not in their folder: on Windows that is
            // the usual data folder, which a move of the data takes away.
            let dir = crate::paths::settings_place().with_file_name("glaukopis-native-messaging-hosts");
            Place { dir, registry: true }
        } else if cfg!(target_os = "macos") {
            let dir = home().join("Library").join("Application Support").join("Mozilla").join("NativeMessagingHosts");
            Place { dir, registry: false }
        } else {
            Place { dir: home().join(".mozilla").join("native-messaging-hosts"), registry: false }
        }
    }

    /// Whether Firefox is set up here to start `exe`. On Windows the key
    /// must point to the file as well.
    pub fn state(&self, exe: &Path) -> Setup {
        let mut setup = state(&self.dir, exe);
        if self.registry && setup.installed {
            let pointed = registered().is_some_and(|path| same_program(&path, &manifest_path(&self.dir)));
            setup.installed = pointed;
        }
        setup
    }

    /// Writes the file naming `exe`, and on Windows the key that points to it.
    pub fn set_up(&self, exe: &Path) -> Result<Setup> {
        set_up(&self.dir, exe)?;
        if self.registry {
            register(&manifest_path(&self.dir))?;
        }
        Ok(self.state(exe))
    }

    /// Removes the file, and on Windows the key.
    pub fn remove(&self, exe: &Path) -> Result<Setup> {
        if self.registry {
            unregister()?;
        }
        remove(&self.dir)?;
        Ok(self.state(exe))
    }
}

/// The program as Firefox is to start it: this one, or, in an AppImage,
/// the AppImage itself, since the program inside is mounted at another
/// place each time it runs.
pub fn this_program(exe: PathBuf) -> PathBuf {
    std::env::var_os("APPIMAGE")
        .filter(|v| !v.is_empty())
        .map(PathBuf::from)
        .filter(|image| image.is_absolute() && image.is_file())
        .unwrap_or(exe)
}

fn home() -> PathBuf {
    let var = if cfg!(target_os = "windows") { "USERPROFILE" } else { "HOME" };
    std::env::var_os(var).map(PathBuf::from).unwrap_or_else(|| PathBuf::from("."))
}

/// `reg`, with no window of its own.
fn reg() -> std::process::Command {
    crate::export::tools::command(Path::new("reg"))
}

/// Writes the key of the registry that points to the file (Windows).
fn register(manifest: &Path) -> Result<()> {
    let value = manifest.display().to_string();
    let out = reg()
        .args(["add", REGISTRY_KEY, "/ve", "/t", "REG_SZ", "/d", &value, "/f"])
        .output()
        .map_err(|e| Error::io(tr!("io-writing", path = REGISTRY_KEY), e))?;
    if !out.status.success() {
        let said = String::from_utf8_lossy(&out.stderr);
        return Err(Error::invalid(format!("{}: {}", tr!("io-writing", path = REGISTRY_KEY), said.trim())));
    }
    Ok(())
}

/// Removes the key (Windows); one not there is gone already.
fn unregister() -> Result<()> {
    if registered().is_none() {
        return Ok(());
    }
    let out = reg()
        .args(["delete", REGISTRY_KEY, "/f"])
        .output()
        .map_err(|e| Error::io(tr!("io-removing", path = REGISTRY_KEY), e))?;
    if !out.status.success() {
        let said = String::from_utf8_lossy(&out.stderr);
        return Err(Error::invalid(format!("{}: {}", tr!("io-removing", path = REGISTRY_KEY), said.trim())));
    }
    Ok(())
}

/// The path the key holds, where it is there (Windows).
fn registered() -> Option<PathBuf> {
    let out = reg().args(["query", REGISTRY_KEY, "/ve"]).output().ok()?;
    if !out.status.success() {
        return None;
    }
    default_value(&String::from_utf8_lossy(&out.stdout))
}

/// The default value in what `reg query <key> /ve` prints: a line of the
/// name (localised, so not read), the type, and the value after it.
fn default_value(printed: &str) -> Option<PathBuf> {
    printed.lines().find_map(|line| {
        let (_, after) = line.split_once("REG_SZ")?;
        let value = after.trim();
        (!value.is_empty()).then(|| PathBuf::from(value))
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_file_is_written_read_back_as_installed_and_removed() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("mozilla").join("native-messaging-hosts");
        let exe = tmp.path().join("bin").join("glaukopis");
        let before = state(&dir, &exe);
        assert_eq!(
            before,
            Setup { installed: false, manifest: manifest_path(&dir).display().to_string(), other: None }
        );

        let setup = set_up(&dir, &exe).unwrap();
        assert!(setup.installed);
        assert_eq!(setup.other, None);
        assert!(dir.join(MANIFEST_FILE).is_file(), "the folder was made");

        remove(&dir).unwrap();
        assert!(!state(&dir, &exe).installed);
        assert!(!dir.join(MANIFEST_FILE).exists());
        remove(&dir).unwrap();
    }

    #[test]
    fn the_file_is_as_firefox_wants_it() {
        let tmp = tempfile::tempdir().unwrap();
        let exe = tmp.path().join("glaukopis");
        set_up(tmp.path(), &exe).unwrap();
        let written: serde_json::Value =
            serde_json::from_slice(&fs::read(tmp.path().join("org.glaukopis.notebook.json")).unwrap()).unwrap();
        assert_eq!(
            written,
            serde_json::json!({
                "name": "org.glaukopis.notebook",
                "description": DESCRIPTION,
                "path": exe.display().to_string(),
                "type": "stdio",
                "allowed_extensions": ["notebook@glaukopis"],
            })
        );
        assert!(Path::new(written["path"].as_str().unwrap()).is_absolute());
        assert!(!DESCRIPTION.contains('\n'));
    }

    #[test]
    fn another_program_named_is_told() {
        let tmp = tempfile::tempdir().unwrap();
        let older = tmp.path().join("old").join("glaukopis");
        let this = tmp.path().join("new").join("glaukopis");
        set_up(tmp.path(), &older).unwrap();
        let setup = state(tmp.path(), &this);
        assert!(!setup.installed);
        assert_eq!(setup.other.as_deref(), Some(older.display().to_string().as_str()));
        let setup = set_up(tmp.path(), &this).unwrap();
        assert!(setup.installed && setup.other.is_none(), "written again, it names this one");
    }

    #[test]
    fn a_file_of_another_helper_or_none_that_can_be_read_is_not_installed() {
        let tmp = tempfile::tempdir().unwrap();
        let exe = tmp.path().join("glaukopis");
        fs::write(manifest_path(tmp.path()), "{ not json").unwrap();
        assert!(!state(tmp.path(), &exe).installed);
        let other = serde_json::json!({"name": "org.other", "path": exe, "type": "stdio", "allowed_extensions": [EXTENSION_ID]});
        fs::write(manifest_path(tmp.path()), other.to_string()).unwrap();
        assert_eq!(
            state(tmp.path(), &exe),
            Setup { installed: false, manifest: manifest_path(tmp.path()).display().to_string(), other: None }
        );
    }

    #[test]
    fn the_variable_says_the_folder_and_no_key() {
        // Read as the scripts set it; not set by a test, which would reach
        // the others running at the same time.
        let place = Place::of_this_user();
        if let Some(dir) = std::env::var_os(HOSTS_DIR_VARIABLE).filter(|v| !v.is_empty()) {
            assert_eq!(place, Place { dir: PathBuf::from(dir), registry: false });
        } else if cfg!(target_os = "linux") {
            assert!(place.dir.ends_with(".mozilla/native-messaging-hosts"));
            assert!(!place.registry);
        }
    }

    #[test]
    fn the_default_value_is_read_from_what_reg_prints() {
        let printed = "\r\nHKEY_CURRENT_USER\\SOFTWARE\\Mozilla\\NativeMessagingHosts\\org.glaukopis.notebook\r\n    (Standard)    REG_SZ    C:\\Users\\A B\\AppData\\Roaming\\glaukopis\\native-messaging-hosts\\org.glaukopis.notebook.json\r\n\r\n";
        assert_eq!(
            default_value(printed),
            Some(PathBuf::from(
                r"C:\Users\A B\AppData\Roaming\glaukopis\native-messaging-hosts\org.glaukopis.notebook.json"
            ))
        );
        assert_eq!(default_value("    (Default)    REG_SZ    \r\n"), None);
        assert_eq!(default_value("ERROR: nothing"), None);
    }
}
