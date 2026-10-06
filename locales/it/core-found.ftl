# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = la stessa voce in Zotero
core-found-same-key = la stessa chiave di citazione
core-found-earlier-key = una chiave di citazione che aveva prima
core-found-same-doi = lo stesso DOI
core-found-same-isbn = lo stesso ISBN
core-found-alike-in-all = uguale in tutto ciò che distingue un'opera da un'altra
core-found-same-doi-other-title = lo stesso DOI, e un altro titolo
core-found-same-isbn-other-title = lo stesso ISBN, e un altro titolo
core-found-same-title-author-year = titolo, autore e anno uguali
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] lo stesso autore, e un titolo simile
        [year] lo stesso anno, e un titolo simile
        [author-year] lo stesso autore e lo stesso anno, e un titolo simile
       *[none] un titolo simile
    }
   *[no] { $same ->
        [author] lo stesso autore
        [year] lo stesso anno
        [title] lo stesso titolo
        [author-year] lo stesso autore e lo stesso anno
        [author-title] lo stesso autore e lo stesso titolo
        [year-title] lo stesso anno e lo stesso titolo
        [author-year-title] autore, anno e titolo uguali
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, un altro anno
core-found-behind = { $year }, e il nome è di uno di quelli dietro { $people }
core-found-name-like = { $year }, e un nome simile a { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = l'opera citata prima di questa: { $why }
