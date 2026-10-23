# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

about-sections = Bereiche des Fensters

## The parts of the window, as they stand down its left.

about-section-details = Angaben
about-section-language = Sprache
about-section-checklist = Checkliste

## The template.

## The details: what stands on the first page, and in the metadata of the files.

about-details-hint = Was auf der ersten Seite steht und was die Dateien als Metadaten tragen. Alles andere wird im Baum geschrieben.
about-title = Titel
about-title-placeholder = Der Name des Elements
about-title-hint = Bleibt das Feld leer, ist der Name des Elements der Titel.
about-subtitle = Untertitel
about-authors = Autoren
about-name = Name
about-author-name = Name von Autor { $number }
about-affiliation = Institution
about-author-affiliation = Institution von Autor { $number }
about-email = E-Mail
about-author-email = E-Mail von Autor { $number }
about-orcid = ORCID
about-author-orcid = ORCID von Autor { $number }
# Beside a plus, under the authors: adds one.
about-add-author = Autor
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
about-requirement-anonymous = Zur Begutachtung: die Autoren bleiben aus dem Dokument weg.
