# The collaboration server

Glaukopis works on its own. A server is needed only when several people are to
write in the same project at the same time. This is how to run one.

The server is one program, `glaukopis-server`, with one directory of data. It
keeps the projects that are shared through it and passes changes between those
who have them open. It has no accounts: whoever shares a project is its owner
there, and admits others by codes.

## What you need

- A computer that those who work together can reach: a small virtual server
  is plenty. The program needs little memory and no database.
- A name for it, such as `glaukopis.example.org`, if it is to be reached over
  the internet.
- A proxy that encrypts what is sent, if it is to be reached over the
  internet. Caddy is used below because it gets and renews its certificate by
  itself. The server itself speaks plain HTTP, and should listen only on the
  computer it runs on.

## On Arch Linux

Install the package `glaukopis-server` (see `packaging/arch`), then:

1. Set a password in `/etc/glaukopis-server.conf`. It is asked of those who
   share projects through the server, not of those they invite. Without it,
   the server does not start behind a proxy, as anyone who could reach it
   could put projects on it; if that is what you want, say so with
   `GLAUKOPIS_SERVER_OPEN=true` there instead.

   ```
   GLAUKOPIS_SERVER_PASSWORD=something long that you make up
   ```

2. Start the server, now and whenever the computer starts:

   ```
   systemctl enable --now glaukopis-server
   ```

3. Put Caddy in front of it. Install `caddy`, put this in
   `/etc/caddy/Caddyfile` with the name of your server, and run
   `systemctl enable --now caddy`:

   ```
   glaukopis.example.org {
       reverse_proxy 127.0.0.1:8375
   }
   ```

4. See that it answers. This should show the name and version of the server:

   ```
   curl https://glaukopis.example.org/api/info
   ```

In Glaukopis, the address of the server is then `glaukopis.example.org`.

## Elsewhere

The program is one file and can be run by hand:

```
glaukopis-server --listen 127.0.0.1:8375 --data /var/lib/glaukopis-server --trust-proxy
```

| Option | In the environment | What it does |
| --- | --- | --- |
| `--listen` | `GLAUKOPIS_SERVER_LISTEN` | The address and port to listen on. `127.0.0.1:8375` if not given. |
| `--data` | `GLAUKOPIS_SERVER_DATA` | The directory where the projects are kept. |
| `--password` | `GLAUKOPIS_SERVER_PASSWORD` | Asked of those who share projects through the server. |
| `--password-file` | `GLAUKOPIS_SERVER_PASSWORD_FILE` | A file that holds the password, in place of the above. |
| `--trust-proxy` | `GLAUKOPIS_SERVER_TRUST_PROXY` | Take the addresses of callers from what the proxy says. Use it behind a proxy, and only there. |
| `--max-rooms` | `GLAUKOPIS_SERVER_MAX_ROOMS` | The most projects the server will hold. |
| `--max-file-mb` | `GLAUKOPIS_SERVER_MAX_FILE_MB` | The most one figure of a project may hold, in megabytes. `50` if not given. |
| `--max-room-mb` | `GLAUKOPIS_SERVER_MAX_ROOM_MB` | The most the figures of one project may hold together, in megabytes. `1024` if not given. |
| `--max-project-mb` | `GLAUKOPIS_SERVER_MAX_PROJECT_MB` | The most one project may hold without its figures, in megabytes: its text, maps, references and history. `64` if not given, which is far more than the text of a long book. |
| `--open` | `GLAUKOPIS_SERVER_OPEN` | Let anyone who can reach the server publish projects on it, with no password. Without a password, the server does not start unless this is given, or it listens on this computer only and is not behind a proxy. |

How much is written to the log is set with `GLAUKOPIS_SERVER_LOG`: `warn`,
`info` (the default) or `debug`.

With nginx in place of Caddy, the proxy must pass the upgrade to WebSocket on:

```
location / {
    proxy_pass http://127.0.0.1:8375;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 1h;
    client_max_body_size 50m;
}
```

A proxy may have a limit of its own on how much may be sent to it at a time,
and a figure is sent whole. Caddy has none unless it is given one. nginx
takes 1 MB unless told otherwise, which is less than many figures hold: the
last line above lets through what the server itself takes. If `--max-file-mb`
is changed, change it there as well.

On a network of your own, at home or in a department, the server can be used
without a proxy: start it with `--listen 0.0.0.0:8375` and a password (or
`--open`), and give its address as `http://192.168.1.20:8375`. What is sent is
then not encrypted, and Glaukopis says so to those who use it.

## What is kept, and where

Everything is in the data directory, one directory for each project:

```
rooms/<id of the project>/room.json    the name, the collaborators, the codes
rooms/<id of the project>/state.bin    the project itself
rooms/<id of the project>/state.bak    as it was when it was last opened
rooms/<id of the project>/files/       its figures, each named by the SHA-256 of what it holds
```

A project that is taken off the server by its owner goes with all of this.

To keep a copy of the server, copy the directory. To move the server, move
the directory. Every collaborator also has each project whole on their own
computer, so a server that is lost takes no work with it: the project can be
shared anew from any copy.

## What the server can and cannot see

- The server can read the projects it keeps. They are not encrypted on its
  disk. Run it yourself, or have it run by someone you trust with your
  manuscripts.
- The figures of a project are sent to the server and kept there, so that
  they reach everyone who has the project. They are not encrypted either.
- Tokens, by which the server knows the owner and the collaborators of a
  project, are not kept: only their hashes are. So it is with invitation
  codes: the owner is shown a code once, when it is made, and the server keeps
  nothing of it but its hash, by which one who reads the disk would be years
  guessing the code. A code can be made to admit one person only, and to
  expire. (Codes that an earlier version kept whole are hashed when it first
  starts.)
- Each one's presence, where their cursor is and what they are called, is
  theirs to change: the server does not let one member speak for another.
- Attempts with wrong codes or passwords are counted for each address. After
  ten in ten minutes, the address must wait.
- Files attached to references are not sent to the server. References
  themselves are part of the project, and are.

## When something is wrong

| What is seen | What to look at |
| --- | --- |
| Glaukopis says that there is no Glaukopis server at the address | The address; whether the proxy passes on to the right port. `curl https://…/api/info` shows what answers. |
| Sharing works, but the project is never "connected" | The proxy does not pass WebSocket on. See the lines for nginx above. |
| "Too many attempts have been made from here" for everyone at once | The server is behind a proxy and was started without `--trust-proxy`, so that all callers seem to be the proxy. |
| A figure is refused as too large, or does not reach the others | The limits `--max-file-mb` and `--max-room-mb`. Behind nginx, `client_max_body_size`. |
| Glaukopis says that the server does not take the latest changes | The project would be larger than `--max-project-mb` lets it be. |
| The server does not start | `journalctl -u glaukopis-server` says why. Most often the port is in use, the data directory cannot be written to, or no password is set. |
