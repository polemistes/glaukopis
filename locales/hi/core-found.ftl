# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = Zotero में वही प्रविष्टि
core-found-same-key = वही हवाला-कुंजी
core-found-earlier-key = एक हवाला-कुंजी जो पहले इसकी थी
core-found-same-doi = वही DOI
core-found-same-isbn = वही ISBN
core-found-alike-in-all = उस सब में एक जैसे जो एक कृति को दूसरी से अलग करता है
core-found-same-doi-other-title = वही DOI, और दूसरा शीर्षक
core-found-same-isbn-other-title = वही ISBN, और दूसरा शीर्षक
core-found-same-title-author-year = वही शीर्षक, लेखक और वर्ष
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] वही लेखक, और मिलता-जुलता शीर्षक
        [year] वही वर्ष, और मिलता-जुलता शीर्षक
        [author-year] वही लेखक और वर्ष, और मिलता-जुलता शीर्षक
       *[none] मिलता-जुलता शीर्षक
    }
   *[no] { $same ->
        [author] वही लेखक
        [year] वही वर्ष
        [title] वही शीर्षक
        [author-year] वही लेखक और वर्ष
        [author-title] वही लेखक और शीर्षक
        [year-title] वही वर्ष और शीर्षक
        [author-year-title] वही लेखक, वर्ष और शीर्षक
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, दूसरा वर्ष
core-found-behind = { $year }, और नाम उसका है जो { $people } के पीछे खड़ा है
core-found-name-like = { $year }, और { $people } से मिलता-जुलता नाम
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = इससे पहले हवाला दी गई कृति: { $why }
