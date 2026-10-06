# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Et dokument at hente ind
documents-filter = Dokumenter
documents-filter-all = Alle filer
documents-title-map = Et kort af et dokument
documents-title-project = Et projekt af et dokument
documents-reading = Læser { $file }…
documents-reading-hint = Et langt dokument tager et øjeblik.
documents-no-pandoc = Dokumenter af denne type læses af Pandoc, som ikke er installeret eller ikke blev fundet. Hvor det er, kan angives i indstillingerne.
documents-unread = Filen kunne ikke læses.
documents-title = Titel
documents-title-hint-map = Navnet på kortet og på elementet i dets midte.
documents-title-hint-project = Navnet på projektet, på dets kort og på elementet i kortets midte.
# What a project made of a document is called when the document has no title.
documents-untitled = Uden titel

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Del
   *[other] Dele
}
documents-words = { $count ->
    [one] Ord
   *[other] Ord
}
documents-notes = { $count ->
    [one] Note
   *[other] Noter
}
documents-figures = { $count ->
    [one] Figur
   *[other] Figurer
}
documents-tables = { $count ->
    [one] Tabel
   *[other] Tabeller
}
documents-equations = { $count ->
    [one] Ligning
   *[other] Ligninger
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Værker i dit bibliotek citeres { $cited ->
        [1] én gang
        [2] to gange
       *[other] { $cited } gange
    }.
documents-cited-not-in-library = Værker, der ikke er i dit bibliotek, citeres { $missing ->
        [1] én gang
        [2] to gange
       *[other] { $missing } gange
    }.
documents-cited-both = Værker i dit bibliotek citeres { $cited ->
        [1] én gang
        [2] to gange
       *[other] { $cited } gange
    }, og værker, der ikke er i det, { $missing ->
        [1] én gang
        [2] to gange
       *[other] { $missing } gange
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Der blev fundet én kildehenvisning.
   *[other] Der blev fundet { $count } kildehenvisninger.
}
documents-found-made = { $count ->
    [one] Der blev fundet én kildehenvisning, lavet af et referenceprogram.
   *[other] Der blev fundet { $count } kildehenvisninger, alle lavet af et referenceprogram.
}
documents-found-some-made = Der blev fundet { $count } kildehenvisninger, { $made } af dem lavet af et referenceprogram.
documents-at-once = Lav straks kildehenvisninger af dem, Zotero har lavet, hvor dit bibliotek har værket
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = En note, der ikke er andet end en kildehenvisning, bliver en kildehenvisning i linjen, som referencestilen sætter i en note eller i linjen; en note, der siger mere, beholder sin kildehenvisning. Det, du har valgt for noter i panelet med fundne kildehenvisninger, for alle der følger, gælder også her.
documents-go-through-map = Gennemgå kildehenvisningerne, når kortet er lavet
documents-go-through-project = Gennemgå kildehenvisningerne, når projektet er lavet

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Værd at vide
documents-making = Laver kortet…
documents-make-map = Lav kortet
documents-make-project = Lav projektet
documents-map-failed = Kortet kunne ikke laves.
