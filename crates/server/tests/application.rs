//! The server as the application meets it: by what the application itself
//! uses to talk to it.

use std::time::Duration;

use glaukopis_core::net::Client;
use glaukopis_core::pictures::Pictures;
use glaukopis_core::sharing::{Remote, Used};
use glaukopis_server::{Config, Server, serve};
use tokio::sync::oneshot;

const ROOM: &str = "0a1b2c3d-0000-4000-8000-000000000001";

/// A picture of four points by three, in one colour.
const PNG: [u8; 73] = [
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 4, 0, 0, 0, 3, 8, 2, 0, 0, 0, 59, 150, 57,
    145, 0, 0, 0, 16, 73, 68, 65, 84, 120, 218, 99, 56, 17, 160, 1, 71, 12, 56, 57, 0, 44, 54, 15, 1, 74, 169, 232,
    210, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
];

const SVG: &str = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"10\"><circle r=\"4\"/></svg>";

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn the_pictures_of_a_project_are_brought_to_be_the_same() {
    let tmp = tempfile::tempdir().unwrap();
    let mut config = Config::new(tmp.path().join("server"));
    // The server takes less than a picture may hold with the application.
    config.max_file_bytes = 300;
    let server = Server::open(config).unwrap();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = format!("http://{}", listener.local_addr().unwrap());
    let (stop, stopped) = oneshot::channel::<()>();
    let serving = tokio::spawn(serve(server, listener, async {
        let _ = stopped.await;
    }));

    let root = tmp.path().to_owned();
    tokio::task::spawn_blocking(move || {
        let client = Client::new(None);
        let remote = Remote::new(&client, &address).unwrap();
        let owner = remote.publish(ROOM, "Wrath", None).unwrap();
        let code = remote.invite(ROOM, &owner, "", None, None).unwrap().code;
        let joined = remote.join(&code, "Another").unwrap();

        // Each has a store of pictures, in which there is more than the project uses.
        let hers = Pictures::open(root.join("hers")).unwrap();
        let his = Pictures::open(root.join("his")).unwrap();
        let vase = hers.add("vase.png", &PNG).unwrap();
        let circle = his.add("circle.svg", SVG.as_bytes()).unwrap();
        let apart = hers.add("of another project.svg", SVG.replace("4", "2").as_bytes()).unwrap();
        let used = |pictures: &[&glaukopis_core::pictures::Picture]| -> Vec<Used> {
            pictures
                .iter()
                .map(|p| Used { hash: p.hash.clone(), extension: p.extension.clone(), name: p.name.clone() })
                .collect()
        };

        // Nothing is there: what the project uses of hers is sent, and nothing else.
        assert_eq!(remote.files(ROOM, &owner).unwrap(), (vec![], 300));
        let done = remote.sync_pictures(ROOM, &owner, &hers, &used(&[&vase])).unwrap();
        assert_eq!((done.sent, done.fetched, done.problems.len()), (1, 0, 0), "{:?}", done.problems);
        let there: Vec<String> = remote.files(ROOM, &owner).unwrap().0.into_iter().map(|f| f.hash).collect();
        assert_eq!(there, vec![vase.hash.clone()]);
        assert!(!there.contains(&apart.hash));

        // He sends his, and fetches hers, which is called what the project calls it.
        let done = remote.sync_pictures(ROOM, &joined.token, &his, &used(&[&vase, &circle])).unwrap();
        assert_eq!((done.sent, done.fetched, done.problems.len()), (1, 1, 0), "{:?}", done.problems);
        assert_eq!(his.read(&vase.hash, "png").unwrap(), PNG);
        assert_eq!(his.get(&vase.hash).unwrap().name, "vase.png");

        // She fetches his, and is told what kind it is by what it holds.
        let done = remote.sync_pictures(ROOM, &owner, &hers, &used(&[&vase])).unwrap();
        assert_eq!((done.sent, done.fetched), (0, 1));
        assert_eq!(hers.read(&circle.hash, "svg").unwrap(), SVG.as_bytes());
        assert_eq!(hers.get(&circle.hash).unwrap().name, "");

        // Then there is nothing to do.
        let done = remote.sync_pictures(ROOM, &owner, &hers, &used(&[&vase, &circle])).unwrap();
        assert_eq!((done.sent, done.fetched, done.problems.len()), (0, 0, 0));
        assert_eq!(his.list().len(), 2);
        assert_eq!(hers.list().len(), 3);

        // A picture the server does not take is said to be that, once, and
        // does not keep the rest from being seen to.
        let large = format!("<svg xmlns=\"http://www.w3.org/2000/svg\"><!--{}--></svg>", "x".repeat(400));
        let larger = format!("<svg xmlns=\"http://www.w3.org/2000/svg\"><!--{}--></svg>", "y".repeat(500));
        let a = his.add("large.svg", large.as_bytes()).unwrap();
        let b = his.add("larger.svg", larger.as_bytes()).unwrap();
        let small = his.add("small.svg", SVG.replace("4", "3").as_bytes()).unwrap();
        let done = remote.sync_pictures(ROOM, &joined.token, &his, &used(&[&a, &b, &small, &small])).unwrap();
        assert_eq!(done.sent, 1);
        assert_eq!(done.problems.len(), 1, "{:?}", done.problems);
        assert!(done.problems[0].starts_with("A picture is larger than 127.0.0.1"), "{:?}", done.problems);
        assert!(remote.files(ROOM, &owner).unwrap().0.iter().any(|f| f.hash == small.hash));
        // Sent all the same, it is refused in the words of the server.
        let hash = glaukopis_server::files::hash_of(large.as_bytes());
        let refused = remote.send_file(ROOM, &owner, &hash, large.as_bytes()).unwrap_err();
        assert_eq!(refused.kind(), "too-large");
        assert!(refused.to_string().starts_with("The file is larger than this server takes"), "{refused}");

        // One who is not of the project is given nothing, and takes nothing in.
        let refused = remote.sync_pictures(ROOM, "not-a-token", &hers, &used(&[&vase])).unwrap_err();
        assert_eq!(refused.kind(), "not-admitted");
        assert!(remote.fetch_file(ROOM, "not-a-token", &vase.hash).is_err());
        assert!(remote.send_file(ROOM, "not-a-token", &vase.hash, &PNG).is_err());
        // Nor is what is asked for given under another name.
        assert_eq!(remote.fetch_file(ROOM, &owner, &"0".repeat(64)).unwrap_err().kind(), "no-file");
    })
    .await
    .unwrap();

    let _ = stop.send(());
    tokio::time::timeout(Duration::from_secs(10), serving).await.unwrap().unwrap().unwrap();
}
