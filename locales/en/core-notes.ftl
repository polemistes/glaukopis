# What the core says of notes brought into the notebook from other programs, in English.
# See locales/README.md.

## Looking at what is to be read.

# $name is the folder or the file chosen.
core-notes-nothing-found = “{ $name }” holds no notes that Glaukopis reads: no files of Markdown or text (.md, .markdown, .txt), no export of Evernote (.enex), and no notes of Google Keep (.json).
# $message says why Pandoc cannot be used.
core-notes-without-pandoc = The notes written in Markdown are read by Pandoc, and cannot be read now: { $message }
core-notes-evernote-links = Evernote’s export does not say which note a link leads to: the words of such links are kept, the links between the notes are not.
core-notes-onenote = OneNote’s own files are not read. OneNote can export a page or a section as a Word file, which Glaukopis brings in as a document.

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
core-notes-encrypted = { $count ->
    [one] { $count } note holds text that Evernote keeps encrypted. That text was left out.
   *[other] { $count } notes hold text that Evernote keeps encrypted. That text was left out.
}
