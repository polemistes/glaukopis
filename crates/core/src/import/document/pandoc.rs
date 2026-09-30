//! Running Pandoc, which reads the file, to its end or until it is stopped.

use super::*;

pub(super) fn stopped() -> Error {
    Error::invalid(tr!("core-import-document-stopped"))
}

/// Runs Pandoc to its end, unless it is stopped before. What it writes goes
/// to files, so that nothing has to be listened to meanwhile.
pub(super) fn pandoc(tools: &Tools, args: &[String], dir: &Path, work: &Path, stop: &AtomicBool) -> Result<Vec<u8>> {
    let program = &tools.pandoc()?.path;
    let out = work.join("document.json");
    let said = work.join("messages.txt");
    let failed = |e: std::io::Error| Error::Program { program: "Pandoc".into(), message: e.to_string() };
    let mut child = tools::command(program)
        .args(args)
        .arg("-o")
        .arg(&out)
        .current_dir(dir)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(fs::File::create(&said).context(|| tr!("io-writing", path = &said))?)
        .spawn()
        .map_err(failed)?;
    let status = loop {
        if stop.load(Ordering::Relaxed) {
            let _ = child.kill();
            let _ = child.wait();
            return Err(stopped());
        }
        match child.try_wait().map_err(failed)? {
            Some(status) => break status,
            None => std::thread::sleep(Duration::from_millis(30)),
        }
    };
    if !status.success() {
        let messages = fs::read_to_string(&said).unwrap_or_default();
        // What it says can be long, and is not written for the one who reads this: the beginning is enough.
        let message: String = messages.trim().lines().take(3).collect::<Vec<_>>().join(" ");
        let message = if message.chars().count() > 300 {
            format!("{}…", message.chars().take(300).collect::<String>().trim_end())
        } else {
            message
        };
        return Err(Error::Program {
            program: "Pandoc".into(),
            message: if message.is_empty() { tr!("program-ended", status = status.to_string()) } else { message },
        });
    }
    fs::read(&out).context(|| tr!("io-reading", path = &out))
}
