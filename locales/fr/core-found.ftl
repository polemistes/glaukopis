# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = la même entrée dans Zotero
core-found-same-key = la même clé de citation
core-found-earlier-key = une clé de citation qu’elle avait auparavant
core-found-same-doi = le même DOI
core-found-same-isbn = le même ISBN
core-found-alike-in-all = semblables en tout ce qui distingue une œuvre d’une autre
core-found-same-doi-other-title = le même DOI, et un autre titre
core-found-same-isbn-other-title = le même ISBN, et un autre titre
core-found-same-title-author-year = les mêmes titre, auteur et année
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] le même auteur, et un titre semblable
        [year] la même année, et un titre semblable
        [author-year] les mêmes auteur et année, et un titre semblable
       *[none] un titre semblable
    }
   *[no] { $same ->
        [author] le même auteur
        [year] la même année
        [title] le même titre
        [author-year] les mêmes auteur et année
        [author-title] les mêmes auteur et titre
        [year-title] les mêmes année et titre
        [author-year-title] les mêmes auteur, année et titre
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, une autre année
core-found-behind = { $year }, et le nom est celui de quelqu’un qui se tient derrière { $people }
core-found-name-like = { $year }, et un nom proche de { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = l’œuvre citée juste avant : { $why }
