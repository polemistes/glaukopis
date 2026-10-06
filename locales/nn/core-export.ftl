# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Biletet «{ $name }» finst ikkje på denne datamaskina, og er utelate frå dokumentet.
core-export-astray = { $count ->
    [one] Ein kryssreferanse i teksten viser til noko som ikkje er i dokumentet. Han er sett som [?].
   *[other] Kryssreferansar i teksten viser, på { $count } stader, til noko som ikkje er i dokumentet. Dei er sette som [?].
}
core-export-latex-font = { $font } er ikkje installert. Dokumentet er sett med Latin Modern, skrifta LaTeX har sjølv.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] Éin tekst i dokumentet vart ikkje send, og er ikkje teken vare på.
   *[other] { $count } tekstar i dokumentet vart ikkje sende, og er ikkje tekne vare på.
}
# Shown after "not found: ".
core-export-preview-document = dokumentet til førehandsvisinga
core-export-reading-pdf = kunne ikkje lese PDF-en som vart laga
core-export-reading-made = kunne ikkje lese dokumentet som vart laga

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = mønsterdokumentet kunne ikkje lesast: { $error }
core-export-pattern-lacks = mønsterdokumentet har ingen { $name }
core-export-pattern-reading = kunne ikkje lese mønsterdokumentet
core-export-pattern-writing = kunne ikkje skrive mønsterdokumentet

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Formelen sluttar før han er ferdig.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } er ukjend.
core-export-formula-unexpected = { $what } var ikkje venta der det står.
core-export-formula-unreadable = Formelen kunne ikkje lesast.
core-export-formula-too-long = Formelen er for lang.

## Reference styles.

core-export-style-bad-id = «{ $id }» kan ikkje vere id-en til ein stil
core-export-not-a-style = Dette er ikkje ein stil: { $error }.
core-export-not-a-style-begin = Dette er ikkje ein stil: han byrjar ikkje med <style>.
core-export-dependent-style = Denne stilen viser berre til ein annan stil, som han tek forma si frå. Hent heller den ved namnet.
core-export-style-unreadable = Stilen kunne ikkje lesast inn att.
core-export-style-needs-name = Ein stil må ha eit namn.
core-export-style-own-only = Berre dine eigne stilar kan slettast.
# Shown after "not found: ".
core-export-the-reference-style = referansestilen «{ $id }»
core-export-any-reference-style = nokon referansestil
core-export-the-style = stilen «{ $id }»

## Document formats.

core-export-format-bad-id = «{ $id }» kan ikkje vere id-en til eit dokumentformat
core-export-format-needs-name = Eit dokumentformat må ha eit namn.
core-export-format-own-only = Berre dine eigne dokumentformat kan slettast.
core-export-not-a-length = «{ $length }» er ikkje ei lengd
# Shown after "not found: ".
core-export-the-format = dokumentformatet «{ $id }»
