# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = L’image « { $name } » n’est pas sur cet ordinateur ; le document se fait sans elle.
core-export-astray = { $count ->
    [one] Un renvoi du texte vise quelque chose qui n’est pas dans le document. Il apparaît sous la forme [?].
    [many] { $count } renvois du texte visent ce qui n’est pas dans le document. Ils apparaissent sous la forme [?].
   *[other] { $count } renvois du texte visent ce qui n’est pas dans le document. Ils apparaissent sous la forme [?].
}
core-export-latex-font = { $font } n’est pas installée. Le document est composé en Latin Modern, la police que LaTeX a en propre.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] { $count } texte du document n’a pas été envoyé, et n’est pas conservé.
    [many] { $count } textes du document n’ont pas été envoyés, et ne sont pas conservés.
   *[other] { $count } textes du document n’ont pas été envoyés, et ne sont pas conservés.
}
# Shown after "not found: ".
core-export-preview-document = le document de l’aperçu
core-export-reading-pdf = lecture du PDF qui a été produit
core-export-reading-made = lecture du document qui a été produit

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = le document modèle n’a pas pu être lu : { $error }
core-export-pattern-lacks = le document modèle n’a pas de { $name }
core-export-pattern-reading = lecture du document modèle
core-export-pattern-writing = écriture du document modèle

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = La formule s’arrête avant d’être complète.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } n’est pas connu.
core-export-formula-unexpected = { $what } n’était pas attendu à cet endroit.
core-export-formula-unreadable = La formule n’a pas pu être lue.
core-export-formula-too-long = La formule est trop longue.

## Reference styles.

core-export-style-bad-id = « { $id } » ne peut pas être l’identifiant d’un style
core-export-not-a-style = Ceci n’est pas un style : { $error }.
core-export-not-a-style-begin = Ceci n’est pas un style : il ne commence pas par <style>.
core-export-dependent-style = Ce style ne fait que nommer un autre style, dont il prend la forme. Allez plutôt chercher celui-là par son nom.
core-export-style-unreadable = Le style n’a pas pu être relu.
core-export-style-needs-name = Un style doit avoir un nom.
core-export-style-own-only = Seuls vos propres styles peuvent être supprimés.
# Shown after "not found: ".
core-export-the-reference-style = le style de référence « { $id } »
core-export-any-reference-style = le moindre style de référence
core-export-the-style = le style « { $id } »

## Document formats.

core-export-format-bad-id = « { $id } » ne peut pas être l’identifiant d’un format
core-export-format-needs-name = Un format doit avoir un nom.
core-export-format-own-only = Seuls vos propres formats peuvent être supprimés.
core-export-not-a-length = « { $length } » n’est pas une longueur
# Shown after "not found: ".
core-export-the-format = le format « { $id } »
