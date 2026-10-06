# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF et images
ocr-no-tesseract = Tesseract, qui lit le texte des images, n’est pas installé ou n’a pas pu être trouvé. Installez-le avec le gestionnaire de paquets de votre système, avec les données des langues que vous lisez (sur Arch : tesseract et tesseract-data-fra, tesseract-data-eng, etc.), ou indiquez dans les réglages où il se trouve.
ocr-failed = Le texte n’a pas pu être lu.
ocr-looking = Examen de { $file }…
ocr-about-picture = Le texte est lu d’après l’image.
ocr-about-scan = { $pages ->
    [one] Le PDF n’a pas de texte : il est lu d’après l’image de sa page.
    [many] Aucune des { $pages } pages n’a de texte : elles sont lues d’après leurs images.
   *[other] Aucune des { $pages } pages n’a de texte : elles sont lues d’après leurs images.
}
ocr-about-some = { $without ->
    [one] Une des { $pages } pages n’a pas de texte, et est lue d’après son image ; les autres sont prises telles quelles.
    [many] { $without } des { $pages } pages n’ont pas de texte, et sont lues d’après leurs images ; les autres sont prises telles quelles.
   *[other] { $without } des { $pages } pages n’ont pas de texte, et sont lues d’après leurs images ; les autres sont prises telles quelles.
}
ocr-about-text = { $pages ->
    [one] La page a du texte, qui est pris tel quel.
    [many] Chaque page a du texte, qui est pris tel quel.
   *[other] Chaque page a du texte, qui est pris tel quel.
}
ocr-read-all = Lire aussi les pages qui ont du texte
ocr-read-all-hint = Leur texte reste, et ce qui est lu est posé par-dessus.
ocr-read-all-map-hint = Ce qui est lu prend la place de leur texte : pour quand il est mauvais, ou illisible.
ocr-read = Lire le texte
ocr-read-text-pages = Prendre les pages qui ont du texte
ocr-take-text = Prendre le texte
ocr-reading = Lecture de { $file }…
ocr-reading-pages = { $done } pages lues sur { $total }
ocr-reading-hint = Une page prend quelques secondes. Annuler arrête la lecture.

## How the text is read: what to try when a reading goes badly

ocr-how = Comment le texte est lu
ocr-how-dpi = Résolution, en points par pouce
ocr-how-layout = Mise en page
ocr-how-layout-auto = Au jugé de Tesseract
ocr-how-layout-column = Une colonne
ocr-how-layout-block = Un bloc de texte
ocr-how-layout-sparse = Texte épars
ocr-how-contrast = Noir et blanc
ocr-how-hint = Ce qu’il faut essayer quand une lecture se passe mal : une résolution plus haute pour les petits caractères, une colonne quand les colonnes se mêlent, un bloc de texte pour un seul paragraphe, et le noir et blanc pour une impression pâle ou inégale.

## The languages of the text

ocr-languages = Langues du texte
ocr-languages-hint = La plus probable d’abord. Chaque langue de plus ralentit la lecture, sans toujours l’améliorer.
ocr-language-add = Ajouter une langue…
ocr-language-remove = Retirer { $language }
# A script rather than a language: "Latin script".
ocr-language-script = Écriture { $script }
ocr-language-fraktur = { $language }, Fraktur
ocr-language-old = { $language }, ancien
ocr-language-vertical = { $language }, écrit verticalement

## A PDF of the library made searchable

ocr-searchable-button = Rendre interrogeable…
ocr-searchable-title = Rendre le PDF interrogeable
ocr-searchable-about = { $without ->
    [one] Une des { $pages } pages n’a pas de texte. Elle est lue, et son texte est posé, invisible, sous ce qui s’affiche, pour qu’on puisse y chercher et le copier. Le PDF garde son apparence.
    [many] { $without } des { $pages } pages n’ont pas de texte. Elles sont lues, et leur texte est posé, invisible, sous ce qui s’affiche, pour qu’on puisse y chercher et le copier. Le PDF garde son apparence.
   *[other] { $without } des { $pages } pages n’ont pas de texte. Elles sont lues, et leur texte est posé, invisible, sous ce qui s’affiche, pour qu’on puisse y chercher et le copier. Le PDF garde son apparence.
}
ocr-searchable-has-text = { $pages ->
    [one] La page a du texte : on peut déjà chercher dans le PDF.
    [many] Chaque page a du texte : on peut déjà chercher dans le PDF.
   *[other] Chaque page a du texte : on peut déjà chercher dans le PDF.
}
ocr-searchable-damaged = Le PDF n’a pas pu être décomposé pour être modifié : il est peut-être abîmé. Son texte peut tout de même être importé dans un projet comme carte.
ocr-searchable-make = Rendre interrogeable
ocr-strip = Retirer le texte invisible qu’elles ont, et ne garder que ce qui est lu
ocr-strip-hint = Pour une couche de texte mauvaise, telle qu’un scanner la pose sous la page. Les lettres visibles restent, et la page garde son apparence.
ocr-searchable-done = { $count ->
    [one] Le PDF est interrogeable : une page a été lue
    [many] Le PDF est interrogeable : { $count } pages ont été lues
   *[other] Le PDF est interrogeable : { $count } pages ont été lues
}
ocr-searchable-failed = { $count ->
    [one] Une page n’a pas pu être lue.
    [many] { $count } pages n’ont pas pu être lues.
   *[other] { $count } pages n’ont pas pu être lues.
}

## A map from a PDF of the library

ocr-map-button = Une carte de son texte…
ocr-map-title = Une carte du texte
ocr-map-into = Dans le projet
ocr-map-new-project = Un nouveau projet, à son nom
ocr-map-making = Création de la carte…
ocr-map-failed = La carte n’a pas pu être créée.

## The text of a picture of the store

ocr-picture-read = Lire le texte qu’elle contient…
ocr-picture-title = Le texte de l’image
ocr-picture-empty = Aucun texte n’a été trouvé dans l’image.
ocr-picture-copy = Copier
ocr-picture-copied = Le texte est copié
ocr-picture-map = En faire une carte

## Tesseract in the settings

ocr-settings-looking = Recherche…
ocr-settings-missing = Introuvable. Nécessaire pour lire le texte des numérisations et des images. Installez tesseract avec le gestionnaire de paquets de votre système, avec les données des langues que vous lisez (sur Arch, tesseract-data-fra pour le français, tesseract-data-eng pour l’anglais, tesseract-data-grc pour le grec ancien, …), ou indiquez ci-dessous où il se trouve.
ocr-settings-by-itself = Trouvé de lui-même
ocr-settings-where = Où est Tesseract
ocr-settings-look-failed = Tesseract n’a pas pu être cherché
ocr-settings-has = Il lit { $languages }.
ocr-settings-has-none = Il n’a les données d’aucune langue : installez celles d’une langue, par exemple tesseract-data-fra.
ocr-settings-first = Lire d’abord en
ocr-settings-first-hint = Quand aucune n’est choisie, la langue du texte et celle de l’interface.
ocr-settings-how = Comment le texte est lu d’abord
