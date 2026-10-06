# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Image

## When text cannot be read.

ocr-stopped = La lecture a été arrêtée.
ocr-no-language = Tesseract n’a pas de données pour la langue « { $language } ».
ocr-no-languages = Tesseract n’a de données pour aucune langue. Installez celles d’une langue, par exemple tesseract-data-eng sur Arch.
ocr-not-pdf = « { $file } » n’est pas un PDF.
ocr-no-pages = « { $file } » n’a pas de pages.
ocr-locked = « { $file } » est verrouillé par un mot de passe, et ses pages ne peuvent pas être dessinées.
ocr-unreadable = « { $file } » n’a pas pu être lu comme PDF. Il est peut-être abîmé.
ocr-page-not-drawn = La page { $page } n’a pas pu être dessinée.
ocr-picture-unreadable = L’image n’a pas pu être lue : { $message }
ocr-drawing = Un dessin (SVG) ne contient pas d’image où lire du texte.

## Making a PDF searchable.

ocr-searchable-locked = Le PDF est verrouillé et ne peut pas être rendu interrogeable. Son texte peut tout de même être importé dans un projet comme carte.
ocr-searchable-unreadable = Le PDF n’a pas pu être rendu interrogeable : { $message }
ocr-not-whole = ce qui a été produit n’a pas pu être relu en entier, et n’a pas été gardé.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
    [one] Une page a été lue d’après son image.
    [many] { $count } pages ont été lues d’après leurs images.
   *[other] { $count } pages ont été lues d’après leurs images.
}
ocr-remark-text = { $count ->
    [one] Une page avait du texte, qui est pris tel que le fichier l’a.
    [many] { $count } pages avaient du texte, qui est pris tel que le fichier l’a.
   *[other] { $count } pages avaient du texte, qui est pris tel que le fichier l’a.
}
ocr-remark-no-tesseract = { $count ->
    [one] Une page n’a pas de texte et reste vide : Tesseract, qui lit le texte des images, n’est pas installé.
    [many] { $count } pages n’ont pas de texte et restent vides : Tesseract, qui lit le texte des images, n’est pas installé.
   *[other] { $count } pages n’ont pas de texte et restent vides : Tesseract, qui lit le texte des images, n’est pas installé.
}
ocr-remark-not-read = Les pages qui n’ont pas de texte n’ont pas pu être lues : { $message }
ocr-remark-failed = La page { $page } n’a pas pu être lue : { $message }
ocr-remark-more-failed = { $count ->
    [one] Une page de plus n’a pas pu être lue.
    [many] { $count } pages de plus n’ont pas pu être lues.
   *[other] { $count } pages de plus n’ont pas pu être lues.
}
ocr-remark-empty = Aucun texte n’a été trouvé.
