# The notebook: what is collected outside all projects, as notes (record 0101).

## The place in the row, and the page

notebook-title = Notatblokk
notebook-notes = Notat
notebook-note = Notat
notebook-search = Søk i notata
notebook-search-clear = Tøm søket
notebook-new-note = Nytt notat
notebook-add-files = Legg til filer …
notebook-add-files-title = Legg til filer i notatblokka
notebook-empty = Notatblokka er tom
    .text = Samle her det du kjem over, utanfor alle prosjekt: ord, bilete og filer. Alt blir eit notat som hugsar kvar det kom frå.
notebook-unreadable = Notatblokka kunne ikkje lesast
notebook-nothing-found = Ingen notat funne
notebook-empty-note = Tomt notat
notebook-holds-picture = Eit bilete
notebook-holds-file = Ei fil
notebook-holds-passage = Ord som er teke inn
notebook-resize-list = Breidda på lista over notat
notebook-choose = Vel eit notat, eller lag eit nytt
notebook-selected = { $count } notat valde
notebook-deleted = { $count ->
    [one] Notatet er sletta
   *[other] { $count } notat er sletta
}
notebook-redo = Gjer om
notebook-name = Namn
notebook-write = Skriv, eller lim inn det du har funne
# What became of a note: "Used in ‹project› · quotation".
notebook-went = Kva det vart til
notebook-used-in = Brukt i
notebook-went-text = tekst
notebook-went-quotation = sitat
notebook-went-figure = bilete
notebook-went-reference = referanse
notebook-went-file = fil
# How a box is shown: as its surface, or as a list.
notebook-shown-as = Vist som
notebook-surface = Flate
notebook-list = Liste
notebook-close-note = Lukk notatet
notebook-resize-column = Breidda på boksane
notebook-resize-note = Breidda på notatet
notebook-box-empty = Ingen notat i denne boksen
# What the plugin for Firefox handed over has arrived.
notebook-arrived = Lagt i notatblokka
notebook-arrived-from = Lagt i notatblokka: { $title }
notebook-arrived-many = { $count ->
    [one] Éi ting lagt i notatblokka
   *[other] { $count } ting lagt i notatblokka
}

## A note and its text

# The first box of the notebook, named so in the copy of the notebook written as Org until it is given a name.
notebook-org-first-box = Usortert

# A file a note holds, as it stands in the note: opened by two presses.
notebook-file-open-named = Opne { $name }
notebook-file-not-here = Fila er ikkje på denne datamaskina

# Files that could not be taken in as notes, said in one message.
notebook-files-not-taken = Nokre filer kunne ikkje takast inn

# Words selected in a file read in Glaukopis, or a part of a page marked, sent to the notebook as a new note.
notebook-from-file-added = Lagt i notatblokka
notebook-from-file-not-added = Kunne ikkje leggjast i notatblokka

## Sources

notebook-source-none = Inga kjelde
# Where a photograph was taken, in degrees.
notebook-source-north = { $degrees }° N
notebook-source-south = { $degrees }° S
notebook-source-east = { $degrees }° Ø
notebook-source-west = { $degrees }° V

notebook-sources = Kjelder
notebook-source = Kjelde
notebook-source-sort = Kva det er
notebook-source-web = Nettside
notebook-source-reference = Referanse
notebook-source-other = Anna
notebook-source-url = Adresse
notebook-source-page-title = Tittel
notebook-source-choose-reference = Vel ein referanse …
notebook-source-place = Stad
notebook-source-words = Kvar det kom frå
notebook-source-file-name = Namn
notebook-source-file-changed = Sist endra
# Of a photograph: when it was taken, and where.
notebook-source-file-taken = Teke
notebook-source-file-where = Kvar
notebook-source-make-reference = Lag ein referanse
notebook-source-in-library = I biblioteket:
notebook-source-passages = Teke frå den
notebook-source-changed = Endra sidan det vart teke inn. Det stod:
notebook-source-bring-back = Hent tilbake
notebook-source-own-words = Mine eigne ord

## Boxes and tags

notebook-all-notes = Alle notat
notebook-boxes = Boksar
# The first box, where everything lands, until it is given a name.
notebook-box-unsorted = Usortert
notebook-box-new = Ny boks
notebook-box-name = Namn på boksen
notebook-box-receives = Notat utanfrå kjem hit
notebook-box-delete-title = Slette { $name }?
notebook-box-delete-message = { $count ->
    [one] Notatet i boksen går til { $first }.
   *[other] Dei { $count } notata i boksen går til { $first }.
}
notebook-move-to = Flytt til
notebook-tags = Merkelappar
notebook-tag-name = Namn på merkelappen
notebook-tag-remove = Fjern frå alle notat
notebook-tag-remove-title = Fjerne { $tag } frå alle notat?
notebook-tag-remove-message = { $count ->
    [one] Eitt notat har den.
   *[other] { $count } notat har den.
}
notebook-tag-merge-title = Gi { $from } namnet { $to }?
notebook-tag-merge-message = { $from } og { $to } blir éin merkelapp.
notebook-tags-off = Vis alle, uansett merkelappar
# The field under the name of a note, where a tag is added.
notebook-tag-add = Legg til ein merkelapp
notebook-tag-take-away = Fjern { $tag }
notebook-tags-offered = Merkelappar
notebook-join = Slå saman
notebook-joined = { $count } notat er slått saman
notebook-divide = Del opp

## The surface

notebook-surface-of-box = Flata i boksen
notebook-surface-not-placed = Ikkje plassert enno
notebook-surface-empty-note = Tomt notat
notebook-surface-new-note-here = Nytt notat her
notebook-surface-show-all = Vis alt
notebook-surface-link-handle = Dra til eit anna notat for å lenkje dei saman

## Finding, and starting texts

# The filters of the list, in a window at a button beside the field that finds.
notebook-filters = Filtrer
notebook-filters-on = { $count ->
    [one] Filter: { $count } på
   *[other] Filter: { $count } på
}
notebook-filter-holds = Har
notebook-filter-picture = Eit bilete
notebook-filter-file = Ei fil
notebook-filter-passage = Ord som er teke inn
notebook-filter-link = Ei lenkje til eit anna notat
notebook-filter-collected = Samla
notebook-filter-from = Frå
notebook-filter-to = Til
notebook-filter-came = Frå
notebook-filter-web = Ei nettside
notebook-filter-reference = Ein referanse
notebook-filter-file-source = Ei fil
notebook-filter-other = Anna
notebook-filter-no-source = Inga kjelde
notebook-filter-unseen = Ikkje sett på
notebook-filter-use = Brukt
notebook-filter-use-all = Alle
notebook-filter-used = Brukt i eit prosjekt
notebook-filter-unused = Ikkje brukt
notebook-filter-clear = Fjern filtera
notebook-nothing-passes = Ingen av notata som er viste, slepp gjennom filtera.
# A note taken in that has not been looked at: the dot before its name.
notebook-unseen = Ikkje sett på
# Words read in the images of notes, kept for finding.
notebook-read-text = Les teksten
notebook-read-again = Les på nytt
notebook-text-read = Lesen tekst
notebook-reading = { $count ->
    [one] Les { $name } …
   *[other] Les { $name } ({ $done } av { $count }) …
}
notebook-reading-stop = Stopp
notebook-read-done = { $count ->
    [one] Teksten i biletet er lesen
   *[other] Teksten i { $count } bilete er lesen
}
notebook-read-failed = Teksten i { $name } kunne ikkje lesast
# Starting texts: a new note that begins with lines given.
notebook-new-note-from = Nytt notat frå ein starttekst
notebook-starts = Starttekstar …
notebook-starts-title = Starttekstar
notebook-start-new = Ny
notebook-start-unnamed = Utan namn
notebook-start-name = Namn
notebook-start-lines = Linjer
notebook-start-kind = Linjene er
notebook-start-up = Flytt opp
notebook-start-down = Flytt ned
notebook-start-none = Ingen starttekstar enno.
notebook-start-delete-title = Slette { $name }?
notebook-start-delete-message = Notata som er byrja frå den, blir ståande som dei er.

## Notes from other programs

notebook-import = Importer notat …
notebook-import-title = Importer notat
notebook-import-folder = Ei mappe …
notebook-import-file = Ei fil …
notebook-import-programs = Ei mappe frå Obsidian, Joplin, Notion, Bear, Google Keep eller OneNote, eller med Markdown og tekst; ei fil frå Evernote (.enex) eller OneNote (.one), eller éi Markdown-fil.
notebook-import-choose-folder = Vel ei mappe med notat
notebook-import-choose-file = Vel ei fil med notat
notebook-import-filter = Notat
notebook-import-kind = { $kind ->
    [obsidian] Notat frå Obsidian
    [joplin] Notat frå Joplin
    [notion] Notat frå Notion
    [bear] Notat frå Bear
    [evernote] Notat frå Evernote
    [keep] Notat frå Google Keep
    [onenote] Notat frå OneNote
   *[markdown] Markdown- og tekstfiler
}
notebook-import-count = { $count ->
    [one] Eitt notat
   *[other] { $count } notat
}
notebook-import-files = { $count ->
    [0] ingen bilete eller filer
    [one] eitt bilete eller éi fil
   *[other] { $count } bilete og filer
}
notebook-import-none = Ingen notat vart funne her.
notebook-import-to-know = Verdt å vite
notebook-import-unread = Dette kunne ikkje lesast som notat.
notebook-import-do = Importer
notebook-import-reading = Les { $done } av { $count }: { $name }
notebook-import-stop = Stopp
notebook-import-done = { $count ->
    [one] Eitt notat importert til { $box }
   *[other] { $count } notat importert til { $box }
}
notebook-import-nothing = Ingenting å importere vart funne
notebook-import-problems = { $count ->
    [one] Éi ting kunne ikkje lesast: { $first }
   *[other] { $count } ting kunne ikkje lesast: { $first }
}

## The list in the document pane, and what goes into a text

notebook-between = Mellom sidene og notata
notebook-pane-find = Finn eit notat
notebook-pane-open = Opne notatblokka
notebook-pane-unread = Notatblokka kunne ikkje lesast
notebook-pane-empty = Notatblokka er tom
notebook-pane-nothing-found = Ingen notat har desse orda
notebook-pane-drag = Dra eit notat, eller ein del av eit, inn i teksten.
notebook-pane-show-all = Vis alt
notebook-pane-show-less = Vis mindre
notebook-pane-used = Brukt i dette prosjektet
notebook-pane-put-into-text = Set inn i teksten
notebook-pane-open-note = Opne i notatblokka
notebook-pane-a-picture = Eit bilete
# A source made a reference of the library, as what was taken from it went into a text.
notebook-pane-reference-made = Lagt til i biblioteket: { $title }
notebook-pane-reference-not-made = { $source } kunne ikkje leggjast til i biblioteket
notebook-pane-picture-not-moved = { $name } kunne ikkje leggjast blant filene i biblioteket
notebook-pane-file-not-into-text = Ei fil kan ikkje setjast inn i ein tekst
notebook-pane-not-into-text = Notatet kunne ikkje setjast inn i teksten

## The window of a note of its own (record 0109)

notebook-note-window-placeholder = Skriv eit notat
notebook-note-window-send = Til notatblokka
notebook-note-window-add-file = Legg til ei fil …
notebook-note-window-not-sent = Notatet kunne ikkje skrivast inn i notatblokka
