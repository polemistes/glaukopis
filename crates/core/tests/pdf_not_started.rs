//! A PDF brought in is looked at in a process of its own. Where no such
//! process can be started, the application does not read the file itself:
//! it says why it was not read. In a test binary of its own, since the
//! program for such processes is set once for the whole process.

use std::path::PathBuf;

use glaukopis_core::import::pdf::identify;
use glaukopis_core::isolated::set_program;

#[test]
fn a_pdf_is_not_read_here_when_no_process_can_read_it() {
    set_program(PathBuf::from("/nowhere/at/all/glaukopis-isolated"));
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("received.pdf");
    std::fs::write(&path, b"%PDF-1.4\n% a file that is never taken apart here\n%%EOF\n").unwrap();
    let error = identify(&path).unwrap_err().to_string();
    assert!(error.contains("received.pdf") && error.contains("no process could be started"), "{error}");
}
