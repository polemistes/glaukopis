# Why a reference of the library may be the work that a citation found in a
# text names, in a few words, in English. See locales/README.md.

## By what tells one work from another.

core-found-same-zotero-item = το ίδιο αντικείμενο στο Zotero
core-found-same-key = το ίδιο κλειδί παραπομπής
core-found-earlier-key = ένα κλειδί παραπομπής που είχε παλιότερα
core-found-same-doi = το ίδιο DOI
core-found-same-isbn = το ίδιο ISBN
core-found-alike-in-all = όμοια σε όλα όσα ξεχωρίζουν το ένα έργο από το άλλο
core-found-same-doi-other-title = το ίδιο DOI, και άλλος τίτλος
core-found-same-isbn-other-title = το ίδιο ISBN, και άλλος τίτλος
core-found-same-title-author-year = ο ίδιος τίτλος, συγγραφέας και έτος
# What the two have that is the same, of author, year and title, joined by
# "-" (author-year), or none; and whether their titles are alike without
# being the same (yes or no).
core-found-alike = { $like ->
    [yes] { $same ->
        [author] ο ίδιος συγγραφέας, και παρόμοιος τίτλος
        [year] το ίδιο έτος, και παρόμοιος τίτλος
        [author-year] ο ίδιος συγγραφέας και έτος, και παρόμοιος τίτλος
       *[none] παρόμοιος τίτλος
    }
   *[no] { $same ->
        [author] ο ίδιος συγγραφέας
        [year] το ίδιο έτος
        [title] ο ίδιος τίτλος
        [author-year] ο ίδιος συγγραφέας και έτος
        [author-title] ο ίδιος συγγραφέας και τίτλος
        [year-title] το ίδιο έτος και τίτλος
        [author-year-title] ο ίδιος συγγραφέας, έτος και τίτλος
       *[none] {""}
    }
}

## By the words that name the work. The people are those of the reference,
## as the lists show them: "Nagy and Lord".

core-found-another-year = { $people }, άλλο έτος
core-found-behind = { $year }, και το όνομα είναι κάποιου που στέκεται πίσω από { $people }
core-found-name-like = { $year }, και όνομα σαν { $people }
# A citation that says it is of the work cited before it: ibid.
core-found-cited-before = το έργο που παρατέθηκε πριν από αυτό: { $why }
