## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Aspect
look-between = Entre le texte et l’aspect du document
look-whole = Ce qui fait l’aspect

# Under the button at the top of Look that names what the document is.
look-what-hint = Ce que vous écrivez décide des parties, des pages et des citations ; chacune se change plus bas.
look-scope = Ces modifications valent pour
# The whole document, by the name of its element.
look-scope-document = Tout le document : { $name }
# Only one element under the document, by its name.
look-scope-only = Seulement « { $name } »
look-scope-hint = Les modifications faites ici valent pour « { $name } », où qu’il soit imprimé. Les réglages de page le font commencer sur une nouvelle page.
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Mise en page : { $layout }
look-layout-hint = L’aspect des pages : page, caractères, espacement, titres, aspects des types
look-citations-hint = Comment s’écrivent les citations et la bibliographie

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

look-open-preview = Ouvrez l’aperçu pour voir les modifications à mesure que vous les faites.
look-open-preview-button = Ouvrir l’aperçu
look-search = Trouver un réglage : police, marges, numéros de page…
look-search-nothing = Aucun réglage ne contient ces mots.
look-sections = Rubriques de l’aspect

look-section-page = Page
look-section-type = Caractères
look-section-paragraphs = Paragraphes
look-section-headings = Titres
look-section-numbers = Numérotation
look-section-notes = Notes et citations
look-section-figures = Figures et tableaux
look-section-front = Première page
look-section-contents = Ce que contient le document
look-section-layout = La mise en page

look-kinds-in-use = Dans ce document
look-heading-levels = Niveaux de titres
look-quotations-hint = Les citations que leur longueur détache du texte, là où elles ne sont pas elles-mêmes marquées comme citations. Le type Citation se règle plus bas, sous les types de paragraphes et de mots.
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Taille des caractères
look-first-page-size = Taille de la page
look-first-headings-numbered = Les titres sont numérotés
# Headings within the parts of Look.
look-at-quotations = Citations longues
look-at-kinds = Types de paragraphes et de mots
look-at-citations = Citations
look-at-bibliography = Bibliographie
look-layout-changes = Ce que ce document modifie

look-keep = Garder ces modifications comme une mise en page à moi…
look-keep-save = Garder
# Where the layout is one of the writer's own.
look-put-into = Enregistrer ces modifications dans « { $name } »
look-delete-layout = Supprimer cette mise en page à moi…
look-bundled = Les mises en page fournies avec Glaukopis restent telles quelles. Ce que vous changez ici est gardé avec le document ou, si vous le choisissez, comme une mise en page à vous.

## What the document contains, a section of Look: the parts the program
## makes itself, the kinds of elements given a place of their own, and what
## is required. What is changed there is kept as the document's own changes
## over what it is. The name in quotes is what the document is: "Journal
## article", "Novel".

look-contents-parts = Les parties du document
look-contents-parts-hint = Telles que « { $template } » les prévoit. Une partie activée ou désactivée ici l’est pour ce document et ceux du dessous, et nulle part ailleurs.
# Under the parts that are always made: when each is printed.
look-contents-part-body = Toujours dans le document
look-contents-part-notes = Là où le texte a des notes
look-contents-part-bibliography = Là où le texte cite une œuvre
look-contents-part-keywords = Imprimés là où le document a des mots-clés
look-contents-kinds = Éléments qui ont leur place
look-contents-kinds-hint = Les types d’éléments auxquels « { $template } » donne une place, et les éléments sous celui-ci qui occupent chacune. Chacun est un élément comme un autre : son texte s’écrit dans l’arbre.
look-contents-kinds-none = « { $template } » ne donne de place propre à aucun type d’élément.
look-contents-kinds-missing = Aucun pour l’instant
look-contents-kinds-make = En créer un
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Seul le premier est utilisé
look-contents-requirements = Ce qui est exigé
look-contents-requirements-hint = Comme le demande « { $template } », sauf si c’est changé ici. La liste de contrôle et l’aperçu comptent par rapport à ces limites ; rien n’est coupé.
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
look-layout = Mise en page
look-style = Style de référence
look-style-change = Modifier ce style de référence…

# The switch of the title page, first in the part of the front page.
look-front-title-page = Une page de titre
look-front-title-page-hint = Si le document en a une ou non ; le même interrupteur que sous Ce que contient le document

# The groups of the fonts to choose from.
look-fonts-document = Dans ce document
look-fonts-project = Ailleurs dans ce projet
look-fonts-all = Toutes les polices
