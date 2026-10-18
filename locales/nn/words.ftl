# The words of a language made into a project, to be read through and
# mended in Glaukopis, and written back as Fluent files (ADR 0034). In the
# settings of languages, and over such a project. See locales/README.md.

words-title = Lag eit omsetjingsprosjekt av tekstane i Glaukopis
words-hint = For dei som omset brukargrensesnittet i Glaukopis. Brukarar kan òg bruke dette til å endre tekstane i grensesnittet på eit språk dei vel, i sin eigen installasjon av Glaukopis.
words-language = Språk
words-make = Lag prosjektet
words-making = Lagar det …
words-make-failed = Prosjektet av ord kunne ikkje lagast
# $language is the name of the language: "Norwegian Bokmål".
words-project-name = Ord: { $language }
words-not-a-project = Dette prosjektet har ingen ord frå Glaukopis.
words-bar = Orda i Glaukopis på { $language }. Endre orda under engelsken; det du endrar, blir skrive tilbake som Fluent-filer.
words-write = Skriv som Fluent-filer …
words-writing = Skriv …
words-write-choose = Mappa med Fluent-filene til språket
words-write-failed = Orda kunne ikkje skrivast
# $count is how many messages; $files how many files.
words-written = { $count ->
    [0] Ingenting var endra, og ingenting vart skrive.
    [one] Éi melding vart skriven, til { $files ->
        [one] éi fil
       *[other] { $files } filer
    }.
   *[other] { $count } meldingar vart skrivne, til { $files ->
        [one] éi fil
       *[other] { $files } filer
    }.
}
words-result-title = Orda som vart skrivne
words-conflicts = Endra i filene sidan prosjektet vart laga, og står slik filene har dei
words-refused = Ikkje skrivne: rett dei i prosjektet
# $detail says more: the variables it has and must have, the plural forms it lacks.
words-refused-fluent = det er ikkje gyldig Fluent: { $detail }
words-refused-variables = variablane er ikkje dei same som i engelsken: { $detail }
words-refused-reference = det viser til { $detail }, som engelsken ikkje gjer
words-refused-plurals = fleirtalsformene er ikkje dei språket har: { $detail }
words-refused-missing = engelsken har inga slik melding, eller teksten i meldinga vart ikkje skriven
words-refused-file = fila { $detail } ville ikkje kunne lesast etterpå

# Putting the changed words to use at once, without a new version of
# Glaukopis (ADR 0035): they are written into the data directory and laid
# over the words Glaukopis came with.
words-use = Bruk dei no
words-using = Tek dei i bruk …
words-use-hint = Tek det du har endra i bruk med ein gong, i staden for orda Glaukopis kom med, utan ein ny versjon. Fluent-filene blir ikkje skrivne av dette.
words-use-failed = Orda kunne ikkje takast i bruk
# $count is how many messages.
words-used = { $count ->
    [0] Ingenting var endra, og ingenting vart teke i bruk.
    [one] Éi melding er no i bruk.
   *[other] { $count } meldingar er no i bruk.
}
words-used-title = Orda som vart tekne i bruk
words-used-refused = Ikkje tekne i bruk: rett dei i prosjektet
# $languages are the names of the languages: "English, Norwegian Bokmål".
words-own-in-use = Ord du har endra, er i bruk i staden for dei Glaukopis kom med, for { $languages }.
words-own-remove = Fjern dei
words-own-remove-title = Fjerne orda du har endra?
words-own-remove-message = Orda du har teke i bruk for { $languages }, blir fjerna, og orda Glaukopis kom med, blir brukte igjen. Prosjekta av ord blir tekne vare på.
words-own-removed = Orda Glaukopis kom med, blir brukte igjen.
words-own-remove-failed = Orda du har endra, kunne ikkje fjernast
