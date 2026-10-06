# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF και εικόνες
ocr-no-tesseract = Το Tesseract, που διαβάζει κείμενο μέσα σε εικόνες, δεν είναι εγκατεστημένο ή δεν βρέθηκε. Εγκαταστήστε το με τον διαχειριστή πακέτων του συστήματός σας, μαζί με τα δεδομένα των γλωσσών που διαβάζετε (στο Arch: tesseract και tesseract-data-eng, tesseract-data-ell και ούτω καθεξής), ή πείτε στις ρυθμίσεις πού βρίσκεται.
ocr-failed = Το κείμενο δεν μπόρεσε να διαβαστεί.
ocr-looking = Εξέταση του { $file }…
ocr-about-picture = Το κείμενο διαβάζεται από την εικόνα.
ocr-about-scan = { $pages ->
    [one] Το PDF δεν έχει κείμενο: διαβάζεται από την εικόνα της σελίδας του.
   *[other] Καμία από τις { $pages } σελίδες δεν έχει κείμενο: διαβάζονται από τις εικόνες τους.
}
ocr-about-some = { $without ->
    [one] Μία από τις { $pages } σελίδες δεν έχει κείμενο, και διαβάζεται από την εικόνα της· οι άλλες παίρνονται όπως είναι.
   *[other] { $without } από τις { $pages } σελίδες δεν έχουν κείμενο, και διαβάζονται από τις εικόνες τους· οι άλλες παίρνονται όπως είναι.
}
ocr-about-text = { $pages ->
    [one] Η σελίδα έχει κείμενο, που παίρνεται όπως είναι.
   *[other] Κάθε σελίδα έχει κείμενο, που παίρνεται όπως είναι.
}
ocr-read-all = Ανάγνωση και των σελίδων που έχουν κείμενο
ocr-read-all-hint = Το κείμενό τους μένει, και ό,τι διαβάζεται απλώνεται από πάνω του.
ocr-read-all-map-hint = Ό,τι διαβάζεται παίρνει τη θέση του κειμένου τους: για όταν είναι κακό, ή δεν διαβάζεται.
ocr-read = Ανάγνωση του κειμένου
ocr-read-text-pages = Λήψη των σελίδων που έχουν κείμενο
ocr-take-text = Λήψη του κειμένου
ocr-reading = Ανάγνωση του { $file }…
ocr-reading-pages = Διαβάστηκαν { $done } από { $total } σελίδες
ocr-reading-hint = Μια σελίδα θέλει λίγα δευτερόλεπτα. Το Άκυρο σταματά την ανάγνωση.

## How the text is read: what to try when a reading goes badly

ocr-how = Πώς διαβάζεται
ocr-how-dpi = Ανάλυση, σε κουκκίδες ανά ίντσα
ocr-how-layout = Διάταξη της σελίδας
ocr-how-layout-auto = Όπως κρίνει το Tesseract
ocr-how-layout-column = Μία στήλη
ocr-how-layout-block = Ένα μπλοκ κειμένου
ocr-how-layout-sparse = Αραιό κείμενο
ocr-how-contrast = Ασπρόμαυρο
ocr-how-hint = Τι να δοκιμάσετε όταν μια ανάγνωση πάει άσχημα: μεγαλύτερη ανάλυση για ψιλά γράμματα, μία στήλη όπου οι στήλες μπερδεύονται, ένα μπλοκ κειμένου για μία μόνο παράγραφο, και ασπρόμαυρο για τύπωμα αχνό ή ανομοιόμορφο.

## The languages of the text

ocr-languages = Γλώσσες του κειμένου
ocr-languages-hint = Η πιθανότερη πρώτη. Κάθε επιπλέον κάνει την ανάγνωση πιο αργή, και όχι πάντα καλύτερη.
ocr-language-add = Προσθήκη γλώσσας…
ocr-language-remove = Αφαίρεση: { $language }
# A script rather than a language: "Latin script".
ocr-language-script = Γραφή { $script }
ocr-language-fraktur = { $language }, Fraktur
ocr-language-old = { $language }, παλαιότερα
ocr-language-vertical = { $language }, κάθετη γραφή

## A PDF of the library made searchable

ocr-searchable-button = Να γίνει αναζητήσιμο…
ocr-searchable-title = Να γίνει το PDF αναζητήσιμο
ocr-searchable-about = { $without ->
    [one] Μία από τις { $pages } σελίδες δεν έχει κείμενο. Διαβάζεται, και το κείμενό της απλώνεται αόρατο κάτω από ό,τι φαίνεται, ώστε να μπορεί να αναζητηθεί και να αντιγραφεί. Το PDF δείχνει όπως ήταν.
   *[other] { $without } από τις { $pages } σελίδες δεν έχουν κείμενο. Διαβάζονται, και το κείμενό τους απλώνεται αόρατο κάτω από ό,τι φαίνεται, ώστε να μπορεί να αναζητηθεί και να αντιγραφεί. Το PDF δείχνει όπως ήταν.
}
ocr-searchable-has-text = { $pages ->
    [one] Η σελίδα έχει κείμενο: το PDF είναι ήδη αναζητήσιμο.
   *[other] Κάθε σελίδα έχει κείμενο: το PDF είναι ήδη αναζητήσιμο.
}
ocr-searchable-damaged = Το PDF δεν μπόρεσε να ανοιχτεί για αλλαγή: μπορεί να είναι κατεστραμμένο. Το κείμενό του μπορεί πάντως να εισαχθεί σε ένα έργο ως χάρτης.
ocr-searchable-make = Να γίνει αναζητήσιμο
ocr-strip = Αφαίρεση του αόρατου κειμένου που έχουν, και να μείνει μόνο ό,τι διαβάζεται
ocr-strip-hint = Για στρώμα κειμένου που είναι κακό, όπως το απλώνει ένας σαρωτής κάτω από τη σελίδα. Τα γράμματα που φαίνονται μένουν, και η σελίδα δείχνει όπως ήταν.
ocr-searchable-done = { $count ->
    [one] Το PDF είναι αναζητήσιμο: διαβάστηκε μία σελίδα
   *[other] Το PDF είναι αναζητήσιμο: διαβάστηκαν { $count } σελίδες
}
ocr-searchable-failed = { $count ->
    [one] Μία σελίδα δεν μπόρεσε να διαβαστεί.
   *[other] { $count } σελίδες δεν μπόρεσαν να διαβαστούν.
}

## A map from a PDF of the library

ocr-map-button = Χάρτης του κειμένου του…
ocr-map-title = Χάρτης του κειμένου
ocr-map-into = Μέσα στο έργο
ocr-map-new-project = Νέο έργο, με το όνομά του
ocr-map-making = Φτιάχνεται ο χάρτης…
ocr-map-failed = Ο χάρτης δεν μπόρεσε να φτιαχτεί.

## The text of a picture of the store

ocr-picture-read = Ανάγνωση του κειμένου της…
ocr-picture-title = Το κείμενο της εικόνας
ocr-picture-empty = Δεν βρέθηκε κείμενο στην εικόνα.
ocr-picture-copy = Αντιγραφή
ocr-picture-copied = Το κείμενο αντιγράφηκε
ocr-picture-map = Χάρτης από αυτό

## Tesseract in the settings

ocr-settings-looking = Αναζήτηση…
ocr-settings-missing = Δεν βρέθηκε. Χρειάζεται για να διαβάζεται κείμενο από σαρώσεις και εικόνες. Εγκαταστήστε το tesseract με τον διαχειριστή πακέτων του συστήματός σας, μαζί με τα δεδομένα των γλωσσών που διαβάζετε (στο Arch: tesseract-data-ell για τα νέα ελληνικά, tesseract-data-grc για τα αρχαία ελληνικά, tesseract-data-eng για τα αγγλικά, …), ή πείτε παρακάτω πού βρίσκεται.
ocr-settings-by-itself = Βρέθηκε μόνο του
ocr-settings-where = Πού βρίσκεται το Tesseract
ocr-settings-look-failed = Δεν μπόρεσε να γίνει αναζήτηση για το Tesseract
ocr-settings-has = Διαβάζει { $languages }.
ocr-settings-has-none = Δεν έχει δεδομένα για καμία γλώσσα: εγκαταστήστε τα δεδομένα μιας γλώσσας, όπως το tesseract-data-ell.
ocr-settings-first = Ανάγνωση αρχικά σε
ocr-settings-first-hint = Όταν δεν επιλέγεται καμία, η γλώσσα του κειμένου και αυτή της διεπαφής.
ocr-settings-how = Πώς διαβάζεται το κείμενο αρχικά
