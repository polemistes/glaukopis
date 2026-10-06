# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Folosite des
library-form-add-field = Adaugă un câmp
library-form-citation-key = Cheie de citare
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = făcută din autor și an
library-form-date-problem = Scrieți o dată ca 1979, 1979-05 sau 1979-05-12; un interval ca 1979/1985.
library-form-remove-field = Scoate { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Instituție sau alt nume păstrat întreg
library-names-prefix-suffix = Particulă și sufix
    .hint = „van”, „de la” · „Jr.”, „III”
library-names-move-up = Mută mai sus
library-names-move-down = Mută mai jos
library-names-more = Mai mult pentru acest nume
library-names-name = Nume
library-names-name-of = { $role }: nume
library-names-family = Nume de familie
library-names-family-of = { $role }: nume de familie
library-names-given = Prenume
library-names-given-of = { $role }: prenume
library-names-prefix = Particulă: van, de la
library-names-prefix-of = { $role }: particulă
library-names-suffix = Sufix: Jr., III
library-names-suffix-of = { $role }: sufix

## Words for references, wherever they are shown.

library-untitled = Fără titlu
library-no-author = Fără autor
library-no-title = Fără titlu
library-in-library = În biblioteca dumneavoastră

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = același DOI
library-reason-isbn = același ISBN
library-reason-identical = la fel în tot ce deosebește o lucrare de alta
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] același titlu, autor și an
            [like] același titlu și autor, la un an distanță
           *[none] același titlu și autor, anul numai la una dintre ele
        }
        [like] { $year ->
            [same] același titlu și an, și un autor comun
            [like] același titlu, un autor comun, la un an distanță
           *[none] același titlu, un autor comun, anul numai la una dintre ele
        }
       *[none] { $year ->
            [same] același titlu și an, autorul numai la una dintre ele
            [like] același titlu, la un an distanță, autorul numai la una dintre ele
           *[none] același titlu, autorul și anul numai la una dintre ele
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] același autor și an, și un titlu asemănător
            [like] același autor, un titlu asemănător, la un an distanță
           *[none] același autor, un titlu asemănător, anul numai la una dintre ele
        }
        [like] { $year ->
            [same] același an, un titlu asemănător, un autor comun
            [like] un titlu asemănător, un autor comun, la un an distanță
           *[none] un titlu asemănător, un autor comun, anul numai la una dintre ele
        }
       *[none] { $year ->
            [same] același an, un titlu asemănător, autorul numai la una dintre ele
            [like] un titlu asemănător, la un an distanță, autorul numai la una dintre ele
           *[none] un titlu asemănător, autorul și anul numai la una dintre ele
        }
    }
}
library-reason-file = același fișier
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } și { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Aceasta este deja în biblioteca dumneavoastră.
library-duplicate-probable = Aceasta s-ar putea să fie deja în biblioteca dumneavoastră.
library-duplicate-use = Folosește-o pe aceasta

## Duplicates in the library.

library-duplicates-title = Dubluri
library-duplicates-count = { $count ->
    [one] { $count } referință pare să fie în bibliotecă de mai multe ori
    [few] { $count } referințe par să fie în bibliotecă de mai multe ori
   *[other] { $count } de referințe par să fie în bibliotecă de mai multe ori
}
library-duplicates-none = Nicio dublură
    .text = Nicio referință nu pare să fie în bibliotecă de mai multe ori.
library-duplicates-no-more = Nicio altă dublură
    .text = Citările referințelor care au fost unite citează acum pe cele care au fost păstrate.
library-duplicates-how = Când referințele se fac una, cea pe care o păstrați primește de la celelalte ce îi lipsește și și le păstrează pe ale ei acolo unde se deosebesc. Fișierele și colecțiile lor se adună laolaltă, iar ce le citează citează pe cea păstrată.
library-duplicates-same = Aceeași
library-duplicates-probably-same = Probabil aceeași
library-duplicates-keep-which = Cea de păstrat
library-duplicates-kept = Păstrată
library-duplicates-different = Sunt diferite
library-duplicates-merge = Fă-le una
library-duplicates-merging = Se fac una…
library-duplicates-failed = Biblioteca nu s-a putut căuta de dubluri
library-duplicates-merge-failed = Nu s-au putut face una

## Importing references: what a file holds, against what the library has.

library-import = Importă
library-import-title = Importă referințe
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } referință în { $source }
    [few] { $count } referințe în { $source }
   *[other] { $count } de referințe în { $source }
}
library-import-review = { $count ->
    [one] { $count } referință s-ar putea să fie deja în biblioteca dumneavoastră
    [few] { $count } referințe s-ar putea să fie deja în biblioteca dumneavoastră
   *[other] { $count } de referințe s-ar putea să fie deja în biblioteca dumneavoastră
}
library-import-new = { $count ->
    [one] { $count } referință nouă
    [few] { $count } referințe noi
   *[other] { $count } de referințe noi
}
library-import-complete = { $count ->
    [one] { $count } referință deja în biblioteca dumneavoastră primește date
    [few] { $count } referințe deja în biblioteca dumneavoastră primesc date
   *[other] { $count } de referințe deja în biblioteca dumneavoastră primesc date
}
library-import-known = { $count ->
    [one] { $count } referință deja în biblioteca dumneavoastră
    [few] { $count } referințe deja în biblioteca dumneavoastră
   *[other] { $count } de referințe deja în biblioteca dumneavoastră
}
library-import-repeated = { $count ->
    [one] { $count } referință repetată în import
    [few] { $count } referințe repetate în import
   *[other] { $count } de referințe repetate în import
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Ar primi: { $fields }
library-import-gains-file = Fișier
library-import-gains-zotero = Cheia ei din Zotero
library-import-what-to-do = Ce să se facă
library-import-merge = Aceeași lucrare: completeaz-o pe a mea
library-import-skip = Aceeași lucrare: las-o pe a mea cum este
library-import-add = Altă lucrare: adaug-o
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = { $count ->
    [one] Pentru cea care este la fel:
    [few] Pentru toate cele { $count } care sunt la fel:
   *[other] Pentru toate cele { $count } care sunt la fel:
}
library-import-all-probable = { $count ->
    [one] Pentru cea care este probabil la fel:
    [few] Pentru toate cele { $count } care sunt probabil la fel:
   *[other] Pentru toate cele { $count } care sunt probabil la fel:
}
library-import-all-merge = Completează-le pe ale mele
library-import-all-skip = Lasă-le pe ale mele cum sunt
library-import-all-add = Adaugă-le oricum
library-import-more = …și încă { $count }.
library-import-unread = { $count ->
    [one] { $count } parte a fișierului nu s-a putut citi
    [few] { $count } părți ale fișierului nu s-au putut citi
   *[other] { $count } de părți ale fișierului nu s-au putut citi
}
library-import-importing = Se importă…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } de adăugat{ $merge ->
        [0] {""}
       *[other] , { $merge } de completat
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } lăsate afară
    }
library-import-failed = Importul a eșuat.

## The library: the list of references, and what can be done with them.

library-references = Referințe
library-unread = Biblioteca nu s-a putut citi
library-all-references = Toate referințele
library-count = { $count ->
    [one] { $count } referință
    [few] { $count } referințe
   *[other] { $count } de referințe
}
library-selected = { $count ->
    [one] { $count } referință selectată
    [few] { $count } referințe selectate
   *[other] { $count } de referințe selectate
}
library-selected-of = { $count ->
    [one] { $selected } din { $count } referință selectată
    [few] { $selected } din { $count } referințe selectate
   *[other] { $selected } din { $count } de referințe selectate
}
library-new-reference = Referință nouă
library-search = Caută în bibliotecă
library-search-in = Caută în { $name }
library-search-clear = Șterge căutarea
library-sort = Ordonează
library-sort-author = Autor
library-sort-year = An
library-sort-title = Titlu
library-sort-added = Data adăugării
library-sort-modified = Data modificării
library-sort-descending = Descrescător

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filtrează
library-filters-on = { $count ->
    [one] Filtru: unul activ
    [few] Filtru: { $count } active
   *[other] Filtru: { $count } active
}
library-filter-kind = Tip
library-filter-publisher = Editură
library-filter-publisher-hint = O parte din nume
library-filter-any-publisher = Orice editură
library-filter-year = An
library-filter-from = De la
library-filter-to = Până la
library-filter-clear = Șterge filtrele
library-filter-nothing-here = Nimic de filtrat aici.
# When the filters let nothing through.
library-nothing-passes = Nicio referință din cele arătate nu trece de filtre.
library-import-export = Import și export
library-import-file = Importă un fișier…
    .hint = BibLaTeX sau BibTeX
library-paste = Lipește referințe…
library-add-pdfs = Adaugă fișiere PDF…
    .hint = Fiecare este căutat pe internet și păstrat
library-import-zotero = Importă din Zotero…
library-find-duplicates = Găsește dublurile…
library-map-library = O hartă a bibliotecii…
library-map-collection = O hartă a colecției „{ $name }”…
library-export-library = Exportă biblioteca…
library-export-collection = Exportă „{ $name }”…
library-export-one = Exportă…
library-export-many = { $count ->
    [one] Exportă { $count } referință…
    [few] Exportă { $count } referințe…
   *[other] Exportă { $count } de referințe…
}
library-export-title = Exportă referințe
# What a file of exported references is called, before it is given a name.
library-export-file-references = referinte
library-export-file-library = biblioteca
library-exported = { $count ->
    [one] { $count } referință exportată
    [few] { $count } referințe exportate
   *[other] { $count } de referințe exportate
}
library-export-failed = Exportul a eșuat
library-empty = Biblioteca dumneavoastră este goală
    .text = Referințele pe care le adăugați aici sunt la îndemână în toate proiectele. Începeți cu una, sau aduceți-le pe cele pe care le aveți deja.
library-collection-empty = Nimic în această colecție încă
    .text = Trageți aici referințe din bibliotecă, sau adăugați una nouă.
library-nothing-found = Nu s-a găsit nimic
    .text = Nicio referință nu cuprinde toate aceste cuvinte.
library-open-file = Deschide fișierul
library-file-open-failed = Fișierul nu s-a putut deschide
library-add-to-collection = Adaugă la colecție
library-remove-from = Scoate din „{ $name }”
library-copy-key = Copiază cheia de citare
library-copied-key = S-a copiat „{ $key }”
library-copy-biblatex = Copiază ca BibLaTeX
library-copied = Copiat
library-delete-one-title = Ștergeți „{ $name }”?
library-delete-many-title = { $count ->
    [one] Ștergeți { $count } referință?
    [few] Ștergeți { $count } referințe?
   *[other] Ștergeți { $count } de referințe?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Aceasta scoate referința din biblioteca dumneavoastră, din fiecare colecție{ $files ->
        [0] {""}
        [one] , împreună cu { $files } fișier atașat
        [few] , împreună cu { $files } fișiere atașate
       *[other] , împreună cu { $files } de fișiere atașate
    }.{ $projects ->
        [0] {""}
        [one] {" "}Este citată într-un proiect, care păstrează o copie a ei.
        [few] {" "}Este citată în { $projects } proiecte, care păstrează o copie a ei.
       *[other] {" "}Este citată în { $projects } de proiecte, care păstrează o copie a ei.
    }
library-delete-many = Aceasta le scoate din biblioteca dumneavoastră, din fiecare colecție{ $files ->
        [0] {""}
        [one] , împreună cu { $files } fișier atașat
        [few] , împreună cu { $files } fișiere atașate
       *[other] , împreună cu { $files } de fișiere atașate
    }.{ $projects ->
        [0] {""}
        [one] {" "}Un proiect care citează unele dintre ele păstrează o copie a acelora.
        [few] {" "}{ $projects } proiecte care citează unele dintre ele păstrează o copie a acelora.
       *[other] {" "}{ $projects } de proiecte care citează unele dintre ele păstrează o copie a acelora.
    }
library-delete-failed = Referințele nu s-au putut șterge
library-not-done = Asta nu s-a putut face

## Collections.

library-collections = Colecții
# The projects that cite a work, in its pane.
library-cited-in = Citată în
library-not-cited = Nu este citată în niciun proiect.
library-cited-reading = Se citesc proiectele…
library-collections-hint = Colecțiile adună referințe pentru un subiect sau o lucrare. O referință poate fi în oricâte.
library-collection-new = Colecție nouă
library-collection-new-inside = Colecție nouă înăuntru
library-collection-new-under = Colecție nouă în „{ $name }”
library-collection-move-to = Mută în
library-collection-name = Numele colecției
library-collection-name-failed = Colecția nu s-a putut numi
library-collection-expand = Desfă
library-collection-collapse = Strânge
library-collection-to-top = Mută la nivelul de sus
library-collection-move-failed = Colecția nu s-a putut muta
library-collection-added = { $count ->
    [one] { $count } referință adăugată la „{ $name }”
    [few] { $count } referințe adăugate la „{ $name }”
   *[other] { $count } de referințe adăugate la „{ $name }”
}
library-collection-already = Deja în „{ $name }”
library-collection-delete = Șterge colecția
library-collection-delete-title = Ștergeți colecția „{ $name }”?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Referințele rămân în biblioteca dumneavoastră.
   *[other] Colecțiile dinăuntrul ei se șterg și ele. Referințele rămân în biblioteca dumneavoastră.
}
library-collection-delete-failed = Colecția nu s-a putut șterge
library-collection-count = { $count ->
    [one] { $count } colecție
    [few] { $count } colecții
   *[other] { $count } de colecții
}

## A map of the library, or of a collection: a new project.

library-map-title-library = O hartă a bibliotecii
library-map-title-collection = O hartă a unei colecții
# The name a project made of the whole library is given.
library-map-library-name = Biblioteca
library-map-name = Nume
library-map-name-hint = Numele proiectului, al hărții lui și al elementului din centrul hărții.
library-map-what-library = Colecțiile devin elemente, îmbucate cum sunt, și fiecare referință un element sub colecția ei, al cărui text este o citare a ei. Referințele din nicio colecție stau la centru.
library-map-what-collection = Colecțiile dinăuntrul ei devin elemente, îmbucate cum sunt, și fiecare referință un element sub colecția ei, al cărui text este o citare a ei.
library-map-nothing = Nu sunt referințe de pus pe hartă.
library-map-make = Fă proiectul
library-map-making = Se face proiectul…
library-map-failed = Proiectul nu s-a putut face.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } fișier
    [few] { $count } fișiere
   *[other] { $count } de fișiere
}
library-open-failed = Referința nu s-a putut deschide
library-known = { $count ->
    [one] Este deja în biblioteca dumneavoastră
    [few] Sunt deja în biblioteca dumneavoastră
   *[other] Sunt deja în biblioteca dumneavoastră
}
library-nothing-to-import = Nimic de importat
library-none-found = Nu s-a găsit nicio referință.
library-import-kinds = Referințele se citesc din fișiere .bib și se fac din fișiere PDF.
library-filter-bib = BibLaTeX și BibTeX
library-filter-all = Toate fișierele
library-files-read-failed = { $count ->
    [one] Fișierul nu s-a putut citi
    [few] Fișierele nu s-au putut citi
   *[other] Fișierele nu s-au putut citi
}
library-text-read-failed = Textul nu s-a putut citi
library-add-pdfs-title = Adaugă fișiere PDF
library-pdfs-working = { $count ->
    [one] Se află ce este fișierul…
    [few] Se află ce sunt cele { $count } fișiere…
   *[other] Se află ce sunt cele { $count } de fișiere…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } din { $count }: { $name }
library-stop = Oprește
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } referință adăugată
    [few] { $count } referințe adăugate
   *[other] { $count } de referințe adăugate
}
library-imported-completed = { $count ->
    [one] una completată
    [few] { $count } completate
   *[other] { $count } completate
}
library-imported-skipped = { $count ->
    [one] una deja în bibliotecă
    [few] { $count } deja în bibliotecă
   *[other] { $count } deja în bibliotecă
}
library-imported-files = { $count ->
    [one] { $count } fișier păstrat
    [few] { $count } fișiere păstrate
   *[other] { $count } de fișiere păstrate
}
library-imported-nothing = Nu s-a schimbat nimic
library-paste-title = Lipește referințe
library-paste-subtitle = BibLaTeX sau BibTeX, oricâte intrări doriți
library-paste-continue = Continuă
library-source-label = Sursă BibLaTeX

## Importing from Zotero.

library-zotero-title = Importă din Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Nu s-a găsit niciun Zotero pe acest calculator în locurile unde își ține de obicei datele. Dacă le ține altundeva, arătați unde: dosarul care cuprinde { $file }.
library-zotero-lead = Ce se importă se copiază în biblioteca dumneavoastră, cu fișierele lui. Zotero este doar citit, și nimic din el nu se schimbă; poate rămâne deschis între timp.
library-zotero-choose = Dosarul de date al lui Zotero
library-zotero-none-there = Nu este niciun Zotero acolo.
library-zotero-unread = Zotero nu s-a putut citi.
library-zotero-library = Bibliotecă
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Biblioteca mea
library-zotero-what = Ce să se importe
library-zotero-everything = Tot
library-zotero-with-files = Cu fișierele atașate
library-zotero-with-notes = Cu notele, ca adnotări
library-zotero-elsewhere = Alt loc…
library-zotero-show-where = Arată unde…
library-zotero-reading = Se citește…
library-zotero-read = { $count ->
    [0] Citește
    [one] Citește { $count } referință
    [few] Citește { $count } referințe
   *[other] Citește { $count } de referințe
}

## Writing a reference.

library-dialog-edit = Modifică referința
library-dialog-add = Adaugă o referință
library-dialog-back = Înapoi la formular
library-dialog-open-failed = Referința nu s-a putut deschide.
library-dialog-save-failed = Referința nu s-a putut salva.
# The entry as BibLaTeX, as against the form.
library-source = Sursă
library-source-unread = Sursa nu s-a putut citi.

## A reference, beside the list.

library-pane-label = Referință
library-pane-more = Mai mult
library-pane-saved = Salvată
library-pane-editing = Se modifică…
library-pane-not-saved = Nesalvată
library-pane-unread = Referința nu s-a putut citi.
library-pane-save-failed = Modificările nu s-au putut salva.
library-pane-note-placeholder = Ce credeți despre ea. Pentru dumneavoastră: nu face parte din ce se citează.
library-pane-files = Fișiere
library-pane-attach = Atașează
library-pane-attach-title = Atașează fișiere
library-pane-attach-failed = Fișierul nu s-a putut atașa
# Of a file that is attached, and not where it should be.
library-pane-missing = lipsește
library-pane-reveal = Arată în gestionarul de fișiere
library-pane-reveal-failed = Dosarul nu s-a putut deschide
library-pane-no-files = Niciun fișier. Atașați un PDF, sau trageți unul aici.
library-pane-detach = Scoate fișierul
library-pane-detach-title = Scoateți „{ $name }”?
library-pane-detach-message = Fișierul se șterge din depozitul bibliotecii, dacă nu îl folosește altă referință.
library-pane-detach-failed = Fișierul nu s-a putut scoate
library-pane-leave-collection = Scoate din { $name }
library-pane-duplicate = Dublează
    .hint = O referință nouă care începe cu aceste date
library-pane-edit-source = Modifică sursa…
library-pane-source-subtitle = Intrarea ca BibLaTeX. Cele mai multe lucruri sunt mai ușoare în formular.
library-pane-source-failed = Sursa nu s-a putut arăta
library-pane-added = Adăugată { $date }
library-pane-added-changed = Adăugată { $added } · modificată { $changed }

## Looking up a reference.

library-lookup-placeholder = Căutați-o pe internet: un DOI, un ISBN sau cuvinte din titlu și autorul
library-lookup-label = Caută o referință pe internet
library-lookup-failed = Nu s-a putut căuta nimic.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Completată de la { $source }.
library-lookup-others = { $count ->
    [one] { $count } altă înregistrare
    [few] { $count } alte înregistrări
   *[other] { $count } de alte înregistrări
}
library-lookup-scope = Ce să se caute
library-lookup-any = Orice
library-lookup-books = Cărți
library-lookup-articles = Articole
library-lookup-none = Nu s-a găsit nimic. Mai puține cuvinte pot găsi mai mult: numele de familie al autorului și un cuvânt sau două din titlu.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Nu se știe nimic despre acest { $kind ->
        [doi] DOI
        [isbn] ISBN
        [arxiv] număr arXiv
       *[pmid] număr PubMed
    } acolo unde a fost cerut. Referința poate fi introdusă de mână mai jos.

## What the writer writes about a work.

library-notes = Note
library-notes-yours = Notele dumneavoastră
library-notes-on-work = Notele dumneavoastră despre această lucrare
library-notes-read = Citiți notele dumneavoastră
library-notes-write = Scrie o notă
library-notes-write-on-work = Scrie o notă despre această lucrare
library-notes-not-in-library = O referință care nu este în biblioteca dumneavoastră
library-notes-this-project = În acest proiect
library-notes-all-projects = În toate proiectele
library-notes-project-placeholder = Ce credeți despre ea, pentru această lucrare
library-notes-all-placeholder = Ce credeți despre ea, oriunde o citați
library-notes-keep-for-all = Păstreaz-o pentru toate proiectele
library-notes-write-for-all = Scrie pentru toate proiectele
library-notes-carried = Referința a venit cu proiectul și nu este în biblioteca dumneavoastră. Ce se scrie aici este la toți cei care au proiectul.
library-notes-kept = Păstrată cu referința în biblioteca dumneavoastră. Merge cu un proiect care citează lucrarea.
library-notes-unread = Notele dumneavoastră nu s-au putut citi
library-notes-unsaved = Nota dumneavoastră nu s-a putut păstra
