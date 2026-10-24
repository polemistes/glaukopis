## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Aspect
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

## What the document contains, a section of Look: the parts the program
## makes itself, the kinds of elements given a place of their own, and what
## is required. What is changed there is kept as the document's own changes
## over what it is. The name in quotes is what the document is: "Journal
## article", "Novel".

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
