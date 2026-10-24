# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = L’image « { $name } » n’est pas sur cet ordinateur ; le document se fait sans elle.
# Pictures that are in the store, and could not be put where the document is made: $error is why the first could not.
core-export-files-not-placed = { $count ->
    [one] Le fichier d’une image n’a pas pu être placé là où le document se fait, et l’image en est laissée de côté : { $error }
    [many] Les fichiers de { $count } images n’ont pas pu être placés là où le document se fait, et les images en sont laissées de côté : { $error }
   *[other] Les fichiers de { $count } images n’ont pas pu être placés là où le document se fait, et les images en sont laissées de côté : { $error }
}
core-export-cover-left-out = L’image de la couverture n’a pas pu être placée là où le livre se fait, et le livre n’a pas de couverture : { $error }
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

core-export-pattern-unreadable = le document patron n’a pas pu être lu : { $error }
core-export-pattern-lacks = le document patron n’a pas de { $name }
core-export-pattern-reading = lecture du document patron
core-export-pattern-writing = écriture du document patron

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

core-export-format-bad-id = « { $id } » ne peut pas être l’identifiant d’une mise en page
core-export-format-needs-name = Une mise en page doit avoir un nom.
core-export-format-own-only = Seules vos propres mises en page peuvent être supprimées.
core-export-not-a-length = « { $length } » n’est pas une longueur
# Shown after "not found: ".
core-export-the-format = la mise en page « { $id } »

## Templates.

core-export-template-bad-id = « { $id } » ne peut pas être l’identifiant d’un modèle
core-export-template-needs-name = Un modèle doit avoir un nom.
core-export-template-own-only = Seuls vos propres modèles peuvent être supprimés.
core-export-the-template = le modèle « { $id } »
core-export-output-not-yet = Le fichier « { $id } » du modèle ne peut pas encore être produit : seul le document peut l’être.
core-export-output-unknown = Le modèle n’a pas de fichier « { $id } ».

## Stage 5 of the settings in plain words: LaTeX's hyphenation.

core-export-latex-no-hyphenation = LaTeX n’a pas de motifs de césure pour { $language } : les mots sont coupés comme des mots anglais tant que le paquet de cette langue n’est pas installé dans TeX Live (sur Arch, texlive-langeuropean pour la plupart des langues européennes).
