# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = Zotero’da aynı öğe
core-found-same-key = aynı atıf anahtarı
core-found-earlier-key = önceden sahip olduğu bir atıf anahtarı
core-found-same-doi = aynı DOI
core-found-same-isbn = aynı ISBN
core-found-alike-in-all = bir eseri ötekinden ayıran her şeyde benzer
core-found-same-doi-other-title = aynı DOI, başka bir ad
core-found-same-isbn-other-title = aynı ISBN, başka bir ad
core-found-same-title-author-year = aynı ad, yazar ve yıl
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] aynı yazar ve benzer bir ad
        [year] aynı yıl ve benzer bir ad
        [author-year] aynı yazar ve yıl, ve benzer bir ad
       *[none] benzer bir ad
    }
   *[no] { $same ->
        [author] aynı yazar
        [year] aynı yıl
        [title] aynı ad
        [author-year] aynı yazar ve yıl
        [author-title] aynı yazar ve ad
        [year-title] aynı yıl ve ad
        [author-year-title] aynı yazar, yıl ve ad
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, başka bir yıl
core-found-behind = { $year }; ad, { $people } arasında arkadan gelen birinin
core-found-name-like = { $year }; ad, { $people } adına benziyor
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = bundan önce atıf yapılan eser: { $why }
