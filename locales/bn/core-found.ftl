# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = Zotero-তে একই আইটেম
core-found-same-key = একই সূত্রনির্দেশ-চাবি
core-found-earlier-key = একটি সূত্রনির্দেশ-চাবি, যা এর আগে ছিল
core-found-same-doi = একই DOI
core-found-same-isbn = একই ISBN
core-found-alike-in-all = এক রচনাকে অন্যটি থেকে যা আলাদা করে, তার সবকিছুতে মিল
core-found-same-doi-other-title = একই DOI, আর অন্য শিরোনাম
core-found-same-isbn-other-title = একই ISBN, আর অন্য শিরোনাম
core-found-same-title-author-year = একই শিরোনাম, লেখক ও সাল
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] একই লেখক, আর তার মতো একটি শিরোনাম
        [year] একই সাল, আর তার মতো একটি শিরোনাম
        [author-year] একই লেখক ও সাল, আর তার মতো একটি শিরোনাম
       *[none] তার মতো একটি শিরোনাম
    }
   *[no] { $same ->
        [author] একই লেখক
        [year] একই সাল
        [title] একই শিরোনাম
        [author-year] একই লেখক ও সাল
        [author-title] একই লেখক ও শিরোনাম
        [year-title] একই সাল ও শিরোনাম
        [author-year-title] একই লেখক, সাল ও শিরোনাম
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, অন্য সাল
core-found-behind = { $year }, আর নামটি { $people }-এর পেছনে যিনি আছেন তাঁর
core-found-name-like = { $year }, আর { $people }-এর মতো একটি নাম
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = এর আগে উল্লিখিত রচনাটি: { $why }
