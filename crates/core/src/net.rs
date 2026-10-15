//! Fetching from the network. One client, which says who is asking.

use std::sync::Mutex;
use std::time::{Duration, Instant};

use crate::error::{Error, Result};
use crate::tr;

/// What Glaukopis calls itself to the services it asks: the program and
/// where it is made, never anything of the person using it. Glaukopis sends
/// no personal detail or address anywhere by itself.
pub fn user_agent() -> String {
    format!("Glaukopis/{} (research tool; +https://github.com/polemistes/glaukopis)", env!("CARGO_PKG_VERSION"))
}

/// The hosts that answer a program that does not say who uses it one
/// request at a time: Crossref, and doi.org, which hands Crossref's DOIs on
/// to it. Their requests wait for each other, from whichever thread.
const ONE_AT_A_TIME: &[&str] = &["api.crossref.org", "data.crossref.org", "doi.org", "dx.doi.org"];

/// Held while a request to one of `ONE_AT_A_TIME` is under way, with when the last ended.
static ONE_AT_A_TIME_GATE: Mutex<Option<Instant>> = Mutex::new(None);

/// The least time between two requests to those hosts: Crossref takes five a second.
const ONE_AT_A_TIME_GAP: Duration = Duration::from_millis(220);

/// How often a request is tried again when the service says it is asked too
/// often (429) or is too busy (503), and the longest it is waited for.
const RETRIES: u32 = 3;
const LONGEST_WAIT: Duration = Duration::from_secs(10);

/// How long to wait before asking again: what the service says in
/// `Retry-After`, in seconds, else one, two and four seconds.
fn wait_before(attempt: u32, retry_after: Option<&str>) -> Duration {
    retry_after
        .and_then(|v| v.trim().parse::<u64>().ok())
        .map(Duration::from_secs)
        .unwrap_or(Duration::from_secs(1 << attempt))
        .min(LONGEST_WAIT)
}

#[derive(Clone)]
pub struct Client {
    agent: ureq::Agent,
    /// For files, which take the time they take.
    patient: ureq::Agent,
    user_agent: String,
}

/// What came of asking for a file, or of sending one.
pub struct Bytes {
    pub status: u16,
    pub body: Vec<u8>,
}

pub struct Response {
    pub status: u16,
    pub body: String,
    pub content_type: String,
}

impl Default for Client {
    fn default() -> Self {
        Self::new()
    }
}

impl Client {
    pub fn new() -> Self {
        let tls = ureq::tls::TlsConfig::builder().provider(ureq::tls::TlsProvider::NativeTls).build();
        let agent = ureq::Agent::config_builder()
            .tls_config(tls)
            .timeout_global(Some(Duration::from_secs(25)))
            .timeout_connect(Some(Duration::from_secs(10)))
            .http_status_as_error(false)
            .max_redirects(8)
            .build()
            .new_agent();
        let tls = ureq::tls::TlsConfig::builder().provider(ureq::tls::TlsProvider::NativeTls).build();
        let patient = ureq::Agent::config_builder()
            .tls_config(tls)
            .timeout_global(Some(Duration::from_secs(20 * 60)))
            .timeout_connect(Some(Duration::from_secs(10)))
            .http_status_as_error(false)
            .max_redirects(0)
            .build()
            .new_agent();
        Client { agent, patient, user_agent: user_agent() }
    }

    /// Fetches a file from a server of our own. No more than `limit` is taken.
    pub fn fetch(&self, url: &str, bearer: &str, limit: u64) -> Result<Bytes> {
        let mut response = self
            .patient
            .get(url)
            .header("User-Agent", &self.user_agent)
            .header("Authorization", &format!("Bearer {bearer}"))
            .call()
            .map_err(|e| Error::Network(describe(url, &e)))?;
        let status = response.status().as_u16();
        let body = response
            .body_mut()
            .with_config()
            .limit(limit)
            .read_to_vec()
            .map_err(|e| Error::Network(describe(url, &e)))?;
        Ok(Bytes { status, body })
    }

    /// Sends a file to a server of our own.
    pub fn put(&self, url: &str, bearer: &str, content: &[u8]) -> Result<Bytes> {
        let mut response = self
            .patient
            .put(url)
            .header("User-Agent", &self.user_agent)
            .header("Authorization", &format!("Bearer {bearer}"))
            .header("Content-Type", "application/octet-stream")
            .send(content)
            .map_err(|e| Error::Network(describe(url, &e)))?;
        let status = response.status().as_u16();
        let body = response
            .body_mut()
            .with_config()
            .limit(1024 * 1024)
            .read_to_vec()
            .map_err(|e| Error::Network(describe(url, &e)))?;
        Ok(Bytes { status, body })
    }

    /// Gets a page. `accept` says which form is wanted, where the service
    /// offers several. A host that takes one request at a time is asked one
    /// at a time; a service that says it is asked too often or is too busy
    /// is asked again after the wait it asks for, a few times.
    pub fn get(&self, url: &str, accept: Option<&str>) -> Result<Response> {
        let gated = ONE_AT_A_TIME.contains(&host(url).as_str());
        let mut gate = gated.then(|| ONE_AT_A_TIME_GATE.lock().unwrap_or_else(|p| p.into_inner()));
        let mut attempt = 0;
        loop {
            if let Some(last) = gate.as_deref().copied().flatten() {
                let since = last.elapsed();
                if since < ONE_AT_A_TIME_GAP {
                    std::thread::sleep(ONE_AT_A_TIME_GAP - since);
                }
            }
            let (response, retry_after) = self.get_once(url, accept);
            if let Some(g) = gate.as_mut() {
                **g = Some(Instant::now());
            }
            let busy = matches!(&response, Ok(r) if r.status == 429 || r.status == 503);
            if !busy || attempt >= RETRIES {
                return response;
            }
            std::thread::sleep(wait_before(attempt, retry_after.as_deref()));
            attempt += 1;
        }
    }

    /// Gets a page once, with what the service said of when to ask again.
    fn get_once(&self, url: &str, accept: Option<&str>) -> (Result<Response>, Option<String>) {
        let mut request = self.agent.get(url).header("User-Agent", &self.user_agent);
        if let Some(a) = accept {
            request = request.header("Accept", a);
        }
        let mut response = match request.call() {
            Ok(r) => r,
            Err(e) => return (Err(Error::Network(describe(url, &e))), None),
        };
        let status = response.status().as_u16();
        let header = |name: &str| response.headers().get(name).and_then(|v| v.to_str().ok()).map(str::to_owned);
        let content_type = header("content-type").unwrap_or_default();
        let retry_after = header("retry-after");
        let body = response
            .body_mut()
            .with_config()
            .limit(32 * 1024 * 1024)
            .read_to_string()
            .map_err(|e| Error::Network(describe(url, &e)));
        (body.map(|body| Response { status, body, content_type }), retry_after)
    }

    /// Sends a request that may carry JSON and a token, to a server of our
    /// own. Whatever the status, the answer is returned.
    pub fn send(
        &self,
        method: &str,
        url: &str,
        bearer: Option<&str>,
        body: Option<&serde_json::Value>,
    ) -> Result<Response> {
        let authorization = bearer.map(|t| format!("Bearer {t}"));
        let result = match method {
            "GET" | "DELETE" => {
                let mut request = if method == "GET" { self.agent.get(url) } else { self.agent.delete(url) }
                    .header("User-Agent", &self.user_agent)
                    .header("Accept", "application/json");
                if let Some(a) = &authorization {
                    request = request.header("Authorization", a);
                }
                request.call()
            }
            "POST" | "PATCH" => {
                let mut request = if method == "POST" { self.agent.post(url) } else { self.agent.patch(url) }
                    .header("User-Agent", &self.user_agent)
                    .header("Accept", "application/json");
                if let Some(a) = &authorization {
                    request = request.header("Authorization", a);
                }
                request.send_json(body.unwrap_or(&serde_json::Value::Object(Default::default())))
            }
            other => return Err(Error::invalid(tr!("network-method", method = other))),
        };
        let mut response = result.map_err(|e| Error::Network(describe(url, &e)))?;
        let status = response.status().as_u16();
        let content_type =
            response.headers().get("content-type").and_then(|v| v.to_str().ok()).unwrap_or("").to_owned();
        let body = response
            .body_mut()
            .with_config()
            .limit(4 * 1024 * 1024)
            .read_to_string()
            .map_err(|e| Error::Network(describe(url, &e)))?;
        Ok(Response { status, body, content_type })
    }

    /// As `get`, with anything but success an error.
    pub fn get_ok(&self, url: &str, accept: Option<&str>) -> Result<String> {
        let r = self.get(url, accept)?;
        match r.status {
            200..=299 => Ok(r.body),
            404 | 410 => Err(Error::not_found(tr!("network-nothing-there", host = host(url)))),
            429 => Err(Error::Network(tr!("network-wait", host = host(url)))),
            s => Err(Error::Network(tr!("network-status", host = host(url), status = s))),
        }
    }
}

pub fn host(url: &str) -> String {
    url.split("://").nth(1).unwrap_or(url).split(['/', '?']).next().unwrap_or(url).to_owned()
}

fn describe(url: &str, error: &ureq::Error) -> String {
    let host = host(url);
    match error {
        ureq::Error::Timeout(_) => tr!("network-timeout", host = host),
        ureq::Error::HostNotFound => tr!("network-host-not-found", host = host),
        ureq::Error::ConnectionFailed => tr!("network-unreachable", host = host),
        ureq::Error::Io(e) => tr!("network-unreachable-because", host = host, error = e.to_string()),
        other => format!("{host}: {other}"),
    }
}

/// For an address typed into a query.
pub fn encode(text: &str) -> String {
    let mut out = String::with_capacity(text.len() * 3);
    for b in text.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => out.push(b as char),
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn who_is_asking_is_the_program_never_the_person() {
        assert!(user_agent().starts_with("Glaukopis/"));
        assert!(!user_agent().contains("mailto") && !user_agent().contains('@'));
    }

    #[test]
    fn the_wait_before_asking_again() {
        assert_eq!(wait_before(0, Some("3")), Duration::from_secs(3));
        assert_eq!(wait_before(0, None), Duration::from_secs(1));
        assert_eq!(wait_before(2, Some("soon")), Duration::from_secs(4));
        assert_eq!(wait_before(0, Some("3600")), LONGEST_WAIT);
    }

    #[test]
    fn addresses() {
        assert_eq!(encode("Nagy, Best of the Achaeans"), "Nagy%2C%20Best%20of%20the%20Achaeans");
        assert_eq!(encode("μῆνις"), "%CE%BC%E1%BF%86%CE%BD%CE%B9%CF%82");
        assert_eq!(host("https://api.crossref.org/works?query=x"), "api.crossref.org");
    }
}
