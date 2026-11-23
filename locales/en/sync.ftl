# The synchronization between the writer's devices, computers and phones, in
# English: its section in the settings, and what is told when a project was
# written in on two devices apart. See locales/README.md.

sync-title = Synchronization
sync-about = Your projects, your library, your notebook and your settings, the same on each of your computers, through a server.
# Under the heading on a device that takes the notes only, a phone.
sync-about-notes = Your notebook, the same on this device as on your others, through a server. The references of your library come with it, without their files.

## Before it is on.

sync-server = Server
sync-computer-name = Name of this device
# The choice between the two ways of beginning, as a screen reader names it.
sync-how = How this device begins
sync-how-start = Start here
sync-how-join = Join with a code
sync-password = Password of the server
sync-code = Code
sync-start = Start synchronizing
sync-starting = Starting…
sync-join = Join
sync-joining = Joining…
sync-unreachable = The server could not be reached.

## While it is on.

sync-working = Synchronizing…
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-last = Last synchronized { $when }
sync-never = Not synchronized yet
sync-offline = The server cannot be reached. What is written here is kept, and sent when it can be.
sync-refused = Synchronization has stopped on this device
sync-now = Synchronize now
sync-computers = Devices
sync-this-computer = { $name } (this device)
# $when is how long ago, as "just now", "3 minutes ago" or "12 March".
sync-seen = Last seen { $when }
sync-computers-unread = The server could not be asked which devices there are.
sync-add = Add a device…
# $join is the name of the choice the other device makes, shown in italics; $until is a time of day.
sync-code-hint = Enter the code on the other device, with { $join } under Synchronization in its settings. It can be used once, until { $until }.
sync-code-failed = No code could be made.
sync-rename-title = Rename the device
sync-remove-title = Remove “{ $name }”?
sync-remove-message = It is synchronized no more. What is on it stays there.
# $why is what went wrong, a sentence of its own.
sync-remove-failed = “{ $name }” could not be removed. { $why }
sync-stop = Stop synchronizing on this device
sync-stop-title = Stop synchronizing on this device?
sync-stop-message = What is on this device stays here as it is. What is written on your other devices no longer comes here, and what is written here no longer goes to them.
sync-stop-message-alone = What is on this device stays here as it is. It is the only device that is synchronized, so nothing is left on the server.
# Where the device that stops is the last, and takes the notes only, a phone: what the server keeps of the rest goes too.
sync-stop-message-alone-notes = What is on this device stays here as it is. It is the only device that is synchronized, so nothing is left on the server. Your projects and the files of your library are not on this device: what the server keeps of them is deleted.
sync-stop-confirm = Stop synchronizing
sync-stop-failed = The synchronization could not be stopped

## Written apart.

sync-apart = “{ $name }” was written in on two devices while they were apart.
sync-apart-show = Show the changes
sync-apart-no-history = Its history is not kept, so the changes cannot be shown. The project as it was before is among its earlier versions.
sync-apart-earlier = Earlier versions
# The moment the review of such a project goes from, as the review names it: Since “the devices met”.
sync-apart-moment = the devices met
