# Sharing a project through a server, and joining one that is shared.

## Before the project is shared

sharing-share-title = Share this project
sharing-lead = Others can then work on the project with you, at the same time, through a server. It stays on your computer as well, and can be worked on without the server.
sharing-server = Server
sharing-unreachable = The server could not be reached.
sharing-unencrypted = What is sent to this server is not encrypted on its way. Use it on a network you trust.
sharing-password = Password of the server
sharing-password-hint = Asked of those who share projects through it. Those you invite need none.
sharing-your-name = Your name
sharing-your-name-hint = Shown to those you share the project with.
sharing-your-name-placeholder = As the others know you
sharing-share = Share
sharing-sharing = Sharing…
sharing-share-failed = The project could not be shared.

## While it is shared

sharing-shared-title = Shared project
# Under the title: the server the project is shared through.
sharing-through = Through { $server }
sharing-connected = Connected. What is written is with the others at once.
sharing-connecting = Connecting…
sharing-offline = The server cannot be reached. What you write is kept here, and brought along when it can.
sharing-your-name-seen = As the others see you.

## Invitations

sharing-invite = Invite
sharing-code-label = Invitation code
sharing-copy = Copy invitation
sharing-copied-button = Copied
# "join" is the name of the button that joins a shared project, in italics;
# "expires" says for whom and how long the code is good: sharing-for-one and those below it.
sharing-invite-hint = Send it to the one you invite, who chooses { $join } and enters the server and the code. It is { $expires }.
sharing-make-code = Make an invitation code
sharing-make-another = Make another code
sharing-options = Options
sharing-fewer-options = Fewer options
sharing-for = For
sharing-one-person = One person
sharing-several-people = Several people
sharing-good-for = Good for
sharing-a-day = A day
sharing-a-week = A week
sharing-a-month = A month
sharing-until-withdrawn = Until withdrawn
sharing-withdraw = Withdraw
# What is said of a code, in a list with a dot between: "for one person · 6 days left · used once".
sharing-for-several = for several
sharing-for-one = for one person
sharing-for-more = for { $count } more
sharing-hours-left = { $count } h left
sharing-days-left = { $count ->
    [one] { $count } day left
   *[other] { $count } days left
}
sharing-used = { $count ->
    [one] used once
   *[other] used { $count } times
}
# The invitation that is copied, to be sent to the one invited: three lines,
# of which this is the first. "join" is the name of the button that joins a shared project.
sharing-invitation = Join “{ $project }” in Glaukopis: choose “{ $join }” and enter
sharing-invitation-server = Server: { $server }
sharing-invitation-code = Code: { $code }
sharing-copied = The invitation was copied
sharing-copied-detail = Paste it into a message to the one you invite.
sharing-invite-failed = The invitation could not be made
sharing-copy-failed = The invitation could not be copied
sharing-withdraw-failed = The invitation could not be withdrawn

## Who has the project

sharing-who = Who has the project
sharing-list-unreachable = The list is with the server, which cannot be reached.
# The owner, when it is not you; only the first letter is shown, in a circle.
sharing-owner = Owner
sharing-the-owner = The one who shares it
sharing-you = { $name } (you)
sharing-here = Here now
sharing-not-here = Not here now
# "ago" is how long ago it was: "3 hours ago", "yesterday".
sharing-last-here = Last here { $ago }
sharing-remove-member = Remove { $name }
sharing-none-joined = No one has joined yet.
sharing-remove-title = Remove { $name }?
sharing-remove-message = { $name } keeps the project as it is now, and is no longer given what is written after this.
sharing-remove-failed = { $name } could not be removed
# What the others see you called, when you have not given a name.
sharing-name-owner = The owner
sharing-name-member = A collaborator
# The others who have the project open, shown by their initials.
sharing-present = Here now: { $names }
sharing-is-here = { $name } is here

## Ending the sharing

sharing-stop = Stop sharing
sharing-stop-title = Stop sharing this project?
sharing-stop-message = The project is taken off the server. You and everyone you have shared it with keep it as it is now, each on their own.
sharing-stopped = The project is no longer shared
sharing-leave = Leave
sharing-leave-project = Leave the project
sharing-leave-title = Leave this project?
sharing-leave-message = You keep the project as it is now. You are no longer given what the others write, nor they what you write.
sharing-left = You have left the project
sharing-untold-title = The server could not be told
# "error" is what went wrong, as it was told.
sharing-untold-message = { $error } You can end the sharing on this computer all the same; the project then stays on the server until it can be told.
sharing-end-here = End it here
sharing-keep = Keep sharing
sharing-end-failed = The sharing could not be ended

## Joining a shared project

sharing-join-title = Join a shared project
sharing-join-about = With the server and the code you were sent
sharing-code = Code
sharing-your-name-join-hint = Shown to the others in the project.
sharing-join = Join
sharing-joining = Joining…
sharing-failed = That did not work.
