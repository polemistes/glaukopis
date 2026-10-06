# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Συχνά σε χρήση
library-form-add-field = Προσθήκη πεδίου
library-form-citation-key = Κλειδί παραπομπής
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = από συγγραφέα και έτος
library-form-date-problem = Γράψτε την ημερομηνία ως 1979, 1979-05 ή 1979-05-12· ένα διάστημα ως 1979/1985.
library-form-remove-field = Αφαίρεση του πεδίου { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Ίδρυμα ή άλλο όνομα που μένει ενιαίο
library-names-prefix-suffix = Πρόθεμα και επίθημα
    .hint = «van», «de la» · «Jr.», «III»
library-names-move-up = Μετακίνηση πάνω
library-names-move-down = Μετακίνηση κάτω
library-names-more = Περισσότερα για αυτό το όνομα
library-names-name = Όνομα
library-names-name-of = { $role }: όνομα
library-names-family = Επώνυμο
library-names-family-of = { $role }: επώνυμο
library-names-given = Μικρό όνομα
library-names-given-of = { $role }: μικρό όνομα
library-names-prefix = Πρόθεμα: van, de la
library-names-prefix-of = { $role }: πρόθεμα
library-names-suffix = Επίθημα: Jr., III
library-names-suffix-of = { $role }: επίθημα

## Words for references, wherever they are shown.

library-untitled = Χωρίς τίτλο
library-no-author = Χωρίς συγγραφέα
library-no-title = Χωρίς τίτλο
library-in-library = Στη βιβλιοθήκη σας

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = το ίδιο DOI
library-reason-isbn = το ίδιο ISBN
library-reason-identical = όμοια σε όλα όσα ξεχωρίζουν το ένα έργο από το άλλο
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] ο ίδιος τίτλος, συγγραφέας και έτος
            [like] ο ίδιος τίτλος και συγγραφέας, ένα έτος διαφορά
           *[none] ο ίδιος τίτλος και συγγραφέας, το έτος μόνο στο ένα
        }
        [like] { $year ->
            [same] ο ίδιος τίτλος και έτος, και ένας κοινός συγγραφέας
            [like] ο ίδιος τίτλος, ένας κοινός συγγραφέας, ένα έτος διαφορά
           *[none] ο ίδιος τίτλος, ένας κοινός συγγραφέας, το έτος μόνο στο ένα
        }
       *[none] { $year ->
            [same] ο ίδιος τίτλος και έτος, ο συγγραφέας μόνο στο ένα
            [like] ο ίδιος τίτλος, ένα έτος διαφορά, ο συγγραφέας μόνο στο ένα
           *[none] ο ίδιος τίτλος, ο συγγραφέας και το έτος μόνο στο ένα
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] ο ίδιος συγγραφέας και έτος, και παρόμοιος τίτλος
            [like] ο ίδιος συγγραφέας, παρόμοιος τίτλος, ένα έτος διαφορά
           *[none] ο ίδιος συγγραφέας, παρόμοιος τίτλος, το έτος μόνο στο ένα
        }
        [like] { $year ->
            [same] το ίδιο έτος, παρόμοιος τίτλος, ένας κοινός συγγραφέας
            [like] παρόμοιος τίτλος, ένας κοινός συγγραφέας, ένα έτος διαφορά
           *[none] παρόμοιος τίτλος, ένας κοινός συγγραφέας, το έτος μόνο στο ένα
        }
       *[none] { $year ->
            [same] το ίδιο έτος, παρόμοιος τίτλος, ο συγγραφέας μόνο στο ένα
            [like] παρόμοιος τίτλος, ένα έτος διαφορά, ο συγγραφέας μόνο στο ένα
           *[none] παρόμοιος τίτλος, ο συγγραφέας και το έτος μόνο στο ένα
        }
    }
}
library-reason-file = το ίδιο αρχείο
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } και { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Αυτό υπάρχει ήδη στη βιβλιοθήκη σας.
library-duplicate-probable = Αυτό μπορεί να υπάρχει ήδη στη βιβλιοθήκη σας.
library-duplicate-use = Χρήση αυτού

## Duplicates in the library.

library-duplicates-title = Διπλότυπα
library-duplicates-count = { $count ->
    [one] { $count } αναφορά φαίνεται να υπάρχει στη βιβλιοθήκη περισσότερες από μία φορές
   *[other] { $count } αναφορές φαίνεται να υπάρχουν στη βιβλιοθήκη περισσότερες από μία φορές
}
library-duplicates-none = Κανένα διπλότυπο
    .text = Καμία αναφορά δεν φαίνεται να υπάρχει στη βιβλιοθήκη περισσότερες από μία φορές.
library-duplicates-no-more = Δεν υπάρχουν άλλα διπλότυπα
    .text = Οι παραπομπές στις αναφορές που συγχωνεύτηκαν παραπέμπουν τώρα σε εκείνες που κρατήθηκαν.
library-duplicates-how = Όταν αναφορές γίνονται μία, αυτή που κρατάτε παίρνει από τις άλλες ό,τι της λείπει, και κρατά τα δικά της εκεί που διαφέρουν. Τα αρχεία και οι συλλογές τους ενώνονται, και ό,τι τις παραθέτει παραθέτει αυτήν που κρατήθηκε.
library-duplicates-same = Ίδιες
library-duplicates-probably-same = Μάλλον ίδιες
library-duplicates-keep-which = Ποια να κρατηθεί
library-duplicates-kept = Κρατιέται
library-duplicates-different = Είναι διαφορετικές
library-duplicates-merge = Να γίνουν μία
library-duplicates-merging = Γίνονται μία…
library-duplicates-failed = Η βιβλιοθήκη δεν μπόρεσε να ελεγχθεί για διπλότυπα
library-duplicates-merge-failed = Δεν μπόρεσαν να γίνουν μία

## Importing references: what a file holds, against what the library has.

library-import = Εισαγωγή
library-import-title = Εισαγωγή αναφορών
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } αναφορά σε { $source }
   *[other] { $count } αναφορές σε { $source }
}
library-import-review = { $count ->
    [one] { $count } αναφορά μπορεί να υπάρχει ήδη στη βιβλιοθήκη σας
   *[other] { $count } αναφορές μπορεί να υπάρχουν ήδη στη βιβλιοθήκη σας
}
library-import-new = { $count ->
    [one] { $count } νέα αναφορά
   *[other] { $count } νέες αναφορές
}
library-import-complete = { $count ->
    [one] { $count } αναφορά που υπάρχει ήδη στη βιβλιοθήκη σας αποκτά στοιχεία
   *[other] { $count } αναφορές που υπάρχουν ήδη στη βιβλιοθήκη σας αποκτούν στοιχεία
}
library-import-known = { $count ->
    [one] { $count } αναφορά υπάρχει ήδη στη βιβλιοθήκη σας
   *[other] { $count } αναφορές υπάρχουν ήδη στη βιβλιοθήκη σας
}
library-import-repeated = { $count ->
    [one] { $count } αναφορά επαναλαμβάνεται μέσα στην εισαγωγή
   *[other] { $count } αναφορές επαναλαμβάνονται μέσα στην εισαγωγή
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Θα αποκτούσε: { $fields }
library-import-gains-file = Αρχείο
library-import-gains-zotero = Το κλειδί της στο Zotero
library-import-what-to-do = Τι να γίνει
library-import-merge = Ίδιο έργο: συμπλήρωση αυτής που έχω
library-import-skip = Ίδιο έργο: η δική μου μένει όπως είναι
library-import-add = Διαφορετικό έργο: προσθήκη
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = Για όλες τις { $count } που είναι ίδιες:
library-import-all-probable = Για όλες τις { $count } που είναι μάλλον ίδιες:
library-import-all-merge = Συμπλήρωση αυτών που έχω
library-import-all-skip = Οι δικές μου μένουν όπως είναι
library-import-all-add = Προσθήκη όλων παρ’ όλα αυτά
library-import-more = …και { $count } ακόμη.
library-import-unread = { $count ->
    [one] { $count } μέρος του αρχείου δεν διαβάζεται
   *[other] { $count } μέρη του αρχείου δεν διαβάζονται
}
library-import-importing = Εισαγωγή…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } για προσθήκη{ $merge ->
        [0] {""}
       *[other] , { $merge } για συμπλήρωση
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } παραλείπονται
    }
library-import-failed = Η εισαγωγή απέτυχε.

## The library: the list of references, and what can be done with them.

library-references = Αναφορές
library-unread = Η βιβλιοθήκη δεν διαβάζεται
library-all-references = Όλες οι αναφορές
library-count = { $count ->
    [one] { $count } αναφορά
   *[other] { $count } αναφορές
}
library-selected = { $count ->
    [one] { $count } αναφορά επιλεγμένη
   *[other] { $count } αναφορές επιλεγμένες
}
library-selected-of = { $count ->
    [one] { $selected } από { $count } αναφορά επιλεγμένη
   *[other] { $selected } από { $count } αναφορές επιλεγμένες
}
library-new-reference = Νέα αναφορά
library-search = Αναζήτηση στη βιβλιοθήκη
library-search-in = Αναζήτηση σε { $name }
library-search-clear = Καθαρισμός της αναζήτησης
library-sort = Ταξινόμηση
library-sort-author = Συγγραφέας
library-sort-year = Έτος
library-sort-title = Τίτλος
library-sort-added = Ημερομηνία προσθήκης
library-sort-modified = Ημερομηνία αλλαγής
library-sort-descending = Φθίνουσα

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Φίλτρο
library-filters-on = { $count ->
    [one] Φίλτρο: { $count } ενεργό
   *[other] Φίλτρο: { $count } ενεργά
}
library-filter-kind = Είδος
library-filter-publisher = Εκδότης
library-filter-publisher-hint = Μέρος του ονόματος
library-filter-any-publisher = Οποιοσδήποτε εκδότης
library-filter-year = Έτος
library-filter-from = Από
library-filter-to = Έως
library-filter-clear = Καθαρισμός των φίλτρων
library-filter-nothing-here = Τίποτα για φιλτράρισμα εδώ.
# When the filters let nothing through.
library-nothing-passes = Καμία αναφορά από όσες φαίνονται δεν περνά τα φίλτρα.
library-import-export = Εισαγωγή και εξαγωγή
library-import-file = Εισαγωγή αρχείου…
    .hint = BibLaTeX ή BibTeX
library-paste = Επικόλληση αναφορών…
library-add-pdfs = Προσθήκη αρχείων PDF…
    .hint = Για το καθένα γίνεται ανεύρεση, και φυλάσσεται
library-import-zotero = Εισαγωγή από το Zotero…
library-find-duplicates = Εύρεση διπλοτύπων…
library-map-library = Χάρτης της βιβλιοθήκης…
library-map-collection = Χάρτης της συλλογής «{ $name }»…
library-export-library = Εξαγωγή της βιβλιοθήκης…
library-export-collection = Εξαγωγή της συλλογής «{ $name }»…
library-export-one = Εξαγωγή…
library-export-many = { $count ->
    [one] Εξαγωγή { $count } αναφοράς…
   *[other] Εξαγωγή { $count } αναφορών…
}
library-export-title = Εξαγωγή αναφορών
# What a file of exported references is called, before it is given a name.
library-export-file-references = αναφορές
library-export-file-library = βιβλιοθήκη
library-exported = { $count ->
    [one] Εξάχθηκε { $count } αναφορά
   *[other] Εξάχθηκαν { $count } αναφορές
}
library-export-failed = Η εξαγωγή απέτυχε
library-empty = Η βιβλιοθήκη σας είναι άδεια
    .text = Οι αναφορές που προσθέτετε εδώ είναι διαθέσιμες σε όλα τα έργα σας. Αρχίστε με μία, ή εισαγάγετε όσες έχετε ήδη.
library-collection-empty = Τίποτα ακόμη σε αυτή τη συλλογή
    .text = Σύρετε εδώ αναφορές από τη βιβλιοθήκη, ή προσθέστε μια νέα.
library-nothing-found = Δεν βρέθηκε τίποτα
    .text = Καμία αναφορά δεν έχει όλες αυτές τις λέξεις.
library-open-file = Άνοιγμα του αρχείου
library-file-open-failed = Το αρχείο δεν μπόρεσε να ανοίξει
library-add-to-collection = Προσθήκη σε συλλογή
library-remove-from = Αφαίρεση από «{ $name }»
library-copy-key = Αντιγραφή κλειδιού παραπομπής
library-copied-key = Αντιγράφηκε «{ $key }»
library-copy-biblatex = Αντιγραφή ως BibLaTeX
library-copied = Αντιγράφηκε
library-delete-one-title = Διαγραφή του «{ $name }»;
library-delete-many-title = { $count ->
    [one] Διαγραφή { $count } αναφοράς;
   *[other] Διαγραφή { $count } αναφορών;
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Αυτό αφαιρεί την αναφορά από τη βιβλιοθήκη σας, από κάθε συλλογή{ $files ->
        [0] {""}
        [one] , μαζί με { $files } συνημμένο αρχείο
       *[other] , μαζί με { $files } συνημμένα αρχεία
    }.{ $projects ->
        [0] {""}
        [one] {" "}Παρατίθεται σε ένα έργο, που κρατά αντίγραφό της.
       *[other] {" "}Παρατίθεται σε { $projects } έργα, που κρατούν αντίγραφό της.
    }
library-delete-many = Αυτό τις αφαιρεί από τη βιβλιοθήκη σας, από κάθε συλλογή{ $files ->
        [0] {""}
        [one] , μαζί με { $files } συνημμένο αρχείο
       *[other] , μαζί με { $files } συνημμένα αρχεία
    }.{ $projects ->
        [0] {""}
        [one] {" "}Ένα έργο που παραθέτει μερικές από αυτές κρατά αντίγραφο εκείνων.
       *[other] {" "}{ $projects } έργα που παραθέτουν μερικές από αυτές κρατούν αντίγραφο εκείνων.
    }
library-delete-failed = Οι αναφορές δεν μπόρεσαν να διαγραφούν
library-not-done = Αυτό δεν μπόρεσε να γίνει

## Collections.

library-collections = Συλλογές
# The projects that cite a work, in its pane.
library-cited-in = Παρατίθεται σε
library-not-cited = Δεν παρατίθεται σε κανένα έργο.
library-cited-reading = Ανάγνωση των έργων…
library-collections-hint = Οι συλλογές μαζεύουν αναφορές για ένα θέμα ή μια δουλειά. Μια αναφορά μπορεί να είναι σε όσες θέλετε.
library-collection-new = Νέα συλλογή
library-collection-new-inside = Νέα συλλογή μέσα
library-collection-new-under = Νέα συλλογή μέσα στη «{ $name }»
library-collection-move-to = Μετακίνηση σε
library-collection-name = Όνομα της συλλογής
library-collection-name-failed = Η συλλογή δεν μπόρεσε να ονομαστεί
library-collection-expand = Ανάπτυξη
library-collection-collapse = Σύμπτυξη
library-collection-to-top = Μετακίνηση στο ανώτερο επίπεδο
library-collection-move-failed = Η συλλογή δεν μπόρεσε να μετακινηθεί
library-collection-added = { $count ->
    [one] { $count } αναφορά προστέθηκε στη «{ $name }»
   *[other] { $count } αναφορές προστέθηκαν στη «{ $name }»
}
library-collection-already = Ήδη στη «{ $name }»
library-collection-delete = Διαγραφή συλλογής
library-collection-delete-title = Διαγραφή της συλλογής «{ $name }»;
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Οι αναφορές μένουν στη βιβλιοθήκη σας.
   *[other] Οι συλλογές μέσα της διαγράφονται επίσης. Οι αναφορές μένουν στη βιβλιοθήκη σας.
}
library-collection-delete-failed = Η συλλογή δεν μπόρεσε να διαγραφεί
library-collection-count = { $count ->
    [one] { $count } συλλογή
   *[other] { $count } συλλογές
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Χάρτης της βιβλιοθήκης
library-map-title-collection = Χάρτης μιας συλλογής
# The name a project made of the whole library is given.
library-map-library-name = Η βιβλιοθήκη
library-map-name = Όνομα
library-map-name-hint = Το όνομα του έργου, του χάρτη του, και του στοιχείου στο κέντρο του χάρτη.
library-map-what-library = Οι συλλογές γίνονται στοιχεία, η μία μέσα στην άλλη όπως είναι, και κάθε αναφορά στοιχείο κάτω από τη συλλογή της, με κείμενο μια παραπομπή σε αυτήν. Οι αναφορές που δεν είναι σε συλλογή μπαίνουν στο κέντρο.
library-map-what-collection = Οι συλλογές μέσα της γίνονται στοιχεία, η μία μέσα στην άλλη όπως είναι, και κάθε αναφορά στοιχείο κάτω από τη συλλογή της, με κείμενο μια παραπομπή σε αυτήν.
library-map-nothing = Δεν υπάρχουν αναφορές να μπουν στον χάρτη.
library-map-make = Δημιουργία του έργου
library-map-making = Φτιάχνεται το έργο…
library-map-failed = Το έργο δεν μπόρεσε να φτιαχτεί.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } αρχείο
   *[other] { $count } αρχεία
}
library-open-failed = Η αναφορά δεν μπόρεσε να ανοίξει
library-known = { $count ->
    [one] Υπάρχει ήδη στη βιβλιοθήκη σας
   *[other] Υπάρχουν ήδη στη βιβλιοθήκη σας
}
library-nothing-to-import = Τίποτα για εισαγωγή
library-none-found = Δεν βρέθηκαν αναφορές.
library-import-kinds = Οι αναφορές διαβάζονται από αρχεία .bib, και φτιάχνονται από αρχεία PDF.
library-filter-bib = BibLaTeX και BibTeX
library-filter-all = Όλα τα αρχεία
library-files-read-failed = { $count ->
    [one] Το αρχείο δεν διαβάζεται
   *[other] Τα αρχεία δεν διαβάζονται
}
library-text-read-failed = Το κείμενο δεν διαβάζεται
library-add-pdfs-title = Προσθήκη αρχείων PDF
library-pdfs-working = { $count ->
    [one] Αναγνώριση του αρχείου…
   *[other] Αναγνώριση { $count } αρχείων…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } από { $count }: { $name }
library-stop = Διακοπή
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] Προστέθηκε { $count } αναφορά
   *[other] Προστέθηκαν { $count } αναφορές
}
library-imported-completed = { $count } συμπληρώθηκαν
library-imported-skipped = { $count } ήδη στη βιβλιοθήκη
library-imported-files = { $count ->
    [one] Φυλάχτηκε { $count } αρχείο
   *[other] Φυλάχτηκαν { $count } αρχεία
}
library-imported-nothing = Δεν άλλαξε τίποτα
library-paste-title = Επικόλληση αναφορών
library-paste-subtitle = BibLaTeX ή BibTeX, όσες εγγραφές θέλετε
library-paste-continue = Συνέχεια
library-source-label = Πηγή BibLaTeX

## Importing from Zotero.

library-zotero-title = Εισαγωγή από το Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Δεν βρέθηκε Zotero σε αυτόν τον υπολογιστή, στα μέρη όπου συνήθως κρατά τα δεδομένα του. Αν τα κρατά αλλού, δείξτε πού: τον φάκελο που περιέχει το { $file }.
library-zotero-lead = Ό,τι εισάγεται αντιγράφεται στη βιβλιοθήκη σας, με τα αρχεία του. Το Zotero μόνο διαβάζεται, και τίποτα σε αυτό δεν αλλάζει· μπορεί να τρέχει στο μεταξύ.
library-zotero-choose = Ο φάκελος δεδομένων του Zotero
library-zotero-none-there = Δεν υπάρχει Zotero εκεί.
library-zotero-unread = Το Zotero δεν διαβάζεται.
library-zotero-library = Βιβλιοθήκη
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Η βιβλιοθήκη μου
library-zotero-what = Τι να εισαχθεί
library-zotero-everything = Όλα
library-zotero-with-files = Με τα συνημμένα αρχεία
library-zotero-with-notes = Με τις σημειώσεις, ως σχολιασμό
library-zotero-elsewhere = Άλλο μέρος…
library-zotero-show-where = Δείξτε πού…
library-zotero-reading = Ανάγνωση…
library-zotero-read = { $count ->
    [0] Ανάγνωση
    [one] Ανάγνωση { $count } αναφοράς
   *[other] Ανάγνωση { $count } αναφορών
}

## Writing a reference.

library-dialog-edit = Επεξεργασία αναφοράς
library-dialog-add = Προσθήκη αναφοράς
library-dialog-back = Πίσω στη φόρμα
library-dialog-open-failed = Η αναφορά δεν μπόρεσε να ανοίξει.
library-dialog-save-failed = Η αναφορά δεν μπόρεσε να αποθηκευτεί.
# The entry as BibLaTeX, as against the form.
library-source = Πηγή
library-source-unread = Η πηγή δεν διαβάζεται.

## A reference, beside the list.

library-pane-label = Αναφορά
library-pane-more = Περισσότερα
library-pane-saved = Αποθηκεύτηκε
library-pane-editing = Επεξεργασία…
library-pane-not-saved = Δεν αποθηκεύτηκε
library-pane-unread = Η αναφορά δεν διαβάζεται.
library-pane-save-failed = Οι αλλαγές δεν μπόρεσαν να αποθηκευτούν.
library-pane-note-placeholder = Η γνώμη σας γι’ αυτό. Για εσάς: δεν είναι μέρος όσων παρατίθενται.
library-pane-files = Αρχεία
library-pane-attach = Επισύναψη
library-pane-attach-title = Επισύναψη αρχείων
library-pane-attach-failed = Το αρχείο δεν μπόρεσε να επισυναφθεί
# Of a file that is attached, and not where it should be.
library-pane-missing = λείπει
library-pane-reveal = Εμφάνιση στον διαχειριστή αρχείων
library-pane-reveal-failed = Ο φάκελος δεν μπόρεσε να ανοίξει
library-pane-no-files = Κανένα αρχείο. Επισυνάψτε ένα PDF, ή αφήστε ένα εδώ.
library-pane-detach = Αφαίρεση αρχείου
library-pane-detach-title = Αφαίρεση του «{ $name }»;
library-pane-detach-message = Το αρχείο διαγράφεται από την αποθήκη της βιβλιοθήκης, εκτός αν το χρησιμοποιεί άλλη αναφορά.
library-pane-detach-failed = Το αρχείο δεν μπόρεσε να αφαιρεθεί
library-pane-leave-collection = Αφαίρεση από { $name }
library-pane-duplicate = Αντίγραφο
    .hint = Νέα αναφορά που αρχίζει με αυτά τα στοιχεία
library-pane-edit-source = Επεξεργασία της πηγής…
library-pane-source-subtitle = Η εγγραφή ως BibLaTeX. Τα περισσότερα είναι ευκολότερα στη φόρμα.
library-pane-source-failed = Η πηγή δεν μπόρεσε να εμφανιστεί
library-pane-added = Προστέθηκε { $date }
library-pane-added-changed = Προστέθηκε { $added } · άλλαξε { $changed }

## Looking up a reference.

library-lookup-placeholder = Ανεύρεση: DOI, ISBN, ή λέξεις του τίτλου και του συγγραφέα
library-lookup-label = Ανεύρεση αναφοράς
library-lookup-failed = Δεν μπόρεσε να βρεθεί τίποτα.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Συμπληρώθηκε από { $source }.
library-lookup-others = { $count ->
    [one] { $count } άλλη εγγραφή
   *[other] { $count } άλλες εγγραφές
}
library-lookup-scope = Τι να αναζητηθεί
library-lookup-any = Οτιδήποτε
library-lookup-books = Βιβλία
library-lookup-articles = Άρθρα
library-lookup-none = Δεν βρέθηκε τίποτα. Λιγότερες λέξεις ίσως βρουν περισσότερα: το επώνυμο του συγγραφέα και μία δυο λέξεις του τίτλου.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Τίποτα δεν είναι γνωστό για { $kind ->
        [doi] αυτό το DOI
        [isbn] αυτό το ISBN
        [arxiv] αυτόν τον αριθμό arXiv
       *[pmid] αυτόν τον αριθμό PubMed
    } εκεί όπου ρωτήθηκε. Η αναφορά μπορεί να γραφτεί με το χέρι παρακάτω.

## What the writer writes about a work.

library-notes = Σημειώσεις
library-notes-yours = Οι σημειώσεις σας
library-notes-on-work = Οι σημειώσεις σας για αυτό το έργο
library-notes-read = Διαβάστε τις σημειώσεις σας
library-notes-write = Γράψτε μια σημείωση
library-notes-write-on-work = Γράψτε μια σημείωση για αυτό το έργο
library-notes-not-in-library = Μια αναφορά που δεν είναι στη βιβλιοθήκη σας
library-notes-this-project = Σε αυτό το έργο
library-notes-all-projects = Σε όλα τα έργα
library-notes-project-placeholder = Η γνώμη σας γι’ αυτό, για αυτή τη δουλειά
library-notes-all-placeholder = Η γνώμη σας γι’ αυτό, όπου κι αν το παραθέτετε
library-notes-keep-for-all = Να κρατηθεί για όλα τα έργα
library-notes-write-for-all = Γράψτε για όλα τα έργα
library-notes-carried = Η αναφορά ήρθε με το έργο, και δεν είναι στη βιβλιοθήκη σας. Ό,τι γράφεται εδώ το έχουν όλοι όσοι έχουν το έργο.
library-notes-kept = Κρατιέται με την αναφορά στη βιβλιοθήκη σας. Συνοδεύει κάθε έργο που παραθέτει αυτή την αναφορά.
library-notes-unread = Οι σημειώσεις σας δεν διαβάζονται
library-notes-unsaved = Η σημείωσή σας δεν μπόρεσε να κρατηθεί
