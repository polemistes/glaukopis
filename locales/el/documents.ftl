# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Ένα έγγραφο για εισαγωγή
documents-filter = Έγγραφα
documents-filter-all = Όλα τα αρχεία
documents-title-map = Χάρτης από έγγραφο
documents-title-project = Έργο από έγγραφο
documents-reading = Ανάγνωση του { $file }…
documents-reading-hint = Ένα μεγάλο έγγραφο θέλει λίγη ώρα.
documents-no-pandoc = Έγγραφα αυτού του είδους τα διαβάζει το Pandoc, που δεν είναι εγκατεστημένο ή δεν βρέθηκε. Πού βρίσκεται μπορείτε να το πείτε στις ρυθμίσεις.
documents-unread = Το αρχείο δεν διαβάζεται.
documents-title = Τίτλος
documents-title-hint-map = Το όνομα του χάρτη, και του στοιχείου στο κέντρο του.
documents-title-hint-project = Το όνομα του έργου, του χάρτη του, και του στοιχείου στο κέντρο του χάρτη.
# What a project made of a document is called when the document has no title.
documents-untitled = Χωρίς τίτλο

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Μέρος
   *[other] Μέρη
}
documents-words = { $count ->
    [one] Λέξη
   *[other] Λέξεις
}
documents-notes = { $count ->
    [one] Σημείωση
   *[other] Σημειώσεις
}
documents-figures = { $count ->
    [one] Σχήμα
   *[other] Σχήματα
}
documents-tables = { $count ->
    [one] Πίνακας
   *[other] Πίνακες
}
documents-equations = { $count ->
    [one] Εξίσωση
   *[other] Εξισώσεις
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Έργα της βιβλιοθήκης σας παρατίθενται { $cited ->
        [1] μία φορά
        [2] δύο φορές
       *[other] { $cited } φορές
    }.
documents-cited-not-in-library = Έργα που δεν είναι στη βιβλιοθήκη σας παρατίθενται { $missing ->
        [1] μία φορά
        [2] δύο φορές
       *[other] { $missing } φορές
    }.
documents-cited-both = Έργα της βιβλιοθήκης σας παρατίθενται { $cited ->
        [1] μία φορά
        [2] δύο φορές
       *[other] { $cited } φορές
    }, έργα που δεν είναι σε αυτήν { $missing ->
        [1] μία φορά
        [2] δύο φορές
       *[other] { $missing } φορές
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Βρέθηκε μία παραπομπή.
   *[other] Βρέθηκαν { $count } παραπομπές.
}
documents-found-made = { $count ->
    [one] Βρέθηκε μία παραπομπή, φτιαγμένη από πρόγραμμα που κρατά αναφορές.
   *[other] Βρέθηκαν { $count } παραπομπές, όλες φτιαγμένες από πρόγραμμα που κρατά αναφορές.
}
documents-found-some-made = Βρέθηκαν { $count } παραπομπές, { $made } από αυτές φτιαγμένες από πρόγραμμα που κρατά αναφορές.
documents-at-once = Να γίνουν αμέσως παραπομπές όσες έφτιαξε το Zotero για έργα που έχει η βιβλιοθήκη σας
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Μια σημείωση που δεν είναι παρά μια παραπομπή γίνεται παραπομπή μέσα στη γραμμή, που το στυλ παραπομπών τη βάζει σε σημείωση ή στη γραμμή· μια σημείωση που λέει περισσότερα κρατά την παραπομπή της. Ό,τι έχετε επιλέξει για τις σημειώσεις στο πλαίσιο των παραπομπών που βρέθηκαν, για όλες τις επόμενες, ισχύει κι εδώ.
documents-go-through-map = Εξέταση των παραπομπών όταν φτιαχτεί ο χάρτης
documents-go-through-project = Εξέταση των παραπομπών όταν φτιαχτεί το έργο

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Για να ξέρετε
documents-making = Φτιάχνεται ο χάρτης…
documents-make-map = Δημιουργία του χάρτη
documents-make-project = Δημιουργία του έργου
documents-map-failed = Ο χάρτης δεν μπόρεσε να φτιαχτεί.
