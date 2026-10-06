# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Dokument za učitavanje
documents-filter = Dokumenti
documents-filter-all = Sve datoteke
documents-title-map = Mapa iz dokumenta
documents-title-project = Projekt iz dokumenta
documents-reading = Čitanje { $file }…
documents-reading-hint = Dugačak dokument traje trenutak.
documents-no-pandoc = Dokumente ove vrste čita Pandoc, koji nije instaliran ili ga nije moguće pronaći. Gdje se nalazi može se reći u postavkama.
documents-unread = Datoteku nije bilo moguće pročitati.
documents-title = Naslov
documents-title-hint-map = Naziv mape i elementa u njezinu središtu.
documents-title-hint-project = Naziv projekta, njegove mape i elementa u središtu mape.
# What a project made of a document is called when the document has no title.
documents-untitled = Bez naslova

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Dio
    [few] Dijela
   *[other] Dijelova
}
documents-words = { $count ->
    [one] Riječ
    [few] Riječi
   *[other] Riječi
}
documents-notes = { $count ->
    [one] Bilješka
    [few] Bilješke
   *[other] Bilježaka
}
documents-figures = { $count ->
    [one] Slika
    [few] Slike
   *[other] Slika
}
documents-tables = { $count ->
    [one] Tablica
    [few] Tablice
   *[other] Tablica
}
documents-equations = { $count ->
    [one] Jednadžba
    [few] Jednadžbe
   *[other] Jednadžbi
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Djela iz vaše knjižnice citirana su { $cited ->
        [1] jednom
        [2] dvaput
        [one] { $cited } put
        [few] { $cited } puta
       *[other] { $cited } puta
    }.
documents-cited-not-in-library = Djela kojih nema u vašoj knjižnici citirana su { $missing ->
        [1] jednom
        [2] dvaput
        [one] { $missing } put
        [few] { $missing } puta
       *[other] { $missing } puta
    }.
documents-cited-both = Djela iz vaše knjižnice citirana su { $cited ->
        [1] jednom
        [2] dvaput
        [one] { $cited } put
        [few] { $cited } puta
       *[other] { $cited } puta
    }, djela kojih u njoj nema { $missing ->
        [1] jednom
        [2] dvaput
        [one] { $missing } put
        [few] { $missing } puta
       *[other] { $missing } puta
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [1] Pronađen je jedan citat.
    [one] Pronađen je { $count } citat.
    [few] Pronađena su { $count } citata.
   *[other] Pronađeno je { $count } citata.
}
documents-found-made = { $count ->
    [1] Pronađen je jedan citat, koji je načinio program koji vodi reference.
    [one] Pronađen je { $count } citat, koji je načinio program koji vodi reference.
    [few] Pronađena su { $count } citata, a sve ih je načinio program koji vodi reference.
   *[other] Pronađeno je { $count } citata, a sve ih je načinio program koji vodi reference.
}
documents-found-some-made = { $count ->
    [one] Pronađen je { $count } citat, od kojih je { $made } načinio program koji vodi reference.
    [few] Pronađena su { $count } citata, od kojih je { $made } načinio program koji vodi reference.
   *[other] Pronađeno je { $count } citata, od kojih je { $made } načinio program koji vodi reference.
}
documents-at-once = Odmah načini citate od onih koje je Zotero načinio za djela koja vaša knjižnica ima
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Bilješka koja nije ništa drugo nego citat postaje citat u retku, koji citatni stil smješta u bilješku ili u redak; bilješka koja kaže više zadržava svoj citat. Što ste za bilješke odabrali u ploči pronađenih citata, za sve koje slijede, vrijedi i ovdje.
documents-go-through-map = Prođi kroz citate kad se mapa načini
documents-go-through-project = Prođi kroz citate kad se projekt načini

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Dobro je znati
documents-making = Izrada mape…
documents-make-map = Načini mapu
documents-make-project = Načini projekt
documents-map-failed = Mapu nije bilo moguće načiniti.
