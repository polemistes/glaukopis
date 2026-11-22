//! The collaboration server of Glaukopis.
//!
//! A project that is shared is a *room* here. The server keeps the state of
//! each room and passes changes between those who have it open. It speaks the
//! synchronisation protocol of Yjs over WebSocket, so that the application
//! needs nothing of its own to talk to it. See ADR 0006.
//!
//! Who may do what is decided by tokens. Publishing a project yields the
//! owner's token; the owner makes invitation codes; presenting a code yields a
//! member's token. Only hashes of tokens are kept.
//!
//! The figures of a project are files, which the project names by what they
//! hold. They are sent apart from the project and kept beside it.
//!
//! A writer's computers keep the same things through a *home* here (see
//! `homes.rs`): its computers, its documents, each kept as a room is, and
//! one store of files. See ADR 0119.

pub mod api;
pub mod files;
pub mod homes;
pub mod homes_api;
pub mod registry;
pub mod rooms;
pub mod secrets;

use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use tokio::net::TcpListener;
use tokio::sync::Mutex;

pub use files::{Files, MAX_FILE_BYTES, MAX_HOME_BYTES, MAX_HOME_FILE_BYTES, MAX_ROOM_BYTES};
pub use homes::{Homes, Listing};
pub use registry::Registry;
pub use rooms::{MAX_DOCUMENT_BYTES, Rooms};

#[derive(Debug, Clone)]
pub struct Config {
    pub data: PathBuf,
    /// Required to publish a project, when set. Joining needs only a code.
    pub password: Option<String>,
    /// Take the address of the caller from `X-Forwarded-For`: for a server behind a proxy.
    pub trust_proxy: bool,
    /// The most rooms the server will hold. None for no limit.
    pub max_rooms: Option<usize>,
    /// The most one file of a room may hold.
    pub max_file_bytes: u64,
    /// The most the files of one room may hold together.
    pub max_room_bytes: u64,
    /// The most the document of one room may hold, and so one document of a home.
    pub max_document_bytes: usize,
    /// The most homes the server will hold. None for no limit.
    pub max_homes: Option<usize>,
    /// The most one file of a home may hold.
    pub max_home_file_bytes: u64,
    /// The most the files of one home may hold together.
    pub max_home_bytes: u64,
}

impl Config {
    pub fn new(data: impl Into<PathBuf>) -> Self {
        Config {
            data: data.into(),
            password: None,
            trust_proxy: false,
            max_rooms: None,
            max_file_bytes: MAX_FILE_BYTES,
            max_room_bytes: MAX_ROOM_BYTES,
            max_document_bytes: MAX_DOCUMENT_BYTES,
            max_homes: None,
            max_home_file_bytes: MAX_HOME_FILE_BYTES,
            max_home_bytes: MAX_HOME_BYTES,
        }
    }
}

pub struct Server {
    pub config: Config,
    pub registry: Mutex<Registry>,
    pub rooms: Rooms,
    pub files: Files,
    /// Who may enter which home.
    pub homes: Mutex<Homes>,
    /// What the documents of the homes hold, said short.
    pub listing: Listing,
    /// The documents of the homes, each a room, known by `<home>/<kind>/<id>`.
    pub home_docs: Rooms,
    pub home_files: Files,
    pub limiter: Mutex<api::Limiter>,
    pub tickets: Mutex<api::Tickets>,
}

pub type Shared = Arc<Server>;

impl Server {
    pub fn open(config: Config) -> std::io::Result<Shared> {
        std::fs::create_dir_all(&config.data)?;
        let registry = Registry::open(&config.data)?;
        let rooms = Rooms::new(config.data.clone(), config.max_document_bytes);
        let files = Files::new(config.data.clone(), config.max_file_bytes, config.max_room_bytes);
        files.sweep();
        let homes = Homes::open(&config.data)?;
        let listing = Listing::read(&config.data, homes.ids());
        let home_docs = Rooms::new(config.data.clone(), config.max_document_bytes);
        let home_files = Files::of_homes(config.data.clone(), config.max_home_file_bytes, config.max_home_bytes);
        home_files.sweep();
        Ok(Arc::new(Server {
            config,
            registry: Mutex::new(registry),
            rooms,
            files,
            homes: Mutex::new(homes),
            listing,
            home_docs,
            home_files,
            limiter: Mutex::new(api::Limiter::default()),
            tickets: Mutex::new(api::Tickets::default()),
        }))
    }
}

/// How often what has changed is written.
const WRITING: Duration = Duration::from_secs(5);

/// Serves until `stop` resolves, then writes what is unsaved.
pub async fn serve(
    server: Shared,
    listener: TcpListener,
    stop: impl std::future::Future<Output = ()> + Send + 'static,
) -> std::io::Result<()> {
    let saver = {
        let server = server.clone();
        tokio::spawn(async move {
            let mut tick = tokio::time::interval(WRITING);
            loop {
                tick.tick().await;
                server.rooms.save_all().await;
                server.rooms.unload_idle().await;
                server.home_docs.save_all().await;
                server.home_docs.unload_idle().await;
            }
        })
    };
    let stopping = {
        let server = server.clone();
        async move {
            stop.await;
            // Connections that are open would otherwise keep the server from stopping.
            server.rooms.dismiss_all().await;
        }
    };
    let app = api::router(server.clone());
    let result = axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>())
        .with_graceful_shutdown(stopping)
        .await;
    saver.abort();
    server.rooms.save_all().await;
    server.home_docs.save_all().await;
    result
}
