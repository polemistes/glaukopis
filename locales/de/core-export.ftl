# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Das Bild „{ $name }“ ist nicht auf diesem Computer und bleibt im Dokument weg.
core-export-astray = { $count ->
    [one] Ein Verweis im Text zeigt auf etwas, das nicht im Dokument ist. Er wird als [?] gesetzt.
   *[other] { $count } Verweise im Text zeigen auf etwas, das nicht im Dokument ist. Sie werden als [?] gesetzt.
}
core-export-latex-font = { $font } ist nicht installiert. Das Dokument wird in Latin Modern gesetzt, der eigenen Schrift von LaTeX.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count } Texte des Dokuments wurden nicht gesendet und sind nicht aufbewahrt.
# Shown after "not found: ".
core-export-preview-document = das Dokument der Vorschau
core-export-reading-pdf = Lesen des erzeugten PDF
core-export-reading-made = Lesen des erzeugten Dokuments

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = das Musterdokument konnte nicht gelesen werden: { $error }
core-export-pattern-lacks = dem Musterdokument fehlt { $name }
core-export-pattern-reading = Lesen des Musterdokuments
core-export-pattern-writing = Schreiben des Musterdokuments

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Die Formel endet, bevor sie vollständig ist.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } ist nicht bekannt.
core-export-formula-unexpected = { $what } war an dieser Stelle nicht erwartet.
core-export-formula-unreadable = Die Formel konnte nicht gelesen werden.
core-export-formula-too-long = Die Formel ist zu lang.

## Reference styles.

core-export-style-bad-id = „{ $id }“ kann nicht die Kennung eines Stils sein
core-export-not-a-style = Das ist kein Stil: { $error }.
core-export-not-a-style-begin = Das ist kein Stil: er beginnt nicht mit <style>.
core-export-dependent-style = Dieser Stil nennt nur einen anderen Stil, dessen Form er übernimmt. Holen Sie stattdessen jenen, unter seinem Namen.
core-export-style-unreadable = Der Stil konnte nicht zurückgelesen werden.
core-export-style-needs-name = Ein Stil braucht einen Namen.
core-export-style-own-only = Nur eigene Stile können gelöscht werden.
# Shown after "not found: ".
core-export-the-reference-style = der Zitierstil „{ $id }“
core-export-any-reference-style = irgendein Zitierstil
core-export-the-style = der Stil „{ $id }“

## Document formats.

core-export-format-bad-id = „{ $id }“ kann nicht die Kennung eines Formats sein
core-export-format-needs-name = Ein Format braucht einen Namen.
core-export-format-own-only = Nur eigene Formate können gelöscht werden.
core-export-not-a-length = „{ $length }“ ist keine Länge
# Shown after "not found: ".
core-export-the-format = das Format „{ $id }“
