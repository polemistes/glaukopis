# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Slika „{ $name }“ nije na ovom računaru i izostavljena je iz dokumenta.
core-export-astray = { $count ->
    [one] Jedna uputnica u tekstu upućuje na nešto čega nema u dokumentu. Postavljena je kao [?].
    [few] { $count } uputnice u tekstu upućuju na ono čega nema u dokumentu. Postavljene su kao [?].
   *[other] { $count } uputnica u tekstu upućuje na ono čega nema u dokumentu. Postavljene su kao [?].
}
core-export-latex-font = { $font } nije instaliran. Dokument je složen u fontu Latin Modern, vlastitom fontu LaTeX-a.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] { $count } tekst dokumenta nije poslan i nije sačuvan.
    [few] { $count } teksta dokumenta nisu poslana i nisu sačuvana.
   *[other] { $count } tekstova dokumenta nije poslano i nije sačuvano.
}
# Shown after "not found: ".
core-export-preview-document = dokument pregleda
core-export-reading-pdf = čitanje napravljenog PDF-a
core-export-reading-made = čitanje napravljenog dokumenta

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = predložak nije bilo moguće pročitati: { $error }
core-export-pattern-lacks = predložak nema { $name }
core-export-pattern-reading = čitanje predloška
core-export-pattern-writing = pisanje predloška

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Formula se završava prije nego što je potpuna.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } nije poznato.
core-export-formula-unexpected = { $what } nije očekivano na tom mjestu.
core-export-formula-unreadable = Formulu nije bilo moguće pročitati.
core-export-formula-too-long = Formula je predugačka.

## Reference styles.

core-export-style-bad-id = „{ $id }“ ne može biti identifikator stila
core-export-not-a-style = Ovo nije stil: { $error }.
core-export-not-a-style-begin = Ovo nije stil: ne počinje sa <style>.
core-export-dependent-style = Ovaj stil samo imenuje drugi stil, od kojeg preuzima oblik. Dohvatite umjesto njega taj stil po imenu.
core-export-style-unreadable = Stil nije bilo moguće ponovo pročitati.
core-export-style-needs-name = Stilu treba naziv.
core-export-style-own-only = Mogu se izbrisati samo vlastiti stilovi.
# Shown after "not found: ".
core-export-the-reference-style = stil citiranja „{ $id }“
core-export-any-reference-style = bilo koji stil citiranja
core-export-the-style = stil „{ $id }“

## Document formats.

core-export-format-bad-id = „{ $id }“ ne može biti identifikator formata
core-export-format-needs-name = Formatu treba naziv.
core-export-format-own-only = Mogu se izbrisati samo vlastiti formati.
core-export-not-a-length = „{ $length }“ nije dužina
# Shown after "not found: ".
core-export-the-format = format „{ $id }“
