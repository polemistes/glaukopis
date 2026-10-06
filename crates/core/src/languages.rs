//! Languages of spelling and of reading text in pictures (OCR) that are
//! imported, rather than coming with the application (ADR 0032).
//!
//! A language comes as a package: a zip file that holds a `manifest.json`,
//! which says what it is, and the files themselves; for spelling a
//! dictionary of Hunspell's (an `.aff` and a `.dic` file), for OCR the data
//! of a language for Tesseract (a `.traineddata` file); and the licences
//! that go with them. How a package is made is told in
//! `docs/language-packages.md`. A file without a manifest is taken as well:
//! a LibreOffice or Firefox extension of dictionaries (`.oxt`, `.xpi`), a
//! zip of dictionaries, the `.aff` and `.dic` of one, or a `.traineddata`.
//!
//! Packages are offered by a server, by default the project's own
//! ([`DEFAULT_SERVER`]), whose `index.json` lists them with their size and
//! their SHA-256, which what is fetched must match. The server may be
//! another, or a folder on the computer.
//!
//! What is imported is kept in the data directory, under `languages/`:
//!
//! ```text
//! languages/spelling/nb_NO.aff, nb_NO.dic, nb_NO.json
//! languages/ocr/nor.traineddata, nor.json
//! languages/licences/spelling-nb_NO/…, ocr-nor/…
//! languages/tessdata/      the data Tesseract is given (see `merge_tessdata`)
//! ```
//!
//! The `.json` beside each language is its manifest, as it was imported.
//! Spelling looks in `languages/spelling` after the writer's own folder and
//! before the dictionaries of the system; Tesseract, where any language is
//! imported, is given `languages/tessdata`, which holds the imported
//! languages and, linked, those it has by itself.

use std::collections::BTreeMap;
use std::ffi::OsString;
use std::fs;
use std::io::{Cursor, Read};
use std::path::{Path, PathBuf};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::error::{Error, IoContext, Result};
use crate::fsutil;
use crate::spelling::found;
use crate::tr;

/// Where packages are offered from, unless the settings say otherwise.
pub const DEFAULT_SERVER: &str = "https://robertemilberge.no/glaukopis/";

/// The name of the manifest within a package, and of the index on a server.
pub const MANIFEST: &str = "manifest.json";
pub const INDEX: &str = "index.json";

/// The most a package may hold, unpacked, and the most that is fetched.
const LIMIT: u64 = 400 * 1024 * 1024;

/// What a language is for.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Kind {
    Spelling,
    Ocr,
}

impl Kind {
    fn folder(self) -> &'static str {
        match self {
            Kind::Spelling => "spelling",
            Kind::Ocr => "ocr",
        }
    }

    /// The endings of the files of a language of the kind.
    fn endings(self) -> &'static [&'static str] {
        match self {
            Kind::Spelling => &["aff", "dic"],
            Kind::Ocr => &["traineddata"],
        }
    }
}

/// What a package says of itself in its `manifest.json`, and what is kept
/// beside a language that is imported.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Manifest {
    /// The version of the form of the manifest: 1.
    pub format: u32,
    pub kind: Option<Kind>,
    /// The language, as a tag of BCP 47: `nb-NO`, `en-GB`, `de`.
    pub language: String,
    /// The name its files are given: for spelling the name of the
    /// dictionary (`nb_NO`), for OCR Tesseract's name of the language
    /// (`nor`). Where none is said, it is taken from the files, or for
    /// spelling from the language.
    pub name: String,
    /// What the package is called, in the language itself: "Norsk bokmål".
    pub title: String,
    pub version: String,
    /// The licences of the files, as SPDX names them, where they can be.
    pub licence: String,
    /// Where the files were taken from.
    pub source: String,
}

/// A language that is imported.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Installed {
    pub kind: Kind,
    /// The name of its files: `nb_NO`, `nor`.
    pub name: String,
    pub language: String,
    pub title: String,
    pub version: String,
    pub licence: String,
    pub source: String,
}

/// A package a server offers.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Offered {
    pub kind: Kind,
    /// The name of its files when imported: `nb_NO`, `nor`.
    pub name: String,
    pub language: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub version: String,
    /// The package, relative to the server: `spelling-nb_NO-2026.10.06.zip`.
    pub file: String,
    pub size: u64,
    /// The SHA-256 of the package, in small hexadecimal letters.
    pub sha256: String,
    #[serde(default)]
    pub licence: String,
    #[serde(default)]
    pub source: String,
}

/// What a server offers: its `index.json`.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Index {
    pub format: u32,
    pub packages: Vec<Offered>,
}

/// Whether a name may name the files of a language: letters, digits, `_`
/// and `-`, as the names of dictionaries and of Tesseract's languages are.
fn good_name(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 64
        && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
        && !name.starts_with('-')
}

/// The name of a file without its folders, as a zip may give it with them.
fn base_name(path: &str) -> &str {
    path.rsplit(['/', '\\']).next().unwrap_or(path)
}

/// The ending of a file's name, in small letters.
fn ending(name: &str) -> String {
    name.rsplit_once('.').map(|(_, e)| e.to_ascii_lowercase()).unwrap_or_default()
}

fn stem(name: &str) -> &str {
    name.rsplit_once('.').map_or(name, |(s, _)| s)
}

/// Whether a file of a package is one of its licences, or says where it
/// came from, and goes along with it.
fn is_licence(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    ["licen", "copying", "readme", "authors", "notice", "copyright"].iter().any(|w| lower.contains(w))
}

/// The files of a package, by name, with what they hold; and its manifest.
#[derive(Default)]
struct Bundle {
    files: Vec<(String, Vec<u8>)>,
    manifest: Option<Manifest>,
}

impl Bundle {
    fn add(&mut self, name: &str, bytes: Vec<u8>) -> Result<()> {
        if name == MANIFEST {
            let manifest: Manifest = serde_json::from_slice(&bytes)
                .map_err(|e| Error::invalid(tr!("core-packages-manifest", message = e.to_string())))?;
            self.manifest = Some(manifest);
        } else {
            self.files.push((name.to_owned(), bytes));
        }
        Ok(())
    }

    /// The files of a zip, without their folders. A file of the same name
    /// in two folders is taken once, the first.
    fn from_zip(bytes: &[u8], file: &str) -> Result<Bundle> {
        let mut archive = zip::ZipArchive::new(Cursor::new(bytes))
            .map_err(|e| Error::invalid(tr!("core-packages-not-zip", file = file, message = e.to_string())))?;
        let mut bundle = Bundle::default();
        let mut total = 0u64;
        for i in 0..archive.len() {
            let mut entry = archive
                .by_index(i)
                .map_err(|e| Error::invalid(tr!("core-packages-not-zip", file = file, message = e.to_string())))?;
            if entry.is_dir() {
                continue;
            }
            let name = base_name(entry.name()).to_owned();
            if name.is_empty() || bundle.files.iter().any(|(n, _)| *n == name) {
                continue;
            }
            total += entry.size();
            if total > LIMIT {
                return Err(Error::invalid(tr!("core-packages-too-large", file = file)));
            }
            let mut content = Vec::with_capacity(entry.size().min(LIMIT) as usize);
            (&mut entry)
                .take(LIMIT)
                .read_to_end(&mut content)
                .map_err(|e| Error::invalid(tr!("core-packages-not-zip", file = file, message = e.to_string())))?;
            bundle.add(&name, content)?;
        }
        Ok(bundle)
    }
}

/// The languages imported into a data directory, and the importing of them.
#[derive(Debug, Clone)]
pub struct Languages {
    root: PathBuf,
}

impl Languages {
    /// The languages kept under a folder: `languages/` of the data directory.
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Languages { root: root.into() }
    }

    /// Where the languages of a kind are kept.
    pub fn dir(&self, kind: Kind) -> PathBuf {
        self.root.join(kind.folder())
    }

    /// The data Tesseract is given where any language for it is imported.
    pub fn tessdata(&self) -> PathBuf {
        self.root.join("tessdata")
    }

    fn licences(&self, kind: Kind, name: &str) -> PathBuf {
        self.root.join("licences").join(format!("{}-{name}", kind.folder()))
    }

    /// The languages that are imported, of both kinds, in the order of
    /// their kinds and names.
    pub fn installed(&self) -> Vec<Installed> {
        let mut out = Vec::new();
        for kind in [Kind::Spelling, Kind::Ocr] {
            let dir = self.dir(kind);
            let Ok(entries) = fs::read_dir(&dir) else { continue };
            let mut names: Vec<String> = entries
                .flatten()
                .filter_map(|e| e.file_name().into_string().ok())
                .filter(|n| ending(n) == kind.endings()[0])
                .map(|n| stem(&n).to_owned())
                .filter(|n| kind.endings().iter().all(|e| dir.join(format!("{n}.{e}")).is_file()))
                .collect();
            names.sort();
            for name in names {
                let manifest: Manifest = fs::read(dir.join(format!("{name}.json")))
                    .ok()
                    .and_then(|b| serde_json::from_slice(&b).ok())
                    .unwrap_or_default();
                let language = match kind {
                    _ if !manifest.language.is_empty() => manifest.language,
                    Kind::Spelling => found::tag_of_name(&name).unwrap_or_default(),
                    Kind::Ocr => String::new(),
                };
                out.push(Installed {
                    kind,
                    name,
                    language,
                    title: manifest.title,
                    version: manifest.version,
                    licence: manifest.licence,
                    source: manifest.source,
                });
            }
        }
        out
    }

    /// Whether any language for Tesseract is imported.
    pub fn has_ocr(&self) -> bool {
        self.installed().iter().any(|i| i.kind == Kind::Ocr)
    }

    /// Imports the files chosen: each zip (`.zip`, `.oxt`, `.xpi`) as a
    /// package of its own, and the other files together, so that the `.aff`
    /// and the `.dic` of a dictionary may be chosen side by side.
    pub fn import_paths(&self, paths: &[PathBuf]) -> Result<Vec<Installed>> {
        let mut loose = Bundle::default();
        let mut bundles = Vec::new();
        for path in paths {
            let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            let size = fs::metadata(path).context(|| tr!("io-reading", path = path))?.len();
            if size > LIMIT {
                return Err(Error::invalid(tr!("core-packages-too-large", file = &name)));
            }
            let bytes = fs::read(path).context(|| tr!("io-reading", path = path))?;
            if matches!(ending(&name).as_str(), "zip" | "oxt" | "xpi") {
                bundles.push(Bundle::from_zip(&bytes, &name)?);
            } else {
                loose.add(&name, bytes)?;
            }
        }
        if !loose.files.is_empty() {
            bundles.push(loose);
        }
        let mut installed = Vec::new();
        for bundle in bundles {
            installed.extend(self.install_bundle(bundle, None)?);
        }
        Ok(installed)
    }

    /// Imports a package that was fetched from a server, as the server
    /// offered it.
    pub fn install(&self, offered: &Offered, bytes: &[u8]) -> Result<Vec<Installed>> {
        let bundle = Bundle::from_zip(bytes, &offered.file)?;
        self.install_bundle(bundle, Some(offered))
    }

    fn install_bundle(&self, bundle: Bundle, offered: Option<&Offered>) -> Result<Vec<Installed>> {
        let Bundle { files, manifest } = bundle;
        let mut meta = manifest.clone().unwrap_or_default();
        if let Some(o) = offered {
            meta.kind = Some(o.kind);
            meta.language = o.language.clone();
            meta.name = o.name.clone();
            meta.title = if o.title.is_empty() { meta.title } else { o.title.clone() };
            meta.version = o.version.clone();
            meta.licence = if o.licence.is_empty() { meta.licence } else { o.licence.clone() };
            meta.source = if o.source.is_empty() { meta.source } else { o.source.clone() };
        }
        let licences: Vec<&(String, Vec<u8>)> = files.iter().filter(|(n, _)| is_licence(n)).collect();

        // The dictionaries: an .aff and a .dic of the same name.
        let mut pairs: Vec<(&str, &[u8], &[u8])> = files
            .iter()
            .filter(|(n, _)| ending(n) == "aff")
            .filter_map(|(n, aff)| {
                let s = stem(n);
                let dic = files.iter().find(|(m, _)| ending(m) == "dic" && stem(m) == s)?;
                Some((s, aff.as_slice(), dic.1.as_slice()))
            })
            .collect();
        pairs.sort_by(|a, b| a.0.cmp(b.0));
        let trained: Vec<(&str, &[u8])> =
            files.iter().filter(|(n, _)| ending(n) == "traineddata").map(|(n, b)| (stem(n), b.as_slice())).collect();

        let kind = match meta.kind {
            Some(kind) => kind,
            None if !pairs.is_empty() => Kind::Spelling,
            None if !trained.is_empty() => Kind::Ocr,
            None => return Err(Error::invalid(tr!("core-packages-nothing"))),
        };
        // A package that names its language holds one; one that does not may hold several.
        let one = |items: usize| (meta.name.is_empty() && meta.language.is_empty()) || items == 1;
        let mut installed = Vec::new();
        match kind {
            Kind::Spelling => {
                if pairs.is_empty() || !one(pairs.len()) {
                    return Err(Error::invalid(tr!("core-packages-nothing")));
                }
                for (file_stem, aff, dic) in &pairs {
                    let name = if !meta.name.is_empty() {
                        meta.name.clone()
                    } else if !meta.language.is_empty() {
                        meta.language.replace('-', "_")
                    } else {
                        (*file_stem).to_owned()
                    };
                    let Some(tag) = found::tag_of_name(&name).filter(|_| good_name(&name)) else {
                        return Err(Error::invalid(tr!("core-packages-bad-name", name = &name)));
                    };
                    let language = if meta.language.is_empty() { tag } else { meta.language.clone() };
                    let entry = Manifest { kind: Some(kind), language, name: name.clone(), format: 1, ..meta.clone() };
                    self.write(kind, &name, &[("aff", aff), ("dic", dic)], &entry, &licences)?;
                    installed.push(self.installed_one(kind, &name, entry));
                }
            }
            Kind::Ocr => {
                if trained.is_empty() || !one(trained.len()) {
                    return Err(Error::invalid(tr!("core-packages-nothing")));
                }
                for (file_stem, data) in &trained {
                    let name = if meta.name.is_empty() { (*file_stem).to_owned() } else { meta.name.clone() };
                    if !good_name(&name) {
                        return Err(Error::invalid(tr!("core-packages-bad-name", name = &name)));
                    }
                    let entry = Manifest { kind: Some(kind), name: name.clone(), format: 1, ..meta.clone() };
                    self.write(kind, &name, &[("traineddata", data)], &entry, &licences)?;
                    installed.push(self.installed_one(kind, &name, entry));
                }
            }
        }
        Ok(installed)
    }

    fn installed_one(&self, kind: Kind, name: &str, m: Manifest) -> Installed {
        Installed {
            kind,
            name: name.to_owned(),
            language: m.language,
            title: m.title,
            version: m.version,
            licence: m.licence,
            source: m.source,
        }
    }

    /// Writes the files of a language, its manifest and its licences. Each
    /// file is written whole before it takes the place of one before it.
    fn write(
        &self,
        kind: Kind,
        name: &str,
        files: &[(&str, &[u8])],
        manifest: &Manifest,
        licences: &[&(String, Vec<u8>)],
    ) -> Result<()> {
        let dir = self.dir(kind);
        fs::create_dir_all(&dir).context(|| tr!("io-creating", path = &dir))?;
        for (end, bytes) in files {
            if bytes.is_empty() {
                return Err(Error::invalid(tr!("core-packages-empty", file = format!("{name}.{end}"))));
            }
            fsutil::write_atomic(&dir.join(format!("{name}.{end}")), bytes)?;
        }
        let json = serde_json::to_vec_pretty(manifest)?;
        fsutil::write_atomic(&dir.join(format!("{name}.json")), &json)?;
        let to = self.licences(kind, name);
        if to.exists() {
            fs::remove_dir_all(&to).context(|| tr!("io-writing", path = &to))?;
        }
        if !licences.is_empty() {
            fs::create_dir_all(&to).context(|| tr!("io-creating", path = &to))?;
            for (file, bytes) in licences {
                let safe = fsutil::safe_file_name(file, "licence.txt");
                fsutil::write_atomic(&to.join(safe), bytes)?;
            }
        }
        Ok(())
    }

    /// Takes away a language that was imported.
    pub fn remove(&self, kind: Kind, name: &str) -> Result<()> {
        if !good_name(name) {
            return Err(Error::invalid(tr!("core-packages-bad-name", name = name)));
        }
        let dir = self.dir(kind);
        let mut any = false;
        for end in kind.endings().iter().copied().chain(["json"]) {
            let path = dir.join(format!("{name}.{end}"));
            if path.exists() {
                fs::remove_file(&path).context(|| tr!("io-writing", path = &path))?;
                any = true;
            }
        }
        let licences = self.licences(kind, name);
        if licences.exists() {
            fs::remove_dir_all(&licences).context(|| tr!("io-writing", path = &licences))?;
        }
        if !any {
            return Err(Error::not_found(name.to_owned()));
        }
        Ok(())
    }
}

/// Whether a server is on the network, as against a folder of this computer.
fn is_remote(server: &str) -> bool {
    let s = server.trim().to_ascii_lowercase();
    s.starts_with("https://") || s.starts_with("http://")
}

/// A folder named as a server: a path, or a `file://` address.
fn folder(server: &str) -> PathBuf {
    let s = server.trim();
    PathBuf::from(s.strip_prefix("file://").unwrap_or(s))
}

/// The address of a file on a server.
fn address(server: &str, file: &str) -> String {
    format!("{}/{}", server.trim().trim_end_matches('/'), file.trim_start_matches('/'))
}

/// The server packages are fetched from: the one the settings say, or the
/// project's own.
pub fn server(configured: Option<&str>) -> String {
    configured.map(str::trim).filter(|s| !s.is_empty()).unwrap_or(DEFAULT_SERVER).to_owned()
}

fn get(server: &str, file: &str, limit: u64) -> Result<Vec<u8>> {
    if !is_remote(server) {
        let path = folder(server).join(file);
        return fs::read(&path).context(|| tr!("io-reading", path = &path));
    }
    let url = address(server, file);
    let tls = ureq::tls::TlsConfig::builder().provider(ureq::tls::TlsProvider::NativeTls).build();
    let agent = ureq::Agent::config_builder()
        .tls_config(tls)
        .timeout_global(Some(Duration::from_secs(30 * 60)))
        .timeout_connect(Some(Duration::from_secs(15)))
        .http_status_as_error(false)
        .max_redirects(8)
        .build()
        .new_agent();
    let mut response = agent
        .get(&url)
        .header("User-Agent", &crate::net::user_agent(None))
        .call()
        .map_err(|e| Error::Network(tr!("core-packages-fetch-failed", url = &url, message = e.to_string())))?;
    let status = response.status().as_u16();
    if status != 200 {
        return Err(Error::Network(tr!("core-packages-fetch-status", url = &url, status = status)));
    }
    response
        .body_mut()
        .with_config()
        .limit(limit)
        .read_to_vec()
        .map_err(|e| Error::Network(tr!("core-packages-fetch-failed", url = &url, message = e.to_string())))
}

/// What a server offers.
pub fn index(server: &str) -> Result<Index> {
    let bytes = get(server, INDEX, 8 * 1024 * 1024)?;
    serde_json::from_slice(&bytes)
        .map_err(|e| Error::invalid(tr!("core-packages-index", server = server, message = e.to_string())))
}

/// Fetches a package a server offers, and makes sure it is what the server
/// said it is: of its size, with its SHA-256.
pub fn fetch(server: &str, offered: &Offered) -> Result<Vec<u8>> {
    if offered.file.contains("..") {
        return Err(Error::invalid(tr!("core-packages-bad-name", name = &offered.file)));
    }
    let bytes = get(server, &offered.file, LIMIT)?;
    let sum = hex(&Sha256::digest(&bytes));
    if (offered.size > 0 && bytes.len() as u64 != offered.size) || !sum.eq_ignore_ascii_case(offered.sha256.trim()) {
        return Err(Error::invalid(tr!("core-packages-checksum", file = &offered.file)));
    }
    Ok(bytes)
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

/// Makes `merged` hold what Tesseract is to read from: everything in the
/// folder of data it reads from by itself (`base`), its languages, its
/// configurations and its font, and the languages imported, which come
/// before those of the same name. On Linux and macOS each is a link; on
/// Windows a hard link where the file system allows it, else a copy. What
/// is there already, and right, is left as it is.
pub fn merge_tessdata(base: Option<&Path>, imported: &Path, merged: &Path) -> Result<()> {
    let mut wanted: BTreeMap<OsString, PathBuf> = BTreeMap::new();
    if let Some(base) = base.filter(|b| *b != merged)
        && let Ok(entries) = fs::read_dir(base)
    {
        for entry in entries.flatten() {
            wanted.insert(entry.file_name(), entry.path());
        }
    }
    if let Ok(entries) = fs::read_dir(imported) {
        for entry in entries.flatten() {
            if entry.path().extension().is_some_and(|e| e == "traineddata") {
                wanted.insert(entry.file_name(), entry.path());
            }
        }
    }
    fs::create_dir_all(merged).context(|| tr!("io-creating", path = merged))?;
    for entry in fs::read_dir(merged).context(|| tr!("io-reading", path = merged))?.flatten() {
        let target = entry.path();
        let keep = wanted.get(&entry.file_name()).is_some_and(|source| placed(source, &target));
        if !keep {
            clear(&target)?;
        }
    }
    for (name, source) in &wanted {
        let target = merged.join(name);
        if fs::symlink_metadata(&target).is_ok() {
            continue;
        }
        place(source, &target)?;
    }
    Ok(())
}

/// Whether what stands in the merged folder is what is wanted there.
fn placed(source: &Path, target: &Path) -> bool {
    #[cfg(unix)]
    {
        fs::read_link(target).is_ok_and(|to| to == source)
    }
    #[cfg(not(unix))]
    {
        match (fs::metadata(source), fs::metadata(target)) {
            (Ok(s), Ok(t)) if s.is_dir() => t.is_dir(),
            (Ok(s), Ok(t)) => t.is_file() && s.len() == t.len(),
            _ => false,
        }
    }
}

fn clear(target: &Path) -> Result<()> {
    let meta = fs::symlink_metadata(target).context(|| tr!("io-reading", path = target))?;
    let result = if meta.is_dir() { fs::remove_dir_all(target) } else { fs::remove_file(target) };
    result.context(|| tr!("io-writing", path = target))
}

fn place(source: &Path, target: &Path) -> Result<()> {
    #[cfg(unix)]
    {
        std::os::unix::fs::symlink(source, target).context(|| tr!("io-writing", path = target))
    }
    #[cfg(not(unix))]
    {
        if source.is_dir() {
            fs::create_dir_all(target).context(|| tr!("io-creating", path = target))?;
            for entry in fs::read_dir(source).context(|| tr!("io-reading", path = source))?.flatten() {
                place(&entry.path(), &target.join(entry.file_name()))?;
            }
            Ok(())
        } else if fs::hard_link(source, target).is_ok() {
            Ok(())
        } else {
            fs::copy(source, target).map(|_| ()).context(|| tr!("io-writing", path = target))
        }
    }
}

#[cfg(test)]
mod tests;
