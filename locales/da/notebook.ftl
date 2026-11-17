# The notebook: what is collected outside all projects, as notes (record 0101).

## The place in the row, and the page

notebook-title = Notesbog
notebook-notes = Notater
notebook-note = Notat
notebook-search = Søg i notaterne
notebook-search-clear = Ryd søgningen
notebook-new-note = Nyt notat
notebook-add-files = Tilføj filer…
notebook-add-files-title = Tilføj filer til notesbogen
notebook-empty = Notesbogen er tom
    .text = Saml her, hvad der dukker op, uden for alle projekter: ord, billeder og filer, hver et notat, der husker, hvor det kom fra.
notebook-unreadable = Notesbogen kunne ikke læses
notebook-nothing-found = Ingen notater fundet
notebook-empty-note = Tomt notat
notebook-holds-picture = Et billede
notebook-holds-file = En fil
notebook-holds-passage = Ord, der er hentet ind
notebook-resize-list = Notatlistens bredde
notebook-choose = Vælg et notat, eller lav et nyt
notebook-selected = { $count } notater valgt
notebook-deleted = { $count ->
    [one] Notat slettet
   *[other] { $count } notater slettet
}
notebook-redo = Gentag
notebook-name = Navn
notebook-write = Skriv, eller sæt ind, hvad du har fundet
# What became of a note: "Used in ‹project› · quotation".
notebook-went = Hvad det blev til
notebook-used-in = Brugt i
notebook-went-text = tekst
notebook-went-quotation = citat
notebook-went-figure = billede
notebook-went-reference = reference
notebook-went-file = fil
# How a box is shown: as its surface, or as a list.
notebook-shown-as = Vist som
notebook-surface = Flade
notebook-list = Liste
notebook-close-note = Luk notatet
notebook-resize-column = Boksenes bredde
notebook-resize-note = Notatets bredde
notebook-box-empty = Ingen notater i denne boks
# What the plugin for Firefox handed over has arrived.
notebook-arrived = Føjet til notesbogen
notebook-arrived-from = Føjet til notesbogen: { $title }
notebook-arrived-many = { $count ->
    [one] Én ting føjet til notesbogen
   *[other] { $count } ting føjet til notesbogen
}

## A note and its text

# The first box of the notebook, named so in the copy of the notebook written as Org until it is given a name.
notebook-org-first-box = Usorteret

# A file a note holds, as it stands in the note: opened by two presses.
notebook-file-open-named = Åbn { $name }
notebook-file-not-here = Filen er ikke på denne computer

# Files that could not be taken in as notes, said in one message.
notebook-files-not-taken = Nogle filer kunne ikke hentes ind

# Words selected in a file read in Glaukopis, or a part of a page marked, sent to the notebook as a new note.
notebook-from-file-added = Føjet til notesbogen
notebook-from-file-not-added = Kunne ikke føjes til notesbogen

## Sources

notebook-source-none = Ingen kilde
# Where a photograph was taken, in degrees.
notebook-source-north = { $degrees }° N
notebook-source-south = { $degrees }° S
notebook-source-east = { $degrees }° Ø
notebook-source-west = { $degrees }° V

notebook-sources = Kilder
notebook-source = Kilde
notebook-source-sort = Hvad det er
notebook-source-web = Webside
notebook-source-reference = Reference
notebook-source-other = Andet
notebook-source-url = Adresse
notebook-source-page-title = Titel
notebook-source-choose-reference = Vælg en reference…
notebook-source-place = Sted
notebook-source-words = Hvor det kom fra
notebook-source-file-name = Navn
notebook-source-file-changed = Sidst ændret
# Of a photograph: when it was taken, and where.
notebook-source-file-taken = Taget
notebook-source-file-where = Hvor
notebook-source-make-reference = Lav en reference
notebook-source-in-library = I biblioteket:
notebook-source-passages = Hentet fra den
notebook-source-changed = Ændret, siden det blev hentet ind. Der stod:
notebook-source-bring-back = Hent tilbage
notebook-source-own-words = Mine egne ord

## Boxes and tags

notebook-all-notes = Alle notater
notebook-boxes = Bokse
# The first box, where everything lands, until it is given a name.
notebook-box-unsorted = Usorteret
notebook-box-new = Ny boks
notebook-box-name = Boksens navn
notebook-box-receives = Notater udefra kommer hertil
notebook-box-delete-title = Slet { $name }?
notebook-box-delete-message = { $count ->
    [one] Notatet i den kommer til { $first }.
   *[other] De { $count } notater i den kommer til { $first }.
}
notebook-move-to = Flyt til
notebook-tags = Mærkater
notebook-tag-name = Mærkatens navn
notebook-tag-remove = Fjern fra alle notater
notebook-tag-remove-title = Fjern { $tag } fra alle notater?
notebook-tag-remove-message = { $count ->
    [one] Ét notat har den.
   *[other] { $count } notater har den.
}
notebook-tag-merge-title = Omdøb { $from } til { $to }?
notebook-tag-merge-message = { $from } og { $to } bliver til én mærkat.
notebook-tags-off = Vis alle, uanset mærkater
# The field under the name of a note, where a tag is added.
notebook-tag-add = Tilføj en mærkat
notebook-tag-take-away = Fjern { $tag }
notebook-tags-offered = Mærkater
notebook-join = Slå sammen
notebook-joined = { $count } notater slået sammen
notebook-divide = Opdel

## The surface

notebook-surface-of-box = Boksens flade
notebook-surface-not-placed = Endnu ikke placeret
notebook-surface-empty-note = Tomt notat
notebook-surface-new-note-here = Nyt notat her
notebook-surface-show-all = Vis alle
notebook-surface-link-handle = Træk til et andet notat for at forbinde dem

## Finding, and starting texts

# The filters of the list, in a window at a button beside the field that finds.
notebook-filters = Filter
notebook-filters-on = { $count ->
    [one] Filter: { $count } slået til
   *[other] Filter: { $count } slået til
}
notebook-filter-holds = Indeholder
notebook-filter-picture = Et billede
notebook-filter-file = En fil
notebook-filter-passage = Ord, der er hentet ind
notebook-filter-link = Et link til et andet notat
notebook-filter-collected = Indsamlet
notebook-filter-from = Fra
notebook-filter-to = Til
notebook-filter-came = Fra
notebook-filter-web = En webside
notebook-filter-reference = En reference
notebook-filter-file-source = En fil
notebook-filter-other = Andet
notebook-filter-no-source = Ingen kilde
notebook-filter-unseen = Ikke set
notebook-filter-use = Brugt
notebook-filter-use-all = Alle
notebook-filter-used = Brugt i et projekt
notebook-filter-unused = Ikke brugt
notebook-filter-clear = Ryd filtrene
notebook-nothing-passes = Ingen notater i visningen slipper gennem filtrene.
# A note taken in that has not been looked at: the dot before its name.
notebook-unseen = Ikke set
# Words read in the images of notes, kept for finding.
notebook-read-text = Læs teksten
notebook-read-again = Læs igen
notebook-text-read = Læst tekst
notebook-reading = { $count ->
    [one] Læser { $name }…
   *[other] Læser { $name } ({ $done } af { $count })…
}
notebook-reading-stop = Stop
notebook-read-done = { $count ->
    [one] Billedets tekst er læst
   *[other] Teksten i { $count } billeder er læst
}
notebook-read-failed = Teksten i { $name } kunne ikke læses
# Starting texts: a new note that begins with lines given.
notebook-new-note-from = Nyt notat fra en starttekst
notebook-starts = Starttekster…
notebook-starts-title = Starttekster
notebook-start-new = Ny
notebook-start-unnamed = Uden navn
notebook-start-name = Navn
notebook-start-lines = Linjer
notebook-start-kind = Linjerne er
notebook-start-up = Flyt op
notebook-start-down = Flyt ned
notebook-start-none = Ingen starttekster endnu.
notebook-start-delete-title = Slet { $name }?
notebook-start-delete-message = De notater, der er begyndt med den, forbliver, som de er.

## Notes from other programs

notebook-import = Importer notater…
notebook-import-title = Importer notater
notebook-import-folder = En mappe…
notebook-import-file = En fil…
notebook-import-programs = En mappe fra Obsidian, Joplin, Notion, Bear, Google Keep eller OneNote, eller med Markdown og tekst; en fil fra Evernote (.enex) eller OneNote (.one), eller én Markdown-fil.
notebook-import-choose-folder = Vælg en mappe med notater
notebook-import-choose-file = Vælg en fil med notater
notebook-import-filter = Notater
notebook-import-kind = { $kind ->
    [obsidian] Notater fra Obsidian
    [joplin] Notater fra Joplin
    [notion] Notater fra Notion
    [bear] Notater fra Bear
    [evernote] Notater fra Evernote
    [keep] Notater fra Google Keep
    [onenote] Notater fra OneNote
   *[markdown] Markdown- og tekstfiler
}
notebook-import-count = { $count ->
    [one] Ét notat
   *[other] { $count } notater
}
notebook-import-files = { $count ->
    [0] ingen billeder eller filer
    [one] ét billede eller én fil
   *[other] { $count } billeder og filer
}
notebook-import-none = Der blev ikke fundet nogen notater her.
notebook-import-to-know = Godt at vide
notebook-import-unread = Det kunne ikke læses som notater.
notebook-import-do = Importer
notebook-import-reading = Læser { $done } af { $count }: { $name }
notebook-import-stop = Stop
notebook-import-done = { $count ->
    [one] Ét notat importeret til { $box }
   *[other] { $count } notater importeret til { $box }
}
notebook-import-nothing = Der blev ikke fundet noget at importere
notebook-import-problems = { $count ->
    [one] Én ting kunne ikke læses: { $first }
   *[other] { $count } ting kunne ikke læses: { $first }
}

## The list in the document pane, and what goes into a text

notebook-between = Mellem vinduets sider og notaterne
notebook-pane-find = Find et notat
notebook-pane-open = Åbn notesbogen
notebook-pane-unread = Notesbogen kunne ikke læses
notebook-pane-empty = Notesbogen er tom
notebook-pane-nothing-found = Intet notat har disse ord
notebook-pane-drag = Træk et notat, eller en del af et, ind i teksten.
notebook-pane-show-all = Vis alle
notebook-pane-show-less = Vis færre
notebook-pane-used = Brugt i dette projekt
notebook-pane-put-into-text = Sæt ind i teksten
notebook-pane-open-note = Åbn i notesbogen
notebook-pane-a-picture = Et billede
# A source made a reference of the library, as what was taken from it went into a text.
notebook-pane-reference-made = Føjet til biblioteket: { $title }
notebook-pane-reference-not-made = { $source } kunne ikke føjes til biblioteket
notebook-pane-picture-not-moved = { $name } kunne ikke lægges blandt bibliotekets filer
notebook-pane-file-not-into-text = En fil kan ikke sættes ind i en tekst
notebook-pane-not-into-text = Notatet kunne ikke sættes ind i teksten

## The window of a note of its own (record 0109)

notebook-note-window-placeholder = Skriv et notat
notebook-note-window-send = Til notesbogen
notebook-note-window-add-file = Tilføj en fil…
notebook-note-window-not-sent = Notatet kunne ikke skrives i notesbogen
