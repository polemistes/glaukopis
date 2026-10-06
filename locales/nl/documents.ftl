# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Een document om binnen te halen
documents-filter = Documenten
documents-filter-all = Alle bestanden
documents-title-map = Een mindmap uit een document
documents-title-project = Een project uit een document
documents-reading = { $file } wordt gelezen…
documents-reading-hint = Een lang document duurt even.
documents-no-pandoc = Documenten van deze soort worden gelezen door Pandoc, dat niet is geïnstalleerd of niet kon worden gevonden. Waar het staat, kan in de instellingen worden gezegd.
documents-unread = Het bestand kon niet worden gelezen.
documents-title = Titel
documents-title-hint-map = De naam van de mindmap, en van het element in haar kern.
documents-title-hint-project = De naam van het project, van zijn mindmap, en van het element in de kern van de mindmap.
# What a project made of a document is called when the document has no title.
documents-untitled = Zonder titel

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Deel
   *[other] Delen
}
documents-words = { $count ->
    [one] Woord
   *[other] Woorden
}
documents-notes = { $count ->
    [one] Noot
   *[other] Noten
}
documents-figures = { $count ->
    [one] Figuur
   *[other] Figuren
}
documents-tables = { $count ->
    [one] Tabel
   *[other] Tabellen
}
documents-equations = { $count ->
    [one] Vergelijking
   *[other] Vergelijkingen
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Werken uit je bibliotheek worden { $cited ->
        [1] eenmaal
        [2] tweemaal
       *[other] { $cited } keer
    } geciteerd.
documents-cited-not-in-library = Werken die niet in je bibliotheek staan, worden { $missing ->
        [1] eenmaal
        [2] tweemaal
       *[other] { $missing } keer
    } geciteerd.
documents-cited-both = Werken uit je bibliotheek worden { $cited ->
        [1] eenmaal
        [2] tweemaal
       *[other] { $cited } keer
    } geciteerd, werken die er niet in staan { $missing ->
        [1] eenmaal
        [2] tweemaal
       *[other] { $missing } keer
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Er is één verwijzing gevonden.
   *[other] Er zijn { $count } verwijzingen gevonden.
}
documents-found-made = { $count ->
    [one] Er is één verwijzing gevonden, gemaakt door een programma dat referenties bijhoudt.
   *[other] Er zijn { $count } verwijzingen gevonden, alle gemaakt door een programma dat referenties bijhoudt.
}
documents-found-some-made = Er zijn { $count } verwijzingen gevonden, { $made } ervan gemaakt door een programma dat referenties bijhoudt.
documents-at-once = Maak meteen verwijzingen van die welke Zotero heeft gemaakt naar werken die je bibliotheek heeft
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Een noot die niets anders is dan een verwijzing, wordt een verwijzing in de regel, die de citeerstijl in een noot of in de regel zet; een noot die meer zegt, houdt haar verwijzing. Wat je in het paneel van gevonden verwijzingen voor noten hebt gekozen, voor alle volgende, geldt ook hier.
documents-go-through-map = De verwijzingen doornemen wanneer de mindmap is gemaakt
documents-go-through-project = De verwijzingen doornemen wanneer het project is gemaakt

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Goed om te weten
documents-making = De mindmap wordt gemaakt…
documents-make-map = De mindmap maken
documents-make-project = Het project maken
documents-map-failed = De mindmap kon niet worden gemaakt.
