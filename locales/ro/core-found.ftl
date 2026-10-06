# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = același articol din Zotero
core-found-same-key = aceeași cheie de citare
core-found-earlier-key = o cheie de citare pe care a avut-o înainte
core-found-same-doi = același DOI
core-found-same-isbn = același ISBN
core-found-alike-in-all = la fel în tot ce deosebește o lucrare de alta
core-found-same-doi-other-title = același DOI și alt titlu
core-found-same-isbn-other-title = același ISBN și alt titlu
core-found-same-title-author-year = același titlu, autor și an
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] același autor și un titlu asemănător
        [year] același an și un titlu asemănător
        [author-year] același autor și an și un titlu asemănător
       *[none] un titlu asemănător
    }
   *[no] { $same ->
        [author] același autor
        [year] același an
        [title] același titlu
        [author-year] același autor și an
        [author-title] același autor și titlu
        [year-title] același an și titlu
        [author-year-title] același autor, an și titlu
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, alt an
core-found-behind = { $year }, iar numele este al unuia care stă în spatele lui { $people }
core-found-name-like = { $year } și un nume ca { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = lucrarea citată înainte de aceasta: { $why }
