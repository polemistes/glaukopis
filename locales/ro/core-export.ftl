# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Imaginea „{ $name }” nu este pe acest calculator și este lăsată afară din document.
core-export-astray = { $count ->
    [one] O trimitere din text se referă la ceva ce nu este în document. Este așezată ca [?].
    [few] { $count } trimiteri din text se referă la ceva ce nu este în document. Sunt așezate ca [?].
   *[other] { $count } de trimiteri din text se referă la ceva ce nu este în document. Sunt așezate ca [?].
}
core-export-latex-font = { $font } nu este instalat. Documentul este așezat în Latin Modern, fontul pe care LaTeX îl are al lui.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] Un text al documentului nu a fost trimis și nu este păstrat.
    [few] { $count } texte ale documentului nu au fost trimise și nu sunt păstrate.
   *[other] { $count } de texte ale documentului nu au fost trimise și nu sunt păstrate.
}
# Shown after "not found: ".
core-export-preview-document = documentul previzualizării
core-export-reading-pdf = la citirea PDF-ului făcut
core-export-reading-made = la citirea documentului făcut

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = documentul-model nu s-a putut citi: { $error }
core-export-pattern-lacks = documentul-model nu are { $name }
core-export-pattern-reading = la citirea documentului-model
core-export-pattern-writing = la scrierea documentului-model

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Formula se termină înainte de a fi completă.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } nu este cunoscut.
core-export-formula-unexpected = { $what } nu era așteptat acolo unde stă.
core-export-formula-unreadable = Formula nu s-a putut citi.
core-export-formula-too-long = Formula este prea lungă.

## Reference styles.

core-export-style-bad-id = „{ $id }” nu poate fi identificatorul unui stil
core-export-not-a-style = Acesta nu este un stil: { $error }.
core-export-not-a-style-begin = Acesta nu este un stil: nu începe cu <style>.
core-export-dependent-style = Acest stil doar numește un alt stil, din care își ia forma. Luați-l pe acela după numele lui.
core-export-style-unreadable = Stilul nu s-a putut citi înapoi.
core-export-style-needs-name = Un stil are nevoie de un nume.
core-export-style-own-only = Numai stilurile proprii pot fi șterse.
# Shown after "not found: ".
core-export-the-reference-style = stilul de citare „{ $id }”
core-export-any-reference-style = vreun stil de citare
core-export-the-style = stilul „{ $id }”

## Document formats.

core-export-format-bad-id = „{ $id }” nu poate fi identificatorul unui format
core-export-format-needs-name = Un format are nevoie de un nume.
core-export-format-own-only = Numai formatele proprii pot fi șterse.
core-export-not-a-length = „{ $length }” nu este o lungime
# Shown after "not found: ".
core-export-the-format = formatul „{ $id }”
