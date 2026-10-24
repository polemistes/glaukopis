# Document properties: what an element's document says of itself, its
# details, its type (what you are writing, its template), its language and
# the checklist of what its template requires. How it looks and what it
# contains are set in Look.

about-window = Propriétés du document
# In the menu of an element, and at the foot of Look.
about-menu = Propriétés du document…
about-sections = Rubriques de la fenêtre

## The parts of the window, as they stand down its left.

about-section-details = Informations
about-section-language = Langue
about-section-checklist = Liste de contrôle

## The template.

## The details: what stands on the first page, and in the metadata of the files.

about-title = Titre
about-title-placeholder = Le nom de l’élément
about-subtitle = Sous-titre
about-name = Nom
about-affiliation = Affiliation
about-email = Courriel
about-orcid = ORCID
about-date = Date
about-date-placeholder = Telle qu’elle sera imprimée
about-keywords = Mots-clés
about-keywords-placeholder = Séparés par des virgules
about-keywords-count = { $count ->
    [one] { $count } mot-clé
    [many] { $count } mots-clés
   *[other] { $count } mots-clés
}
# The keywords given, and the most the template allows.
about-keywords-of = { $count } sur { $limit }
about-identifiers = Identifiants
about-identifier-isbn = ISBN
about-identifier-edition = Édition
about-identifier-publisher = Éditeur
about-identifier-place = Lieu
about-identifier-doi = DOI
about-identifier-name = Nom d’un autre identifiant
about-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
about-identifier-add = identifiant

## The parts: the kinds of elements the template gives the document a place for.

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

## The language.

about-language = Langue du texte

## The checklist: what the template requires, against what the tree holds.

about-checklist-hint = Ce que le modèle exige, en regard du texte et de l’arbre. Rien n’est coupé.
about-checklist-clear = Rien à signaler.
about-requirement-words = Mots du texte
about-requirement-anonymous = Pour l’évaluation : le document ne nomme pas ses contributeurs.

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# The tab of what the document is: what you are writing, its template.
about-section-type = Type de document

## Fewer words, stage 3: the source of a layout's requirements, under the layout the type brings.

about-layout-source = Source : { $name }

## The contributors, stage 3: the persons of a document, each with a role.

about-contributors = Contributeurs
# Beside a plus, under the contributors: adds one.
about-add-contributor = Ajouter un contributeur
about-contributor-role = Rôle du contributeur { $number }
about-role-author = Auteur
about-role-editor = Éditeur scientifique
about-role-translator = Traducteur
about-contributor-name = Nom du contributeur { $number }
about-contributor-affiliation = Affiliation du contributeur { $number }
about-contributor-email = Courriel du contributeur { $number }
about-contributor-orcid = ORCID du contributeur { $number }
# Under the details: whether every line of the printed page is numbered in the margin.
about-page-lines = Numéroter chaque ligne de la page imprimée
