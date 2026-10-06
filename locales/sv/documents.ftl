# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Ett dokument att hämta in
documents-filter = Dokument
documents-filter-all = Alla filer
documents-title-map = En karta av ett dokument
documents-title-project = Ett projekt av ett dokument
documents-reading = Läser { $file }…
documents-reading-hint = Ett långt dokument tar en stund.
documents-no-pandoc = Dokument av det här slaget läses av Pandoc, som inte är installerat eller inte kunde hittas. Var det finns kan anges i inställningarna.
documents-unread = Filen kunde inte läsas.
documents-title = Titel
documents-title-hint-map = Namnet på kartan, och på elementet i dess mitt.
documents-title-hint-project = Namnet på projektet, på dess karta, och på elementet i kartans mitt.
# What a project made of a document is called when the document has no title.
documents-untitled = Utan titel

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
    [one] Not
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
    [one] Ekvation
   *[other] Ekvationer
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Verk i ditt bibliotek hänvisas till { $cited ->
        [1] en gång
        [2] två gånger
       *[other] { $cited } gånger
    }.
documents-cited-not-in-library = Verk som inte finns i ditt bibliotek hänvisas till { $missing ->
        [1] en gång
        [2] två gånger
       *[other] { $missing } gånger
    }.
documents-cited-both = Verk i ditt bibliotek hänvisas till { $cited ->
        [1] en gång
        [2] två gånger
       *[other] { $cited } gånger
    }, verk som inte finns där { $missing ->
        [1] en gång
        [2] två gånger
       *[other] { $missing } gånger
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] En källhänvisning hittades.
   *[other] { $count } källhänvisningar hittades.
}
documents-found-made = { $count ->
    [one] En källhänvisning hittades, gjord av ett program som håller referenser.
   *[other] { $count } källhänvisningar hittades, alla gjorda av ett program som håller referenser.
}
documents-found-some-made = { $count } källhänvisningar hittades, { $made } av dem gjorda av ett program som håller referenser.
documents-at-once = Gör genast källhänvisningar av dem som Zotero gjort till verk som ditt bibliotek har
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = En not som inte är annat än en källhänvisning blir en källhänvisning i raden, som referensstilen sätter i en not eller i raden; en not som säger mer behåller sin källhänvisning. Det du har valt för noter i panelen med hittade källhänvisningar, för alla som följer, gäller här också.
documents-go-through-map = Gå igenom källhänvisningarna när kartan görs
documents-go-through-project = Gå igenom källhänvisningarna när projektet görs

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Att veta
documents-making = Gör kartan…
documents-make-map = Gör kartan
documents-make-project = Gör projektet
documents-map-failed = Kartan kunde inte göras.
