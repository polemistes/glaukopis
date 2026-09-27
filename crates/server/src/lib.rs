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

pub mod api;
pub mod registry;
pub mod rooms;
pub mod secrets;

use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use tokio::net::TcpListener;
use tokio::sync::Mutex;

pub use registry::Registry;
pub use rooms::Rooms;

#[derive(Debug, Clone)]
pub struct Config {
    pub data: PathBuf,
    /// Required to publish a project, when set. Joining needs only a code.
    pub password: Option<String>,
    /// Take the address of the caller from `X-Forwarded-For`: for a server behind a proxy.
    pub trust_proxy: bool,
    /// The most rooms the server will hold. None for no limit.
    pub max_rooms: Option<usize>,
}

impl Config {
    pub fn new(data: impl Into<PathBuf>) -> Self {
        Config { data: data.into(), password: None, trust_proxy: false, max_rooms: None }
    }
}

pub struct Server {
    pub config: Config,
    pub registry: Mutex<Registry>,
    pub rooms: Rooms,
    pub limiter: Mutex<api::Limiter>,
    pub tickets: Mutex<api::Tickets>,
}

pub type Shared = Arc<Server>;

impl Server {
    pub fn open(config: Config) -> std::io::Result<Shared> {
        std::fs::create_dir_all(&config.data)?;
        let registry = Registry::open(&config.data)?;
        let rooms = Rooms::new(config.data.clone());
        Ok(Arc::new(Server {
            config,
            registry: Mutex::new(registry),
            rooms,
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
    result
}
