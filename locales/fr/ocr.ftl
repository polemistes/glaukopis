# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF et images
ocr-no-tesseract = Tesseract, qui lit le texte des images, n’est pas installé ou n’a pas pu être trouvé. Installez-le avec le gestionnaire de paquets de votre système, avec les données des langues que vous lisez (sur Arch : tesseract et tesseract-data-fra, tesseract-data-eng, etc.), ou indiquez dans les réglages où il se trouve.
ocr-failed = Le texte n’a pas pu être lu.
ocr-looking = Examen de { $file }…
ocr-about-picture = Le texte est lu d’après l’image.
# Where the pages of a PDF are pictures of too few dots to the inch to be read well.
ocr-low-resolution = Les pages sont des images à { $dpi } points par pouce : trop peu pour que leurs lettres soient bien lues, quoi qu’on choisisse.
ocr-low-resolution-text = Les lire de nouveau n’améliorera pas le texte que contient le PDF.

ocr-trying = Lecture de la page { $page }…
ocr-tried-nothing = Aucun texte n’a été lu sur la page { $label }.
ocr-tried-blocks = { $count ->
    [one] Montrer le bloc de texte
    [many] Montrer les { $count } blocs de texte
   *[other] Montrer les { $count } blocs de texte
}
ocr-tried-blocks-hint = Les blocs de texte que Tesseract a trouvés, numérotés dans l’ordre où il les lit. Deux colonnes prises pour une seule, ou des notes prises dans le texte, sont lues dans le mauvais ordre : une autre mise en page peut les séparer.

ocr-read = Lire le texte
ocr-read-pages = { $count ->
    [one] Lire une page
    [many] Lire { $count } pages
   *[other] Lire { $count } pages
}
ocr-read-text-pages = Prendre les pages qui ont du texte
ocr-take-text = Prendre le texte
ocr-reading = Lecture de { $file }…
ocr-reading-pages = { $done } pages lues sur { $total }
ocr-reading-hint = Une page prend quelques secondes. Annuler arrête la lecture.

## How the text is read: what to try when a reading goes badly

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
ocr-searchable-poorly = { $count ->
    [one] Une page a été mal lue : { $pages }.
    [many] { $count } pages ont été mal lues : { $pages }.
   *[other] { $count } pages ont été mal lues : { $pages }.
} Essayez une page avec une autre langue, ou avec le modèle Fraktur pour les caractères gothiques.

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
ocr-picture-copy-failed = Le texte n’a pas pu être copié
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

## What is found of the text a PDF has, and what can be done with it (ADR 0044).

ocr-text-scheme-greek-names = Le grec est noté par les noms des glyphes de { $fonts }, et peut être converti en lettres grecques.
ocr-text-scheme-expert-names = Les petites capitales et les chiffres elzéviriens de { $fonts } sont notés par leur nom, et peuvent être convertis en leurs lettres et leurs chiffres.
ocr-text-scheme-beta-code = Le grec est écrit en Beta Code, et peut être converti en lettres grecques.
ocr-text-page = Page { $label }
ocr-text-page-none = Pas de texte sur cette page : elle est lue d’après son image.
ocr-text-rest-failed = Les pages qui suivent celles-ci n’ont pas pu être lues.
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
ocr-page-marks = Marquer où commence chaque page
ocr-page-marks-hint = Une marque de référence portant le numéro de la page, là où elle commençait.
# What is made of a PDF that was read, asked after the reading: the same reading made anew.
ocr-made-title = Ce qu’on en fait
ocr-made-headings = { $count ->
    [0] Aucun titre trouvé
    [one] D’après son seul titre
    [many] D’après ses { $count } titres
   *[other] D’après ses { $count } titres
}
ocr-made-pages = { $count ->
    [one] D’après sa seule page
    [many] D’après ses { $count } pages
   *[other] D’après ses { $count } pages
}
ocr-made-failed = Les éléments n’ont pas pu être créés de nouveau
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


## The strip of the pages of a PDF, drawn small, to choose a page from.

ocr-strip = Les pages
ocr-strip-page = Page { $number }
# A page that could not be drawn, where nothing more is said of why.
ocr-strip-page-failed = Non dessinée
# $from and $to: the first and the last of the pages, counted from one, that were to be drawn together.
ocr-strip-failed = Les pages { $from }–{ $to } n’ont pas pu être dessinées.

# The panes of the workbench: the picture of the page in view, the text the
# PDF has for it, what Tesseract read of it with the page's trials, and the
# column of the reading settings beside them. The panes' titles and their
# lines on a page without text are ocr-text-page, ocr-text-title and
# ocr-text-page-none above; the blocks drawn on the picture, ocr-tried-blocks.

ocr-settings-heading = Comment Tesseract lit
# The button under the reading settings: the page in view is read with them.
ocr-settings-try = Essayer la page { $page }
# A trial's settings said in a line, where no language was chosen: Tesseract then reads English.
ocr-settings-said-no-language = Anglais, aucune langue n’étant choisie
# A trial's settings said in a line, where the page was made black and white before it was read.
ocr-settings-said-contrast = N/B
# How large the picture of the page is shown: the whole page in the pane, or its own size, or twice that.
ocr-picture-size = Taille de l’image
ocr-picture-fit = Page entière
ocr-picture-actual = 100 %
ocr-picture-double = 200 %
# The alternative text of the picture of the page in view.
ocr-picture-alt = Page { $label }
ocr-pane-translated = Traduit d’après ce que disent les polices
ocr-pane-sound = Se lit comme du texte
ocr-pane-poor = Ne se lit pas comme du texte : des lettres d’une police qui ne dit pas lesquelles elles sont, ou une mauvaise lecture
ocr-pane-tesseract = Ce que Tesseract a lu
ocr-pane-try-hint = Appuyez sur « Essayer la page { $page } » pour lire cette page avec les réglages d’à côté.
# How sure Tesseract was of a page tried, in one line: "Page 40: Low confidence (73%) · 89 of 251 words unsure". Low is under 80, good up to 89, high from 90.
ocr-tried-page = Page { $label } :
ocr-confidence-low = Confiance faible ({ $confidence } %)
ocr-confidence-good = Bonne confiance ({ $confidence } %)
ocr-confidence-high = Confiance élevée ({ $confidence } %)
ocr-tried-unsure = { $unsure ->
    [0] aucun mot incertain
    [one] { $unsure } mot incertain sur { $words }
    [many] { $unsure } mots incertains sur { $words }
   *[other] { $unsure } mots incertains sur { $words }
}
ocr-tried-low-hint = Sous 80 % : essayez une autre langue, le modèle Fraktur pour les caractères gothiques, ou une autre mise en page.
# The tooltip of a word Tesseract was unsure of.
ocr-pane-unsure-word = Lu avec une confiance de { $confidence } %
# Said after the line over the settings, where the pages selected are read in different ways: a change holds for all of them.
ocr-settings-scope-differ = (lues de différentes manières)
# Over the list of the page's trials, each said by the settings it was read with.
ocr-trials = Essayée avec
ocr-trial-confidence = { $confidence } %
ocr-trial-nothing = Rien de lu
ocr-trial-use = Prendre ces réglages

# The pages of the workbench

# The line over the strip of pages says what each page gets: the text the PDF has, or what Tesseract reads.
ocr-pages-said-pdf = { $pages ->
    [one] La page prend le texte que contient le PDF.
    [many] Les { $pages } pages prennent toutes le texte que contient le PDF.
   *[other] Les { $pages } pages prennent toutes le texte que contient le PDF.
}
ocr-pages-said-read = { $pages ->
    [one] La page est lue avec Tesseract.
    [many] Les { $pages } pages sont toutes lues avec Tesseract.
   *[other] Les { $pages } pages sont toutes lues avec Tesseract.
}
ocr-pages-said-both = { $pdf ->
    [one] Une page prend le texte que contient le PDF ;
    [many] { $pdf } pages prennent le texte que contient le PDF ;
   *[other] { $pdf } pages prennent le texte que contient le PDF ;
} { $read ->
    [one] une est lue avec Tesseract.
    [many] { $read } sont lues avec Tesseract.
   *[other] { $read } sont lues avec Tesseract.
}
# Where Tesseract is not installed, and pages are to be read.
ocr-pages-said-unreadable = { $pages ->
    [one] La page ne peut pas être lue : Tesseract n’est pas installé.
    [many] Aucune des { $pages } pages ne peut être lue : Tesseract n’est pas installé.
   *[other] Aucune des { $pages } pages ne peut être lue : Tesseract n’est pas installé.
}
ocr-pages-said-both-unreadable = { $pdf ->
    [one] Une page prend le texte que contient le PDF ;
    [many] { $pdf } pages prennent le texte que contient le PDF ;
   *[other] { $pdf } pages prennent le texte que contient le PDF ;
} { $read ->
    [one] une ne peut pas être lue sans Tesseract.
    [many] { $read } ne peuvent pas être lues sans Tesseract.
   *[other] { $read } ne peuvent pas être lues sans Tesseract.
}
ocr-pages-said-picture = Le texte est lu d’après l’image.
ocr-pages-said-picture-unreadable = Le texte de l’image ne peut pas être lu sans Tesseract.
# What the actions beside it hold for: every page, or those selected ($pages: "pages 39–120", as ocr-pages-selection says them).
ocr-pages-scope-all = { $pages ->
    [one] Pour la page
    [many] Pour les { $pages } pages
   *[other] Pour les { $pages } pages
}
ocr-pages-scope = Pour { $pages }
# Pages selected, as they stand in a sentence: "page 280", "pages 3–5, 9".
ocr-pages-selection = { $count ->
    [one] la page { $pages }
    [many] les pages { $pages }
   *[other] les pages { $pages }
}
ocr-pages-all = Toutes les pages
ocr-pages-pdf = Le texte du PDF
ocr-pages-pdf-hint = Ces pages prennent le texte que contient le PDF. Les pages sans texte sont lues tout de même.
ocr-pages-read = Lire avec Tesseract
ocr-pages-read-hint = Ces pages sont lues de nouveau d’après leurs images, quel que soit le texte qu’elles ont.
ocr-pages-decide = Décider selon la qualité du texte
ocr-pages-decide-hint = Page par page : le texte qui se lit comme du texte est pris ; celui qui ne se lit pas ainsi, et les pages sans texte, sont lus.

# The mark in the corner of a page in the strip, saying what it gets.
ocr-strip-source-pdf = PDF
ocr-strip-source-read = Lue
ocr-strip-source-pdf-hint = Prend le texte que contient le PDF.
ocr-strip-source-read-hint = Est lue avec Tesseract.
ocr-strip-poor = Le texte qu’elle a ne se lit pas comme du texte.
# The band over a stretch of pages read alike: its languages, the resolution where it is not 300, the layout where it is told, and black and white.
ocr-strip-band-none = Anglais, là où aucune langue n’est choisie
ocr-strip-band-dpi = { $dpi } points par pouce
# Black and white, in short.
ocr-strip-band-contrast = N/B
ocr-strip-band-hint = { $count ->
    [one] Page { $from } : { $said }
    [many] Pages { $from }–{ $to } : { $said }
   *[other] Pages { $from }–{ $to } : { $said }
}

# The summary of a reading, as the dialog opens: what the file is, said in parts joined by commas.
ocr-summary-pages = { $pages ->
    [one] Une page
    [many] { $pages } pages
   *[other] { $pages } pages
}
ocr-summary-scanned = numérisation à { $dpi } points par pouce
ocr-summary-no-text = { $pages ->
    [one] sans texte propre
    [many] sans texte propre
   *[other] sans texte propre
}
ocr-summary-text-all = { $pages ->
    [one] avec son propre texte
    [many] toutes avec leur propre texte
   *[other] toutes avec leur propre texte
}
ocr-summary-text-some = { $with ->
    [one] l’une d’elles avec son propre texte
    [many] { $with } d’entre elles avec leur propre texte
   *[other] { $with } d’entre elles avec leur propre texte
}
ocr-summary-poor = { $poor ->
    [one] dont une ne se lit pas comme du texte
    [many] dont { $poor } ne se lisent pas comme du texte
   *[other] dont { $poor } ne se lisent pas comme du texte
}
ocr-summary-poor-all = qui ne se lit pas comme du texte
# Over the choice of what every page takes.
ocr-summary-whole = Ce que prennent les pages
ocr-summary-mixed = Choisi page par page. Un choix fait ici vaut de nouveau pour toutes les pages.
# Under the reading settings, where no page is to be read with Tesseract.
ocr-summary-idle = Ces réglages valent pour les pages lues avec Tesseract ; aucune ne l’est pour l’instant.
ocr-summary-pages-open = Voir les pages et les essayer…
ocr-summary-picture-open = L’essayer…
ocr-summary-back = Retour à la vue d’ensemble

## The settings in plain words, stage 1: the Fraktur models named by the languages they were trained on.

# Tesseract's Fraktur model, among the languages of the text: named for the type it reads, then for the language it was trained on.
ocr-language-fraktur-german = Fraktur (caractères gothiques), allemand
# Glaukopis's own Fraktur model: Tesseract's, taught æ, ø and å on Norwegian books; it reads Danish as well.
ocr-language-fraktur-norwegian = Fraktur (caractères gothiques), norvégien et danois
# Under the languages of the text, where a model of Gothic type is installed and neither Norwegian nor Danish is chosen.
ocr-languages-fraktur-hint = Les livres en caractères gothiques, comme l’étaient souvent les livres norvégiens, danois, suédois et allemands jusque vers 1900, se lisent avec Fraktur (caractères gothiques), allemand, choisi en premier ou seul, quelle que soit leur langue. Ce modèle ne connaît ni æ, ni ø, ni å ; les livres norvégiens et danois se lisent avec Fraktur (caractères gothiques), norvégien et danois, qui les connaît.
# The same, where Norwegian or Danish is chosen.
ocr-languages-fraktur-hint-dan = Les livres norvégiens et danois en caractères gothiques, comme beaucoup l’étaient jusque vers 1900, se lisent avec Fraktur (caractères gothiques), norvégien et danois, choisi en premier ou seul, quelles que soient les langues choisies à côté : il connaît æ, ø et å, que le modèle allemand ne connaît pas.
