# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Σχήμα
figures-width = Πλάτος
figures-width-third = Ένα τρίτο
figures-width-half = Μισό
figures-width-three-quarters = Τρία τέταρτα
figures-width-whole = Ολόκληρο
figures-width-of-row = Του χώρου που έχει στη σειρά.
figures-width-of-text = Του πλάτους του κειμένου, στο έγγραφο.
figures-shows = Δείχνει
figures-shows-placeholder = Με λόγια, για όσους δεν μπορούν να το δουν
figures-numbered = Αριθμημένο, ως «Σχήμα 1»
figures-keep-caption = Να μείνει η λεζάντα με την εικόνα
figures-keep-caption-hint = Τα σχήματα που φτιάχνονται με αυτή την εικόνα αρχίζουν τότε με όσα λέγονται εδώ
figures-take-caption = Χρήση της λεζάντας της εικόνας
figures-take-caption-hint = Ό,τι φυλάσσεται με την εικόνα λέγεται εδώ, στη θέση όσων λέγονται τώρα
figures-another-picture = Άλλη εικόνα…
figures-remove = Αφαίρεση του σχήματος
figures-caption-kept = Φυλαγμένη με την εικόνα
figures-caption-kept-detail = Τα σχήματα που φτιάχνονται με αυτήν αρχίζουν με αυτά τα λόγια.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Μια εικόνα
# What the files that can be chosen there are called.
figures-picture-files = Εικόνες

## The store of pictures, as the text reads it.

figures-pictures-unread = Οι εικόνες δεν διαβάζονται
figures-picture-not-taken = Η εικόνα δεν μπόρεσε να προστεθεί
figures-picture-not-kept = Όσα ειπώθηκαν για την εικόνα δεν μπόρεσαν να φυλαχτούν
figures-picture-not-removed = Η εικόνα δεν μπόρεσε να αφαιρεθεί

## Where a figure, a table or an equation stands.

figures-stands = Τοποθετείται
figures-stands-in-row = δίπλα σε άλλα, σε μια σειρά
figures-stands-alone = Μόνο του ξανά
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Πού τοποθετείται { $kind ->
        [figure] το σχήμα
        [table] ο πίνακας
       *[equation] η εξίσωση
    }
figures-side-format = Όπως η μορφή
figures-side-left = Αριστερά
figures-side-middle = Στη μέση
figures-side-right = Δεξιά
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Η μορφή βάζει { $kind ->
        [figure] τα σχήματα
        [table] τους πίνακες
       *[equation] τις εξισώσεις
    } { $side ->
        [left] αριστερά
        [right] δεξιά
       *[center] στη μέση
    }{ $flow ->
        [around] , με το κείμενο να ρέει γύρω τους
        [apart] , χωριστά από το κείμενο
       *[none] {""}
    }.
figures-text = Κείμενο
figures-flows-where = Αν το κείμενο ρέει γύρω από { $kind ->
        [figure] το σχήμα
        [table] τον πίνακα
       *[equation] την εξίσωση
    }
figures-flow-format = Όπως η μορφή
figures-flow-around = Ρέει γύρω του
figures-flow-apart = Μένει χωριστά
figures-flow-at-side = Το κείμενο ρέει γύρω από ό,τι τοποθετείται στο πλάι.
figures-beside = Να μπει δίπλα στο προηγούμενο

## A formula in the line, and an equation on a line of its own.

figures-formula = Τύπος
figures-equation = Εξίσωση
figures-equation-numbered = Αριθμημένη
figures-formula-field = Ο τύπος, στον συμβολισμό του TeX
figures-formula-empty = Ό,τι γράφεται εμφανίζεται εδώ όπως θα τυπωθεί.
figures-formula-hint = Γράφεται όπως στο TeX. Enter όταν τελειώσετε, Esc για να μείνει όπως ήταν.
figures-equation-hint = Γράφεται όπως στο TeX. Enter όταν τελειώσετε, Shift+Enter για νέα γραμμή, Esc για να μείνει όπως ήταν.
figures-formula-unread = Ο τύπος δεν διαβάζεται.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = τύπος
figures-equation-blank = Μια εξίσωση

## What can be put into a formula by pressing.

figures-sign-raised = Εκθέτης
figures-sign-lowered = Δείκτης
figures-sign-fraction = Κλάσμα
figures-sign-root = Ρίζα
figures-sign-sum = Άθροισμα
figures-sign-integral = Ολοκλήρωμα
figures-sign-brackets = Παρενθέσεις που μεγαλώνουν
figures-sign-alpha = άλφα
figures-sign-beta = βήτα
figures-sign-gamma = γάμμα
figures-sign-lambda = λάμδα
figures-sign-pi = πι
figures-sign-sigma = σίγμα
figures-sign-less-or-equal = Μικρότερο ή ίσο
figures-sign-greater-or-equal = Μεγαλύτερο ή ίσο
figures-sign-not-equal = Διάφορο
figures-sign-nearly-equal = Περίπου ίσο
figures-sign-times = Επί
figures-sign-plus-or-minus = Συν πλην
figures-sign-arrow = Βέλος
figures-sign-infinity = Άπειρο
figures-sign-words = Λέξεις μέσα σε τύπο

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Εμφανίζεται ως
figures-form-full = Η λέξη και ο αριθμός
figures-form-number = Μόνο ο αριθμός
figures-form-equation = Ο αριθμός όπως στέκεται δίπλα στην εξίσωση
figures-form-its-number = Ο αριθμός του
figures-form-its-name = Το όνομά του
figures-go-to = Μετάβαση εκεί που παραπέμπει
figures-pointed-gone = Αυτό στο οποίο παραπέμπει δεν υπάρχει πια στο έγγραφο
figures-point-elsewhere = Παραπομπή αλλού…

## Choosing what a cross-reference refers to.

figures-targets = Επιλέξτε πού να παραπέμπει
figures-targets-placeholder = Παραπομπή σε σχήμα, πίνακα, εξίσωση, μέρος
figures-targets-search = Αναζήτηση σε όσα μπορεί να παραπέμψει
figures-targets-results = Όπου μπορεί να παραπέμψει
figures-targets-figures = Σχήματα
figures-targets-tables = Πίνακες
figures-targets-equations = Εξισώσεις
figures-targets-parts = Μέρη του εγγράφου
figures-targets-figure-unsaid = Ένα σχήμα για το οποίο δεν λέγεται τίποτα
figures-targets-table-unsaid = Ένας πίνακας για τον οποίο δεν λέγεται τίποτα
figures-targets-no-match = Τίποτα στο έγγραφο δεν ανταποκρίνεται σε αυτές τις λέξεις.
figures-targets-none = Δεν υπάρχει ακόμη τίποτα να παραπέμψετε: κανένα σχήμα, κανένας πίνακας, καμία αριθμημένη εξίσωση, κανένα μέρος με όνομα.
figures-targets-hint = Μια εσωτερική παραπομπή ακολουθεί αυτό στο οποίο παραπέμπει: τον αριθμό του, και πώς το ονομάζει η μορφή.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Η εικόνα δεν είναι σε αυτόν τον υπολογιστή
figures-caption-placeholder = Όσα λέγονται για την εικόνα
