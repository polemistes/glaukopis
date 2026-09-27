# 0006 — A small relay server with invitation codes

Date: 2026-09-27. Status: accepted.

## Context

The application must work alone. Collaboration is added by entering the address
of a server, and collaborators are admitted by a code sent by the owner.

## Decision

- `glaukopis-server` is one executable with one data directory. It speaks the
  Yjs synchronisation protocol over WebSocket and keeps each project's state
  with `yrs`.
- Publishing a project creates a room and returns an owner token. The owner
  asks the server for invitation codes. A code is short enough to read out,
  admits whoever presents it, and yields a member token kept by the
  collaborator's application. Codes can be single-use or reusable, and can
  expire.
- The owner can list members, withdraw codes and remove members.
- A server may be started with a password that is required to publish projects,
  so that a public server is not open to everyone.
- Tokens are random 256-bit values; only their hashes are stored on the server.
- A token is sent in the `Authorization` header and never in an address, where
  it would end up in the logs of a proxy. Since a browser cannot give headers
  to a WebSocket, the socket is opened with a *ticket*: asked for with the
  token, good for one connection and for one minute. The application asks for
  tickets from its Rust side, so the token never reaches the window.
- Encryption in transit is provided by a reverse proxy in front of the server
  (Caddy, nginx). The server itself speaks plain HTTP. *Changed 2026-09-27:*
  the first version of this decision also let the server be given a
  certificate. That would have added a TLS library and the handling of
  renewals to a program whose virtue is that it is small, for something that
  proxies do well.
- Attempts that are refused (wrong codes, wrong passwords) are counted for
  each address: ten in ten minutes, then the address waits.
- The server writes the state of a room a few seconds after it has changed.
  Should it stop in between, nothing is lost as long as one of those who were
  present comes back: each side tells the other what it lacks.

## Consequences

- The server can read the projects it holds. End-to-end encryption is left for
  later.
- Attachments are not shared in the first version; references are.
- Everyone who is admitted can edit. Reading without editing is left for later.
- The application must keep a project usable when the server cannot be
  reached, and bring along what was written meanwhile when it can again.
