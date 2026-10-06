# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = el mismo ítem de Zotero
core-found-same-key = la misma clave de cita
core-found-earlier-key = una clave de cita que tuvo antes
core-found-same-doi = el mismo DOI
core-found-same-isbn = el mismo ISBN
core-found-alike-in-all = igual en todo lo que distingue una obra de otra
core-found-same-doi-other-title = el mismo DOI, y otro título
core-found-same-isbn-other-title = el mismo ISBN, y otro título
core-found-same-title-author-year = el mismo título, autor y año
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] el mismo autor, y un título parecido
        [year] el mismo año, y un título parecido
        [author-year] el mismo autor y año, y un título parecido
       *[none] un título parecido
    }
   *[no] { $same ->
        [author] el mismo autor
        [year] el mismo año
        [title] el mismo título
        [author-year] el mismo autor y año
        [author-title] el mismo autor y título
        [year-title] el mismo año y título
        [author-year-title] el mismo autor, año y título
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, otro año
core-found-behind = { $year }, y el nombre es de uno de los que están detrás de { $people }
core-found-name-like = { $year }, y un nombre parecido a { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = la obra citada antes de esta: { $why }
