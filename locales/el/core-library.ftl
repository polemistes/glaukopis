# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } και { $second }
core-library-three-names = { $first }, { $second } και { $third }
core-library-et-al = { $first } κ.ά.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (επιμ.)
   *[other] { $names } (επιμ.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = γραμμή { $line }: { $message }
core-library-line-sentence = Γραμμή { $line }: { $message }.
core-library-key-changed = το κλειδί «{ $from }» άλλαξε σε «{ $to }»
core-library-no-entry = Δεν υπάρχει εγγραφή εδώ. Μια εγγραφή αρχίζει με @ και τον τύπο της, όπως @book{"{"}key, …{"}"}.
core-library-many-entries = Υπάρχουν { $count } εγγραφές εδώ· αναμένεται μία.

## Changing a reference.

core-library-bad-key = Το «{ $key }» δεν μπορεί να χρησιμοποιηθεί ως κλειδί παραπομπής.
core-library-key-letters = Ένα κλειδί παραπομπής μπορεί να έχει μόνο γράμματα, ψηφία και - _ : . Δοκιμάστε «{ $key }».
core-library-key-taken = Το κλειδί παραπομπής «{ $key }» χρησιμοποιείται ήδη.
core-library-no-type = Η αναφορά δεν έχει τύπο δημοσίευσης.
core-library-not-a-type = Το «{ $kind }» δεν είναι τύπος δημοσίευσης.
core-library-merge-itself = Μια εγγραφή δεν μπορεί να συγχωνευτεί με τον εαυτό της.

## What was not found, shown after "not found: ".

core-library-the-reference = η αναφορά
core-library-the-stored-file = το αποθηκευμένο αρχείο { $path }
core-library-the-file = το αρχείο { $path }
core-library-the-collection = η συλλογή
core-library-the-collection-to-put-in = η συλλογή όπου θα έμπαινε
core-library-the-collection-to-move-to = η συλλογή όπου θα μετακινούνταν

## Collections.

core-library-collection-needs-name = Μια συλλογή χρειάζεται όνομα.
core-library-collection-exists = Υπάρχει ήδη εδώ συλλογή με το όνομα «{ $name }».
core-library-collection-in-itself = Μια συλλογή δεν μπορεί να μπει μέσα στον εαυτό της.

## The files of references.

core-library-not-in-library = το «{ $path }» δεν είναι διαδρομή μέσα στη βιβλιοθήκη
core-library-not-a-file = το { $path } δεν είναι αρχείο
