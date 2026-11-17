# What the core says of notes brought into the notebook from other programs, in English.
# See locales/README.md.

## Looking at what is to be read.

# $name is the folder or the file chosen.
core-notes-nothing-found = «{ $name }» non contiene note che Glaukopis legge: né file di Markdown o di testo (.md, .markdown, .txt), né un'esportazione di Evernote (.enex), né note di Google Keep (.json), né una sezione di OneNote (.one).
# $message says why Pandoc cannot be used.
core-notes-without-pandoc = Le note scritte in Markdown sono lette da Pandoc, e ora non si possono leggere: { $message }
core-notes-evernote-links = L'esportazione di Evernote non dice a quale nota porti un collegamento: le parole di quei collegamenti si conservano, i collegamenti fra le note no.
# $count is how many pages hold handwriting or drawings.
core-notes-onenote-ink = { $count ->
    [one] Una pagina contiene scrittura a mano o disegni, che non si leggono.
    [many] { $count } pagine contengono scrittura a mano o disegni, che non si leggono.
   *[other] { $count } pagine contengono scrittura a mano o disegni, che non si leggono.
}

## Reading.

core-notes-stopped = La lettura delle note è stata interrotta.
# $name is the note's name, or its file; $message says what went wrong.
core-notes-unreadable = La nota «{ $name }» non si è potuta leggere: { $message }
# $note is the note's name; $name the picture or file; $why one of the reasons below, or another.
core-notes-picture-left-out = Nella nota «{ $note }» si è lasciato fuori «{ $name }»: { $why }.
core-notes-file-unreadable = il file non si è potuto leggere
core-notes-picture-outside = si trova fuori dalla cartella che si legge, e si aggiungono solo i file di quella cartella e delle sue sottocartelle
core-notes-picture-not-found = non è fra ciò che si legge
core-notes-too-large = «{ $file }» è più grande di ciò che Glaukopis legge, ed è lasciato fuori.
core-notes-evernote-unreadable = Non si è potuto leggere «{ $file }» come esportazione di Evernote: { $message }
# $file is a file of OneNote, or a page of one; $message says what went wrong.
core-notes-onenote-unreadable = Non si è potuto leggere «{ $file }» come file di OneNote: { $message }
core-notes-onenote-broke = La lettura di «{ $file }» come file di OneNote si è interrotta.
core-notes-onenote-not-started = I file di OneNote non si sono potuti leggere, perché non si è potuto avviare un processo per leggerli: { $message }
# $why is one of the two reasons below, or another.
core-notes-onenote-given-up = La lettura dei file di OneNote è stata abbandonata: { $why }
core-notes-onenote-time = ha richiesto troppo tempo
core-notes-onenote-memory = ha usato più memoria di quella consentita
core-notes-onenote-not-stored = OneNote non l'aveva conservato nel file
core-notes-encrypted = { $count ->
    [one] { $count } nota contiene testo che Evernote tiene cifrato. Quel testo è stato lasciato fuori.
    [many] { $count } note contengono testo che Evernote tiene cifrato. Quel testo è stato lasciato fuori.
   *[other] { $count } note contengono testo che Evernote tiene cifrato. Quel testo è stato lasciato fuori.
}
