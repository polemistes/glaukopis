# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = tá istá položka v Zotere
core-found-same-key = ten istý citačný kľúč
core-found-earlier-key = citačný kľúč, ktorý mal predtým
core-found-same-doi = to isté DOI
core-found-same-isbn = to isté ISBN
core-found-alike-in-all = zhoda vo všetkom, čo odlišuje jedno dielo od druhého
core-found-same-doi-other-title = to isté DOI a iný názov
core-found-same-isbn-other-title = to isté ISBN a iný názov
core-found-same-title-author-year = ten istý názov, autor a rok
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] ten istý autor a podobný názov
        [year] ten istý rok a podobný názov
        [author-year] ten istý autor a rok a podobný názov
       *[none] podobný názov
    }
   *[no] { $same ->
        [author] ten istý autor
        [year] ten istý rok
        [title] ten istý názov
        [author-year] ten istý autor a rok
        [author-title] ten istý autor a názov
        [year-title] ten istý rok a názov
        [author-year-title] ten istý autor, rok a názov
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, iný rok
core-found-behind = { $year } a meno jedného z tých, čo stoja za { $people }
core-found-name-like = { $year } a meno podobné ako { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = dielo citované pred týmto: { $why }
