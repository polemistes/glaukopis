# What the core says of notes brought into the notebook from other programs, in English.
# See locales/README.md.

## Looking at what is to be read.

# $name is the folder or the file chosen.
core-notes-nothing-found = «{ $name }» inneheld ingen notat som Glaukopis les: ingen filer med Markdown eller tekst (.md, .markdown, .txt), ingen eksport frå Evernote (.enex), ingen notat frå Google Keep (.json) og ingen inndeling frå OneNote (.one).
# $message says why Pandoc cannot be used.
core-notes-without-pandoc = Notata som er skrivne i Markdown, blir lesne av Pandoc, og kan ikkje lesast no: { $message }
core-notes-evernote-links = Eksporten frå Evernote seier ikkje kva for eit notat ei lenkje fører til: orda i slike lenkjer blir tekne vare på, men ikkje lenkjene mellom notata.
# $count is how many pages hold handwriting or drawings.
core-notes-onenote-ink = { $count ->
    [one] Éi side inneheld handskrift eller teikningar, som ikkje blir lesne.
   *[other] { $count } sider inneheld handskrift eller teikningar, som ikkje blir lesne.
}

## Reading.

core-notes-stopped = Lesinga av notata vart stoppa.
# $name is the note's name, or its file; $message says what went wrong.
core-notes-unreadable = Notatet «{ $name }» kunne ikkje lesast: { $message }
# $note is the note's name; $name the picture or file; $why one of the reasons below, or another.
core-notes-picture-left-out = I notatet «{ $note }» er «{ $name }» utelate: { $why }.
core-notes-file-unreadable = fila kunne ikkje lesast
core-notes-picture-outside = det ligg utanfor mappa som blir lesen, og berre filer i mappa eller i undermapper blir henta inn
core-notes-picture-not-found = det vart ikkje funne i det som blir lese
core-notes-too-large = «{ $file }» er større enn Glaukopis les, og vart utelate.
core-notes-evernote-unreadable = «{ $file }» kunne ikkje lesast som ein eksport frå Evernote: { $message }
# $file is a file of OneNote, or a page of one; $message says what went wrong.
core-notes-onenote-unreadable = «{ $file }» kunne ikkje lesast som ei fil frå OneNote: { $message }
core-notes-onenote-broke = «{ $file }» kunne ikkje lesast som ei fil frå OneNote: lesinga braut av.
core-notes-onenote-not-started = Filene frå OneNote kunne ikkje lesast, fordi ingen prosess kunne startast for å lese dei i: { $message }
# $why is one of the two reasons below, or another.
core-notes-onenote-given-up = Lesinga av filene frå OneNote vart gitt opp: { $why }
core-notes-onenote-time = det tok for lang tid
core-notes-onenote-memory = det tok meir minne enn det får
core-notes-onenote-not-stored = OneNote hadde ikkje lagra det i fila
core-notes-encrypted = { $count ->
    [one] { $count } notat inneheld tekst som Evernote held kryptert. Den teksten vart utelate.
   *[other] { $count } notat inneheld tekst som Evernote held kryptert. Den teksten vart utelate.
}
