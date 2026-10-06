# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = stejná položka v Zoteru
core-found-same-key = stejný citační klíč
core-found-earlier-key = citační klíč, který měl dříve
core-found-same-doi = stejné DOI
core-found-same-isbn = stejné ISBN
core-found-alike-in-all = shoda ve všem, co odlišuje jedno dílo od druhého
core-found-same-doi-other-title = stejné DOI a jiný název
core-found-same-isbn-other-title = stejné ISBN a jiný název
core-found-same-title-author-year = stejný název, autor i rok
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] stejný autor a podobný název
        [year] stejný rok a podobný název
        [author-year] stejný autor i rok a podobný název
       *[none] podobný název
    }
   *[no] { $same ->
        [author] stejný autor
        [year] stejný rok
        [title] stejný název
        [author-year] stejný autor i rok
        [author-title] stejný autor i název
        [year-title] stejný rok i název
        [author-year-title] stejný autor, rok i název
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, jiný rok
core-found-behind = { $year }, a jméno jednoho z těch, kdo za dílem stojí: { $people }
core-found-name-like = { $year }, a jméno podobné jako { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = dílo citované před tímto: { $why }
