## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Aspect
look-open = L’aspect de ce document : modèle, mise en page et citations
look-between = Entre le texte et l’aspect du document
look-whole = Ce qui fait l’aspect

look-layout-hint = L’aspect de la page : page, caractères, espacement, titres, aspects des types
look-citations-hint = Comment s’écrivent les citations et la bibliographie

# After the name of the layout at the top of the panel: "Manuscript · 2 changes".
look-changes = { $count ->
    [one] { $count } modification
    [many] { $count } modifications
   *[other] { $count } modifications
  }
look-no-changes = aucune modification
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

look-section-type = Caractères
look-section-page = Page
look-section-paragraphs = Paragraphes
look-section-headings = Titres
look-section-numbers = Numérotation
look-section-notes = Notes
look-section-figures = Figures et tableaux

look-kinds-in-use = Dans ce document
look-heading-levels = Niveaux de titres
look-quotations-hint = Les citations que leur longueur détache du texte, là où elles ne sont pas déjà du type Citation. Ce type se règle dans la rubrique des types.

look-keep = Garder ces modifications comme une mise en page à moi…
look-keep-save = Garder
# Where the layout is one of the writer's own.
look-put-into = Enregistrer ces modifications dans « { $name } »
look-delete-layout = Supprimer cette mise en page à moi…
look-bundled = Les mises en page fournies avec Glaukopis restent telles quelles. Ce que vous changez ici est gardé avec le document ou, si vous le choisissez, comme une mise en page à vous.
