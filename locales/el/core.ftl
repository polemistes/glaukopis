# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = δεν διαβάζεται το { $path }: { $message }
error-not-found = δεν βρέθηκε: { $what }
error-network = δίκτυο: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = Το { $program } δεν είναι εγκατεστημένο ή δεν βρέθηκε
# A program that is there, but older than what Glaukopis needs.
program-too-old = Είναι εγκατεστημένο το { $program } { $version }. Το Glaukopis χρειάζεται { $program } { $least } ή νεότερο.
program-failed = Το { $program } απέτυχε: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = τελείωσε με { $status }
program-stopped = Το { $program } σταμάτησε.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = ανάγνωση του { $path }
io-writing = εγγραφή του { $path }
io-creating = δημιουργία του { $path }
io-creating-directory-in = δημιουργία φακέλου μέσα στο { $path }
io-creating-temporary-in = δημιουργία προσωρινού αρχείου μέσα στο { $path }
io-creating-temporary = δημιουργία προσωρινού φακέλου
io-opening = άνοιγμα του { $path }
io-removing = αφαίρεση του { $path }
io-copying = αντιγραφή του { $path }
io-flushing = ολοκλήρωση της εγγραφής του { $path }
io-replacing = αντικατάσταση του { $path }
io-backing-up = δημιουργία αντιγράφου ασφαλείας του { $path }
io-storing = αποθήκευση του { $path }
io-no-directory = το { $path } δεν έχει φάκελο

## The network. Shown after "network: ".

network-timeout = το { $host } δεν απάντησε εγκαίρως
network-host-not-found = το { $host } δεν βρέθηκε· υπάρχει σύνδεση με το δίκτυο;
network-unreachable = δεν υπάρχει πρόσβαση στο { $host }
network-unreachable-because = δεν υπάρχει πρόσβαση στο { $host }: { $error }
network-nothing-there = το { $host } δεν έχει τίποτα σε αυτή τη διεύθυνση
network-wait = το { $host } μας ζητά να περιμένουμε πριν ξαναρωτήσουμε
network-status = το { $host } απάντησε με σφάλμα ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = το { $method } δεν είναι τρόπος ερώτησης που χρησιμοποιείται εδώ

## When the application is opened a second time.

core-in-use-title = Το Glaukopis είναι ήδη ανοιχτό
core-in-use = Το Glaukopis είναι ήδη ανοιχτό και δουλεύει στο { $path }. Μόνο ένα μπορεί να δουλεύει εκεί κάθε φορά, για να μη γράφει το ένα πάνω σε ό,τι έγραψε το άλλο. Συνεχίστε σε εκείνο που είναι ανοιχτό.
