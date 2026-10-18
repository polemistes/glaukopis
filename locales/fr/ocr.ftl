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

## A PDF of the library read into a project, as a tree of elements

ocr-map-button = Importer son texte comme carte…
ocr-map-title = Importer le texte comme carte
ocr-map-into = Dans le projet
ocr-map-new-project = Un nouveau projet, à son nom
ocr-map-make = Importer
ocr-map-making = Importation…
ocr-map-failed = Les éléments n’ont pas pu être créés.

## The text of a picture of the store

ocr-picture-read = Lire le texte qu’elle contient…
ocr-picture-title = Le texte de l’image
ocr-picture-empty = Aucun texte n’a été trouvé dans l’image.
ocr-picture-copy = Copier
ocr-picture-copied = Le texte est copié
ocr-picture-map = En faire un élément

## Tesseract in the settings

ocr-settings-looking = Recherche…
ocr-settings-missing = Introuvable. Nécessaire pour lire le texte des numérisations et des images. Installez tesseract avec le gestionnaire de paquets de votre système, avec les données des langues que vous lisez (sur Arch, tesseract-data-fra pour le français, tesseract-data-eng pour l’anglais, tesseract-data-grc pour le grec ancien, …), ou indiquez ci-dessous où il se trouve.
ocr-settings-by-itself = Trouvé de lui-même
ocr-settings-where = Où est Tesseract
ocr-settings-look-failed = Tesseract n’a pas pu être cherché
ocr-settings-title = Reconnaissance optique de caractères (OCR)
ocr-settings-has-none = Il n’a les données d’aucune langue : importez-en une ci-dessous, ou installez-en une avec le gestionnaire de paquets de votre système, par exemple tesseract-data-fra.
ocr-settings-first = Langue(s) de l’OCR par défaut
ocr-settings-how = Réglages de l’OCR par défaut
ocr-settings-languages = Langues de l’OCR
ocr-settings-languages-hint = Glaukopis utilise Tesseract pour l’OCR. Les fichiers de langue que vous importez ici sont utilisés à la place de ceux que vous avez peut-être installés sur votre système.
ocr-source-system = Système
ocr-source-imported = Importé
ocr-settings-not-found = Tesseract n’a pas été trouvé. Indiquez où il se trouve sous Programmes, ci-dessous.

## What becomes of the text a PDF has (the same in every dialog that reads one).

ocr-text-title = Le texte que contient le PDF
# Said where some pages have text that does not read as text.
ocr-text-poor = { $poor ->
    [one] Sur une des { $pages } pages qui ont du texte, ce texte n’est pas lisible, comme quand une police ne dit pas quelles lettres elle montre, ou qu’une lecture a été mauvaise.
    [many] Sur { $poor } des { $pages } pages qui ont du texte, ce texte n’est pas lisible, comme quand une police ne dit pas quelles lettres elle montre, ou qu’une lecture a été mauvaise.
   *[other] Sur { $poor } des { $pages } pages qui ont du texte, ce texte n’est pas lisible, comme quand une police ne dit pas quelles lettres elle montre, ou qu’une lecture a été mauvaise.
}
# Said where every page that has text has text that does not read as text.
ocr-text-poor-all = { $pages ->
    [one] Le texte que contient le PDF n’est pas lisible, comme quand une police ne dit pas quelles lettres elle montre, ou qu’une lecture a été mauvaise.
    [many] Sur toutes les { $pages } pages qui ont du texte, ce texte n’est pas lisible, comme quand une police ne dit pas quelles lettres elle montre, ou qu’une lecture a été mauvaise.
   *[other] Sur toutes les { $pages } pages qui ont du texte, ce texte n’est pas lisible, comme quand une police ne dit pas quelles lettres elle montre, ou qu’une lecture a été mauvaise.
}
ocr-text-keep = Garder le texte que contient le PDF
ocr-text-keep-hint = Seules les pages sans texte sont lues ; les autres sont prises telles quelles.
ocr-text-keep-searchable-hint = Seules les pages sans texte sont lues ; les autres gardent le texte qu’elles ont.
ocr-text-anew = Lire de nouveau chaque page avec Tesseract
ocr-text-anew-hint = Seul ce que Tesseract lit dans les images des pages est gardé ; le texte que contient le PDF n’est pris d’aucune page.
ocr-text-anew-searchable-hint = Le texte invisible des pages est retiré, et ce qui est lu est posé à sa place. Les pages gardent leur apparence.
ocr-about-anew = { $pages ->
    [one] La page est lue de nouveau, d’après son image.
    [many] Toutes les { $pages } pages sont lues de nouveau, d’après leurs images.
   *[other] Toutes les { $pages } pages sont lues de nouveau, d’après leurs images.
}
ocr-searchable-anew = { $pages ->
    [one] La page est lue de nouveau, et son texte est posé, invisible, sous ce qui s’affiche, à la place de celui qu’elle avait. Le PDF garde son apparence.
    [many] Toutes les { $pages } pages sont lues de nouveau, et leur texte est posé, invisible, sous ce qui s’affiche, à la place de celui qu’elles avaient. Le PDF garde son apparence.
   *[other] Toutes les { $pages } pages sont lues de nouveau, et leur texte est posé, invisible, sous ce qui s’affiche, à la place de celui qu’elles avaient. Le PDF garde son apparence.
}

## What is found of the text a PDF has, and what can be done with it (ADR 0044).

ocr-text-found = Du texte sur { $withText } des { $pages } pages, en { $fonts }.
ocr-text-found-no-fonts = Du texte sur { $withText } des { $pages } pages.
# The first fonts, and how many more there are.
ocr-text-fonts-more = { $fonts } et { $count ->
    [one] une autre
    [many] { $count } autres
   *[other] { $count } autres
}
ocr-text-scheme-greek-names = Le grec est noté par les noms des glyphes de { $fonts }, et peut être converti en lettres grecques.
ocr-text-scheme-expert-names = Les petites capitales et les chiffres elzéviriens de { $fonts } sont notés par leur nom, et peuvent être convertis en leurs lettres et leurs chiffres.
ocr-text-scheme-beta-code = Le grec est écrit en Beta Code, et peut être converti en lettres grecques.
ocr-text-translate = Le convertir en texte lisible
ocr-text-translate-hint = Le texte est rendu lisible d’après ce que les polices disent de leurs lettres ; aucune page n’est lue d’après une image pour cela.
ocr-text-translate-searchable-hint = Les tables propres au PDF sont corrigées, pour que tout lecteur de PDF copie le texte et y cherche correctement ; rien de ce qui est dessiné ne change.
ocr-text-anew-no-tesseract = Tesseract, qui lit le texte des images, n’est pas installé.
ocr-text-page = Page { $label }
ocr-text-page-none = Pas de texte sur cette page : elle est lue d’après son image.
ocr-about-translate = { $without ->
    [0] Le texte que contient le PDF est rendu lisible ; aucune page n’est lue d’après une image.
    [one] Le texte que contient le PDF est rendu lisible, et la seule page sans texte est lue d’après son image.
    [many] Le texte que contient le PDF est rendu lisible, et les { $without } pages sans texte sont lues d’après leurs images.
   *[other] Le texte que contient le PDF est rendu lisible, et les { $without } pages sans texte sont lues d’après leurs images.
}
ocr-searchable-translate = { $without ->
    [0] Les polices du PDF reçoivent leurs lettres, pour que son texte puisse être copié et cherché correctement. Le PDF garde son apparence.
    [one] Les polices du PDF reçoivent leurs lettres, et la seule page sans texte est lue et reçoit du texte. Le PDF garde son apparence.
    [many] Les polices du PDF reçoivent leurs lettres, et les { $without } pages sans texte sont lues et reçoivent du texte. Le PDF garde son apparence.
   *[other] Les polices du PDF reçoivent leurs lettres, et les { $without } pages sans texte sont lues et reçoivent du texte. Le PDF garde son apparence.
}
ocr-searchable-make-readable = Rendre lisible
ocr-searchable-readable-done = { $count ->
    [one] Le texte du PDF est désormais lisible : une police a reçu ses lettres
    [many] Le texte du PDF est désormais lisible : { $count } polices ont reçu leurs lettres
   *[other] Le texte du PDF est désormais lisible : { $count } polices ont reçu leurs lettres
}

## The shape of the pages, and scripts whose letters look alike (ADR 0045).

ocr-shape = Garder la forme des pages
ocr-shape-hint = Les titres, les lignes gardées telles quelles, les numéros en marge, et les titres courants laissés de côté. Sinon, les pages deviennent de simples paragraphes.
# How a PDF read with its shape kept becomes a map: the document's own tree, or an element for each page.
ocr-structure = Éléments
ocr-structure-headings = D’après ses titres
ocr-structure-pages = D’après ses pages
ocr-page-marks = Marquer où commence chaque page
ocr-page-marks-hint = Une marque de référence portant le numéro de la page, là où elle commençait.
# The outline shown before a PDF read by its headings is made into a map.
ocr-outline-title = Ce qui sera créé
ocr-outline-all = Afficher les { $count }

# The styles of text that recur beside the body, shown after the reading, for the writer to say what each is.
ocr-styles-title = Styles trouvés
ocr-styles-about = { $count ->
    [one] Un style de texte revient en plus du texte courant. Dites ce que c’est, ou laissez-le comme texte.
    [many] { $count } styles de texte reviennent en plus du texte courant. Dites ce qu’est chacun, ou laissez-les comme texte.
   *[other] { $count } styles de texte reviennent en plus du texte courant. Dites ce qu’est chacun, ou laissez-les comme texte.
}
# How often a style found occurs: "12 times on 9 pages".
ocr-styles-often = { $count ->
    [one] Une fois
    [many] { $count } fois
   *[other] { $count } fois
} sur { $pages ->
    [one] une page
    [many] { $pages } pages
   *[other] { $pages } pages
}
ocr-styles-kind = Ce que c’est
ocr-styles-own = Un type à vous…
ocr-styles-own-name = Nom du type
ocr-styles-own-hint = Créé quand le document est importé, sans aspect propre tant que vous ne lui en donnez pas.
# The first guess of the name of a kind of your own: the look of the style in words, put together as "{ $look } text", "Smaller italic text", "Indented text", or for lines kept as lines, "{ $look } lines kept", "Lines kept". $kept is yes for lines kept, where a language bends the words of the look by it.
ocr-style-guess = { $kept ->
    [yes] Lignes gardées { $look }
   *[other] Texte { $look }
}
ocr-style-indented = { $kept ->
   *[other] en retrait
}
ocr-style-smaller = { $kept ->
    [yes] plus petites
   *[other] plus petit
}
ocr-style-larger = { $kept ->
    [yes] plus grandes
   *[other] plus grand
}
ocr-style-bold = { $kept ->
    [yes] grasses
   *[other] gras
}
ocr-style-italic = { $kept ->
    [yes] italiques
   *[other] italique
}
# A style that differs from the body only by its font.
ocr-style-family = Texte en { $family }
ocr-style-other = Autre texte
# A script among the languages chosen, as it stands in the warning below: "the Greek script is read together with the Latin".
ocr-script = { $script ->
    [Greek] grecque
    [Cyrillic] cyrillique
   *[Latin] latine
}
# $alike: the letters that look alike, in pairs, the first script's first: "ϲ c, ο o, ν v".
ocr-languages-scripts-alike = L’écriture { $a } est lue avec l’écriture { $b } : des lettres qui se ressemblent dans les deux ({ $alike }) sont souvent lues l’une pour l’autre, et des mots entiers en sortent faux. Pour une seule écriture, retirez les autres.
