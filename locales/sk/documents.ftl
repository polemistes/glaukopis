# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Dokument na načítanie
documents-filter = Dokumenty
documents-filter-all = Všetky súbory
documents-title-map = Mapa z dokumentu
documents-title-project = Projekt z dokumentu
documents-reading = Číta sa { $file }…
documents-reading-hint = Dlhý dokument chvíľu trvá.
documents-no-pandoc = Dokumenty tohto druhu číta Pandoc, ktorý nie je nainštalovaný alebo sa nenašiel. Kde je, možno povedať v nastaveniach.
documents-unread = Súbor sa nepodarilo prečítať.
documents-title = Názov
documents-title-hint-map = Názov mapy a prvku v jej strede.
documents-title-hint-project = Názov projektu, jeho mapy a prvku v strede mapy.
# What a project made of a document is called when the document has no title.
documents-untitled = Bez názvu

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Časť
    [few] Časti
   *[other] Častí
}
documents-words = { $count ->
    [one] Slovo
    [few] Slová
   *[other] Slov
}
documents-notes = { $count ->
    [one] Poznámka
    [few] Poznámky
   *[other] Poznámok
}
documents-figures = { $count ->
    [one] Vyobrazenie
    [few] Vyobrazenia
   *[other] Vyobrazení
}
documents-tables = { $count ->
    [one] Tabuľka
    [few] Tabuľky
   *[other] Tabuliek
}
documents-equations = { $count ->
    [one] Rovnica
    [few] Rovnice
   *[other] Rovníc
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Diela vašej knižnice sú citované { $cited ->
        [1] raz
        [2] dvakrát
       *[other] { $cited }-krát
    }.
documents-cited-not-in-library = Diela, ktoré vo vašej knižnici nie sú, sú citované { $missing ->
        [1] raz
        [2] dvakrát
       *[other] { $missing }-krát
    }.
documents-cited-both = Diela vašej knižnice sú citované { $cited ->
        [1] raz
        [2] dvakrát
       *[other] { $cited }-krát
    }, diela, ktoré v nej nie sú, { $missing ->
        [1] raz
        [2] dvakrát
       *[other] { $missing }-krát
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Našla sa jedna citácia.
    [few] Našli sa { $count } citácie.
   *[other] Našlo sa { $count } citácií.
}
documents-found-made = { $count ->
    [one] Našla sa jedna citácia, vytvorená programom na správu záznamov.
    [few] Našli sa { $count } citácie, všetky vytvorené programom na správu záznamov.
   *[other] Našlo sa { $count } citácií, všetky vytvorené programom na správu záznamov.
}
documents-found-some-made = { $count ->
    [one] Našla sa { $count } citácia, { $made } z nej vytvorená programom na správu záznamov.
    [few] Našli sa { $count } citácie, { $made } z nich vytvorené programom na správu záznamov.
   *[other] Našlo sa { $count } citácií, { $made } z nich vytvorených programom na správu záznamov.
}
documents-at-once = Citácie vytvorené Zoterom z diel, ktoré má vaša knižnica, premeniť hneď na citácie
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Poznámka, ktorá nie je ničím iným než citáciou, sa stane citáciou v riadku, ktorú citačný štýl vysádza do poznámky alebo do riadku; poznámka, ktorá hovorí viac, si svoju citáciu ponechá. Čo ste zvolili pre poznámky v paneli nájdených citácií, pre všetky nasledujúce, platí aj tu.
documents-go-through-map = Prejsť citácie pri vytváraní mapy
documents-go-through-project = Prejsť citácie pri vytváraní projektu

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Na vedomie
documents-making = Vytvára sa mapa…
documents-make-map = Vytvoriť mapu
documents-make-project = Vytvoriť projekt
documents-map-failed = Mapu sa nepodarilo vytvoriť.
