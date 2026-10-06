# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = той самий запис у Zotero
core-found-same-key = той самий ключ цитування
core-found-earlier-key = ключ цитування, який воно мало раніше
core-found-same-doi = той самий DOI
core-found-same-isbn = той самий ISBN
core-found-alike-in-all = збігається в усьому, що відрізняє одну працю від іншої
core-found-same-doi-other-title = той самий DOI, але інша назва
core-found-same-isbn-other-title = той самий ISBN, але інша назва
core-found-same-title-author-year = ті самі назва, автор і рік
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] той самий автор і схожа назва
        [year] той самий рік і схожа назва
        [author-year] ті самі автор і рік, і схожа назва
       *[none] схожа назва
    }
   *[no] { $same ->
        [author] той самий автор
        [year] той самий рік
        [title] та сама назва
        [author-year] ті самі автор і рік
        [author-title] ті самі автор і назва
        [year-title] ті самі рік і назва
        [author-year-title] ті самі автор, рік і назва
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, інший рік
core-found-behind = { $year }, а імʼя — когось із тих, хто стоїть за { $people }
core-found-name-like = { $year } і імʼя, схоже на { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = праця, процитована перед цією: { $why }
