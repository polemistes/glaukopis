//! One error type for the core.

use std::path::PathBuf;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("{context}: {source}")]
    Io {
        context: String,
        #[source]
        source: std::io::Error,
    },

    #[error("could not read {path}: {message}")]
    Parse { path: PathBuf, message: String },

    #[error("{0}")]
    Invalid(String),

    #[error("not found: {0}")]
    NotFound(String),

    #[error("{program} is not installed or could not be found")]
    MissingProgram { program: String },

    #[error("{program} failed: {message}")]
    Program { program: String, message: String },

    #[error("network: {0}")]
    Network(String),

    /// A server of ours has said no. The kind is the one the server names.
    #[error("{message}")]
    Refused { kind: &'static str, message: String },

    #[error("{0}")]
    Json(#[from] serde_json::Error),
}

impl Error {
    pub fn io(context: impl Into<String>, source: std::io::Error) -> Self {
        Error::Io { context: context.into(), source }
    }

    pub fn invalid(message: impl Into<String>) -> Self {
        Error::Invalid(message.into())
    }

    pub fn not_found(what: impl Into<String>) -> Self {
        Error::NotFound(what.into())
    }

    /// A short machine-readable name, sent to the interface with the message.
    pub fn kind(&self) -> &'static str {
        match self {
            Error::Io { .. } => "io",
            Error::Parse { .. } => "parse",
            Error::Invalid(_) => "invalid",
            Error::NotFound(_) => "not-found",
            Error::MissingProgram { .. } => "missing-program",
            Error::Program { .. } => "program",
            Error::Network(_) => "network",
            Error::Refused { kind, .. } => kind,
            Error::Json(_) => "json",
        }
    }
}

/// Adds a description of what was being done to an I/O error.
pub trait IoContext<T> {
    fn context(self, what: impl FnOnce() -> String) -> Result<T>;
}

impl<T> IoContext<T> for std::io::Result<T> {
    fn context(self, what: impl FnOnce() -> String) -> Result<T> {
        self.map_err(|source| Error::Io { context: what(), source })
    }
}
