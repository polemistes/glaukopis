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
settings-text-size = Taille de votre texte
settings-text-size-hint = Dans les cartes et la vue texte. Ce qui est exporté suit le format du document.
settings-interface-size = Taille de l’interface
settings-interface-size-hint = Tout dans la fenêtre, l’écriture comprise. Pour votre texte seul, la taille ci-dessous.
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
settings-sample = Chante, déesse, la colère d’Achille, le fils de Pélée

## New documents

settings-new-documents = Nouveaux documents
settings-new-documents-hint = Ce par quoi une carte commence. Chaque carte peut en recevoir un autre, dans l’aperçu.
settings-reference-style = Style de référence
settings-document-format = Format du document

## You

settings-you = Vous
settings-name = Nom
settings-name-hint = Montré à ceux avec qui vous partagez des projets. Pas utilisé autrement.
settings-contact = Adresse pour les services bibliographiques
settings-contact-hint = Des services comme Crossref répondent plus volontiers à ceux qui disent comment les joindre. Si vous entrez une adresse, elle leur est envoyée à chaque recherche, et à personne d’autre. Laissez vide pour n’en envoyer aucune.
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
settings-owl = La chouette est dessinée par Robert Emil Berge, d’après une photographie d’un tétradrachme athénien par Classical Numismatic Group, Inc. (http://www.cngcoins.com). Le dessin est sous licence Creative Commons Attribution – Partage dans les mêmes conditions 3.0 non transposé.
settings-data = Où tout est gardé
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Vos références sont dans { $file }, que tout outil BibLaTeX peut lire. Pour garder une copie de votre travail, copiez ce dossier.
settings-lookup = Où les références sont cherchées
settings-lookup-about = Les DOI à doi.org, Crossref et DataCite ; les livres dans les catalogues K10plus, des bibliothèques universitaires norvégiennes, de la Deutsche Nationalbibliothek et de la Library of Congress ; les prépublications à arXiv ; la littérature médicale à PubMed. Seul ce que vous tapez dans la recherche leur est envoyé.

## Language

settings-language = Langue
settings-language-interface = L’interface
settings-language-interface-hint = Les mots de l’application. Vos textes sont dans la langue de leurs cartes.
settings-language-system = Comme le système ({ $language })
settings-language-texts = Langue des nouveaux textes
settings-language-texts-hint = Dans quoi s’écrit une nouvelle carte, ce qui décide des mots que son document imprime et du dictionnaire qui vérifie son orthographe. Chaque carte peut en recevoir une autre sous Langues… dans son menu, et un projet une langue à lui pour ses nouvelles cartes.
