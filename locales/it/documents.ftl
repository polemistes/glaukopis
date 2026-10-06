# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Un documento da portare dentro
documents-filter = Documenti
documents-filter-all = Tutti i file
documents-title-map = Una mappa da un documento
documents-title-project = Un progetto da un documento
documents-reading = Lettura di { $file }…
documents-reading-hint = Un documento lungo richiede un momento.
documents-no-pandoc = I documenti di questo tipo sono letti da Pandoc, che non è installato o non si trova. Dove si trova si può dire nelle impostazioni.
documents-unread = Il file non si è potuto leggere.
documents-title = Titolo
documents-title-hint-map = Il nome della mappa, e dell'elemento al suo centro.
documents-title-hint-project = Il nome del progetto, della sua mappa, e dell'elemento al centro della mappa.
# What a project made of a document is called when the document has no title.
documents-untitled = Senza titolo

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Parte
    [many] Parti
   *[other] Parti
}
documents-words = { $count ->
    [one] Parola
    [many] Parole
   *[other] Parole
}
documents-notes = { $count ->
    [one] Nota
    [many] Note
   *[other] Note
}
documents-figures = { $count ->
    [one] Figura
    [many] Figure
   *[other] Figure
}
documents-tables = { $count ->
    [one] Tabella
    [many] Tabelle
   *[other] Tabelle
}
documents-equations = { $count ->
    [one] Equazione
    [many] Equazioni
   *[other] Equazioni
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Le opere della tua biblioteca sono citate { $cited ->
        [1] una volta
        [2] due volte
       *[other] { $cited } volte
    }.
documents-cited-not-in-library = Le opere che non sono nella tua biblioteca sono citate { $missing ->
        [1] una volta
        [2] due volte
       *[other] { $missing } volte
    }.
documents-cited-both = Le opere della tua biblioteca sono citate { $cited ->
        [1] una volta
        [2] due volte
       *[other] { $cited } volte
    }, quelle che non vi sono { $missing ->
        [1] una volta
        [2] due volte
       *[other] { $missing } volte
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] È stata trovata una citazione.
    [many] Sono state trovate { $count } citazioni.
   *[other] Sono state trovate { $count } citazioni.
}
documents-found-made = { $count ->
    [one] È stata trovata una citazione, fatta da un programma che tiene i riferimenti.
    [many] Sono state trovate { $count } citazioni, tutte fatte da un programma che tiene i riferimenti.
   *[other] Sono state trovate { $count } citazioni, tutte fatte da un programma che tiene i riferimenti.
}
documents-found-some-made = Sono state trovate { $count } citazioni, { $made } delle quali fatte da un programma che tiene i riferimenti.
documents-at-once = Fai subito citazioni di quelle fatte da Zotero per opere che la tua biblioteca ha
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Una nota che non è altro che una citazione diventa una citazione nel rigo, che lo stile mette in nota o nel rigo; una nota che dice di più tiene la sua citazione. Ciò che hai scelto per le note nel pannello delle citazioni trovate, per tutte quelle che seguono, vale anche qui.
documents-go-through-map = Passa in rassegna le citazioni quando la mappa è fatta
documents-go-through-project = Passa in rassegna le citazioni quando il progetto è fatto

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Da sapere
documents-making = Creazione della mappa…
documents-make-map = Fai la mappa
documents-make-project = Fai il progetto
documents-map-failed = La mappa non si è potuta fare.
