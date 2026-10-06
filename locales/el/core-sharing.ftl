# What the core says of sharing projects through a server, in English.
# See locales/README.md.

## The address of a server, as it was typed.

core-sharing-enter-address = Γράψτε τη διεύθυνση του διακομιστή.
core-sharing-no-spaces = Η διεύθυνση ενός διακομιστή δεν έχει κενά.
# The scheme is what was typed before "://".
core-sharing-scheme = Έναν διακομιστή τον φτάνουμε με http ή https, όχι με «{ $scheme }».
core-sharing-not-an-address = Αυτό δεν μοιάζει με διεύθυνση διακομιστή.
core-sharing-no-server = Δεν υπάρχει διακομιστής Glaukopis στο { $host }. Ελέγξτε τη διεύθυνση με όποιον σας την έδωσε.
core-sharing-no-answer-behind = το { $host } υπάρχει, αλλά ο διακομιστής πίσω του δεν απαντά
core-sharing-newer = Ο διακομιστής είναι νεότερος από αυτή την έκδοση του Glaukopis, που πρέπει να ενημερωθεί για να τον χρησιμοποιήσει.

## What the server refuses, by its kind.

core-sharing-no-room = Το έργο δεν βρίσκεται πια στον διακομιστή.
core-sharing-not-admitted = Ο διακομιστής δεν δέχεται πια αυτό το αντίγραφο του έργου.
core-sharing-not-owner = Μόνο όποιος μοιράζεται το έργο μπορεί να το κάνει αυτό.
core-sharing-bad-code = Ο κωδικός πρόσκλησης δεν ισχύει. Μπορεί να γράφτηκε λάθος, να έχει ήδη χρησιμοποιηθεί, να έχει αποσυρθεί ή να έχει λήξει.
core-sharing-exists = Το έργο βρίσκεται ήδη στον διακομιστή.
core-sharing-full = Ο διακομιστής έχει ήδη όσα έργα είναι ρυθμισμένος να χωρά.
core-sharing-password-asked = Αυτός ο διακομιστής ζητά κωδικό πρόσβασης από όσους μοιράζονται έργα μέσω αυτού.
core-sharing-password-wrong = Ο κωδικός πρόσβασης δεν είναι αυτός που ζητά ο διακομιστής.
core-sharing-too-many = Έγιναν πάρα πολλές προσπάθειες από εδώ. Δοκιμάστε ξανά σε δέκα λεπτά.
core-sharing-no-file = Ο διακομιστής δεν έχει την εικόνα.
core-sharing-server-error = Το { $host } απάντησε με σφάλμα.

## What the server says in its own words, which are English, where the
## application knows them.

core-sharing-no-name = Το έργο δεν έχει όνομα.
core-sharing-bad-id = Το αναγνωριστικό του έργου δεν είναι από αυτά που μπορεί να χρησιμοποιήσει ο διακομιστής.
core-sharing-many-invitations = Υπάρχουν ήδη πενήντα ανοιχτές προσκλήσεις· αποσύρετε μερικές.
core-sharing-no-collaborator = Δεν υπάρχει τέτοιος συνεργάτης.
core-sharing-not-whole = Το αρχείο δεν έφτασε ολόκληρο.
# The most is in the server's words: "25 MB".
core-sharing-file-too-large = Το αρχείο είναι μεγαλύτερο από όσο δέχεται αυτός ο διακομιστής: ένα αρχείο μπορεί να έχει το πολύ { $most }.
core-sharing-project-full = Δεν υπάρχει χώρος για το αρχείο: τα αρχεία ενός έργου μπορούν να έχουν όλα μαζί το πολύ { $most } σε αυτόν τον διακομιστή.

## The pictures of the figures, which are sent and fetched one by one.

core-sharing-picture-too-large = Το { $host } δεν δέχεται τόσο μεγάλη εικόνα.
core-sharing-picture-larger = Μια εικόνα είναι μεγαλύτερη από όσο δέχεται το { $host } (το πολύ { $most } MB), και δεν φτάνει στους άλλους.
core-sharing-picture-not-sent = Μια εικόνα δεν μπόρεσε να σταλεί: { $error }.
core-sharing-picture-not-fetched = Μια εικόνα δεν μπόρεσε να ληφθεί: { $error }.

## Publishing and joining.

core-sharing-shared-already = Το έργο είναι ήδη σε κοινή χρήση.
core-sharing-own-code = Ο κωδικός πρόσκλησης είναι για το «{ $name }», που μοιράζεται από αυτόν τον υπολογιστή: το έχετε ήδη.
