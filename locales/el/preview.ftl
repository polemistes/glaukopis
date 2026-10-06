# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Προεπισκόπηση
# Small, over the choice of the document format.
preview-format = Μορφή
preview-format-label = Μορφή εγγράφου
# Small, over the choice of the reference style.
preview-style = Αναφορές
preview-style-label = Στυλ παραπομπών
# The last among the reference styles, which opens the search for more.
preview-style-more = Περισσότερα στυλ…
preview-change = Αλλαγή της μορφής ή του στυλ
preview-change-format = Αλλαγή αυτής της μορφής…
preview-change-format-hint = Σελίδα, γράμματα, διάστιχο, επικεφαλίδες
preview-change-style = Αλλαγή αυτού του στυλ παραπομπών…
preview-change-style-hint = Σύμφωνα με τις επιθυμίες ενός εκδότη
preview-details = Τίτλος, συγγραφείς, περίληψη
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Μετάβαση σε αυτό το σημείο του κειμένου
# Moves the pages to where the element the text is at begins.
preview-show-text = Εμφάνιση του σημείου όπου είναι το κείμενο
preview-hide = Απόκρυψη της προεπισκόπησης
# When a format that goes with a reference style is chosen, the style is taken with it.
preview-style-taken = Το στυλ παραπομπών είναι τώρα { $style }
preview-style-taken-why = Είναι αυτό που συνοδεύει τη μορφή.
preview-style-keep-other = Να μείνει το άλλο
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = Το { $program } δεν είναι εγκατεστημένο
preview-programs-needed = Η προεπισκόπηση και η εξαγωγή γίνονται με το Pandoc και το Typst. Εγκαταστήστε τα με τον διαχειριστή πακέτων του συστήματός σας, ή πείτε στις ρυθμίσεις πού βρίσκονται.
preview-look-again = Νέα αναζήτηση
preview-looking-failed = Δεν μπόρεσε να γίνει αναζήτηση για τα προγράμματα
preview-reading-failed = Τα στυλ και οι μορφές δεν διαβάζονται
preview-failed = Η προεπισκόπηση δεν μπόρεσε να φτιαχτεί
preview-failed-message = Η προεπισκόπηση δεν μπόρεσε να φτιαχτεί.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Σελίδα { $number }
# The name of an exported file, where the map has none.
preview-file-name = έγγραφο

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } σελίδα
   *[other] { $count } σελίδες
}
preview-words = { $count ->
    [one] { $count } λέξη
   *[other] { $count } λέξεις
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } από { $limit } λέξη
   *[other] { $count } από { $limit } λέξεις
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } με τις σημειώσεις
preview-remarks-count = { $count ->
    [one] { $count } παρατήρηση
   *[other] { $count } παρατηρήσεις
}
preview-remarks = Παρατηρήσεις
preview-remarks-font = Γραμματοσειρά
preview-font-missing = Η { $font } δεν είναι εγκατεστημένη.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = Στη θέση της χρησιμοποιείται η { $font }, εδώ στην προεπισκόπηση και σε PDF που φτιάχνεται. Σε έγγραφο που εξάγεται για Word, LibreOffice ή LaTeX, η γραμματοσειρά ονομάζεται όπως ζητά η μορφή, και είναι εκεί για όποιον ανοίξει το έγγραφο και την έχει.
preview-remarks-references = Αναφορές
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } έργο που παρατίθεται δεν βρέθηκε,
   *[other] { $count } έργα που παρατίθενται δεν βρέθηκαν,
}
preview-works-missing-where = ούτε στη βιβλιοθήκη σας ούτε στο έργο. Σημειώνονται μέσα στο κείμενο.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Ειπώθηκαν ενώ φτιαχνόταν το έγγραφο

## The details of a document: what stands on its first page.

preview-details-dialog = Το έγγραφο
preview-details-dialog-subtitle = Τι μπαίνει στην πρώτη του σελίδα
preview-details-title = Τίτλος
preview-details-title-placeholder = Το όνομα του κέντρου του χάρτη
preview-details-title-hint = Αν μείνει κενό, τίτλος είναι το όνομα του κέντρου του χάρτη.
preview-details-subtitle = Υπότιτλος
preview-details-authors = Συγγραφείς
preview-details-name = Όνομα
preview-details-author-name = Όνομα του συγγραφέα { $number }
preview-details-affiliation = Φορέας
preview-details-author-affiliation = Φορέας του συγγραφέα { $number }
preview-details-email = Ηλεκτρονική διεύθυνση
preview-details-author-email = Ηλεκτρονική διεύθυνση του συγγραφέα { $number }
# Beside a plus, under the authors: adds one.
preview-details-add-author = συγγραφέας
preview-details-abstract = Περίληψη
preview-details-words = { $count ->
    [one] { $count } λέξη
   *[other] { $count } λέξεις
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $limit ->
    [one] { $count } από { $limit } λέξη
   *[other] { $count } από { $limit } λέξεις
}
preview-details-keywords = Λέξεις-κλειδιά
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } από { $limit }
preview-details-keywords-placeholder = Χωρισμένες με κόμματα
preview-details-date = Ημερομηνία
preview-details-date-placeholder = Όπως θα τυπωθεί
preview-details-language = Γλώσσα του κειμένου
# A map that was given no language is printed in English.
preview-details-language-none = Δεν ορίζεται (αγγλικά)
preview-details-cover = Εξώφυλλο
preview-details-cover-choose = Επιλογή εικόνας…
preview-details-cover-other = Άλλη…
preview-details-cover-hint = Το εξώφυλλο του ηλεκτρονικού βιβλίου: μια εικόνα, που φυλάσσεται στην αποθήκη εικόνων. Τίποτα άλλο δεν τη χρησιμοποιεί.

## The export: the kinds of file a document is made as.

preview-export = Εξαγωγή
preview-export-kind = Τύπος αρχείου
preview-export-pdf-about = Όπως το δείχνει η προεπισκόπηση
preview-export-pdflatex = PDF, στοιχειοθετημένο από το LaTeX
preview-export-pdflatex-about = Το ίδιο έγγραφο στη στοιχειοθεσία του LaTeX. Παίρνει λίγο περισσότερο.
preview-export-docx-about = Ό,τι ζητούν οι περισσότεροι εκδότες και τα περιοδικά
preview-export-odt-about = Για το LibreOffice Writer και άλλα
preview-export-latex-about = Για στοιχειοθεσία με LuaLaTeX ή XeLaTeX
preview-export-markdown-about = Απλό κείμενο, με τις παραπομπές ως κλειδιά
preview-export-html = Ιστοσελίδα
preview-export-html-about = Ένα αρχείο, για ανάγνωση σε πρόγραμμα περιήγησης
preview-export-epub = Ηλεκτρονικό βιβλίο
preview-export-epub-about = EPUB, για ηλεκτρονικούς αναγνώστες και τις εφαρμογές που τους διαβάζουν· τη στοιχειοθεσία την κάνει ο αναγνώστης
preview-export-latex-missing = Γι’ αυτό χρειάζεται το LaTeX, που δεν βρέθηκε. Εγκαθίσταται ως TeX Live.
preview-export-biblatex = Οι παραπομπές να μείνουν εντολές του BibLaTeX
preview-export-biblatex-hint = Οι αναφορές γράφονται σε αρχείο .bib δίπλα στο έγγραφο. Το στυλ παραπομπών είναι τότε εκείνο του BibLaTeX που είναι πλησιέστερο στο επιλεγμένο.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Εξαγωγή ως { $kind }
preview-export-run = Εξαγωγή…
preview-export-working = Φτιάχνεται το έγγραφο…
preview-export-failed = Το έγγραφο δεν μπόρεσε να φτιαχτεί.
preview-export-stop = Διακοπή
preview-export-stopped = Η δημιουργία σταμάτησε. Δεν γράφτηκε αρχείο.
# Under the name of the file that was made: another file made with it.
preview-export-also = με { $file }
preview-export-missing = { $count ->
    [one] Ένα έργο που παρατίθεται δεν βρέθηκε, και σημειώνεται μέσα στο κείμενο.
   *[other] { $count } έργα που παρατίθενται δεν βρέθηκαν, και σημειώνονται μέσα στο κείμενο.
}
preview-export-show-in-folder = Εμφάνιση στον φάκελο
preview-export-open-failed = Το αρχείο δεν μπόρεσε να ανοίξει
preview-export-folder-failed = Ο φάκελος δεν μπόρεσε να ανοίξει
preview-export-another = Νέα εξαγωγή
