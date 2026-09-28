use std::net::SocketAddr;
use std::path::PathBuf;

use clap::Parser;
use glaukopis_server::{Config, MAX_FILE_BYTES, MAX_ROOM_BYTES, Server, serve};

/// The collaboration server of Glaukopis.
///
/// Keeps the projects that are shared through it, and passes changes between
/// those who have them open. It does not encrypt what it sends: on anything
/// but a local network, put it behind a proxy that does (see the guide).
#[derive(Parser)]
#[command(name = "glaukopis-server", version)]
struct Args {
    /// The address and port to listen on.
    #[arg(long, env = "GLAUKOPIS_SERVER_LISTEN", default_value = "127.0.0.1:8375")]
    listen: SocketAddr,

    /// The directory where the projects are kept.
    #[arg(long, env = "GLAUKOPIS_SERVER_DATA", default_value_os_t = default_data())]
    data: PathBuf,

    /// A password asked of those who publish projects on the server. Those who
    /// join by a code need none. Without it, anyone who can reach the server
    /// can publish on it.
    #[arg(long, env = "GLAUKOPIS_SERVER_PASSWORD", hide_env_values = true)]
    password: Option<String>,

    /// A file holding the password, for keeping it out of the list of what is running.
    #[arg(long, env = "GLAUKOPIS_SERVER_PASSWORD_FILE", conflicts_with = "password")]
    password_file: Option<PathBuf>,

    /// Take the addresses of callers from the X-Forwarded-For header. For a
    /// server behind a proxy, and only then.
    #[arg(long, env = "GLAUKOPIS_SERVER_TRUST_PROXY")]
    trust_proxy: bool,

    /// The most projects the server will hold.
    #[arg(long, env = "GLAUKOPIS_SERVER_MAX_ROOMS")]
    max_rooms: Option<usize>,

    /// The most one file of a project may hold, in megabytes.
    #[arg(long, env = "GLAUKOPIS_SERVER_MAX_FILE_MB", value_name = "MB", default_value_t = MAX_FILE_BYTES >> 20)]
    max_file_mb: u64,

    /// The most the files of one project may hold together, in megabytes.
    #[arg(long, env = "GLAUKOPIS_SERVER_MAX_ROOM_MB", value_name = "MB", default_value_t = MAX_ROOM_BYTES >> 20)]
    max_room_mb: u64,
}

fn default_data() -> PathBuf {
    let base = std::env::var_os("XDG_DATA_HOME")
        .map(PathBuf::from)
        .filter(|p| p.is_absolute())
        .or_else(|| std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".local").join("share")))
        .unwrap_or_else(|| PathBuf::from("."));
    base.join("glaukopis-server")
}

async fn asked_to_stop() {
    let interrupted = tokio::signal::ctrl_c();
    #[cfg(unix)]
    {
        use tokio::signal::unix::{SignalKind, signal};
        match signal(SignalKind::terminate()) {
            Ok(mut terminated) => {
                tokio::select! {
                    _ = interrupted => {}
                    _ = terminated.recv() => {}
                }
            }
            Err(_) => {
                let _ = interrupted.await;
            }
        }
    }
    #[cfg(not(unix))]
    {
        let _ = interrupted.await;
    }
    tracing::info!("stopping");
}

fn password(args: &Args) -> Result<Option<String>, String> {
    let given = match (&args.password, &args.password_file) {
        (Some(p), _) => Some(p.clone()),
        (None, Some(path)) => Some(
            std::fs::read_to_string(path)
                .map_err(|e| format!("the password could not be read from {}: {e}", path.display()))?,
        ),
        (None, None) => None,
    };
    match given.map(|p| p.trim().to_owned()) {
        Some(p) if p.is_empty() => Err("the password is empty".into()),
        other => Ok(other),
    }
}

async fn run(args: Args) -> Result<(), String> {
    let config = Config {
        data: args.data.clone(),
        password: password(&args)?,
        trust_proxy: args.trust_proxy,
        max_rooms: args.max_rooms,
        max_file_bytes: args.max_file_mb.saturating_mul(1 << 20),
        max_room_bytes: args.max_room_mb.saturating_mul(1 << 20),
    };
    let open_to_all = config.password.is_none();
    let server =
        Server::open(config).map_err(|e| format!("the directory {} could not be used: {e}", args.data.display()))?;
    let listener = tokio::net::TcpListener::bind(args.listen)
        .await
        .map_err(|e| format!("could not listen on {}: {e}", args.listen))?;

    tracing::info!(listen = %args.listen, data = %args.data.display(), "glaukopis-server {}", env!("CARGO_PKG_VERSION"));
    if open_to_all {
        tracing::warn!("no password is set: anyone who can reach the server can publish projects on it");
    }
    if !args.listen.ip().is_loopback() {
        tracing::warn!(
            "the server does not encrypt what it sends: outside a local network, put it behind a proxy that does"
        );
    }
    serve(server, listener, asked_to_stop()).await.map_err(|e| format!("the server stopped: {e}"))
}

fn main() {
    let args = Args::parse();
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_env("GLAUKOPIS_SERVER_LOG")
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .with_writer(std::io::stderr)
        .init();

    let runtime = match tokio::runtime::Builder::new_multi_thread().enable_all().build() {
        Ok(runtime) => runtime,
        Err(e) => {
            eprintln!("glaukopis-server: {e}");
            std::process::exit(1);
        }
    };
    if let Err(message) = runtime.block_on(run(args)) {
        eprintln!("glaukopis-server: {message}");
        std::process::exit(1);
    }
}
