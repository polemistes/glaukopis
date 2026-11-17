# The notebook: what is collected outside all projects, as notes (record 0101).

## The place in the row, and the page

notebook-title = Anteckningsbok
notebook-notes = Anteckningar
notebook-note = Anteckning
notebook-search = Sök i anteckningarna
notebook-search-clear = Rensa sökningen
notebook-new-note = Ny anteckning
notebook-add-files = Lägg till filer…
notebook-add-files-title = Lägg till filer i anteckningsboken
notebook-empty = Anteckningsboken är tom
    .text = Samla här det som dyker upp, utanför alla projekt: ord, bilder och filer, var och en en anteckning som minns varifrån den kom.
notebook-unreadable = Anteckningsboken kunde inte läsas
notebook-nothing-found = Inga anteckningar hittades
notebook-empty-note = Tom anteckning
notebook-holds-picture = En bild
notebook-holds-file = En fil
notebook-holds-passage = Ord som tagits in
notebook-resize-list = Bredden på listan med anteckningar
notebook-choose = Välj en anteckning, eller gör en ny
notebook-selected = { $count } anteckningar markerade
notebook-deleted = { $count ->
    [one] Anteckningen raderades
   *[other] { $count } anteckningar raderades
}
notebook-redo = Gör om
notebook-name = Namn
notebook-write = Skriv, eller klistra in det du har hittat
# What became of a note: "Used in ‹project› · quotation".
notebook-went = Vad som blev av den
notebook-used-in = Används i
notebook-went-text = text
notebook-went-quotation = citat
notebook-went-figure = bild
notebook-went-reference = referens
notebook-went-file = fil
# How a box is shown: as its surface, or as a list.
notebook-shown-as = Visas som
notebook-surface = Yta
notebook-list = Lista
notebook-close-note = Stäng anteckningen
notebook-resize-column = Bredden på lådorna
notebook-resize-note = Bredden på anteckningen
notebook-box-empty = Inga anteckningar i den här lådan
# What the plugin for Firefox handed over has arrived.
notebook-arrived = Lades till i anteckningsboken
notebook-arrived-from = Lades till i anteckningsboken: { $title }
notebook-arrived-many = { $count ->
    [one] En sak lades till i anteckningsboken
   *[other] { $count } saker lades till i anteckningsboken
}

## A note and its text

# The first box of the notebook, named so in the copy of the notebook written as Org until it is given a name.
notebook-org-first-box = Osorterat

# A file a note holds, as it stands in the note: opened by two presses.
notebook-file-open-named = Öppna { $name }
notebook-file-not-here = Filen finns inte på den här datorn

# Files that could not be taken in as notes, said in one message.
notebook-files-not-taken = Några filer kunde inte tas in

# Words selected in a file read in Glaukopis, or a part of a page marked, sent to the notebook as a new note.
notebook-from-file-added = Lades till i anteckningsboken
notebook-from-file-not-added = Kunde inte läggas till i anteckningsboken

## Sources

notebook-source-none = Ingen källa
# Where a photograph was taken, in degrees.
notebook-source-north = { $degrees }° N
notebook-source-south = { $degrees }° S
notebook-source-east = { $degrees }° Ö
notebook-source-west = { $degrees }° V

notebook-sources = Källor
notebook-source = Källa
notebook-source-sort = Vad det är
notebook-source-web = Webbsida
notebook-source-reference = Referens
notebook-source-other = Annat
notebook-source-url = Adress
notebook-source-page-title = Titel
notebook-source-choose-reference = Välj en referens…
notebook-source-place = Ställe
notebook-source-words = Varifrån det kom
notebook-source-file-name = Namn
notebook-source-file-changed = Senast ändrad
# Of a photograph: when it was taken, and where.
notebook-source-file-taken = Fotograferad
notebook-source-file-where = Var
notebook-source-make-reference = Gör en referens
notebook-source-in-library = I biblioteket:
notebook-source-passages = Taget från den
notebook-source-changed = Ändrad sedan den togs in. Den löd:
notebook-source-bring-back = Återställ
notebook-source-own-words = Mina egna ord

## Boxes and tags

notebook-all-notes = Alla anteckningar
notebook-boxes = Lådor
# The first box, where everything lands, until it is given a name.
notebook-box-unsorted = Osorterat
notebook-box-new = Ny låda
notebook-box-name = Lådans namn
notebook-box-receives = Anteckningar utifrån kommer hit
notebook-box-delete-title = Radera { $name }?
notebook-box-delete-message = { $count ->
    [one] Anteckningen i den går till { $first }.
   *[other] De { $count } anteckningarna i den går till { $first }.
}
notebook-move-to = Flytta till
notebook-tags = Taggar
notebook-tag-name = Taggens namn
notebook-tag-remove = Ta bort från alla anteckningar
notebook-tag-remove-title = Ta bort { $tag } från alla anteckningar?
notebook-tag-remove-message = { $count ->
    [one] En anteckning har den.
   *[other] { $count } anteckningar har den.
}
notebook-tag-merge-title = Byta namn på { $from } till { $to }?
notebook-tag-merge-message = { $from } och { $to } blir en tagg.
notebook-tags-off = Visa alla, oavsett taggar
# The field under the name of a note, where a tag is added.
notebook-tag-add = Lägg till en tagg
notebook-tag-take-away = Ta bort { $tag }
notebook-tags-offered = Taggar
notebook-join = Slå ihop
notebook-joined = { $count } anteckningar slogs ihop
notebook-divide = Dela

## The surface

notebook-surface-of-box = Lådans yta
notebook-surface-not-placed = Ännu inte placerade
notebook-surface-empty-note = Tom anteckning
notebook-surface-new-note-here = Ny anteckning här
notebook-surface-show-all = Visa alla
notebook-surface-link-handle = Dra till en annan anteckning för att länka dem

## Finding, and starting texts

# The filters of the list, in a window at a button beside the field that finds.
notebook-filters = Filter
notebook-filters-on = { $count ->
    [one] Filter: ett är på
   *[other] Filter: { $count } är på
}
notebook-filter-holds = Innehåller
notebook-filter-picture = En bild
notebook-filter-file = En fil
notebook-filter-passage = Ord som tagits in
notebook-filter-link = En länk till en annan anteckning
notebook-filter-collected = Samlad
notebook-filter-from = Från
notebook-filter-to = Till
notebook-filter-came = Från
notebook-filter-web = En webbsida
notebook-filter-reference = En referens
notebook-filter-file-source = En fil
notebook-filter-other = Annat
notebook-filter-no-source = Ingen källa
notebook-filter-unseen = Inte tittad på
notebook-filter-use = Använda
notebook-filter-use-all = Alla
notebook-filter-used = Använda i ett projekt
notebook-filter-unused = Inte använda
notebook-filter-clear = Rensa filtren
notebook-nothing-passes = Ingen anteckning som visas passerar filtren.
# A note taken in that has not been looked at: the dot before its name.
notebook-unseen = Inte tittad på
# Words read in the images of notes, kept for finding.
notebook-read-text = Läs texten
notebook-read-again = Läs på nytt
notebook-text-read = Läst text
notebook-reading = { $count ->
    [one] Läser { $name }…
   *[other] Läser { $name } ({ $done } av { $count })…
}
notebook-reading-stop = Stoppa
notebook-read-done = { $count ->
    [one] Texten i bilden är läst
   *[other] Texten i { $count } bilder är läst
}
notebook-read-failed = Texten i { $name } kunde inte läsas
# Starting texts: a new note that begins with lines given.
notebook-new-note-from = Ny anteckning från en starttext
notebook-starts = Starttexter…
notebook-starts-title = Starttexter
notebook-start-new = Ny
notebook-start-unnamed = Utan namn
notebook-start-name = Namn
notebook-start-lines = Rader
notebook-start-kind = Raderna är
notebook-start-up = Flytta upp
notebook-start-down = Flytta ner
notebook-start-none = Inga starttexter än.
notebook-start-delete-title = Radera { $name }?
notebook-start-delete-message = Anteckningarna som påbörjats med den förblir som de är.

## Notes from other programs

notebook-import = Importera anteckningar…
notebook-import-title = Importera anteckningar
notebook-import-folder = En mapp…
notebook-import-file = En fil…
notebook-import-programs = En mapp från Obsidian, Joplin, Notion, Bear, Google Keep eller OneNote, eller med Markdown och text; en fil från Evernote (.enex) eller OneNote (.one), eller en Markdown-fil.
notebook-import-choose-folder = Välj en mapp med anteckningar
notebook-import-choose-file = Välj en fil med anteckningar
notebook-import-filter = Anteckningar
notebook-import-kind = { $kind ->
    [obsidian] Anteckningar från Obsidian
    [joplin] Anteckningar från Joplin
    [notion] Anteckningar från Notion
    [bear] Anteckningar från Bear
    [evernote] Anteckningar från Evernote
    [keep] Anteckningar från Google Keep
    [onenote] Anteckningar från OneNote
   *[markdown] Markdown- och textfiler
}
notebook-import-count = { $count ->
    [one] En anteckning
   *[other] { $count } anteckningar
}
notebook-import-files = { $count ->
    [0] inga bilder eller filer
    [one] en bild eller fil
   *[other] { $count } bilder och filer
}
notebook-import-none = Inga anteckningar hittades här.
notebook-import-to-know = Bra att veta
notebook-import-unread = Det här kunde inte läsas som anteckningar.
notebook-import-do = Importera
notebook-import-reading = Läser { $done } av { $count }: { $name }
notebook-import-stop = Stoppa
notebook-import-done = { $count ->
    [one] En anteckning importerades till { $box }
   *[other] { $count } anteckningar importerades till { $box }
}
notebook-import-nothing = Inget hittades att importera
notebook-import-problems = { $count ->
    [one] En sak kunde inte läsas: { $first }
   *[other] { $count } saker kunde inte läsas: { $first }
}

## The list in the document pane, and what goes into a text

notebook-between = Mellan fönstrets sidor och anteckningarna
notebook-pane-find = Sök efter en anteckning
notebook-pane-open = Öppna anteckningsboken
notebook-pane-unread = Anteckningsboken kunde inte läsas
notebook-pane-empty = Anteckningsboken är tom
notebook-pane-nothing-found = Ingen anteckning har de orden
notebook-pane-drag = Dra en anteckning, eller en del av en, in i texten.
notebook-pane-show-all = Visa alla
notebook-pane-show-less = Visa mindre
notebook-pane-used = Använd i det här projektet
notebook-pane-put-into-text = Lägg in i texten
notebook-pane-open-note = Öppna i anteckningsboken
notebook-pane-a-picture = En bild
# A source made a reference of the library, as what was taken from it went into a text.
notebook-pane-reference-made = Lades till i biblioteket: { $title }
notebook-pane-reference-not-made = { $source } kunde inte läggas till i biblioteket
notebook-pane-picture-not-moved = { $name } kunde inte läggas bland bibliotekets filer
notebook-pane-file-not-into-text = En fil kan inte läggas in i en text
notebook-pane-not-into-text = Anteckningen kunde inte läggas in i texten

## The window of a note of its own (record 0109)

notebook-note-window-placeholder = Skriv en anteckning
notebook-note-window-send = Till anteckningsboken
notebook-note-window-add-file = Lägg till en fil…
notebook-note-window-not-sent = Anteckningen kunde inte skrivas in i anteckningsboken
