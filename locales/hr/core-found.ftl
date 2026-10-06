# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = ista stavka u Zoteru
core-found-same-key = isti citatni ključ
core-found-earlier-key = citatni ključ koji je prije imala
core-found-same-doi = isti DOI
core-found-same-isbn = isti ISBN
core-found-alike-in-all = jednaka u svemu po čemu se jedno djelo razlikuje od drugoga
core-found-same-doi-other-title = isti DOI, a drugi naslov
core-found-same-isbn-other-title = isti ISBN, a drugi naslov
core-found-same-title-author-year = isti naslov, autor i godina
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] isti autor i sličan naslov
        [year] ista godina i sličan naslov
        [author-year] isti autor i godina te sličan naslov
       *[none] sličan naslov
    }
   *[no] { $same ->
        [author] isti autor
        [year] ista godina
        [title] isti naslov
        [author-year] isti autor i godina
        [author-title] isti autor i naslov
        [year-title] ista godina i naslov
        [author-year-title] isti autor, godina i naslov
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, druga godina
core-found-behind = { $year }, a ime je jednoga od onih koji stoje iza { $people }
core-found-name-like = { $year }, a ime slično { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = djelo citirano prije ovoga: { $why }
