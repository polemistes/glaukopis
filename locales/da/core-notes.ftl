# What the core says of notes brought into the notebook from other programs, in English.
# See locales/README.md.

## Looking at what is to be read.

# $name is the folder or the file chosen.
core-notes-nothing-found = »{ $name }« indeholder ingen notater, som Glaukopis læser: ingen filer med Markdown eller tekst (.md, .markdown, .txt), ingen eksport fra Evernote (.enex), ingen notater fra Google Keep (.json) og ingen sektion fra OneNote (.one).
# $message says why Pandoc cannot be used.
core-notes-without-pandoc = Notater skrevet i Markdown læses af Pandoc og kan ikke læses nu: { $message }
core-notes-evernote-links = Evernotes eksport siger ikke, hvilket notat et link fører til: ordene i sådanne links bevares, men ikke linkene mellem notaterne.
# $count is how many pages hold handwriting or drawings.
core-notes-onenote-ink = { $count ->
    [one] Én side indeholder håndskrift eller tegninger, som ikke læses.
   *[other] { $count } sider indeholder håndskrift eller tegninger, som ikke læses.
}

## Reading.

core-notes-stopped = Læsningen af notaterne blev stoppet.
# $name is the note's name, or its file; $message says what went wrong.
core-notes-unreadable = Notatet »{ $name }« kunne ikke læses: { $message }
# $note is the note's name; $name the picture or file; $why one of the reasons below, or another.
core-notes-picture-left-out = I notatet »{ $note }« er »{ $name }« udeladt: { $why }.
core-notes-file-unreadable = filen kunne ikke læses
core-notes-picture-outside = den ligger uden for den mappe, der læses, og kun filerne i den mappe og under den hentes ind
core-notes-picture-not-found = den blev ikke fundet i det, der læses
core-notes-too-large = »{ $file }« er større, end Glaukopis læser, og er udeladt.
core-notes-evernote-unreadable = »{ $file }« kunne ikke læses som en eksport fra Evernote: { $message }
# $file is a file of OneNote, or a page of one; $message says what went wrong.
core-notes-onenote-unreadable = »{ $file }« kunne ikke læses som en fil fra OneNote: { $message }
core-notes-onenote-broke = »{ $file }« kunne ikke læses som en fil fra OneNote: læsningen af den blev afbrudt.
core-notes-onenote-not-started = OneNotes filer kunne ikke læses, da der ikke kunne startes nogen proces til at læse dem ind: { $message }
# $why is one of the two reasons below, or another.
core-notes-onenote-given-up = Læsningen af OneNotes filer blev opgivet: { $why }
core-notes-onenote-time = den tog for lang tid
core-notes-onenote-memory = den brugte mere hukommelse, end den må
core-notes-onenote-not-stored = OneNote havde ikke gemt den i filen
core-notes-encrypted = { $count ->
    [one] { $count } notat indeholder tekst, som Evernote opbevarer krypteret. Den tekst er udeladt.
   *[other] { $count } notater indeholder tekst, som Evernote opbevarer krypteret. Den tekst er udeladt.
}
