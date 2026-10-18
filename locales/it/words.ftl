# The words of a language made into a project, to be read through and
# mended in Glaukopis, and written back as Fluent files (ADR 0034). In the
# settings of languages, and over such a project. See locales/README.md.

words-title = Fai un progetto di traduzione delle parole di Glaukopis
words-hint = Per chi traduce l'interfaccia di Glaukopis. Serve anche a chi vuole cambiare le parole dell'interfaccia nella lingua che preferisce, nella propria installazione di Glaukopis.
words-language = Lingua
words-make = Fai il progetto
words-making = Creazione del progetto…
words-make-failed = Il progetto di parole non si è potuto fare
# $language is the name of the language: "Norwegian Bokmål".
words-project-name = Parole: { $language }
words-not-a-project = Questo progetto non contiene parole di Glaukopis.
words-bar = Le parole di Glaukopis in { $language }. Cambia le parole sotto l'inglese; ciò che cambi viene riscritto come file Fluent.
words-write = Scrivi come file Fluent…
words-writing = Scrittura…
words-write-choose = La cartella dei file Fluent della lingua
words-write-failed = Le parole non si sono potute scrivere
# $count is how many messages; $files how many files.
words-written = { $count ->
    [0] Non è cambiato nulla, e non si è scritto nulla.
    [one] È stato scritto un messaggio, in { $files ->
        [one] un file
        [many] { $files } file
       *[other] { $files } file
    }.
    [many] Sono stati scritti { $count } messaggi, in { $files ->
        [one] un file
        [many] { $files } file
       *[other] { $files } file
    }.
   *[other] Sono stati scritti { $count } messaggi, in { $files ->
        [one] un file
        [many] { $files } file
       *[other] { $files } file
    }.
}
words-result-title = Le parole scritte
words-conflicts = Cambiate nei file da quando il progetto è stato fatto, e lasciate come le hanno i file
words-refused = Non scritte, da correggere nel progetto
# $detail says more: the variables it has and must have, the plural forms it lacks.
words-refused-fluent = non è Fluent corretto: { $detail }
words-refused-variables = le sue variabili non sono quelle dell'inglese: { $detail }
words-refused-reference = rimanda a { $detail }, a cui l'inglese non rimanda
words-refused-plurals = le sue forme del plurale non sono quelle della lingua: { $detail }
words-refused-missing = l'inglese non ha un messaggio così, o il testo del messaggio non è stato scritto
words-refused-file = il file { $detail } dopo non si leggerebbe più

# Putting the changed words to use at once, without a new version of
# Glaukopis (ADR 0035): they are written into the data directory and laid
# over the words Glaukopis came with.
words-use = Usale ora
words-using = Si mettono in uso…
words-use-hint = Mette subito in uso ciò che hai cambiato, al posto delle parole che vengono con Glaukopis, senza una nuova versione. Questo non scrive i file Fluent.
words-use-failed = Le parole non si sono potute mettere in uso
# $count is how many messages.
words-used = { $count ->
    [0] Non è cambiato nulla, e nulla è stato messo in uso.
    [one] Un messaggio è ora in uso.
    [many] { $count } messaggi sono ora in uso.
   *[other] { $count } messaggi sono ora in uso.
}
words-used-title = Le parole messe in uso
words-used-refused = Non messe in uso, da correggere nel progetto
# $languages are the names of the languages: "English, Norwegian Bokmål".
words-own-in-use = Per { $languages } sono in uso parole che hai cambiato, al posto di quelle che vengono con Glaukopis.
words-own-remove = Toglile
words-own-remove-title = Togliere le parole che hai cambiato?
words-own-remove-message = Le parole che hai messo in uso per { $languages } vengono tolte, e si usano di nuovo quelle che vengono con Glaukopis. I progetti di parole restano.
words-own-removed = Si usano di nuovo le parole che vengono con Glaukopis.
words-own-remove-failed = Le parole che hai cambiato non si sono potute togliere
