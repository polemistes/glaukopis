# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Εικόνα

## When text cannot be read.

ocr-stopped = Η ανάγνωση σταμάτησε.
ocr-no-language = Το Tesseract δεν έχει δεδομένα για τη γλώσσα «{ $language }».
ocr-no-languages = Το Tesseract δεν έχει δεδομένα για καμία γλώσσα. Εγκαταστήστε τα δεδομένα μιας γλώσσας, όπως το tesseract-data-eng στο Arch.
ocr-not-pdf = Το «{ $file }» δεν είναι PDF.
ocr-no-pages = Το «{ $file }» δεν έχει σελίδες.
ocr-locked = Το «{ $file }» είναι κλειδωμένο με κωδικό, και οι σελίδες του δεν μπορούν να σχεδιαστούν.
ocr-unreadable = Το «{ $file }» δεν διαβάζεται ως PDF. Μπορεί να είναι κατεστραμμένο.
ocr-page-not-drawn = Η σελίδα { $page } δεν μπόρεσε να σχεδιαστεί.
ocr-picture-unreadable = Η εικόνα δεν διαβάζεται: { $message }
ocr-drawing = Ένα σχέδιο (SVG) δεν έχει μέσα του εικόνα από την οποία να διαβαστεί κείμενο.

## Making a PDF searchable.

ocr-searchable-locked = Το PDF είναι κλειδωμένο, και δεν μπορεί να γίνει αναζητήσιμο. Το κείμενό του μπορεί πάντως να εισαχθεί σε ένα έργο ως χάρτης.
ocr-searchable-unreadable = Το PDF δεν μπόρεσε να γίνει αναζητήσιμο: { $message }
ocr-not-whole = αυτό που φτιάχτηκε δεν διαβάστηκε πίσω ολόκληρο, και δεν κρατήθηκε.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
    [one] Μία σελίδα διαβάστηκε από την εικόνα της.
   *[other] { $count } σελίδες διαβάστηκαν από τις εικόνες τους.
}
ocr-remark-text = { $count ->
    [one] Μία σελίδα είχε κείμενο, που παίρνεται όπως το έχει το αρχείο.
   *[other] { $count } σελίδες είχαν κείμενο, που παίρνεται όπως το έχει το αρχείο.
}
ocr-remark-no-tesseract = { $count ->
    [one] Μία σελίδα δεν έχει κείμενο, και μένει κενή: το Tesseract, που διαβάζει κείμενο μέσα σε εικόνες, δεν είναι εγκατεστημένο.
   *[other] { $count } σελίδες δεν έχουν κείμενο, και μένουν κενές: το Tesseract, που διαβάζει κείμενο μέσα σε εικόνες, δεν είναι εγκατεστημένο.
}
ocr-remark-not-read = Οι σελίδες που δεν έχουν κείμενο δεν μπόρεσαν να διαβαστούν: { $message }
ocr-remark-failed = Η σελίδα { $page } δεν μπόρεσε να διαβαστεί: { $message }
ocr-remark-more-failed = { $count ->
    [one] Μία ακόμη σελίδα δεν μπόρεσε να διαβαστεί.
   *[other] { $count } ακόμη σελίδες δεν μπόρεσαν να διαβαστούν.
}
ocr-remark-empty = Δεν βρέθηκε κείμενο.
