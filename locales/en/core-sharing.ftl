# What the core says of sharing projects through a server, in English.
# See locales/README.md.

## The address of a server, as it was typed.

core-sharing-enter-address = Enter the address of the server.
core-sharing-no-spaces = The address of a server has no spaces in it.
# The scheme is what was typed before "://".
core-sharing-scheme = A server is reached by http or https, not by “{ $scheme }”.
core-sharing-not-an-address = That does not look like the address of a server.
core-sharing-no-server = There is no Glaukopis server at { $host }. Check the address with the one who gave it to you.
core-sharing-no-answer-behind = { $host } is there, but the server behind it does not answer
core-sharing-newer = The server is newer than this version of Glaukopis, which must be brought up to date to use it.

## What the server refuses, by its kind.

core-sharing-no-room = The project is no longer on the server.
core-sharing-not-admitted = The server does not admit this copy of the project any more.
core-sharing-not-owner = Only the one who shares the project can do this.
core-sharing-bad-code = The code is not valid. It may have been mistyped, used already, withdrawn, or it has expired.
core-sharing-exists = The project is on the server already.
core-sharing-full = The server holds as many projects as it is set to hold.
core-sharing-password-asked = This server asks for a password from those who share projects through it.
core-sharing-password-wrong = The password is not the one the server asks for.
core-sharing-too-many = Too many attempts have been made from here. Try again in ten minutes.
core-sharing-no-file = The server does not have the image.
core-sharing-server-error = { $host } answered with an error.

## What the server says in its own words, which are English, where the
## application knows them.

core-sharing-no-name = The project has no name.
core-sharing-bad-id = The id of the project is not one the server can use.
core-sharing-many-invitations = There are fifty open invitations already; withdraw some.
core-sharing-no-collaborator = There is no such collaborator.
core-sharing-not-whole = The file did not arrive whole.
core-sharing-bad-file-name = A file is named by the SHA-256 of what it holds: 64 characters, each of 0 to 9 or a to f.
core-sharing-not-as-named = What was sent is not what its name says it is: its SHA-256 is another.
# The most is in the server's words: "25 MB".
core-sharing-file-too-large = The file is larger than this server takes: one file may hold { $most } at the most.
core-sharing-project-full = There is not room for the file: the files of one project may hold { $most } together at the most on this server.

## What the server refuses of the synchronization of a writer's own
## devices, which it keeps together as what it calls a home.

core-sharing-no-home = The server no longer keeps what these devices synchronize.
# The texts of a project, the notebook or the library use something this version does not know.
core-sharing-later = Something was written on another device by a later version of Glaukopis. Bring this one up to date to synchronize it.
core-sharing-home-not-admitted = The server no longer lets this device in: it may have been removed from those that are synchronized.
core-sharing-home-full = The server synchronizes the devices of as many writers as it is set to.
core-sharing-many-computers = Sixteen devices are synchronized already, which is the most; remove one first.
core-sharing-many-codes = There are five open codes already; withdraw one.
core-sharing-no-computer = There is no such device among those that are synchronized.
core-sharing-no-computer-name = The device has no name.
core-sharing-bad-kind = The kind of a document is one to sixteen small letters.
core-sharing-bad-document = The id of the document is not one the server can use.
core-sharing-many-documents = The server keeps as many documents for these devices as it may.
core-sharing-not-an-exchange = The server could not read what was sent.
core-sharing-unreadable-change = A change that was sent could not be read.
core-sharing-document-too-large = A project, the notebook or the library would be larger than this server keeps.
# The most is in the server's words: "10 GB".
core-sharing-home-files-full = There is not room for the file: the files that are synchronized may hold { $most } together at the most on this server.

## The pictures of the figures, which are sent and fetched one by one.

core-sharing-picture-too-large = { $host } does not take an image as large as this.
core-sharing-picture-larger = An image is larger than { $host } takes ({ $most } MB at the most), and does not reach the others.
core-sharing-picture-not-sent = An image could not be sent: { $error }.
core-sharing-picture-not-fetched = An image could not be fetched: { $error }.
# The server gave a picture whose content is not what its name says: damaged on the way or where the server keeps it.
core-sharing-picture-not-as-listed = An image { $host } gave is not the one it listed: it was damaged on its way or where it is kept.

## Publishing and joining.

core-sharing-shared-already = The project is shared already.
core-sharing-own-code = The code is for “{ $name }”, which is shared from this computer: you have it already.
