# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = Zoteroの同じアイテム
core-found-same-key = 同じ引用キー
core-found-earlier-key = 以前の引用キー
core-found-same-doi = 同じDOI
core-found-same-isbn = 同じISBN
core-found-alike-in-all = 作品を見分ける点がすべて一致
core-found-same-doi-other-title = DOIが同じで書名が異なる
core-found-same-isbn-other-title = ISBNが同じで書名が異なる
core-found-same-title-author-year = 書名・著者・年が同じ
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] 著者が同じで書名が似ている
        [year] 年が同じで書名が似ている
        [author-year] 著者と年が同じで書名が似ている
       *[none] 書名が似ている
    }
   *[no] { $same ->
        [author] 著者が同じ
        [year] 年が同じ
        [title] 書名が同じ
        [author-year] 著者と年が同じ
        [author-title] 著者と書名が同じ
        [year-title] 年と書名が同じ
        [author-year-title] 著者・年・書名が同じ
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }、年が異なる
core-found-behind = { $year }、名前は{ $people }の陰にいる人のもの
core-found-name-like = { $year }、名前が{ $people }に似ている
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = 直前に引用された作品：{ $why }
