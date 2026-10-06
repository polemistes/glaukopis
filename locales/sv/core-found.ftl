# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = samma post i Zotero
core-found-same-key = samma hänvisningsnyckel
core-found-earlier-key = en hänvisningsnyckel den hade förut
core-found-same-doi = samma DOI
core-found-same-isbn = samma ISBN
core-found-alike-in-all = lika i allt som skiljer ett verk från ett annat
core-found-same-doi-other-title = samma DOI, och en annan titel
core-found-same-isbn-other-title = samma ISBN, och en annan titel
core-found-same-title-author-year = samma titel, författare och år
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] samma författare, och en titel som liknar den
        [year] samma år, och en titel som liknar den
        [author-year] samma författare och år, och en titel som liknar den
       *[none] en titel som liknar den
    }
   *[no] { $same ->
        [author] samma författare
        [year] samma år
        [title] samma titel
        [author-year] samma författare och år
        [author-title] samma författare och titel
        [year-title] samma år och titel
        [author-year-title] samma författare, år och titel
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, ett annat år
core-found-behind = { $year }, och namnet är på en av dem som står bakom { $people }
core-found-name-like = { $year }, och ett namn som liknar { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = verket som hänvisades till närmast före: { $why }
