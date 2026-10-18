# The words of a language made into a project, to be read through and
# mended in Glaukopis, and written back as Fluent files (ADR 0034). In the
# settings of languages, and over such a project. See locales/README.md.

words-title = Lav et oversættelsesprojekt af teksterne i Glaukopis
words-hint = Til dem, der oversætter Glaukopis’ grænseflade. Brugere kan også bruge det til at ændre grænsefladens tekster på et sprog efter eget valg i deres egen installation af Glaukopis.
words-language = Sprog
words-make = Lav projektet
words-making = Laver det…
words-make-failed = Ordprojektet kunne ikke laves
# $language is the name of the language: "Norwegian Bokmål".
words-project-name = Ord: { $language }
words-not-a-project = Dette projekt indeholder ingen ord fra Glaukopis.
words-bar = Glaukopis’ ord på { $language }. Ændr ordene under det engelske; det, du ændrer, skrives tilbage som Fluent-filer.
words-write = Skriv som Fluent-filer…
words-writing = Skriver…
words-write-choose = Mappen med sprogets Fluent-filer
words-write-failed = Ordene kunne ikke skrives
# $count is how many messages; $files how many files.
words-written = { $count ->
    [0] Intet var ændret, og intet blev skrevet.
    [one] Én meddelelse blev skrevet, i { $files ->
        [one] én fil
       *[other] { $files } filer
    }.
   *[other] { $count } meddelelser blev skrevet, i { $files ->
        [one] én fil
       *[other] { $files } filer
    }.
}
words-result-title = De skrevne ord
words-conflicts = Ændret i filerne, siden projektet blev lavet, og ladt stå, som filerne har dem
words-refused = Ikke skrevet; skal rettes i projektet
# $detail says more: the variables it has and must have, the plural forms it lacks.
words-refused-fluent = den er ikke gyldig Fluent: { $detail }
words-refused-variables = dens variabler er ikke de samme som i det engelske: { $detail }
words-refused-reference = den henviser til { $detail }, hvad det engelske ikke gør
words-refused-plurals = dens flertalsformer er ikke sprogets: { $detail }
words-refused-missing = det engelske har ingen sådan meddelelse, eller meddelelsens tekst blev ikke skrevet
words-refused-file = filen { $detail } ville ikke kunne læses bagefter

# Putting the changed words to use at once, without a new version of
# Glaukopis (ADR 0035): they are written into the data directory and laid
# over the words Glaukopis came with.
words-use = Brug dem nu
words-using = Tager dem i brug…
words-use-hint = Tager det, du har ændret, i brug med det samme, i stedet for de ord, Glaukopis kom med, uden en ny version. Fluent-filerne skrives ikke af dette.
words-use-failed = Ordene kunne ikke tages i brug
# $count is how many messages.
words-used = { $count ->
    [0] Intet var ændret, og intet blev taget i brug.
    [one] Én meddelelse er nu i brug.
   *[other] { $count } meddelelser er nu i brug.
}
words-used-title = De ord, der er taget i brug
words-used-refused = Ikke taget i brug; skal rettes i projektet
# $languages are the names of the languages: "English, Norwegian Bokmål".
words-own-in-use = Ord, du har ændret, er i brug i stedet for dem, Glaukopis kom med, for { $languages }.
words-own-remove = Fjern dem
words-own-remove-title = Fjern de ord, du har ændret?
words-own-remove-message = De ord, du har taget i brug for { $languages }, fjernes, og dem, Glaukopis kom med, bruges igen. Ordprojekterne beholdes.
words-own-removed = De ord, Glaukopis kom med, bruges igen.
words-own-remove-failed = De ord, du har ændret, kunne ikke fjernes
