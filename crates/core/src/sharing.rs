//! Talking to a collaboration server: what is asked of it over HTTP.
//!
//! The project itself travels over a WebSocket that the interface opens. What
//! is here is the rest: publishing, inviting, joining, and the tickets that
//! open the socket, and the pictures of the figures, which are files and are
//! sent and fetched one by one. The token of a project is used here and
//! nowhere else; the interface never holds it. See ADR 0006.

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use crate::error::{Error, Result};
use crate::net::{self, Client};
use crate::pictures::{self, Pictures};

/// The version of what is said between the application and the server that
/// this application speaks.
pub const PROTOCOL: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerInfo {
    /// The address as it is kept: with its scheme, without a slash at the end.
    #[serde(default)]
    pub server: String,
    pub version: String,
    pub protocol: u32,
    pub password_required: bool,
    /// Whether what is sent to the server is encrypted on its way.
    #[serde(default)]
    pub encrypted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Joined {
    pub room: String,
    pub name: String,
    pub member: String,
    /// Skipped on its way to the interface.
    #[serde(skip_serializing)]
    pub token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Member {
    pub id: String,
    pub name: String,
    pub joined: i64,
    pub last_seen: i64,
    pub present: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Invitation {
    pub code: String,
    #[serde(default)]
    pub label: String,
    pub created: i64,
    pub expires: Option<i64>,
    pub uses_left: Option<u32>,
    #[serde(default)]
    pub used: u32,
    pub open: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Room {
    pub room: String,
    pub name: String,
    pub created: i64,
    pub role: String,
    pub you: Option<String>,
    pub owner_present: bool,
    pub members: Vec<Member>,
    #[serde(default)]
    pub invitations: Vec<Invitation>,
}

/// An address of a server as it may have been typed, made whole: `example.org`
/// becomes `https://example.org`. Without a scheme, only this computer itself
/// is spoken to without encryption.
pub fn normalise_server(typed: &str) -> Result<String> {
    let typed = typed.trim();
    if typed.is_empty() {
        return Err(Error::invalid("Enter the address of the server."));
    }
    if typed.contains(char::is_whitespace) {
        return Err(Error::invalid("The address of a server has no spaces in it."));
    }
    let (scheme, rest) = match typed.split_once("://") {
        Some((scheme, rest)) => match scheme.to_lowercase().as_str() {
            "http" | "ws" => ("http", rest),
            "https" | "wss" => ("https", rest),
            other => {
                return Err(Error::invalid(format!("A server is reached by http or https, not by “{other}”.")));
            }
        },
        None => (if is_this_computer(typed) { "http" } else { "https" }, typed),
    };
    let rest = rest.trim_end_matches('/');
    let host = rest.split('/').next().unwrap_or("");
    if !is_host(host) || rest.contains(['?', '#']) {
        return Err(Error::invalid("That does not look like the address of a server."));
    }
    // The name of the host in small letters; the path as it was typed.
    let (host, path) = rest.split_at(host.len());
    Ok(format!("{scheme}://{}{path}", host.to_lowercase()))
}

/// A name or a number, with a port or without.
fn is_host(host: &str) -> bool {
    let (name, port) = match host.strip_prefix('[') {
        Some(inner) => match inner.split_once(']') {
            Some((name, after)) => (name, after.strip_prefix(':')),
            None => return false,
        },
        None => match host.split_once(':') {
            Some((name, port)) => (name, Some(port)),
            None => (host, None),
        },
    };
    let bracketed = host.starts_with('[');
    let named = !name.is_empty()
        && name.chars().all(|c| c.is_alphanumeric() || matches!(c, '-' | '.') || (bracketed && c == ':'))
        && !name.starts_with(['-', '.']);
    let numbered = port.is_none_or(|p| !p.is_empty() && p.len() <= 5 && p.chars().all(|c| c.is_ascii_digit()));
    named && numbered && (port.is_some() || !bracketed || host.ends_with(']'))
}

fn host_of(address: &str) -> &str {
    let rest = address.split_once("://").map(|(_, r)| r).unwrap_or(address);
    let host = rest.split(['/', '?', '#']).next().unwrap_or("");
    if let Some(inner) = host.strip_prefix('[') {
        return inner.split(']').next().unwrap_or(inner);
    }
    match host.rsplit_once(':') {
        Some((name, port)) if port.chars().all(|c| c.is_ascii_digit()) => name,
        _ => host,
    }
}

fn is_this_computer(address: &str) -> bool {
    let host = host_of(address).to_lowercase();
    host == "localhost" || host == "::1" || host.starts_with("127.") || host.ends_with(".localhost")
}

/// Whether what is sent to the server is encrypted on its way, or never leaves this computer.
pub fn is_encrypted(server: &str) -> bool {
    server.starts_with("https://") || is_this_computer(server)
}

/// The address the interface opens its socket at.
pub fn socket_url(server: &str, room: &str, ticket: &str) -> String {
    let base = match server.split_once("://") {
        Some(("https", rest)) => format!("wss://{rest}"),
        Some((_, rest)) => format!("ws://{rest}"),
        None => format!("wss://{server}"),
    };
    format!("{base}/ws/{}?ticket={}", net::encode(room), net::encode(ticket))
}

/// An invitation as it was pasted: the address and the code may come together,
/// as they were sent. Returns what was found of each.
pub fn read_invitation(pasted: &str) -> (Option<String>, Option<String>) {
    let words: Vec<&str> = pasted
        .split_whitespace()
        .map(|w| w.trim_matches(|c: char| !c.is_ascii_alphanumeric() && c != '/'))
        .filter(|w| !w.is_empty())
        .collect();
    let server = words
        .iter()
        .filter(|w| w.starts_with("http://") || w.starts_with("https://"))
        .find_map(|w| normalise_server(w).ok());
    let code = (0..words.len()).find_map(|i| code_at(&words[i..]));
    (server, code)
}

/// The code that begins at the first of the words, if one does: written in
/// one piece, with hyphens, or with spaces between its three parts.
fn code_at(words: &[&str]) -> Option<String> {
    let four = |w: &&str| w.len() == 4 && w.chars().all(|c| c.is_ascii_alphanumeric());
    let first = *words.first()?;
    let parts: Vec<&str> = first.split('-').collect();
    let letters = if parts.len() == 3 && parts.iter().all(four) {
        parts.concat()
    } else if words.len() >= 3 && words[..3].iter().all(four) && looks_like_a_code(&words[..3].concat()) {
        words[..3].concat()
    } else if first.len() == 12 && first.chars().all(|c| c.is_ascii_alphanumeric()) && looks_like_a_code(first) {
        first.to_owned()
    } else {
        return None;
    };
    let parts: Vec<String> =
        letters.to_uppercase().as_bytes().chunks(4).map(|c| String::from_utf8_lossy(c).into_owned()).collect();
    Some(parts.join("-"))
}

/// Twelve letters may be a word, or three words. A code has digits in it, or
/// is written in capitals.
fn looks_like_a_code(letters: &str) -> bool {
    letters.chars().any(|c| c.is_ascii_digit()) || letters.chars().all(|c| c.is_ascii_uppercase())
}

/// What the server names its refusals, as the interface is told them.
fn kind(named: &str, status: u16) -> &'static str {
    match named {
        "no-room" => "no-room",
        "not-admitted" => "not-admitted",
        "not-owner" => "not-owner",
        "bad-code" => "bad-code",
        "exists" => "exists",
        "full" => "full",
        "password" => "password",
        "too-many" => "too-many",
        "invalid" => "invalid",
        "no-file" => "no-file",
        "too-large" => "too-large",
        _ => match status {
            401 => "not-admitted",
            404 => "no-room",
            429 => "too-many",
            _ => "server",
        },
    }
}

/// What the user is told, in whole sentences.
fn explain(kind: &str, from_server: &str, host: &str) -> String {
    match kind {
        "no-room" => "The project is no longer on the server.".into(),
        "not-admitted" => "The server does not admit this copy of the project any more.".into(),
        "not-owner" => "Only the one who shares the project can do this.".into(),
        "bad-code" => {
            "The code is not valid. It may have been mistyped, used already, withdrawn, or it has expired.".into()
        }
        "exists" => "The project is on the server already.".into(),
        "full" => "The server holds as many projects as it is set to hold.".into(),
        "password" if from_server.contains("asks for a password") => {
            "This server asks for a password from those who share projects through it.".into()
        }
        "password" => "The password is not the one the server asks for.".into(),
        "too-many" => "Too many attempts have been made from here. Try again in ten minutes.".into(),
        "no-file" => "The server does not have the picture.".into(),
        _ if from_server.is_empty() => format!("{host} answered with an error."),
        _ => {
            let mut text = from_server.to_owned();
            if let Some(first) = text.get(..1) {
                text = first.to_uppercase() + &text[1..];
            }
            if !text.ends_with(['.', '!', '?']) {
                text.push('.');
            }
            text
        }
    }
}

/// A server, and the client by which it is reached.
pub struct Remote<'a> {
    client: &'a Client,
    server: String,
}

impl<'a> Remote<'a> {
    /// `server` as it is kept, or as it was typed.
    pub fn new(client: &'a Client, server: &str) -> Result<Self> {
        Ok(Remote { client, server: normalise_server(server)? })
    }

    pub fn server(&self) -> &str {
        &self.server
    }

    fn ask(&self, method: &str, path: &str, token: Option<&str>, body: Option<Value>) -> Result<Value> {
        let url = format!("{}{path}", self.server);
        let response = self.client.send(method, &url, token, body.as_ref())?;
        let host = net::host(&url);
        let value: Value = if response.body.trim().is_empty() {
            Value::Null
        } else {
            match serde_json::from_str(&response.body) {
                Ok(value) => value,
                // Something else than our server answered: a proxy, or another site altogether.
                Err(_) if (200..300).contains(&response.status) => return Err(not_a_server(&host)),
                Err(_) => Value::Null,
            }
        };
        if (200..300).contains(&response.status) {
            return Ok(value);
        }
        let named = value.get("error").and_then(Value::as_str);
        let message = value.get("message").and_then(Value::as_str).unwrap_or("");
        match named {
            Some(named) => {
                let kind = kind(named, response.status);
                Err(Error::Refused { kind, message: explain(kind, message, &host) })
            }
            None if response.status == 404 => Err(not_a_server(&host)),
            None if matches!(response.status, 502..=504) => {
                Err(Error::Network(format!("{host} is there, but the server behind it does not answer")))
            }
            None => Err(Error::Network(format!("{host} answered with an error ({})", response.status))),
        }
    }

    fn read<T: serde::de::DeserializeOwned>(&self, value: Value) -> Result<T> {
        serde_json::from_value(value).map_err(|_| not_a_server(&net::host(&self.server)))
    }

    /// Asks the server what it is. Fails if there is none of ours at the address.
    pub fn info(&self) -> Result<ServerInfo> {
        let value = self.ask("GET", "/api/info", None, None)?;
        if value.get("name").and_then(Value::as_str) != Some("glaukopis-server") {
            return Err(not_a_server(&net::host(&self.server)));
        }
        let mut info: ServerInfo = self.read(value)?;
        if info.protocol > PROTOCOL {
            return Err(Error::invalid(
                "The server is newer than this version of Glaukopis, which must be brought up to date to use it.",
            ));
        }
        info.server = self.server.clone();
        info.encrypted = is_encrypted(&self.server);
        Ok(info)
    }

    /// Puts a project on the server. Returns the owner's token.
    pub fn publish(&self, room: &str, name: &str, password: Option<&str>) -> Result<String> {
        let mut body = json!({ "room": room, "name": name });
        if let Some(p) = password.filter(|p| !p.is_empty()) {
            body["password"] = json!(p);
        }
        let value = self.ask("POST", "/api/rooms", None, Some(body))?;
        value
            .get("token")
            .and_then(Value::as_str)
            .map(str::to_owned)
            .ok_or_else(|| not_a_server(&net::host(&self.server)))
    }

    pub fn join(&self, code: &str, name: &str) -> Result<Joined> {
        let value = self.ask("POST", "/api/join", None, Some(json!({ "code": code, "name": name })))?;
        self.read(value)
    }

    fn room_path(room: &str) -> String {
        format!("/api/rooms/{}", net::encode(room))
    }

    pub fn room(&self, room: &str, token: &str) -> Result<Room> {
        let value = self.ask("GET", &Self::room_path(room), Some(token), None)?;
        self.read(value)
    }

    pub fn rename(&self, room: &str, token: &str, name: &str) -> Result<Room> {
        let value = self.ask("PATCH", &Self::room_path(room), Some(token), Some(json!({ "name": name })))?;
        self.read(value)
    }

    /// Takes the project off the server.
    pub fn remove(&self, room: &str, token: &str) -> Result<()> {
        self.ask("DELETE", &Self::room_path(room), Some(token), None).map(|_| ())
    }

    pub fn ticket(&self, room: &str, token: &str) -> Result<String> {
        let value = self.ask("POST", &format!("{}/tickets", Self::room_path(room)), Some(token), None)?;
        value
            .get("ticket")
            .and_then(Value::as_str)
            .map(str::to_owned)
            .ok_or_else(|| not_a_server(&net::host(&self.server)))
    }

    /// Makes a code. `uses` is how many may come by it, `hours` for how long it is good.
    pub fn invite(
        &self,
        room: &str,
        token: &str,
        label: &str,
        uses: Option<u32>,
        hours: Option<u32>,
    ) -> Result<Invitation> {
        let body = json!({ "label": label, "uses": uses, "hours": hours });
        let value = self.ask("POST", &format!("{}/invitations", Self::room_path(room)), Some(token), Some(body))?;
        self.read(value)
    }

    pub fn withdraw(&self, room: &str, token: &str, code: &str) -> Result<()> {
        let path = format!("{}/invitations/{}", Self::room_path(room), net::encode(code));
        self.ask("DELETE", &path, Some(token), None).map(|_| ())
    }

    /// Removes a collaborator; or, asked by the collaborator, leaves.
    pub fn remove_member(&self, room: &str, token: &str, member: &str) -> Result<()> {
        let path = format!("{}/members/{}", Self::room_path(room), net::encode(member));
        self.ask("DELETE", &path, Some(token), None).map(|_| ())
    }
}

/// A picture as the server has it.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct RemoteFile {
    pub hash: String,
    pub size: u64,
}

/// What came of bringing the pictures of a project and those the server has
/// of it to be the same.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Synced {
    pub sent: usize,
    pub fetched: usize,
    /// What could not be done, in words for the user. Each is said once.
    pub problems: Vec<String>,
}

impl Remote<'_> {
    fn refusal(&self, status: u16, body: &[u8]) -> Error {
        let host = net::host(&self.server);
        let value: Value = serde_json::from_slice(body).unwrap_or(Value::Null);
        let message = value.get("message").and_then(Value::as_str).unwrap_or("");
        match value.get("error").and_then(Value::as_str) {
            Some(named) => {
                let kind = kind(named, status);
                Error::Refused { kind, message: explain(kind, message, &host) }
            }
            // A proxy that takes less than the server does says so by itself.
            None if status == 413 => Error::Refused {
                kind: "too-large",
                message: format!("{host} does not take a picture as large as this."),
            },
            None if status == 404 => not_a_server(&host),
            None => Error::Network(format!("{host} answered with an error ({status})")),
        }
    }

    /// The pictures the server has of a project, and the most it lets one hold.
    pub fn files(&self, room: &str, token: &str) -> Result<(Vec<RemoteFile>, u64)> {
        let value = self.ask("GET", &format!("{}/files", Self::room_path(room)), Some(token), None)?;
        let most = value.get("maxFileBytes").and_then(Value::as_u64).unwrap_or(pictures::MAX_BYTES);
        Ok((self.read(value.get("files").cloned().unwrap_or(Value::Null))?, most))
    }

    fn file_url(&self, room: &str, hash: &str) -> String {
        format!("{}{}/files/{}", self.server, Self::room_path(room), net::encode(hash))
    }

    pub fn fetch_file(&self, room: &str, token: &str, hash: &str) -> Result<Vec<u8>> {
        let answer = self.client.fetch(&self.file_url(room, hash), token, pictures::MAX_BYTES)?;
        if (200..300).contains(&answer.status) {
            Ok(answer.body)
        } else {
            Err(self.refusal(answer.status, &answer.body))
        }
    }

    pub fn send_file(&self, room: &str, token: &str, hash: &str, content: &[u8]) -> Result<()> {
        let answer = self.client.put(&self.file_url(room, hash), token, content)?;
        if (200..300).contains(&answer.status) { Ok(()) } else { Err(self.refusal(answer.status, &answer.body)) }
    }

    /// Sends the pictures the server lacks, and fetches those that are
    /// lacking here. What cannot be done with one picture does not keep the
    /// others from being seen to.
    pub fn sync_pictures(&self, room: &str, token: &str, pictures: &Pictures) -> Result<Synced> {
        let (there, most) = self.files(room, token)?;
        let here = pictures.list();
        let mut done = Synced::default();
        let mut problems: Vec<String> = Vec::new();
        let mut say = |problem: String| {
            if !problems.contains(&problem) {
                problems.push(problem);
            }
        };
        for (hash, extension, size) in &here {
            if there.iter().any(|f| &f.hash == hash) {
                continue;
            }
            if *size > most {
                // Said before it is sent: a server that refuses what is on
                // its way may not be heard.
                say(format!(
                    "A picture is larger than {} takes ({} MB at the most), and does not reach the others.",
                    net::host(&self.server),
                    most >> 20
                ));
                continue;
            }
            let sending =
                pictures.read(hash, extension).and_then(|content| self.send_file(room, token, hash, &content));
            match sending {
                Ok(()) => done.sent += 1,
                Err(Error::Refused { message, .. }) => say(message),
                Err(e) => say(format!("A picture could not be sent: {e}.")),
            }
        }
        for file in &there {
            if !pictures::is_hash(&file.hash) || here.iter().any(|(hash, _, _)| hash == &file.hash) {
                continue;
            }
            if file.size > pictures::MAX_BYTES {
                continue;
            }
            match self.fetch_file(room, token, &file.hash).and_then(|content| pictures.keep(&file.hash, &content)) {
                Ok(_) => done.fetched += 1,
                // What is on the server and is no picture is nothing to the project.
                Err(Error::Invalid(_)) => {}
                Err(Error::Refused { message, .. }) => say(message),
                Err(e) => say(format!("A picture could not be fetched: {e}.")),
            }
        }
        done.problems = problems;
        Ok(done)
    }
}

fn not_a_server(host: &str) -> Error {
    Error::Refused {
        kind: "no-server",
        message: format!("There is no Glaukopis server at {host}. Check the address with the one who gave it to you."),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn addresses_as_they_are_typed() {
        assert_eq!(normalise_server(" example.org/ ").unwrap(), "https://example.org");
        assert_eq!(normalise_server("HTTPS://Example.org/Glaukopis/").unwrap(), "https://example.org/Glaukopis");
        assert_eq!(normalise_server("wss://example.org").unwrap(), "https://example.org");
        assert_eq!(normalise_server("localhost:8375").unwrap(), "http://localhost:8375");
        assert_eq!(normalise_server("127.0.0.1:8375").unwrap(), "http://127.0.0.1:8375");
        assert_eq!(normalise_server("192.168.1.20:8375").unwrap(), "https://192.168.1.20:8375");
        assert_eq!(normalise_server("http://192.168.1.20:8375").unwrap(), "http://192.168.1.20:8375");
        for bad in ["", "  ", "ftp://example.org", "example.org/?x=1", "two words", "user@example.org", "https://"] {
            assert!(normalise_server(bad).is_err(), "{bad:?}");
        }

        assert!(is_encrypted("https://example.org"));
        assert!(is_encrypted("http://localhost:8375"));
        assert!(is_encrypted("http://[::1]:8375"));
        assert!(!is_encrypted("http://192.168.1.20:8375"));
        assert!(!is_encrypted("http://localhost.example.org"));

        assert_eq!(socket_url("https://example.org/g", "0a1b-2c", "abc"), "wss://example.org/g/ws/0a1b-2c?ticket=abc");
        assert_eq!(socket_url("http://localhost:8375", "r", "t"), "ws://localhost:8375/ws/r?ticket=t");
    }

    #[test]
    fn invitations_as_they_are_pasted() {
        let both = "Join me at https://example.org/glaukopis with the code K7QM-2FXA-9RTD.";
        assert_eq!(
            read_invitation(both),
            (Some("https://example.org/glaukopis".into()), Some("K7QM-2FXA-9RTD".into()))
        );
        assert_eq!(read_invitation("k7qm-2fxa-9rtd"), (None, Some("K7QM-2FXA-9RTD".into())));
        assert_eq!(read_invitation("K7QM 2FXA 9RTD"), (None, Some("K7QM-2FXA-9RTD".into())));
        assert_eq!(read_invitation("K7QM2FXA9RTD"), (None, Some("K7QM-2FXA-9RTD".into())));
        assert_eq!(read_invitation("https://example.org"), (Some("https://example.org".into()), None));
        assert_eq!(read_invitation("collaborator"), (None, None));
        assert_eq!(read_invitation("see you on thursday"), (None, None));
        assert_eq!(read_invitation("what time does that suit"), (None, None), "three words of four letters");
        assert_eq!(read_invitation("abcd-efgh-jkmn"), (None, Some("ABCD-EFGH-JKMN".into())));
        assert_eq!(read_invitation(""), (None, None));
    }

    #[test]
    fn refusals_in_whole_sentences() {
        assert!(explain("bad-code", "the code is not valid", "h").starts_with("The code is not valid."));
        assert_eq!(explain("invalid", "the project has no name", "h"), "The project has no name.");
        assert_eq!(explain("server", "", "example.org"), "example.org answered with an error.");
        assert_eq!(kind("something new", 401), "not-admitted");
        assert_eq!(kind("something new", 500), "server");
    }
}
