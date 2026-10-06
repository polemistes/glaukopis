# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Παραπομπές που βρέθηκαν
# On the tab of the panel, beside the other tabs: short.
found-tab = Βρέθηκαν
found-between = Ανάμεσα στον χάρτη και στις παραπομπές που βρέθηκαν
found-taken = Τι λογαριάζεται για παραπομπή
found-taken-always = Ό,τι έφτιαξε πρόγραμμα, και ετικέτες
found-taken-years = Παρενθέσεις με έτος μέσα
found-taken-named = Σημειώσεις που κατονομάζουν έργο της βιβλιοθήκης
found-taken-notes = Κάθε σημείωση
found-asking = Ερώτηση στη βιβλιοθήκη…
found-make-certain = { $count ->
    [one] Να γίνει παραπομπή η μία που είναι βέβαιη
   *[other] Να γίνουν παραπομπές οι { $count } που είναι βέβαιες
}
found-made = { $count ->
    [one] Έγινε μία παραπομπή
   *[other] Έγιναν { $count } παραπομπές
}
found-made-undo = Το Ctrl+Z τις αναιρεί, ως ένα βήμα.
found-library-failed = Η βιβλιοθήκη δεν μπόρεσε να ερωτηθεί.
found-nothing = Τίποτα προς εξέταση
found-nothing-looked = Δεν μένει σε αυτόν τον χάρτη καμία παραπομπή που βρέθηκε, και τίποτα σε αυτόν δεν μοιάζει με παραπομπή.
found-nothing-looked-more = Δεν μένει σε αυτόν τον χάρτη καμία παραπομπή που βρέθηκε, και τίποτα σε αυτόν δεν μοιάζει με παραπομπή. Περισσότερα μπορούν να λογαριαστούν για παραπομπές, παραπάνω.
found-nothing-not-looked = Δεν μένει σε αυτόν τον χάρτη καμία παραπομπή που βρέθηκε. Κείμενο που απλώς μοιάζει με παραπομπή αναζητείται όταν πείτε παραπάνω τι λογαριάζεται για παραπομπή: παρενθέσεις με έτος μέσα, ή σημειώσεις.
found-list-label = Τι υπάρχει προς εξέταση
found-untitled = Χωρίς τίτλο
found-in-a-note = Σε σημείωση
# The element of the map a citation stands in.
found-in = Στο «{ $element }»
found-in-note-of = Σε σημείωση του «{ $element }»
# Set small and high after the words a note stands after.
found-note-mark = σημ.
found-position = { $index } από { $count }
found-previous = Η προηγούμενη
found-next = Η επόμενη
found-list-show = Εμφάνιση του καταλόγου
found-list-hide = Απόκρυψη του καταλόγου
found-later = Αργότερα
found-leave = Να μείνει κείμενο
found-make = Να γίνει παραπομπή

## How sure the library is of what it proposes.

found-sure-certain = Η βιβλιοθήκη το έχει σίγουρα
found-sure-likely = Η βιβλιοθήκη έχει αυτό που πιθανόν είναι
found-sure-possible = Η βιβλιοθήκη έχει αυτό που ίσως είναι
found-sure-none = Ένα έργο της δεν έχει ακόμη αναφορά

## By what a citation was found.

found-by-zotero = Φτιαγμένη από το Zotero
found-by-mendeley = Φτιαγμένη από το Mendeley, ή από πρόγραμμα που γράφει όπως αυτό
found-by-key = Ετικέτα που κατονομάζει αναφορά
found-by-form = Λογαριάστηκε για παραπομπή από τη μορφή της

## The citation that is to be made.

found-the-citation = Η παραπομπή
found-no-works = Δεν κατονομάζει κανένα έργο. Προσθέστε ένα, ή αφήστε την ως το κείμενο που είναι.
found-add-work = Προσθήκη έργου
found-author-in-text = Συγγραφέας μέσα στο κείμενο: Nagy (1979)
found-pick-work = Το έργο που παρατίθεται: συγγραφέας, τίτλος, έτος
found-pick-add = Προσθήκη έργου στην παραπομπή
found-too-little = Το αρχείο λέει πολύ λίγα για αυτό το έργο για να γίνει αναφορά
found-reference-failed = Η αναφορά δεν μπόρεσε να φτιαχτεί

## A citation that stands in a note.

found-in-note = Βρίσκεται σε σημείωση
found-note-becomes = Η σημείωση γίνεται παραπομπή
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Ό,τι άλλο λέει η σημείωση μπαίνει πριν και μετά τα έργα της{ $has ->
        [before] : «{ $before }» πριν
        [after] : «{ $after }» μετά
       *[both] : «{ $before }» πριν, «{ $after }» μετά
    }. Το στυλ των αναφορών τη βάζει στη γραμμή ή σε σημείωση.
found-note-style = Το στυλ των αναφορών τη βάζει στη γραμμή ή σε σημείωση.
found-citation-in-note = Η παραπομπή μένει στη σημείωση
    .hint = Η σημείωση μένει σημείωση, με ό,τι άλλο λέει.
found-for-all = Έτσι και για όλες τις επόμενες
found-note-not = Δεν βρίσκεται σε σημείωση.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Η σημείωση περιέχει { $what ->
        [math] έναν τύπο
        [crossref] μια εσωτερική παραπομπή
        [citation] μια παραπομπή
        [hard_break] μια δεύτερη γραμμή
       *[other] κάτι που δεν είναι κείμενο
    }, που δεν χωρά στις λέξεις πριν και μετά από ένα έργο.
found-note-another = Η σημείωση περιέχει άλλη μία παραπομπή που βρέθηκε, που θα χανόταν μέσα στις λέξεις μετά από αυτήν.

## Why what was asked could not be done.

found-trouble-gone = Δεν βρίσκεται πια στο κείμενο.
found-trouble-changed = Το κείμενο εδώ άλλαξε αφότου προτάθηκε, και εξετάστηκε ξανά.
found-trouble-cannot = Δεν μπορεί να γίνει παραπομπή εδώ.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } και { $second }
found-people-more = { $first } κ.ά.
found-work-a-work = Ένα έργο
found-work-looking = Το «{ $work }» αναζητείται στη βιβλιοθήκη σας…
found-work-no-tag = Το «{ $work }» είναι ετικέτα που δεν την έχει καμία αναφορά της βιβλιοθήκης σας.
found-work-not-found = Το «{ $work }» δεν βρέθηκε στη βιβλιοθήκη σας.
found-work-chosen = Επιλογή δική σας
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Όπως επιλέξατε για το ίδιο έργο
found-work-certain = Βέβαιο
found-work-likely = Πιθανό
found-work-possible = Ενδεχόμενο
# What the text says the work is.
found-work-for = για «{ $work }»
found-work-others = Άλλες αναφορές που μπορεί να είναι
found-work-or = Ή
found-work-may-be = Μπορεί να είναι
found-work-another = Άλλη…
found-work-find = Εύρεση…
found-work-add = Προσθήκη στη βιβλιοθήκη
