# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = De afbeelding ‘{ $name }’ staat niet op deze computer en is uit het document weggelaten.
core-export-astray = { $count ->
    [one] Een kruisverwijzing in de tekst wijst naar iets dat niet in het document staat. Ze is gezet als [?].
   *[other] { $count } kruisverwijzingen in de tekst wijzen naar iets dat niet in het document staat. Ze zijn gezet als [?].
}
core-export-latex-font = { $font } is niet geïnstalleerd. Het document is gezet in Latin Modern, het lettertype dat LaTeX zelf heeft.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count } teksten van het document zijn niet verstuurd en zijn niet bewaard.
# Shown after "not found: ".
core-export-preview-document = het document van het voorbeeld
core-export-reading-pdf = het lezen van de gemaakte PDF
core-export-reading-made = het lezen van het gemaakte document

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = het modeldocument kon niet worden gelezen: { $error }
core-export-pattern-lacks = het modeldocument heeft geen { $name }
core-export-pattern-reading = het lezen van het modeldocument
core-export-pattern-writing = het schrijven van het modeldocument

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = De formule eindigt voordat ze af is.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } is niet bekend.
core-export-formula-unexpected = { $what } werd niet verwacht waar het staat.
core-export-formula-unreadable = De formule kon niet worden gelezen.
core-export-formula-too-long = De formule is te lang.

## Reference styles.

core-export-style-bad-id = ‘{ $id }’ kan niet het id van een stijl zijn
core-export-not-a-style = Dit is geen stijl: { $error }.
core-export-not-a-style-begin = Dit is geen stijl: het begint niet met <style>.
core-export-dependent-style = Deze stijl noemt alleen een andere stijl, waarvan ze haar vorm overneemt. Haal die in plaats daarvan op bij haar naam.
core-export-style-unreadable = De stijl kon niet worden teruggelezen.
core-export-style-needs-name = Een stijl heeft een naam nodig.
core-export-style-own-only = Alleen je eigen stijlen kunnen worden gewist.
# Shown after "not found: ".
core-export-the-reference-style = de citeerstijl ‘{ $id }’
core-export-any-reference-style = enige citeerstijl
core-export-the-style = de stijl ‘{ $id }’

## Document formats.

core-export-format-bad-id = ‘{ $id }’ kan niet het id van een formaat zijn
core-export-format-needs-name = Een formaat heeft een naam nodig.
core-export-format-own-only = Alleen je eigen formaten kunnen worden gewist.
core-export-not-a-length = ‘{ $length }’ is geen lengte
# Shown after "not found: ".
core-export-the-format = het formaat ‘{ $id }’
