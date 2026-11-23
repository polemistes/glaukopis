//! The door of the phone (stage 3 of `docs/plans/an-app-for-android.md`,
//! part C): what the part of the app in Kotlin calls with no window. One
//! function puts what another app handed over into the notebook's inbox;
//! one makes a round of the synchronization, which Android runs when the
//! phone has a network and the app may be closed (WorkManager, `Round.kt`).
//! Each is reached from Java by its name (JNI), below; on a computer the
//! round is `glaukopis --phone --round`, for trying.
//!
//! **One opening of the data folder in a process.** The round must open the
//! folder as the role opens it (the library read, the stores, the claim),
//! and the claim is a lock that a second opening in the same process does
//! not get. Were the app opened while such a round is under way, the role
//! would find its own folder in use and end. So what this process has of the
//! folder is kept here, in one place: nothing, the door's (opened for the
//! rounds under way, with how many), or the role's. The role, when it
//! starts, takes over what the door opened: the same state, and the same
//! engine, whose next round waits for the one under way as any round waits
//! for another. The trials found that both happen in one process: the
//! launcher started the app in the process Android had started for a
//! round.

use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock, PoisonError};

use glaukopis_core::notebook::inbox::Inbox;
use glaukopis_core::notebook::shared::{self, Put, Shared};
use glaukopis_core::paths::DataDir;
use glaukopis_core::sync::kept::Kept;
use glaukopis_core::sync::{State, Sync, Takes};

use crate::commands::sync::{Windows, engine_for};
use crate::starting::{self, Opening};
use crate::state::AppState;

/// What this process has of the phone's folder.
enum Held {
    /// The folder is not opened here.
    Nothing,
    /// Opened by the door for the rounds under way, while no role runs.
    Door { state: Box<AppState>, sync: Arc<Sync>, windows: Windows, rounds: usize },
    /// The role runs: its state is Tauri's, and its engine is here.
    Role { sync: Arc<Sync> },
}

/// What a process has of the phone's folder, behind one lock. A process has
/// one (`FOLDER`); each test makes its own.
pub struct Folder {
    held: Mutex<Held>,
}

/// The folder of this process.
pub static FOLDER: Folder = Folder::new();

/// What came of a round, as Android is told it: done, or to be tried again.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Round {
    Done,
    Again,
}

impl Round {
    /// As Java is given it: `0` done, `1` to be tried again.
    pub fn code(self) -> i32 {
        match self {
            Round::Done => 0,
            Round::Again => 1,
        }
    }
}

/// The first half of a round: the engine it is made with, and whether the
/// door opened the folder for it.
pub struct Begun {
    sync: Arc<Sync>,
    of_door: bool,
}

/// What comes of beginning a round.
pub enum Begin {
    /// The round may be made, with this.
    Round(Begun),
    /// Nothing to do: the device is in no home, or the folder could not be opened.
    Done,
    /// The folder is another process's: tried again later.
    Again,
}

/// What the role is given when it starts.
pub enum Given {
    /// The state, the engine, and whom the engine tells: taken over from the door, or opened now.
    Ready(Box<AppState>, Arc<Sync>, Windows),
    /// Another process has the folder.
    InUse(PathBuf),
    /// It could not be opened.
    Failed(glaukopis_core::Error),
}

fn held(folder: &Folder) -> std::sync::MutexGuard<'_, Held> {
    folder.held.lock().unwrap_or_else(PoisonError::into_inner)
}

/// The core speaks the language chosen in the folder's settings, else the
/// one Android is set to (`said`, a tag): the role's page and the round's
/// words, a problem said in the settings when the app is next opened, are
/// in the same language.
fn speak(said: &str) -> impl FnOnce(Option<&DataDir>) + '_ {
    move |data| {
        let chosen = data
            .and_then(|data| glaukopis_core::settings::load(&data.settings_file()).ok())
            .and_then(|settings| glaukopis_core::settings::string(&settings, "language"))
            .filter(|language| language != "system");
        let tag = chosen.unwrap_or_else(|| glaukopis_core::i18n::system_tag_as(Some(said)));
        glaukopis_core::i18n::set_language(&tag);
    }
}

impl Folder {
    pub const fn new() -> Self {
        Folder { held: Mutex::new(Held::Nothing) }
    }

    /// The first half of a round of the folder at `root`, under the lock.
    /// With the role running, its engine. With the door's, its engine, and
    /// one round more. With nothing: where the folder holds no home, done,
    /// with nothing opened and nothing made; else the folder is opened as
    /// the role opens it, and the engine made, told that the device takes
    /// the notes.
    pub fn begin(&self, root: &Path, language: &str) -> Begin {
        let mut held = held(self);
        match &mut *held {
            Held::Role { sync } => return Begin::Round(Begun { sync: sync.clone(), of_door: false }),
            Held::Door { sync, rounds, .. } => {
                *rounds += 1;
                return Begin::Round(Begun { sync: sync.clone(), of_door: true });
            }
            Held::Nothing => {}
        }
        // Looked at on the disk alone: a device in no home opens nothing.
        if !matches!(Kept::new(&DataDir::at(root)).joined(), Ok(Some(_))) {
            return Begin::Done;
        }
        crate::log::start(root);
        match starting::opening(root.to_owned(), false, None, speak(language)) {
            Opening::Ready(state) => {
                let windows: Windows = Arc::new(OnceLock::new());
                let sync = engine_for(windows.clone(), &state, Takes::Notes);
                tracing::info!("a round of the synchronization with no window");
                *held = Held::Door { state, sync: sync.clone(), windows, rounds: 1 };
                Begin::Round(Begun { sync, of_door: true })
            }
            Opening::InUse(root) => {
                tracing::info!(data = %root.display(), "the folder is another's: the round is tried again later");
                Begin::Again
            }
            Opening::Failed(error) => {
                tracing::warn!(%error, "the folder could not be opened for a round of the synchronization");
                Begin::Done
            }
        }
    }

    /// The second half of a round, under the lock: what the door opened is
    /// let go, its claim with it, when its last round has ended and no role
    /// has taken it over. To be tried again where the server was not
    /// reached; done for everything else (a home that lets the device in no
    /// more, a later form, a full home are mended by no waiting, and are
    /// said by the page when the app is next opened).
    pub fn end(&self, begun: Begun) -> Round {
        let reached = begun.sync.status().state != State::Offline;
        if begun.of_door {
            let mut held = held(self);
            if let Held::Door { rounds, .. } = &mut *held {
                *rounds -= 1;
                if *rounds == 0 {
                    *held = Held::Nothing;
                }
            }
        }
        if reached { Round::Done } else { Round::Again }
    }

    /// One round of the folder at `root`, on the thread that asks. No
    /// thread of the engine is started by the door.
    pub fn round(&self, root: &Path, language: &str) -> Round {
        match self.begin(root, language) {
            Begin::Round(begun) => {
                begun.sync.once(true);
                self.end(begun)
            }
            Begin::Done => Round::Done,
            Begin::Again => Round::Again,
        }
    }

    /// Whether the role runs in this process.
    #[cfg_attr(not(target_os = "android"), allow(dead_code))]
    pub fn role_runs(&self) -> bool {
        matches!(*held(self), Held::Role { .. })
    }

    /// What the role is given when it starts: what the door opened, taken
    /// over as it is; else the folder opened by `open`, and the engine made,
    /// under the lock, so that no round of the door opens it meanwhile. The
    /// role sets its own handle into the windows it is given, and the engine
    /// tells them from then on.
    pub fn for_role(&self, open: impl FnOnce() -> Opening) -> Given {
        let mut held = held(self);
        match std::mem::replace(&mut *held, Held::Nothing) {
            Held::Door { state, sync, windows, rounds } => {
                tracing::info!(rounds, "the role takes over the folder a round with no window opened");
                *held = Held::Role { sync: sync.clone() };
                Given::Ready(state, sync, windows)
            }
            Held::Nothing => match open() {
                Opening::Ready(state) => {
                    let windows: Windows = Arc::new(OnceLock::new());
                    let sync = engine_for(windows.clone(), &state, Takes::Notes);
                    *held = Held::Role { sync: sync.clone() };
                    Given::Ready(state, sync, windows)
                }
                Opening::InUse(root) => Given::InUse(root),
                Opening::Failed(error) => Given::Failed(error),
            },
            // A second role in one process does not happen; it is not let have the folder.
            Held::Role { sync } => {
                *held = Held::Role { sync };
                Given::Failed(glaukopis_core::Error::invalid("the folder is the role's already"))
            }
        }
    }
}

/// Puts what another app handed over into the inbox of the folder at
/// `root`: `said` is the JSON of `Shared`, and its files lie in `from`.
/// Gives `Put` as JSON, or `{"problem": "<the error's words>"}`. It opens
/// nothing and claims nothing: the inbox is written by whoever collects,
/// with no application running, as the helper of Firefox writes it.
#[cfg_attr(not(target_os = "android"), allow(dead_code))]
pub fn shared(root: &Path, language: &str, said: &str, from: &Path) -> String {
    // Where the role runs, the core speaks as the role set it.
    if !FOLDER.role_runs() {
        speak(language)(Some(&DataDir::at(root)));
    }
    let answer = serde_json::from_str::<Shared>(said)
        .map_err(|error| glaukopis_core::Error::invalid(error.to_string()))
        .and_then(|shared| shared::put(&Inbox::in_data_folder(root), shared, from));
    match answer {
        Ok(put) => serde_json::to_string(&put).unwrap_or_else(|_| serde_json::to_string(&Put::default()).unwrap()),
        Err(error) => {
            tracing::warn!(%error, "what another app handed over was not put into the inbox");
            serde_json::json!({ "problem": error.to_string() }).to_string()
        }
    }
}

/// The names Java finds (`Door.kt`), for Android alone. Each reads its
/// strings and calls the function above, within `catch_unwind`: a panic is
/// a problem said, or a round to be tried again, and never crosses into
/// Java.
#[cfg(target_os = "android")]
mod java {
    use std::panic::{AssertUnwindSafe, catch_unwind};
    use std::path::Path;

    use jni::JNIEnv;
    use jni::objects::{JClass, JString};
    use jni::sys::{jint, jstring};

    fn read(env: &mut JNIEnv, said: &JString) -> String {
        env.get_string(said).map(String::from).unwrap_or_default()
    }

    #[unsafe(no_mangle)]
    pub extern "system" fn Java_org_glaukopis_app_Door_shared(
        mut env: JNIEnv,
        _class: JClass,
        root: JString,
        language: JString,
        said: JString,
        from: JString,
    ) -> jstring {
        let (root, language, said, from) =
            (read(&mut env, &root), read(&mut env, &language), read(&mut env, &said), read(&mut env, &from));
        let answer =
            catch_unwind(AssertUnwindSafe(|| super::shared(Path::new(&root), &language, &said, Path::new(&from))))
                .unwrap_or_else(|_| serde_json::json!({ "problem": "" }).to_string());
        env.new_string(answer).map(|s| s.into_raw()).unwrap_or(std::ptr::null_mut())
    }

    #[unsafe(no_mangle)]
    pub extern "system" fn Java_org_glaukopis_app_Door_round(
        mut env: JNIEnv,
        _class: JClass,
        root: JString,
        language: JString,
    ) -> jint {
        let (root, language) = (read(&mut env, &root), read(&mut env, &language));
        catch_unwind(AssertUnwindSafe(|| super::FOLDER.round(Path::new(&root), &language)))
            .unwrap_or(super::Round::Again)
            .code()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use glaukopis_core::sync::kept::Joined;

    /// A folder joined by hand to a home on a server where nothing answers.
    fn joined_to_nowhere(root: &Path) {
        let data = DataDir::open(root).unwrap();
        let joined = Joined {
            server: "http://127.0.0.1:9".into(),
            home: "home".into(),
            device: "phone".into(),
            name: "A phone".into(),
            takes: Takes::Notes,
        };
        Kept::new(&data).join(&joined, "token").unwrap();
    }

    fn claimable(root: &Path) -> bool {
        DataDir::open(root).unwrap().claim().unwrap().is_some()
    }

    fn begun(folder: &Folder, root: &Path) -> Begun {
        match folder.begin(root, "en") {
            Begin::Round(begun) => begun,
            Begin::Done => panic!("done"),
            Begin::Again => panic!("again"),
        }
    }

    #[test]
    fn a_device_in_no_home_is_done_at_once_and_its_folder_is_not_even_made() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("data");
        assert_eq!(Folder::new().round(&root, "en"), Round::Done);
        assert!(!root.exists(), "nothing is made, not even the claim's file");
    }

    #[test]
    fn a_server_not_reached_is_tried_again_and_the_folder_is_let_go_after_the_round() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("data");
        joined_to_nowhere(&root);
        let folder = Folder::new();
        assert_eq!(folder.round(&root, "en"), Round::Again);
        assert!(claimable(&root), "the claim went with the round");
        assert!(!folder.role_runs());
    }

    #[test]
    fn the_role_takes_over_a_round_under_way_with_its_engine_and_its_claim() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("data");
        joined_to_nowhere(&root);
        let folder = Folder::new();
        let round = begun(&folder, &root);
        assert!(!claimable(&root), "the door holds the folder");
        let Given::Ready(state, sync, _) = folder.for_role(|| panic!("the folder is opened anew")) else {
            panic!("the role is not given the folder");
        };
        assert!(Arc::ptr_eq(&sync, &round.sync), "the same engine");
        folder.end(round);
        assert!(folder.role_runs(), "the round's end leaves the role's as it is");
        assert!(!claimable(&root), "the role holds the folder, and it is not claimed a second time");
        drop(state);
        assert!(claimable(&root));
    }

    #[test]
    fn two_rounds_at_once_let_the_folder_go_only_when_both_have_ended() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("data");
        joined_to_nowhere(&root);
        let folder = Folder::new();
        let (first, second) = (begun(&folder, &root), begun(&folder, &root));
        assert!(Arc::ptr_eq(&first.sync, &second.sync), "one engine for both");
        folder.end(first);
        assert!(!claimable(&root), "the second still holds it");
        folder.end(second);
        assert!(claimable(&root));
    }

    #[test]
    fn a_role_with_nothing_opened_opens_the_folder_itself() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("data");
        let folder = Folder::new();
        let opened = || starting::opening(root.clone(), false, None, |_| {});
        assert!(matches!(folder.for_role(opened), Given::Ready(..)));
        assert!(folder.role_runs());
        // A round now goes by the role's engine and opens nothing.
        joined_to_nowhere(&root);
        let round = begun(&folder, &root);
        assert!(!round.of_door);
    }

    #[test]
    fn a_thing_shared_is_put_into_the_inbox_of_a_folder_no_application_opened() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("data");
        let from = tmp.path().join("sharing");
        std::fs::create_dir_all(&from).unwrap();
        let put: serde_json::Value = serde_json::from_str(&shared(&root, "en", r#"{"text": "Words"}"#, &from)).unwrap();
        let id = put["id"].as_str().expect("an id");
        assert_eq!(Inbox::in_data_folder(&root).ids(), [id]);
    }

    #[test]
    fn what_put_refuses_comes_back_as_a_problem() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("data");
        let nothing: serde_json::Value =
            serde_json::from_str(&shared(&root, "en", r#"{"text": " "}"#, tmp.path())).unwrap();
        assert!(nothing["problem"].as_str().is_some_and(|p| !p.is_empty()), "{nothing}");
        let unread: serde_json::Value = serde_json::from_str(&shared(&root, "en", "not json", tmp.path())).unwrap();
        assert!(unread["problem"].is_string());
    }
}
