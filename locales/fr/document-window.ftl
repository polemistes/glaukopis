# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

document-window = Réglages du document
# In the menu of an element, and the button over the preview.
document-window-menu = Réglages du document…
document-window-sections = Rubriques de la fenêtre
# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
document-window-usual = Votre choix habituel ({ $name })
# The first choice of a layout or a style: what the template brings, named.
document-window-as-template = Comme le veut le modèle ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
document-window-from-with = De « { $name } » ({ $what })

## The parts of the window, as they stand down its left.

document-window-section-template = Modèle
document-window-section-details = Informations
document-window-section-parts = Parties
document-window-section-look = Aspect
document-window-section-language = Langue
document-window-section-checklist = Liste de contrôle

## The template.

document-window-template-hint = Ce dont se compose le document : ses parties dans leur ordre, les types que le modèle met sous la main, ce qu’il exige, et la mise en page et le style de référence qu’il apporte.
document-window-template-search = Rechercher dans les modèles
document-window-template-search-placeholder = Un genre de texte, une revue, un éditeur…
document-window-template-none-found = Aucun modèle ne porte ce nom.
# Takes the template of the element over this one again, in place of this element's own.
document-window-template-again = Reprendre celui de « { $name } »
document-window-template-usual-again = Reprendre votre choix habituel
document-window-template-layout = Mise en page : { $layout }
document-window-template-style = Style de référence : { $style }
document-window-template-change = Modifier ce modèle…
document-window-template-new = Nouveau modèle…
# A template the project carries a copy of, that is not among the writer's own on this computer.
document-window-template-of-project = Gardé dans le projet : il n’est pas parmi vos propres modèles sur cet ordinateur.

## The details: what stands on the first page, and in the metadata of the files.

document-window-details-hint = Ce qui figure sur la première page, et ce que les fichiers portent comme métadonnées. Tout le reste s’écrit dans l’arbre.
document-window-title = Titre
document-window-title-placeholder = Le nom de l’élément
document-window-title-hint = Laissé vide, le titre est le nom de l’élément.
document-window-subtitle = Sous-titre
document-window-authors = Auteurs
document-window-name = Nom
document-window-author-name = Nom de l’auteur { $number }
document-window-affiliation = Affiliation
document-window-author-affiliation = Affiliation de l’auteur { $number }
document-window-email = Courriel
document-window-author-email = Courriel de l’auteur { $number }
document-window-orcid = ORCID
document-window-author-orcid = ORCID de l’auteur { $number }
# Beside a plus, under the authors: adds one.
document-window-add-author = auteur
document-window-date = Date
document-window-date-placeholder = Telle qu’elle sera imprimée
document-window-keywords = Mots-clés
document-window-keywords-placeholder = Séparés par des virgules
document-window-keywords-count = { $count ->
    [one] { $count } mot-clé
    [many] { $count } mots-clés
   *[other] { $count } mots-clés
}
# The keywords given, and the most the template allows.
document-window-keywords-of = { $count } sur { $limit }
document-window-identifiers = Identifiants
document-window-identifier-isbn = ISBN
document-window-identifier-edition = Édition
document-window-identifier-publisher = Éditeur
document-window-identifier-place = Lieu
document-window-identifier-doi = DOI
document-window-identifier-name = Nom d’un autre identifiant
document-window-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
document-window-identifier-add = identifiant

## The parts: the kinds of elements the template gives the document a place for.

document-window-parts-hint = Les types d’éléments auxquels ce modèle donne une place, et les éléments du dessous qui occupent chacune de ces places. Une partie est un élément : son texte s’écrit dans l’arbre.
document-window-parts-none = Ce modèle n’a pas de parties en dehors du corps du texte.
document-window-parts-missing = Aucun pour l’instant
document-window-parts-make = En créer un
# On the second element of a kind a document has one of.
document-window-parts-doubled = Seul le premier est utilisé

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

document-window-look-hint = L’aspect des pages et la façon dont le document cite se règlent dans Aspect, le volet à côté de l’aperçu : la mise en page et le style de référence, la police, la page, les aspects des types.
document-window-look-now = Mise en page : { $layout } · Style de référence : { $style }
document-window-look-open = Ouvrir le volet Aspect
document-window-layout = Mise en page
document-window-style = Style de référence
document-window-style-change = Modifier ce style de référence…

## The language.

document-window-language = Langue du texte

## The checklist: what the template requires, against what the tree holds.

document-window-checklist-hint = Ce que le modèle exige, en regard du texte et de l’arbre. Rien n’est coupé.
document-window-checklist-clear = Rien à signaler.
document-window-requirement-words = Mots du texte
document-window-requirement-anonymous = Pour l’évaluation : les auteurs sont omis du document.
