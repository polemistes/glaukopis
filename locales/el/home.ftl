# The projects: the list of them, and what is done with them.

home-title = Έργα
home-join = Συμμετοχή σε κοινό έργο
home-from-document = Έργο από έγγραφο…
home-new = Νέο έργο

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Τι εμφανίζεται
home-recent = Πρόσφατα
home-all = Όλα τα έργα
# Under the cards, when there are more projects than they show.
home-show-all = Εμφάνιση και των { $count } έργων
# The button that opens the menu of the page.
home-page-menu = Περισσότερα
home-search = Εύρεση έργου
home-search-none = Κανένα έργο δεν έχει αυτό το όνομα.
home-list-none = Δεν υπάρχουν έργα.

## Folders of projects

home-new-folder = Νέος φάκελος
home-folder-new-inside = Νέος φάκελος μέσα…
home-folder-rename-title = Μετονομασία φακέλου
home-folder-name-placeholder = Τι περιέχει ο φάκελος
home-folder-name-missing = Δώστε όνομα στον φάκελο.
home-folder-projects = { $count ->
    [one] { $count } έργο
   *[other] { $count } έργα
}
home-menu-move = Μετακίνηση σε φάκελο
home-menu-out = Έξω από τους φακέλους
home-folder-delete-title = Διαγραφή του φακέλου «{ $name }»;
home-folder-delete-message = Οι φάκελοι και τα έργα μέσα του κρατιούνται: ανεβαίνουν εκεί που ήταν ο φάκελος.
home-folder-delete-confirm = Διαγραφή φακέλου
home-folder-failed = Αυτό δεν μπόρεσε να γίνει με τον φάκελο
home-moved-to = Το «{ $name }» μετακινήθηκε στο { $folder }
home-moved-out = Το «{ $name }» δεν είναι πια σε φάκελο
home-move-failed = Το έργο δεν μπόρεσε να μετακινηθεί

## A map of the projects

home-map-menu = Χάρτης των έργων…
home-map-title = Χάρτης των έργων
home-map-about = Ένα νέο έργο, με έναν χάρτη: οι φάκελοι ως στοιχεία, και κάτω από κάθε φάκελο τα έργα μέσα του.
home-map-name-default = Έργα
home-map-what = Τι περιέχει ο χάρτης
home-map-names = Μόνο τα ονόματα
home-map-names-hint = Ένα στοιχείο για κάθε έργο, με την περιγραφή του ως κείμενο.
home-map-everything = Με όλα όσα περιέχουν
home-map-everything-hint = Κάτω από κάθε έργο οι χάρτες του, και κάτω από κάθε χάρτη όλα τα στοιχεία του, με τα ονόματα και τα κείμενά τους.
home-map-note = Οι παραπομπές κρατούν τις αναφορές τους. Μια εσωτερική παραπομπή σε σχήμα ή μέρος δεν δείχνει πουθενά στο νέο έργο, και τα σχόλια μένουν πίσω.
home-map-reading = Ανάγνωση του «{ $name }»…
home-map-working = Φτιάχνεται ο χάρτης…
home-map-make = Δημιουργία του χάρτη
home-map-failed = Ο χάρτης των έργων δεν μπόρεσε να φτιαχτεί

## When there are none yet

home-welcome = Καλώς ήρθατε στο Glaukopis
home-welcome-text = Ένα έργο περιέχει τη δουλειά για ένα βιβλίο ή άρθρο: τους χάρτες των ιδεών σας, τα κείμενα που γράφετε μέσα τους, και τις αναφορές στις οποίες στηρίζονται.
home-begin = Ξεκινήστε ένα έργο

## A project in the list

# Under the names of the first four maps.
home-more-maps = και { $count } ακόμη
home-maps = { $count ->
    [one] { $count } χάρτης
   *[other] { $count } χάρτες
}
home-elements = { $count ->
    [one] { $count } στοιχείο
   *[other] { $count } στοιχεία
}
home-words = { $count ->
    [one] { $count } λέξη
   *[other] { $count } λέξεις
}
home-references = { $count ->
    [one] { $count } αναφορά
   *[other] { $count } αναφορές
}
home-not-begun = Δεν έχει αρχίσει
home-shared = Κοινό
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Άλλαξε { $ago }
# The button that opens the menu of a project.
home-more-for = Περισσότερα για το { $name }
home-deleted-projects = { $count ->
    [one] { $count } διαγραμμένο έργο
   *[other] { $count } διαγραμμένα έργα
}

## The menu of a project

home-menu-rename = Μετονομασία…
home-menu-duplicate = Αντίγραφο…
home-menu-history = Προηγούμενες εκδόσεις…

## Naming a project

home-rename-title = Μετονομασία έργου
home-duplicate-title = Αντίγραφο του έργου
home-name = Όνομα
home-name-placeholder = Ο προσωρινός τίτλος του βιβλίου ή του άρθρου
home-name-missing = Δώστε όνομα στο έργο.
home-create = Δημιουργία
home-duplicate = Αντίγραφο
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, αντίγραφο
home-failed = Αυτό δεν πέτυχε.

## Deleting a project

home-delete-title = Διαγραφή του «{ $name }»;
home-delete-message = Το έργο μετακινείται στα απορρίμματα του Glaukopis, από όπου μπορεί να επανέλθει. Οι αναφορές σας δεν θίγονται.
home-delete-owner = Το έργο μετακινείται στα απορρίμματα του Glaukopis, από όπου μπορεί να επανέλθει. Μένει στον διακομιστή και σε όσους το μοιράζεστε· για να φύγει από τον διακομιστή, ανοίξτε το και σταματήστε πρώτα την κοινή χρήση.
home-delete-member = Το έργο μετακινείται στα απορρίμματα του Glaukopis, από όπου μπορεί να επανέλθει. Οι άλλοι κρατούν το δικό τους.
home-delete-confirm = Διαγραφή έργου
home-deleted = Το «{ $name }» μετακινήθηκε στα απορρίμματα
home-delete-failed = Το έργο δεν μπόρεσε να διαγραφεί

## The trash

home-trash-title = Διαγραμμένα έργα
home-trash-none = Δεν υπάρχει κανένα.
home-deleted-ago = Διαγράφηκε { $ago }
home-restore = Επαναφορά
home-restored = Το «{ $name }» είναι πάλι ανάμεσα στα έργα
home-restore-failed = Το έργο δεν μπόρεσε να επανέλθει
home-purge = Οριστική αφαίρεση
home-purge-title = Οριστική αφαίρεση του «{ $name }»;
home-purge-message = Ό,τι περιέχει το έργο δεν μπορεί να επανέλθει μετά από αυτό. Οι αναφορές σας δεν θίγονται.
home-purge-failed = Το έργο δεν μπόρεσε να αφαιρεθεί

## Earlier versions of a project

home-history-title = Προηγούμενες εκδόσεις
home-history-about = Του «{ $name }». Μια έκδοση ανοίγει ως ξεχωριστό έργο· αυτό μένει όπως είναι.
home-history-none = Δεν έχει κρατηθεί καμία ακόμη. Μια έκδοση κρατιέται πού και πού όσο δουλεύετε: πυκνά για τα πρόσφατα, πιο αραιά για τα παλιά.
home-history-open = Άνοιγμα αντιγράφου
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, όπως στις { $day }
home-history-unread = Οι προηγούμενες εκδόσεις δεν διαβάζονται
home-history-open-failed = Αυτή η έκδοση δεν μπόρεσε να ανοίξει
