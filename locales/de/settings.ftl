# The settings.

settings-title = Einstellungen
settings-error-system = Etwas an der Anwendung konnte nicht gelesen werden
settings-error-read = Die Einstellungen konnten nicht gelesen werden
settings-error-save = Die Einstellungen konnten nicht gespeichert werden
settings-error-fonts = Die Schriften dieses Computers konnten nicht aufgelistet werden
settings-error-templates = Die Vorlagen konnten nicht aufgelistet werden
# A damaged file of settings was renamed and left beside where it was; $path is where it is now.
settings-set-aside = Die Einstellungen konnten nicht gelesen werden und sind als { $path } beiseitegelegt; die Standardeinstellungen gelten
settings-set-aside-person = Die Einstellungen konnten nicht gelesen werden und sind als { $path } beiseitegelegt; die Standardeinstellungen gelten, und dieser Computer ist im Verlauf der Projekte eine neue Person

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
settings-own-paper = Papier
settings-own-ink = Tinte
settings-own-accent = Akzent
settings-own-gold = Zweite Stimme
settings-own-begin = Ausgehen von
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Schwer zu lesen: die Tinte steht auf dem Papier bei { $ink } zu 1 und der Akzent bei { $accent } zu 1; 4,5 und 3 oder mehr lesen sich gut.
settings-text-size = Größe Ihres Textes im Editor
settings-editor-font = Schrift des Editors
settings-editor-font-default = Wie die Oberfläche (Literata)
# How the text of a map shows how deep each element stands: on the screen only.
# How the text editor shows how deep each element stands: on the screen only.
settings-text-depth = Aufbau des Dokuments
settings-text-depth-numbers = Nummern
settings-text-depth-dots = Punkte
settings-text-depth-indent = Eingezogen, mit Linien
settings-interface-size = Größe der Oberfläche
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
# A sentence with every letter of the language's alphabet (a pangram), set in
# the size and the font chosen; where no good pangram is known, the alphabet.
settings-sample = Victor jagt zwölf Boxkämpfer quer über den großen Sylter Deich.
# The three levels of the sample of the document structure, the sample sentence under the third.
settings-sample-heading = Überschrift
settings-sample-subheading = Unterüberschrift
settings-sample-third = Eine dritte Ebene

## New documents

settings-new-documents = Neue Dokumente

## You

settings-you = Ihre Angaben
settings-first-name = Vorname
settings-last-name = Nachname
settings-organization = Organisation
settings-position = Titel/Position
settings-address = Adresse
settings-phone = Telefon
settings-email = E-Mail
settings-orcid = ORCID
settings-orcid-problem = Eine ORCID iD besteht aus vier Gruppen von je vier Ziffern: 0000-0002-1825-0097.
settings-contact-problem = Das sieht nicht wie eine Adresse aus.

## Programs: Pandoc and Typst

settings-programs = Programme
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

## Language

settings-language = Sprache
settings-language-interface = Die Oberfläche
settings-language-system = Wie das System ({ $language })
settings-language-texts = Sprache neuer Texte
# The words of the language chosen for the interface could not be read; it stays in the one it was in.
settings-language-error-load = Die Texte der Oberfläche für { $language } konnten nicht geladen werden

## The log of the runs.

settings-logs = Das Protokoll

## What a line of the preview is: whether a chip at the edge of a page names it.

settings-page-chips-on = Ein
settings-page-chips-off = Aus

## The settings in plain words, stage 1: the defaults of new projects and documents, and the look chips.

# Whether a new project opens in its diagram or in its text; the choices are the names of the two views.
settings-default-view = Standardansicht für neue Projekte
settings-default-type = Standard-Dokumenttyp
settings-default-look = Standard-Aussehen
settings-default-style = Standard-Zitierstil
# The first choice of each of the three defaults: none, so that a new document is of the plain type, and the type's look and style hold.
settings-default-none = Keine, wie der Dokumenttyp es vorsieht
# Whether a line of the preview, pressed, shows a chip at the edge of the page that says what it is and opens Look at it.
settings-look-chips = Etiketten des Aussehens in der Vorschau zeigen
