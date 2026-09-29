# Det kjernen sier om å lage dokumenter og forhåndsvisninger, om
# referansestiler og om dokumentformater, på bokmål. Se locales/README.md.

## Å lage et dokument.

core-export-picture-missing = Bildet «{ $name }» finnes ikke på denne datamaskinen, og er utelatt fra dokumentet.
core-export-astray = { $count ->
    [one] En kryssreferanse i teksten viser til noe som ikke er i dokumentet. Den er satt som [?].
   *[other] Kryssreferanser i teksten viser, på { $count } steder, til noe som ikke er i dokumentet. De er satt som [?].
}
core-export-latex-font = { $font } er ikke installert. Dokumentet er satt med Latin Modern, skriften LaTeX har selv.
core-export-lacking = { $count ->
    [one] Én tekst i dokumentet ble ikke sendt, og er ikke tatt vare på.
   *[other] { $count } tekster i dokumentet ble ikke sendt, og er ikke tatt vare på.
}
core-export-preview-document = dokumentet til forhåndsvisningen
core-export-reading-pdf = kunne ikke lese PDF-en som ble laget
core-export-reading-made = kunne ikke lese dokumentet som ble laget

## Mønsterdokumentet, som Word og OpenDocument henter stilene sine fra.

core-export-pattern-unreadable = mønsterdokumentet kunne ikke leses: { $error }
core-export-pattern-lacks = mønsterdokumentet har ingen { $name }
core-export-pattern-reading = kunne ikke lese mønsterdokumentet
core-export-pattern-writing = kunne ikke skrive mønsterdokumentet

## Formler, slik de vises der de skrives.

core-export-formula-incomplete = Formelen slutter før den er ferdig.
core-export-formula-unknown = { $command } er ukjent.
core-export-formula-unexpected = { $what } var ikke ventet der det står.
core-export-formula-unreadable = Formelen kunne ikke leses.
core-export-formula-too-long = Formelen er for lang.

## Referansestiler.

core-export-style-bad-id = «{ $id }» kan ikke være id-en til en stil
core-export-not-a-style = Dette er ikke en stil: { $error }.
core-export-not-a-style-begin = Dette er ikke en stil: den begynner ikke med <style>.
core-export-dependent-style = Denne stilen viser bare til en annen stil, som den tar formen sin fra. Hent den heller ved navnet.
core-export-style-unreadable = Stilen kunne ikke leses inn igjen.
core-export-style-needs-name = En stil må ha et navn.
core-export-style-own-only = Bare dine egne stiler kan slettes.
core-export-the-reference-style = referansestilen «{ $id }»
core-export-any-reference-style = noen referansestil
core-export-the-style = stilen «{ $id }»

## Dokumentformater.

core-export-format-bad-id = «{ $id }» kan ikke være id-en til et dokumentformat
core-export-format-needs-name = Et dokumentformat må ha et navn.
core-export-format-own-only = Bare dine egne dokumentformater kan slettes.
core-export-not-a-length = «{ $length }» er ikke en lengde
core-export-the-format = dokumentformatet «{ $id }»
