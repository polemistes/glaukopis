# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Billedet »{ $name }« findes ikke på denne computer og er udeladt af dokumentet.
core-export-astray = { $count ->
    [one] En krydshenvisning i teksten henviser til noget, der ikke er i dokumentet. Den er sat som [?].
   *[other] { $count } krydshenvisninger i teksten henviser til noget, der ikke er i dokumentet. De er sat som [?].
}
core-export-latex-font = { $font } er ikke installeret. Dokumentet er sat med Latin Modern, den skrift LaTeX selv har.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] Én tekst i dokumentet blev ikke sendt og er ikke gemt.
   *[other] { $count } tekster i dokumentet blev ikke sendt og er ikke gemt.
}
# Shown after "not found: ".
core-export-preview-document = forhåndsvisningens dokument
core-export-reading-pdf = kunne ikke læse den PDF, der blev lavet
core-export-reading-made = kunne ikke læse det dokument, der blev lavet

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = mønsterdokumentet kunne ikke læses: { $error }
core-export-pattern-lacks = mønsterdokumentet har ingen { $name }
core-export-pattern-reading = kunne ikke læse mønsterdokumentet
core-export-pattern-writing = kunne ikke skrive mønsterdokumentet

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Formlen slutter, før den er færdig.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } kendes ikke.
core-export-formula-unexpected = { $what } var ikke ventet, hvor det står.
core-export-formula-unreadable = Formlen kunne ikke læses.
core-export-formula-too-long = Formlen er for lang.

## Reference styles.

core-export-style-bad-id = »{ $id }« kan ikke være id for en stil
core-export-not-a-style = Dette er ikke en stil: { $error }.
core-export-not-a-style-begin = Dette er ikke en stil: den begynder ikke med <style>.
core-export-dependent-style = Denne stil nævner kun en anden stil, som den tager sin form fra. Hent den anden stil ved navn i stedet.
core-export-style-unreadable = Stilen kunne ikke læses tilbage.
core-export-style-needs-name = En stil skal have et navn.
core-export-style-own-only = Kun dine egne stile kan slettes.
# Shown after "not found: ".
core-export-the-reference-style = referencestilen »{ $id }«
core-export-any-reference-style = nogen referencestil
core-export-the-style = stilen »{ $id }«

## Document formats.

core-export-format-bad-id = »{ $id }« kan ikke være id for et format
core-export-format-needs-name = Et format skal have et navn.
core-export-format-own-only = Kun dine egne formater kan slettes.
core-export-not-a-length = »{ $length }« er ikke en længde
# Shown after "not found: ".
core-export-the-format = formatet »{ $id }«
