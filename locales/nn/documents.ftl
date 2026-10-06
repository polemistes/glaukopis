# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Eit dokument å hente inn
documents-filter = Dokument
documents-filter-all = Alle filer
documents-title-map = Eit kart av eit dokument
documents-title-project = Eit prosjekt av eit dokument
documents-reading = Les { $file } …
documents-reading-hint = Eit langt dokument tek litt tid.
documents-no-pandoc = Dokument av dette slaget blir lesne av Pandoc, som ikkje er installert eller ikkje vart funne. Kvar det er, kan seiast i innstillingane.
documents-unread = Fila kunne ikkje lesast.
documents-title = Tittel
documents-title-hint-map = Namnet på kartet, og på elementet i midten av det.
documents-title-hint-project = Namnet på prosjektet, på kartet i det, og på elementet i midten av kartet.
# What a project made of a document is called when the document has no title.
documents-untitled = Utan namn

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Del
   *[other] Delar
}
documents-words = { $count ->
    [one] Ord
   *[other] Ord
}
documents-notes = { $count ->
    [one] Note
   *[other] Notar
}
documents-figures = { $count ->
    [one] Figur
   *[other] Figurar
}
documents-tables = { $count ->
    [one] Tabell
   *[other] Tabellar
}
documents-equations = { $count ->
    [one] Likning
   *[other] Likningar
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Det blir vist til verk i biblioteket ditt { $cited ->
        [1] éin gong
        [2] to gonger
       *[other] { $cited } gonger
    }.
documents-cited-not-in-library = Det blir vist til verk som ikkje er i biblioteket ditt, { $missing ->
        [1] éin gong
        [2] to gonger
       *[other] { $missing } gonger
    }.
documents-cited-both = Det blir vist til verk i biblioteket ditt { $cited ->
        [1] éin gong
        [2] to gonger
       *[other] { $cited } gonger
    }, og til verk som ikkje er i det, { $missing ->
        [1] éin gong
        [2] to gonger
       *[other] { $missing } gonger
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Éi kjeldetilvising vart funnen.
   *[other] { $count } kjeldetilvisingar vart funne.
}
documents-found-made = { $count ->
    [one] Éi kjeldetilvising vart funnen, laga av eit referanseprogram.
   *[other] { $count } kjeldetilvisingar vart funne, alle laga av eit referanseprogram.
}
documents-found-some-made = { $count } kjeldetilvisingar vart funne, { $made } av dei laga av eit referanseprogram.
documents-at-once = Lag kjeldetilvisingar med ein gong av dei Zotero har laga, der biblioteket ditt har verket
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Ein note som ikkje er anna enn ei kjeldetilvising, blir ei kjeldetilvising i linja, som referansestilen set i ein note eller i linja; ein note som seier meir, held på kjeldetilvisinga si. Det du har valt for notar i panelet med funne kjeldetilvisingar, for alle som følgjer, gjeld her òg.
documents-go-through-map = Gå gjennom kjeldetilvisingane når kartet er laga
documents-go-through-project = Gå gjennom kjeldetilvisingane når prosjektet er laga

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Verdt å vite
documents-making = Lagar kartet …
documents-make-map = Lag kartet
documents-make-project = Lag prosjektet
documents-map-failed = Kartet kunne ikkje lagast.
