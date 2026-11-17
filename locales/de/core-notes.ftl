# What the core says of notes brought into the notebook from other programs, in English.
# See locales/README.md.

## Looking at what is to be read.

# $name is the folder or the file chosen.
core-notes-nothing-found = „{ $name }“ enthält keine Notizen, die Glaukopis liest: keine Dateien mit Markdown oder Text (.md, .markdown, .txt), keinen Export von Evernote (.enex), keine Notizen von Google Keep (.json) und keinen Abschnitt von OneNote (.one).
# $message says why Pandoc cannot be used.
core-notes-without-pandoc = Die in Markdown geschriebenen Notizen werden von Pandoc gelesen und können jetzt nicht gelesen werden: { $message }
core-notes-evernote-links = Der Export von Evernote sagt nicht, zu welcher Notiz ein Link führt: die Worte solcher Links bleiben erhalten, die Links zwischen den Notizen nicht.
# $count is how many pages hold handwriting or drawings.
core-notes-onenote-ink = { $count ->
    [one] Eine Seite enthält Handschrift oder Zeichnungen, die nicht gelesen werden.
   *[other] { $count } Seiten enthalten Handschrift oder Zeichnungen, die nicht gelesen werden.
}

## Reading.

core-notes-stopped = Das Lesen der Notizen wurde angehalten.
# $name is the note's name, or its file; $message says what went wrong.
core-notes-unreadable = Die Notiz „{ $name }“ konnte nicht gelesen werden: { $message }
# $note is the note's name; $name the picture or file; $why one of the reasons below, or another.
core-notes-picture-left-out = In der Notiz „{ $note }“ wird „{ $name }“ weggelassen: { $why }.
core-notes-file-unreadable = die Datei konnte nicht gelesen werden
core-notes-picture-outside = sie liegt außerhalb des Ordners, der gelesen wird, und nur die Dateien in diesem Ordner und darunter werden übernommen
core-notes-picture-not-found = sie wurde in dem, was gelesen wird, nicht gefunden
core-notes-too-large = „{ $file }“ ist größer, als Glaukopis liest, und wird weggelassen.
core-notes-evernote-unreadable = „{ $file }“ konnte nicht als Export von Evernote gelesen werden: { $message }
# $file is a file of OneNote, or a page of one; $message says what went wrong.
core-notes-onenote-unreadable = „{ $file }“ konnte nicht als Datei von OneNote gelesen werden: { $message }
core-notes-onenote-broke = „{ $file }“ konnte nicht als Datei von OneNote gelesen werden: das Lesen wurde abgebrochen.
core-notes-onenote-not-started = Die Dateien von OneNote konnten nicht gelesen werden, da kein Prozess gestartet werden konnte, der sie liest: { $message }
# $why is one of the two reasons below, or another.
core-notes-onenote-given-up = Das Lesen der Dateien von OneNote wurde aufgegeben: { $why }
core-notes-onenote-time = es dauerte zu lange
core-notes-onenote-memory = es brauchte mehr Speicher, als es darf
core-notes-onenote-not-stored = OneNote hatte es nicht in der Datei gespeichert
core-notes-encrypted = { $count ->
    [one] { $count } Notiz enthält Text, den Evernote verschlüsselt hält. Dieser Text wurde weggelassen.
   *[other] { $count } Notizen enthalten Text, den Evernote verschlüsselt hält. Dieser Text wurde weggelassen.
}
