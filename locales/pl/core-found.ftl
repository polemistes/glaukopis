# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = ten sam element w Zotero
core-found-same-key = ten sam klucz cytowania
core-found-earlier-key = klucz cytowania, który miała wcześniej
core-found-same-doi = ten sam DOI
core-found-same-isbn = ten sam ISBN
core-found-alike-in-all = zgodne we wszystkim, co odróżnia jedno dzieło od drugiego
core-found-same-doi-other-title = ten sam DOI, lecz inny tytuł
core-found-same-isbn-other-title = ten sam ISBN, lecz inny tytuł
core-found-same-title-author-year = ten sam tytuł, autor i rok
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] ten sam autor i podobny tytuł
        [year] ten sam rok i podobny tytuł
        [author-year] ten sam autor i rok oraz podobny tytuł
       *[none] podobny tytuł
    }
   *[no] { $same ->
        [author] ten sam autor
        [year] ten sam rok
        [title] ten sam tytuł
        [author-year] ten sam autor i rok
        [author-title] ten sam autor i tytuł
        [year-title] ten sam rok i tytuł
        [author-year-title] ten sam autor, rok i tytuł
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, inny rok
core-found-behind = { $year }, a nazwisko to jedno z tych, które kryją się za „{ $people }”
core-found-name-like = { $year }, a nazwisko przypomina { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = dzieło cytowane tuż przedtem: { $why }
