//! One error type for the core.

use std::fmt;
use std::path::PathBuf;

use crate::tr;

pub type Result<T> = std::result::Result<T, Error>;

/// What went wrong. What it says is said in the language of the interface
/// (see `i18n`).
#[derive(Debug)]
pub enum Error {
    Io {
        context: String,
        source: std::io::Error,
    },

    Parse {
        path: PathBuf,
        message: String,
    },

    Invalid(String),

    NotFound(String),

    MissingProgram {
        program: String,
    },

    Program {
        program: String,
        message: String,
    },

    Network(String),

    /// A server of ours has said no. The kind is the one the server names.
    Refused {
        kind: &'static str,
        message: String,
    },

    Json(serde_json::Error),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::Io { context, source } => write!(f, "{context}: {source}"),
            Error::Parse { path, message } => f.write_str(&tr!("error-parse", path = path, message = message)),
            Error::Invalid(message) | Error::Refused { message, .. } => f.write_str(message),
            Error::NotFound(what) => f.write_str(&tr!("error-not-found", what = what)),
            Error::MissingProgram { program } => f.write_str(&tr!("program-missing", program = program)),
            Error::Program { program, message } => {
                f.write_str(&tr!("program-failed", program = program, message = message))
            }
            Error::Network(message) => f.write_str(&tr!("error-network", message = message)),
            Error::Json(error) => write!(f, "{error}"),
        }
    }
}

impl std::error::Error for Error {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Error::Io { source, .. } => Some(source),
            Error::Json(error) => Some(error),
            _ => None,
        }
    }
}

impl From<serde_json::Error> for Error {
    fn from(error: serde_json::Error) -> Self {
        Error::Json(error)
    }
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
