# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = hetzelfde item in Zotero
core-found-same-key = dezelfde citeersleutel
core-found-earlier-key = een citeersleutel die ze eerder had
core-found-same-doi = dezelfde DOI
core-found-same-isbn = hetzelfde ISBN
core-found-alike-in-all = gelijk in alles wat het ene werk van het andere onderscheidt
core-found-same-doi-other-title = dezelfde DOI, en een andere titel
core-found-same-isbn-other-title = hetzelfde ISBN, en een andere titel
core-found-same-title-author-year = dezelfde titel, auteur en jaar
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] dezelfde auteur, en een titel die erop lijkt
        [year] hetzelfde jaar, en een titel die erop lijkt
        [author-year] dezelfde auteur en hetzelfde jaar, en een titel die erop lijkt
       *[none] een titel die erop lijkt
    }
   *[no] { $same ->
        [author] dezelfde auteur
        [year] hetzelfde jaar
        [title] dezelfde titel
        [author-year] dezelfde auteur en hetzelfde jaar
        [author-title] dezelfde auteur en titel
        [year-title] hetzelfde jaar en dezelfde titel
        [author-year-title] dezelfde auteur, hetzelfde jaar en dezelfde titel
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, een ander jaar
core-found-behind = { $year }, en de naam is van iemand die achter { $people } staat
core-found-name-like = { $year }, en een naam die op { $people } lijkt
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = het werk dat hiervoor is geciteerd: { $why }
