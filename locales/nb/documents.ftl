# Dokumenter som hentes inn, hvert for å bli et kart (ADR 0012), på
# bokmål. Se locales/README.md.

documents-choose = Et dokument å hente inn
documents-filter = Dokumenter
documents-filter-all = Alle filer
documents-title-map = Et kart av et dokument
documents-title-project = Et prosjekt av et dokument
documents-reading = Leser { $file } …
documents-reading-hint = Et langt dokument tar litt tid.
documents-no-pandoc = Dokumenter av dette slaget leses av Pandoc, som ikke er installert eller ikke ble funnet. Hvor det er, kan angis i innstillingene.
documents-unread = Filen kunne ikke leses.
documents-title = Tittel
documents-title-hint-map = Navnet på kartet, og på elementet i midten av det.
documents-title-hint-project = Navnet på prosjektet, på kartet i det, og på elementet i midten av kartet.
documents-untitled = Uten navn

## Det dokumentet har, under antallet av hvert.

documents-parts = { $count ->
    [one] Del
   *[other] Deler
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
    [one] Tabell
   *[other] Tabeller
}
documents-equations = { $count ->
    [one] Ligning
   *[other] Ligninger
}

## Hvor ofte dokumentet viser til verk i biblioteket, og til verk biblioteket ikke har.

documents-cited-in-library = Det vises til verk i biblioteket ditt { $cited ->
        [1] én gang
        [2] to ganger
       *[other] { $cited } ganger
    }.
documents-cited-not-in-library = Det vises til verk som ikke er i biblioteket ditt, { $missing ->
        [1] én gang
        [2] to ganger
       *[other] { $missing } ganger
    }.
documents-cited-both = Det vises til verk i biblioteket ditt { $cited ->
        [1] én gang
        [2] to ganger
       *[other] { $cited } ganger
    }, og til verk som ikke er i det, { $missing ->
        [1] én gang
        [2] to ganger
       *[other] { $missing } ganger
    }.

## Kildehenvisningene som ble funnet i det (ADR 0015).

documents-found = { $count ->
    [one] Én kildehenvisning ble funnet.
   *[other] { $count } kildehenvisninger ble funnet.
}
documents-found-made = { $count ->
    [one] Én kildehenvisning ble funnet, laget av et referanseverktøy.
   *[other] { $count } kildehenvisninger ble funnet, alle laget av et referanseverktøy.
}
documents-found-some-made = { $count } kildehenvisninger ble funnet, { $made } av dem laget av et referanseverktøy.
documents-at-once = Lag kildehenvisninger med én gang av dem Zotero har laget, der biblioteket ditt har verket
documents-at-once-notes = En note som ikke er annet enn en kildehenvisning, blir en kildehenvisning i linjen, som henvisningsstilen setter i en note eller i linjen; en note som sier mer, beholder kildehenvisningen sin. Det du har valgt for noter i panelet med funne kildehenvisninger, for alle som følger, gjelder også her.
documents-go-through-map = Gå gjennom kildehenvisningene når kartet er laget
documents-go-through-project = Gå gjennom kildehenvisningene når prosjektet er laget

## Å lage kartet.

documents-to-know = Verdt å vite
documents-making = Lager kartet …
documents-make-map = Lag kartet
documents-make-project = Lag prosjektet
documents-map-failed = Kartet kunne ikke lages.
