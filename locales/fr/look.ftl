## The look of a document, in one place: the column of the typesetting pane where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Aspect
look-between = Entre les pages et l’aspect du document
look-whole = Ce qui fait l’aspect

look-scope = Ces modifications valent pour
# The whole document, by the name of its element.
look-scope-document = Tout le document : { $name }
# Only one element under the document, by its name.
look-scope-only = Seulement « { $name } »
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Mise en page : { $layout }

# After the name of the layout at the top of the panel: "Manuscript · 2 changes".
look-changes = { $count ->
    [one] { $count } modification
    [many] { $count } modifications
   *[other] { $count } modifications
  }
# Under a setting the document sets otherwise than its layout.
look-changed-here = Modifié ici
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Modifié dans « { $name } »
look-take-again = revenir à « { $layout } »

look-search = Trouver un réglage : police, marges, numéros de page…
look-search-nothing = Aucun réglage ne contient ces mots.
look-sections = Rubriques de l’aspect

look-section-page = Page
look-section-type = Caractères
look-section-paragraphs = Paragraphes
look-section-headings = Titres
look-section-notes = Notes et citations
look-section-figures = Figures et tableaux
look-section-front = Première page

look-kinds-in-use = Dans ce document
look-heading-levels = Niveaux de titres
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Taille des caractères
look-first-page-size = Taille de la page
look-first-headings-numbered = Les titres sont numérotés
look-at-citations = Citations
look-at-bibliography = Bibliographie

look-keep = Garder ces modifications comme une mise en page à moi…
look-keep-save = Garder
# Where the layout is one of the writer's own.
look-put-into = Enregistrer ces modifications dans « { $name } »
look-delete-layout = Supprimer cette mise en page à moi…

## The parts of the document type, a section of Look: the parts the program
## makes itself and the kinds of elements given a place of their own, in one
## list in the order they are printed, and what is required. What is changed
## there is kept as the document's own changes over what it is.

look-contents-kinds-missing = Aucun pour l’instant
look-contents-kinds-make = En créer un
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Seul le premier est utilisé
look-contents-limit-words = Mots du texte, au plus
look-contents-limit-abstract-words = Mots du résumé, au plus
look-contents-limit-keywords = Mots-clés, au plus
# What the limits count, as what the document is says it.
look-contents-requirements-note = Ce que comptent les limites : { $note }

# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
look-usual = Votre choix habituel ({ $name })
# The first choice of a layout or a style: what the template brings, named.
look-as-template = Comme le veut le modèle ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
look-from-with = De « { $name } » ({ $what })
look-style = Style de référence
look-style-change = Modifier ce style de référence…

# The switch of the title page, first in the part of the front page.
look-front-title-page = Une page de titre

# The groups of the fonts to choose from.
look-fonts-document = Dans ce document
look-fonts-project = Ailleurs dans ce projet
look-fonts-all = Toutes les polices

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# Opens Document properties at what the document is.
look-document-type = Type de document…
look-hide = Masquer l’aspect

## Fewer words, stage 3: the parts and the headings of Look in plain words.

look-section-line-numbers = Numéros de ligne
look-section-type-parts = Parties du type de document
look-section-the-layout = Mise en page
look-choose-layout = Choisir une mise en page
look-layout-modifications = Modifications de la mise en page
look-at-quotations-warning = Citations
look-at-paragraph-kinds = Types de paragraphes
look-at-words-kinds = Types de mots
look-type-requirements = Exigences du type de document

## Stage 4 of the settings, the zoom and the keys of the kinds: the key of a kind, Ctrl+Alt and a digit, as the document type gives it.
look-kind-key = Touche
look-kind-key-none = Aucune
# A digit another kind has: choosing it here leaves that kind without.
look-kind-key-taken = { $keys }, actuellement { $kind }
