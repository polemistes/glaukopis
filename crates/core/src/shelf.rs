//! A shelf of things kept as JSON files, one to a file: those that come with
//! the application in a directory of the resources, and the user's own in a
//! directory of their data, which are preferred under the same id. Layouts
//! (formats) and templates are kept so; what is common to keeping them is
//! here, and each says only how one of its files is read, how it ranks, and
//! what its messages are.

use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;

use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::tr;

/// What a shelf holds.
pub(crate) trait Shelved: Serialize + Sized {
    /// What a thing of this sort is called in the log, as "a format".
    const CALLED: &'static str;

    /// One that comes with the application, read from its file.
    fn read_bundled(shelf: &Shelf, path: &Path) -> Result<Self>;
    /// One of the user's own, read from its file and marked as their own.
    fn read_own(path: &Path) -> Result<Self>;

    fn id(&self) -> &str;
    fn set_id(&mut self, id: String);
    fn name_mut(&mut self) -> &mut String;
    fn based_on_mut(&mut self) -> &mut Option<String>;
    /// Marks it as the user's own and puts right what it says, before it is
    /// saved.
    fn readied_as_own(&mut self);
    /// Where it stands in a list, before its name: the user's own first.
    fn rank(&self) -> u8;
    fn name(&self) -> &str;

    fn bad_id(id: &str) -> Error;
    fn needs_name() -> Error;
    fn own_only() -> Error;
    fn not_found(id: &str) -> Error;
}

pub(crate) struct Shelf {
    pub bundled: PathBuf,
    pub own: PathBuf,
}

/// The id a file gives what it holds when that does not say: its name
/// without `.json`.
pub(crate) fn stem(path: &Path) -> String {
    path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default()
}

/// An id is a name of a file in one directory: letters, digits, `-` and
/// `_`, not beginning with `-`, so that nothing reaches outside it.
fn id_is_good(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 80
        && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
        && !id.starts_with('-')
}

impl Shelf {
    pub fn new(bundled: PathBuf, own: &Path) -> Self {
        Shelf { bundled, own: own.to_owned() }
    }

    pub fn check_id<T: Shelved>(id: &str) -> Result<()> {
        if id_is_good(id) { Ok(()) } else { Err(T::bad_id(id)) }
    }

    pub fn bundled_path(&self, id: &str) -> PathBuf {
        self.bundled.join(format!("{id}.json"))
    }

    fn own_path(&self, id: &str) -> PathBuf {
        self.own.join(format!("{id}.json"))
    }

    /// All there are, each with whether it is the user's own, in the order
    /// of their rank and then of their names. A file that cannot be read is
    /// left out and said in the log.
    pub fn all<T: Shelved>(&self) -> Vec<(T, bool)> {
        let mut out = Vec::new();
        for (dir, own) in [(&self.bundled, false), (&self.own, true)] {
            let Ok(entries) = fs::read_dir(dir) else { continue };
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().is_none_or(|e| e != "json") {
                    continue;
                }
                let read = if own { T::read_own(&path) } else { T::read_bundled(self, &path) };
                match read {
                    Ok(t) => out.push((t, own)),
                    Err(e) => tracing::warn!(%e, path = %path.display(), "{} could not be read", T::CALLED),
                }
            }
        }
        out.sort_by(|a, b| a.0.rank().cmp(&b.0.rank()).then(a.0.name().to_lowercase().cmp(&b.0.name().to_lowercase())));
        out
    }

    /// The one with an id. The user's own is preferred to one that comes
    /// with the application under the same id.
    pub fn get<T: Shelved>(&self, id: &str) -> Result<T> {
        Self::check_id::<T>(id)?;
        let own = self.own_path(id);
        if own.is_file() {
            return T::read_own(&own);
        }
        let bundled = self.bundled_path(id);
        if bundled.is_file() {
            return T::read_bundled(self, &bundled);
        }
        Err(T::not_found(id))
    }

    /// The one with an id, or else the one with the id that stands in for
    /// all, or else what `last` makes when even that cannot be had.
    pub fn get_or<T: Shelved>(&self, id: &str, standing_in: &str, last: impl FnOnce() -> T) -> T {
        self.get(id).or_else(|_| self.get(standing_in)).unwrap_or_else(|_| last())
    }

    /// Saves one as the user's own, and returns it as saved. A new one, or
    /// one made from one that comes with the application, gets an id of its
    /// name that neither directory has yet, and remembers what it came from.
    pub fn save<T: Shelved>(&self, mut thing: T) -> Result<T> {
        let name = thing.name_mut();
        *name = name.split_whitespace().collect::<Vec<_>>().join(" ");
        if name.is_empty() {
            return Err(T::needs_name());
        }
        if thing.id().is_empty() || self.bundled_path(thing.id()).is_file() {
            let base = crate::formats::slug(thing.name());
            let mut id = base.clone();
            let mut n = 2;
            while self.own_path(&id).exists() || self.bundled_path(&id).exists() {
                id = format!("{base}-{n}");
                n += 1;
            }
            if !thing.id().is_empty() && thing.based_on_mut().is_none() {
                let from = thing.id().to_owned();
                *thing.based_on_mut() = Some(from);
            }
            thing.set_id(id);
        }
        Self::check_id::<T>(thing.id())?;
        thing.readied_as_own();
        write_atomic(&self.own_path(thing.id()), serde_json::to_string_pretty(&thing)?.as_bytes())?;
        Ok(thing)
    }

    /// Removes one of the user's own. One that comes with the application
    /// cannot be removed.
    pub fn delete<T: Shelved>(&self, id: &str) -> Result<()> {
        Self::check_id::<T>(id)?;
        let path = self.own_path(id);
        if !path.is_file() {
            return Err(T::own_only());
        }
        fs::remove_file(&path).context(|| tr!("io-removing", path = &path))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ids_stay_in_their_directory() {
        assert!(id_is_good("manuscript_2-b"));
        for bad in ["", "-x", "../x", "a/b", "a.b", "a b", "ø", &"x".repeat(81)] {
            assert!(!id_is_good(bad), "{bad}");
        }
    }
}
