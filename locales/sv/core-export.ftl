# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Bilden ”{ $name }” finns inte på den här datorn och utelämnas ur dokumentet.
core-export-astray = { $count ->
    [one] En korshänvisning i texten pekar på något som inte finns i dokumentet. Den sätts som [?].
   *[other] { $count } korshänvisningar i texten pekar på sådant som inte finns i dokumentet. De sätts som [?].
}
core-export-latex-font = { $font } är inte installerat. Dokumentet sätts i Latin Modern, det typsnitt LaTeX har av sig självt.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] { $count } text i dokumentet skickades inte, och finns inte kvar.
   *[other] { $count } texter i dokumentet skickades inte, och finns inte kvar.
}
# Shown after "not found: ".
core-export-preview-document = förhandsvisningens dokument
core-export-reading-pdf = läsningen av den PDF som gjordes
core-export-reading-made = läsningen av dokumentet som gjordes

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = mönsterdokumentet kunde inte läsas: { $error }
core-export-pattern-lacks = mönsterdokumentet har ingen { $name }
core-export-pattern-reading = läsningen av mönsterdokumentet
core-export-pattern-writing = skrivningen av mönsterdokumentet

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Formeln slutar innan den är fullständig.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } är inte känt.
core-export-formula-unexpected = { $what } väntades inte där det står.
core-export-formula-unreadable = Formeln kunde inte läsas.
core-export-formula-too-long = Formeln är för lång.

## Reference styles.

core-export-style-bad-id = ”{ $id }” kan inte vara id för en stil
core-export-not-a-style = Det här är inte en stil: { $error }.
core-export-not-a-style-begin = Det här är inte en stil: den börjar inte med <style>.
core-export-dependent-style = Den här stilen nämner bara en annan stil, som den tar sin form från. Hämta den stilen efter dess namn i stället.
core-export-style-unreadable = Stilen kunde inte läsas tillbaka.
core-export-style-needs-name = En stil behöver ett namn.
core-export-style-own-only = Bara dina egna stilar kan raderas.
# Shown after "not found: ".
core-export-the-reference-style = referensstilen ”{ $id }”
core-export-any-reference-style = någon referensstil alls
core-export-the-style = stilen ”{ $id }”

## Document formats.

core-export-format-bad-id = ”{ $id }” kan inte vara id för ett format
core-export-format-needs-name = Ett format behöver ett namn.
core-export-format-own-only = Bara dina egna format kan raderas.
core-export-not-a-length = ”{ $length }” är inte en längd
# Shown after "not found: ".
core-export-the-format = formatet ”{ $id }”
