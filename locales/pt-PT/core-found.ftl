# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = o mesmo item no Zotero
core-found-same-key = a mesma chave de citação
core-found-earlier-key = uma chave de citação que teve antes
core-found-same-doi = o mesmo DOI
core-found-same-isbn = o mesmo ISBN
core-found-alike-in-all = igual em tudo o que distingue uma obra de outra
core-found-same-doi-other-title = o mesmo DOI, e outro título
core-found-same-isbn-other-title = o mesmo ISBN, e outro título
core-found-same-title-author-year = o mesmo título, autor e ano
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] o mesmo autor, e um título parecido
        [year] o mesmo ano, e um título parecido
        [author-year] o mesmo autor e ano, e um título parecido
       *[none] um título parecido
    }
   *[no] { $same ->
        [author] o mesmo autor
        [year] o mesmo ano
        [title] o mesmo título
        [author-year] o mesmo autor e ano
        [author-title] o mesmo autor e título
        [year-title] o mesmo ano e título
        [author-year-title] o mesmo autor, ano e título
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, outro ano
core-found-behind = { $year }, e o nome é de um dos que estão por detrás de { $people }
core-found-name-like = { $year }, e um nome parecido com { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = a obra citada antes desta: { $why }
