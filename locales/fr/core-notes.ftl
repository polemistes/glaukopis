# What the core says of notes brought into the notebook from other programs, in English.
# See locales/README.md.

## Looking at what is to be read.

# $name is the folder or the file chosen.
core-notes-nothing-found = « { $name } » ne contient aucune note que Glaukopis lise : ni fichiers Markdown ou texte (.md, .markdown, .txt), ni export d’Evernote (.enex), ni notes de Google Keep (.json), ni section de OneNote (.one).
# $message says why Pandoc cannot be used.
core-notes-without-pandoc = Les notes écrites en Markdown sont lues par Pandoc, qui ne peut pas servir en ce moment : { $message }
core-notes-evernote-links = L’export d’Evernote ne dit pas vers quelle note mène un lien : les mots de ces liens sont gardés, mais pas les liens entre les notes.
# $count is how many pages hold handwriting or drawings.
core-notes-onenote-ink = { $count ->
    [one] Une page contient de l’écriture manuscrite ou des dessins, qui ne sont pas lus.
    [many] { $count } pages contiennent de l’écriture manuscrite ou des dessins, qui ne sont pas lus.
   *[other] { $count } pages contiennent de l’écriture manuscrite ou des dessins, qui ne sont pas lus.
}

## Reading.

core-notes-stopped = La lecture des notes a été interrompue.
# $name is the note's name, or its file; $message says what went wrong.
core-notes-unreadable = La note « { $name } » n’a pas pu être lue : { $message }
# $note is the note's name; $name the picture or file; $why one of the reasons below, or another.
core-notes-picture-left-out = Dans la note « { $note } », « { $name } » est laissé de côté : { $why }.
core-notes-file-unreadable = le fichier n’a pas pu être lu
core-notes-picture-outside = il se trouve en dehors du dossier lu, et seuls les fichiers de ce dossier et de ses sous-dossiers sont recueillis
core-notes-picture-not-found = il n’a pas été trouvé dans ce qui est lu
core-notes-too-large = « { $file } » est plus grand que ce que Glaukopis lit, et il est laissé de côté.
core-notes-evernote-unreadable = « { $file } » n’a pas pu être lu comme un export d’Evernote : { $message }
# $file is a file of OneNote, or a page of one; $message says what went wrong.
core-notes-onenote-unreadable = « { $file } » n’a pas pu être lu comme un fichier OneNote : { $message }
core-notes-onenote-broke = « { $file } » n’a pas pu être lu comme un fichier OneNote : sa lecture s’est interrompue brusquement.
core-notes-onenote-not-started = Les fichiers OneNote n’ont pas pu être lus, car aucun processus n’a pu être lancé pour les lire : { $message }
# $why is one of the two reasons below, or another.
core-notes-onenote-given-up = La lecture des fichiers OneNote a été abandonnée : { $why }
core-notes-onenote-time = elle a pris trop de temps
core-notes-onenote-memory = elle a pris plus de mémoire qu’elle n’y a droit
core-notes-onenote-not-stored = OneNote ne l’avait pas enregistré dans le fichier
core-notes-encrypted = { $count ->
    [one] { $count } note contient du texte qu’Evernote garde chiffré. Ce texte a été laissé de côté.
    [many] { $count } notes contiennent du texte qu’Evernote garde chiffré. Ce texte a été laissé de côté.
   *[other] { $count } notes contiennent du texte qu’Evernote garde chiffré. Ce texte a été laissé de côté.
}
