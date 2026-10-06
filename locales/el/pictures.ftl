# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Εικόνες
pictures-all = Όλες οι εικόνες
pictures-picture = Εικόνα
pictures-search-placeholder = Αναζήτηση στις εικόνες
pictures-clear-search = Καθαρισμός της αναζήτησης
pictures-count = { $count ->
    [one] { $count } εικόνα
   *[other] { $count } εικόνες
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } από { $count ->
    [one] { $count } εικόνα
   *[other] { $count } εικόνες
}
pictures-add = Προσθήκη εικόνων…
pictures-empty = Η αποθήκη είναι άδεια
pictures-empty-text = Οι εικόνες που προσθέτετε εδώ μπορούν να χρησιμοποιηθούν σε όλα τα έργα σας, και μια εικόνα που μπαίνει σε κείμενο φυλάσσεται εδώ. Προσθέστε μερικές, ή αφήστε τες πάνω σε αυτό το παράθυρο.
pictures-nothing-found = Δεν βρέθηκε τίποτα
pictures-nothing-found-text = Καμία εικόνα δεν έχει όλες αυτές τις λέξεις.
# What a picture that has no name is called.
pictures-unnamed = Μια εικόνα
pictures-with-notes = Με σημειώσεις

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Προσθήκη εικόνων
pictures-files = Εικόνες
pictures-taken-in = { $count ->
    [one] Η «{ $name }» είναι στην αποθήκη
   *[other] { $count } εικόνες είναι στην αποθήκη
}
pictures-remove-title = Αφαίρεση της «{ $name }» από την αποθήκη;
pictures-remove-unused = Κανένα έργο δεν χρησιμοποιεί την εικόνα. Όσα λέγονται γι’ αυτήν εδώ, και οι σημειώσεις σας, αφαιρούνται μαζί της.
pictures-remove-used = { $count ->
    [one] { $count } έργο χρησιμοποιεί την εικόνα. Τα σχήματά του θα μείνουν χωρίς την εικόνα. Όσα λέγονται γι’ αυτήν εδώ, και οι σημειώσεις σας, αφαιρούνται μαζί της.
   *[other] { $count } έργα χρησιμοποιούν την εικόνα. Τα σχήματά τους θα μείνουν χωρίς την εικόνα. Όσα λέγονται γι’ αυτήν εδώ, και οι σημειώσεις σας, αφαιρούνται μαζί της.
}
pictures-no-backend = Δεν υπάρχει σύνδεση με τον πυρήνα της εφαρμογής.

## One picture

pictures-name = Όνομα
pictures-name-placeholder = Πώς λέγεται η εικόνα
pictures-caption = Λεζάντα
pictures-caption-placeholder = Όσα λέγονται για την εικόνα
pictures-caption-hint = Τα σχήματα που φτιάχνονται με την εικόνα αρχίζουν με αυτά τα λόγια. Όσα λέγονται για ένα σχήμα μπορούν να αλλάξουν εκεί χωρίς να αλλάξει αυτό.
pictures-italic = Πλάγια
pictures-small-caps = Μικρά κεφαλαία
# What the picture shows, in words, for those who do not see it.
pictures-alt = Δείχνει
pictures-alt-placeholder = Με λόγια, για όσους δεν μπορούν να τη δουν
pictures-absent = Η εικόνα δεν είναι σε αυτόν τον υπολογιστή. Χρησιμοποιείται στο έργο, και εμφανίζεται όταν έρθει από εκείνον που την έβαλε.
pictures-notes = Σημειώσεις
pictures-note-project = Σε αυτό το έργο
pictures-note-project-placeholder = Η γνώμη σας γι’ αυτήν, για αυτή τη δουλειά
pictures-note-project-hint = Ό,τι γράφεται εδώ το έχουν όλοι όσοι έχουν το έργο.
pictures-note-for-all = Να κρατηθεί για όλα τα έργα
pictures-note-write-for-all = Γράψτε για όλα τα έργα
pictures-note-all = Σε όλα τα έργα
pictures-note-all-placeholder = Η γνώμη σας γι’ αυτήν, όπου κι αν τη χρησιμοποιείτε
pictures-note-all-hint = Κρατιέται με την εικόνα στην αποθήκη, σε αυτόν τον υπολογιστή.
pictures-note-placeholder = Η γνώμη σας γι’ αυτήν. Για εσάς: δεν είναι μέρος κανενός εγγράφου.
pictures-note-label = Οι σημειώσεις σας για αυτή την εικόνα
pictures-file = Το αρχείο
pictures-kind = Είδος
pictures-kind-svg = SVG, σχέδιο
pictures-dimensions-label = Πλάτος και ύψος
pictures-dimensions = { $width } × { $height } στιγμές
pictures-size = Μέγεθος
# When the picture was taken into the store.
pictures-added = Προστέθηκε
pictures-used-in = Χρησιμοποιείται σε
pictures-this-project = Αυτό το έργο
# A map that has no name.
pictures-untitled = Χωρίς τίτλο
pictures-unused = Κανένα έργο δεν χρησιμοποιεί την εικόνα.
pictures-remove = Αφαίρεση από την αποθήκη
