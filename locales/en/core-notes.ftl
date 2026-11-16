# What the core says of notes brought into the notebook from other programs, in English.
# See locales/README.md.

## Looking at what is to be read.

# $name is the folder or the file chosen.
core-notes-nothing-found = “{ $name }” holds no notes that Glaukopis reads: no files of Markdown or text (.md, .markdown, .txt), no export of Evernote (.enex), no notes of Google Keep (.json), and no section of OneNote (.one).
# $message says why Pandoc cannot be used.
core-notes-without-pandoc = The notes written in Markdown are read by Pandoc, and cannot be read now: { $message }
core-notes-evernote-links = Evernote’s export does not say which note a link leads to: the words of such links are kept, the links between the notes are not.
# $count is how many pages hold handwriting or drawings.
core-notes-onenote-ink = { $count ->
    [one] One page holds handwriting or drawings, which are not read.
   *[other] { $count } pages hold handwriting or drawings, which are not read.
}

## Reading.

core-notes-stopped = The reading of the notes was stopped.
# $name is the note's name, or its file; $message says what went wrong.
core-notes-unreadable = The note “{ $name }” could not be read: { $message }
# $note is the note's name; $name the picture or file; $why one of the reasons below, or another.
core-notes-picture-left-out = In the note “{ $note }”, “{ $name }” is left out: { $why }.
core-notes-file-unreadable = the file could not be read
core-notes-picture-outside = it lies outside the folder that is read, and only the files in that folder and below are taken in
core-notes-picture-not-found = it was not found in what is read
core-notes-too-large = “{ $file }” is larger than Glaukopis reads, and is left out.
core-notes-evernote-unreadable = “{ $file }” could not be read as an export of Evernote: { $message }
# $file is a file of OneNote, or a page of one; $message says what went wrong.
core-notes-onenote-unreadable = “{ $file }” could not be read as a file of OneNote: { $message }
core-notes-onenote-broke = “{ $file }” could not be read as a file of OneNote: the reading of it broke off.
core-notes-onenote-not-started = OneNote’s files could not be read, since no process could be started to read them in: { $message }
# $why is one of the two reasons below, or another.
core-notes-onenote-given-up = The reading of OneNote’s files was given up: { $why }
core-notes-onenote-time = it took too long
core-notes-onenote-memory = it took more memory than it may
core-notes-onenote-not-stored = OneNote had not stored it in the file
core-notes-encrypted = { $count ->
    [one] { $count } note holds text that Evernote keeps encrypted. That text was left out.
   *[other] { $count } notes hold text that Evernote keeps encrypted. That text was left out.
}
