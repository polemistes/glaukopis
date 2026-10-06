# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = derselbe Eintrag in Zotero
core-found-same-key = derselbe Zitierschlüssel
core-found-earlier-key = ein Zitierschlüssel, den sie früher hatte
core-found-same-doi = dieselbe DOI
core-found-same-isbn = dieselbe ISBN
core-found-alike-in-all = gleich in allem, was ein Werk vom anderen unterscheidet
core-found-same-doi-other-title = dieselbe DOI, aber ein anderer Titel
core-found-same-isbn-other-title = dieselbe ISBN, aber ein anderer Titel
core-found-same-title-author-year = derselbe Titel, derselbe Autor und dasselbe Jahr
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] derselbe Autor und ein ähnlicher Titel
        [year] dasselbe Jahr und ein ähnlicher Titel
        [author-year] derselbe Autor, dasselbe Jahr und ein ähnlicher Titel
       *[none] ein ähnlicher Titel
    }
   *[no] { $same ->
        [author] derselbe Autor
        [year] dasselbe Jahr
        [title] derselbe Titel
        [author-year] derselbe Autor und dasselbe Jahr
        [author-title] derselbe Autor und derselbe Titel
        [year-title] dasselbe Jahr und derselbe Titel
        [author-year-title] derselbe Autor, dasselbe Jahr und derselbe Titel
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, ein anderes Jahr
core-found-behind = { $year }, und der Name ist einer von denen, die hinter { $people } stehen
core-found-name-like = { $year }, und ein Name wie { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = das zuvor zitierte Werk: { $why }
