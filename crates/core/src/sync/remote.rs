//! The calls to the server that keeps a home (record 0120; the table of
//! calls is in the plan, and the server's side is `crates/server`).
//!
//! The token of this computer is used here and nowhere else. Refusals come
//! as those of sharing do, and are said in the same words (`sharing`).

use std::io::Write;
use std::path::Path;

use serde::Deserialize;
use serde_json::{Value, json};

use crate::error::{Error, Result};
use crate::net::{self, Client};
use crate::sharing::{Remote, RemoteFile};
use crate::tr;

use super::{hex, unhex};

/// The most that is taken of an answer to an exchange: more than a server
/// keeps of one document unless it was set to keep very much.
const MOST_NEWS: u64 = 512 << 20;

/// A computer that was let into a home, with the token that admits it. The
/// token is told this once.
#[derive(Debug, Clone, Deserialize)]
pub struct Entered {
    pub home: String,
    pub device: String,
    pub token: String,
}

/// A computer of a home, as the server tells of it. Times are seconds since 1970.
#[derive(Debug, Clone, PartialEq, Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Device {
    pub id: String,
    pub name: String,
    pub joined: i64,
    pub last_seen: i64,
    /// Whether it is the one that asks.
    pub you: bool,
}

/// A code that is open: one more computer may come by it.
#[derive(Debug, Clone, PartialEq, Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenCode {
    pub id: String,
    pub created: i64,
    pub expires: i64,
}

/// A home as the server tells of it.
#[derive(Debug, Clone, PartialEq, Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Told {
    pub devices: Vec<Device>,
    #[serde(default)]
    pub codes: Vec<OpenCode>,
    /// How much its files hold together.
    #[serde(default)]
    pub used_bytes: u64,
}

/// A code just made. It is told this once: the server keeps its hash alone.
#[derive(Debug, Clone, PartialEq, Deserialize, serde::Serialize)]
pub struct NewCode {
    pub code: String,
    pub expires: i64,
}

/// A document the home keeps.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Listed {
    pub kind: String,
    pub id: String,
    pub digest: String,
    #[serde(default)]
    pub bytes: u64,
}

/// What the home keeps, or that it is what it was when it was last asked.
#[derive(Debug, Clone, PartialEq)]
pub enum Listing {
    Same,
    Docs { stamp: String, docs: Vec<Listed> },
}

/// What the server answers to an exchange.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct Answer {
    /// The digest of the server's document as it stands now.
    pub digest: String,
    /// Its state vector.
    pub now: Vec<u8>,
    /// What it had beyond what was said to be had here; empty where nothing.
    pub news: Vec<u8>,
    /// Whether both had something the other lacked, and what the server had
    /// came from another computer.
    pub apart: bool,
}

/// The server at `server`, which must be one that keeps homes.
fn server<'a>(client: &'a Client, server: &str) -> Result<Remote<'a>> {
    let remote = Remote::new(client, server)?;
    // Asked as sharing asks it, so that an address with nothing of ours at it is told the same way.
    remote.info()?;
    let info = remote.ask("GET", "/api/info", None, None)?;
    if info.get("homes").and_then(Value::as_bool) != Some(true) {
        return Err(Error::invalid(tr!("core-sync-old-server", host = net::host(remote.server()))));
    }
    Ok(remote)
}

/// Makes a home on a server, with this computer as its first. The password
/// is the one the server asks of those who publish projects, where it asks one.
/// Returns the address of the server as it is kept, and what was entered.
pub fn start(client: &Client, address: &str, name: &str, password: Option<&str>) -> Result<(String, Entered)> {
    let remote = server(client, address)?;
    let mut body = json!({ "name": name });
    if let Some(password) = password.filter(|p| !p.is_empty()) {
        body["password"] = json!(password);
    }
    let entered = remote.read(remote.ask("POST", "/api/homes", None, Some(body))?)?;
    Ok((remote.server().to_owned(), entered))
}

/// Enters a home by a code made on a computer that is in it.
pub fn join(client: &Client, address: &str, code: &str, name: &str) -> Result<(String, Entered)> {
    let remote = server(client, address)?;
    let body = json!({ "code": code, "name": name });
    let entered = remote.read(remote.ask("POST", "/api/homes/join", None, Some(body))?)?;
    Ok((remote.server().to_owned(), entered))
}

/// A home, as this computer reaches it.
pub struct Home<'a> {
    remote: Remote<'a>,
    client: &'a Client,
    home: String,
    token: String,
}

/// The parts of an exchange, each with its length before it.
fn framed(head: &Value, changes: &[&[u8]]) -> Vec<u8> {
    let head = head.to_string().into_bytes();
    let mut out = Vec::with_capacity(8 + head.len() + changes.iter().map(|c| c.len() + 4).sum::<usize>());
    out.extend_from_slice(&(head.len() as u32).to_le_bytes());
    out.extend_from_slice(&head);
    out.extend_from_slice(&(changes.len() as u32).to_le_bytes());
    for change in changes {
        out.extend_from_slice(&(change.len() as u32).to_le_bytes());
        out.extend_from_slice(change);
    }
    out
}

/// The head of an answer and what follows it.
fn unframed(body: &[u8]) -> Option<(Value, &[u8])> {
    let length = u32::from_le_bytes(body.get(..4)?.try_into().ok()?) as usize;
    let head = body.get(4..4 + length)?;
    Some((serde_json::from_slice(head).ok()?, &body[4 + length..]))
}

impl<'a> Home<'a> {
    pub fn new(client: &'a Client, server: &str, home: &str, token: &str) -> Result<Self> {
        Ok(Home { remote: Remote::new(client, server)?, client, home: home.to_owned(), token: token.to_owned() })
    }

    fn path(&self, rest: &str) -> String {
        format!("/api/homes/{}{rest}", net::encode(&self.home))
    }

    fn ask(&self, method: &str, rest: &str, body: Option<Value>) -> Result<Value> {
        self.remote.ask(method, &self.path(rest), Some(&self.token), body)
    }

    /// The computers of the home and the codes that are open.
    pub fn told(&self) -> Result<Told> {
        self.remote.read(self.ask("GET", "", None)?)
    }

    /// Makes a code by which one more computer may enter.
    pub fn code(&self) -> Result<NewCode> {
        self.remote.read(self.ask("POST", "/codes", None)?)
    }

    pub fn withdraw(&self, code: &str) -> Result<()> {
        self.ask("DELETE", &format!("/codes/{}", net::encode(code)), None).map(|_| ())
    }

    pub fn rename(&self, device: &str, name: &str) -> Result<Told> {
        let path = format!("/devices/{}", net::encode(device));
        self.remote.read(self.ask("PATCH", &path, Some(json!({ "name": name })))?)
    }

    /// Removes a computer from the home: any of them, this one too. With
    /// the last, the home goes, and all it kept.
    pub fn remove(&self, device: &str) -> Result<()> {
        self.ask("DELETE", &format!("/devices/{}", net::encode(device)), None).map(|_| ())
    }

    /// The documents the home keeps; or, where `seen` is the stamp of what
    /// it kept when it was last asked and nothing changed since, that.
    pub fn list(&self, seen: Option<&str>) -> Result<Listing> {
        let query = seen.map(|stamp| format!("?seen={}", net::encode(stamp))).unwrap_or_default();
        let value = self.ask("GET", &format!("/docs{query}"), None)?;
        if value.get("same").and_then(Value::as_bool) == Some(true) {
            return Ok(Listing::Same);
        }
        #[derive(Deserialize)]
        struct Docs {
            stamp: String,
            docs: Vec<Listed>,
        }
        let Docs { stamp, docs } = self.remote.read(value)?;
        Ok(Listing::Docs { stamp, docs })
    }

    /// Brings one document to be the same: says what was last seen of the
    /// server's (`seen`, its digest then; `since`, its state vector then),
    /// sends the changes made here since, and is answered with what the
    /// server had beyond `since`. `form` is the form of the texts this
    /// version knows: the server sends nothing of a document in a later one.
    /// `quiet` says that the writer wrote nothing of what is sent (`wrote`):
    /// the server tells of writing apart only where the writer wrote on both.
    #[allow(clippy::too_many_arguments, reason = "what an exchange says, each a thing of its own")]
    pub fn exchange(
        &self,
        kind: &str,
        id: &str,
        seen: Option<&str>,
        since: Option<&[u8]>,
        changes: &[&[u8]],
        form: u32,
        quiet: bool,
    ) -> Result<Answer> {
        let url = format!(
            "{}{}?form={form}",
            self.remote.server(),
            self.path(&format!("/docs/{}/{}", net::encode(kind), net::encode(id)))
        );
        let head = json!({ "seen": seen, "since": since.map(hex), "quiet": quiet });
        let answer = self.client.post(&url, &self.token, &framed(&head, changes), MOST_NEWS)?;
        if !(200..300).contains(&answer.status) {
            let value = serde_json::from_slice(&answer.body).unwrap_or(Value::Null);
            return Err(self.remote.refused(answer.status, &value));
        }
        let not_understood = || Error::Network(tr!("network-not-understood", host = net::host(&url)));
        let (head, news) = unframed(&answer.body).ok_or_else(not_understood)?;
        let text = |name: &str| head.get(name).and_then(Value::as_str);
        Ok(Answer {
            digest: text("digest").ok_or_else(not_understood)?.to_owned(),
            now: text("now").and_then(unhex).ok_or_else(not_understood)?,
            news: if head.get("news").and_then(Value::as_bool) == Some(true) { news.to_vec() } else { Vec::new() },
            apart: head.get("apart").and_then(Value::as_bool) == Some(true),
        })
    }

    /// Takes a document off the server.
    pub fn delete(&self, kind: &str, id: &str) -> Result<()> {
        self.ask("DELETE", &format!("/docs/{}/{}", net::encode(kind), net::encode(id)), None).map(|_| ())
    }

    /// The files the home holds, and the most one of them may hold.
    pub fn files(&self) -> Result<(Vec<RemoteFile>, u64)> {
        self.remote.files_in(&self.path(""), &self.token)
    }

    /// Sends a file of the store under its hash, from the disk as it is read.
    pub fn send_file(&self, hash: &str, path: &Path) -> Result<()> {
        let answer = self.client.send_file(&self.remote.file_url(&self.path(""), hash), &self.token, path)?;
        if (200..300).contains(&answer.status) { Ok(()) } else { Err(self.remote.refusal(answer.status, &answer.body)) }
    }

    /// Fetches a file the home holds into `into`, which writes to the file
    /// at `path`, as it comes; no more than `limit`.
    pub fn fetch_file(&self, hash: &str, into: &mut dyn Write, path: &Path, limit: u64) -> Result<()> {
        let url = self.remote.file_url(&self.path(""), hash);
        let answer = self.client.fetch_into(&url, &self.token, into, path, limit)?;
        if (200..300).contains(&answer.status) { Ok(()) } else { Err(self.remote.refusal(answer.status, &answer.body)) }
    }

    /// Takes a file off the server. One that is not there is gone already.
    pub fn delete_file(&self, hash: &str) -> Result<()> {
        match self.ask("DELETE", &format!("/files/{}", net::encode(hash)), None) {
            Ok(_) | Err(Error::Refused { kind: "no-file", .. }) => Ok(()),
            Err(error) => Err(error),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_exchange_is_framed_with_the_length_of_each_part() {
        let head = json!({ "seen": null, "since": "00" });
        let sent = framed(&head, &[b"ab", b"", b"cde"]);
        let (read, rest) = unframed(&sent).unwrap();
        assert_eq!(read, head);
        // The changes follow: how many, then each with its length.
        assert_eq!(
            rest,
            [&3u32.to_le_bytes()[..], &2u32.to_le_bytes(), b"ab", &0u32.to_le_bytes(), &3u32.to_le_bytes(), b"cde"]
                .concat()
        );
        assert_eq!(unframed(&[9, 0, 0, 0, b'{']), None, "cut short");
        assert_eq!(unframed(&[2, 0, 0, 0, b'n', b'o']), None, "no head");
    }
}
