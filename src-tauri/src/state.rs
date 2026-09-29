//! What the application holds while it runs.

use std::path::PathBuf;
use std::sync::{Mutex, MutexGuard, RwLock};

use glaukopis_core::export::Tools;
use glaukopis_core::export::tools::{self, Configured};
use glaukopis_core::formats::Formats;
use glaukopis_core::library::Library;
use glaukopis_core::net::Client;
use glaukopis_core::paths::DataDir;
use glaukopis_core::pictures::Pictures;
use glaukopis_core::projects::Projects;
use glaukopis_core::settings;
use glaukopis_core::styles::Styles;

pub struct AppState {
    pub data: DataDir,
    pub projects: Projects,
    /// The store of pictures.
    pub pictures: Pictures,
    /// What comes with the application: styles, formats, filters.
    pub resources: PathBuf,
    pub styles: Styles,
    pub formats: Formats,
    library: Mutex<Library>,
    tools: RwLock<Tools>,
    fonts: RwLock<Option<Vec<String>>>,
    /// One document is made at a time: they share a place to work in.
    pub making: Mutex<()>,
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

impl AppState {
    pub fn open(installed_resources: Option<PathBuf>) -> glaukopis_core::Result<Self> {
        let data = DataDir::open_default()?;
        let library = Library::open(&data)?;
        for w in &library.warnings {
            tracing::warn!("library: {w}");
        }
        tracing::info!(entries = library.len(), "library read");
        let projects = Projects::new(&data);
        let pictures = Pictures::open(data.pictures())?;
        // Projects once kept their pictures by themselves: the store takes them in.
        let taken: usize = projects.picture_directories().iter().map(|dir| pictures.adopt(dir)).sum();
        if taken > 0 {
            tracing::info!(pictures = taken, "pictures of projects taken into the store");
        }
        tracing::info!(pictures = pictures.list().len(), "store of pictures read");
        let resources = find_resources(installed_resources);
        tracing::info!(resources = %resources.display(), "resources");
        let styles = Styles::new(&resources, &data.styles());
        let formats = Formats::new(&resources, &data.formats());
        let state = AppState {
            projects,
            pictures,
            resources,
            styles,
            formats,
            library: Mutex::new(library),
            tools: RwLock::new(Tools::default()),
            fonts: RwLock::new(None),
            making: Mutex::new(()),
            data,
        };
        state.discover_tools();
        Ok(state)
    }

    /// The library. A panic while it was held does not make it unusable: the
    /// file on disk is always whole, and is read again when it has changed.
    pub fn library(&self) -> MutexGuard<'_, Library> {
        self.library.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
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
        let found = tools::discover(&Configured {
            pandoc: self.setting("pandocPath"),
            typst: self.setting("typstPath"),
            tesseract: self.setting("tesseractPath"),
            beside,
        });
        tracing::info!(
            pandoc = found.pandoc.as_ref().map(|t| t.version.as_str()).unwrap_or("not found"),
            typst = found.typst.as_ref().map(|t| t.version.as_str()).unwrap_or("not found"),
            tesseract = found.tesseract.as_ref().map(|t| t.version.as_str()).unwrap_or("not found"),
            "programs"
        );
        *self.tools.write().unwrap_or_else(|p| p.into_inner()) = found.clone();
        *self.fonts.write().unwrap_or_else(|p| p.into_inner()) = None;
        found
    }

    pub fn tools(&self) -> Tools {
        self.tools.read().unwrap_or_else(|p| p.into_inner()).clone()
    }

    /// The fonts Typst finds. Asked for once; it takes a moment.
    pub fn fonts(&self) -> Vec<String> {
        if let Some(list) = self.fonts.read().unwrap_or_else(|p| p.into_inner()).as_ref() {
            return list.clone();
        }
        let list = self.tools().typst.as_ref().map(tools::fonts).unwrap_or_default();
        *self.fonts.write().unwrap_or_else(|p| p.into_inner()) = Some(list.clone());
        list
    }

    /// A client for the network that names the address the user has given.
    pub fn client(&self) -> Client {
        Client::new(self.setting("contactEmail").as_deref())
    }
}
