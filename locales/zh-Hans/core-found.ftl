# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = Zotero 中的同一条目
core-found-same-key = 相同的引用键
core-found-earlier-key = 它以前用过的引用键
core-found-same-doi = 相同的 DOI
core-found-same-isbn = 相同的 ISBN
core-found-alike-in-all = 区分著作的各项都相同
core-found-same-doi-other-title = 相同的 DOI，标题不同
core-found-same-isbn-other-title = 相同的 ISBN，标题不同
core-found-same-title-author-year = 标题、作者和年份都相同
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] 作者相同，标题相近
        [year] 年份相同，标题相近
        [author-year] 作者和年份相同，标题相近
       *[none] 标题相近
    }
   *[no] { $same ->
        [author] 作者相同
        [year] 年份相同
        [title] 标题相同
        [author-year] 作者和年份相同
        [author-title] 作者和标题相同
        [year-title] 年份和标题相同
        [author-year-title] 作者、年份和标题都相同
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }，年份不同
core-found-behind = { $year }，此名字属于 { $people } 背后的某人
core-found-name-like = { $year }，名字与 { $people } 相近
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = 前一处引用的著作：{ $why }
