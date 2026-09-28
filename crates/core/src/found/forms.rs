//! What looks like a citation, in text that has none that are known.

use super::{Options, Passage, Proposal};
use crate::library::Library;

pub(super) fn propose(_library: &Library, _passages: &[Passage], _options: &Options) -> Vec<Proposal> {
    // Not built yet.
    Vec::new()
}
