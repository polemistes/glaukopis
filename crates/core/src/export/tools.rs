//! The programs the application works with: Pandoc and Typst, Tesseract,
//! which reads text in pictures, and LaTeX and Poppler's `pdftoppm` where they
//! are installed. They are looked for where the settings say, then on the
//! path, then beside the application.

use std::ffi::OsStr;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use serde::Serialize;

use crate::error::{Error, Result};
use crate::tr;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Tool {
    pub path: PathBuf,
    pub version: String,
    /// Where it is older than what Glaukopis needs: the least that will do.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub least: Option<String>,
    /// For Tesseract, where languages are imported: the folder of data it
    /// is given (`languages::merge_tessdata`).
    #[serde(skip)]
    pub data: Option<PathBuf>,
}

/// The least Pandoc that will do: the first to write citations as the Typst
/// that is compiled in reads them (`#cite(<key>)`, Typst 0.9; Pandoc 3.1.10,
/// 2023-11). Ubuntu 24.04 still ships 3.1.3, which wrote them as strings.
pub const LEAST_PANDOC: &str = "3.1.10";

/// A version as numbers: `3.1.2` as 3, 1, 2. What is not a number ends it.
fn numbers(version: &str) -> Vec<u32> {
    version.split(['.', '-', '+']).map_while(|part| part.parse().ok()).collect()
}

/// Whether a version is older than the least that will do. One that cannot be read is let pass.
pub fn older(version: &str, least: &str) -> bool {
    let (have, need) = (numbers(version), numbers(least));
    !have.is_empty() && have < need
}

impl Tool {
    fn found(path: PathBuf, version: String, least: Option<&str>) -> Tool {
        let least = least.filter(|l| older(&version, l)).map(str::to_owned);
        if let Some(least) = &least {
            tracing::warn!(path = %path.display(), %version, %least, "a program that is older than what is needed");
        }
        Tool { path, version, least, data: None }
    }
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Tools {
    pub pandoc: Option<Tool>,
    /// The engines of LaTeX that are installed, the preferred first.
    pub latex: Vec<String>,
    /// The version of the document model that this Pandoc reads.
    pub pandoc_api: Vec<u32>,
    pub tesseract: Option<Tool>,
    /// The languages Tesseract has data for, by its names for them: `eng`,
    /// `nor`, `grc`, `chi_sim`. Not the data that reads no language (`osd`).
    pub ocr_languages: Vec<String>,
    /// Draws the pages of PDFs that cannot be drawn otherwise.
    pub pdftoppm: Option<Tool>,
}

#[derive(Debug, Clone, Default)]
pub struct Configured {
    pub pandoc: Option<String>,
    pub tesseract: Option<String>,
    /// Directories to look in after the path: beside the application.
    pub beside: Vec<PathBuf>,
    /// The languages imported, which Tesseract is given (ADR 0032).
    pub languages: Option<crate::languages::Languages>,
}

fn executable(name: &str) -> String {
    if cfg!(windows) && !name.to_ascii_lowercase().ends_with(".exe") { format!("{name}.exe") } else { name.to_owned() }
}

pub fn find(program: &str, configured: Option<&str>, beside: &[PathBuf]) -> Option<PathBuf> {
    if let Some(c) = configured.map(str::trim).filter(|c| !c.is_empty()) {
        let p = PathBuf::from(c);
        if p.is_file() {
            return Some(p);
        }
        // A directory may have been given.
        let inside = p.join(executable(program));
        if inside.is_file() {
            return Some(inside);
        }
    }
    let name = executable(program);
    if let Some(paths) = std::env::var_os("PATH") {
        for dir in std::env::split_paths(&paths) {
            let candidate = dir.join(&name);
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    beside.iter().map(|d| d.join(&name)).find(|p| p.is_file())
}

/// Tesseract, given the folder of data it is to read from where languages
/// are imported.
pub fn tesseract(tool: &Tool) -> Command {
    let mut c = command(&tool.path);
    if let Some(data) = &tool.data {
        c.env("TESSDATA_PREFIX", data);
    }
    c
}

pub fn command(program: &Path) -> Command {
    let mut c = Command::new(program);
    // Tesseract that comes with the application, on Windows and macOS, has
    // the data of its languages beside it, where it does not look by itself.
    let bundled = program.parent().map(|dir| dir.join("tessdata")).filter(|dir| dir.is_dir());
    let is_tesseract = program.file_stem().is_some_and(|n| n.eq_ignore_ascii_case("tesseract"));
    if let Some(data) = bundled.filter(|_| is_tesseract && std::env::var_os("TESSDATA_PREFIX").is_none()) {
        c.env("TESSDATA_PREFIX", data);
    }
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        // No console window.
        c.creation_flags(0x0800_0000);
    }
    c
}

#[derive(Debug)]
pub struct Output {
    pub stdout: Vec<u8>,
    /// What the program said beside its output: warnings.
    pub messages: String,
}

/// Runs a program to its end. What it writes as errors is returned when it
/// succeeds and is the error when it fails.
pub fn run<I, S>(program: &Path, name: &str, args: I, input: Option<&[u8]>, dir: Option<&Path>) -> Result<Output>
where
    I: IntoIterator<Item = S>,
    S: AsRef<OsStr>,
{
    let mut c = command(program);
    c.args(args).stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped());
    if let Some(d) = dir {
        c.current_dir(d);
    }
    let mut child = c.spawn().map_err(|e| Error::Program { program: name.into(), message: e.to_string() })?;
    {
        let mut stdin = child.stdin.take().expect("stdin was asked for");
        if let Some(bytes) = input {
            // A program that ends before reading everything is reported by its status.
            let _ = stdin.write_all(bytes);
        }
    }
    let out = child.wait_with_output().map_err(|e| Error::Program { program: name.into(), message: e.to_string() })?;
    let messages = String::from_utf8_lossy(&out.stderr).trim().to_owned();
    if !out.status.success() {
        let message = if messages.is_empty() {
            tr!("program-ended", status = out.status.to_string())
        } else {
            messages.lines().take(12).collect::<Vec<_>>().join("\n")
        };
        return Err(Error::Program { program: name.into(), message });
    }
    Ok(Output { stdout: out.stdout, messages })
}

/// The kind of the error of a program that was ended before its end.
pub const STOPPED: &str = "stopped";

/// Runs a program to its end, unless `stop` is set before: then the program
/// is ended, and the error says so by its kind. What the program is given
/// is written, and what it writes is read, each by a thread of its own, so
/// that it is never kept waiting while it is watched.
pub fn run_until<I, S>(
    program: &Path,
    name: &str,
    args: I,
    input: Option<&[u8]>,
    dir: Option<&Path>,
    stop: &AtomicBool,
) -> Result<Output>
where
    I: IntoIterator<Item = S>,
    S: AsRef<OsStr>,
{
    let mut c = command(program);
    c.args(args);
    if let Some(d) = dir {
        c.current_dir(d);
    }
    run_command_until(c, name, input, stop)
}

/// As [`run_until`], for a command that has been made ready elsewhere: with
/// what it is to find in its environment, for one.
pub fn run_command_until(mut c: Command, name: &str, input: Option<&[u8]>, stop: &AtomicBool) -> Result<Output> {
    let failed = |e: std::io::Error| Error::Program { program: name.into(), message: e.to_string() };
    c.stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped());
    let mut child = c.spawn().map_err(failed)?;
    let stdin = child.stdin.take().expect("stdin was asked for");
    let mut stdout = child.stdout.take().expect("stdout was asked for");
    let mut stderr = child.stderr.take().expect("stderr was asked for");

    let (status, written, said) = std::thread::scope(|scope| {
        scope.spawn(move || {
            let mut stdin = stdin;
            if let Some(bytes) = input {
                // A program that ends before reading everything is reported by its status.
                let _ = stdin.write_all(bytes);
            }
        });
        let written = scope.spawn(move || {
            let mut all = Vec::new();
            let _ = stdout.read_to_end(&mut all);
            all
        });
        let said = scope.spawn(move || {
            let mut all = Vec::new();
            let _ = stderr.read_to_end(&mut all);
            all
        });
        let status = loop {
            if stop.load(Ordering::Relaxed) {
                let _ = child.kill();
                let _ = child.wait();
                break None;
            }
            match child.try_wait() {
                Ok(Some(status)) => break Some(Ok(status)),
                Ok(None) => std::thread::sleep(Duration::from_millis(15)),
                Err(e) => break Some(Err(e)),
            }
        };
        (status, written.join().unwrap_or_default(), said.join().unwrap_or_default())
    });
    let Some(status) = status else {
        return Err(Error::Refused { kind: STOPPED, message: tr!("program-stopped", program = name) });
    };
    let status = status.map_err(failed)?;
    let messages = String::from_utf8_lossy(&said).trim().to_owned();
    if !status.success() {
        let message = if messages.is_empty() {
            tr!("program-ended", status = status.to_string())
        } else {
            messages.lines().take(12).collect::<Vec<_>>().join("\n")
        };
        return Err(Error::Program { program: name.into(), message });
    }
    Ok(Output { stdout: written, messages })
}

fn version_of(path: &Path, name: &str) -> String {
    run(path, name, ["--version"], None, None)
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .and_then(|s| s.lines().next().map(str::to_owned))
        .map(|line| {
            line.split_whitespace()
                .find(|w| w.chars().next().is_some_and(|c| c.is_ascii_digit()))
                .unwrap_or("")
                .to_owned()
        })
        .unwrap_or_default()
}

/// What a program says of itself, on either stream, whatever it ends with:
/// some say their version as an error.
fn said(path: &Path, args: &[&str]) -> String {
    said_by(command(path), args)
}

fn said_by(mut c: Command, args: &[&str]) -> String {
    let Ok(out) = c.args(args).stdin(Stdio::null()).output() else { return String::new() };
    let mut all = String::from_utf8_lossy(&out.stdout).into_owned();
    all.push('\n');
    all.push_str(&String::from_utf8_lossy(&out.stderr));
    all
}

/// The version in what a program says of itself: the first word that begins
/// with a digit, on the first line that has one.
fn version_in(said: &str) -> String {
    said.lines()
        .find_map(|line| line.split_whitespace().find(|w| w.chars().next().is_some_and(|c| c.is_ascii_digit())))
        .unwrap_or("")
        .to_owned()
}

/// The folder of data Tesseract reads from, as `tesseract --list-langs`
/// says it: `List of available languages in "/usr/share/tessdata/" (3):`.
pub fn data_dir_in(said: &str) -> Option<PathBuf> {
    let line = said.lines().find(|line| line.contains("List of available languages"))?;
    let (_, rest) = line.split_once('"')?;
    let (dir, _) = rest.split_once('"')?;
    Some(PathBuf::from(dir)).filter(|d| !d.as_os_str().is_empty())
}

/// The languages in what `tesseract --list-langs` says: a line that tells
/// where they are, and a name on each line after it. Older versions say it
/// as an error, which is why both are read.
pub fn languages_in(said: &str) -> Vec<String> {
    let mut languages: Vec<String> = said
        .lines()
        .skip_while(|line| !line.contains("List of available languages"))
        .skip(1)
        .map(str::trim)
        .filter(|name| !name.is_empty() && !name.contains(char::is_whitespace))
        // Orientation and script, and mathematics: they read no language.
        .filter(|name| !matches!(*name, "osd" | "equ"))
        .map(str::to_owned)
        .collect();
    languages.sort();
    languages.dedup();
    languages
}

pub fn discover(configured: &Configured) -> Tools {
    let mut tools = Tools::default();
    if let Some(path) = find("pandoc", configured.pandoc.as_deref(), &configured.beside) {
        let version = version_of(&path, "Pandoc");
        tools.pandoc_api = run(&path, "Pandoc", ["-f", "markdown", "-t", "json"], Some(b""), None)
            .ok()
            .and_then(|o| serde_json::from_slice::<serde_json::Value>(&o.stdout).ok())
            .and_then(|v| {
                v["pandoc-api-version"]
                    .as_array()
                    .map(|a| a.iter().filter_map(|n| n.as_u64().map(|n| n as u32)).collect::<Vec<_>>())
            })
            .filter(|v: &Vec<u32>| v.len() >= 2)
            .unwrap_or_else(|| vec![1, 23, 1]);
        tools.pandoc = Some(Tool::found(path, version, Some(LEAST_PANDOC)));
    }
    for engine in ["lualatex", "xelatex", "pdflatex"] {
        if find(engine, None, &[]).is_some() {
            tools.latex.push(engine.to_owned());
        }
    }
    if let Some(path) = find("tesseract", configured.tesseract.as_deref(), &configured.beside) {
        let version = version_in(&said(&path, &["--version"]));
        let mut listed = said(&path, &["--list-langs"]);
        let mut tool = Tool::found(path, version, None);
        // Languages imported: Tesseract is given them, with its own.
        if let Some(languages) = configured.languages.as_ref().filter(|l| l.has_ocr()) {
            let base = data_dir_in(&listed).filter(|d| d.is_dir());
            let merged = languages.tessdata();
            match crate::languages::merge_tessdata(
                base.as_deref(),
                &languages.dir(crate::languages::Kind::Ocr),
                &merged,
            ) {
                Ok(()) => {
                    tool.data = Some(merged);
                    listed = said_by(tesseract(&tool), &["--list-langs"]);
                }
                Err(error) => tracing::warn!(%error, "the languages imported could not be given to Tesseract"),
            }
        } else if let Some(languages) = &configured.languages {
            // None is imported: what was made for Tesseract before goes. Its
            // links go, not what they point to.
            let merged = languages.tessdata();
            if merged.exists()
                && let Err(error) = std::fs::remove_dir_all(&merged)
            {
                tracing::warn!(%error, "the data made for Tesseract could not be taken away");
            }
        }
        tools.ocr_languages = languages_in(&listed);
        tools.tesseract = Some(tool);
    }
    if let Some(path) = find("pdftoppm", None, &configured.beside) {
        let version = version_in(&said(&path, &["-v"]));
        tools.pdftoppm = Some(Tool::found(path, version, None));
    }
    tools
}

/// The names of the fonts of the system, in small letters. Nothing, where
/// that cannot be asked.
pub fn system_fonts() -> Option<Vec<String>> {
    let program = find("fc-list", None, &[])?;
    let out = run(&program, "fc-list", [":", "family"], None, None).ok()?;
    let mut names: Vec<String> = String::from_utf8_lossy(&out.stdout)
        .lines()
        .flat_map(|line| line.split(','))
        .map(|name| name.trim().to_lowercase())
        .filter(|name| !name.is_empty())
        .collect();
    names.sort();
    names.dedup();
    Some(names)
}

/// Whether a font is among those of the system. Where that cannot be asked,
/// it is taken to be.
pub fn has_font(fonts: &Option<Vec<String>>, family: &str) -> bool {
    match fonts {
        Some(names) => names.binary_search(&family.trim().to_lowercase()).is_ok(),
        None => !family.trim().is_empty(),
    }
}

impl Tools {
    /// The program that sets LaTeX: one that knows the fonts of the system and
    /// all of Unicode before one that does not.
    pub fn latex_engine(&self) -> Result<&str> {
        ["lualatex", "xelatex", "pdflatex"]
            .into_iter()
            .find(|e| self.latex.iter().any(|l| l == e))
            .ok_or_else(|| Error::MissingProgram { program: "LaTeX".into() })
    }

    pub fn pandoc(&self) -> Result<&Tool> {
        usable(self.pandoc.as_ref(), "Pandoc")
    }

    pub fn tesseract(&self) -> Result<&Tool> {
        self.tesseract.as_ref().ok_or_else(|| Error::MissingProgram { program: "Tesseract".into() })
    }
}

/// A program that is there and new enough, or what is wrong with it.
fn usable<'a>(tool: Option<&'a Tool>, program: &str) -> Result<&'a Tool> {
    let tool = tool.ok_or_else(|| Error::MissingProgram { program: program.into() })?;
    match &tool.least {
        Some(least) => Err(Error::Refused {
            kind: "old-program",
            message: tr!("program-too-old", program = program, version = &tool.version, least = least),
        }),
        None => Ok(tool),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn versions_older_than_what_is_needed() {
        assert!(older("3.1.1", LEAST_PANDOC));
        assert!(older("3.1.9", LEAST_PANDOC));
        assert!(!older("3.1.10", LEAST_PANDOC));
        assert!(!older("3.10.2", LEAST_PANDOC));
        assert!(older("3.0", LEAST_PANDOC));
        assert!(!older("3.2.0-rc1", LEAST_PANDOC));
        assert!(!older("", LEAST_PANDOC), "what cannot be read is let pass");
        let old = Tool::found("/usr/bin/pandoc".into(), "3.1.1".into(), Some(LEAST_PANDOC));
        let tools = Tools { pandoc: Some(old), ..Default::default() };
        let said = tools.pandoc().unwrap_err().to_string();
        assert!(said.contains("3.1.1") && said.contains("3.1.10"), "{said}");
    }

    #[test]
    fn looks_where_it_is_told_first() {
        let tmp = tempfile::tempdir().unwrap();
        let program = tmp.path().join(executable("pandoc"));
        std::fs::write(&program, "").unwrap();
        assert_eq!(find("pandoc", Some(program.to_str().unwrap()), &[]), Some(program.clone()));
        // A directory instead of the program.
        assert_eq!(find("pandoc", Some(tmp.path().to_str().unwrap()), &[]), Some(program.clone()));
        assert_eq!(find("no-such-program-xyz", None, &[tmp.path().to_owned()]), None);
        assert_eq!(find("pandoc", Some("/nonexistent/pandoc"), &[]).is_some(), find("pandoc", None, &[]).is_some());
    }

    #[test]
    fn a_failure_tells_what_the_program_said() {
        let Some(sh) = find("sh", None, &[]) else { return };
        let ok = run(&sh, "sh", ["-c", "cat; echo warning >&2"], Some(b"in"), None).unwrap();
        assert_eq!(ok.stdout, b"in");
        assert_eq!(ok.messages, "warning");
        let err = run(&sh, "sh", ["-c", "echo broken >&2; exit 3"], None, None).unwrap_err();
        assert_eq!(err.to_string(), "sh failed: broken");
        assert_eq!(err.kind(), "program");
    }

    #[test]
    fn what_tesseract_and_poppler_say_of_themselves() {
        let listed = "List of available languages in \"/usr/share/tessdata/\" (5):\neng\nnor\nosd\ngrc\nscript/Latin\n";
        assert_eq!(languages_in(listed), vec!["eng", "grc", "nor", "script/Latin"]);
        // Said as an error by older versions, after what was said before it.
        let older = "\nWarning: something\nList of available languages (2):\ndeu\nequ\n";
        assert_eq!(languages_in(older), vec!["deu"]);
        assert!(languages_in("Error opening data file").is_empty());

        assert_eq!(version_in("tesseract 5.5.3\n leptonica-1.87.0\n"), "5.5.3");
        assert_eq!(version_in("\npdftoppm version 26.08.0\nCopyright 2005-2026"), "26.08.0");
        assert_eq!(version_in(""), "");
    }

    #[test]
    fn the_folder_of_tesseracts_data_is_read_from_what_it_says() {
        let listed = "List of available languages in \"/usr/share/tessdata/\" (5):\neng\nnor\n";
        assert_eq!(data_dir_in(listed), Some(PathBuf::from("/usr/share/tessdata/")));
        assert_eq!(data_dir_in("List of available languages (2):\neng\n"), None);
        assert_eq!(data_dir_in(""), None);
    }

    #[test]
    fn a_program_can_be_given_its_environment_and_stopped() {
        let Some(sh) = find("sh", None, &[]) else { return };
        let mut c = command(&sh);
        c.args(["-c", "echo $OMP_THREAD_LIMIT"]).env("OMP_THREAD_LIMIT", "1");
        let out = run_command_until(c, "sh", None, &AtomicBool::new(false)).unwrap();
        assert_eq!(String::from_utf8_lossy(&out.stdout).trim(), "1");

        let stop = AtomicBool::new(true);
        let err = run_until(&sh, "sh", ["-c", "sleep 5"], None, None, &stop).unwrap_err();
        assert_eq!(err.kind(), STOPPED);
    }
}
