The collaboration server of Glaukopis
=====================================

Glaukopis works on its own. This server is needed only when several people
are to write in the same project at the same time, and only on the one
computer that is to be the server. It is one program with one folder of
data, and needs no installation. The whole guide is server.md, beside this
file.

Windows
-------

Unzip the folder where the program is to stay, open PowerShell in it, and
start the server with a folder for its data and a password, which is asked
of those who share projects through it:

    .\glaukopis-server.exe --listen 0.0.0.0:8375 --data C:\GlaukopisServer --password "something long"

Windows asks once whether the program may be reached on the network: allow
it on private networks. In Glaukopis, the address of the server is then
http://<the address of this computer>:8375. What is sent is not encrypted:
on the internet, put a proxy that encrypts in front of it (server.md says
how). To start it with the computer, make a task of it in the Task
Scheduler, run at startup whether anyone is logged in or not.

macOS
-----

Unzip the folder where the program is to stay. The program is not signed:
before it is started the first time, open Terminal in the folder and take
away the mark macOS puts on what is downloaded:

    xattr -d com.apple.quarantine glaukopis-server

Then start it, with a folder for its data and a password:

    ./glaukopis-server --listen 0.0.0.0:8375 --data ~/GlaukopisServer --password "something long"

macOS asks once whether the program may accept connections: allow it. In
Glaukopis, the address of the server is then
http://<the address of this Mac>:8375. On the internet, put a proxy that
encrypts in front of it (server.md says how).

Every option
------------

    glaukopis-server --help

The settings can be given in the environment instead, as server.md lists.
Stop the server with Ctrl+C.
