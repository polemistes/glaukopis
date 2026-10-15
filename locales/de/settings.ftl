# The settings.

settings-title = Einstellungen
settings-error-system = Etwas an der Anwendung konnte nicht gelesen werden
settings-error-read = Die Einstellungen konnten nicht gelesen werden
settings-error-save = Die Einstellungen konnten nicht gespeichert werden

## Appearance

settings-appearance = Erscheinungsbild
settings-theme = Farben
settings-theme-system = Wie das System
settings-theme-light = Hell
settings-theme-dark = Dunkel
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Sanft
settings-theme-own = Eigene
settings-own = Ihre eigenen Farben
settings-own-hint = Vier Farben, aus denen die übrigen folgen: das Papier, die Tinte, der Akzent, der markiert, was gewählt und gedrückt ist, und die zweite Stimme, die Verbindungen und Kommentare markiert. Ob das Schema hell oder dunkel ist, folgt aus dem Papier.
settings-own-paper = Papier
settings-own-ink = Tinte
settings-own-accent = Akzent
settings-own-gold = Zweite Stimme
settings-own-begin = Ausgehen von
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Schwer zu lesen: die Tinte steht auf dem Papier bei { $ink } zu 1 und der Akzent bei { $accent } zu 1; 4,5 und 3 oder mehr lesen sich gut.
settings-text-size = Größe Ihres Textes
settings-text-size-hint = In den Karten und der Textansicht. Was exportiert wird, folgt dem Dokumentformat.
settings-interface-size = Größe der Oberfläche
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
settings-sample = Singe den Zorn, o Göttin, des Peleiaden Achilleus

## New documents

settings-new-documents = Neue Dokumente
settings-reference-style = Zitierstil
settings-document-format = Dokumentformat

## You

settings-you = Sie
settings-contact-problem = Das sieht nicht wie eine Adresse aus.

## Programs: Pandoc and Typst

settings-programs = Programme
settings-programs-about = Glaukopis erzeugt Dokumente mit Pandoc, das von selbst gefunden wird, wo es auf die übliche Weise installiert ist. Die Seiten der Vorschau und eines PDF setzt Typst, das Teil von Glaukopis ist.
settings-pandoc-need = Nötig für die Vorschau und für jeden Export.
settings-looking = Wird gesucht…
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = Nicht gefunden. { $need } Installieren Sie es mit der Paketverwaltung Ihres Systems, oder geben Sie unten an, wo es ist.
settings-program-old = Älter, als Glaukopis braucht: { $least } oder neuer.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Wo { $program } ist
settings-program-found-by-itself = Von selbst gefunden
settings-no-latex = Kein LaTeX gefunden. Es wird nicht gebraucht: LaTeX-Quelltext kann ohne es exportiert werden, und PDF wird mit Typst erzeugt.
settings-look-again = Noch einmal nachsehen
settings-error-programs = Nach den Programmen konnte nicht gesucht werden

## About

settings-about = Über
settings-licence = Freie Software unter der GNU General Public License, Version 3 oder später. Sie kommt ohne Gewähr.
settings-data = Wo alles aufbewahrt wird
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Ihre Quellen sind in { $file }, das jedes BibLaTeX-Werkzeug lesen kann. Um eine Kopie Ihrer Arbeit zu behalten, kopieren Sie diesen Ordner.

## Language

settings-language = Sprache
settings-language-interface = Die Oberfläche
settings-language-system = Wie das System ({ $language })
settings-language-texts = Sprache neuer Texte
