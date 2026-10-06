# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = same element i Zotero
core-found-same-key = same nøkkel
core-found-earlier-key = ein nøkkel han hadde før
core-found-same-doi = same DOI
core-found-same-isbn = same ISBN
core-found-alike-in-all = lik i alt som skil eitt verk frå eit anna
core-found-same-doi-other-title = same DOI, men ein annan tittel
core-found-same-isbn-other-title = same ISBN, men ein annan tittel
core-found-same-title-author-year = same tittel, forfattar og år
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] same forfattar, og ein liknande tittel
        [year] same år, og ein liknande tittel
        [author-year] same forfattar og år, og ein liknande tittel
       *[none] ein liknande tittel
    }
   *[no] { $same ->
        [author] same forfattar
        [year] same år
        [title] same tittel
        [author-year] same forfattar og år
        [author-title] same forfattar og tittel
        [year-title] same år og tittel
        [author-year-title] same forfattar, år og tittel
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, eit anna år
core-found-behind = { $year }, og namnet er på ein som står bak { $people }
core-found-name-like = { $year }, og eit namn som liknar { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = verket det vart vist til like før: { $why }
