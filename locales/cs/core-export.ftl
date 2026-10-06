# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Obrázek „{ $name }“ není v tomto počítači a v dokumentu je vynechán.
core-export-astray = { $count ->
    [one] Jeden křížový odkaz v textu míří na něco, co v dokumentu není. Je vysázen jako [?].
    [few] { $count } křížové odkazy v textu míří na něco, co v dokumentu není. Jsou vysázeny jako [?].
   *[other] { $count } křížových odkazů v textu míří na něco, co v dokumentu není. Jsou vysázeny jako [?].
}
core-export-latex-font = Písmo { $font } není nainstalováno. Dokument je vysázen písmem Latin Modern, které má LaTeX vlastní.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] { $count } text dokumentu nebyl odeslán a není uchován.
    [few] { $count } texty dokumentu nebyly odeslány a nejsou uchovány.
   *[other] { $count } textů dokumentu nebylo odesláno a není uchováno.
}
# Shown after "not found: ".
core-export-preview-document = dokument náhledu
core-export-reading-pdf = čtení vytvořeného PDF
core-export-reading-made = čtení vytvořeného dokumentu

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = vzorový dokument nelze přečíst: { $error }
core-export-pattern-lacks = vzorový dokument nemá { $name }
core-export-pattern-reading = čtení vzorového dokumentu
core-export-pattern-writing = zápis vzorového dokumentu

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Vzorec končí dřív, než je úplný.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } není známo.
core-export-formula-unexpected = { $what } se na tomto místě neočekává.
core-export-formula-unreadable = Vzorec nelze přečíst.
core-export-formula-too-long = Vzorec je příliš dlouhý.

## Reference styles.

core-export-style-bad-id = „{ $id }“ nemůže být identifikátorem stylu
core-export-not-a-style = Toto není styl: { $error }.
core-export-not-a-style-begin = Toto není styl: nezačíná značkou <style>.
core-export-dependent-style = Tento styl jen odkazuje na jiný styl, z něhož přebírá svou podobu. Stáhněte raději ten, podle jeho názvu.
core-export-style-unreadable = Styl nelze zpětně přečíst.
core-export-style-needs-name = Styl potřebuje název.
core-export-style-own-only = Smazat lze jen vlastní styly.
# Shown after "not found: ".
core-export-the-reference-style = citační styl „{ $id }“
core-export-any-reference-style = žádný citační styl
core-export-the-style = styl „{ $id }“

## Document formats.

core-export-format-bad-id = „{ $id }“ nemůže být identifikátorem formátu
core-export-format-needs-name = Formát potřebuje název.
core-export-format-own-only = Smazat lze jen vlastní formáty.
core-export-not-a-length = „{ $length }“ není délka
# Shown after "not found: ".
core-export-the-format = formát „{ $id }“
