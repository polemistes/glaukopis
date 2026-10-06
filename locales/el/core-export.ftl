# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Η εικόνα «{ $name }» δεν βρίσκεται σε αυτόν τον υπολογιστή, και μένει έξω από το έγγραφο.
core-export-astray = { $count ->
    [one] Μια εσωτερική παραπομπή στο κείμενο οδηγεί σε κάτι που δεν υπάρχει στο έγγραφο. Τυπώνεται ως [?].
   *[other] { $count } εσωτερικές παραπομπές στο κείμενο οδηγούν σε κάτι που δεν υπάρχει στο έγγραφο. Τυπώνονται ως [?].
}
core-export-latex-font = Η { $font } δεν είναι εγκατεστημένη. Το έγγραφο στοιχειοθετείται σε Latin Modern, τη γραμματοσειρά που έχει το LaTeX από μόνο του.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count } κείμενα του εγγράφου δεν στάλθηκαν, και δεν φυλάσσονται.
# Shown after "not found: ".
core-export-preview-document = το έγγραφο της προεπισκόπησης
core-export-reading-pdf = ανάγνωση του PDF που φτιάχτηκε
core-export-reading-made = ανάγνωση του εγγράφου που φτιάχτηκε

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = το πρότυπο έγγραφο δεν διαβάζεται: { $error }
core-export-pattern-lacks = το πρότυπο έγγραφο δεν έχει { $name }
core-export-pattern-reading = ανάγνωση του πρότυπου εγγράφου
core-export-pattern-writing = εγγραφή του πρότυπου εγγράφου

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Ο τύπος τελειώνει πριν ολοκληρωθεί.
# The command is as it was written: \frac.
core-export-formula-unknown = Το { $command } δεν είναι γνωστό.
core-export-formula-unexpected = Το { $what } δεν αναμενόταν εκεί που βρίσκεται.
core-export-formula-unreadable = Ο τύπος δεν διαβάζεται.
core-export-formula-too-long = Ο τύπος είναι πολύ μακρύς.

## Reference styles.

core-export-style-bad-id = Το «{ $id }» δεν μπορεί να είναι αναγνωριστικό στυλ
core-export-not-a-style = Αυτό δεν είναι στυλ: { $error }.
core-export-not-a-style-begin = Αυτό δεν είναι στυλ: δεν αρχίζει με <style>.
core-export-dependent-style = Αυτό το στυλ απλώς κατονομάζει ένα άλλο στυλ, από το οποίο παίρνει τη μορφή του. Φέρτε εκείνο, με το όνομά του.
core-export-style-unreadable = Το στυλ δεν μπορεί να διαβαστεί ξανά.
core-export-style-needs-name = Ένα στυλ χρειάζεται όνομα.
core-export-style-own-only = Μόνο τα δικά σας στυλ μπορούν να διαγραφούν.
# Shown after "not found: ".
core-export-the-reference-style = το στυλ παραπομπών «{ $id }»
core-export-any-reference-style = ούτε ένα στυλ παραπομπών
core-export-the-style = το στυλ «{ $id }»

## Document formats.

core-export-format-bad-id = Το «{ $id }» δεν μπορεί να είναι αναγνωριστικό μορφής
core-export-format-needs-name = Μια μορφή χρειάζεται όνομα.
core-export-format-own-only = Μόνο οι δικές σας μορφές μπορούν να διαγραφούν.
core-export-not-a-length = Το «{ $length }» δεν είναι μήκος
# Shown after "not found: ".
core-export-the-format = η μορφή «{ $id }»
