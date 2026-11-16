# Notatblokken: det som samles utenfor alle prosjekter, som notater (record 0101).

## Plassen i raden, og siden

notebook-title = Notatblokk
notebook-notes = Notater
notebook-note = Notat
notebook-search = Søk i notatene
notebook-search-clear = Tøm søket
notebook-new-note = Nytt notat
notebook-add-files = Legg til filer …
notebook-add-files-title = Legg til filer i notatblokken
notebook-empty = Notatblokken er tom
    .text = Samle her det du kommer over, utenfor alle prosjekter: ord, bilder og filer, hver et notat som husker hvor det kom fra.
notebook-unreadable = Notatblokken kunne ikke leses
notebook-nothing-found = Fant ingen notater
notebook-empty-note = Tomt notat
notebook-holds-picture = Et bilde
notebook-holds-file = En fil
notebook-holds-passage = Ord som er tatt inn
notebook-resize-list = Bredden på listen over notater
notebook-choose = Velg et notat, eller lag et nytt
notebook-selected = { $count } notater valgt
notebook-deleted = { $count ->
    [one] Notatet er slettet
   *[other] { $count } notater er slettet
}
notebook-redo = Gjør om
notebook-name = Navn
notebook-write = Skriv, eller lim inn det du har funnet
notebook-went = Hva det ble til
notebook-used-in = Brukt i
notebook-went-text = tekst
notebook-went-quotation = sitat
notebook-went-figure = bilde
notebook-went-reference = referanse
notebook-went-file = fil
notebook-shown-as = Vises som
notebook-surface = Flate
notebook-list = Liste
notebook-close-note = Lukk notatet
notebook-resize-column = Bredden på boksene
notebook-resize-note = Bredden på notatet
notebook-box-empty = Ingen notater i denne boksen
notebook-arrived = Lagt i notatblokken
notebook-arrived-from = Lagt i notatblokken: { $title }
notebook-arrived-many = { $count ->
    [one] Én ting lagt i notatblokken
   *[other] { $count } ting lagt i notatblokken
}

## Et notat og teksten i det

# Den første boksen i notatblokken, kalt slik i kopien av notatblokken skrevet som Org til den får et navn.
notebook-org-first-box = Usortert

notebook-file-open-named = Åpne { $name }
notebook-file-not-here = Filen er ikke på denne datamaskinen

notebook-files-not-taken = Noen filer kunne ikke tas inn

notebook-from-file-added = Lagt i notatblokken
notebook-from-file-not-added = Kunne ikke legges i notatblokken

## Kilder

notebook-source-none = Ingen kilde
notebook-source-north = { $degrees }° N
notebook-source-south = { $degrees }° S
notebook-source-east = { $degrees }° Ø
notebook-source-west = { $degrees }° V

notebook-sources = Kilder
notebook-source = Kilde
notebook-source-sort = Hva det er
notebook-source-web = Nettside
notebook-source-reference = Referanse
notebook-source-other = Annet
notebook-source-url = Adresse
notebook-source-page-title = Tittel
notebook-source-choose-reference = Velg en referanse …
notebook-source-place = Sted
notebook-source-words = Hvor det kom fra
notebook-source-file-name = Navn
notebook-source-file-changed = Sist endret
notebook-source-file-taken = Tatt
notebook-source-file-where = Hvor
notebook-source-make-reference = Lag en referanse
notebook-source-in-library = I biblioteket:
notebook-source-passages = Tatt fra den
notebook-source-changed = Endret siden det ble tatt. Det lød:
notebook-source-bring-back = Hent tilbake
notebook-source-own-words = Mine egne ord

## Bokser og merkelapper

notebook-all-notes = Alle notater
notebook-boxes = Bokser
notebook-box-unsorted = Usortert
notebook-box-new = Ny boks
notebook-box-name = Navn på boksen
notebook-box-receives = Notater utenfra kommer hit
notebook-box-delete-title = Slette { $name }?
notebook-box-delete-message = { $count ->
    [one] Notatet i den går til { $first }.
   *[other] De { $count } notatene i den går til { $first }.
}
notebook-move-to = Flytt til
notebook-tags = Merkelapper
notebook-tag-name = Navn på merkelappen
notebook-tag-remove = Fjern fra alle notater
notebook-tag-remove-title = Fjerne { $tag } fra alle notater?
notebook-tag-remove-message = { $count ->
    [one] Ett notat har den.
   *[other] { $count } notater har den.
}
notebook-tag-merge-title = Gi { $from } navnet { $to }?
notebook-tag-merge-message = { $from } og { $to } blir én merkelapp.
notebook-tags-off = Vis alle, uansett merkelapper
notebook-tag-add = Legg til en merkelapp
notebook-tag-take-away = Fjern { $tag }
notebook-tags-offered = Merkelapper
notebook-join = Slå sammen
notebook-joined = { $count } notater er slått sammen
notebook-divide = Del

## Flaten

notebook-surface-of-box = Flaten i boksen
notebook-surface-not-placed = Ikke plassert ennå
notebook-surface-empty-note = Tomt notat
notebook-surface-new-note-here = Nytt notat her
notebook-surface-show-all = Vis alt
notebook-surface-link-handle = Dra til et annet notat for å lenke dem

## Å finne, og starttekster

notebook-filters = Filtrer
notebook-filters-on = { $count ->
    [one] Filter: { $count } på
   *[other] Filter: { $count } på
}
notebook-filter-holds = Har
notebook-filter-picture = Et bilde
notebook-filter-file = En fil
notebook-filter-passage = Ord som er tatt inn
notebook-filter-link = En lenke til et annet notat
notebook-filter-collected = Samlet
notebook-filter-from = Fra
notebook-filter-to = Til
notebook-filter-came = Fra
notebook-filter-web = En nettside
notebook-filter-reference = En referanse
notebook-filter-file-source = En fil
notebook-filter-other = Annet
notebook-filter-no-source = Ingen kilde
notebook-filter-unseen = Ikke sett på
notebook-filter-use = Brukt
notebook-filter-use-all = Alle
notebook-filter-used = Brukt i et prosjekt
notebook-filter-unused = Ikke brukt
notebook-filter-clear = Fjern filtrene
notebook-nothing-passes = Ingen notater i oversikten slipper gjennom filtrene.
notebook-unseen = Ikke sett på
notebook-read-text = Les teksten
notebook-read-again = Les på nytt
notebook-text-read = Lest tekst
notebook-reading = { $count ->
    [one] Leser { $name } …
   *[other] Leser { $name } ({ $done } av { $count }) …
}
notebook-reading-stop = Stopp
notebook-read-done = { $count ->
    [one] Teksten i bildet er lest
   *[other] Teksten i { $count } bilder er lest
}
notebook-read-failed = Teksten i { $name } kunne ikke leses
notebook-new-note-from = Nytt notat fra en starttekst
notebook-starts = Starttekster …
notebook-starts-title = Starttekster
notebook-start-new = Ny
notebook-start-unnamed = Uten navn
notebook-start-name = Navn
notebook-start-lines = Linjer
notebook-start-kind = Linjene er
notebook-start-up = Flytt opp
notebook-start-down = Flytt ned
notebook-start-none = Ingen starttekster ennå.
notebook-start-delete-title = Slette { $name }?
notebook-start-delete-message = Notatene som ble begynt fra den, blir stående som de er.

## Notater fra andre programmer

notebook-import = Importer notater…
notebook-import-title = Importer notater
notebook-import-folder = En mappe…
notebook-import-file = En fil…
notebook-import-programs = En mappe fra Obsidian, Joplin, Notion, Bear, Google Keep eller OneNote, eller med Markdown og tekst; en fil fra Evernote (.enex) eller OneNote (.one), eller én Markdown-fil.
notebook-import-choose-folder = Velg en mappe med notater
notebook-import-choose-file = Velg en fil med notater
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
    [one] Ett notat
   *[other] { $count } notater
}
notebook-import-files = { $count ->
    [0] ingen bilder eller filer
    [one] ett bilde eller én fil
   *[other] { $count } bilder og filer
}
notebook-import-none = Fant ingen notater her.
notebook-import-to-know = Verdt å vite
notebook-import-unread = Dette kunne ikke leses som notater.
notebook-import-do = Importer
notebook-import-reading = Leser { $done } av { $count }: { $name }
notebook-import-stop = Stopp
notebook-import-done = { $count ->
    [one] Ett notat importert til { $box }
   *[other] { $count } notater importert til { $box }
}
notebook-import-nothing = Fant ingenting å importere
notebook-import-problems = { $count ->
    [one] Én ting kunne ikke leses: { $first }
   *[other] { $count } ting kunne ikke leses: { $first }
}

## Listen i dokumentpanelet, og det som går inn i en tekst

notebook-between = Mellom sidene og notatene
notebook-pane-find = Finn et notat
notebook-pane-open = Åpne notatblokken
notebook-pane-unread = Notatblokken kunne ikke leses
notebook-pane-empty = Notatblokken er tom
notebook-pane-nothing-found = Ingen notater har disse ordene
notebook-pane-drag = Dra et notat, eller en del av et, inn i teksten.
notebook-pane-show-all = Vis alt
notebook-pane-show-less = Vis mindre
notebook-pane-used = Brukt i dette prosjektet
notebook-pane-put-into-text = Sett inn i teksten
notebook-pane-open-note = Åpne i notatblokken
notebook-pane-a-picture = Et bilde
notebook-pane-reference-made = Lagt til i biblioteket: { $title }
notebook-pane-reference-not-made = { $source } kunne ikke legges til i biblioteket
notebook-pane-picture-not-moved = { $name } kunne ikke legges blant filene i biblioteket
notebook-pane-file-not-into-text = En fil kan ikke settes inn i en tekst
notebook-pane-not-into-text = Notatet kunne ikke settes inn i teksten

## Vinduet for et eget notat (record 0109)

notebook-note-window-placeholder = Skriv et notat
notebook-note-window-send = Til notatblokken
notebook-note-window-add-file = Legg til en fil …
notebook-note-window-not-sent = Notatet kunne ikke skrives inn i notatblokken
