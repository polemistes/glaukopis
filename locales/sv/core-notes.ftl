# What the core says of notes brought into the notebook from other programs, in English.
# See locales/README.md.

## Looking at what is to be read.

# $name is the folder or the file chosen.
core-notes-nothing-found = ”{ $name }” innehåller inga anteckningar som Glaukopis läser: inga filer med Markdown eller text (.md, .markdown, .txt), ingen export från Evernote (.enex), inga anteckningar från Google Keep (.json) och inget avsnitt från OneNote (.one).
# $message says why Pandoc cannot be used.
core-notes-without-pandoc = Anteckningar skrivna i Markdown läses av Pandoc, och kan inte läsas nu: { $message }
core-notes-evernote-links = Evernotes export säger inte vilken anteckning en länk leder till: orden i sådana länkar behålls, men länkarna mellan anteckningarna behålls inte.
# $count is how many pages hold handwriting or drawings.
core-notes-onenote-ink = { $count ->
    [one] En sida innehåller handskrift eller ritningar, som inte läses.
   *[other] { $count } sidor innehåller handskrift eller ritningar, som inte läses.
}

## Reading.

core-notes-stopped = Läsningen av anteckningarna stoppades.
# $name is the note's name, or its file; $message says what went wrong.
core-notes-unreadable = Anteckningen ”{ $name }” kunde inte läsas: { $message }
# $note is the note's name; $name the picture or file; $why one of the reasons below, or another.
core-notes-picture-left-out = I anteckningen ”{ $note }” utelämnas ”{ $name }”: { $why }.
core-notes-file-unreadable = filen kunde inte läsas
core-notes-picture-outside = den ligger utanför mappen som läses, och bara filerna i den mappen och under den hämtas in
core-notes-picture-not-found = den hittades inte i det som läses
core-notes-too-large = ”{ $file }” är större än vad Glaukopis läser, och utelämnas.
core-notes-evernote-unreadable = ”{ $file }” kunde inte läsas som en export från Evernote: { $message }
# $file is a file of OneNote, or a page of one; $message says what went wrong.
core-notes-onenote-unreadable = ”{ $file }” kunde inte läsas som en fil från OneNote: { $message }
core-notes-onenote-broke = ”{ $file }” kunde inte läsas som en fil från OneNote: läsningen av den avbröts.
core-notes-onenote-not-started = OneNotes filer kunde inte läsas, eftersom ingen process kunde startas för att läsa dem i: { $message }
# $why is one of the two reasons below, or another.
core-notes-onenote-given-up = Läsningen av OneNotes filer gavs upp: { $why }
core-notes-onenote-time = det tog för lång tid
core-notes-onenote-memory = det tog mer minne än det får
core-notes-onenote-not-stored = OneNote hade inte sparat den i filen
core-notes-encrypted = { $count ->
    [one] { $count } anteckning innehåller text som Evernote håller krypterad. Den texten utelämnades.
   *[other] { $count } anteckningar innehåller text som Evernote håller krypterad. Den texten utelämnades.
}
