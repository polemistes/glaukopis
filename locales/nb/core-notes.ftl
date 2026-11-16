# Det kjernen sier om notater hentet inn i notatboken fra andre programmer, på bokmål.
# Se locales/README.md.

## Å se på det som skal leses.

core-notes-nothing-found = «{ $name }» inneholder ingen notater som Glaukopis leser: ingen filer med Markdown eller tekst (.md, .markdown, .txt), ingen eksport fra Evernote (.enex), ingen notater fra Google Keep (.json) og ingen inndeling fra OneNote (.one).
core-notes-without-pandoc = Notatene som er skrevet i Markdown, leses av Pandoc, og kan ikke leses nå: { $message }
core-notes-evernote-links = Eksporten fra Evernote sier ikke hvilket notat en lenke fører til: ordene i slike lenker beholdes, lenkene mellom notatene gjør det ikke.
core-notes-onenote-ink = { $count ->
    [one] Én side inneholder håndskrift eller tegninger, som ikke leses.
   *[other] { $count } sider inneholder håndskrift eller tegninger, som ikke leses.
}

## Å lese.

core-notes-stopped = Lesingen av notatene ble stoppet.
core-notes-unreadable = Notatet «{ $name }» kunne ikke leses: { $message }
core-notes-picture-left-out = I notatet «{ $note }» er «{ $name }» utelatt: { $why }.
core-notes-file-unreadable = filen kunne ikke leses
core-notes-picture-outside = den ligger utenfor mappen som leses, og bare filene i den mappen og under den hentes inn
core-notes-picture-not-found = den ble ikke funnet i det som leses
core-notes-too-large = «{ $file }» er større enn Glaukopis leser, og er utelatt.
core-notes-evernote-unreadable = «{ $file }» kunne ikke leses som en eksport fra Evernote: { $message }
core-notes-onenote-unreadable = «{ $file }» kunne ikke leses som en fil fra OneNote: { $message }
core-notes-onenote-broke = «{ $file }» kunne ikke leses som en fil fra OneNote: lesingen av den brøt av.
core-notes-onenote-not-started = Filene fra OneNote kunne ikke leses, fordi ingen prosess kunne startes for å lese dem i: { $message }
core-notes-onenote-given-up = Lesingen av filene fra OneNote ble gitt opp: { $why }
core-notes-onenote-time = det tok for lang tid
core-notes-onenote-memory = det tok mer minne enn det får
core-notes-onenote-not-stored = OneNote hadde ikke lagret den i filen
core-notes-encrypted = { $count ->
    [one] { $count } notat inneholder tekst som Evernote holder kryptert. Den teksten ble utelatt.
   *[other] { $count } notater inneholder tekst som Evernote holder kryptert. Den teksten ble utelatt.
}
