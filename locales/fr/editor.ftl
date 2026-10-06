# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Format
editor-writing = Écriture
editor-italic = Italique
editor-bold = Gras
editor-small-capitals = Petites capitales
editor-superscript = Exposant
editor-subscript = Indice
editor-struck = Barré
editor-quotation = Citation
editor-block-quotation = Citation en retrait
editor-list = Liste
editor-text = Texte
editor-text-hint = Un paragraphe
editor-quotation-hint = Détachée du texte
editor-list-hint = Avec une puce devant chaque point
editor-numbered-list = Liste numérotée
editor-numbered-list-hint = Avec un numéro devant chaque point
editor-verse = Vers
editor-verse-hint = Des vers de poésie ou de théâtre, chacun gardé sur sa ligne
editor-speaker = Locuteur
editor-speaker-hint = Qui parle, sur une ligne à part
editor-direction = Didascalie
editor-direction-hint = Ce qui se fait, en italique
editor-line-numbers = Numéros de vers
editor-line-numbers-hint = Numéroter les vers de ce passage : à partir de quel vers, et tous les combien
editor-line-numbers-from = Numéroter les vers à partir de
editor-line-numbers-none = Laisser vide pour aucun numéro
editor-line-numbers-every = Afficher un numéro tous les
editor-line-numbers-number = Il faut un nombre entier.
editor-kinds-text = Texte
editor-kinds-quotation = Citation
editor-kinds-verse = Vers
editor-kinds-script = Scénario
editor-kinds-more = Autres
editor-kinds-words = Mots
editor-attribution = Attribution
editor-attribution-hint = De qui sont ces mots, sous une citation, à droite
editor-epigraph = Épigraphe
editor-epigraph-hint = Une citation en tête d’une partie
editor-headword = Entrée
editor-headword-hint = Le mot qu’un glossaire explique
editor-gloss = Glose
editor-gloss-hint = Ce que l’entrée veut dire
editor-code = Code
editor-code-hint = Gardé lettre pour lettre, en lettres de même largeur
editor-break = Séparation
editor-break-hint = Une pause entre deux parties, avec le signe que le format lui donne
editor-draft = Note de travail
editor-draft-hint = Pour vos yeux : elle ne va dans aucun document
editor-foreign = Mots étrangers
editor-foreign-hint = Des mots dans une autre langue, que l’orthographe suit
editor-title-of-work = Titre d’œuvre
editor-title-of-work-hint = Le titre d’un livre, d’une pièce, d’un tableau
editor-term = Terme
editor-term-hint = Un terme là où il est employé pour la première fois
editor-mention = Mention
editor-mention-hint = Un mot dont on parle en tant que mot, entre guillemets
editor-highlight = Surlignage
editor-highlight-hint = Pour l’œil, à l’écran : il ne va dans aucun document
editor-underline = Souligné
editor-code-words = Code dans la ligne
editor-code-words-hint = Des lettres de même largeur, dans la ligne
editor-scene = Intitulé de scène
editor-scene-hint = INT. MAISON – NUIT
editor-action = Action
editor-action-hint = Ce qui se voit et se fait
editor-character = Personnage
editor-character-hint = Qui parle, au-dessus du dialogue
editor-dialogue = Dialogue
editor-dialogue-hint = Ce qui se dit
editor-parenthetical = Indication
editor-parenthetical-hint = Comment c’est dit, entre parenthèses
editor-transition = Transition
editor-transition-hint = FONDU AU NOIR, à droite
editor-comment = Commentaire
editor-comment-hint = Un commentaire sur ce qui est sélectionné
editor-comment-element-hint = Un commentaire sur cet élément ; sélectionnez des mots pour les commenter
editor-parallel = Deux textes côte à côte
editor-parallel-hint = Un original et sa traduction, chacun un texte à part
editor-paragraph-kind = Type de paragraphe
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Type de paragraphe : { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Autres…
editor-kinds-in-hand = Types sous la main
editor-kinds-own = Les vôtres
editor-kinds-make = Créer un type…
editor-kinds-change-own = Modifier un type à vous…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Composés comme « { $format } » le veut
editor-kinds-change-format = Modifier le format…
editor-kinds-change-format-hint = Comment chaque type est composé dans ce document
editor-words = Mots
editor-words-hint = Souligné, exposant, code ; mots étrangers, titre d’œuvre, terme
editor-words-make = Créer un type de mots…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = La langue de la carte
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Mots ordinaires
editor-own-kind-new = Un type à vous
editor-own-kind-change = Modifier le type
editor-own-kind-name = Nom
editor-own-kind-name-placeholder = Lettre, télégramme, prière…
editor-own-kind-words-placeholder = Nom de navire, latin, mot-clé…
editor-own-kind-name-taken = Il y a déjà un type de ce nom.
editor-own-kind-based-on = Fondé sur
editor-own-kind-based-on-hint = Ce qui n’est pas dit ci-dessous est comme dans ce type
editor-own-kind-look = En quoi il diffère
editor-own-kind-create = Créer
editor-own-kind-delete-title = Supprimer le type « { $name } » ?
editor-own-kind-delete-message = { $count ->
    [0] Aucun texte n’en est.
    [one] Ce qui en est dans un élément reste tel quel, et est composé comme du texte dans les documents.
    [many] Ce qui en est dans { $count } éléments reste tel quel, et est composé comme du texte dans les documents.
   *[other] Ce qui en est dans { $count } éléments reste tel quel, et est composé comme du texte dans les documents.
}

## Citing, notes, and what is put into the text.

editor-cite = Citer
editor-cite-here = Citer une œuvre ici
editor-cite-at-cursor = Citer une œuvre là où est le curseur
editor-note = Note
editor-note-selection = Faire de la sélection une note
editor-note-hint = Une note, en bas de page ou en fin de texte
editor-insert = Insérer
editor-insert-hint = Une image, un tableau, des mathématiques, un renvoi
editor-new-element = Nouvel élément
editor-new-element-hint = Un nouvel élément après celui-ci, ou dessous
editor-new-after = Nouvel élément après celui-ci
editor-new-under = Nouvel élément sous celui-ci
editor-new-split = Scinder ici
editor-new-split-hint = Ce qui suit le curseur devient un nouvel élément
editor-spelling-on = L’orthographe est vérifiée pendant que vous écrivez · appuyez pour arrêter
editor-spelling-off = L’orthographe n’est pas vérifiée · appuyez pour la vérifier
editor-picture-file = Image depuis un fichier…
editor-picture-file-hint = Une figure, avec ce qu’on en dit
editor-picture-store = Image de la réserve…
editor-picture-store-hint = Celles que vous avez sont affichées sur le côté
editor-equation = Équation
editor-equation-hint = Des mathématiques sur une ligne à part
editor-table = Tableau…
editor-table-hint = De tant de lignes et de colonnes
editor-table-file = Tableau depuis un fichier…
editor-table-file-hint = CSV, ou une feuille de LibreOffice ou d’Excel
editor-formula = Formule
editor-formula-hint = Des mathématiques dans la ligne
editor-pointer = Renvoi…
editor-pointer-hint = À une figure, un tableau, une équation ou une partie : « voir figure 2 »
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = image

## More.

editor-found = Citations reconnues…
editor-found-count = { $count } à passer en revue, pour en faire des citations
editor-found-none = Et du texte qui ressemble à des citations, dans cette carte

## Choosing a work to cite.

editor-picker = Choisir une référence
editor-picker-placeholder = Citer : auteur, titre, année
editor-picker-search = Rechercher des références
editor-picker-results = Références
editor-picker-in-project = Dans ce projet
editor-picker-recent = Ajoutées récemment
editor-picker-empty = Votre bibliothèque est vide.
editor-picker-no-match = Rien dans votre bibliothèque ne contient ces mots.
editor-picker-type = Tapez pour chercher dans votre bibliothèque.
editor-picker-new = Nouvelle référence…
editor-picker-import = Importer…

## A citation, and each work in it.

editor-citation = Citation
editor-citation-add = Ajouter une œuvre
editor-citation-add-purpose = Ajouter une œuvre à la citation
editor-citation-in-text = Auteur dans le texte : Nagy (1979)
editor-citation-remove = Retirer la citation
editor-citation-split = Séparer les mots de la citation
editor-citation-split-hint = Les mots avant et après deviennent du texte de la ligne, et chaque œuvre une citation à part, avec sa page et rien d’autre
editor-citation-not-in-library = Cette référence n’est pas dans votre bibliothèque.
editor-citation-edit-reference = Modifier la référence
editor-citation-before = Avant
editor-citation-before-placeholder = voir, cf.
editor-citation-after = Après
editor-citation-after-placeholder = et passim
editor-citation-locator-kind = Type de repère
editor-citation-suppress-author = L’auteur est nommé dans ma phrase : donner l’année seulement
editor-citation-remove-work = Retirer cette œuvre
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [référence introuvable]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (citation)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Page
editor-locator-chapter = Chapitre
editor-locator-section = Section
editor-locator-paragraph = Paragraphe
editor-locator-line = Ligne
editor-locator-verse = Verset
editor-locator-book = Livre
editor-locator-volume = Volume
editor-locator-part = Partie
editor-locator-column = Colonne
editor-locator-folio = Folio
editor-locator-figure = Figure
editor-locator-note = Note
editor-locator-number = Numéro
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Note { $number }
editor-note-place = Où la note se trouve
editor-note-place-format = Là où le format met ses notes
editor-note-place-foot = En bas de page
editor-note-place-end = En fin de texte
editor-note-placeholder = Le texte de la note
