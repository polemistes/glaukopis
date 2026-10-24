# Templates: what a document of a kind consists of (ADR 0038). Their groups,
# the parts a document is made of, the kinds of file, and the editor of a
# template.

## The groups of templates, as the chooser lists them.

template-group-own = Les vôtres
template-group-plain = Pour commencer
template-group-article = Articles et communications
template-group-book = Livres et thèses
template-group-fiction = Fiction
template-group-stage = Scène et écran
template-group-poetry = Poésie
template-group-other = Autres genres de texte
template-group-journal = Revues
template-group-publisher = Éditeurs
template-group-style-guide = Guides de style

## Where a kind of element stands in the document.

template-part-group-front = Pages liminaires
template-part-group-back = Pages finales
template-part-group-cover = Couverture

## The parts of a document the application makes itself.

template-generated-half-title = Faux-titre
template-generated-title-page = Page de titre
template-generated-keywords = Mots-clés
template-generated-contents = Table des matières
template-generated-list-of-figures = Liste des figures
template-generated-list-of-tables = Liste des tableaux
template-generated-body = Le texte
template-generated-notes = Notes
template-generated-bibliography = Bibliographie

## The kinds of file a template makes.

template-target-pdf = PDF
template-target-pdf-latex = PDF, composé par LaTeX
template-target-docx = Word
template-target-odt = LibreOffice Writer
template-target-latex = LaTeX
template-target-typst = Typst
template-target-markdown = Markdown
template-target-html = Page web
template-target-epub = Livre numérique

## The template editor.

template-editor = Modèle
template-name = Nom du modèle
# The name a template of one's own is first given, made from that of the template it is made from.
template-name-changed = { $name }, modifié
# A template of the writer's own made from another, before it is named: by the other's name.
template-name-own = { $name }, à moi
template-sections = Rubriques du modèle
template-bundled = Les modèles fournis avec Glaukopis restent tels quels. Vos modifications sont enregistrées comme un modèle à vous.
template-delete = Supprimer ce modèle
template-save-own = Enregistrer comme modèle à moi
template-saved = « { $name } » est enregistré parmi vos propres modèles
template-read-failed = Le modèle n’a pas pu être lu.
template-save-failed = Le modèle n’a pas pu être enregistré.
template-delete-failed = Le modèle n’a pas pu être supprimé.
template-keep-failed = Le modèle n’a pas pu être gardé dans le projet. Sur un autre ordinateur, et dans un fichier de projet, le document aura à la place le modèle habituel.
template-delete-title = Supprimer le modèle « { $name } » ?
template-delete-message = Les éléments qui l’utilisent prendront à la place le modèle à partir duquel il a été fait.
template-delete-confirm = Supprimer le modèle
template-leave-title = Quitter sans enregistrer ?
template-leave-message = Les modifications que vous avez faites au modèle seront perdues.
template-leave-confirm = Quitter
template-leave-cancel = Continuer à modifier

## The parts of the editor, as they are chosen at the left.

template-section-about = À propos de ce modèle
template-section-looks = Mise en page et style de référence
template-section-contents = Contenu
template-section-kinds = Types d’éléments
template-section-passage-kinds = Types de paragraphes et de mots
template-section-requirements = Exigences
template-section-outputs = Fichiers

## About the template.

template-description = Description
template-group = Groupe
template-based-on = Fondé sur
template-based-on-none = Rien en particulier
template-source-changed = Vous avez modifié ce modèle ; la source décrit ce dont il a été fait.
template-source-none = Ce modèle ne suit les exigences d’aucun éditeur en particulier.

## The layout and the reference style it brings.

template-layout = Mise en page
template-layout-hint = L’aspect de la page, pour chaque document de ce modèle
template-style = Style de référence
template-style-hint = Comment s’écrivent les citations et la bibliographie ; vide, celui de la mise en page s’applique
# The layout or style the writer has chosen in the settings.
template-usual = Votre choix habituel, d’après les réglages

## The contents: the order of the document.

template-contents-hint = L’ordre du document : les parties que l’application fait elle-même, et chaque élément d’un type, dans l’ordre de l’arbre. Un type placé avant le texte fait partie des pages liminaires, un type placé après lui, des pages finales.
# An item of the contents that places every element of a kind.
template-contents-kind = Chaque { $name }
template-contents-add-part = Une partie…
template-contents-add-kind = Un type d’élément…
template-contents-up = Monter
template-contents-down = Descendre

## The kinds in hand.

template-kinds-hint = Les types d’éléments que le modèle met sous la main : ils sont proposés dans le menu des types. Ceux du contenu sont sous la main, qu’ils soient choisis ici ou non.
template-kinds-in-contents = Dans le contenu
template-passage-kinds-hint = Les types de paragraphes et de mots que le modèle met sous la main : ils sont proposés en premier dans les outils d’écriture.

## The requirements.

template-requirements-hint = Ce à quoi un document de ce modèle doit satisfaire. La liste de contrôle et l’aperçu comptent en regard de ces exigences ; rien n’est coupé.
template-requirement-words = Mots du texte
template-requirement-abstract-words = Mots du résumé
template-requirement-keywords = Mots-clés
template-requirement-note = Ce que comptent les limites
template-requirement-note-placeholder = Notes comprises ; bibliographie non
# Beside a number of 0, in the place of its unit.
template-no-limit = pas de limite

## The files the template makes.

template-outputs-hint = Les formats de fichier sous lesquels le document est proposé quand il est exporté.
template-output-document = Le document
template-output-cover = La couverture
template-output-cover-note = Une couverture à part sera faite par une version ultérieure ; ce que le modèle en dit est gardé tel quel.

## The names of the kinds of text that come with Glaukopis, as the chooser of what you are writing
## and the button over the preview give them; journals, publishers and style guides keep their own.

template-called-plain = Document simple
template-called-paper = Communication
template-called-article = Article de revue
template-called-report = Rapport
template-called-book = Ouvrage universitaire
template-called-thesis = Thèse
template-called-novel = Roman
template-called-novel-manuscript = Manuscrit de roman
template-called-short-story = Nouvelle
template-called-story-collection = Recueil de nouvelles
template-called-poems = Poèmes
template-called-play = Pièce de théâtre
template-called-screenplay = Scénario
template-called-letter = Lettre
template-called-blog-post = Billet de blog
template-called-news-article = Article de presse
