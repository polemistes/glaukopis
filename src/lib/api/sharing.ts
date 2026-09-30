/** Sharing projects through a server. Mirrors `src-tauri/src/commands/sharing.rs`. */

import { call } from './backend';
import type { ProjectInfo } from './projects';

export interface ServerInfo {
  /** The address as it is kept. */
  server: string;
  version: string;
  protocol: number;
  passwordRequired: boolean;
  /** Whether what is sent to the server is encrypted on its way. */
  encrypted: boolean;
}

export interface Collaborator {
  id: string;
  name: string;
  /** Seconds since 1970. */
  joined: number;
  lastSeen: number;
  present: boolean;
}

export interface Invitation {
  id: string;
  /** The last four signs of the code, to tell it by. */
  hint: string;
  /** The code: only where the invitation was just made. The server keeps its hash alone. */
  code?: string;
  label: string;
  created: number;
  expires: number | null;
  usesLeft: number | null;
  used: number;
  open: boolean;
}

export interface Room {
  room: string;
  name: string;
  created: number;
  role: 'owner' | 'member';
  /** The collaborator who asks, when it is not the owner. */
  you: string | null;
  ownerPresent: boolean;
  members: Collaborator[];
  /** Told to the owner only. */
  invitations: Invitation[];
}

/**
 * The kinds of refusal that mean that the server has no place for this copy
 * any more: the project was taken off it, or this collaborator was removed.
 */
export const FINAL = ['no-room', 'not-admitted'];

export const sharingServer = (server: string) => call<ServerInfo>('sharing_server', { server });
export const sharingReadInvitation = (text: string) =>
  call<{ server: string | null; code: string | null }>('sharing_read_invitation', { text });
export const sharingPublish = (id: string, server: string, password: string | null) =>
  call<ProjectInfo>('sharing_publish', { id, server, password });
export const sharingJoin = (server: string, code: string, name: string) =>
  call<ProjectInfo>('sharing_join', { server, code, name });
export const sharingTicket = (id: string) => call<{ url: string }>('sharing_ticket', { id });
export const sharingRoom = (id: string) => call<Room>('sharing_room', { id });
export const sharingInvite = (
  id: string,
  label: string,
  uses: number | null,
  hours: number | null,
) => call<Invitation>('sharing_invite', { id, label, uses, hours });
/** Withdraws an invitation, by its id. */
export const sharingWithdraw = (id: string, invitation: string) =>
  call<void>('sharing_withdraw', { id, invitation });
export const sharingRemoveMember = (id: string, member: string) =>
  call<void>('sharing_remove_member', { id, member });
export const sharingRename = (id: string, name: string) =>
  call<void>('sharing_rename', { id, name });
export const sharingEnd = (id: string, anyway: boolean) =>
  call<ProjectInfo>('sharing_end', { id, anyway });
export const sharingForget = (id: string) => call<ProjectInfo>('sharing_forget', { id });
