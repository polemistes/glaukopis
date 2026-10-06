# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Usati spesso
library-form-add-field = Aggiungi un campo
library-form-citation-key = Chiave di citazione
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = fatta da autore e anno
library-form-date-problem = Scrivi una data come 1979, 1979-05 o 1979-05-12; un intervallo come 1979/1985.
library-form-remove-field = Togli { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Istituzione o altro nome tenuto intero
library-names-prefix-suffix = Prefisso e suffisso
    .hint = «van», «de la» · «Jr.», «III»
library-names-move-up = Sposta su
library-names-move-down = Sposta giù
library-names-more = Altro per questo nome
library-names-name = Nome
library-names-name-of = { $role }: nome
library-names-family = Cognome
library-names-family-of = { $role }: cognome
library-names-given = Nomi
library-names-given-of = { $role }: nomi
library-names-prefix = Prefisso: van, de la
library-names-prefix-of = { $role }: prefisso
library-names-suffix = Suffisso: Jr., III
library-names-suffix-of = { $role }: suffisso

## Words for references, wherever they are shown.

library-untitled = Senza titolo
library-no-author = Senza autore
library-no-title = Senza titolo
library-in-library = Nella tua biblioteca

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = lo stesso DOI
library-reason-isbn = lo stesso ISBN
library-reason-identical = uguale in tutto ciò che distingue un'opera da un'altra
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] titolo, autore e anno uguali
            [like] lo stesso titolo e autore, un anno di differenza
           *[none] lo stesso titolo e autore, l'anno solo su uno dei due
        }
        [like] { $year ->
            [same] lo stesso titolo e anno, e un autore in comune
            [like] lo stesso titolo, un autore in comune, un anno di differenza
           *[none] lo stesso titolo, un autore in comune, l'anno solo su uno dei due
        }
       *[none] { $year ->
            [same] lo stesso titolo e anno, l'autore solo su uno dei due
            [like] lo stesso titolo, un anno di differenza, l'autore solo su uno dei due
           *[none] lo stesso titolo, autore e anno solo su uno dei due
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] lo stesso autore e anno, e un titolo simile
            [like] lo stesso autore, un titolo simile, un anno di differenza
           *[none] lo stesso autore, un titolo simile, l'anno solo su uno dei due
        }
        [like] { $year ->
            [same] lo stesso anno, un titolo simile, un autore in comune
            [like] un titolo simile, un autore in comune, un anno di differenza
           *[none] un titolo simile, un autore in comune, l'anno solo su uno dei due
        }
       *[none] { $year ->
            [same] lo stesso anno, un titolo simile, l'autore solo su uno dei due
            [like] un titolo simile, un anno di differenza, l'autore solo su uno dei due
           *[none] un titolo simile, autore e anno solo su uno dei due
        }
    }
}
library-reason-file = lo stesso file
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } e { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Questo è già nella tua biblioteca.
library-duplicate-probable = Questo potrebbe essere già nella tua biblioteca.
library-duplicate-use = Usa questo

## Duplicates in the library.

library-duplicates-title = Doppioni
library-duplicates-count = { $count ->
    [one] { $count } riferimento sembra essere nella biblioteca più di una volta
    [many] { $count } riferimenti sembrano essere nella biblioteca più di una volta
   *[other] { $count } riferimenti sembrano essere nella biblioteca più di una volta
}
library-duplicates-none = Nessun doppione
    .text = Nessun riferimento sembra essere nella biblioteca più di una volta.
library-duplicates-no-more = Nessun altro doppione
    .text = Le citazioni dei riferimenti che sono stati uniti citano ora quelli che sono stati tenuti.
library-duplicates-how = Quando i riferimenti si uniscono in uno, quello che tieni riceve dagli altri ciò che gli manca, e tiene il suo dove differiscono. I loro file e le loro raccolte sono messi insieme, e ciò che li cita cita quello tenuto.
library-duplicates-same = Uguali
library-duplicates-probably-same = Probabilmente uguali
library-duplicates-keep-which = Quello da tenere
library-duplicates-kept = Tenuto
library-duplicates-different = Sono diversi
library-duplicates-merge = Uniscili in uno
library-duplicates-merging = Unione in corso…
library-duplicates-failed = Non si sono potuti cercare i doppioni nella biblioteca
library-duplicates-merge-failed = Non si sono potuti unire

## Importing references: what a file holds, against what the library has.

library-import = Importa
library-import-title = Importa riferimenti
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } riferimento in { $source }
    [many] { $count } riferimenti in { $source }
   *[other] { $count } riferimenti in { $source }
}
library-import-review = { $count ->
    [one] { $count } riferimento potrebbe essere già nella tua biblioteca
    [many] { $count } riferimenti potrebbero essere già nella tua biblioteca
   *[other] { $count } riferimenti potrebbero essere già nella tua biblioteca
}
library-import-new = { $count ->
    [one] { $count } riferimento nuovo
    [many] { $count } riferimenti nuovi
   *[other] { $count } riferimenti nuovi
}
library-import-complete = { $count ->
    [one] { $count } riferimento già nella tua biblioteca si arricchisce di dati
    [many] { $count } riferimenti già nella tua biblioteca si arricchiscono di dati
   *[other] { $count } riferimenti già nella tua biblioteca si arricchiscono di dati
}
library-import-known = { $count ->
    [one] { $count } riferimento già nella tua biblioteca
    [many] { $count } riferimenti già nella tua biblioteca
   *[other] { $count } riferimenti già nella tua biblioteca
}
library-import-repeated = { $count ->
    [one] { $count } riferimento ripetuto nell'importazione
    [many] { $count } riferimenti ripetuti nell'importazione
   *[other] { $count } riferimenti ripetuti nell'importazione
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Riceverebbe: { $fields }
library-import-gains-file = File
library-import-gains-zotero = La sua chiave in Zotero
library-import-what-to-do = Che cosa fare
library-import-merge = Stessa opera: completa quello che ho
library-import-skip = Stessa opera: lascia il mio com'è
library-import-add = Un'altra opera: aggiungila
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = Per tutti i { $count } che sono uguali:
library-import-all-probable = Per tutti i { $count } che sono probabilmente uguali:
library-import-all-merge = Completa quelli che ho
library-import-all-skip = Lascia i miei come sono
library-import-all-add = Aggiungili comunque
library-import-more = …e altri { $count }.
library-import-unread = { $count ->
    [one] { $count } parte del file non si è potuta leggere
    [many] { $count } parti del file non si sono potute leggere
   *[other] { $count } parti del file non si sono potute leggere
}
library-import-importing = Importazione…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } da aggiungere{ $merge ->
        [0] {""}
       *[other] , { $merge } da completare
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } lasciati fuori
    }
library-import-failed = L'importazione non è riuscita.

## The library: the list of references, and what can be done with them.

library-references = Riferimenti
library-unread = La biblioteca non si è potuta leggere
library-all-references = Tutti i riferimenti
library-count = { $count ->
    [one] { $count } riferimento
    [many] { $count } riferimenti
   *[other] { $count } riferimenti
}
library-selected = { $count ->
    [one] { $count } riferimento selezionato
    [many] { $count } riferimenti selezionati
   *[other] { $count } riferimenti selezionati
}
library-selected-of = { $count ->
    [one] { $selected } di { $count } riferimento selezionato
    [many] { $selected } di { $count } riferimenti selezionati
   *[other] { $selected } di { $count } riferimenti selezionati
}
library-new-reference = Nuovo riferimento
library-search = Cerca nella biblioteca
library-search-in = Cerca in { $name }
library-search-clear = Azzera la ricerca
library-sort = Ordina
library-sort-author = Autore
library-sort-year = Anno
library-sort-title = Titolo
library-sort-added = Data di aggiunta
library-sort-modified = Data di modifica
library-sort-descending = Decrescente

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filtra
library-filters-on = { $count ->
    [one] Filtri: { $count } attivo
    [many] Filtri: { $count } attivi
   *[other] Filtri: { $count } attivi
}
library-filter-kind = Tipo
library-filter-publisher = Editore
library-filter-publisher-hint = Parte del nome
library-filter-any-publisher = Qualunque editore
library-filter-year = Anno
library-filter-from = Da
library-filter-to = A
library-filter-clear = Azzera i filtri
library-filter-nothing-here = Qui non c'è nulla da filtrare.
# When the filters let nothing through.
library-nothing-passes = Nessun riferimento in vista passa i filtri.
library-import-export = Importa ed esporta
library-import-file = Importa un file…
    .hint = BibLaTeX o BibTeX
library-paste = Incolla riferimenti…
library-add-pdfs = Aggiungi file PDF…
    .hint = Ciascuno è cercato in rete, e conservato
library-import-zotero = Importa da Zotero…
library-find-duplicates = Trova i doppioni…
library-map-library = Una mappa della biblioteca…
library-map-collection = Una mappa di «{ $name }»…
library-export-library = Esporta la biblioteca…
library-export-collection = Esporta «{ $name }»…
library-export-one = Esporta…
library-export-many = { $count ->
    [one] Esporta { $count } riferimento…
    [many] Esporta { $count } riferimenti…
   *[other] Esporta { $count } riferimenti…
}
library-export-title = Esporta riferimenti
# What a file of exported references is called, before it is given a name.
library-export-file-references = riferimenti
library-export-file-library = biblioteca
library-exported = { $count ->
    [one] { $count } riferimento esportato
    [many] { $count } riferimenti esportati
   *[other] { $count } riferimenti esportati
}
library-export-failed = L'esportazione non è riuscita
library-empty = La tua biblioteca è vuota
    .text = I riferimenti che aggiungi qui sono disponibili in tutti i tuoi progetti. Comincia con uno, o porta dentro quelli che hai già.
library-collection-empty = Ancora nulla in questa raccolta
    .text = Trascina qui dei riferimenti dalla biblioteca, o aggiungine uno nuovo.
library-nothing-found = Nulla di trovato
    .text = Nessun riferimento contiene tutte queste parole.
library-open-file = Apri il file
library-file-open-failed = Il file non si è potuto aprire
library-add-to-collection = Aggiungi a una raccolta
library-remove-from = Togli da «{ $name }»
library-copy-key = Copia la chiave di citazione
library-copied-key = Copiata «{ $key }»
library-copy-biblatex = Copia come BibLaTeX
library-copied = Copiato
library-delete-one-title = Eliminare «{ $name }»?
library-delete-many-title = { $count ->
    [one] Eliminare { $count } riferimento?
    [many] Eliminare { $count } riferimenti?
   *[other] Eliminare { $count } riferimenti?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Questo toglie il riferimento dalla tua biblioteca, da ogni raccolta{ $files ->
        [0] {""}
        [one] , insieme a { $files } file allegato
        [many] , insieme a { $files } file allegati
       *[other] , insieme a { $files } file allegati
    }.{ $projects ->
        [0] {""}
        [one] {" "}È citato in un progetto, che ne tiene una copia.
        [many] {" "}È citato in { $projects } progetti, che ne tengono una copia.
       *[other] {" "}È citato in { $projects } progetti, che ne tengono una copia.
    }
library-delete-many = Questo li toglie dalla tua biblioteca, da ogni raccolta{ $files ->
        [0] {""}
        [one] , insieme a { $files } file allegato
        [many] , insieme a { $files } file allegati
       *[other] , insieme a { $files } file allegati
    }.{ $projects ->
        [0] {""}
        [one] {" "}Un progetto che ne cita alcuni ne tiene una copia.
        [many] {" "}{ $projects } progetti che ne citano alcuni ne tengono una copia.
       *[other] {" "}{ $projects } progetti che ne citano alcuni ne tengono una copia.
    }
library-delete-failed = I riferimenti non si sono potuti eliminare
library-not-done = Questo non si è potuto fare

## Collections.

library-collections = Raccolte
# The projects that cite a work, in its pane.
library-cited-in = Citato in
library-not-cited = Non citato in nessun progetto.
library-cited-reading = Lettura dei progetti…
library-collections-hint = Le raccolte riuniscono riferimenti per un argomento o per un lavoro. Un riferimento può stare in quante se ne vuole.
library-collection-new = Nuova raccolta
library-collection-new-inside = Nuova raccolta dentro
library-collection-new-under = Nuova raccolta in «{ $name }»
library-collection-move-to = Sposta in
library-collection-name = Nome della raccolta
library-collection-name-failed = Non si è potuto dare un nome alla raccolta
library-collection-expand = Espandi
library-collection-collapse = Contrai
library-collection-to-top = Sposta al livello più alto
library-collection-move-failed = La raccolta non si è potuta spostare
library-collection-added = { $count ->
    [one] { $count } riferimento aggiunto a «{ $name }»
    [many] { $count } riferimenti aggiunti a «{ $name }»
   *[other] { $count } riferimenti aggiunti a «{ $name }»
}
library-collection-already = Già in «{ $name }»
library-collection-delete = Elimina la raccolta
library-collection-delete-title = Eliminare la raccolta «{ $name }»?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] I riferimenti restano nella tua biblioteca.
   *[other] Anche le raccolte al suo interno sono eliminate. I riferimenti restano nella tua biblioteca.
}
library-collection-delete-failed = La raccolta non si è potuta eliminare
library-collection-count = { $count ->
    [one] { $count } raccolta
    [many] { $count } raccolte
   *[other] { $count } raccolte
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Una mappa della biblioteca
library-map-title-collection = Una mappa di una raccolta
# The name a project made of the whole library is given.
library-map-library-name = La biblioteca
library-map-name = Nome
library-map-name-hint = Il nome del progetto, della sua mappa, e dell'elemento al centro della mappa.
library-map-what-library = Le raccolte diventano elementi, annidate come sono, e ogni riferimento un elemento sotto la sua raccolta, il cui testo è una citazione di esso. I riferimenti che non sono in nessuna raccolta stanno al centro.
library-map-what-collection = Le raccolte al suo interno diventano elementi, annidate come sono, e ogni riferimento un elemento sotto la sua raccolta, il cui testo è una citazione di esso.
library-map-nothing = Non ci sono riferimenti da mettere sulla mappa.
library-map-make = Fai il progetto
library-map-making = Creazione del progetto…
library-map-failed = Il progetto non si è potuto fare.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } file
    [many] { $count } file
   *[other] { $count } file
}
library-open-failed = Il riferimento non si è potuto aprire
library-known = { $count ->
    [one] È già nella tua biblioteca
    [many] Sono già nella tua biblioteca
   *[other] Sono già nella tua biblioteca
}
library-nothing-to-import = Nulla da importare
library-none-found = Non è stato trovato nessun riferimento.
library-import-kinds = I riferimenti si leggono dai file .bib, e si fanno dai file PDF.
library-filter-bib = BibLaTeX e BibTeX
library-filter-all = Tutti i file
library-files-read-failed = { $count ->
    [one] Il file non si è potuto leggere
    [many] I file non si sono potuti leggere
   *[other] I file non si sono potuti leggere
}
library-text-read-failed = Il testo non si è potuto leggere
library-add-pdfs-title = Aggiungi file PDF
library-pdfs-working = { $count ->
    [one] Si cerca di capire che cos'è il file…
    [many] Si cerca di capire che cosa sono i { $count } file…
   *[other] Si cerca di capire che cosa sono i { $count } file…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } di { $count }: { $name }
library-stop = Ferma
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } riferimento aggiunto
    [many] { $count } riferimenti aggiunti
   *[other] { $count } riferimenti aggiunti
}
library-imported-completed = { $count ->
    [one] { $count } completato
    [many] { $count } completati
   *[other] { $count } completati
}
library-imported-skipped = { $count } già nella biblioteca
library-imported-files = { $count ->
    [one] { $count } file conservato
    [many] { $count } file conservati
   *[other] { $count } file conservati
}
library-imported-nothing = Non è stato cambiato nulla
library-paste-title = Incolla riferimenti
library-paste-subtitle = BibLaTeX o BibTeX, quante voci vuoi
library-paste-continue = Continua
library-source-label = Sorgente BibLaTeX

## Importing from Zotero.

library-zotero-title = Importa da Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Su questo computer non è stato trovato nessuno Zotero nei posti dove di solito tiene i suoi dati. Se li tiene altrove, mostra dove: la cartella che contiene { $file }.
library-zotero-lead = Ciò che si importa è copiato nella tua biblioteca, con i suoi file. Zotero è soltanto letto, e nulla di suo è cambiato; può restare aperto nel frattempo.
library-zotero-choose = La cartella dei dati di Zotero
library-zotero-none-there = Lì non c'è nessuno Zotero.
library-zotero-unread = Zotero non si è potuto leggere.
library-zotero-library = Biblioteca
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = La mia biblioteca
library-zotero-what = Che cosa importare
library-zotero-everything = Tutto
library-zotero-with-files = Con i file allegati
library-zotero-with-notes = Con le note, come annotazioni
library-zotero-elsewhere = Un altro posto…
library-zotero-show-where = Mostra dove…
library-zotero-reading = Lettura…
library-zotero-read = { $count ->
    [0] Letto
    [one] Letto { $count } riferimento
    [many] Letti { $count } riferimenti
   *[other] Letti { $count } riferimenti
}

## Writing a reference.

library-dialog-edit = Modifica il riferimento
library-dialog-add = Aggiungi un riferimento
library-dialog-back = Torna al modulo
library-dialog-open-failed = Il riferimento non si è potuto aprire.
library-dialog-save-failed = Il riferimento non si è potuto salvare.
# The entry as BibLaTeX, as against the form.
library-source = Sorgente
library-source-unread = La sorgente non si è potuta leggere.

## A reference, beside the list.

library-pane-label = Riferimento
library-pane-more = Altro
library-pane-saved = Salvato
library-pane-editing = Modifica in corso…
library-pane-not-saved = Non salvato
library-pane-unread = Il riferimento non si è potuto leggere.
library-pane-save-failed = Le modifiche non si sono potute salvare.
library-pane-note-placeholder = Che cosa ne pensi. Per te: non fa parte di ciò che si cita.
library-pane-files = File
library-pane-attach = Allega
library-pane-attach-title = Allega file
library-pane-attach-failed = Il file non si è potuto allegare
# Of a file that is attached, and not where it should be.
library-pane-missing = mancante
library-pane-reveal = Mostra nel gestore dei file
library-pane-reveal-failed = La cartella non si è potuta aprire
library-pane-no-files = Nessun file. Allega un PDF, o lascialo cadere qui.
library-pane-detach = Togli il file
library-pane-detach-title = Togliere «{ $name }»?
library-pane-detach-message = Il file è eliminato dal deposito della biblioteca, a meno che un altro riferimento non lo usi.
library-pane-detach-failed = Il file non si è potuto togliere
library-pane-leave-collection = Togli da { $name }
library-pane-duplicate = Duplica
    .hint = Un nuovo riferimento che comincia con questi dati
library-pane-edit-source = Modifica la sorgente…
library-pane-source-subtitle = La voce come BibLaTeX. Quasi tutto è più facile nel modulo.
library-pane-source-failed = La sorgente non si è potuta mostrare
library-pane-added = Aggiunto il { $date }
library-pane-added-changed = Aggiunto il { $added } · modificato il { $changed }

## Looking up a reference.

library-lookup-placeholder = Cercalo in rete: un DOI, un ISBN, o parole del titolo e dell'autore
library-lookup-label = Cerca un riferimento in rete
library-lookup-failed = Non si è potuto cercare nulla.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Compilato da { $source }.
library-lookup-others = { $count ->
    [one] { $count } altro record
    [many] { $count } altri record
   *[other] { $count } altri record
}
library-lookup-scope = Che cosa cercare
library-lookup-any = Qualunque cosa
library-lookup-books = Libri
library-lookup-articles = Articoli
library-lookup-none = Non è stato trovato nulla. Meno parole possono trovare di più: il cognome dell'autore e una o due parole del titolo.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Di questo { $kind ->
        [doi] DOI
        [isbn] ISBN
        [arxiv] numero di arXiv
       *[pmid] numero di PubMed
    } non si sa nulla dove è stato chiesto. Il riferimento si può inserire a mano qui sotto.

## What the writer writes about a work.

library-notes = Note
library-notes-yours = Le tue note
library-notes-on-work = Le tue note su quest'opera
library-notes-read = Leggi le tue note
library-notes-write = Scrivi una nota
library-notes-write-on-work = Scrivi una nota su quest'opera
library-notes-not-in-library = Un riferimento che non è nella tua biblioteca
library-notes-this-project = In questo progetto
library-notes-all-projects = In tutti i progetti
library-notes-project-placeholder = Che cosa ne pensi, per questo lavoro
library-notes-all-placeholder = Che cosa ne pensi, ovunque lo citi
library-notes-keep-for-all = Tienila per tutti i progetti
library-notes-write-for-all = Scrivi per tutti i progetti
library-notes-carried = Il riferimento è venuto con il progetto, e non è nella tua biblioteca. Ciò che si scrive qui è presso tutti quelli che hanno il progetto.
library-notes-kept = Tenuta con il riferimento nella tua biblioteca. Va con un progetto che cita l'opera.
library-notes-unread = Le tue note non si sono potute leggere
library-notes-unsaved = La tua nota non si è potuta conservare
