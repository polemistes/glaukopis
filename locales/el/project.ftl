# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Τα έργα δεν διαβάζονται

## The view of a project

project-open-failed = Το έργο δεν μπόρεσε να ανοίξει
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Το έργο δεν μπόρεσε να ανοίξει.
project-back = Πίσω στα έργα
project-fetching = Λήψη του έργου
project-fetching-offline = Δεν υπάρχει πρόσβαση στον διακομιστή. Το έργο θα ληφθεί όταν γίνει δυνατό.
project-fetching-on-the-way = Έρχεται από τον διακομιστή.
project-name = Όνομα του έργου
project-rename = Μετονομασία του έργου
project-not-saved = Δεν αποθηκεύτηκε
project-redo = Επανάληψη
project-view-this = Προβολή αυτού του χάρτη
project-diagram = Διάγραμμα
project-text = Κείμενο
project-one-at-a-time = Ένας κάθε φορά
project-side-by-side = Δύο δίπλα δίπλα
project-close-side = Κλείσιμο αυτής της πλευράς
project-references = Αναφορές
project-side-map = Χάρτης
project-between-maps = Ανάμεσα στους δύο χάρτες

## When the sharing ends from the other side

project-unshared = Το έργο δεν είναι πια σε κοινή χρήση
project-unshared-this = Αυτό το έργο δεν είναι πια σε κοινή χρήση
project-left-out = Δεν είστε πια ανάμεσα στους συνεργάτες
project-unshared-unfetched = Δεν είχε ληφθεί, οπότε δεν υπάρχει τίποτα από αυτό σε αυτόν τον υπολογιστή.
project-unshared-kept = Εκείνος που το μοιραζόταν το αφαίρεσε από τον διακομιστή. Κρατάτε το έργο όπως είναι τώρα, και μπορείτε να συνεχίσετε να δουλεύετε σε αυτό μόνοι σας.
project-left-out-kept = Κρατάτε το έργο όπως είναι τώρα, και μπορείτε να συνεχίσετε να δουλεύετε σε αυτό μόνοι σας. Ό,τι γράψουν οι άλλοι από εδώ και πέρα δεν φτάνει σε εσάς.
project-understood = Κατανοητό

## Files dropped on the project

project-drop-picture = Αφήστε την εικόνα πάνω στο στοιχείο όπου ανήκει
project-cited-in = { $count ->
    [one] Η αναφορά παρατίθεται στο «{ $name }»
   *[other] { $count } αναφορές παρατίθενται στο «{ $name }»
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] Η αναφορά παρατίθεται στο «στοιχείο»
   *[other] { $count } αναφορές παρατίθενται στο «στοιχείο»
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Χωρίς τίτλο
project-drop-on-map = Αφήστε πάνω σε χάρτη για μετακίνηση εκεί · με πατημένο το Ctrl για αντιγραφή
project-open-beside = Άνοιγμα δίπλα
project-open-beside-hint = Δύο χάρτες δίπλα δίπλα, για να μετακινείτε στοιχεία ανάμεσά τους
project-side-by-side-short = Δίπλα δίπλα
# The count is of those found in the map.
project-found-hint = { $count } προς εξέταση, για να γίνουν παραπομπές
project-copied-to = Αντιγράφηκε στο «{ $name }»
project-moved-to = Μετακινήθηκε στο «{ $name }»

## What is done to elements, in the diagram and in the text

project-write-text = Γραφή του κειμένου του
project-associate = Συσχέτιση με…
project-leave-out = Έξω από το έγγραφο
project-copy = Αντιγραφή
# Pasting what was copied under the element the menu is of.
project-paste-under = Επικόλληση από κάτω του
project-tidy-branch = Τακτοποίηση αυτού του κλάδου
project-place-automatically = Αυτόματη τοποθέτηση
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] Το «{ $name }» διαγράφηκε
    [one] Το «{ $name }» διαγράφηκε, με { $under } στοιχείο από κάτω του
   *[other] Το «{ $name }» διαγράφηκε, με { $under } στοιχεία από κάτω του
}
project-deleted-many = { $count ->
    [one] Διαγράφηκε { $count } στοιχείο
   *[other] Διαγράφηκαν { $count } στοιχεία
}

project-delete-busy-title = Κάποιος γράφει εδώ
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] δουλεύει
   *[other] δουλεύουν
} σε ό,τι θα διαγραφόταν. Ό,τι γράφεται εκεί τώρα θα χανόταν μαζί του, και δεν μπορεί να επανέλθει.
project-delete-busy-confirm = Διαγραφή παρ’ όλα αυτά

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Στοιχείο
project-name-placeholder = Όνομα
project-write-here = Γράψτε εδώ. Πληκτρολογήστε @ για παραπομπή.
project-words = { $count ->
    [one] { $count } λέξη
   *[other] { $count } λέξεις
}
project-read-on = Διπλό κλικ για να διαβάσετε παρακάτω
project-left-out-of-document = Έξω από το έγγραφο

## The panels at the side: the references and the pictures

project-this-map = Αυτός ο χάρτης
project-project = Έργο
project-library = Βιβλιοθήκη
project-nothing-found = Δεν βρέθηκε τίποτα
project-edit-reference = Επεξεργασία της αναφοράς…
project-new-reference = Νέα αναφορά
project-import-file = Εισαγωγή αρχείου
project-which-references = Ποιες αναφορές
project-search-references = Αναζήτηση αναφορών
project-library-empty = Η βιβλιοθήκη σας είναι άδεια
project-library-empty-hint = Προσθέστε μια αναφορά, ή εισαγάγετε όσες έχετε.
project-no-references = Καμία αναφορά ακόμη
project-no-references-hint = Ό,τι παραθέτετε καθώς γράφετε καταγράφεται εδώ. Για παραπομπή, επιλέξτε Παραπομπή πάνω από το κείμενο, ή πληκτρολογήστε @.
project-cited-in-heading = Παρατίθεται σε
project-not-cited = Δεν παρατίθεται σε αυτό το έργο.
project-references-drag = Σύρετε μια αναφορά μέσα σε κείμενο για παραπομπή εκεί, ή πάνω σε στοιχείο για παραπομπή στο τέλος του κειμένου του.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } σε αυτό το έργο δεν είναι στη βιβλιοθήκη σας.
   *[other] { $count } σε αυτό το έργο δεν είναι στη βιβλιοθήκη σας.
}
# The store of pictures.
project-store = Αποθήκη
project-open-picture = Άνοιγμα…
project-put-into-text = Να μπει στο κείμενο
project-add-pictures = Προσθήκη εικόνων από αρχεία
project-which-pictures = Ποιες εικόνες
project-search-pictures = Αναζήτηση εικόνων
project-a-picture = Μια εικόνα
project-with-notes = Με σημειώσεις
project-not-on-computer = Όχι σε αυτόν τον υπολογιστή
project-nothing-said = Δεν λέγεται τίποτα γι’ αυτήν ακόμη
project-store-empty = Η αποθήκη είναι άδεια
project-store-empty-hint = Προσθέστε εικόνες από αρχεία, ή αφήστε τες πάνω σε κείμενο.
project-no-pictures = Καμία εικόνα ακόμη
project-no-pictures-map = Οι εικόνες των σχημάτων αυτού του χάρτη καταγράφονται εδώ. Αυτές της αποθήκης είναι κάτω από το Αποθήκη.
project-no-pictures-project = Οι εικόνες των σχημάτων του έργου καταγράφονται εδώ. Αυτές της αποθήκης είναι κάτω από το Αποθήκη.
project-pictures-drag = Σύρετε μια εικόνα μέσα σε κείμενο για να γίνει σχήμα εκεί, ή πάνω σε στοιχείο για να μπει στο τέλος του κειμένου του.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } σε αυτόν τον χάρτη δεν είναι σε αυτόν τον υπολογιστή.
   *[other] { $count } σε αυτόν τον χάρτη δεν είναι σε αυτόν τον υπολογιστή.
}
project-pictures-absent-project = { $count ->
    [one] { $count } σε αυτό το έργο δεν είναι σε αυτόν τον υπολογιστή.
   *[other] { $count } σε αυτό το έργο δεν είναι σε αυτόν τον υπολογιστή.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } στοιχείο
   *[other] { $count } στοιχεία
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } είναι εδώ
project-link-placeholder = Πώς σχετίζονται
project-link-label = Ετικέτα της συσχέτισης

## A copy and its original, in another map.
copy-title = Το αντίγραφο και το πρωτότυπό του
copy-original-changed = Το πρωτότυπο άλλαξε αφότου αντιγράφηκε, ή αφότου ιδώθηκε τελευταία φορά.
copy-original-same = Το πρωτότυπο είναι όπως ήταν όταν αντιγράφηκε.
copy-original-unknown = Αν το πρωτότυπο άλλαξε αφότου αντιγράφηκε δεν είναι γνωστό: το αντίγραφο έγινε πριν αρχίσει να κρατιέται αυτό.
copy-original-gone = Το πρωτότυπο δεν υπάρχει πια.
copy-how-shown = Παρακάτω, διαγραμμένο, είναι ό,τι έχει μόνο το πρωτότυπο, και σημειωμένο, ό,τι έχει μόνο αυτό το αντίγραφο.
copy-alike = Τα ονόματα και τα κείμενά τους είναι όμοια. Μπορεί να διαφέρουν σε ό,τι δεν είναι λέξεις: παραπομπές, εικόνες, σημάνσεις.
copy-only-original = Μόνο στο πρωτότυπο
copy-only-copy = Μόνο σε αυτό το αντίγραφο
copy-go = Μετάβαση στο πρωτότυπο
copy-seen = Να μείνει αυτό το αντίγραφο όπως είναι
copy-take = Λήψη του ονόματος και του κειμένου του πρωτοτύπου
copy-changed-mark = Το πρωτότυπο άλλαξε αφότου αντιγράφηκε αυτό
copy-compare = Σύγκριση με το πρωτότυπο…

## How far the writing of an element has come, as its writer says.
status = Κατάσταση
status-idea = Ιδέα
status-draft = Πρόχειρο
status-done = Έτοιμο
status-none = Χωρίς κατάσταση
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } λέξη
   *[other] { $count } λέξεις
}
status-count-idea = { $count ->
    [one] { $count } ιδέα
   *[other] { $count } ιδέες
}
status-count-draft = { $count ->
    [one] { $count } πρόχειρο
   *[other] { $count } πρόχειρα
}
status-count-done = { $count } έτοιμα
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } λέξη γραμμένη
   *[other] { $count } λέξεις γραμμένες
}
status-progress = Πόσο έχει προχωρήσει ο χάρτης
