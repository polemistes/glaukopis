//! Printing (record 0075): the window's page is printed as the system
//! prints, the pages to be printed having been laid into it by the page with
//! a style for print. On Linux through WebKitGTK's print operation, with
//! GTK's own dialog and the paper of the job set to the document's page
//! before it opens; on Windows and macOS through Tauri's print, which opens
//! Edge's print dialog and the print sheet of the system.

use serde::{Deserialize, Serialize};

use crate::error::CommandResult;

/// The size of the pages to be printed, in points.
#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Paper {
    pub width: f64,
    pub height: f64,
}

/// Prints the window's page through the system's dialog. With `to_file`,
/// on Linux, to a PDF at that path with no dialog and no printer, which is
/// how the e2e scripts print. Whether the printing is over when it returns:
/// so on Linux, where WebKit says when it is; elsewhere it returns as soon as
/// the dialog is asked for, and the page keeps the pages until the system
/// has done with them.
#[tauri::command]
pub async fn print_pages(
    window: tauri::WebviewWindow,
    paper: Option<Paper>,
    to_file: Option<String>,
) -> CommandResult<bool> {
    #[cfg(target_os = "linux")]
    {
        linux::print(&window, paper, to_file).await.map(|()| true)
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = paper;
        if to_file.is_some() {
            return Err(crate::error::CommandError {
                kind: "unsupported",
                message: "printing to a file is done on Linux alone".into(),
            });
        }
        window.print().map(|()| false).map_err(|e| crate::error::CommandError { kind: "print", message: e.to_string() })
    }
}

/// The paper the system prints on where nothing else is asked, in points,
/// on which a picture is printed: GTK's, by the locale, on Linux. Nothing
/// elsewhere, where the page takes A4.
#[tauri::command]
pub async fn print_paper(app: tauri::AppHandle) -> Option<Paper> {
    #[cfg(target_os = "linux")]
    {
        linux::default_paper(&app)
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = app;
        None
    }
}

#[cfg(target_os = "linux")]
mod linux {
    use std::cell::RefCell;
    use std::rc::Rc;
    use std::sync::mpsc;

    use gtk::prelude::*;
    use webkit2gtk::{PrintOperation, PrintOperationExt, PrintOperationResponse};

    use super::Paper;
    use crate::error::{CommandError, CommandResult};

    /// The name GTK gives the printer that writes a file. GTK translates it
    /// by the locale, so that the scripts that print to a file run the
    /// application with `LC_ALL=C`.
    const FILE_PRINTER: &str = "Print to File";

    /// A paper of GTK's own list is taken where the page is one of them, to
    /// within this many points, so that a printer is asked for A4 and not
    /// for a paper of A4's size with a name of its own.
    const NEAR: f64 = 2.0;

    thread_local! {
        /// The printing that goes on, kept alive until it is over: WebKit
        /// lets go of a print operation nobody holds. On the main thread.
        static PRINTING: RefCell<Option<PrintOperation>> = const { RefCell::new(None) };
    }

    pub async fn print(
        window: &tauri::WebviewWindow,
        paper: Option<Paper>,
        to_file: Option<String>,
    ) -> CommandResult<()> {
        let (tx, rx) = mpsc::channel::<Result<(), String>>();
        window
            .with_webview(move |platform| start(&platform.inner(), paper, to_file, tx))
            .map_err(|e| CommandError { kind: "print", message: e.to_string() })?;
        // The dialog may stand open for as long as the writer likes: waited
        // for on a thread for blocking work, not on one the page's calls run on.
        let answer = tauri::async_runtime::spawn_blocking(move || rx.recv())
            .await
            .map_err(|e| CommandError { kind: "print", message: e.to_string() })?;
        match answer {
            Ok(Ok(())) => Ok(()),
            Ok(Err(message)) if message == "busy" => {
                Err(CommandError { kind: "busy", message: "something is being printed already".into() })
            }
            Ok(Err(message)) => Err(CommandError { kind: "print", message }),
            // The operation went without a word: nothing more can be known of it.
            Err(_) => Ok(()),
        }
    }

    /// On the main thread: the operation, its paper, and the dialog, or the
    /// printing to a file.
    fn start(
        webview: &webkit2gtk::WebView,
        paper: Option<Paper>,
        to_file: Option<String>,
        tx: mpsc::Sender<Result<(), String>>,
    ) {
        if PRINTING.with(|p| p.borrow().is_some()) {
            let _ = tx.send(Err("busy".into()));
            return;
        }
        let operation = PrintOperation::new(webview);
        let settings = gtk::PrintSettings::new();
        if let Some(paper) = paper {
            let (size, orientation) = paper_of(paper);
            let setup = gtk::PageSetup::new();
            setup.set_paper_size(&size);
            setup.set_orientation(orientation);
            for set in [
                gtk::PageSetup::set_top_margin,
                gtk::PageSetup::set_bottom_margin,
                gtk::PageSetup::set_left_margin,
                gtk::PageSetup::set_right_margin,
            ] {
                set(&setup, 0.0, gtk::Unit::Points);
            }
            settings.set_paper_size(&size);
            settings.set_orientation(orientation);
            operation.set_page_setup(&setup);
        }
        if let Some(path) = &to_file {
            settings.set_printer(FILE_PRINTER);
            settings.set("output-file-format", Some("pdf"));
            settings.set("output-uri", gtk::glib::filename_to_uri(path, None).ok().as_deref());
        }
        operation.set_print_settings(&settings);

        let failure: Rc<RefCell<Option<String>>> = Rc::default();
        {
            let failure = failure.clone();
            operation.connect_failed(move |_, error| {
                tracing::warn!(%error, "printing failed");
                *failure.borrow_mut() = Some(error.to_string());
            });
        }
        {
            let tx = tx.clone();
            operation.connect_finished(move |_| {
                let _ = tx.send(failure.borrow_mut().take().map_or(Ok(()), Err));
                // Let go of it once this signal is over, not from within it.
                gtk::glib::idle_add_local_once(|| {
                    PRINTING.with(|p| p.borrow_mut().take());
                });
            });
        }
        PRINTING.with(|p| *p.borrow_mut() = Some(operation.clone()));

        if to_file.is_some() {
            operation.print();
            return;
        }
        let parent = webview.toplevel().and_then(|w| w.downcast::<gtk::Window>().ok());
        if let PrintOperationResponse::Cancel = operation.run_dialog(parent.as_ref()) {
            // Nothing is printed, and no signal comes.
            PRINTING.with(|p| p.borrow_mut().take());
            let _ = tx.send(Ok(()));
        }
    }

    /// GTK's paper of the locale, asked on the main thread, where GTK is.
    pub fn default_paper(app: &tauri::AppHandle) -> Option<Paper> {
        let (tx, rx) = mpsc::channel();
        app.run_on_main_thread(move || {
            let size = gtk::PaperSize::new(None);
            let _ = tx.send(Paper { width: size.width(gtk::Unit::Points), height: size.height(gtk::Unit::Points) });
        })
        .ok()?;
        rx.recv_timeout(std::time::Duration::from_secs(5)).ok()
    }

    /// The paper of the job: GTK's own where the page is of a size it knows,
    /// in either orientation; else a paper of the page's size.
    fn paper_of(paper: Paper) -> (gtk::PaperSize, gtk::PageOrientation) {
        let near = |a: f64, b: f64| (a - b).abs() <= NEAR;
        for size in gtk::PaperSize::paper_sizes(false) {
            let (w, h) = (size.width(gtk::Unit::Points), size.height(gtk::Unit::Points));
            if near(w, paper.width) && near(h, paper.height) {
                return (size, gtk::PageOrientation::Portrait);
            }
            if near(w, paper.height) && near(h, paper.width) {
                return (size, gtk::PageOrientation::Landscape);
            }
        }
        let size = gtk::PaperSize::new_custom("glaukopis-page", "Page", paper.width, paper.height, gtk::Unit::Points);
        (size, gtk::PageOrientation::Portrait)
    }
}
