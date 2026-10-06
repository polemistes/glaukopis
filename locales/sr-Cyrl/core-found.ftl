# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = иста ставка у програму Zotero
core-found-same-key = исти кључ цитата
core-found-earlier-key = кључ цитата који је раније имала
core-found-same-doi = исти DOI
core-found-same-isbn = исти ISBN
core-found-alike-in-all = једнаке у свему по чему се једно дело разликује од другог
core-found-same-doi-other-title = исти DOI, а други наслов
core-found-same-isbn-other-title = исти ISBN, а други наслов
core-found-same-title-author-year = исти наслов, аутор и година
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] исти аутор, и сличан наслов
        [year] иста година, и сличан наслов
        [author-year] исти аутор и година, и сличан наслов
       *[none] сличан наслов
    }
   *[no] { $same ->
        [author] исти аутор
        [year] иста година
        [title] исти наслов
        [author-year] исти аутор и година
        [author-title] исти аутор и наслов
        [year-title] иста година и наслов
        [author-year-title] исти аутор, година и наслов
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, друга година
core-found-behind = { $year }, а име је једног од оних који стоје иза „{ $people }“
core-found-name-like = { $year }, а име слично као { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = дело наведено пре овога: { $why }
