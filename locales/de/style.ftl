# Reference styles: their kinds, the search for more, and the style editor,
# with the words it tells the parts of a style by.

## The kinds of reference style, as the styles are grouped by them.

style-kind-note = Anmerkungen
style-kind-author-date = Autor und Jahr
style-kind-numeric = Nummern
style-kind-label = Kürzel
style-kind-author = Autor
style-kind-other = Sonstige

## The search for reference styles of journals and publishers.

style-browser = Zitierstile
style-browser-subtitle = Mehr als zehntausend Stile von Zeitschriften und Verlagen, nach Namen
style-browser-placeholder = Der Name einer Zeitschrift, eines Verlags oder eines Stils
style-browser-search = Stile durchsuchen
# Beside a style that has been fetched already.
style-browser-here = Hier
style-browser-fetch = Holen
style-browser-none-found = Kein Stil hat diese Wörter in seinem Namen.
style-browser-about = Stile werden aus dem Repositorium des Projekts Citation Style Language geholt und bei Ihren eigenen aufbewahrt. Die Sie haben, können im Stileditor nach den Wünschen eines Verlags geändert werden.
style-browser-import = Datei importieren…
style-browser-import-title = Zitierstil importieren
style-browser-fetch-failed = Der Stil konnte nicht geholt werden.
style-browser-file-unread = Die Datei konnte nicht gelesen werden.

## The style editor.

style-editor = Zitierstil
style-name = Name des Stils
# The name a style of one's own is first given, made from that of the style it is made from.
style-name-changed = { $name }, geändert
style-depth = Wie tief
style-depth-options = Häufige Änderungen
style-depth-parts = Teil für Teil
style-depth-source = Quelltext
style-scope = Was geändert wird
style-scope-citations = Zitationen
style-scope-notes = Anmerkungen
style-scope-bibliography = Literaturverzeichnis
style-bundled = Stile, die mit Glaukopis kommen, bleiben, wie sie sind. Ihre Änderungen werden als eigener Stil gespeichert.
style-delete = Diesen Stil löschen
style-save-own = Als eigenen speichern
style-saved = „{ $name }“ ist unter Ihren eigenen Stilen gespeichert
style-read-failed = Der Stil konnte nicht gelesen werden.
style-save-failed = Der Stil konnte nicht gespeichert werden.
style-delete-failed = Der Stil konnte nicht gelöscht werden.
style-delete-title = Den Stil „{ $name }“ löschen?
style-delete-message = Karten, die ihn verwenden, verwenden stattdessen einen anderen Stil.
style-delete-confirm = Stil löschen
style-leave-title = Verlassen, ohne zu speichern?
style-leave-message = Die Änderungen, die Sie am Stil gemacht haben, gehen verloren.
style-leave-confirm = Verlassen
style-leave-cancel = Weiter bearbeiten

## Common changes: names.

style-names = Namen
# A sentence with two fields in it, where numbers are written: the least number of
# authors for which "et al." is used, and how many are named before it.
style-et-al = Ab { $min } Autoren die ersten { $first } nennen und „et al.“
style-et-al-min = Zahl der Autoren, ab der et al. verwendet wird
style-et-al-first = Zahl der vor et al. genannten Autoren
style-et-al-empty = Bleibt es leer, werden alle genannt
# As the one before, for a work that has been cited before.
style-et-al-again = Bei erneuter Zitation ab { $min } die ersten { $first } nennen
style-et-al-again-min = Zahl der Autoren, ab der et al. in späteren Zitationen verwendet wird
style-et-al-again-first = Zahl der in späteren Zitationen genannten Autoren
style-et-al-again-empty = Bleibt es leer, wie beim ersten Mal
style-before-last-name = Vor dem letzten Namen
# The word the style prints there, in the language of the document.
style-and-word = und
style-and-nothing = Nichts
style-as-the-style-has-it = Wie der Stil es hat
style-comma-before-last = Ein Komma davor
style-comma-contextual = Ab drei Namen: A, B, und C
style-comma-always = Immer: A, und B
style-comma-never = Nie: A, B und C
style-comma-after-inverted = Nach einem umgestellten Namen
style-given-names = Vornamen
style-given-full = Ausgeschrieben: John Miles
style-given-spaced = Initialen: J. M.
style-given-close = Initialen, eng: J.M.
style-given-bare = Initialen ohne Punkte: JM
style-given-bare-spaced = Initialen ohne Punkte: J M
style-family-first = Nachname zuerst
style-family-first-none = Bei niemandem: John Foley
style-family-first-first = Beim ersten Autor: Foley, John, und Robert Fowler
style-family-first-all = Bei allen: Foley, John, und Fowler, Robert
style-sort-separator = Zwischen Nach- und Vorname
style-sort-separator-hint = Wenn der Nachname zuerst steht

## Common changes: the citation, or the note, and the entries of the bibliography.

style-the-citation = Die Zitation
style-the-note = Die Anmerkung
style-begins-with = Beginnt mit
style-ends-with = Endet mit
style-between-works = Zwischen zusammen zitierten Werken
style-collapse = Zusammen zitierte Werke eines Autors
style-collapse-none = Jedes vollständig
style-collapse-year = Der Name einmal: Nagy 1979, 1996
style-collapse-year-suffix = Und das Jahr einmal: Nagy 1979a, b
style-collapse-year-suffix-ranged = Mit Bereichen: Nagy 1979a–c
style-collapse-citation-number = Nummern als Bereiche: [1–3]
style-disambiguate = Wenn zwei Werke gleich zitiert würden
style-disambiguate-year-suffix = Einen Buchstaben ans Jahr hängen
style-disambiguate-names = Mehr Autoren nennen
style-disambiguate-given-names = Vornamen oder Initialen hinzufügen
style-near-note = Eine Anmerkung gilt als nah innerhalb von
style-near-note-hint = Anmerkungen; für Stile, die kürzen, was in der Nähe zitiert wurde
style-entries = Die Einträge
style-entry-ends-with = Jeder endet mit
style-author-repeated = Bei wiederholtem Autor
style-author-repeated-hint = Anstelle des Namens, in den Einträgen nach dem ersten
style-hanging-indent = Hängender Einzug
style-hanging-indent-hint = Wie tief, entscheidet das Dokumentformat
style-second-field = Nummern oder Kürzel stehen
style-second-field-line = In der Zeile
style-second-field-column = In einer eigenen Spalte
style-second-field-margin = Am Rand
style-second-field-hint = Für Stile, die ihre Einträge nummerieren

## Common changes: throughout the style.

style-throughout = Durchgehend
style-page-ranges = Seitenbereiche
style-page-ranges-as-entered = Wie eingegeben
style-page-ranges-expanded = Vollständig: 321–328
style-page-ranges-minimal = Kürzest: 321–8
style-page-ranges-minimal-two = Mindestens zwei Ziffern: 321–28
style-page-ranges-chicago = Wie das Chicago Manual es hat
style-particles = „van“, „de“, „von“ vor einem Nachnamen
style-particles-never = Bleiben bei ihm, sortiert unter v, d
style-particles-sort-only = Bleiben bei ihm, aber ohne danach zu sortieren
style-particles-display-and-sort = Kommen hinter den Vornamen: Gogh, Vincent van
style-hyphen = Ein Bindestrich zwischen Initialen
style-hyphen-hint = J.-P. Sartre, nicht J.P. Sartre
style-locale = Die Wörter des Stils sind in
style-locale-document = Der Sprache des Dokuments
style-locale-hint = „Hrsg.“, „in“, „abgerufen“, die Monate

## Part by part.

# The scope is citation or bibliography.
style-parts-of = { $scope ->
    [citation] Teile der Zitation
   *[bibliography] Teile des Literaturverzeichnisses
}
style-parts-none = { $scope ->
    [citation] Dieser Stil hat keine Zitation.
   *[bibliography] Dieser Stil hat kein Literaturverzeichnis.
}
style-parts-hint = Wählen Sie links einen Teil, um zu ändern, wie er gedruckt wird: was davor und danach steht, seine Schrift, seine Großschreibung. Teile werden geöffnet, um zu zeigen, woraus sie bestehen.
style-part-unfold = Öffnen
style-part-fold = Schließen
style-part-up = Nach oben
style-part-down = Nach unten
style-part-add-after = Danach hinzufügen
style-part-take-away = Wegnehmen
style-part-add-within = Darin hinzufügen
# A part of a macro: a part of the style that is used in several places.
style-part-shared = Dies gehört zu „{ $macro }“, das an { $count } Stellen verwendet wird. Eine Änderung hier zeigt sich in allen.
style-add-words = Eigene Wörter
style-add-words-hint = Etwa „in“, „abgerufen“ oder Satzzeichen
# Over the fields of a reference that a part can print.
style-add-from-reference = Aus der Quelle
style-part-words = Die Wörter
style-part-before = Davor
style-part-before-hint = Nur gedruckt, wenn der Teil selbst es wird
style-part-after = Danach
style-part-between = Zwischen seinen Teilen
style-slant = Lage
style-slant-upright = Aufrecht
style-slant-italic = Kursiv
style-weight = Stärke
style-weight-regular = Normal
style-weight-bold = Fett
style-letters = Buchstaben
style-letters-as-written = Wie geschrieben
style-letters-small-caps = Kapitälchen
style-case = Großschreibung
style-case-as-entered = Wie eingegeben
style-case-title = Englische Titelschreibung
style-case-sentence = Wie ein Satz
style-case-capitalize-first = Erster Buchstabe groß
style-case-capitalize-all = Jedes Wort Groß
style-case-uppercase = GROSSBUCHSTABEN
style-case-lowercase = kleinbuchstaben
style-height = Höhe
style-height-baseline = Auf der Zeile
style-height-raised = Hochgestellt
style-height-lowered = Tiefgestellt
style-quotes = In Anführungszeichen
style-strip-periods = Ohne Punkte
style-strip-periods-hint = Für Abkürzungen: „Hrsg“ statt „Hrsg.“
style-text-form = Form
style-text-form-long = Vollständig
style-text-form-short = Kurz, wo die Quelle eine hat
style-term-form = Form des Wortes
style-term-form-long = Vollständig: Herausgeber, Seite
style-term-form-short = Kurz: Hrsg., S.
style-term-form-verb = Als Verb: herausgegeben von
style-term-form-verb-short = Als Verb, kurz: hrsg. von
style-term-form-symbol = Als Zeichen: §
style-date-parts = Das Datum wird angegeben
style-date-parts-year = Nur als Jahr
style-date-parts-year-month = Als Jahr und Monat
style-date-parts-full = Vollständig

## The source of the style, and the sample it is tried on.

style-source = Quelltext des Stils
style-source-try = Ausprobieren
style-source-unread = Der Quelltext konnte nicht gelesen werden.
style-sample-unusable = Der Stil kann so nicht verwendet werden
style-sample-failed = Der Stil konnte nicht ausprobiert werden.
style-sample-in-text = Im Text
style-sample-in-notes = In den Anmerkungen
style-sample-in-bibliography = Im Literaturverzeichnis
style-sample-cited = Ein zitiertes Werk
style-sample-same-page = Dasselbe, mit Seite
style-sample-another = Ein anderes, mit einem Wort davor
style-sample-first-again = Das erste noch einmal, mit Kapitel
style-sample-together = Zwei Werke zusammen
style-sample-in-sentence = Mit dem Autor im Satz
style-sample-examples = An Beispielen gezeigt: Ihre Bibliothek ist leer.
style-sample-library = An Werken aus Ihrer Bibliothek gezeigt.

## The source of a style, where it cannot be read as one.

style-source-not-xml = Der Quelltext ist kein wohlgeformtes XML.
style-source-not-style = Das ist kein Stil: er beginnt nicht mit <style>.
style-source-dependent = Der Stil hat keine <citation>: er nennt nur einen anderen Stil und kann nicht geändert werden.

## The parts of a style, as the style editor tells them in words.

style-part-layout = Das Ganze
style-part-text = Text
# A part that prints a word of the style's language: the term is its name in CSL.
style-part-term = Das Wort für „{ $term }“
# A part that prints words written into the style.
style-part-value = Die Wörter „{ $value }“
style-part-name = Wie die Namen geschrieben werden
# The name is family or given, as CSL has them.
style-part-name-part = { $name ->
    [family] Der Nachname
    [given] Der Vorname
   *[other] Der Namensteil „{ $name }“
}
style-part-et-al = „et al.“
# The variables are one or more of those below: "the pages".
style-part-label = Das Wort vor { $variables } („S.“, „Hrsg.“)
style-part-role = Das Wort für die Rolle („Hrsg.“, „Übers.“)
style-part-substitute = Wenn es keinen solchen Namen gibt, an seiner Stelle
# The name is day, month or year, as CSL has them, or part.
style-part-date-part = { $name ->
    [day] Der Tag
    [month] Der Monat
    [year] Das Jahr
   *[other] Der Teil „{ $name }“
}
style-part-group = Zusammen
style-part-choose = Eines davon
# The condition is made of those below.
style-part-if = Wenn { $condition }
style-part-else-if = Sonst, wenn { $condition }
style-part-else = Andernfalls
# A name the style has, of a part of it (a macro) or of a variable it does not know.
style-quoted = „{ $text }“

## Words that join others: "the author, or else the editor", "a book or a chapter".
## The first may be a list of several, joined by commas.

style-or = { $first } oder { $last }
style-and = { $first } und { $last }
style-or-else = { $first }, sonst { $last }

## When a part of a style is printed: "If the work is a book".

style-if-type = das Werk { $types } ist
style-if-has = es { $variables } hat
style-if-lacks = es { $variables } nicht hat
style-if-numeric = { $variables } eine Zahl ist
style-if-uncertain = { $variables } unsicher ist
# The places are pages, chapters, verses and the like; see style-locator.
style-if-locator = die zitierte Stelle { $locators } ist
style-if-disambiguate = es sonst mit einem anderen verwechselt würde
style-if-always = immer
style-if-none-holds = nichts davon gilt: { $conditions }
# A kind of place that a citation points to, as CSL names it: page, chapter, verse,
# sub-verbo, and so on. English leaves the names as they are.
style-locator = { $name }

## When a citation is printed, by where it stands among the others.

style-position-first = es zum ersten Mal zitiert wird
style-position-subsequent = es schon zitiert wurde
style-position-ibid = es dasselbe ist wie die Zitation davor
style-position-ibid-with-locator = es dasselbe ist wie die Zitation davor, an anderer Stelle
style-position-near-note = es in einer Anmerkung in der Nähe zitiert wurde

## How a part is set: "italic, in quotation marks, before “, ”".

style-form-italic = kursiv
style-form-bold = fett
style-form-small-caps = Kapitälchen
style-form-underlined = unterstrichen
style-form-quoted = in Anführungszeichen
# How the letters are set, as CSL names it; the words are that name with spaces for its dashes.
style-form-case = { $case ->
    [lowercase] kleinbuchstaben
    [uppercase] GROSSBUCHSTABEN
    [capitalize-first] erster Buchstabe groß
    [capitalize-all] jedes Wort groß
    [sentence] wie ein Satz
    [title] englische Titelschreibung
   *[other] { $words }
}
style-form-raised = hochgestellt
style-form-lowered = tiefgestellt
# The part comes after these words.
style-form-after = nach „{ $text }“
# The part comes before these words.
style-form-before = vor „{ $text }“
style-form-between = mit „{ $text }“ dazwischen

## The kinds of work a reference is of, as CSL names them.

style-type-book = ein Buch
style-type-chapter = ein Kapitel
style-type-article-journal = ein Artikel in einer Zeitschrift
style-type-article-magazine = ein Artikel in einem Magazin
style-type-article-newspaper = ein Artikel in einer Zeitung
style-type-article = ein Artikel
style-type-thesis = eine Hochschulschrift
style-type-report = ein Bericht
style-type-webpage = eine Webseite
style-type-paper-conference = ein Tagungsbeitrag
style-type-entry-encyclopedia = ein Eintrag in einer Enzyklopädie
style-type-entry-dictionary = ein Eintrag in einem Wörterbuch
style-type-entry = ein Eintrag
style-type-review = eine Rezension
style-type-review-book = eine Rezension eines Buches
style-type-manuscript = ein Manuskript
style-type-personal_communication = ein Brief oder eine andere Mitteilung
style-type-legal_case = eine Gerichtsentscheidung
style-type-legislation = ein Gesetz
style-type-bill = ein Gesetzentwurf
style-type-patent = ein Patent
style-type-dataset = ein Datensatz
style-type-software = Software
style-type-motion_picture = ein Film
style-type-broadcast = eine Sendung
style-type-song = eine Aufnahme
style-type-speech = ein Vortrag
style-type-interview = ein Interview
style-type-graphic = ein Bild
style-type-map = eine Landkarte
style-type-pamphlet = eine Broschüre
style-type-post-weblog = ein Blogbeitrag
style-type-post = ein Beitrag
style-type-classic = ein klassisches Werk
style-type-collection = eine Sammlung
style-type-document = ein Dokument
style-type-standard = eine Norm
style-type-treaty = ein Vertrag
style-type-periodical = eine Zeitschrift
style-type-musical_score = eine Partitur
style-type-figure = eine Abbildung
style-type-event = eine Veranstaltung
style-type-performance = eine Aufführung
style-type-regulation = eine Verordnung
style-type-hearing = eine Anhörung

## What a reference has, as CSL names it: with its article, and without it
## (.bare) as a field of a reference is named.

style-variable-title = den Titel
    .bare = Titel
style-variable-title-short = den Kurztitel
    .bare = Kurztitel
style-variable-container-title = den Titel der Zeitschrift oder des Buches
    .bare = Titel der Zeitschrift oder des Buches
style-variable-container-title-short = den Kurztitel der Zeitschrift
    .bare = Kurztitel der Zeitschrift
style-variable-collection-title = die Reihe
    .bare = Reihe
style-variable-collection-number = die Nummer in der Reihe
    .bare = Nummer in der Reihe
style-variable-original-title = den Originaltitel
    .bare = Originaltitel
style-variable-reviewed-title = den Titel des rezensierten Werks
    .bare = Titel des rezensierten Werks
style-variable-author = den Autor
    .bare = Autor
style-variable-editor = den Herausgeber
    .bare = Herausgeber
style-variable-translator = den Übersetzer
    .bare = Übersetzer
style-variable-container-author = den Autor des Buches
    .bare = Autor des Buches
style-variable-collection-editor = den Herausgeber der Reihe
    .bare = Herausgeber der Reihe
style-variable-editorial-director = den Leiter der Redaktion
    .bare = Leiter der Redaktion
style-variable-original-author = den ursprünglichen Autor
    .bare = ursprünglicher Autor
style-variable-reviewed-author = den Autor des rezensierten Werks
    .bare = Autor des rezensierten Werks
style-variable-interviewer = den Interviewer
    .bare = Interviewer
style-variable-recipient = den Empfänger
    .bare = Empfänger
style-variable-director = den Regisseur
    .bare = Regisseur
style-variable-composer = den Komponisten
    .bare = Komponist
style-variable-illustrator = den Illustrator
    .bare = Illustrator
style-variable-issued = das Datum
    .bare = Datum
style-variable-accessed = das Abrufdatum
    .bare = Abrufdatum
style-variable-original-date = das ursprüngliche Datum
    .bare = ursprüngliches Datum
style-variable-event-date = das Datum der Veranstaltung
    .bare = Datum der Veranstaltung
style-variable-submitted = das Datum der Einreichung
    .bare = Datum der Einreichung
style-variable-volume = den Band
    .bare = Band
style-variable-number-of-volumes = die Zahl der Bände
    .bare = Zahl der Bände
style-variable-issue = das Heft
    .bare = Heft
style-variable-edition = die Auflage
    .bare = Auflage
style-variable-page = die Seiten
    .bare = Seiten
style-variable-page-first = die erste Seite
    .bare = erste Seite
style-variable-number-of-pages = die Seitenzahl
    .bare = Seitenzahl
style-variable-number = die Nummer
    .bare = Nummer
style-variable-chapter = das Kapitel
    .bare = Kapitel
style-variable-chapter-number = die Nummer des Kapitels
    .bare = Nummer des Kapitels
style-variable-publisher = den Verlag
    .bare = Verlag
style-variable-publisher-place = den Erscheinungsort
    .bare = Erscheinungsort
style-variable-original-publisher = den ursprünglichen Verlag
    .bare = ursprünglicher Verlag
style-variable-original-publisher-place = den ursprünglichen Erscheinungsort
    .bare = ursprünglicher Erscheinungsort
style-variable-locator = die zitierte Stelle
    .bare = zitierte Stelle
style-variable-citation-number = die Nummer der Zitation
    .bare = Nummer der Zitation
style-variable-citation-label = das Kürzel der Zitation
    .bare = Kürzel der Zitation
style-variable-year-suffix = den Buchstaben nach dem Jahr
    .bare = Buchstabe nach dem Jahr
style-variable-first-reference-note-number = die Nummer der Anmerkung, in der es zuerst zitiert wurde
    .bare = Nummer der Anmerkung, in der es zuerst zitiert wurde
style-variable-DOI = die DOI
    .bare = DOI
style-variable-URL = die Adresse
    .bare = Adresse
style-variable-ISBN = die ISBN
    .bare = ISBN
style-variable-ISSN = die ISSN
    .bare = ISSN
style-variable-PMID = die PMID
    .bare = PMID
style-variable-genre = die Art des Werks
    .bare = Art des Werks
style-variable-medium = das Medium
    .bare = Medium
style-variable-note = die Anmerkung
    .bare = Anmerkung
style-variable-annote = die Annotation
    .bare = Annotation
style-variable-abstract = die Zusammenfassung
    .bare = Zusammenfassung
style-variable-archive = das Archiv
    .bare = Archiv
style-variable-archive_location = die Stelle im Archiv
    .bare = Stelle im Archiv
style-variable-archive-place = den Ort des Archivs
    .bare = Ort des Archivs
style-variable-authority = die Behörde
    .bare = Behörde
style-variable-call-number = die Signatur
    .bare = Signatur
style-variable-event = die Veranstaltung
    .bare = Veranstaltung
style-variable-event-place = den Ort der Veranstaltung
    .bare = Ort der Veranstaltung
style-variable-event-title = den Titel der Veranstaltung
    .bare = Titel der Veranstaltung
style-variable-section = den Abschnitt
    .bare = Abschnitt
style-variable-source = die Quelle
    .bare = Quelle
style-variable-status = den Stand der Veröffentlichung
    .bare = Stand der Veröffentlichung
style-variable-version = die Version
    .bare = Version
style-variable-language = die Sprache
    .bare = Sprache
style-variable-dimensions = die Maße
    .bare = Maße
style-variable-scale = den Maßstab
    .bare = Maßstab
style-variable-references = die Verweise
    .bare = Verweise
style-variable-keyword = die Schlagwörter
    .bare = Schlagwörter
style-variable-jurisdiction = die Gerichtsbarkeit
    .bare = Gerichtsbarkeit
