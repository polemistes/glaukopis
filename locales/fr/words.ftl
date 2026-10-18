# The words of a language made into a project, to be read through and
# mended in Glaukopis, and written back as Fluent files (ADR 0034). In the
# settings of languages, and over such a project. See locales/README.md.

words-title = Créer un projet de traduction des chaînes de Glaukopis
words-hint = Pour les traducteurs de l’interface de Glaukopis. Chacun peut aussi s’en servir pour changer les chaînes de l’interface dans la langue de son choix, dans sa propre installation de Glaukopis.
words-language = Langue
words-make = Créer le projet
words-making = Création…
words-make-failed = Le projet de mots n’a pas pu être créé
# $language is the name of the language: "Norwegian Bokmål".
words-project-name = Mots : { $language }
words-not-a-project = Ce projet ne contient aucun mot de Glaukopis.
words-bar = Les mots de Glaukopis pour « { $language } ». Changez les mots sous l’anglais ; ce que vous changez est réécrit en fichiers Fluent.
words-write = Écrire en fichiers Fluent…
words-writing = Écriture…
words-write-choose = Le dossier des fichiers Fluent de la langue
words-write-failed = Les mots n’ont pas pu être écrits
# $count is how many messages; $files how many files.
words-written = { $count ->
    [0] Rien n’a été changé, et rien n’a été écrit.
    [one] Un message a été écrit, dans { $files ->
        [one] un fichier
        [many] { $files } fichiers
       *[other] { $files } fichiers
    }.
    [many] { $count } messages ont été écrits, dans { $files ->
        [one] un fichier
        [many] { $files } fichiers
       *[other] { $files } fichiers
    }.
   *[other] { $count } messages ont été écrits, dans { $files ->
        [one] un fichier
        [many] { $files } fichiers
       *[other] { $files } fichiers
    }.
}
words-result-title = Les mots écrits
words-conflicts = Changés dans les fichiers depuis la création du projet, et laissés tels que les fichiers les ont
words-refused = Non écrits, à corriger dans le projet
# $detail says more: the variables it has and must have, the plural forms it lacks.
words-refused-fluent = ce n’est pas du Fluent correct : { $detail }
words-refused-variables = ses variables ne sont pas celles de l’anglais : { $detail }
words-refused-reference = il renvoie à { $detail }, ce que l’anglais ne fait pas
words-refused-plurals = ses formes du pluriel ne sont pas celles de la langue : { $detail }
words-refused-missing = l’anglais n’a pas ce message, ou le texte du message n’a pas été écrit
words-refused-file = le fichier { $detail } ne se lirait plus ensuite

# Putting the changed words to use at once, without a new version of
# Glaukopis (ADR 0035): they are written into the data directory and laid
# over the words Glaukopis came with.
words-use = Les utiliser maintenant
words-using = Mise en usage…
words-use-hint = Met aussitôt en usage ce que vous avez changé, à la place des mots fournis avec Glaukopis, sans nouvelle version. Cela n’écrit pas les fichiers Fluent.
words-use-failed = Les mots n’ont pas pu être mis en usage
# $count is how many messages.
words-used = { $count ->
    [0] Rien n’a été changé, et rien n’a été mis en usage.
    [one] Un message est désormais en usage.
    [many] { $count } messages sont désormais en usage.
   *[other] { $count } messages sont désormais en usage.
}
words-used-title = Les mots mis en usage
words-used-refused = Non mis en usage, à corriger dans le projet
# $languages are the names of the languages: "English, Norwegian Bokmål".
words-own-in-use = Des mots que vous avez changés sont en usage, à la place de ceux fournis avec Glaukopis, pour { $languages }.
words-own-remove = Les retirer
words-own-remove-title = Retirer les mots que vous avez changés ?
words-own-remove-message = Les mots que vous avez mis en usage pour { $languages } sont retirés, et ceux fournis avec Glaukopis sont de nouveau utilisés. Les projets de mots sont gardés.
words-own-removed = Les mots fournis avec Glaukopis sont de nouveau utilisés.
words-own-remove-failed = Les mots que vous avez changés n’ont pas pu être retirés
