//! Exporting the files of the library into a folder of the writer's choice
//! (ADR 0043): the folders of the store become folders on disk, every file
//! is named by its reference where it has one, and a `references.bib` beside
//! them names the exported files, so that another program reads the export
//! whole. The store itself keeps its files by hash; this is where the
//! readable layout is had.

use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};

use serde::{Deserialize, Serialize};

use crate::error::{Error, IoContext, Result};
use crate::fsutil::{clean_file_name, safe_file_name, write_atomic};
use crate::tr;

use super::{Entry, FileRecord, Library, attachments};

/// What is exported.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum ExportSelection {
    /// Every file, the folders from the top each a folder on disk.
    All,
    /// The files of a folder directly in the folder exported into, the
    /// folders under it as folders on disk.
    Folder { id: String },
    /// These files, directly in the folder exported into.
    Files { hashes: Vec<String> },
}

/// What came of an export.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Exported {
    /// How many files were written.
    pub files: usize,
    /// How many there were to write: more than were written where it was
    /// stopped, or where some could not be.
    pub total: usize,
    /// How many folders were written, those with nothing in them among them.
    pub folders: usize,
    /// Where the `references.bib` was written, where one was asked for.
    pub bib: Option<String>,
    /// Whether it was stopped before every file was written. What was
    /// written stays.
    pub stopped: bool,
    pub problems: Vec<String>,
}

/// How long the part of a name before its ending may be, in characters and
/// in bytes: the file systems take 255 bytes, and a letter of Greek is two,
/// so that a numbering and an ending have room after it.
const NAME_CHARS: usize = 180;
const NAME_BYTES: usize = 200;

/// The name of the BibLaTeX file written beside the files.
const BIB: &str = "references.bib";

/// A file to be written: the stored file, and where it goes.
struct Job<'a> {
    record: &'a FileRecord,
    /// The folders it goes in, under the folder exported into.
    dir: Vec<String>,
    name: String,
}

/// The names taken in one folder on disk, in lower case: some file systems
/// do not tell `A.pdf` from `a.pdf`.
#[derive(Default)]
struct Taken(HashSet<String>);

impl Taken {
    /// The name, or the first of `<stem> (2)<ending>`, `<stem> (3)<ending>`
    /// that is neither taken here nor on disk in `dir`; taken from now on.
    /// A folder that is on disk already may be written into again, where
    /// `folder` is asked for: nothing in it is overwritten.
    fn claim(&mut self, dir: &Path, stem: &str, ending: &str, folder: bool) -> String {
        let free = |name: &str, taken: &HashSet<String>| {
            !taken.contains(&name.to_lowercase())
                && match fs::symlink_metadata(dir.join(name)) {
                    Err(_) => true,
                    Ok(meta) => folder && meta.is_dir(),
                }
        };
        let mut name = format!("{stem}{ending}");
        let mut n = 2;
        while !free(&name, &self.0) {
            name = format!("{stem} ({n}){ending}");
            n += 1;
        }
        self.0.insert(name.to_lowercase());
        name
    }
}

/// The ending of a stored file, with its dot, in lower case as the store
/// writes it: `.pdf`; none where it has none.
fn ending_of(path: &str) -> String {
    let name = path.rsplit('/').next().unwrap_or(path);
    match name.rsplit_once('.') {
        Some((stem, ending)) if !stem.is_empty() && !ending.is_empty() && ending.len() <= 8 => {
            format!(".{}", ending.to_lowercase())
        }
        _ => String::new(),
    }
}

/// A name without the ending given, where it ends so.
fn without_ending<'a>(name: &'a str, ending: &str) -> &'a str {
    if !ending.is_empty() && name.len() > ending.len() && name.to_lowercase().ends_with(ending) {
        &name[..name.len() - ending.len()]
    } else {
        name
    }
}

/// Cuts a name to what a file system takes, at a word where there is one,
/// and without what would dangle at its end: a dash, a comma, a dot.
fn cut_at_word(name: &str) -> String {
    if name.chars().count() <= NAME_CHARS && name.len() <= NAME_BYTES {
        return name.to_owned();
    }
    let mut end = 0;
    for (count, (at, c)) in name.char_indices().enumerate() {
        if count >= NAME_CHARS || at + c.len_utf8() > NAME_BYTES {
            break;
        }
        end = at + c.len_utf8();
    }
    let mut cut = &name[..end];
    // At a word, unless the last word is most of the name.
    if !name[end..].starts_with(' ')
        && let Some(space) = cut.rfind(' ')
        && space > end / 2
    {
        cut = &cut[..space];
    }
    cut.trim_end_matches([' ', '-', '–', '—', ',', ';', '.']).to_owned()
}

impl Library {
    /// Writes the files of the selection into `into`, which is made where it
    /// is not: the folders of the store as folders on disk, every file named
    /// by its first reference in the order of the library, `Nagy 1979 - The
    /// Best of the Achaeans.pdf`, a second file of a work by that and its
    /// own name after a dash, a file with no reference by its own name.
    /// Nothing on disk is overwritten: a name that is taken is numbered.
    /// With `with_bib`, a `references.bib` of the works of the files written
    /// is put beside them, its `file` fields naming them by paths relative
    /// to `into`. `progress` is told how many are done of how many, and of
    /// the one at hand; between files, `stop` stops it, and what was written
    /// stays.
    pub fn export_files(
        &self,
        selection: &ExportSelection,
        into: &Path,
        with_bib: bool,
        progress: &mut dyn FnMut(usize, usize, &str),
        stop: &AtomicBool,
    ) -> Result<Exported> {
        let mut out = Exported::default();

        // The folders that become folders on disk, each with where it goes.
        let top = match selection {
            ExportSelection::All => None,
            ExportSelection::Folder { id } => Some(self.files.folder(id)?.id.clone()),
            ExportSelection::Files { .. } => None,
        };
        let folders = self.files.folders_sorted();
        let mut dirs: HashMap<Option<String>, Vec<String>> = HashMap::new();
        dirs.insert(top.clone(), Vec::new());
        let mut taken: HashMap<Vec<String>, Taken> = HashMap::new();
        if with_bib {
            taken.entry(Vec::new()).or_default().0.insert(BIB.to_owned());
        }
        if !matches!(selection, ExportSelection::Files { .. }) {
            // From the top down, so that a folder's parent has its place
            // before it; two folders of one name side by side are numbered.
            let mut queue = vec![top.clone()];
            let mut i = 0;
            while i < queue.len() {
                let parent = queue[i].clone();
                let at = dirs[&parent].clone();
                for folder in folders.iter().filter(|f| f.parent == parent) {
                    let name = safe_file_name(&folder.name, "folder");
                    let place = into.join(at.iter().collect::<PathBuf>());
                    let name = taken.entry(at.clone()).or_default().claim(&place, &name, "", true);
                    let mut dir = at.clone();
                    dir.push(name);
                    dirs.insert(Some(folder.id.clone()), dir);
                    queue.push(Some(folder.id.clone()));
                }
                i += 1;
            }
        }

        // The files, each in its folder.
        let mut chosen: Vec<(&FileRecord, Vec<String>)> = Vec::new();
        match selection {
            ExportSelection::Files { hashes } => {
                let mut seen = HashSet::new();
                for hash in hashes {
                    if !seen.insert(hash) {
                        continue;
                    }
                    match self.files.get(hash) {
                        Some(record) => chosen.push((record, Vec::new())),
                        None => {
                            out.problems.push(Error::not_found(tr!("core-library-the-file-of-library")).to_string())
                        }
                    }
                }
            }
            ExportSelection::All => {
                for record in &self.files.files {
                    // A file whose folder is not known any more stands at the top.
                    let dir = dirs.get(&record.folder).cloned().unwrap_or_default();
                    chosen.push((record, dir));
                }
            }
            ExportSelection::Folder { .. } => {
                for record in &self.files.files {
                    if let Some(dir) = dirs.get(&record.folder) {
                        chosen.push((record, dir.clone()));
                    }
                }
            }
        }

        // The entries of every file, in the order of the library.
        let mut entries_of: HashMap<&str, Vec<&Entry>> = HashMap::new();
        for e in &self.entries {
            for f in e.attachments() {
                if let Some(hash) = attachments::hash_of_path(&f)
                    && let Some(record) = self.files.get(hash)
                {
                    let list = entries_of.entry(record.hash.as_str()).or_default();
                    if !list.iter().any(|x| x.id == e.id) {
                        list.push(e);
                    }
                }
            }
        }

        // The names. A file of a work is named by it; where the work has
        // another file of the same ending in the same folder before it (in
        // the order the reference names its files), the file's own name
        // follows after a dash. A PDF and an EPUB of one book are told
        // apart by their endings and need nothing more.
        let position = |e: &Entry, hash: &str| {
            e.attachments().iter().position(|f| attachments::hash_of_path(f) == Some(hash)).unwrap_or(usize::MAX)
        };
        let mut order: Vec<usize> = (0..chosen.len()).collect();
        order.sort_by_key(|&i| {
            let (record, dir) = &chosen[i];
            let first = entries_of.get(record.hash.as_str()).and_then(|list| list.first());
            let work = first.and_then(|e| self.by_id.get(&e.id).copied());
            (dir.clone(), work, first.map(|e| position(e, &record.hash)).unwrap_or(0), i)
        });
        let mut works_named: HashSet<(Vec<String>, String, String)> = HashSet::new();
        let mut jobs: Vec<Option<Job>> = (0..chosen.len()).map(|_| None).collect();
        for i in order {
            let (record, dir) = &chosen[i];
            let ending = ending_of(&record.path);
            let own = clean_file_name(without_ending(&record.name, &ending));
            let stem = match entries_of.get(record.hash.as_str()).and_then(|list| list.first()) {
                Some(entry) => {
                    let work = clean_file_name(&Self::file_name_for(entry));
                    if works_named.insert((dir.clone(), entry.id.clone(), ending.clone())) || own.is_empty() {
                        work
                    } else {
                        format!("{work} - {own}")
                    }
                }
                None => own,
            };
            let stem = cut_at_word(&stem);
            let stem = if stem.is_empty() { "file".to_owned() } else { stem };
            let place = into.join(dir.iter().collect::<PathBuf>());
            let name = taken.entry(dir.clone()).or_default().claim(&place, &stem, &ending, false);
            jobs[i] = Some(Job { record, dir: dir.clone(), name });
        }
        let jobs: Vec<Job> = jobs.into_iter().flatten().collect();
        out.total = jobs.len();

        // Every folder is made, those with no files under them at any depth
        // among them: the writer sees them in the store, and looks for them
        // in what was exported.
        fs::create_dir_all(into).context(|| tr!("io-creating", path = into))?;
        let mut made: Vec<&Vec<String>> = dirs.values().filter(|d| !d.is_empty()).collect();
        made.sort();
        for dir in made {
            let path = into.join(dir.iter().collect::<PathBuf>());
            match fs::create_dir_all(&path) {
                Ok(()) => out.folders += 1,
                Err(e) => out.problems.push(Error::io(tr!("io-creating", path = &path), e).to_string()),
            }
        }

        // The files, copied to a name of their own first and renamed, so
        // that a file stopped half-way is never left under its name.
        let mut written: Vec<&Job> = Vec::new();
        for (done, job) in jobs.iter().enumerate() {
            if stop.load(Ordering::Relaxed) {
                out.stopped = true;
                break;
            }
            progress(done, out.total, &job.name);
            match self.export_one(job, into) {
                Ok(()) => written.push(job),
                Err(e) => out.problems.push(format!("{}: {e}", job.name)),
            }
        }
        out.files = written.len();
        progress(out.files, out.total, "");

        if with_bib {
            let mut paths: HashMap<String, Vec<String>> = HashMap::new();
            for job in &written {
                let relative = job.dir.iter().chain(std::iter::once(&job.name)).cloned().collect::<Vec<_>>().join("/");
                for e in entries_of.get(job.record.hash.as_str()).into_iter().flatten() {
                    paths.entry(e.id.clone()).or_default().push(relative.clone());
                }
            }
            let ids: Vec<String> =
                self.entries.iter().filter(|e| paths.contains_key(&e.id)).map(|e| e.id.clone()).collect();
            // A references.bib that is there already is not overwritten.
            let name = Taken::default().claim(into, "references", ".bib", false);
            let path = into.join(name);
            write_atomic(&path, self.export_with_paths(&ids, &paths).as_bytes())?;
            out.bib = Some(path.display().to_string());
        }
        Ok(out)
    }

    fn export_one(&self, job: &Job, into: &Path) -> Result<()> {
        let source = attachments::absolute(&self.dir, &job.record.path)?;
        if !source.is_file() {
            return Err(Error::not_found(tr!("core-library-the-stored-file", path = &job.record.path)));
        }
        let dir = into.join(job.dir.iter().collect::<PathBuf>());
        let target = dir.join(&job.name);
        let tmp = dir.join(format!(".tmp-{}", uuid::Uuid::new_v4()));
        if let Err(e) = fs::copy(&source, &tmp) {
            let _ = fs::remove_file(&tmp);
            return Err(Error::io(tr!("io-copying", path = &source), e));
        }
        fs::rename(&tmp, &target).map_err(|e| {
            let _ = fs::remove_file(&tmp);
            Error::io(tr!("io-storing", path = &target), e)
        })
    }

    /// The entries as `export` writes them, each with the `file` field
    /// naming the paths given for it, and none where none are given.
    pub fn export_with_paths(&self, ids: &[String], paths: &HashMap<String, Vec<String>>) -> String {
        self.bib_of(Some(ids), |e| Some(paths.get(&e.id).cloned().unwrap_or_default()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::library::{draft_from_source, files};

    struct Desk {
        _tmp: tempfile::TempDir,
        root: PathBuf,
        lib: Library,
    }

    impl Desk {
        fn new() -> Self {
            let tmp = tempfile::tempdir().unwrap();
            let root = tmp.path().to_owned();
            let lib = Library::open_at(&root.join("library")).unwrap();
            Desk { _tmp: tmp, root, lib }
        }

        fn work(&mut self, source: &str) -> String {
            self.lib.add(&draft_from_source(source).unwrap()).unwrap().id
        }

        /// Takes a file in under its name, with what it holds, into a folder.
        fn file(&mut self, name: &str, content: &str, folder: Option<&str>) -> String {
            let dir = self.root.join("desk").join(uuid::Uuid::new_v4().to_string());
            fs::create_dir_all(&dir).unwrap();
            fs::write(dir.join(name), content).unwrap();
            let stop = AtomicBool::new(false);
            let (taken, problems) =
                files::store_paths(self.lib.dir(), &[dir.join(name)], false, &mut |_, _, _| {}, &stop);
            assert!(problems.is_empty(), "{problems:?}");
            let got = self.lib.enter_taken(&taken, folder).unwrap();
            got.files.first().or(got.same.first()).unwrap().hash.clone()
        }

        fn assign(&mut self, hash: &str, id: &str) {
            let path = self.lib.files.get(hash).unwrap().path.clone();
            self.lib.attach_stored(id, &path, None).unwrap();
        }

        fn folder(&mut self, name: &str, parent: Option<&str>) -> String {
            let id = self.lib.files.folder_create(name, parent).unwrap().id;
            self.lib.save_files().unwrap();
            id
        }

        fn export(&self, selection: ExportSelection, into: &str, with_bib: bool) -> (PathBuf, Exported) {
            let into = self.root.join(into);
            let stop = AtomicBool::new(false);
            let got = self.lib.export_files(&selection, &into, with_bib, &mut |_, _, _| {}, &stop).unwrap();
            (into, got)
        }
    }

    /// The files under a folder, by their paths relative to it, with what they hold.
    fn listing(dir: &Path) -> Vec<(String, String)> {
        fn walk(dir: &Path, at: &str, out: &mut Vec<(String, String)>) {
            for e in fs::read_dir(dir).unwrap().flatten() {
                let name = e.file_name().to_string_lossy().into_owned();
                let path = if at.is_empty() { name } else { format!("{at}/{name}") };
                if e.file_type().unwrap().is_dir() {
                    out.push((format!("{path}/"), String::new()));
                    walk(&e.path(), &path, out);
                } else {
                    out.push((path, fs::read_to_string(e.path()).unwrap_or_default()));
                }
            }
        }
        let mut out = Vec::new();
        walk(dir, "", &mut out);
        out.sort();
        out
    }

    /// A store of files in folders, some of them of references:
    ///
    /// ```text
    /// Greek/plate.png                 no reference
    /// Greek/Homer/nagy.pdf            Nagy 1979
    /// Greek/Homer/text.pdf            West 1966, and its
    /// Greek/Homer/commentary.pdf        second file
    /// Greek/Tragedy/tgf.pdf           Snell 1971, who edited it
    /// Latin/Virgil/                   nothing, at any depth
    /// scan0001.pdf                    no reference
    /// notes.txt, notes.txt            no reference, two of one name
    /// ```
    fn store() -> (Desk, HashMap<&'static str, String>) {
        let mut desk = Desk::new();
        let nagy = desk.work("@book{, author={Nagy, Gregory}, title={The Best of the Achaeans}, date={1979}}");
        let west = desk.work("@book{, author={West, M. L.}, title={Theogony}, date={1966}}");
        let snell = desk.work("@book{, editor={Snell, Bruno}, title={Tragicorum Graecorum Fragmenta}, date={1971}}");
        let greek = desk.folder("Greek", None);
        let homer = desk.folder("Homer", Some(&greek));
        let tragedy = desk.folder("Tragedy", Some(&greek));
        let latin = desk.folder("Latin", None);
        desk.folder("Virgil", Some(&latin));
        let mut h = HashMap::new();
        h.insert("plate", desk.file("plate.png", "plate", Some(&greek)));
        h.insert("nagy", desk.file("nagy.pdf", "nagy", Some(&homer)));
        h.insert("text", desk.file("text.pdf", "west text", Some(&homer)));
        h.insert("commentary", desk.file("commentary.pdf", "west commentary", Some(&homer)));
        h.insert("tgf", desk.file("tgf.pdf", "tgf", Some(&tragedy)));
        h.insert("scan", desk.file("scan0001.pdf", "scan", None));
        h.insert("notes", desk.file("notes.txt", "notes one", None));
        h.insert("notes2", desk.file("notes.txt", "notes two", None));
        desk.assign(&h["nagy"], &nagy);
        desk.assign(&h["text"], &west);
        desk.assign(&h["commentary"], &west);
        desk.assign(&h["tgf"], &snell);
        h.insert("greek", greek);
        (desk, h)
    }

    #[test]
    fn the_whole_store_in_its_folders_under_readable_names() {
        let (desk, _) = store();
        let into = desk.root.join("out");
        fs::create_dir_all(&into).unwrap();
        // What is there already is not overwritten.
        fs::write(into.join("scan0001.pdf"), "there before").unwrap();
        let (into, got) = desk.export(ExportSelection::All, "out", true);

        let mut found = listing(&into);
        for (name, content) in &mut found {
            if name == "references.bib" {
                content.clear();
            }
        }
        assert_eq!(
            found,
            [
                ("Greek/", ""),
                ("Greek/Homer/", ""),
                ("Greek/Homer/Nagy 1979 - The Best of the Achaeans.pdf", "nagy"),
                ("Greek/Homer/West 1966 - Theogony - commentary.pdf", "west commentary"),
                ("Greek/Homer/West 1966 - Theogony.pdf", "west text"),
                ("Greek/Tragedy/", ""),
                ("Greek/Tragedy/Snell 1971 - Tragicorum Graecorum Fragmenta.pdf", "tgf"),
                ("Greek/plate.png", "plate"),
                ("Latin/", ""),
                ("Latin/Virgil/", ""),
                ("notes (2).txt", "notes two"),
                ("notes.txt", "notes one"),
                ("references.bib", ""),
                ("scan0001 (2).pdf", "scan"),
                ("scan0001.pdf", "there before"),
            ]
            .map(|(a, b)| (a.to_owned(), b.to_owned()))
        );
        assert_eq!((got.files, got.total, got.folders, got.stopped), (8, 8, 5, false));
        assert!(got.problems.is_empty(), "{:?}", got.problems);
        assert_eq!(got.bib.as_deref(), Some(into.join("references.bib").display().to_string().as_str()));

        // The .bib names the exported files relative to it, with forward
        // slashes, and nothing of the application's own.
        let bib = fs::read_to_string(into.join("references.bib")).unwrap();
        assert!(bib.contains("{Greek/Homer/Nagy 1979 - The Best of the Achaeans.pdf}"), "{bib}");
        assert!(
            bib.contains("{Greek/Homer/West 1966 - Theogony.pdf;Greek/Homer/West 1966 - Theogony - commentary.pdf}"),
            "{bib}"
        );
        assert!(bib.contains("{Greek/Tragedy/Snell 1971 - Tragicorum Graecorum Fragmenta.pdf}"), "{bib}");
        assert!(!bib.contains("attachments/") && !bib.contains("glaukopis-"), "{bib}");
        assert_eq!(bib.matches('@').count(), 3);

        // Again into the same folder: the folders are written into, nothing
        // is overwritten, and a second references.bib is numbered.
        let (_, again) = desk.export(ExportSelection::All, "out", true);
        assert_eq!((again.files, again.folders), (8, 5));
        assert!(into.join("Greek/Homer/Nagy 1979 - The Best of the Achaeans (2).pdf").is_file());
        assert!(into.join("references (2).bib").is_file());
        assert!(again.bib.unwrap().ends_with("references (2).bib"));
        let bib = fs::read_to_string(into.join("references (2).bib")).unwrap();
        assert!(bib.contains("Greek/Homer/Nagy 1979 - The Best of the Achaeans (2).pdf"), "{bib}");
        assert!(
            !fs::read_dir(into.join("Greek/Homer"))
                .unwrap()
                .flatten()
                .any(|e| e.file_name().to_string_lossy().starts_with(".tmp-"))
        );
    }

    #[test]
    fn a_folder_and_chosen_files() {
        let (desk, h) = store();
        let (into, got) = desk.export(ExportSelection::Folder { id: h["greek"].clone() }, "greek", false);
        let names: Vec<String> = listing(&into).into_iter().map(|(a, _)| a).collect();
        assert_eq!(
            names,
            [
                "Homer/",
                "Homer/Nagy 1979 - The Best of the Achaeans.pdf",
                "Homer/West 1966 - Theogony - commentary.pdf",
                "Homer/West 1966 - Theogony.pdf",
                "Tragedy/",
                "Tragedy/Snell 1971 - Tragicorum Graecorum Fragmenta.pdf",
                "plate.png",
            ]
        );
        assert_eq!((got.files, got.folders, got.bib), (5, 2, None));

        // Chosen files directly in the folder, once each; the commentary,
        // without the text, is the work's only file there.
        let chosen = vec![h["commentary"].clone(), h["scan"].clone(), h["commentary"].clone(), "f".repeat(64)];
        let (into, got) = desk.export(ExportSelection::Files { hashes: chosen }, "chosen", true);
        let names: Vec<String> = listing(&into).into_iter().map(|(a, _)| a).collect();
        assert_eq!(names, ["West 1966 - Theogony.pdf", "references.bib", "scan0001.pdf"]);
        assert_eq!((got.files, got.total, got.folders, got.problems.len()), (2, 2, 0, 1));
        let bib = fs::read_to_string(into.join("references.bib")).unwrap();
        assert!(bib.contains("{West 1966 - Theogony.pdf}") && bib.matches('@').count() == 1, "{bib}");

        let missing = desk.lib.export_files(
            &ExportSelection::Folder { id: "nothing".into() },
            &desk.root.join("none"),
            false,
            &mut |_, _, _| {},
            &AtomicBool::new(false),
        );
        assert_eq!(missing.unwrap_err().kind(), "not-found");
    }

    #[test]
    fn stopped_it_keeps_what_was_written() {
        let (desk, _) = store();
        let stop = AtomicBool::new(false);
        let mut told = Vec::new();
        let into = desk.root.join("stopped");
        let got = desk
            .lib
            .export_files(
                &ExportSelection::All,
                &into,
                true,
                &mut |done, total, name| {
                    told.push((done, total, name.to_owned()));
                    if done == 2 {
                        stop.store(true, Ordering::Relaxed);
                    }
                },
                &stop,
            )
            .unwrap();
        assert_eq!((got.files, got.total, got.stopped), (3, 8, true));
        assert_eq!(told.first().map(|t| (t.0, t.1)), Some((0, 8)));
        assert_eq!(told.last(), Some(&(3, 8, String::new())));
        let files = listing(&into).into_iter().filter(|(a, _)| !a.ends_with('/') && a != "references.bib").count();
        assert_eq!(files, 3);
        // The .bib names what was written, and only that.
        let bib = fs::read_to_string(got.bib.unwrap()).unwrap();
        let named = bib.lines().filter(|l| l.trim_start().starts_with("file ")).count();
        assert_eq!(named, bib.matches('@').count());
    }

    #[test]
    fn names_that_are_too_long_are_cut_at_a_word() {
        let long = "word ".repeat(60);
        let cut = cut_at_word(long.trim());
        assert!(cut.chars().count() <= NAME_CHARS && cut.ends_with("word"), "{cut}");
        let greek = "Ἰλιάς Ὀδύσσεια ".repeat(20);
        let cut = cut_at_word(greek.trim());
        assert!(cut.len() <= NAME_BYTES && (cut.ends_with("Ἰλιάς") || cut.ends_with("Ὀδύσσεια")), "{cut}");
        assert_eq!(cut_at_word("Nagy 1979 - The Best"), "Nagy 1979 - The Best");
        let dangling = format!("{} - Title", "a".repeat(176));
        assert_eq!(cut_at_word(&dangling), "a".repeat(176));
        assert_eq!(cut_at_word(&"x".repeat(300)).len(), NAME_CHARS);

        let mut desk = Desk::new();
        let hash = desk.file("lorem.pdf", "long", None);
        desk.lib.files.rename(&hash, &format!("{}.pdf", "Lorem ipsum dolor sit amet ".repeat(8).trim())).unwrap();
        let (into, got) = desk.export(ExportSelection::All, "long", false);
        assert_eq!(got.files, 1);
        let written = listing(&into).remove(0).0;
        assert!(written.ends_with(".pdf") && written.chars().count() <= NAME_CHARS + 4, "{written}");
        assert!(written.trim_end_matches(".pdf").ends_with(char::is_alphabetic), "{written}");
    }
}
