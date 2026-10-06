# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = та же запись в Zotero
core-found-same-key = тот же ключ цитирования
core-found-earlier-key = прежний ключ цитирования
core-found-same-doi = тот же DOI
core-found-same-isbn = тот же ISBN
core-found-alike-in-all = совпадает во всём, что отличает одну работу от другой
core-found-same-doi-other-title = тот же DOI, но другое название
core-found-same-isbn-other-title = тот же ISBN, но другое название
core-found-same-title-author-year = те же название, автор и год
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] тот же автор и похожее название
        [year] тот же год и похожее название
        [author-year] те же автор и год и похожее название
       *[none] похожее название
    }
   *[no] { $same ->
        [author] тот же автор
        [year] тот же год
        [title] то же название
        [author-year] те же автор и год
        [author-title] те же автор и название
        [year-title] те же год и название
        [author-year-title] те же автор, год и название
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, другой год
core-found-behind = { $year }, а имя — одного из тех, кто стоит за { $people }
core-found-name-like = { $year }, и имя, похожее на { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = работа, процитированная перед этой: { $why }
