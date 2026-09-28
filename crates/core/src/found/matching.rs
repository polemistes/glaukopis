//! The references of the library for a work that is cited.

use serde_json::Value;

use super::{FoundItem, Suggestion};
use crate::library::Library;
use crate::library::entry::Draft;

pub(super) fn suggest(_library: &Library, _item: &FoundItem) -> Vec<Suggestion> {
    // Not built yet.
    Vec::new()
}

pub(super) fn draft(_data: &Value) -> Option<Draft> {
    // Not built yet.
    None
}
