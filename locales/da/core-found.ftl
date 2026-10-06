# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = samme post i Zotero
core-found-same-key = samme nøgle
core-found-earlier-key = en nøgle, den havde før
core-found-same-doi = samme DOI
core-found-same-isbn = samme ISBN
core-found-alike-in-all = ens i alt, hvad der skiller det ene værk fra det andet
core-found-same-doi-other-title = samme DOI, men en anden titel
core-found-same-isbn-other-title = samme ISBN, men en anden titel
core-found-same-title-author-year = samme titel, forfatter og år
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] samme forfatter, og en lignende titel
        [year] samme år, og en lignende titel
        [author-year] samme forfatter og år, og en lignende titel
       *[none] en lignende titel
    }
   *[no] { $same ->
        [author] samme forfatter
        [year] samme år
        [title] samme titel
        [author-year] samme forfatter og år
        [author-title] samme forfatter og titel
        [year-title] samme år og titel
        [author-year-title] samme forfatter, år og titel
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, et andet år
core-found-behind = { $year }, og navnet er på en af dem, der står bag { $people }
core-found-name-like = { $year }, og et navn, der ligner { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = det værk, der blev henvist til lige før: { $why }
