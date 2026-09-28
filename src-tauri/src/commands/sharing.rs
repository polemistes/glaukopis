//! Commands for sharing projects through a collaboration server.
//!
//! The token of a project stays on this side: the interface is given tickets
//! to open its socket with, and nothing that lasts.

use serde::Serialize;
use tauri::State;

use glaukopis_core::Error;
use glaukopis_core::i18n::tr;
use glaukopis_core::projects::{ProjectInfo, Sharing};
use glaukopis_core::sharing::{self, Invitation, Remote, Room, ServerInfo};

use crate::error::CommandResult;
use crate::state::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadInvitation {
    pub server: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Ticket {
    /// The address to open the socket at. It is good once, and for a minute.
    pub url: String,
}

/// Whether the refusal means that this copy has no place on the server any more.
fn is_final(error: &Error) -> bool {
    matches!(error.kind(), "no-room" | "not-admitted")
}

/// Asks what is at an address, which may be as it was typed.
#[tauri::command(async)]
pub fn sharing_server(state: State<'_, AppState>, server: String) -> CommandResult<ServerInfo> {
    let client = state.client();
    Ok(Remote::new(&client, &server)?.info()?)
}

#[tauri::command(async)]
pub fn sharing_read_invitation(text: String) -> ReadInvitation {
    let (server, code) = sharing::read_invitation(&text);
    ReadInvitation { server, code }
}

/// Puts a project on a server. The one who does is its owner there.
#[tauri::command(async)]
pub fn sharing_publish(
    state: State<'_, AppState>,
    id: String,
    server: String,
    password: Option<String>,
) -> CommandResult<ProjectInfo> {
    let info = state.projects.info(&id)?;
    if info.sharing.is_some() {
        return Err(Error::invalid(tr!("core-sharing-shared-already")).into());
    }
    let client = state.client();
    let remote = Remote::new(&client, &server)?;
    remote.info()?;
    let token = remote.publish(&id, &info.name, password.as_deref())?;
    let sharing = Sharing { server: remote.server().to_owned(), room: id.clone(), owner: true, member: None };
    Ok(state.projects.share(&id, sharing, &token)?)
}

/// Joins a project by a code. The project is made here if it is not here
/// already; what it holds comes when it is opened.
#[tauri::command(async)]
pub fn sharing_join(
    state: State<'_, AppState>,
    server: String,
    code: String,
    name: String,
) -> CommandResult<ProjectInfo> {
    let client = state.client();
    let remote = Remote::new(&client, &server)?;
    remote.info()?;
    if let (_, Some(read)) = sharing::read_invitation(&code)
        && let Some(here) = state.projects.list()?.into_iter().find(|p| {
            p.sharing.as_ref().is_some_and(|s| s.owner && s.server == remote.server()) && code_is_of(&state, p, &read)
        })
    {
        // A kind of its own, by which the interface shows it under the code.
        return Err(
            Error::Refused { kind: "own-code", message: tr!("core-sharing-own-code", name = &here.name) }.into()
        );
    }
    let joined = remote.join(&code, &name)?;
    let sharing = Sharing {
        server: remote.server().to_owned(),
        room: joined.room.clone(),
        owner: false,
        member: Some(joined.member.clone()),
    };
    // One who was here before and comes back by a new code keeps what they have.
    if state.projects.info(&joined.room).is_err() {
        state.projects.create_with_id(&joined.room, &joined.name)?;
    }
    Ok(state.projects.share(&joined.room, sharing, &joined.token)?)
}

/// Whether a code is one of those the owner of a project here has made. Asked
/// before joining, so that no one joins their own project as a stranger.
fn code_is_of(state: &AppState, project: &ProjectInfo, code: &str) -> bool {
    let Ok((sharing, token)) = state.projects.shared(&project.id) else { return false };
    let client = state.client();
    Remote::new(&client, &sharing.server)
        .and_then(|remote| remote.room(&sharing.room, &token))
        .is_ok_and(|room| room.invitations.iter().any(|i| i.code == code))
}

/// A ticket for the socket of a project. A refusal of the kinds `no-room` and
/// `not-admitted` means that the server has no place for this copy any more.
#[tauri::command(async)]
pub fn sharing_ticket(state: State<'_, AppState>, id: String) -> CommandResult<Ticket> {
    let (sharing, token) = state.projects.shared(&id)?;
    let client = state.client();
    let remote = Remote::new(&client, &sharing.server)?;
    let ticket = remote.ticket(&sharing.room, &token)?;
    Ok(Ticket { url: sharing::socket_url(remote.server(), &sharing.room, &ticket) })
}

/// The project as the server knows it: who is there, and the codes that are out.
#[tauri::command(async)]
pub fn sharing_room(state: State<'_, AppState>, id: String) -> CommandResult<Room> {
    let (sharing, token) = state.projects.shared(&id)?;
    let client = state.client();
    Ok(Remote::new(&client, &sharing.server)?.room(&sharing.room, &token)?)
}

#[tauri::command(async)]
pub fn sharing_invite(
    state: State<'_, AppState>,
    id: String,
    label: String,
    uses: Option<u32>,
    hours: Option<u32>,
) -> CommandResult<Invitation> {
    let (sharing, token) = state.projects.shared(&id)?;
    let client = state.client();
    Ok(Remote::new(&client, &sharing.server)?.invite(&sharing.room, &token, &label, uses, hours)?)
}

#[tauri::command(async)]
pub fn sharing_withdraw(state: State<'_, AppState>, id: String, code: String) -> CommandResult<()> {
    let (sharing, token) = state.projects.shared(&id)?;
    let client = state.client();
    Ok(Remote::new(&client, &sharing.server)?.withdraw(&sharing.room, &token, &code)?)
}

#[tauri::command(async)]
pub fn sharing_remove_member(state: State<'_, AppState>, id: String, member: String) -> CommandResult<()> {
    let (sharing, token) = state.projects.shared(&id)?;
    let client = state.client();
    Ok(Remote::new(&client, &sharing.server)?.remove_member(&sharing.room, &token, &member)?)
}

/// Tells the server what the project is called now. Those who join are told this name.
#[tauri::command(async)]
pub fn sharing_rename(state: State<'_, AppState>, id: String, name: String) -> CommandResult<()> {
    let (sharing, token) = state.projects.shared(&id)?;
    if !sharing.owner {
        return Ok(());
    }
    let client = state.client();
    Remote::new(&client, &sharing.server)?.rename(&sharing.room, &token, &name)?;
    Ok(())
}

/// Ends the sharing of a project: the owner takes it off the server, a
/// collaborator leaves. The project stays on this computer with all it holds.
///
/// With `anyway`, the sharing is ended here even if the server cannot be told.
#[tauri::command(async)]
pub fn sharing_end(state: State<'_, AppState>, id: String, anyway: bool) -> CommandResult<ProjectInfo> {
    let (sharing, token) = state.projects.shared(&id)?;
    let client = state.client();
    let told = Remote::new(&client, &sharing.server).and_then(|remote| match (&sharing.owner, &sharing.member) {
        (true, _) => remote.remove(&sharing.room, &token),
        (false, Some(member)) => remote.remove_member(&sharing.room, &token, member),
        (false, None) => Ok(()),
    });
    match told {
        Ok(()) => {}
        // The server has forgotten the project, or this copy: there is nothing to tell it.
        Err(e) if is_final(&e) => {}
        Err(e) if anyway => tracing::warn!(%e, "the server could not be told that the sharing ended"),
        Err(e) => return Err(e.into()),
    }
    Ok(state.projects.unshare(&id)?)
}

/// Makes the project this user's alone, without telling the server: for when
/// the server has said that this copy has no place there any more.
#[tauri::command(async)]
pub fn sharing_forget(state: State<'_, AppState>, id: String) -> CommandResult<ProjectInfo> {
    Ok(state.projects.unshare(&id)?)
}
