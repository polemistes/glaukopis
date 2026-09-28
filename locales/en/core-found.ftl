# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = the same item in Zotero
core-found-same-key = the same citation key
core-found-earlier-key = a citation key it had before
core-found-same-doi = the same DOI
core-found-same-isbn = the same ISBN
core-found-alike-in-all = alike in all that tells one work from another
core-found-same-doi-other-title = the same DOI, and another title
core-found-same-isbn-other-title = the same ISBN, and another title
core-found-same-title-author-year = the same title, author and year
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] the same author, and a title like it
        [year] the same year, and a title like it
        [author-year] the same author and year, and a title like it
       *[none] a title like it
    }
   *[no] { $same ->
        [author] the same author
        [year] the same year
        [title] the same title
        [author-year] the same author and year
        [author-title] the same author and title
        [year-title] the same year and title
        [author-year-title] the same author, year and title
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, another year
core-found-behind = { $year }, and the name is of one who stands behind { $people }
core-found-name-like = { $year }, and a name like { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = the work cited before this: { $why }
