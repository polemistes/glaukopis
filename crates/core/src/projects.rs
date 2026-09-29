//! Projects on disk.
//!
//! A project is a CRDT document owned by the interface (ADR 0002). Here it is
//! stored without being interpreted:
//!
//! ```text
//! projects/<id>/project.json   name, dates, what the list of projects shows
//! projects/<id>/state.bin      the document as one update
//! projects/<id>/updates.log    changes since, each in a record (see `history`)
//! projects/<id>/history/       earlier states, thinned as they age
//! projects/<id>/changes.log    the full history, where it is on (see `history`)
//! ```
//!
//! A deleted project is moved to `projects/.trash/` and can be brought back.

use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::error::{Error, IoContext, Result};
use crate::fsutil::write_atomic;
use crate::history::{Record, append_record, now_ms, read_records};
use crate::library::now;
use crate::paths::DataDir;
use crate::tr;

const INFO: &str = "project.json";
const STATE: &str = "state.bin";
pub(crate) const LOG: &str = "updates.log";
const HISTORY: &str = "history";
const TRASH: &str = ".trash";
const TOKEN: &str = "sharing.key";

/// The most history kept for one project.
const HISTORY_LIMIT: usize = 40;
/// The least time between two states kept in the history, in seconds.
const HISTORY_INTERVAL: i64 = 10 * 60;

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct MapInfo {
    pub id: String,
    pub name: String,
    pub elements: usize,
}

/// How a project is shared, when it is. The token that admits this copy to
/// the room is kept beside this, in a file of its own: what is here is told
/// to the interface, and the token never is.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Sharing {
    pub server: String,
    pub room: String,
    /// Whether this user published the project, and may invite and remove others.
    pub owner: bool,
    /// Who this copy is among the collaborators. Nothing for the owner.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub member: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ProjectInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub created: String,
    pub modified: String,
    /// Kept for the list of projects, which does not read the documents.
    pub maps: Vec<MapInfo>,
    pub words: usize,
    pub references: usize,
    /// The pictures the project uses, by the names the store keeps them by:
    /// so that the store can say where a picture is used.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub pictures: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sharing: Option<Sharing>,
    /// What the interface wants to find again: the map that was open, the view.
    #[serde(skip_serializing_if = "serde_json::Value::is_null")]
    pub view: serde_json::Value,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadedProject {
    pub info: ProjectInfo,
    /// The document as one update, or nothing for a new project.
    pub state: Option<Vec<u8>>,
    /// Changes made after that state, in order.
    pub updates: Vec<Vec<u8>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    /// The file name, which is the time the state was kept.
    pub id: String,
    pub time: String,
    pub size: u64,
}

#[derive(Debug, Clone)]
pub struct Projects {
    root: PathBuf,
}

fn check_id(id: &str) -> Result<()> {
    let ok = !id.is_empty()
        && id.len() <= 64
        && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
        && !id.starts_with('-');
    if ok { Ok(()) } else { Err(Error::invalid(tr!("core-projects-bad-id", id = id))) }
}

impl Projects {
    pub fn new(data: &DataDir) -> Self {
        Projects { root: data.projects() }
    }

    pub fn at(root: impl Into<PathBuf>) -> Self {
        Projects { root: root.into() }
    }

    pub fn dir(&self, id: &str) -> Result<PathBuf> {
        check_id(id)?;
        Ok(self.root.join(id))
    }

    /// Where projects kept their pictures when each kept its own: the
    /// directories that are still there, of projects and of those that were
    /// deleted. The store of pictures takes in what they hold.
    pub fn picture_directories(&self) -> Vec<PathBuf> {
        let mut out = Vec::new();
        for root in [self.root.clone(), self.root.join(TRASH)] {
            let Ok(entries) = fs::read_dir(&root) else { continue };
            out.extend(entries.flatten().map(|e| e.path().join("files")).filter(|p| p.is_dir()));
        }
        out.sort();
        out
    }

    pub(crate) fn existing_dir(&self, id: &str) -> Result<PathBuf> {
        let dir = self.dir(id)?;
        if dir.join(INFO).is_file() { Ok(dir) } else { Err(Error::not_found(tr!("core-projects-the-project"))) }
    }

    fn read_info(dir: &Path) -> Result<ProjectInfo> {
        let path = dir.join(INFO);
        let text = fs::read_to_string(&path).context(|| tr!("io-reading", path = &path))?;
        serde_json::from_str(&text).map_err(|e| Error::Parse { path, message: e.to_string() })
    }

    fn write_info(dir: &Path, info: &ProjectInfo) -> Result<()> {
        write_atomic(&dir.join(INFO), serde_json::to_string_pretty(info)?.as_bytes())
    }

    /// All projects, the most recently changed first.
    pub fn list(&self) -> Result<Vec<ProjectInfo>> {
        let mut out = Vec::new();
        let entries = match fs::read_dir(&self.root) {
            Ok(e) => e,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(out),
            Err(e) => return Err(e).context(|| tr!("io-reading", path = &self.root)),
        };
        for entry in entries.flatten() {
            let dir = entry.path();
            if !dir.join(INFO).is_file() {
                continue;
            }
            match Self::read_info(&dir) {
                Ok(info) => out.push(info),
                Err(e) => tracing::warn!(%e, "a project could not be read"),
            }
        }
        out.sort_by(|a, b| b.modified.cmp(&a.modified).then(a.name.cmp(&b.name)));
        Ok(out)
    }

    pub fn info(&self, id: &str) -> Result<ProjectInfo> {
        Self::read_info(&self.existing_dir(id)?)
    }

    fn check_name(name: &str) -> Result<String> {
        let name = name.split_whitespace().collect::<Vec<_>>().join(" ");
        if name.is_empty() {
            return Err(Error::invalid(tr!("core-projects-needs-name")));
        }
        if name.chars().count() > 200 {
            return Err(Error::invalid(tr!("core-projects-name-too-long")));
        }
        Ok(name)
    }

    pub fn create(&self, name: &str) -> Result<ProjectInfo> {
        self.create_with_id(&uuid::Uuid::new_v4().to_string(), name)
    }

    /// Creates a project under a given id: the copy of a shared project has the
    /// id of the room it belongs to.
    pub fn create_with_id(&self, id: &str, name: &str) -> Result<ProjectInfo> {
        let name = Self::check_name(name)?;
        let dir = self.dir(id)?;
        if dir.exists() {
            return Err(Error::invalid(tr!("core-projects-id-taken")));
        }
        fs::create_dir_all(&dir).context(|| tr!("io-creating", path = &dir))?;
        let stamp = now();
        let info =
            ProjectInfo { id: id.to_owned(), name, created: stamp.clone(), modified: stamp, ..Default::default() };
        Self::write_info(&dir, &info)?;
        Ok(info)
    }

    /// Changes what is kept about a project. The id and the date of creation stay.
    pub fn update_info(&self, id: &str, change: impl FnOnce(&mut ProjectInfo)) -> Result<ProjectInfo> {
        let dir = self.existing_dir(id)?;
        let mut info = Self::read_info(&dir)?;
        let (keep_id, keep_created) = (info.id.clone(), info.created.clone());
        change(&mut info);
        info.id = keep_id;
        info.created = keep_created;
        info.name = Self::check_name(&info.name)?;
        Self::write_info(&dir, &info)?;
        Ok(info)
    }

    pub fn rename(&self, id: &str, name: &str) -> Result<ProjectInfo> {
        let name = Self::check_name(name)?;
        self.update_info(id, |info| {
            info.name = name;
            info.modified = now();
        })
    }

    pub fn load(&self, id: &str) -> Result<LoadedProject> {
        let dir = self.existing_dir(id)?;
        let info = Self::read_info(&dir)?;
        let state = match fs::read(dir.join(STATE)) {
            Ok(bytes) => Some(bytes),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
            Err(e) => return Err(e).context(|| tr!("core-projects-reading")),
        };
        let updates = read_log(&dir.join(LOG))?;
        Ok(LoadedProject { info, state, updates })
    }

    /// Adds a change made here to the log, written now. It is on disk when this returns.
    pub fn append(&self, id: &str, update: &[u8]) -> Result<()> {
        self.append_change(id, update, true, now_ms())
    }

    /// Adds a change to the log: whether it was made here or came from
    /// another, and when it was written, in milliseconds since 1970. It is
    /// on disk when this returns.
    pub fn append_change(&self, id: &str, update: &[u8], here: bool, time: i64) -> Result<()> {
        if update.is_empty() {
            return Ok(());
        }
        let dir = self.existing_dir(id)?;
        append_record(&dir.join(LOG), &Record::change(update.to_vec(), here, time))
    }

    /// Replaces the stored state by a new one that holds everything, and
    /// empties the log. An earlier state is kept in the history now and then.
    pub fn save_state(&self, id: &str, state: &[u8], summary: Option<Summary>) -> Result<ProjectInfo> {
        self.save_state_keeping(id, state, summary, false)
    }

    /// As `save_state`; with `keep`, where the project's full history is on,
    /// what the log held is kept in it rather than thrown away, and a history
    /// that is not there begins with this state (see `history`). Without it,
    /// a history that is there is deleted: it has been turned off, here or on
    /// another copy of the project.
    pub fn save_state_keeping(
        &self,
        id: &str,
        state: &[u8],
        summary: Option<Summary>,
        keep: bool,
    ) -> Result<ProjectInfo> {
        let dir = self.existing_dir(id)?;
        self.keep_history(&dir)?;
        write_atomic(&dir.join(STATE), state)?;
        remove_copies(&dir);
        if keep {
            self.keep_changes(&dir, &dir.join(LOG), state)?;
        } else {
            self.forget_changes(id)?;
        }
        // Only now may the log go: the state holds what it held.
        match fs::remove_file(dir.join(LOG)) {
            Ok(()) => {}
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => return Err(e).context(|| tr!("core-projects-emptying-log")),
        }
        self.update_info(id, |info| {
            info.modified = now();
            if let Some(s) = summary {
                info.maps = s.maps;
                info.words = s.words;
                info.references = s.references;
                info.pictures = s.pictures;
                if let Some(name) = s.name.filter(|n| !n.trim().is_empty()) {
                    info.name = name;
                }
            }
        })
    }

    fn keep_history(&self, dir: &Path) -> Result<()> {
        let state = dir.join(STATE);
        if !state.is_file() {
            return Ok(());
        }
        let history = dir.join(HISTORY);
        let mut kept = list_history(&history);
        let now_unix = time::OffsetDateTime::now_utc().unix_timestamp();
        let newest = kept.last().and_then(|h| parse_stamp(&h.id));
        if newest.is_some_and(|t| now_unix - t < HISTORY_INTERVAL) {
            return Ok(());
        }
        fs::create_dir_all(&history).context(|| tr!("io-creating", path = &history))?;
        let name = format!("{}.bin", stamp_name(now_unix));
        fs::copy(&state, history.join(&name)).context(|| tr!("core-projects-keeping-state"))?;

        // Thin: when over the limit, drop the entry closest in time to its neighbours,
        // so that recent history is dense and old history sparse but present.
        kept = list_history(&history);
        while kept.len() > HISTORY_LIMIT {
            let times: Vec<i64> = kept.iter().map(|h| parse_stamp(&h.id).unwrap_or(0)).collect();
            let mut drop = 1;
            let mut smallest = i64::MAX;
            for i in 1..times.len() - 1 {
                let gap = times[i + 1] - times[i - 1];
                // Weigh by age, so that old entries go before new ones.
                let age = (now_unix - times[i]).max(1);
                let score = gap / age.max(3600) * 3600 + gap % 3600;
                if score < smallest {
                    smallest = score;
                    drop = i;
                }
            }
            let _ = fs::remove_file(history.join(&kept[drop].id));
            kept.remove(drop);
        }
        Ok(())
    }

    pub fn history(&self, id: &str) -> Result<Vec<HistoryEntry>> {
        let dir = self.existing_dir(id)?;
        let mut list = list_history(&dir.join(HISTORY));
        list.reverse();
        Ok(list)
    }

    pub fn history_state(&self, id: &str, entry: &str) -> Result<Vec<u8>> {
        let dir = self.existing_dir(id)?;
        if parse_stamp(entry).is_none() || entry.contains(['/', '\\']) {
            return Err(Error::invalid(tr!("core-projects-not-in-history")));
        }
        let path = dir.join(HISTORY).join(entry);
        fs::read(&path).context(|| tr!("io-reading", path = &path))
    }

    /// Notes that the project is shared, and keeps the token that admits this copy.
    pub fn share(&self, id: &str, sharing: Sharing, token: &str) -> Result<ProjectInfo> {
        let dir = self.existing_dir(id)?;
        let token = token.trim();
        if token.is_empty() {
            return Err(Error::invalid(tr!("core-projects-no-token")));
        }
        let path = dir.join(TOKEN);
        write_atomic(&path, token.as_bytes())?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&path, fs::Permissions::from_mode(0o600))
                .context(|| tr!("core-projects-closing", path = &path))?;
        }
        self.update_info(id, |info| info.sharing = Some(sharing))
    }

    /// The project is this user's alone again. What it holds stays.
    pub fn unshare(&self, id: &str) -> Result<ProjectInfo> {
        let dir = self.existing_dir(id)?;
        match fs::remove_file(dir.join(TOKEN)) {
            Ok(()) => {}
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => return Err(e).context(|| tr!("core-projects-forgetting-token")),
        }
        self.update_info(id, |info| info.sharing = None)
    }

    /// How the project is shared, with the token that admits this copy.
    pub fn shared(&self, id: &str) -> Result<(Sharing, String)> {
        let dir = self.existing_dir(id)?;
        let not_shared = || Error::invalid(tr!("core-projects-not-shared"));
        let sharing = Self::read_info(&dir)?.sharing.ok_or_else(not_shared)?;
        let token = match fs::read_to_string(dir.join(TOKEN)) {
            Ok(text) => text.trim().to_owned(),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Err(not_shared()),
            Err(e) => return Err(e).context(|| tr!("core-projects-reading-token")),
        };
        if token.is_empty() {
            return Err(not_shared());
        }
        Ok((sharing, token))
    }

    /// Moves the project to the trash.
    pub fn delete(&self, id: &str) -> Result<()> {
        let dir = self.existing_dir(id)?;
        let trash = self.root.join(TRASH);
        fs::create_dir_all(&trash).context(|| tr!("io-creating", path = &trash))?;
        let target = trash.join(format!("{}_{}", stamp_name(time::OffsetDateTime::now_utc().unix_timestamp()), id));
        fs::rename(&dir, &target).context(|| tr!("core-projects-to-trash"))?;
        Ok(())
    }

    /// Projects in the trash, the most recently deleted first.
    pub fn trash(&self) -> Result<Vec<(String, ProjectInfo)>> {
        let mut out = Vec::new();
        let Ok(entries) = fs::read_dir(self.root.join(TRASH)) else { return Ok(out) };
        for entry in entries.flatten() {
            if let Ok(info) = Self::read_info(&entry.path()) {
                out.push((entry.file_name().to_string_lossy().into_owned(), info));
            }
        }
        out.sort_by(|a, b| b.0.cmp(&a.0));
        Ok(out)
    }

    pub fn restore(&self, trashed: &str) -> Result<ProjectInfo> {
        if trashed.contains(['/', '\\']) || trashed.starts_with('.') {
            return Err(Error::invalid(tr!("core-projects-not-in-trash")));
        }
        let from = self.root.join(TRASH).join(trashed);
        let info = Self::read_info(&from)?;
        let to = self.dir(&info.id)?;
        if to.exists() {
            return Err(Error::invalid(tr!("core-projects-id-exists")));
        }
        fs::rename(&from, &to).context(|| tr!("core-projects-bringing-back"))?;
        Ok(info)
    }

    /// Removes a project in the trash for good.
    pub fn purge(&self, trashed: &str) -> Result<()> {
        if trashed.contains(['/', '\\']) || trashed.starts_with('.') || trashed.is_empty() {
            return Err(Error::invalid(tr!("core-projects-not-in-trash")));
        }
        let dir = self.root.join(TRASH).join(trashed);
        if !dir.join(INFO).is_file() {
            return Err(Error::not_found(tr!("core-projects-the-project-in-trash")));
        }
        fs::remove_dir_all(&dir).context(|| tr!("io-removing", path = &dir))
    }

    /// A new project that holds what another held at an earlier time. The
    /// project itself is left as it is: in a document that several may have
    /// changed, going back is not something that can be done to everyone.
    pub fn copy_from_history(&self, id: &str, entry: &str, name: &str) -> Result<ProjectInfo> {
        let state = self.history_state(id, entry)?;
        let source = self.info(id)?;
        let mut copy = self.create(name)?;
        let to = self.dir(&copy.id)?;
        write_atomic(&to.join(STATE), &state)?;
        copy.description = source.description;
        Self::write_info(&to, &copy)?;
        Ok(copy)
    }

    /// A copy of a project under a new id.
    pub fn duplicate(&self, id: &str, name: &str) -> Result<ProjectInfo> {
        let from = self.existing_dir(id)?;
        let source = Self::read_info(&from)?;
        let mut copy = self.create(name)?;
        let to = self.dir(&copy.id)?;
        for file in [STATE, LOG] {
            let path = from.join(file);
            if path.is_file() {
                fs::copy(&path, to.join(file)).context(|| tr!("io-copying", path = &path))?;
            }
        }
        copy.description = source.description;
        copy.maps = source.maps;
        copy.words = source.words;
        copy.references = source.references;
        Self::write_info(&to, &copy)?;
        Ok(copy)
    }
}

/// What the interface reports about the document when it saves its state.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Summary {
    pub name: Option<String>,
    pub maps: Vec<MapInfo>,
    pub words: usize,
    pub references: usize,
    /// The pictures of the figures, each by the name it is kept by.
    pub pictures: Vec<String>,
}

/// Earlier versions wrote every map as Markdown beside the project. Those
/// copies are no longer written, and one that is left would show the project
/// as it once was: they are removed, and nothing else.
fn remove_copies(dir: &Path) {
    let copies = dir.join("maps");
    let Ok(entries) = fs::read_dir(&copies) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() && path.extension().is_some_and(|e| e == "md") {
            let _ = fs::remove_file(path);
        }
    }
    // Goes only if nothing else was in it.
    let _ = fs::remove_dir(&copies);
}

/// Reads the changes of the log. A record cut short by a crash, and anything
/// after it, is left out.
fn read_log(path: &Path) -> Result<Vec<Vec<u8>>> {
    Ok(read_records(path)?.into_iter().map(|r| r.update).collect())
}

fn stamp_name(unix: i64) -> String {
    let t = time::OffsetDateTime::from_unix_timestamp(unix).unwrap_or(time::OffsetDateTime::UNIX_EPOCH);
    format!(
        "{:04}{:02}{:02}T{:02}{:02}{:02}Z",
        t.year(),
        u8::from(t.month()),
        t.day(),
        t.hour(),
        t.minute(),
        t.second()
    )
}

fn parse_stamp(name: &str) -> Option<i64> {
    let s = name.strip_suffix(".bin").unwrap_or(name);
    if s.len() != 16 || !s.ends_with('Z') || s.as_bytes()[8] != b'T' {
        return None;
    }
    let n = |r: std::ops::Range<usize>| s.get(r)?.parse::<u32>().ok();
    let date =
        time::Date::from_calendar_date(n(0..4)? as i32, time::Month::try_from(n(4..6)? as u8).ok()?, n(6..8)? as u8)
            .ok()?;
    let t = time::Time::from_hms(n(9..11)? as u8, n(11..13)? as u8, n(13..15)? as u8).ok()?;
    Some(time::PrimitiveDateTime::new(date, t).assume_utc().unix_timestamp())
}

fn list_history(dir: &Path) -> Vec<HistoryEntry> {
    let mut out = Vec::new();
    let Ok(entries) = fs::read_dir(dir) else { return out };
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        let Some(unix) = parse_stamp(&name) else { continue };
        let time = time::OffsetDateTime::from_unix_timestamp(unix)
            .ok()
            .and_then(|t| t.format(&time::format_description::well_known::Rfc3339).ok())
            .unwrap_or_default();
        out.push(HistoryEntry { id: name, time, size: entry.metadata().map(|m| m.len()).unwrap_or(0) });
    }
    out.sort_by(|a, b| a.id.cmp(&b.id));
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn projects() -> (tempfile::TempDir, Projects) {
        let tmp = tempfile::tempdir().unwrap();
        let p = Projects::at(tmp.path().join("projects"));
        (tmp, p)
    }

    #[test]
    fn create_list_rename() {
        let (_tmp, p) = projects();
        assert!(p.list().unwrap().is_empty());
        let a = p.create("  Homer   and the   heroes ").unwrap();
        assert_eq!(a.name, "Homer and the heroes");
        assert!(p.create("   ").is_err());
        let b = p.create("Second").unwrap();
        p.rename(&a.id, "Renamed").unwrap();
        let list = p.list().unwrap();
        assert_eq!(list.len(), 2);
        assert!(list.iter().any(|i| i.name == "Renamed" && i.id == a.id && i.created == a.created));
        assert!(p.info("../etc").is_err());
        assert!(p.info("nonexistent").is_err());
        let _ = b;
    }

    #[test]
    fn where_projects_kept_pictures_of_their_own() {
        let (_tmp, p) = projects();
        let a = p.create("A").unwrap();
        let b = p.create("B").unwrap();
        p.create("C").unwrap();
        assert!(p.picture_directories().is_empty());
        for id in [&a.id, &b.id] {
            fs::create_dir_all(p.dir(id).unwrap().join("files")).unwrap();
        }
        p.delete(&b.id).unwrap();
        let found = p.picture_directories();
        assert_eq!(found.len(), 2, "{found:?}");
        assert!(found.iter().any(|d| d.starts_with(p.dir(&a.id).unwrap())));
        assert!(found.iter().any(|d| d.to_string_lossy().contains(".trash")));
    }

    #[test]
    fn changes_and_states() {
        let (_tmp, p) = projects();
        let a = p.create("A").unwrap();
        let loaded = p.load(&a.id).unwrap();
        assert!(loaded.state.is_none() && loaded.updates.is_empty());

        p.append(&a.id, b"one").unwrap();
        p.append(&a.id, b"").unwrap();
        p.append(&a.id, &[0u8; 5000]).unwrap();
        let loaded = p.load(&a.id).unwrap();
        assert_eq!(loaded.updates.len(), 2);
        assert_eq!(loaded.updates[0], b"one");
        assert_eq!(loaded.updates[1].len(), 5000);

        let summary = Summary {
            name: Some("A better name".into()),
            maps: vec![MapInfo { id: "m".into(), name: "Map".into(), elements: 3 }],
            words: 120,
            references: 4,
            ..Default::default()
        };
        let info = p.save_state(&a.id, b"STATE", Some(summary)).unwrap();
        assert_eq!(info.name, "A better name");
        assert_eq!(info.maps[0].elements, 3);
        let loaded = p.load(&a.id).unwrap();
        assert_eq!(loaded.state.as_deref(), Some(&b"STATE"[..]));
        assert!(loaded.updates.is_empty());

        p.append(&a.id, b"after").unwrap();
        assert_eq!(p.load(&a.id).unwrap().updates, vec![b"after".to_vec()]);
    }

    #[test]
    fn a_log_cut_short_loses_only_its_tail() {
        let (_tmp, p) = projects();
        let a = p.create("A").unwrap();
        p.append(&a.id, b"first").unwrap();
        p.append(&a.id, b"second").unwrap();
        let log = p.dir(&a.id).unwrap().join(LOG);
        let mut bytes = fs::read(&log).unwrap();
        let whole = bytes.len();

        // Half of a third record.
        bytes.extend_from_slice(&100u32.to_le_bytes());
        bytes.extend_from_slice(&[1, 2, 3]);
        fs::write(&log, &bytes).unwrap();
        assert_eq!(p.load(&a.id).unwrap().updates.len(), 2);

        // A flipped bit in the second record.
        bytes.truncate(whole);
        let last = bytes.len() - 1;
        bytes[last] ^= 1;
        fs::write(&log, &bytes).unwrap();
        assert_eq!(p.load(&a.id).unwrap().updates, vec![b"first".to_vec()]);
    }

    #[test]
    fn history_is_kept_and_thinned() {
        let (_tmp, p) = projects();
        let a = p.create("A").unwrap();
        p.save_state(&a.id, b"1", None).unwrap();
        p.save_state(&a.id, b"2", None).unwrap();
        // The first state went to the history when the second was saved.
        let h = p.history(&a.id).unwrap();
        assert_eq!(h.len(), 1);
        assert_eq!(p.history_state(&a.id, &h[0].id).unwrap(), b"1");
        // A third save within the interval keeps nothing more.
        p.save_state(&a.id, b"3", None).unwrap();
        assert_eq!(p.history(&a.id).unwrap().len(), 1);
        assert!(p.history_state(&a.id, "../state.bin").is_err());

        // Many old entries are thinned to the limit.
        let dir = p.dir(&a.id).unwrap().join(HISTORY);
        let base = time::OffsetDateTime::now_utc().unix_timestamp() - 400 * 86400;
        for i in 0..60 {
            fs::write(dir.join(format!("{}.bin", stamp_name(base + i * 3600))), b"x").unwrap();
        }
        // Make the newest old enough for another to be kept.
        for e in p.history(&a.id).unwrap() {
            if parse_stamp(&e.id).unwrap() > base + 100 * 3600 {
                fs::remove_file(dir.join(&e.id)).unwrap();
            }
        }
        p.save_state(&a.id, b"4", None).unwrap();
        assert_eq!(p.history(&a.id).unwrap().len(), HISTORY_LIMIT);
    }

    #[test]
    fn trash_and_duplicate() {
        let (_tmp, p) = projects();
        let a = p.create("A").unwrap();
        p.save_state(&a.id, b"STATE", None).unwrap();
        p.append(&a.id, b"more").unwrap();

        let copy = p.duplicate(&a.id, "Copy of A").unwrap();
        assert_ne!(copy.id, a.id);
        let loaded = p.load(&copy.id).unwrap();
        assert_eq!(loaded.state.as_deref(), Some(&b"STATE"[..]));
        assert_eq!(loaded.updates.len(), 1);

        p.delete(&a.id).unwrap();
        assert_eq!(p.list().unwrap().len(), 1);
        let trash = p.trash().unwrap();
        assert_eq!(trash.len(), 1);
        let back = p.restore(&trash[0].0).unwrap();
        assert_eq!(back.id, a.id);
        assert_eq!(p.list().unwrap().len(), 2);
    }

    #[test]
    fn purging_and_copies_of_earlier_states() {
        let (_tmp, p) = projects();
        let a = p.create("A").unwrap();
        p.save_state(&a.id, b"first", None).unwrap();
        p.save_state(&a.id, b"second", None).unwrap();
        let history = p.history(&a.id).unwrap();
        assert_eq!(history.len(), 1);
        let copy = p.copy_from_history(&a.id, &history[0].id, "A, as it was").unwrap();
        assert_ne!(copy.id, a.id);
        assert_eq!(p.load(&copy.id).unwrap().state.as_deref(), Some(&b"first"[..]));
        assert_eq!(p.load(&a.id).unwrap().state.as_deref(), Some(&b"second"[..]));
        assert!(p.copy_from_history(&a.id, "../x", "B").is_err());

        p.delete(&a.id).unwrap();
        let trash = p.trash().unwrap();
        assert_eq!(trash.len(), 1);
        assert!(p.purge("../projects").is_err());
        assert!(p.purge("nothing").is_err());
        p.purge(&trash[0].0).unwrap();
        assert!(p.trash().unwrap().is_empty());
        assert_eq!(p.list().unwrap().len(), 1);
    }

    #[test]
    fn sharing_is_noted_and_the_token_kept_apart() {
        let (_tmp, p) = projects();
        let a = p.create("A").unwrap();
        assert!(p.shared(&a.id).is_err());
        let sharing = Sharing { server: "https://example.org".into(), room: a.id.clone(), owner: true, member: None };
        let info = p.share(&a.id, sharing.clone(), " abc123 \n").unwrap();
        assert_eq!(info.sharing.as_ref(), Some(&sharing));
        assert_eq!(p.shared(&a.id).unwrap(), (sharing, "abc123".to_owned()));
        let told = serde_json::to_string(&p.list().unwrap()).unwrap();
        assert!(!told.contains("abc123"), "the token is not among what is told of a project");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mode = fs::metadata(p.dir(&a.id).unwrap().join(TOKEN)).unwrap().permissions().mode();
            assert_eq!(mode & 0o777, 0o600);
        }
        // A copy is not shared.
        let copy = p.duplicate(&a.id, "B").unwrap();
        assert!(copy.sharing.is_none() && p.shared(&copy.id).is_err());
        let info = p.unshare(&a.id).unwrap();
        assert!(info.sharing.is_none());
        assert!(p.shared(&a.id).is_err());
        assert!(!p.dir(&a.id).unwrap().join(TOKEN).exists());
    }

    #[test]
    fn copies_written_by_earlier_versions_are_removed() {
        let (_tmp, p) = projects();
        let a = p.create("A").unwrap();
        let b = p.create("B").unwrap();
        for (id, other) in [(&a.id, false), (&b.id, true)] {
            let maps = p.dir(id).unwrap().join("maps");
            fs::create_dir_all(&maps).unwrap();
            fs::write(maps.join("Book.md"), "# Book").unwrap();
            if other {
                fs::write(maps.join("mine.txt"), "put here by the user").unwrap();
            }
            p.save_state(id, b"state", None).unwrap();
        }
        assert!(!p.dir(&a.id).unwrap().join("maps").exists());
        let kept = p.dir(&b.id).unwrap().join("maps");
        assert!(!kept.join("Book.md").exists());
        assert_eq!(fs::read_to_string(kept.join("mine.txt")).unwrap(), "put here by the user");
    }

    #[test]
    fn stamps() {
        assert_eq!(stamp_name(0), "19700101T000000Z");
        assert_eq!(parse_stamp("19700101T000010Z.bin"), Some(10));
        assert_eq!(parse_stamp("nonsense.bin"), None);
    }
}
