//! What another app handed to Glaukopis on a phone (Share, and the menu
//! over selected words), written into the notebook's inbox as one thing of
//! the kind `shared` (stage 3 of `docs/plans/an-app-for-android.md`). The
//! part of the app in Kotlin reads what was handed over, copies each file
//! into a folder of its own, and calls the door of the shell, which calls
//! `put`. Nothing here knows of Android.
//!
//! The meeting points of stage 3: the shapes are as the plan says, and `put`
//! refuses everything until part A fills it in.

use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};

use super::inbox::Inbox;

/// What another app handed over, as the part in Kotlin says it.
#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize)]
#[serde(default)]
pub struct Shared {
    /// The words, as they were handed over.
    pub text: String,
    /// The subject the other app gave, whatever it says.
    pub subject: String,
    /// The files, in their order, each copied into the folder `put` is given.
    pub files: Vec<SharedFile>,
}

/// A file handed over: where it lies in the folder `put` is given, and its name.
#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize)]
#[serde(default)]
pub struct SharedFile {
    /// Its plain name in that folder.
    pub at: String,
    /// What the other app calls it.
    pub name: String,
}

/// What came of putting a thing shared into the inbox.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
pub struct Put {
    /// The name of the thing in the inbox.
    pub id: String,
    /// What could not be taken, in words, each a line.
    pub problems: Vec<String>,
}

/// Puts what another app handed over into the inbox as one thing, with the
/// files that lie in `from` moved into it.
pub fn put(_inbox: &Inbox, _shared: Shared, _from: &Path) -> Result<Put> {
    // Part A of stage 3 fills this in; until then nothing is put.
    Err(Error::invalid("a thing shared is not yet taken"))
}
