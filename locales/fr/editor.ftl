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
editor-quotation-hint = Les mots d’un autre, détachés du texte
editor-list-hint = Un point d’une liste ; un retrait fait une liste dans la liste
editor-numbered-list = Liste numérotée
editor-numbered-list-hint = Un point d’une liste numérotée ; un retrait fait une liste dans la liste
editor-verse = Vers
editor-verse-hint = Une ligne de poésie, de théâtre ou de transcription, gardée comme une ligne
editor-speaker = Locuteur
editor-speaker-hint = Qui parle : sur une ligne à part, ou comme mots dans une ligne
editor-direction = Didascalie
editor-direction-hint = Ce qui se fait sur scène : sur une ligne à part, ou comme mots dans une ligne
editor-line-numbers = Numéros
editor-line-numbers-hint = Numéroter ces lignes : comment elles sont comptées, à partir de quel numéro, tous les combien et de quel côté ; et dire ce qu’il en est de la ligne où se trouve le curseur. Des lignes numérotées ensemble avec les mêmes réglages sont comptées comme un tout, quels que soient leurs types.
editor-line-numbers-from = Numéroter à partir de
editor-line-numbers-from-hint = La première ligne comptée reçoit ce numéro, et le compte se poursuit à partir de lui.
editor-line-numbers-every = Afficher un numéro tous les
editor-line-numbers-number = Il faut un nombre entier.
editor-line-this = Cette ligne
editor-line-number = Son numéro ou son étiquette
editor-line-number-placeholder = Comptée comme les autres
editor-line-number-hint = 1234, 567a : toujours affiché ; les lignes qui suivent sont comptées à partir de lui.
editor-line-uncounted = Non comptée
editor-line-uncounted-hint = Comme la seconde moitié d’une ligne partagée entre locuteurs : le compte passe par-dessus.
editor-line-hidden = Comptée, sans que son numéro soit affiché
editor-line-hidden-hint = Le compte la traverse comme toute autre ligne, mais aucun numéro ne figure à côté d’elle dans le document, même là où il en tomberait un. Là où vous écrivez, il figure entre parenthèses.
editor-line-number-held = Ligne comptée, dont le numéro n’est pas affiché dans le document. Appuyez pour lui donner un numéro à elle.
editor-line-margin = Mots en marge
editor-line-margin-placeholder = Un mètre, le numéro d’une autre édition
editor-line-margin-hint = Affichés dans la marge à côté d’elle, en face des numéros ; non comptés.
# How the lines of a stretch are numbered: see ADR 0041.
editor-numbering = Numérotation
editor-numbering-none = Sans numérotation
editor-numbering-counted = Compte à partir du premier numéro donné
editor-numbering-given = Seulement les numéros donnés
editor-line-numbers-every-layout = Comme la mise en page : tous les { $every }
editor-line-numbers-side = Côté des numéros
editor-side-layout = Comme la mise en page ({ $side })
editor-side-left = Gauche
editor-side-right = Droite
# The first counted line of the stretch is the one the cursor is in: its number is where the count begins.
editor-line-number-first-hint = Le compte commence ici.
# Over a number in the margin of the text, which opens a field for it when pressed.
editor-line-number-press = Le numéro de cette ligne : appuyez pour le changer

## Numbers belong to what they number (ADR 0041): the Numbers menu offers
## the three, each saying what it numbers.

editor-numbers = Numéros
editor-numbers-hint = Numéroter les lignes que vous écrivez, marquer un endroit de la prose, ou numéroter les lignes de la page
editor-numbers-lines = Numéroter ces lignes…
editor-numbers-lines-hint = Les lignes des paragraphes où est le curseur, ou de ceux qui sont sélectionnés : à partir de quel numéro, tous les combien, de quel côté
editor-numbers-refmark-hint = Un endroit de la prose, repéré par un verset, une page ou un numéro d’édition : 3:16, 327a
editor-numbers-page = Numéroter les lignes de la page
editor-numbers-page-hint = Chaque ligne de la page imprimée, numérotée dans la marge, dans ce document et ceux du dessous

## The bracket at the left of paragraphs of one kind standing together (a
## run), named by the kind; its menu says what is said of them.

# After the name of the kind, where the lines of the run are numbered: "Verse · numbered".
editor-bracket-numbered = lignes numérotées
editor-run-label-hint = { $kind } · appuyez pour voir ce qui est dit de ces paragraphes
editor-run-numbers = Numéros…
editor-run-numbers-hint = Comment les lignes sont comptées ici, à partir de quel numéro, tous les combien et de quel côté
editor-run-select = Sélectionner ces paragraphes
editor-run-to-text = En faire du texte
editor-run-to-text-hint = Les paragraphes de ce type deviennent du texte ; leurs lignes, et tout le reste, restent tels quels
editor-run-begin = Commencer une nouvelle suite ici
editor-run-begin-hint = Le paragraphe où est le curseur commence un crochet à lui, bien que celui d’avant soit du même type
editor-run-join = Joindre à la suite d’avant
editor-run-join-hint = Ces paragraphes ne font de nouveau qu’un avec ceux du même type qui les précèdent
editor-kinds-text = Texte
editor-kinds-quotation = Citation
editor-kinds-verse = Vers
editor-kinds-script = Scénario
editor-kinds-list = Liste
editor-kinds-more = Autres
editor-kinds-words = Mots
editor-attribution = Attribution
editor-attribution-hint = De qui sont les mots d’une citation
editor-epigraph = Épigraphe
editor-epigraph-hint = Une citation en tête d’une partie
editor-headword = Entrée
editor-headword-hint = Le mot qu’un glossaire explique
editor-gloss = Glose
editor-gloss-hint = Ce que l’entrée veut dire
editor-code = Code
editor-code-hint = Une ligne de code, ou de tout ce qui est gardé lettre pour lettre
editor-break = Séparation
editor-break-hint = Une pause entre deux parties, avec le signe que la mise en page lui donne
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
editor-scene-hint = Où et quand se passe une scène : INT. MAISON – NUIT
editor-action = Action
editor-action-hint = Ce qui se voit et se fait
editor-character = Personnage
editor-character-hint = Qui dit le dialogue qui suit
editor-dialogue = Dialogue
editor-dialogue-hint = Ce qui se dit
editor-parenthetical = Indication
editor-parenthetical-hint = Comment une réplique est dite
editor-transition = Transition
editor-transition-hint = Comment une scène fait place à la suivante : FONDU AU NOIR
editor-comment = Commentaire
editor-comment-hint = Un commentaire sur ce qui est sélectionné
editor-comment-element-hint = Un commentaire sur cet élément ; sélectionnez des mots pour les commenter
editor-parallel = Deux textes côte à côte
editor-parallel-hint = Un original et sa traduction, chacun un texte à part
editor-page-break = Saut de page
editor-page-break-hint = Ce qui suit commence sur une nouvelle page
editor-column-break = Saut de colonne
editor-column-break-hint = Ce qui suit commence en haut de la colonne suivante, là où la mise en page compose le texte en colonnes
editor-paragraph-kind = Type de paragraphe
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Type de paragraphe : { $kind }

## The kind menu: the kinds written with those where the cursor is, the kinds at hand,
## the whole catalogue under "More…", and the layout that sets them at its foot.
## The words menu, with the kinds of words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Autres…
editor-kinds-mixed = Plusieurs
editor-kinds-own = Les vôtres
editor-kinds-make = Créer un type…
editor-kinds-change-own = Modifier un type à vous…
# Over the item that opens the look of the document at the kind the cursor is in.
editor-kinds-set-by = Composés comme « { $format } » le veut
editor-kinds-change-look = L’aspect de « { $kind } »…
editor-kinds-change-look-hint = Son aspect dans ce document, et le reste de la page
editor-words = Mots
editor-words-hint = Souligné, exposant, code ; la langue d’un passage, mots étrangers, titre d’œuvre, terme, locuteur dans une ligne
editor-words-make = Créer un type de mots…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-text = La langue du texte
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Mots ordinaires
# The language of a passage, from a word to many paragraphs: it has no look of its own.
editor-language = Langue
editor-language-of-text = La langue propre du texte
editor-language-other = Autre langue…
editor-language-other-title = La langue du passage
editor-language-tag = Code de langue
editor-language-no-tag = Ce n’est pas un code de langue : un code est par exemple « grc », « la » ou « de-CH ».
editor-language-unnamed = Une langue que le système ne sait pas nommer : le code est gardé tel qu’il est écrit.
editor-language-suggested = Langues souvent citées
editor-language-other-hint = Le passage est vérifié avec le dictionnaire de sa langue, s’il en a été importé un, et laissé tel quel sinon ; un document que l’on fait indique la langue à Word, OpenDocument, Typst et LaTeX.
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
editor-break-signs = Le signe d’un saut de ligne dans un paragraphe
editor-break-signs-on = Un saut de ligne dans un paragraphe est montré par ↵ · appuyez pour cacher le signe
editor-break-signs-off = Un saut de ligne dans un paragraphe n’est pas montré · appuyez pour le montrer par ↵
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
editor-refmark = Marque de référence…
editor-refmark-hint = Un verset, une page ou un numéro d’édition : 3:16, 327a
editor-refmark-title = Marque de référence
editor-refmark-label = Étiquette
editor-refmark-placeholder = 3:16, 327a, 1094a1
editor-refmark-dialog-hint = La marque ne fait pas partie des mots : l’orthographe, la recherche et le compte des mots l’ignorent. La mise en page dit si elle est surélevée dans la ligne ou placée dans la marge.
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = image

## More.

editor-found = Citations non liées…
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
editor-note-place-format = Là où la mise en page met ses notes
editor-note-place-foot = En bas de page
editor-note-place-end = En fin de texte
editor-note-placeholder = Le texte de la note
