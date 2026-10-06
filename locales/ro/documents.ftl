# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Un document de adus
documents-filter = Documente
documents-filter-all = Toate fișierele
documents-title-map = O hartă dintr-un document
documents-title-project = Un proiect dintr-un document
documents-reading = Se citește { $file }…
documents-reading-hint = Un document lung ia o clipă.
documents-no-pandoc = Documentele de acest fel sunt citite de Pandoc, care nu este instalat sau nu a putut fi găsit. Unde se află se poate spune în setări.
documents-unread = Fișierul nu s-a putut citi.
documents-title = Titlu
documents-title-hint-map = Numele hărții și al elementului din centrul ei.
documents-title-hint-project = Numele proiectului, al hărții lui și al elementului din centrul hărții.
# What a project made of a document is called when the document has no title.
documents-untitled = Fără titlu

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Parte
    [few] Părți
   *[other] Părți
}
documents-words = { $count ->
    [one] Cuvânt
    [few] Cuvinte
   *[other] Cuvinte
}
documents-notes = { $count ->
    [one] Notă
    [few] Note
   *[other] Note
}
documents-figures = { $count ->
    [one] Figură
    [few] Figuri
   *[other] Figuri
}
documents-tables = { $count ->
    [one] Tabel
    [few] Tabele
   *[other] Tabele
}
documents-equations = { $count ->
    [one] Ecuație
    [few] Ecuații
   *[other] Ecuații
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Lucrări din biblioteca dumneavoastră sunt citate { $cited ->
        [one] o dată
        [2] de două ori
        [few] de { $cited } ori
       *[other] de { $cited } de ori
    }.
documents-cited-not-in-library = Lucrări care nu sunt în biblioteca dumneavoastră sunt citate { $missing ->
        [one] o dată
        [2] de două ori
        [few] de { $missing } ori
       *[other] de { $missing } de ori
    }.
documents-cited-both = Lucrări din biblioteca dumneavoastră sunt citate { $cited ->
        [one] o dată
        [2] de două ori
        [few] de { $cited } ori
       *[other] de { $cited } de ori
    }, lucrări care nu sunt în ea { $missing ->
        [one] o dată
        [2] de două ori
        [few] de { $missing } ori
       *[other] de { $missing } de ori
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] S-a găsit o citare.
    [few] S-au găsit { $count } citări.
   *[other] S-au găsit { $count } de citări.
}
documents-found-made = { $count ->
    [one] S-a găsit o citare, făcută de un program care ține referințe.
    [few] S-au găsit { $count } citări, toate făcute de un program care ține referințe.
   *[other] S-au găsit { $count } de citări, toate făcute de un program care ține referințe.
}
documents-found-some-made = { $count ->
    [one] S-a găsit o citare, { $made } dintre ele făcute de un program care ține referințe.
    [few] S-au găsit { $count } citări, { $made } dintre ele făcute de un program care ține referințe.
   *[other] S-au găsit { $count } de citări, { $made } dintre ele făcute de un program care ține referințe.
}
documents-at-once = Fă dintr-odată citări din cele făcute de Zotero pentru lucrări pe care biblioteca le are
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = O notă care nu este decât o citare devine o citare în rând, pe care stilul de citare o așază într-o notă sau în rând; o notă care spune mai mult își păstrează citarea. Ce ați ales pentru note în panoul citărilor găsite, pentru toate cele care urmează, este valabil și aici.
documents-go-through-map = Parcurge citările când se face harta
documents-go-through-project = Parcurge citările când se face proiectul

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = De știut
documents-making = Se face harta…
documents-make-map = Fă harta
documents-make-project = Fă proiectul
documents-map-failed = Harta nu s-a putut face.
