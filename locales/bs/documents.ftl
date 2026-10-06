# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Dokument za učitavanje
documents-filter = Dokumenti
documents-filter-all = Sve datoteke
documents-title-map = Mapa iz dokumenta
documents-title-project = Projekat iz dokumenta
documents-reading = Čitanje { $file }…
documents-reading-hint = Za dugačak dokument treba koji trenutak.
documents-no-pandoc = Dokumente ove vrste čita Pandoc, koji nije instaliran ili ga nije bilo moguće pronaći. Gdje se nalazi može se reći u postavkama.
documents-unread = Datoteku nije bilo moguće pročitati.
documents-title = Naslov
documents-title-hint-map = Naziv mape i elementa u njenom središtu.
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
    [one] Napomena
    [few] Napomene
   *[other] Napomena
}
documents-figures = { $count ->
    [one] Ilustracija
    [few] Ilustracije
   *[other] Ilustracija
}
documents-tables = { $count ->
    [one] Tabela
    [few] Tabele
   *[other] Tabela
}
documents-equations = { $count ->
    [one] Jednačina
    [few] Jednačine
   *[other] Jednačina
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Djela iz vaše biblioteke citirana su { $cited ->
        [1] jednom
        [2] dvaput
       *[other] { $cited } puta
    }.
documents-cited-not-in-library = Djela kojih nema u vašoj biblioteci citirana su { $missing ->
        [1] jednom
        [2] dvaput
       *[other] { $missing } puta
    }.
documents-cited-both = Djela iz vaše biblioteke citirana su { $cited ->
        [1] jednom
        [2] dvaput
       *[other] { $cited } puta
    }, a djela kojih u njoj nema { $missing ->
        [1] jednom
        [2] dvaput
       *[other] { $missing } puta
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Pronađen je jedan citat.
    [few] Pronađena su { $count } citata.
   *[other] Pronađeno je { $count } citata.
}
documents-found-made = { $count ->
    [one] Pronađen je jedan citat, koji je napravio program koji čuva reference.
    [few] Pronađena su { $count } citata, a sve ih je napravio program koji čuva reference.
   *[other] Pronađeno je { $count } citata, a sve ih je napravio program koji čuva reference.
}
documents-found-some-made = { $count ->
    [one] Pronađen je { $count } citat, a { $made } od njih napravio je program koji čuva reference.
    [few] Pronađena su { $count } citata, a { $made } od njih napravio je program koji čuva reference.
   *[other] Pronađeno je { $count } citata, a { $made } od njih napravio je program koji čuva reference.
}
documents-at-once = Odmah napravi citate od onih koje je Zotero napravio od djela koja vaša biblioteka ima
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Fusnota koja nije ništa drugo do citat postaje citat u redu, koji stil citiranja smješta u fusnotu ili u red; fusnota koja kaže više zadržava svoj citat. Ono što ste za fusnote odabrali u panelu pronađenih citata, za sve koji slijede, vrijedi i ovdje.
documents-go-through-map = Pregledaj citate kad se mapa napravi
documents-go-through-project = Pregledaj citate kad se projekat napravi

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Dobro je znati
documents-making = Pravljenje mape…
documents-make-map = Napravi mapu
documents-make-project = Napravi projekat
documents-map-failed = Mapu nije bilo moguće napraviti.
