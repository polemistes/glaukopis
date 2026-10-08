# The words of a language made into a project, to be read through and
# mended in Glaukopis, and written back as Fluent files (ADR 0034). In the
# settings of languages, and over such a project. See locales/README.md.

words-title = Ordene i Glaukopis, som et prosjekt
words-hint = Lager et prosjekt av ordene i grensesnittet på et språk, så du kan lese dem gjennom og rette dem her, med stavekontroll, søk og historikk: et kart for hver del av programmet, et element for hver melding, med engelsken over ordene. Det du endrer, skrives tilbake som Fluent-filer med knappen over prosjektet, til mappen for språket i en kopi av koden til Glaukopis, eller til en hvilken som helst mappe, for å sendes til oss.
words-language = Språk
words-make = Lag prosjektet
words-making = Lager det …
words-make-failed = Prosjektet av ord kunne ikke lages
# $language is the name of the language: "Norwegian Bokmål".
words-project-name = Ord: { $language }
words-not-a-project = Dette prosjektet har ingen ord fra Glaukopis.
words-bar = Ordene i Glaukopis på { $language }. Endre ordene under engelsken; det du endrer, skrives tilbake som Fluent-filer.
words-write = Skriv som Fluent-filer …
words-writing = Skriver …
words-write-choose = Mappen med språkets Fluent-filer
words-write-failed = Ordene kunne ikke skrives
# $count is how many messages; $files how many files.
words-written = { $count ->
    [0] Ingenting var endret, og ingenting ble skrevet.
    [one] Én melding ble skrevet, til { $files ->
        [one] én fil
       *[other] { $files } filer
    }.
   *[other] { $count } meldinger ble skrevet, til { $files ->
        [one] én fil
       *[other] { $files } filer
    }.
}
words-result-title = Ordene som ble skrevet
words-conflicts = Endret i filene siden prosjektet ble laget, og latt være slik filene har dem
words-refused = Ikke skrevet, rett dem i prosjektet
# $detail says more: the variables it has and must have, the plural forms it lacks.
words-refused-fluent = det er ikke gyldig Fluent: { $detail }
words-refused-variables = variablene er ikke de samme som i engelsken: { $detail }
words-refused-reference = det viser til { $detail }, som engelsken ikke gjør
words-refused-plurals = flertallsformene er ikke språkets: { $detail }
words-refused-missing = engelsken har ingen slik melding, eller teksten i meldingen ble ikke skrevet
words-refused-file = filen { $detail } ville ikke kunne leses etterpå
