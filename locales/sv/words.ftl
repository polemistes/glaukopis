# The words of a language made into a project, to be read through and
# mended in Glaukopis, and written back as Fluent files (ADR 0034). In the
# settings of languages, and over such a project. See locales/README.md.

words-title = Gör ett översättningsprojekt av Glaukopis gränssnittstexter
words-hint = För översättare av Glaukopis gränssnitt. Den som använder Glaukopis kan också ändra gränssnittstexterna på det språk man väljer, i sin egen installation av Glaukopis.
words-language = Språk
words-make = Gör projektet
words-making = Gör det…
words-make-failed = Projektet med orden kunde inte göras
# $language is the name of the language: "Norwegian Bokmål".
words-project-name = Ord: { $language }
words-not-a-project = Det här projektet innehåller inga av Glaukopis ord.
words-bar = Glaukopis ord ({ $language }). Ändra orden under engelskan; det du ändrar skrivs tillbaka som Fluent-filer.
words-write = Skriv som Fluent-filer…
words-writing = Skriver…
words-write-choose = Mappen med språkets Fluent-filer
words-write-failed = Orden kunde inte skrivas
# $count is how many messages; $files how many files.
words-written = { $count ->
    [0] Inget ändrades, och inget skrevs.
    [one] Ett meddelande skrevs, i { $files ->
        [one] en fil
       *[other] { $files } filer
    }.
   *[other] { $count } meddelanden skrevs, i { $files ->
        [one] en fil
       *[other] { $files } filer
    }.
}
words-result-title = Orden som skrevs
words-conflicts = Ändrade i filerna sedan projektet gjordes, och lämnade som filerna har dem
words-refused = Inte skrivna, att rättas i projektet
# $detail says more: the variables it has and must have, the plural forms it lacks.
words-refused-fluent = det är inte giltig Fluent: { $detail }
words-refused-variables = dess variabler är inte engelskans: { $detail }
words-refused-reference = det hänvisar till { $detail }, vilket engelskan inte gör
words-refused-plurals = dess pluralformer är inte språkets: { $detail }
words-refused-missing = engelskan har inget sådant meddelande, eller så skrevs inte meddelandets text
words-refused-file = filen { $detail } skulle inte gå att läsa efteråt

# Putting the changed words to use at once, without a new version of
# Glaukopis (ADR 0035): they are written into the data directory and laid
# over the words Glaukopis came with.
words-use = Använd dem nu
words-using = Tar dem i bruk…
words-use-hint = Tar det du ändrat i bruk genast, i stället för orden som följde med Glaukopis, utan en ny version. Fluent-filerna skrivs inte av detta.
words-use-failed = Orden kunde inte tas i bruk
# $count is how many messages.
words-used = { $count ->
    [0] Inget ändrades, och inget togs i bruk.
    [one] Ett meddelande används nu.
   *[other] { $count } meddelanden används nu.
}
words-used-title = Orden som togs i bruk
words-used-refused = Inte tagna i bruk, att rättas i projektet
# $languages are the names of the languages: "English, Norwegian Bokmål".
words-own-in-use = Ord som du har ändrat används i stället för dem som följde med Glaukopis ({ $languages }).
words-own-remove = Ta bort dem
words-own-remove-title = Ta bort orden du har ändrat?
words-own-remove-message = De ord du har tagit i bruk ({ $languages }) tas bort, och de som följde med Glaukopis används igen. Projekten med orden behålls.
words-own-removed = Orden som följde med Glaukopis används igen.
words-own-remove-failed = Orden du har ändrat kunde inte tas bort
