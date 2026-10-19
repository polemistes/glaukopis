//! Fetching from the network. One client, which says who is asking.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use crate::error::{Error, Result};
use crate::tr;

/// What Glaukopis calls itself to the services it asks: the program and
/// where it is made, never anything of the person using it. Glaukopis sends
/// no personal detail or address anywhere by itself.
pub fn user_agent() -> String {
    format!("Glaukopis/{} (research tool; +https://github.com/polemistes/glaukopis)", env!("CARGO_PKG_VERSION"))
}

/// A service that says how often a program may ask it, by the hosts it
/// answers at. This is the one table of how the services are paced: a host
/// that is not in it is asked as often as it is asked.
///
/// Each service is asked one request at a time, from whichever thread the
/// requests come, as the owner wants of every service that is asked without
/// an address to reach the person at: the next request waits until the one
/// before has been answered and the gap after it has passed.
struct Service {
    /// The hosts, with the port where it is not the usual one, as [`host`] gives them.
    hosts: &'static [&'static str],
    /// The least time from the end of one request to the start of the next.
    gap: Duration,
    /// A longer gap after a request whose path and query begin so: a search,
    /// of which the service allows fewer.
    searching: Option<(&'static str, Duration)>,
}

const fn millis(ms: u64) -> Duration {
    Duration::from_millis(ms)
}

const SERVICES: [Service; 8] = [
    // Crossref takes five records a second and one search, one at a time,
    // from those who give no address to be reached at; doi.org hands
    // Crossref's DOIs on to it, so the two are one service here.
    Service {
        hosts: &["api.crossref.org", "doi.org", "dx.doi.org"],
        gap: millis(250),
        searching: Some(("/works?", millis(1000))),
    },
    Service { hosts: &["data.crosscite.org"], gap: millis(250), searching: None },
    // arXiv asks for no more than one request in three seconds.
    Service { hosts: &["export.arxiv.org"], gap: millis(3000), searching: None },
    // PubMed allows three a second without a key.
    Service { hosts: &["eutils.ncbi.nlm.nih.gov"], gap: millis(400), searching: None },
    // The catalogues of libraries say nothing; two a second is polite.
    Service { hosts: &["sru.k10plus.de"], gap: millis(500), searching: None },
    Service { hosts: &["bibsys.alma.exlibrisgroup.com"], gap: millis(500), searching: None },
    Service { hosts: &["services.dnb.de"], gap: millis(500), searching: None },
    Service { hosts: &["lx2.loc.gov:210"], gap: millis(500), searching: None },
];

/// Held while a request to the service of the same place in `SERVICES` is
/// under way: the earliest the next request may begin.
static GATES: [Mutex<Option<Instant>>; SERVICES.len()] = [const { Mutex::new(None) }; SERVICES.len()];

/// The place in `SERVICES` of the service that answers at `url`.
fn service_of(url: &str) -> Option<usize> {
    let host = host(url);
    SERVICES.iter().position(|s| s.hosts.contains(&host.as_str()))
}

/// Whether requests to `url` are paced: for the test that every service
/// the lookups ask is in the table.
#[cfg(test)]
pub(crate) fn paced(url: &str) -> bool {
    service_of(url).is_some()
}

/// How long the service at `index` is left alone after a request to `url`.
fn gap_after(index: usize, url: &str) -> Duration {
    let service = &SERVICES[index];
    let path = url.split("://").nth(1).unwrap_or(url);
    let path = path.find(['/', '?']).map_or("", |at| &path[at..]);
    match service.searching {
        Some((begins, gap)) if path.starts_with(begins) => gap,
        _ => service.gap,
    }
}

/// Asks with the gate held: waits until the gate says the service may be
/// asked, asks, and sets when it may be asked next, `gap` after the answer
/// or, when the service asked to be left alone longer, after that. What was
/// asked comes back with the wait the service asked for.
fn through_gate<T>(
    gate: &Mutex<Option<Instant>>,
    gap: Duration,
    ask: impl FnOnce() -> (T, Option<Duration>),
) -> (T, Option<Duration>) {
    let mut ready = gate.lock().unwrap_or_else(|p| p.into_inner());
    if let Some(at) = *ready {
        let now = Instant::now();
        if at > now {
            std::thread::sleep(at - now);
        }
    }
    let (answer, wait) = ask();
    *ready = Some(Instant::now() + wait.map_or(gap, |w| w.max(gap)));
    (answer, wait)
}

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
    /// Set when what is asked is no longer wanted: a page is not asked
    /// again, nor at all once it is set. See `until`.
    stop: Option<Arc<AtomicBool>>,
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
        Client { agent, patient, user_agent: user_agent(), stop: None }
    }

    /// The same client, which asks no more once `stop` is set: for a
    /// question asked of several services, whose other answers are not
    /// wanted once one has answered.
    pub fn until(&self, stop: Arc<AtomicBool>) -> Client {
        Client { stop: Some(stop), ..self.clone() }
    }

    fn stopped(&self) -> bool {
        self.stop.as_ref().is_some_and(|s| s.load(Ordering::Relaxed))
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
        let body = bounded(response.body_mut(), limit).map_err(|e| Error::Network(describe(url, &e)))?;
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
        let body = bounded(response.body_mut(), 1024 * 1024).map_err(|e| Error::Network(describe(url, &e)))?;
        Ok(Bytes { status, body })
    }

    /// Gets a page. `accept` says which form is wanted, where the service
    /// offers several. A service in `SERVICES` is asked one request at a
    /// time and no oftener than it allows; a service that says it is asked
    /// too often or is too busy is asked again after the wait it asks for,
    /// a few times. The gate of the service is not held through that wait,
    /// but it says to every request to the service that it must wait too.
    pub fn get(&self, url: &str, accept: Option<&str>) -> Result<Response> {
        let service = service_of(url);
        let mut attempt = 0;
        loop {
            if self.stopped() {
                // No one waits for the answer: it is not asked for.
                return Err(Error::Network(tr!("network-failed", host = host(url))));
            }
            let ask = || {
                let (response, retry_after) = self.get_once(url, accept);
                let busy = matches!(&response, Ok(r) if r.status == 429 || r.status == 503);
                let wait = busy.then(|| wait_before(attempt, retry_after.as_deref()));
                (response, wait)
            };
            let (response, wait) = match service {
                Some(index) => {
                    let (response, wait) = through_gate(&GATES[index], gap_after(index, url), ask);
                    // The gate makes the next attempt wait as long as was asked.
                    (response, wait.map(|_| Duration::ZERO))
                }
                None => ask(),
            };
            let Some(wait) = wait else { return response };
            if attempt >= RETRIES || self.stopped() {
                return response;
            }
            std::thread::sleep(wait);
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
        let body = bounded_text(response.body_mut(), 32 * 1024 * 1024, url);
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
        let body = bounded_text(response.body_mut(), 4 * 1024 * 1024, url)?;
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

/// What an answer holds, decompressed, to at most `limit` bytes. The limit
/// of ureq itself counts the bytes as they come, before what is compressed
/// is decompressed (its `LimitReader` stands under the decoder, in ureq
/// 3.4), so that 32 MB of gzip from a service gone wrong could become many
/// gigabytes in memory. Here what is decompressed is counted; ureq's limit
/// stays as well, on what comes.
fn bounded(body: &mut ureq::Body, limit: u64) -> std::result::Result<Vec<u8>, ureq::Error> {
    use std::io::Read;
    let mut out = Vec::new();
    body.with_config().limit(limit).reader().take(limit + 1).read_to_end(&mut out)?;
    if out.len() as u64 > limit {
        return Err(ureq::Error::BodyExceedsLimit(limit));
    }
    Ok(out)
}

/// As `bounded`, for an answer of text.
fn bounded_text(body: &mut ureq::Body, limit: u64, url: &str) -> Result<String> {
    let bytes = bounded(body, limit).map_err(|e| Error::Network(describe(url, &e)))?;
    String::from_utf8(bytes).map_err(|_| Error::Network(tr!("network-not-understood", host = host(url))))
}

pub fn host(url: &str) -> String {
    url.split("://").nth(1).unwrap_or(url).split(['/', '?']).next().unwrap_or(url).to_owned()
}

/// What went wrong, in the words of the interface. What the library of the
/// network says itself, in English, goes to the log; the user is told what
/// it means for them.
fn describe(url: &str, error: &ureq::Error) -> String {
    let host = host(url);
    match error {
        ureq::Error::Timeout(_) => return tr!("network-timeout", host = host),
        ureq::Error::HostNotFound => return tr!("network-host-not-found", host = host),
        ureq::Error::ConnectionFailed => return tr!("network-unreachable", host = host),
        ureq::Error::Io(e) => return tr!("network-unreachable-because", host = host, error = e.to_string()),
        _ => {}
    }
    tracing::warn!(%host, %error, "a question over the network failed");
    match error {
        ureq::Error::BodyExceedsLimit(most) => tr!("network-too-large", host = host, most = most.div_ceil(1 << 20)),
        ureq::Error::Tls(_) | ureq::Error::NativeTls(_) | ureq::Error::Der(_) | ureq::Error::TlsRequired => {
            tr!("network-tls", host = host)
        }
        ureq::Error::TooManyRedirects | ureq::Error::RedirectFailed => tr!("network-redirects", host = host),
        ureq::Error::BodyStalled => tr!("network-stalled", host = host),
        ureq::Error::Protocol(_)
        | ureq::Error::LargeResponseHeader(..)
        | ureq::Error::Decompress(..)
        | ureq::Error::Json(_) => tr!("network-not-understood", host = host),
        _ => tr!("network-failed", host = host),
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
    fn a_service_is_known_by_its_hosts() {
        let doi = service_of("https://doi.org/10.1086/599247");
        assert!(doi.is_some());
        assert_eq!(service_of("https://api.crossref.org/works/10.1086/599247/transform"), doi);
        assert_ne!(service_of("https://data.crosscite.org/10.5061/dryad.1"), doi);
        assert!(service_of("http://lx2.loc.gov:210/lcdb?version=1.1").is_some());
        assert_eq!(service_of("https://raw.githubusercontent.com/citation-style-language/styles/master/apa.csl"), None);
    }

    #[test]
    fn a_search_leaves_the_service_alone_longer_than_a_record() {
        let crossref = service_of("https://api.crossref.org/works").unwrap();
        assert_eq!(gap_after(crossref, "https://api.crossref.org/works?query.bibliographic=x&rows=5"), millis(1000));
        assert_eq!(gap_after(crossref, "https://api.crossref.org/works/10.1/x/transform"), millis(250));
        assert_eq!(gap_after(crossref, "https://doi.org/10.1/x"), millis(250));
        let arxiv = service_of("https://export.arxiv.org/api/query?id_list=1706.03762").unwrap();
        assert_eq!(gap_after(arxiv, "https://export.arxiv.org/api/query?id_list=1706.03762"), millis(3000));
    }

    #[test]
    fn a_service_is_asked_one_request_at_a_time_and_no_oftener_than_it_allows() {
        use std::sync::atomic::AtomicUsize;
        let gate = Mutex::new(None);
        let under_way = AtomicUsize::new(0);
        let most = AtomicUsize::new(0);
        let start = Instant::now();
        std::thread::scope(|s| {
            for _ in 0..3 {
                s.spawn(|| {
                    through_gate(&gate, millis(40), || {
                        let now = under_way.fetch_add(1, Ordering::SeqCst) + 1;
                        most.fetch_max(now, Ordering::SeqCst);
                        std::thread::sleep(millis(10));
                        under_way.fetch_sub(1, Ordering::SeqCst);
                        ((), None)
                    });
                });
            }
        });
        assert_eq!(most.load(Ordering::SeqCst), 1, "never two requests at once");
        // Three answers of 10 ms with two gaps of 40 ms between them.
        assert!(start.elapsed() >= millis(110));
    }

    #[test]
    fn a_wait_the_service_asks_for_holds_for_every_request_to_it() {
        let gate = Mutex::new(None);
        let (_, wait) = through_gate(&gate, millis(10), || ((), Some(millis(80))));
        assert_eq!(wait, Some(millis(80)));
        let start = Instant::now();
        through_gate(&gate, millis(10), || ((), None));
        assert!(start.elapsed() >= millis(70), "the next request waited for what the service asked");
    }

    /// A server of one answer, on this computer: its address.
    fn answering(head: &'static str, body: Vec<u8>) -> String {
        use std::io::{Read, Write};
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let address = listener.local_addr().unwrap();
        std::thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let mut asked = Vec::new();
            let mut byte = [0u8; 1];
            while !asked.ends_with(b"\r\n\r\n") && stream.read(&mut byte).unwrap_or(0) == 1 {
                asked.push(byte[0]);
            }
            let head = format!("HTTP/1.1 200 OK\r\n{head}Content-Length: {}\r\nConnection: close\r\n\r\n", body.len());
            let _ = stream.write_all(head.as_bytes()).and_then(|()| stream.write_all(&body));
        });
        format!("http://{address}/")
    }

    #[test]
    fn a_compressed_answer_is_bounded_by_what_it_holds() {
        use std::io::Write;
        // 40 MB of text, which gzip makes some 40 kB of.
        let mut gzip = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::best());
        gzip.write_all(&vec![b'a'; 40 * 1024 * 1024]).unwrap();
        let small = gzip.finish().unwrap();
        assert!(small.len() < 1024 * 1024);
        let url = answering("Content-Type: text/plain\r\nContent-Encoding: gzip\r\n", small);
        let Err(Error::Network(said)) = Client::new().get(&url, None) else { panic!("read whole") };
        assert_eq!(said, tr!("network-too-large", host = host(&url), most = 32));

        // What is within the limit, decompressed, is read.
        let mut gzip = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::best());
        gzip.write_all(b"the wrath of Achilles").unwrap();
        let url = answering("Content-Type: text/plain\r\nContent-Encoding: gzip\r\n", gzip.finish().unwrap());
        assert_eq!(Client::new().get(&url, None).unwrap().body, "the wrath of Achilles");
    }

    #[test]
    fn addresses() {
        assert_eq!(encode("Nagy, Best of the Achaeans"), "Nagy%2C%20Best%20of%20the%20Achaeans");
        assert_eq!(encode("μῆνις"), "%CE%BC%E1%BF%86%CE%BD%CE%B9%CF%82");
        assert_eq!(host("https://api.crossref.org/works?query=x"), "api.crossref.org");
    }

    #[test]
    fn what_went_wrong_is_said_in_words_of_the_interface() {
        let url = "https://api.crossref.org/works";
        assert_eq!(
            describe(url, &ureq::Error::BodyExceedsLimit(32 * 1024 * 1024)),
            "api.crossref.org answered with more than Glaukopis takes (32 MB)"
        );
        assert!(
            describe(url, &ureq::Error::Tls("bad certificate")).starts_with("a secure connection to api.crossref.org")
        );
        assert!(describe(url, &ureq::Error::TooManyRedirects).contains("too many times"));
        // Nothing of what the library says in English reaches the user.
        let other = describe(url, &ureq::Error::InvalidProxyUrl);
        assert_eq!(other, "api.crossref.org could not be asked; the log of the run says why");
    }
}
