# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Dokument k načtení
documents-filter = Dokumenty
documents-filter-all = Všechny soubory
documents-title-map = Mapa z dokumentu
documents-title-project = Projekt z dokumentu
documents-reading = Čte se { $file }…
documents-reading-hint = Dlouhý dokument chvíli trvá.
documents-no-pandoc = Dokumenty tohoto druhu čte Pandoc, který není nainstalován nebo nebyl nalezen. Kde je, lze říci v nastavení.
documents-unread = Soubor nelze přečíst.
documents-title = Název
documents-title-hint-map = Název mapy a prvku v jejím středu.
documents-title-hint-project = Název projektu, jeho mapy a prvku ve středu mapy.
# What a project made of a document is called when the document has no title.
documents-untitled = Bez názvu

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Část
    [few] Části
   *[other] Částí
}
documents-words = { $count ->
    [one] Slovo
    [few] Slova
   *[other] Slov
}
documents-notes = { $count ->
    [one] Poznámka
    [few] Poznámky
   *[other] Poznámek
}
documents-figures = { $count ->
    [one] Vyobrazení
    [few] Vyobrazení
   *[other] Vyobrazení
}
documents-tables = { $count ->
    [one] Tabulka
    [few] Tabulky
   *[other] Tabulek
}
documents-equations = { $count ->
    [one] Rovnice
    [few] Rovnice
   *[other] Rovnic
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Díla z vaší knihovny jsou citována { $cited ->
        [1] jednou
        [2] dvakrát
       *[other] { $cited }krát
    }.
documents-cited-not-in-library = Díla, která ve vaší knihovně nejsou, jsou citována { $missing ->
        [1] jednou
        [2] dvakrát
       *[other] { $missing }krát
    }.
documents-cited-both = Díla z vaší knihovny jsou citována { $cited ->
        [1] jednou
        [2] dvakrát
       *[other] { $cited }krát
    }, díla, která v ní nejsou, { $missing ->
        [1] jednou
        [2] dvakrát
       *[other] { $missing }krát
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Byla nalezena jedna citace.
    [few] Byly nalezeny { $count } citace.
   *[other] Bylo nalezeno { $count } citací.
}
documents-found-made = { $count ->
    [one] Byla nalezena jedna citace, vytvořená programem na správu záznamů.
    [few] Byly nalezeny { $count } citace, všechny vytvořené programem na správu záznamů.
   *[other] Bylo nalezeno { $count } citací, všechny vytvořené programem na správu záznamů.
}
documents-found-some-made = { $count ->
    [one] Byla nalezena { $count } citace, { $made } z nich vytvořená programem na správu záznamů.
    [few] Byly nalezeny { $count } citace, { $made } z nich vytvořené programem na správu záznamů.
   *[other] Bylo nalezeno { $count } citací, { $made } z nich vytvořených programem na správu záznamů.
}
documents-at-once = Z citací, které vytvořilo Zotero a jejichž díla má vaše knihovna, udělat citace hned
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Poznámka, která není nic než citace, se stane citací v řádku, kterou citační styl vysází do poznámky nebo do řádku; poznámka, která říká víc, si svou citaci ponechá. Co jste pro poznámky zvolili v panelu nalezených citací, pro všechny následující, platí i zde.
documents-go-through-map = Projít citace, až bude mapa vytvořena
documents-go-through-project = Projít citace, až bude projekt vytvořen

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = K vědomí
documents-making = Vytváří se mapa…
documents-make-map = Vytvořit mapu
documents-make-project = Vytvořit projekt
documents-map-failed = Mapu nelze vytvořit.
