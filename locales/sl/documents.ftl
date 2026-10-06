# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Dokument za uvoz
documents-filter = Dokumenti
documents-filter-all = Vse datoteke
documents-title-map = Miselni vzorec iz dokumenta
documents-title-project = Projekt iz dokumenta
documents-reading = Branje { $file }…
documents-reading-hint = Dolg dokument vzame trenutek.
documents-no-pandoc = Dokumente te vrste bere Pandoc, ki ni nameščen ali ga ni bilo mogoče najti. Kje je, lahko poveste v nastavitvah.
documents-unread = Datoteke ni bilo mogoče prebrati.
documents-title = Naslov
documents-title-hint-map = Ime miselnega vzorca in elementa v njegovem središču.
documents-title-hint-project = Ime projekta, njegovega miselnega vzorca in elementa v središču miselnega vzorca.
# What a project made of a document is called when the document has no title.
documents-untitled = Brez naslova

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Del
    [two] Dela
    [few] Deli
   *[other] Delov
}
documents-words = { $count ->
    [one] Beseda
    [two] Besedi
    [few] Besede
   *[other] Besed
}
documents-notes = { $count ->
    [one] Opomba
    [two] Opombi
    [few] Opombe
   *[other] Opomb
}
documents-figures = { $count ->
    [one] Ilustracija
    [two] Ilustraciji
    [few] Ilustracije
   *[other] Ilustracij
}
documents-tables = { $count ->
    [one] Tabela
    [two] Tabeli
    [few] Tabele
   *[other] Tabel
}
documents-equations = { $count ->
    [one] Enačba
    [two] Enačbi
    [few] Enačbe
   *[other] Enačb
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Dela iz vaše knjižnice so navedena { $cited ->
        [1] enkrat
        [2] dvakrat
       *[other] { $cited }-krat
    }.
documents-cited-not-in-library = Dela, ki jih v vaši knjižnici ni, so navedena { $missing ->
        [1] enkrat
        [2] dvakrat
       *[other] { $missing }-krat
    }.
documents-cited-both = Dela iz vaše knjižnice so navedena { $cited ->
        [1] enkrat
        [2] dvakrat
       *[other] { $cited }-krat
    }, dela, ki jih v njej ni, pa { $missing ->
        [1] enkrat
        [2] dvakrat
       *[other] { $missing }-krat
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Najdena je bila { $count } navedba.
    [two] Najdeni sta bili { $count } navedbi.
    [few] Najdene so bile { $count } navedbe.
   *[other] Najdenih je bilo { $count } navedb.
}
documents-found-made = { $count ->
    [one] Najdena je bila { $count } navedba, narejena s programom, ki hrani vire.
    [two] Najdeni sta bili { $count } navedbi, obe narejeni s programom, ki hrani vire.
    [few] Najdene so bile { $count } navedbe, vse narejene s programom, ki hrani vire.
   *[other] Najdenih je bilo { $count } navedb, vse narejene s programom, ki hrani vire.
}
documents-found-some-made = { $count ->
    [one] Najdena je bila { $count } navedba; { $made } od njih je naredil program, ki hrani vire.
    [two] Najdeni sta bili { $count } navedbi; { $made } od njiju je naredil program, ki hrani vire.
    [few] Najdene so bile { $count } navedbe; { $made } od njih je naredil program, ki hrani vire.
   *[other] Najdenih je bilo { $count } navedb; { $made } od njih je naredil program, ki hrani vire.
}
documents-at-once = Iz tistih, ki jih je naredil Zotero in katerih dela ima vaša knjižnica, takoj naredi navedbe
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Opomba, ki ni nič drugega kot navedba, postane navedba v vrstici, ki jo slog navajanja postavi v opombo ali v vrstico; opomba, ki pove več, obdrži svojo navedbo. Kar ste za opombe izbrali v plošči najdenih navedb, za vse nadaljnje, velja tudi tu.
documents-go-through-map = Preglej navedbe, ko je miselni vzorec narejen
documents-go-through-project = Preglej navedbe, ko je projekt narejen

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Dobro je vedeti
documents-making = Izdelava miselnega vzorca…
documents-make-map = Naredi miselni vzorec
documents-make-project = Naredi projekt
documents-map-failed = Miselnega vzorca ni bilo mogoče narediti.
