# Reference styles: their kinds, the search for more, and the style editor,
# with the words it tells the parts of a style by.

## The kinds of reference style, as the styles are grouped by them.

style-kind-note = Notes
style-kind-author-date = Auteur-date
style-kind-numeric = Numéros
style-kind-label = Étiquettes
style-kind-author = Auteur
style-kind-other = Autres

## The search for reference styles of journals and publishers.

style-browser = Styles de référence
style-browser-subtitle = Plus de dix mille styles de revues et d’éditeurs, par nom
style-browser-placeholder = Le nom d’une revue, d’un éditeur ou d’un style
style-browser-search = Rechercher des styles
# Beside a style that has been fetched already.
style-browser-here = Ici
style-browser-fetch = Récupérer
style-browser-none-found = Aucun style n’a ces mots dans son nom.
style-browser-about = Les styles sont récupérés du dépôt du projet Citation Style Language et gardés avec les vôtres. Ceux que vous avez peuvent être modifiés selon les vœux d’un éditeur dans l’éditeur de styles.
style-browser-import = Importer un fichier…
style-browser-import-title = Importer un style de référence
style-browser-fetch-failed = Le style n’a pas pu être récupéré.
style-browser-file-unread = Le fichier n’a pas pu être lu.

## The style editor.

style-editor = Style de référence
style-name = Nom du style
# The name a style of one's own is first given, made from that of the style it is made from.
style-name-changed = { $name }, modifié
style-depth = Jusqu’où aller
style-depth-options = Changements courants
style-depth-parts = Partie par partie
style-depth-source = Source
style-scope = Quoi changer
style-scope-citations = Citations
style-scope-notes = Notes
style-scope-bibliography = Bibliographie
style-bundled = Les styles fournis avec Glaukopis restent tels quels. Vos modifications sont enregistrées comme un style à vous.
style-delete = Supprimer ce style
style-save-own = Enregistrer comme style à moi
style-saved = « { $name } » est enregistré parmi vos styles
style-read-failed = Le style n’a pas pu être lu.
style-save-failed = Le style n’a pas pu être enregistré.
style-delete-failed = Le style n’a pas pu être supprimé.
style-delete-title = Supprimer le style « { $name } » ?
style-delete-message = Les cartes qui l’utilisent prendront un autre style à la place.
style-delete-confirm = Supprimer le style
style-leave-title = Quitter sans enregistrer ?
style-leave-message = Les modifications que vous avez faites au style seront perdues.
style-leave-confirm = Quitter
style-leave-cancel = Continuer à modifier

## Common changes: names.

style-names = Noms
# A sentence with two fields in it, where numbers are written: the least number of
# authors for which "et al." is used, and how many are named before it.
style-et-al = À partir de { $min } auteurs, donner les { $first } premiers et « et al. »
style-et-al-min = Nombre d’auteurs à partir duquel et al. est employé
style-et-al-first = Nombre d’auteurs donnés avant et al.
style-et-al-empty = Laissé vide, tous sont nommés
# As the one before, for a work that has been cited before.
style-et-al-again = Citée de nouveau, à partir de { $min } donner les { $first } premiers
style-et-al-again-min = Nombre d’auteurs à partir duquel et al. est employé dans les citations suivantes
style-et-al-again-first = Nombre d’auteurs donnés dans les citations suivantes
style-et-al-again-empty = Laissé vide, comme la première fois
style-before-last-name = Avant le dernier nom
# The word the style prints there, in the language of the document.
style-and-word = et
style-and-nothing = Rien
style-as-the-style-has-it = Comme le style l’a
style-comma-before-last = Une virgule avant
style-comma-contextual = À partir de trois noms : A, B, et C
style-comma-always = Toujours : A, et B
style-comma-never = Jamais : A, B et C
style-comma-after-inverted = Après un nom inversé
style-given-names = Prénoms
style-given-full = En entier : John Miles
style-given-spaced = Initiales : J. M.
style-given-close = Initiales serrées : J.M.
style-given-bare = Initiales sans points : JM
style-given-bare-spaced = Initiales sans points : J M
style-family-first = Nom de famille d’abord
style-family-first-none = Pour personne : John Foley
style-family-first-first = Pour le premier auteur : Foley, John, et Robert Fowler
style-family-first-all = Pour tous : Foley, John, et Fowler, Robert
style-sort-separator = Entre nom de famille et prénom
style-sort-separator-hint = Quand le nom de famille vient d’abord

## Common changes: the citation, or the note, and the entries of the bibliography.

style-the-citation = La citation
style-the-note = La note
style-begins-with = Commence par
style-ends-with = Se termine par
style-between-works = Entre des œuvres citées ensemble
style-collapse = Œuvres d’un même auteur citées ensemble
style-collapse-none = Chacune en entier
style-collapse-year = Le nom une fois : Nagy 1979, 1996
style-collapse-year-suffix = Et l’année une fois : Nagy 1979a, b
style-collapse-year-suffix-ranged = Avec des intervalles : Nagy 1979a–c
style-collapse-citation-number = Les numéros en intervalles : [1–3]
style-disambiguate = Quand deux œuvres seraient citées pareil
style-disambiguate-year-suffix = Ajouter une lettre à l’année
style-disambiguate-names = Nommer plus d’auteurs
style-disambiguate-given-names = Ajouter les prénoms ou les initiales
style-near-note = Une note compte comme proche à moins de
style-near-note-hint = Notes ; pour les styles qui abrègent ce qui a été cité peu avant
style-entries = Les notices
style-entry-ends-with = Chacune se termine par
style-author-repeated = Pour un auteur répété
style-author-repeated-hint = À la place du nom, dans les notices après la première
style-hanging-indent = Retrait suspendu
style-hanging-indent-hint = Le format du document décide de sa profondeur
style-second-field = Les numéros ou étiquettes se placent
style-second-field-line = Dans la ligne
style-second-field-column = Dans une colonne à part
style-second-field-margin = Dans la marge
style-second-field-hint = Pour les styles qui numérotent leurs notices

## Common changes: throughout the style.

style-throughout = Partout
style-page-ranges = Intervalles de pages
style-page-ranges-as-entered = Comme saisis
style-page-ranges-expanded = En entier : 321–328
style-page-ranges-minimal = Au plus court : 321–8
style-page-ranges-minimal-two = Deux chiffres au moins : 321–28
style-page-ranges-chicago = Comme le Chicago Manual
style-particles = « van », « de », « von » devant un nom de famille
style-particles-never = Restent avec lui, et se classent sous v, d
style-particles-sort-only = Restent avec lui, mais ne comptent pas pour le classement
style-particles-display-and-sort = Passent après le prénom : Gogh, Vincent van
style-hyphen = Un trait d’union entre les initiales
style-hyphen-hint = J.-P. Sartre, non J.P. Sartre
style-locale = Les mots du style sont en
style-locale-document = La langue du document
style-locale-hint = « dir. », « dans », « consulté le », les mois

## Part by part.

# The scope is citation or bibliography.
style-parts-of = { $scope ->
    [citation] Parties de la citation
   *[bibliography] Parties de la bibliographie
}
style-parts-none = { $scope ->
    [citation] Ce style n’a pas de citation.
   *[bibliography] Ce style n’a pas de bibliographie.
}
style-parts-hint = Choisissez une partie à gauche pour changer comment elle s’imprime : ce qui se trouve avant et après elle, son caractère, ses majuscules. Les parties s’ouvrent pour montrer de quoi elles sont faites.
style-part-unfold = Ouvrir
style-part-fold = Fermer
style-part-up = Monter
style-part-down = Descendre
style-part-add-after = Ajouter après
style-part-take-away = Retirer
style-part-add-within = Ajouter dedans
# A part of a macro: a part of the style that is used in several places.
style-part-shared = Ceci appartient à « { $macro } », qui est employé à { $count } endroits. Un changement ici se voit partout.
style-add-words = Des mots à moi
style-add-words-hint = Comme « dans », « consulté le », ou de la ponctuation
# Over the fields of a reference that a part can print.
style-add-from-reference = De la référence
style-part-words = Les mots
style-part-before = Avant
style-part-before-hint = Imprimé seulement quand la partie elle-même l’est
style-part-after = Après
style-part-between = Entre ses parties
style-slant = Inclinaison
style-slant-upright = Droit
style-slant-italic = Italique
style-weight = Graisse
style-weight-regular = Normal
style-weight-bold = Gras
style-letters = Lettres
style-letters-as-written = Comme écrites
style-letters-small-caps = Petites capitales
style-case = Majuscules
style-case-as-entered = Comme saisies
style-case-title = Comme un titre anglais
style-case-sentence = Comme une phrase
style-case-capitalize-first = Première lettre en majuscule
style-case-capitalize-all = Chaque Mot Avec Majuscule
style-case-uppercase = CAPITALES
style-case-lowercase = minuscules
style-height = Hauteur
style-height-baseline = Sur la ligne
style-height-raised = En exposant
style-height-lowered = En indice
style-quotes = Entre guillemets
style-strip-periods = Sans points
style-strip-periods-hint = Pour les abréviations : « dir » pour « dir. »
style-text-form = Forme
style-text-form-long = En entier
style-text-form-short = Courte, quand la référence en a une
style-term-form = Forme du mot
style-term-form-long = En entier : directeur, page
style-term-form-short = Abrégée : dir., p.
style-term-form-verb = Comme verbe : dirigé par
style-term-form-verb-short = Comme verbe, abrégée : dir. par
style-term-form-symbol = Comme signe : §
style-date-parts = La date est donnée
style-date-parts-year = Par l’année seule
style-date-parts-year-month = Par l’année et le mois
style-date-parts-full = En entier

## The source of the style, and the sample it is tried on.

style-source = Source du style
style-source-try = L’essayer
style-source-unread = La source n’a pas pu être lue.
style-sample-unusable = Le style ne peut pas être utilisé tel quel
style-sample-failed = Le style n’a pas pu être essayé.
style-sample-in-text = Dans le texte
style-sample-in-notes = Dans les notes
style-sample-in-bibliography = Dans la bibliographie
style-sample-cited = Une œuvre citée
style-sample-same-page = La même, à une page
style-sample-another = Une autre, avec un mot devant
style-sample-first-again = La première de nouveau, à un chapitre
style-sample-together = Deux œuvres ensemble
style-sample-in-sentence = Avec l’auteur dans la phrase
style-sample-examples = Montré sur des exemples : votre bibliothèque est vide.
style-sample-library = Montré sur des œuvres de votre bibliothèque.

## The source of a style, where it cannot be read as one.

style-source-not-xml = La source n’est pas du XML bien formé.
style-source-not-style = Ceci n’est pas un style : il ne commence pas par <style>.
style-source-dependent = Le style n’a pas de <citation> : il ne fait que nommer un autre style, et ne peut pas être modifié.

## The parts of a style, as the style editor tells them in words.

style-part-layout = L’ensemble
style-part-text = Texte
# A part that prints a word of the style's language: the term is its name in CSL.
style-part-term = Le mot pour « { $term } »
# A part that prints words written into the style.
style-part-value = Les mots « { $value } »
style-part-name = Comment les noms s’écrivent
# The name is family or given, as CSL has them.
style-part-name-part = { $name ->
    [family] Le nom de famille
    [given] Le prénom
   *[other] Le nom { $name }
}
style-part-et-al = « et al. »
# The variables are one or more of those below: "the pages".
style-part-label = Le mot devant { $variables } (« p. », « dir. »)
style-part-role = Le mot pour le rôle (« dir. », « trad. »)
style-part-substitute = Quand il n’y a pas un tel nom, à sa place
# The name is day, month or year, as CSL has them, or part.
style-part-date-part = { $name ->
    [day] Le jour
    [month] Le mois
    [year] L’année
   *[other] Le { $name }
}
style-part-group = Ensemble
style-part-choose = L’un de ceux-ci
# The condition is made of those below.
style-part-if = Si { $condition }
style-part-else-if = Sinon, si { $condition }
style-part-else = Sinon
# A name the style has, of a part of it (a macro) or of a variable it does not know.
style-quoted = « { $text } »

## Words that join others: "the author, or else the editor", "a book or a chapter".
## The first may be a list of several, joined by commas.

style-or = { $first } ou { $last }
style-and = { $first } et { $last }
style-or-else = { $first }, ou à défaut { $last }

## When a part of a style is printed: "If the work is a book".

style-if-type = l’œuvre est { $types }
style-if-has = elle a { $variables }
style-if-lacks = il lui manque { $variables }
style-if-numeric = { $variables } est un nombre
style-if-uncertain = { $variables } est incertain
# The places are pages, chapters, verses and the like; see style-locator.
style-if-locator = le repère cité est { $locators }
style-if-disambiguate = elle serait sinon confondue avec une autre
style-if-always = toujours
style-if-none-holds = rien de ceci ne vaut : { $conditions }
# A kind of place that a citation points to, as CSL names it: page, chapter, verse,
# sub-verbo, and so on. English leaves the names as they are.
style-locator = de type « { $name } »

## When a citation is printed, by where it stands among the others.

style-position-first = elle est citée pour la première fois
style-position-subsequent = elle a déjà été citée
style-position-ibid = c’est la même que la citation précédente
style-position-ibid-with-locator = c’est la même que la citation précédente, à un autre endroit
style-position-near-note = elle a été citée dans une note peu avant

## How a part is set: "italic, in quotation marks, before “, ”".

style-form-italic = italique
style-form-bold = gras
style-form-small-caps = petites capitales
style-form-underlined = souligné
style-form-quoted = entre guillemets
# How the letters are set, as CSL names it; the words are that name with spaces for its dashes.
style-form-case = { $case ->
    [lowercase] en minuscules
    [uppercase] en capitales
    [capitalize-first] première lettre en majuscule
    [capitalize-all] chaque mot avec majuscule
    [sentence] comme une phrase
    [title] comme un titre anglais
   *[other] { $words }
}
style-form-raised = en exposant
style-form-lowered = en indice
# The part comes after these words.
style-form-after = après « { $text } »
# The part comes before these words.
style-form-before = avant « { $text } »
style-form-between = avec « { $text } » entre

## The kinds of work a reference is of, as CSL names them.

style-type-book = un livre
style-type-chapter = un chapitre
style-type-article-journal = un article de revue
style-type-article-magazine = un article de magazine
style-type-article-newspaper = un article de journal
style-type-article = un article
style-type-thesis = une thèse
style-type-report = un rapport
style-type-webpage = une page web
style-type-paper-conference = une communication de colloque
style-type-entry-encyclopedia = un article d’encyclopédie
style-type-entry-dictionary = une entrée de dictionnaire
style-type-entry = une entrée
style-type-review = un compte rendu
style-type-review-book = un compte rendu de livre
style-type-manuscript = un manuscrit
style-type-personal_communication = une lettre ou autre communication
style-type-legal_case = une décision de justice
style-type-legislation = un texte de loi
style-type-bill = un projet de loi
style-type-patent = un brevet
style-type-dataset = un jeu de données
style-type-software = un logiciel
style-type-motion_picture = un film
style-type-broadcast = une émission
style-type-song = un enregistrement
style-type-speech = une conférence
style-type-interview = un entretien
style-type-graphic = une image
style-type-map = une carte
style-type-pamphlet = une brochure
style-type-post-weblog = un billet de blog
style-type-post = un billet
style-type-classic = une œuvre classique
style-type-collection = un recueil
style-type-document = un document
style-type-standard = une norme
style-type-treaty = un traité
style-type-periodical = un périodique
style-type-musical_score = une partition
style-type-figure = une figure
style-type-event = un événement
style-type-performance = une représentation
style-type-regulation = un règlement
style-type-hearing = une audition

## What a reference has, as CSL names it: with its article, and without it
## (.bare) as a field of a reference is named.

style-variable-title = le titre
    .bare = titre
style-variable-title-short = le titre court
    .bare = titre court
style-variable-container-title = le titre de la revue ou du livre
    .bare = titre de la revue ou du livre
style-variable-container-title-short = le titre court de la revue
    .bare = titre court de la revue
style-variable-collection-title = la collection
    .bare = collection
style-variable-collection-number = le numéro dans la collection
    .bare = numéro dans la collection
style-variable-original-title = le titre original
    .bare = titre original
style-variable-reviewed-title = le titre de l’œuvre recensée
    .bare = titre de l’œuvre recensée
style-variable-author = l’auteur
    .bare = auteur
style-variable-editor = le directeur de publication
    .bare = directeur de publication
style-variable-translator = le traducteur
    .bare = traducteur
style-variable-container-author = l’auteur du livre
    .bare = auteur du livre
style-variable-collection-editor = le directeur de la collection
    .bare = directeur de la collection
style-variable-editorial-director = le directeur éditorial
    .bare = directeur éditorial
style-variable-original-author = l’auteur original
    .bare = auteur original
style-variable-reviewed-author = l’auteur de l’œuvre recensée
    .bare = auteur de l’œuvre recensée
style-variable-interviewer = l’intervieweur
    .bare = intervieweur
style-variable-recipient = le destinataire
    .bare = destinataire
style-variable-director = le réalisateur
    .bare = réalisateur
style-variable-composer = le compositeur
    .bare = compositeur
style-variable-illustrator = l’illustrateur
    .bare = illustrateur
style-variable-issued = la date
    .bare = date
style-variable-accessed = la date de consultation
    .bare = date de consultation
style-variable-original-date = la date originale
    .bare = date originale
style-variable-event-date = la date de l’événement
    .bare = date de l’événement
style-variable-submitted = la date de soumission
    .bare = date de soumission
style-variable-volume = le volume
    .bare = volume
style-variable-number-of-volumes = le nombre de volumes
    .bare = nombre de volumes
style-variable-issue = la livraison
    .bare = livraison
style-variable-edition = l’édition
    .bare = édition
style-variable-page = les pages
    .bare = pages
style-variable-page-first = la première page
    .bare = première page
style-variable-number-of-pages = le nombre de pages
    .bare = nombre de pages
style-variable-number = le numéro
    .bare = numéro
style-variable-chapter = le chapitre
    .bare = chapitre
style-variable-chapter-number = le numéro du chapitre
    .bare = numéro du chapitre
style-variable-publisher = l’éditeur
    .bare = éditeur
style-variable-publisher-place = le lieu de publication
    .bare = lieu de publication
style-variable-original-publisher = l’éditeur original
    .bare = éditeur original
style-variable-original-publisher-place = le lieu de publication original
    .bare = lieu de publication original
style-variable-locator = le repère cité
    .bare = repère cité
style-variable-citation-number = le numéro de la citation
    .bare = numéro de la citation
style-variable-citation-label = l’étiquette de la citation
    .bare = étiquette de la citation
style-variable-year-suffix = la lettre après l’année
    .bare = lettre après l’année
style-variable-first-reference-note-number = le numéro de la note où elle a été citée pour la première fois
    .bare = numéro de la note où elle a été citée pour la première fois
style-variable-DOI = le DOI
    .bare = DOI
style-variable-URL = l’adresse
    .bare = adresse
style-variable-ISBN = l’ISBN
    .bare = ISBN
style-variable-ISSN = l’ISSN
    .bare = ISSN
style-variable-PMID = le PMID
    .bare = PMID
style-variable-genre = le genre d’œuvre
    .bare = genre d’œuvre
style-variable-medium = le support
    .bare = support
style-variable-note = la note
    .bare = note
style-variable-annote = l’annotation
    .bare = annotation
style-variable-abstract = le résumé
    .bare = résumé
style-variable-archive = les archives
    .bare = archives
style-variable-archive_location = l’emplacement dans les archives
    .bare = emplacement dans les archives
style-variable-archive-place = le lieu des archives
    .bare = lieu des archives
style-variable-authority = l’autorité
    .bare = autorité
style-variable-call-number = la cote
    .bare = cote
style-variable-event = l’événement
    .bare = événement
style-variable-event-place = le lieu de l’événement
    .bare = lieu de l’événement
style-variable-event-title = le titre de l’événement
    .bare = titre de l’événement
style-variable-section = la section
    .bare = section
style-variable-source = la source
    .bare = source
style-variable-status = l’état de publication
    .bare = état de publication
style-variable-version = la version
    .bare = version
style-variable-language = la langue
    .bare = langue
style-variable-dimensions = les dimensions
    .bare = dimensions
style-variable-scale = l’échelle
    .bare = échelle
style-variable-references = les références
    .bare = références
style-variable-keyword = les mots-clés
    .bare = mots-clés
style-variable-jurisdiction = la juridiction
    .bare = juridiction
