//! Errors as the interface receives them.

use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct CommandError {
    pub kind: &'static str,
    pub message: String,
}

impl From<glaukopis_core::Error> for CommandError {
    fn from(error: glaukopis_core::Error) -> Self {
        // What was stopped, or is to be sent again, has not failed: it is what was asked for.
        if matches!(error.kind(), "stopped" | "lacking") {
            tracing::debug!(%error, "a command was ended");
        } else {
            tracing::warn!(%error, "command failed");
        }
        CommandError { kind: error.kind(), message: error.to_string() }
    }
}

pub type CommandResult<T> = Result<T, CommandError>;
