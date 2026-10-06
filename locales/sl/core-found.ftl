# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = isti vnos v Zoteru
core-found-same-key = isti ključ navedbe
core-found-earlier-key = ključ navedbe, ki ga je imel prej
core-found-same-doi = isti DOI
core-found-same-isbn = isti ISBN
core-found-alike-in-all = enak v vsem, po čemer se dela ločijo med seboj
core-found-same-doi-other-title = isti DOI in drug naslov
core-found-same-isbn-other-title = isti ISBN in drug naslov
core-found-same-title-author-year = isti naslov, avtor in leto
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] isti avtor in podoben naslov
        [year] isto leto in podoben naslov
        [author-year] isti avtor in leto ter podoben naslov
       *[none] podoben naslov
    }
   *[no] { $same ->
        [author] isti avtor
        [year] isto leto
        [title] isti naslov
        [author-year] isti avtor in leto
        [author-title] isti avtor in naslov
        [year-title] isto leto in naslov
        [author-year-title] isti avtor, leto in naslov
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, drugo leto
core-found-behind = { $year }, ime pa je eno izmed tistih, ki stojijo za { $people }
core-found-name-like = { $year } in ime, podobno kot { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = delo, navedeno pred tem: { $why }
