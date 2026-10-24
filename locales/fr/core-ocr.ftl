# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-no-headings = Aucun titre n’a été trouvé : les pages sont les éléments.
ocr-kind-picture = Image

## When text cannot be read.

ocr-stopped = La lecture a été arrêtée.
ocr-no-language = Tesseract n’a pas de données pour la langue « { $language } ».
ocr-no-languages = Tesseract n’a de données pour aucune langue. Importez-en une sous Réglages › Programmes, ou installez-en une avec le gestionnaire de paquets de votre système, par exemple tesseract-data-eng sur Arch.
ocr-not-pdf = « { $file } » n’est pas un PDF.
ocr-no-pages = « { $file } » n’a pas de pages.
ocr-locked = « { $file } » est verrouillé par un mot de passe, et ses pages ne peuvent pas être dessinées.
ocr-unreadable = « { $file } » n’a pas pu être lu comme PDF. Il est peut-être abîmé.
ocr-page-not-drawn = La page { $page } n’a pas pu être dessinée.
ocr-no-such-page = Le PDF n’a pas de page { $page } : il en a { $pages }.
ocr-reading-gone = La lecture n’est plus gardée : lisez le fichier de nouveau.
ocr-picture-unreadable = L’image n’a pas pu être lue : { $message }
ocr-not-made = Tesseract n’a pas produit { $path }.
ocr-not-made-said = Tesseract n’a pas produit { $path }. Il a dit : { $message }
ocr-drawing = Un dessin (SVG) ne contient pas d’image où lire du texte.
ocr-child-time = La lecture de « { $file } » a pris plus de temps qu’elle n’en a le droit, et a été arrêtée. Le fichier est peut-être abîmé, ou fait d’une manière qui ne peut pas être lue.
ocr-child-memory = La lecture de « { $file } » a pris plus de mémoire qu’elle n’en a le droit, et a été arrêtée. Le fichier est peut-être abîmé, ou fait d’une manière qui ne peut pas être lue.
ocr-child-failed = « { $file } » n’a pas pu être lu : { $message }
ocr-child-not-started = « { $file } » n’a pas pu être lu, faute d’avoir pu lancer le processus qui devait le lire : { $message }

## Making a PDF searchable.

ocr-searchable-locked = Le PDF est verrouillé et ne peut pas être rendu interrogeable. Son texte peut tout de même être importé dans un projet comme carte.
ocr-searchable-unreadable = Le PDF n’a pas pu être rendu interrogeable : { $message }
ocr-not-whole = ce qui a été produit n’a pas pu être relu en entier, et n’a pas été gardé.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-failed = La page { $page } n’a pas pu être lue : { $message }
ocr-remark-more-failed = { $count ->
    [one] Une page de plus n’a pas pu être lue.
    [many] { $count } pages de plus n’ont pas pu être lues.
   *[other] { $count } pages de plus n’ont pas pu être lues.
}
ocr-remark-empty = Aucun texte n’a été trouvé.
ocr-remark-poorly = { $count ->
    [one] Une page a été mal lue : { $pages }. Une autre langue, le modèle Fraktur pour les caractères gothiques, ou une autre mise en page peuvent mieux la lire ; essayez-la avant de la lire de nouveau.
    [many] { $count } pages ont été mal lues : { $pages }. Une autre langue, le modèle Fraktur pour les caractères gothiques, ou une autre mise en page peuvent mieux les lire ; essayez une page avant de les lire toutes de nouveau.
   *[other] { $count } pages ont été mal lues : { $pages }. Une autre langue, le modèle Fraktur pour les caractères gothiques, ou une autre mise en page peuvent mieux les lire ; essayez une page avant de les lire toutes de nouveau.
}

## What a reading of a PDF came to (ADR 0044).

ocr-remark-counts = { $read ->
    [0] Aucune page lue par Tesseract
    [one] Une page lue par Tesseract
    [many] { $read } pages lues par Tesseract
   *[other] { $read } pages lues par Tesseract
}, { $taken ->
    [0] aucune prise dans le texte du PDF lui-même
    [one] une prise dans le texte du PDF lui-même
    [many] { $taken } prises dans le texte du PDF lui-même
   *[other] { $taken } prises dans le texte du PDF lui-même
}, { $failed ->
    [0] aucune qui n’ait pas pu être lue.
    [one] une qui n’a pas pu être lue.
    [many] { $failed } qui n’ont pas pu être lues.
   *[other] { $failed } qui n’ont pas pu être lues.
}
# Stands in the element in the place of a page that could not be read.
ocr-page-failed-line = [Cette page n’a pas pu être lue : { $message }]
ocr-why-no-tesseract = Tesseract, qui lit le texte des images, n’est pas installé.
