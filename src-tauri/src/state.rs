//! What the application holds while it runs.

use std::path::PathBuf;
use std::sync::{Mutex, MutexGuard, RwLock};

use glaukopis_core::export::Tools;
use glaukopis_core::export::tools::{self, Configured};
use glaukopis_core::formats::Formats;
use glaukopis_core::import::zotero::ZoteroCopy;
use glaukopis_core::library::Library;
use glaukopis_core::net::Client;
use glaukopis_core::ocr;
use glaukopis_core::paths::{Claim, DataDir};
use glaukopis_core::projects::Projects;
use glaukopis_core::settings;
use glaukopis_core::spelling::Spelling;
use glaukopis_core::styles::Styles;
use glaukopis_core::templates::Templates;

pub struct AppState {
    pub data: DataDir,
    /// Held while the application runs, so that no other works in the same data.
    _claim: Claim,
    pub projects: Projects,
    /// The store of pictures.
    /// What comes with the application: styles, formats, filters.
    pub resources: PathBuf,
    pub styles: Styles,
    pub formats: Formats,
    pub templates: Templates,
    /// The dictionaries, and the writer's own words.
    pub spelling: Spelling,
    library: Mutex<Library>,
    tools: RwLock<Tools>,
    /// One preview or sample is made at a time: they share a place to work in.
    pub making: Mutex<()>,
    /// And one file, beside them, in a place of its own.
    pub exporting: Mutex<()>,
    /// The copies of Zotero's databases that the dialog of Zotero reads,
    /// each by the path it was asked for: made once while the dialog is
    /// open, for every step of it, and removed when it closes.
    zotero: Mutex<Vec<(PathBuf, ZoteroCopy)>>,
    /// The last reading of a PDF into elements, kept so that what is made
    /// of it can be changed without reading the file again: one at a time,
    /// a new reading taking its place, until it is let go.
    pub reading: Mutex<Option<KeptReading>>,
}

/// A reading of a PDF into elements, kept under a token of its own: the
/// file's name, the title it was given, and what was read.
pub struct KeptReading {
    pub token: String,
    pub file: String,
    pub title: String,
    pub read: ocr::ReadPdf,
}

/// Where the resources are: where the environment says, where the
/// application was installed, or, while it is being developed, in the
/// repository.
pub fn find_resources(installed: Option<PathBuf>) -> PathBuf {
    if let Some(dir) = std::env::var_os("GLAUKOPIS_RESOURCES").filter(|v| !v.is_empty()) {
        return PathBuf::from(dir);
    }
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Some(dir) = installed {
        candidates.push(dir.join("resources"));
        candidates.push(dir);
    }
    if let Ok(exe) = std::env::current_exe()
        && let Some(dir) = exe.parent()
    {
        candidates.push(dir.join("resources"));
        // Where a package of the system puts them: /usr/share/glaukopis.
        candidates.push(dir.join("../share/glaukopis/resources"));
    }
    // While the application is being developed: in the repository. Left out
    // of what is released, which should not know where it was built.
    #[cfg(debug_assertions)]
    candidates.push(std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../resources"));
    candidates
        .iter()
        .find(|c| c.join("csl").join("index.json").is_file())
        .cloned()
        .unwrap_or_else(|| candidates[0].clone())
}

/// Where the copies of Zotero's databases are made.
fn zotero_copies(data: &DataDir) -> PathBuf {
    data.work().join("zotero")
}

impl AppState {
    pub fn open(data: DataDir, claim: Claim, installed_resources: Option<PathBuf>) -> glaukopis_core::Result<Self> {
        let mut library = Library::open(&data)?;
        for w in &library.warnings {
            tracing::warn!("library: {w}");
        }
        tracing::info!(entries = library.len(), "library read");
        let projects = Projects::new(&data);
        // Images were once kept in a store of their own, and before that by
        // each project: they are taken into the library, once (ADR 0070).
        let of_projects = projects.picture_directories();
        if data.pictures().exists() || !of_projects.is_empty() {
            match library.take_in_pictures(&data.pictures(), &of_projects) {
                Ok(done) => {
                    if done.moved + done.same > 0 {
                        tracing::info!(
                            moved = done.moved,
                            same = done.same,
                            aside = ?done.aside,
                            "the images of the store of pictures taken into the library"
                        );
                    }
                    for problem in &done.problems {
                        tracing::warn!("{problem}");
                    }
                }
                Err(error) => {
                    tracing::warn!(%error, "the store of pictures could not be taken into the library; it is left as it was")
                }
            }
        }
        let resources = find_resources(installed_resources);
        tracing::info!(resources = %resources.display(), "resources");
        let styles = Styles::new(&resources, &data.styles());
        let formats = Formats::new(&resources, &data.formats());
        let templates = Templates::new(&resources, &data.templates());
        let spelling = Spelling::open(&data, &resources);
        // Copies of Zotero's databases that a run which ended without
        // closing its dialog left behind.
        match std::fs::remove_dir_all(zotero_copies(&data)) {
            Err(error) if error.kind() != std::io::ErrorKind::NotFound => {
                tracing::warn!(%error, "copies of Zotero's databases left behind could not be removed")
            }
            _ => {}
        }
        let state = AppState {
            projects,
            resources,
            styles,
            formats,
            templates,
            spelling,
            library: Mutex::new(library),
            tools: RwLock::new(Tools::default()),
            making: Mutex::new(()),
            exporting: Mutex::new(()),
            zotero: Mutex::new(Vec::new()),
            reading: Mutex::new(None),
            data,
            _claim: claim,
        };
        state.discover_tools();
        Ok(state)
    }

    /// The library. A panic while it was held does not make it unusable: the
    /// file on disk is always whole, and is read again when it has changed.
    pub fn library(&self) -> MutexGuard<'_, Library> {
        self.library.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
    }

    /// The library behind its lock, for what holds it only while it looks a
    /// file up or keeps one: the sync of a shared project's images, which
    /// talks to a server between.
    pub fn library_lock(&self) -> &Mutex<Library> {
        &self.library
    }

    /// Runs `work` on the copy of the Zotero database at `path` (its data
    /// directory, or the database in it), made when there is none yet or
    /// Zotero has changed its database since. The copies are made in the
    /// application's own folder for work, on the disk, and not in the
    /// system's temporary directory, which is often held in memory: a
    /// database of Zotero may be larger than a gigabyte.
    pub fn with_zotero<T>(
        &self,
        path: &std::path::Path,
        work: impl FnOnce(&mut ZoteroCopy) -> glaukopis_core::Result<T>,
    ) -> glaukopis_core::Result<T> {
        let mut copies = self.zotero.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
        if let Some(at) = copies.iter().position(|(asked, copy)| asked == path || copy.dir() == path) {
            if copies[at].1.is_current() {
                return work(&mut copies[at].1);
            }
            tracing::info!(path = %path.display(), "Zotero changed its database since it was copied: it is copied anew");
            copies.remove(at);
        }
        let mut copy = ZoteroCopy::open(path, &zotero_copies(&self.data))?;
        let done = work(&mut copy);
        copies.push((path.to_owned(), copy));
        done
    }

    /// Removes the copies of Zotero's databases: the dialog that read them
    /// is closed, or the application ends.
    pub fn zotero_done(&self) {
        self.zotero.lock().unwrap_or_else(|poisoned| poisoned.into_inner()).clear();
    }

    pub fn setting(&self, key: &str) -> Option<String> {
        settings::load(&self.data.settings_file()).ok().and_then(|s| settings::string(&s, key))
    }

    /// Looks for Pandoc, Typst and Tesseract, where the settings say first.
    pub fn discover_tools(&self) -> Tools {
        let mut beside = Vec::new();
        if let Ok(exe) = std::env::current_exe()
            && let Some(dir) = exe.parent()
        {
            beside.push(dir.to_owned());
            beside.push(dir.join("bin"));
        }
        beside.push(self.resources.join("bin"));
        // Tesseract comes with its libraries and data in a folder of its own.
        beside.push(self.resources.join("bin").join("tesseract"));
        // A program started from the Finder has not the path of the shell,
        // and misses what Homebrew installs.
        if cfg!(target_os = "macos") {
            beside.push("/opt/homebrew/bin".into());
            beside.push("/usr/local/bin".into());
        }
        let found = tools::discover(&Configured {
            pandoc: self.setting("pandocPath"),
            tesseract: self.setting("tesseractPath"),
            beside,
            languages: Some(self.languages()),
        });
        tracing::info!(
            pandoc = found.pandoc.as_ref().map(|t| t.version.as_str()).unwrap_or("not found"),
            tesseract = found.tesseract.as_ref().map(|t| t.version.as_str()).unwrap_or("not found"),
            "programs"
        );
        *self.tools.write().unwrap_or_else(|p| p.into_inner()) = found.clone();
        found
    }

    /// The languages of spelling and of OCR that are imported (ADR 0032).
    pub fn languages(&self) -> glaukopis_core::languages::Languages {
        glaukopis_core::languages::Languages::new(self.data.languages())
    }

    pub fn tools(&self) -> Tools {
        self.tools.read().unwrap_or_else(|p| p.into_inner()).clone()
    }

    /// The families of the fonts Typst sets with: found once; it takes a moment.
    pub fn fonts(&self) -> Vec<String> {
        glaukopis_core::export::typeset::families()
    }

    /// A client for the network. It names the program, never the user.
    pub fn client(&self) -> Client {
        Client::new()
    }
}
