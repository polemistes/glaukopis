# The full history of a project, in English.
# See locales/README.md.

history-title = Ιστορικό
history-between = Ανάμεσα στους χάρτες και στο ιστορικό
history-settings = Ρυθμίσεις του ιστορικού
history-failed = Το ιστορικό δεν διαβάζεται.
history-reading = Ανάγνωση του ιστορικού…

## When it is not kept

history-off = Το ιστορικό αυτού του έργου δεν κρατιέται.
history-on-word = Κάθε αλλαγή κρατιέται
history-off-word = Δεν κρατιέται
history-off-about = Όσο κρατιέται, κρατιέται κάθε αλλαγή, με το ποιος την έκανε και πότε: το έργο μπορεί να ιδωθεί όπως ήταν οποιαδήποτε στιγμή, και να επανέλθει. Πιάνει χώρο, και σε κοινό έργο δείχνει στους άλλους τι έγραψε ο καθένας, και πότε.
history-turn-on = Να κρατιέται το ιστορικό

## The moments

# Someone whose name the history does not know.
history-someone = Κάποιος
history-began = Το ιστορικό αρχίζει
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = κρατημένο πιο αδρά
history-added = { $count ->
    [one] +1 χαρακτήρας
   *[other] +{ $count } χαρακτήρες
}
history-removed = { $count ->
    [one] −1 χαρακτήρας
   *[other] −{ $count } χαρακτήρες
}

## The map as it was

history-back = Πίσω στο παρόν
history-as-it-was = Όπως ήταν { $when }
history-marked = Ό,τι άλλαξε από την προηγούμενη στιγμή σημειώνεται με το χρώμα εκείνου που το άλλαξε.
history-map-not-there = Αυτός ο χάρτης δεν υπήρχε τότε.
history-added-by = Προστέθηκε από { $name }
history-removed-by = Αφαιρέθηκε από { $name }
history-changed-by = Άλλαξε από { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = εσωτερική παραπομπή
history-name-moment = Όνομα σε αυτή τη στιγμή
history-name-placeholder = Πώς να λέγεται
history-named = Η στιγμή λέγεται «{ $name }».
history-bring-back-element = Επαναφορά αυτού του στοιχείου όπως ήταν
history-bring-back-map = Επαναφορά του χάρτη όπως ήταν
history-brought-back = Επανήλθε όπως ήταν. Η αναίρεση το παίρνει πίσω.
history-bring-back-failed = Δεν μπόρεσε να επανέλθει.
history-open-copy = Άνοιγμα ως ξεχωριστού έργου
history-copy-name = { $name }, όπως ήταν { $day }
history-copy-failed = Το έργο δεν μπόρεσε να φτιαχτεί.

## Archives

history-open-archive = Άνοιγμα αρχειοθετημένου ιστορικού…
history-archive-kind = Ιστορικό του Glaukopis
history-archive-unread = Το αρχείο δεν διαβάζεται.
history-archive-of = Αρχείο: { $name }
history-archive-close = Κλείσιμο

## Settings

history-keep = Να κρατιέται το ιστορικό
history-room = Το ιστορικό πιάνει { $size }.
history-turn-off-title = Να πάψει να κρατιέται το ιστορικό;
history-turn-off-message = Ό,τι κρατήθηκε διαγράφεται. Το ίδιο το έργο μένει όπως είναι.
history-turn-off-shared = Ό,τι κρατήθηκε διαγράφεται, εδώ και στους υπολογιστές εκείνων με τους οποίους μοιράζεστε το έργο. Το ίδιο το έργο μένει όπως είναι.
history-turn-off = Διαγραφή του ιστορικού
history-finely = Παλιότερο ιστορικό
history-finely-about = Οι παλιότερες αλλαγές συγχωνεύονται, ώστε να πιάνουν λιγότερο χώρο και να διαβάζονται γρηγορότερα· οι στιγμές μέσα τους δεν ξεχωρίζουν πια. Οι στιγμές με όνομα, και εκείνες με τις οποίες συγκρίνουν οι επισκοπήσεις, κρατιούνται.
history-hourly = Συγχώνευση κάθε ώρας σε μία μετά από
history-weeks = { $count ->
    [one] εβδομάδα
   *[other] εβδομάδες
}
history-daily = Συγχώνευση κάθε ημέρας σε μία μετά από
history-months = { $count ->
    [one] μήνα
   *[other] μήνες
}
history-before = Ό,τι προηγήθηκε
history-before-choose = Επιλέξτε μια στιγμή στο ιστορικό για να αρχειοθετήσετε ή να διαγράψετε ό,τι προηγήθηκε.
history-before-about = Το ιστορικό πριν από { $when } μπορεί να αρχειοθετηθεί σε ένα αρχείο, για να ιδωθεί αργότερα, ή να διαγραφεί.
history-archive = Αρχειοθέτηση…
history-delete = Διαγραφή
history-archive-title = Αρχειοθέτηση του ιστορικού πριν από { $when };
history-delete-title = Διαγραφή του ιστορικού πριν από { $when };
history-cut-message = Ό,τι μένει αρχίζει με το έργο όπως ήταν τότε.
history-cut-kept = { $count ->
    [one] Μια στιγμή με όνομα ή επισκόπηση προηγείται, και δεν θα μπορεί πια να ιδωθεί εδώ.
   *[other] { $count } στιγμές με όνομα ή επισκόπηση προηγούνται, και δεν θα μπορούν πια να ιδωθούν εδώ.
}
history-cut-not-here = Το ιστορικό δεν μπορεί να κοπεί πριν από αυτή τη στιγμή.
history-cut-failed = Το ιστορικό δεν μπόρεσε να κοπεί.
history-archive-until = έως { $when }
history-archived = Το ιστορικό πριν από { $when } αρχειοθετήθηκε.
history-deleted = Το ιστορικό πριν από { $when } διαγράφηκε.
