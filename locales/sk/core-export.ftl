# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Obrázok „{ $name }“ nie je v tomto počítači a v dokumente je vynechaný.
core-export-astray = { $count ->
    [one] Jeden odkaz v texte smeruje na niečo, čo v dokumente nie je. Je vysádzaný ako [?].
    [few] { $count } odkazy v texte smerujú na niečo, čo v dokumente nie je. Sú vysádzané ako [?].
   *[other] { $count } odkazov v texte smeruje na niečo, čo v dokumente nie je. Sú vysádzané ako [?].
}
core-export-latex-font = Písmo { $font } nie je nainštalované. Dokument je vysádzaný písmom Latin Modern, ktoré má LaTeX vlastné.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] { $count } text dokumentu nebol odoslaný a nie je uchovaný.
    [few] { $count } texty dokumentu neboli odoslané a nie sú uchované.
   *[other] { $count } textov dokumentu nebolo odoslaných a nie sú uchované.
}
# Shown after "not found: ".
core-export-preview-document = dokument náhľadu
core-export-reading-pdf = čítanie vytvoreného PDF
core-export-reading-made = čítanie vytvoreného dokumentu

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = vzorový dokument sa nepodarilo prečítať: { $error }
core-export-pattern-lacks = vzorový dokument nemá { $name }
core-export-pattern-reading = čítanie vzorového dokumentu
core-export-pattern-writing = zápis vzorového dokumentu

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Vzorec sa končí skôr, než je úplný.
# The command is as it was written: \frac.
core-export-formula-unknown = Príkaz { $command } nie je známy.
core-export-formula-unexpected = { $what } nebolo na tomto mieste očakávané.
core-export-formula-unreadable = Vzorec sa nepodarilo prečítať.
core-export-formula-too-long = Vzorec je príliš dlhý.

## Reference styles.

core-export-style-bad-id = „{ $id }“ nemôže byť identifikátorom štýlu
core-export-not-a-style = Toto nie je štýl: { $error }.
core-export-not-a-style-begin = Toto nie je štýl: nezačína sa značkou <style>.
core-export-dependent-style = Tento štýl len odkazuje na iný štýl, z ktorého preberá svoju podobu. Stiahnite radšej ten, podľa jeho názvu.
core-export-style-unreadable = Štýl sa nepodarilo spätne prečítať.
core-export-style-needs-name = Štýl potrebuje názov.
core-export-style-own-only = Odstrániť možno len vlastné štýly.
# Shown after "not found: ".
core-export-the-reference-style = citačný štýl „{ $id }“
core-export-any-reference-style = nijaký citačný štýl
core-export-the-style = štýl „{ $id }“

## Document formats.

core-export-format-bad-id = „{ $id }“ nemôže byť identifikátorom formátu
core-export-format-needs-name = Formát potrebuje názov.
core-export-format-own-only = Odstrániť možno len vlastné formáty.
core-export-not-a-length = „{ $length }“ nie je dĺžka
# Shown after "not found: ".
core-export-the-format = formát „{ $id }“
