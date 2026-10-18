# The settings.

settings-title = Réglages
settings-error-system = Quelque chose de l’application n’a pas pu être lu
settings-error-read = Les réglages n’ont pas pu être lus
settings-error-save = Les réglages n’ont pas pu être enregistrés

## Appearance

settings-appearance = Apparence
settings-theme = Couleurs
settings-theme-system = Comme le système
settings-theme-light = Clair
settings-theme-dark = Sombre
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Doux
settings-theme-own = Les vôtres
settings-own = Vos propres couleurs
settings-own-hint = Quatre couleurs, dont découlent les autres : le papier, l’encre, l’accent qui marque ce qui est choisi et pressé, et la seconde voix qui marque les associations et les commentaires. Que le jeu soit clair ou sombre découle du papier.
settings-own-paper = Papier
settings-own-ink = Encre
settings-own-accent = Accent
settings-own-gold = Seconde voix
settings-own-begin = Partir de
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Difficile à lire : l’encre est à { $ink } pour 1 sur le papier et l’accent à { $accent } pour 1 ; 4,5 et 3 ou plus se lisent bien.
settings-text-size = Taille de votre texte dans l’éditeur
settings-text-size-hint = Par rapport à l’interface. Les tailles de police de l’aperçu du document et de l’exportation n’en dépendent pas.
settings-editor-font = Police de l’éditeur
settings-editor-font-hint = Choisissez la police de votre texte dans l’éditeur.
settings-editor-font-default = Comme l’interface (Literata)
# How the text of a map shows how deep each element stands: on the screen only.
# How the text editor shows how deep each element stands: on the screen only.
settings-text-depth = Structure du document
settings-text-depth-hint = Comment l’éditeur affiche la structure de votre texte.
settings-text-depth-numbers = Numéros
settings-text-depth-dots = Points
settings-text-depth-indent = En retrait, avec des lignes
settings-interface-size = Taille de l’interface
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
# A sentence with every letter of the language's alphabet (a pangram), set in
# the size and the font chosen; where no good pangram is known, the alphabet.
settings-sample = Voix ambiguë d’un cœur qui, au zéphyr, préfère les jattes de kiwis.
# The three levels of the sample of the document structure, the sample sentence under the third.
settings-sample-heading = Titre
settings-sample-subheading = Sous-titre
settings-sample-third = Un troisième niveau

## New documents

settings-new-documents = Nouveaux documents
# Whether a new project opens in its diagram or in its text; the choices are the names of the two views.
settings-new-project-view = Vue des nouveaux projets
settings-new-project-view-hint = La vue dans laquelle s’ouvre un projet qui vient d’être créé.
settings-template = Modèle
settings-document-format = Mise en page
settings-reference-style = Style de référence

## You

settings-you = Vos coordonnées
settings-first-name = Prénom
settings-last-name = Nom
settings-organization = Organisation
settings-position = Titre/Fonction
settings-address = Adresse
settings-phone = Téléphone
settings-email = Courriel
settings-orcid = ORCID
settings-orcid-problem = Un identifiant ORCID se compose de quatre groupes de quatre chiffres : 0000-0002-1825-0097.
settings-contact-problem = Cela ne ressemble pas à une adresse.

## Programs: Pandoc and Typst

settings-programs = Programmes
settings-programs-about = Glaukopis fait les documents avec Pandoc, qui est trouvé de lui-même là où il est installé de la façon habituelle. Les pages de l’aperçu et d’un PDF sont composées par Typst, qui fait partie de Glaukopis.
settings-pandoc-need = Nécessaire pour l’aperçu et pour toute exportation.
settings-looking = Recherche…
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = Introuvable. { $need } Installez-le avec le gestionnaire de paquets de votre système, ou indiquez ci-dessous où il se trouve.
settings-program-old = Plus ancien que ce dont Glaukopis a besoin : { $least } ou plus récent.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Où est { $program }
settings-program-found-by-itself = Trouvé de lui-même
settings-no-latex = Aucun LaTeX n’a été trouvé. Il n’est pas nécessaire : la source LaTeX peut être exportée sans lui, et le PDF est fait avec Typst.
settings-look-again = Chercher de nouveau
settings-error-programs = Les programmes n’ont pas pu être cherchés

## About

settings-about = À propos
settings-licence = Logiciel libre sous la GNU General Public License, version 3 ou ultérieure. Il est fourni sans garantie.
settings-data = Où tout est gardé
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Vos références sont dans { $file }, que tout outil BibLaTeX peut lire. Pour garder une copie de votre travail, copiez ce dossier.

## Language

settings-language = Langue
settings-language-interface = L’interface
settings-language-system = Comme le système ({ $language })
settings-language-texts = Langue des nouveaux textes

## The log of the runs.

settings-logs = Le journal
settings-logs-hint = { $count ->
    [one] Ce que Glaukopis a dit de lui-même à son dernier lancement : ce qu’il a fait, ce qui s’est mal passé, et ce qu’est devenue sa fenêtre. Utile quand quelque chose s’est mal passé sans que personne ne voie pourquoi.
    [many] Ce que Glaukopis a dit de lui-même à chacun de ses { $count } derniers lancements : ce qu’il a fait, ce qui s’est mal passé, et ce qu’est devenue sa fenêtre. Utile quand quelque chose s’est mal passé sans que personne ne voie pourquoi.
   *[other] Ce que Glaukopis a dit de lui-même à chacun de ses { $count } derniers lancements : ce qu’il a fait, ce qui s’est mal passé, et ce qu’est devenue sa fenêtre. Utile quand quelque chose s’est mal passé sans que personne ne voie pourquoi.
}
