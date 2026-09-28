//! The programs the application works with: Pandoc and Typst, and LaTeX
//! where it is installed. They are looked for where the settings say, then on
//! the path, then beside the application.

use std::ffi::OsStr;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use serde::Serialize;

use crate::error::{Error, Result};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Tool {
    pub path: PathBuf,
    pub version: String,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Tools {
    pub pandoc: Option<Tool>,
    pub typst: Option<Tool>,
    /// The engines of LaTeX that are installed, the preferred first.
    pub latex: Vec<String>,
    /// The version of the document model that this Pandoc reads.
    pub pandoc_api: Vec<u32>,
}

#[derive(Debug, Clone, Default)]
pub struct Configured {
    pub pandoc: Option<String>,
    pub typst: Option<String>,
    /// Directories to look in after the path: beside the application.
    pub beside: Vec<PathBuf>,
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

pub fn command(program: &Path) -> Command {
    #[cfg_attr(not(windows), allow(unused_mut))]
    let mut c = Command::new(program);
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
            format!("it ended with {}", out.status)
        } else {
            messages.lines().take(12).collect::<Vec<_>>().join("\n")
        };
        return Err(Error::Program { program: name.into(), message });
    }
    Ok(Output { stdout: out.stdout, messages })
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
        tools.pandoc = Some(Tool { path, version });
    }
    if let Some(path) = find("typst", configured.typst.as_deref(), &configured.beside) {
        let version = version_of(&path, "Typst");
        tools.typst = Some(Tool { path, version });
    }
    for engine in ["lualatex", "xelatex", "pdflatex"] {
        if find(engine, None, &[]).is_some() {
            tools.latex.push(engine.to_owned());
        }
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
        self.pandoc.as_ref().ok_or_else(|| Error::MissingProgram { program: "Pandoc".into() })
    }

    pub fn typst(&self) -> Result<&Tool> {
        self.typst.as_ref().ok_or_else(|| Error::MissingProgram { program: "Typst".into() })
    }
}

/// The families of fonts that Typst finds on this computer.
pub fn fonts(typst: &Tool) -> Vec<String> {
    run(&typst.path, "Typst", ["fonts"], None, None)
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| {
            let mut list: Vec<String> = s.lines().map(str::trim).filter(|l| !l.is_empty()).map(str::to_owned).collect();
            list.sort_by_key(|f| f.to_lowercase());
            list.dedup();
            list
        })
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

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
}
