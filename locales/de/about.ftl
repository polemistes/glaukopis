# Document properties: what an element's document says of itself, its
# details, its type (what you are writing, its template), its language and
# the checklist of what its template requires. How it looks and what it
# contains are set in Look.

about-window = Dokumenteigenschaften
# In the menu of an element, and at the foot of Look.
about-menu = Dokumenteigenschaften…
about-sections = Bereiche des Fensters

## The parts of the window, as they stand down its left.

about-section-details = Angaben
about-section-language = Sprache
about-section-checklist = Checkliste

## The template.

## The details: what stands on the first page, and in the metadata of the files.

about-title = Titel
about-title-placeholder = Der Name des Elements
about-subtitle = Untertitel
about-name = Name
about-affiliation = Institution
about-email = E-Mail
about-orcid = ORCID
about-date = Datum
about-date-placeholder = Wie es gedruckt werden soll
about-keywords = Schlüsselwörter
about-keywords-placeholder = Durch Kommas getrennt
about-keywords-count = { $count ->
    [one] { $count } Schlüsselwort
   *[other] { $count } Schlüsselwörter
}
# The keywords given, and the most the template allows.
about-keywords-of = { $count } von { $limit }
about-identifiers = Kennungen
about-identifier-isbn = ISBN
about-identifier-edition = Auflage
about-identifier-publisher = Verlag
about-identifier-place = Ort
about-identifier-doi = DOI
about-identifier-name = Name einer weiteren Kennung
about-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
about-identifier-add = Kennung

## The parts: the kinds of elements the template gives the document a place for.

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

## The language.

about-language = Sprache des Textes

## The checklist: what the template requires, against what the tree holds.

about-checklist-hint = Was die Vorlage verlangt, gemessen am Text und am Baum. Gekürzt wird nichts.
about-checklist-clear = Nichts anzumerken.
about-requirement-words = Wörter im Text
about-requirement-anonymous = Zur Begutachtung: die Mitwirkenden bleiben aus dem Dokument weg.

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# The tab of what the document is: what you are writing, its template.
about-section-type = Dokumenttyp

## Fewer words, stage 3: the source of a layout's requirements, under the layout the type brings.

about-layout-source = Quelle: { $name }

## The contributors, stage 3: the persons of a document, each with a role.

about-contributors = Mitwirkende
# Beside a plus, under the contributors: adds one.
about-add-contributor = Person hinzufügen
about-contributor-role = Rolle von Person { $number }
about-role-author = Autor
about-role-editor = Herausgeber
about-role-translator = Übersetzer
about-contributor-name = Name von Person { $number }
about-contributor-affiliation = Institution von Person { $number }
about-contributor-email = E-Mail von Person { $number }
about-contributor-orcid = ORCID von Person { $number }
# Under the details: whether every line of the printed page is numbered in the margin.
about-page-lines = Jede Zeile der gedruckten Seite nummerieren
