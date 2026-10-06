# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = επικολλημένο κείμενο
core-import-files = { $count ->
    [one] { $count } αρχείο
   *[other] { $count } αρχεία
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Το αρχείο «{ $name }» δεν βρέθηκε.
core-import-empty-entry = Γραμμή { $line }: η εγγραφή «{ $key }» είναι κενή και παραλείφθηκε.
# Where in a file a reference that has no key was found.
core-import-origin-line = γραμμή { $line }
core-import-origin-key-line = { $key }, γραμμή { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = «{ $title }»
core-import-merge-gone = { $reference }: η εγγραφή με την οποία θα συγχωνευόταν δεν υπάρχει πια

## PDF files.

core-import-not-a-pdf = Το { $name } δεν είναι PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Τα στοιχεία είναι από το { $service }.
core-import-number-unknown = Βρέθηκε ένας αριθμός στο αρχείο, αλλά οι βάσεις δεδομένων δεν γνωρίζουν τίποτα γι’ αυτόν· τα στοιχεία είναι από το ίδιο το αρχείο και πρέπει να ελεγχθούν.
core-import-databases-failed = Οι βάσεις δεδομένων δεν μπόρεσαν να ερωτηθούν ({ $error })· τα στοιχεία είναι από το ίδιο το αρχείο και πρέπει να ελεγχθούν.

## Zotero.

core-import-zotero-my-library = Η βιβλιοθήκη μου
core-import-zotero-group = Ομάδα { $id }
core-import-zotero-the-library = η βιβλιοθήκη { $id } στο Zotero
core-import-zotero-own-library = η προσωπική βιβλιοθήκη του χρήστη στο Zotero
core-import-zotero-the-collection = η συλλογή { $key } στο Zotero
core-import-zotero-unknown-base = Το αρχείο «{ $name }» δεν βρέθηκε. Το Zotero το συνδέει από έναν φάκελο της δικής του επιλογής, που δεν είναι γνωστός εδώ.
core-import-zotero-empty-item = Το αντικείμενο { $key } στο Zotero είναι κενό και παραλείφθηκε.
core-import-zotero-alone = { $count ->
    [one] { $count } αρχείο ή σημείωση βρίσκεται στο Zotero χωρίς αναφορά από πάνω του, και παραλείφθηκε.
   *[other] { $count } αρχεία και σημειώσεις βρίσκονται στο Zotero χωρίς αναφορά από πάνω τους, και παραλείφθηκαν.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Το Zotero δίνει στο όνομα { $name } τον ρόλο { $role }, για τον οποίο το BibLaTeX δεν έχει πεδίο. Το όνομα παραλείφθηκε.
core-import-zotero-left-out = Το πεδίο «{ $field }» του Zotero δεν έχει αντίστοιχο στο BibLaTeX και παραλείφθηκε: { $value }

## Zotero's database.

core-import-zotero-no-database = βάση δεδομένων του Zotero ({ $file }) στο { $path }
core-import-zotero-copying = αντιγραφή του { $path } σε προσωρινό φάκελο
core-import-zotero-empty = το αρχείο είναι κενό
core-import-zotero-disturbed = Το Zotero έγραφε στη βάση δεδομένων του την ώρα που διαβαζόταν. Αν λείπει κάτι, κλείστε το Zotero και κάντε ξανά την εισαγωγή.
core-import-zotero-backup-read = Η βάση δεδομένων του Zotero δεν διαβάζεται ({ $error }). Διαβάστηκε αντ’ αυτής το αντίγραφο ασφαλείας της, { $backup }: ό,τι άλλαξε στο Zotero αφότου έγινε το αντίγραφο λείπει.
core-import-zotero-not-a-database = Το { $path } δεν είναι βάση δεδομένων του Zotero.
core-import-zotero-unreadable = Η βάση δεδομένων του Zotero έχει μια μορφή που δεν διαβάζεται εδώ: { $what }. Αν την έγραψε παλιά έκδοση του Zotero, ανοίξτε την μία φορά σε μια σημερινή και θα ενημερωθεί.
core-import-zotero-unreadable-version = Η βάση δεδομένων του Zotero έχει μια μορφή που δεν διαβάζεται εδώ (έκδοση { $version } της βάσης δεδομένων του Zotero): { $what }. Αν την έγραψε παλιά έκδοση του Zotero, ανοίξτε την μία φορά σε μια σημερινή και θα ενημερωθεί.
core-import-zotero-no-table = λείπει ο πίνακας «{ $table }»
core-import-zotero-no-column = ο πίνακας «{ $table }» δεν έχει στήλη «{ $column }»
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Η βάση δεδομένων του Zotero δεν έχει πίνακα «{ $table }» της μορφής που είναι γνωστή εδώ: { $consequence }.
core-import-zotero-no-bin = τα αντικείμενα στον κάδο του Zotero δεν ξεχωρίζουν από τα άλλα
core-import-zotero-no-collections = οι συλλογές δεν διαβάστηκαν
core-import-zotero-no-attachments = τα συνημμένα αρχεία δεν διαβάστηκαν
core-import-zotero-no-notes = οι σημειώσεις δεν διαβάστηκαν
core-import-zotero-no-keywords = οι λέξεις-κλειδιά δεν διαβάστηκαν
core-import-zotero-no-group-names = τα ονόματα των βιβλιοθηκών ομάδων δεν είναι γνωστά

## PDF files, as they are read for a reference.

core-import-pdf-empty = Το αρχείο «{ $name }» είναι κενό.
core-import-pdf-not-a-pdf = Το αρχείο «{ $name }» δεν είναι PDF.
core-import-pdf-unreadable = Το αρχείο δεν διαβάζεται: είναι κατεστραμμένο, προστατευμένο με κωδικό, ή πολύ μεγάλο.
core-import-pdf-scan = Το αρχείο δεν έχει στρώμα κειμένου: είναι σάρωση.
core-import-pdf-from-file = Τα στοιχεία είναι από το ίδιο το αρχείο, όχι από κατάλογο, και πρέπει να ελεγχθούν.
core-import-pdf-from-metadata = Δεν βρέθηκε DOI ή ISBN στο αρχείο· τα στοιχεία είναι από τα μεταδεδομένα του ίδιου του αρχείου και πρέπει να ελεγχθούν.
core-import-pdf-unknown = Δεν βρέθηκε DOI ή ISBN στο αρχείο, και τα μεταδεδομένα του δεν λένε τι είναι: τα στοιχεία πρέπει να συμπληρωθούν.

## Tables, from files of text and of sheets.

core-import-table-too-large = Το αρχείο έχει { $size } MB. Ένας πίνακας διαβάζεται από αρχείο το πολύ { $most } MB.
core-import-table-kinds = Πίνακες διαβάζονται από CSV και άλλα αρχεία κειμένου με τις τιμές χωρισμένες με κόμματα, ερωτηματικά (;) ή στηλοθέτες, και από τα φύλλα του LibreOffice (.ods) και του Excel (.xlsx, .xls).
core-import-table-empty = Δεν υπάρχει τίποτα στο αρχείο.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Ο πίνακας έχει { $rows } γραμμές. Ένας πίνακας μέσα σε κείμενο μπορεί να έχει το πολύ { $most }: δεν είναι λογιστικό φύλλο.
core-import-table-columns = Ο πίνακας έχει { $columns } στήλες. Ένας πίνακας μέσα σε κείμενο μπορεί να έχει το πολύ { $most }: δεν είναι λογιστικό φύλλο.
core-import-table-more-than = περισσότερες από { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Η ανάγνωση σταμάτησε.
core-import-pdfs-stopped = Η αναγνώριση των αρχείων σταμάτησε. Δεν προστέθηκε τίποτα.
core-import-document-kind = Το «{ $file }» δεν είναι είδους που εισάγεται ως έγγραφο. Εισάγονται Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst και απλό κείμενο.
core-import-document-too-large = Το «{ $file }» είναι μεγαλύτερο από 50 MB, περισσότερο από όσο μπορεί να εισαχθεί ως έγγραφο.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = Το «{ $file }» δεν διαβάζεται ως { $kind }. Μπορεί να είναι κατεστραμμένο, ή άλλου είδους από ό,τι λέει το όνομά του. Το Pandoc, που το διαβάζει, είπε: { $message }
core-import-document-pandoc-unreadable = αυτό που έφτιαξε το Pandoc από το «{ $file }» δεν διαβάζεται: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Χωρίς τίτλο
core-import-document-plain-text = απλό κείμενο
core-import-document-notebook = σημειωματάριο Jupyter

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Βρέθηκε { $count } παραπομπή που δεν είναι ακόμη συνδεδεμένη με αναφορά της βιβλιοθήκης σας, φτιαγμένη από πρόγραμμα που κρατά αναφορές. Μένει ως το κείμενο που γράφτηκε, και μπορείτε να την εξετάσετε όταν φτιαχτεί ο χάρτης, και αργότερα.
       *[none] Βρέθηκε { $count } παραπομπή που δεν είναι ακόμη συνδεδεμένη με αναφορά της βιβλιοθήκης σας. Μένει ως το κείμενο που γράφτηκε, και μπορείτε να την εξετάσετε όταν φτιαχτεί ο χάρτης, και αργότερα.
    }
   *[other] { $made ->
        [all] Βρέθηκαν { $count } παραπομπές που δεν είναι ακόμη συνδεδεμένες με αναφορές της βιβλιοθήκης σας, όλες φτιαγμένες από πρόγραμμα που κρατά αναφορές. Μένουν ως το κείμενο που γράφτηκαν, και μπορείτε να τις εξετάσετε όταν φτιαχτεί ο χάρτης, και αργότερα.
        [some] Βρέθηκαν { $count } παραπομπές που δεν είναι ακόμη συνδεδεμένες με αναφορές της βιβλιοθήκης σας, { $some } από αυτές φτιαγμένες από πρόγραμμα που κρατά αναφορές. Μένουν ως το κείμενο που γράφτηκαν, και μπορείτε να τις εξετάσετε όταν φτιαχτεί ο χάρτης, και αργότερα.
       *[none] Βρέθηκαν { $count } παραπομπές που δεν είναι ακόμη συνδεδεμένες με αναφορές της βιβλιοθήκης σας. Μένουν ως το κείμενο που γράφτηκαν, και μπορείτε να τις εξετάσετε όταν φτιαχτεί ο χάρτης, και αργότερα.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } παραπομπή φτιαγμένη από το EndNote εισάγεται ως το κείμενο που δείχνει, και δεν είναι ανάμεσα σε όσες βρέθηκαν: ό,τι λέει το EndNote για τα έργα δεν διαβάζεται.
   *[other] { $count } παραπομπές φτιαγμένες από το EndNote εισάγονται ως το κείμενο που δείχνουν, και δεν είναι ανάμεσα σε όσες βρέθηκαν: ό,τι λέει το EndNote για τα έργα δεν διαβάζεται.
}
core-import-document-bookmarks = { $count ->
    [one] Το έγγραφο κρατά { $count } παραπομπή σε σελιδοδείκτη, και ό,τι παραθέτει δεν διαβάζεται: είναι κείμενο όπως στέκεται. Το Zotero τις κρατά έτσι όπου το λένε οι προτιμήσεις του εγγράφου.
   *[other] Το έγγραφο κρατά { $count } παραπομπές σε σελιδοδείκτες, και ό,τι παραθέτουν δεν διαβάζεται: είναι κείμενο όπως στέκονται. Το Zotero τις κρατά έτσι όπου το λένε οι προτιμήσεις του εγγράφου.
}
core-import-document-bibliography = Το έγγραφο έχει έναν κατάλογο των έργων που παραθέτει, κάτω από τον τίτλο «{ $heading }». Εισάγεται ως κείμενο, όπως τα υπόλοιπα. Ο χάρτης φτιάχνει δική του βιβλιογραφία από όσα παρατίθενται σε αυτόν.
core-import-document-bibliography-made = Το έγγραφο έχει έναν κατάλογο των έργων που παραθέτει, φτιαγμένο από το πρόγραμμα που κρατά τις αναφορές του. Εισάγεται ως κείμενο, όπως τα υπόλοιπα. Ο χάρτης φτιάχνει δική του βιβλιογραφία από όσα παρατίθενται σε αυτόν.
core-import-document-tracked = Το έγγραφο έχει παρακολουθούμενες αλλαγές. Το κείμενο εισάγεται όπως είναι όταν γίνουν όλες δεκτές.
core-import-document-comments = Το έγγραφο έχει σχόλια στο περιθώριο, που παραλείπονται.
core-import-document-heading-notes = { $count ->
    [one] Μια σημείωση σε επικεφαλίδα μπαίνει στην αρχή του κειμένου κάτω από αυτήν: μια επικεφαλίδα δεν μπορεί να έχει σημείωση.
   *[other] { $count } σημειώσεις σε επικεφαλίδες μπαίνουν στην αρχή του κειμένου κάτω από την καθεμία: μια επικεφαλίδα δεν μπορεί να έχει σημείωση.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } λεζάντα άρχιζε με λέξη και αριθμό, όπως «{ $first }». Παραλείπεται: ο χάρτης αριθμεί μόνος του τα σχήματα και τους πίνακές του. Όπου το κείμενο κατονομάζει κάποιο με τον αριθμό του, αυτό είναι κείμενο όπως γράφτηκε, και δεν ακολουθεί τους αριθμούς του χάρτη.
   *[other] { $count } λεζάντες άρχιζαν με λέξη και αριθμό, όπως «{ $first }». Παραλείπονται: ο χάρτης αριθμεί μόνος του τα σχήματα και τους πίνακές του. Όπου το κείμενο κατονομάζει κάποιο με τον αριθμό του, αυτό είναι κείμενο όπως γράφτηκε, και δεν ακολουθεί τους αριθμούς του χάρτη.
}
core-import-document-label-example = Σχήμα 1:
core-import-document-caption-notes = { $count ->
    [one] Μια σημείωση μέσα σε όσα λέγονται για ένα σχήμα ή έναν πίνακα μπαίνει εκεί σε αγκύλες.
   *[other] { $count } σημειώσεις μέσα σε όσα λέγονται για σχήματα ή πίνακες μπαίνουν εκεί σε αγκύλες.
}
core-import-document-headings = { $count ->
    [one] { $count } επικεφαλίδα μέσα σε παράθεμα, κατάλογο ή πίνακα εισάγεται ως παράγραφος με έντονα.
   *[other] { $count } επικεφαλίδες μέσα σε παράθεμα, κατάλογο ή πίνακα εισάγονται ως παράγραφοι με έντονα.
}
core-import-document-code = { $count ->
    [one] { $count } τμήμα κώδικα εισάγεται ως απλές παράγραφοι, μία για κάθε γραμμή.
   *[other] { $count } τμήματα κώδικα εισάγονται ως απλές παράγραφοι, μία για κάθε γραμμή.
}
core-import-document-definitions = { $count ->
    [one] { $count } κατάλογος όρων με τη σημασία τους εισάγεται ως παράγραφοι, με τους όρους σε έντονα.
   *[other] { $count } κατάλογοι όρων με τη σημασία τους εισάγονται ως παράγραφοι, με τους όρους σε έντονα.
}
core-import-document-rules = { $count ->
    [one] { $count } γραμμή κατά πλάτος της σελίδας παραλείπεται.
   *[other] { $count } γραμμές κατά πλάτος της σελίδας παραλείπονται.
}
core-import-document-raw = { $count ->
    [one] { $count } κομμάτι γραμμένο σε HTML ή TeX για ένα μόνο είδος εγγράφου παραλείπεται.
   *[other] { $count } κομμάτια γραμμένα σε HTML ή TeX για ένα μόνο είδος εγγράφου παραλείπονται.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } εικόνα που περιέχει το αρχείο δεν είναι μέσα στο κείμενο που διαβάστηκε, και παραλείπεται. Μπορεί να βρίσκεται στην κεφαλίδα ή στο υποσέλιδο των σελίδων, ή μέσα σε σχέδιο.
   *[other] { $count } εικόνες που περιέχει το αρχείο δεν είναι μέσα στο κείμενο που διαβάστηκε, και παραλείπονται. Μπορεί να βρίσκονται στην κεφαλίδα ή στο υποσέλιδο των σελίδων, ή μέσα σε σχέδιο.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Η εικόνα «{ $name }» παραλείπεται: { $why }.
core-import-document-picture-kind = είναι είδους που δεν διαβάζεται ({ $kind })
core-import-document-picture-not-read = δεν είναι εικόνα είδους που διαβάζεται
core-import-document-picture-unreadable = δεν διαβάζεται
core-import-document-picture-network = βρίσκεται στο δίκτυο, και από εκεί δεν φέρνουμε τίποτα
core-import-document-picture-not-taken-out = δεν μπόρεσε να βγει από το αρχείο
core-import-document-picture-outside = δεν είναι μέσα στο αρχείο, αλλά αλλού σε αυτόν τον υπολογιστή, και δεν παίρνεται από εκεί
core-import-document-picture-not-found = το αρχείο δεν βρέθηκε εκεί που λέει το έγγραφο
core-import-document-picture-too-large = είναι μεγαλύτερη από 50 MB
core-import-document-picture-file-unreadable = το αρχείο δεν διαβάζεται
