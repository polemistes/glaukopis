# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

document-window = Dokumenteinstellungen
# In the menu of an element, and the button over the preview.
document-window-menu = Dokumenteinstellungen…
document-window-sections = Bereiche des Fensters
# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
document-window-usual = Wie gewohnt ({ $name })
# The first choice of a layout or a style: what the template brings, named.
document-window-as-template = Wie die Vorlage es vorsieht ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
document-window-from-with = Von { $name } ({ $what })

## The parts of the window, as they stand down its left.

document-window-section-template = Vorlage
document-window-section-details = Angaben
document-window-section-parts = Teile
document-window-section-look = Aussehen
document-window-section-language = Sprache
document-window-section-checklist = Checkliste

## The template.

document-window-template-hint = Woraus das Dokument besteht: seine Teile in ihrer Folge, die Arten, die es zur Hand gibt, seine Vorgaben und das Layout und der Zitierstil, die es mitbringt.
document-window-template-search = Vorlagen durchsuchen
document-window-template-search-placeholder = Eine Textsorte, eine Zeitschrift, ein Verlag…
document-window-template-none-found = Keine Vorlage heißt so.
# Takes the template of the element over this one again, in place of this element's own.
document-window-template-again = Wieder von { $name } übernehmen
document-window-template-usual-again = Wieder die gewohnte nehmen
document-window-template-layout = Layout: { $layout }
document-window-template-style = Zitierstil: { $style }
document-window-template-change = Diese Vorlage ändern…
document-window-template-new = Neue Vorlage…
# A template the project carries a copy of, that is not among the writer's own on this computer.
document-window-template-of-project = Im Projekt aufbewahrt: nicht unter Ihren eigenen Vorlagen auf diesem Computer.

## The details: what stands on the first page, and in the metadata of the files.

document-window-details-hint = Was auf der ersten Seite steht und was die Dateien als Metadaten tragen. Alles andere wird im Baum geschrieben.
document-window-title = Titel
document-window-title-placeholder = Der Name des Elements
document-window-title-hint = Bleibt das Feld leer, ist der Name des Elements der Titel.
document-window-subtitle = Untertitel
document-window-authors = Autoren
document-window-name = Name
document-window-author-name = Name von Autor { $number }
document-window-affiliation = Institution
document-window-author-affiliation = Institution von Autor { $number }
document-window-email = E-Mail
document-window-author-email = E-Mail von Autor { $number }
document-window-orcid = ORCID
document-window-author-orcid = ORCID von Autor { $number }
# Beside a plus, under the authors: adds one.
document-window-add-author = Autor
document-window-date = Datum
document-window-date-placeholder = Wie es gedruckt werden soll
document-window-keywords = Schlüsselwörter
document-window-keywords-placeholder = Durch Kommas getrennt
document-window-keywords-count = { $count ->
    [one] { $count } Schlüsselwort
   *[other] { $count } Schlüsselwörter
}
# The keywords given, and the most the template allows.
document-window-keywords-of = { $count } von { $limit }
document-window-identifiers = Kennungen
document-window-identifier-isbn = ISBN
document-window-identifier-edition = Auflage
document-window-identifier-publisher = Verlag
document-window-identifier-place = Ort
document-window-identifier-doi = DOI
document-window-identifier-name = Name einer weiteren Kennung
document-window-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
document-window-identifier-add = Kennung

## The parts: the kinds of elements the template gives the document a place for.

document-window-parts-hint = Die Arten von Elementen, denen diese Vorlage einen Platz gibt, und die Elemente unter diesem, die ihn jeweils einnehmen. Ein Teil ist ein Element: sein Text wird im Baum geschrieben.
document-window-parts-none = Diese Vorlage hat keine Teile außer dem Hauptteil.
document-window-parts-missing = Noch keines
document-window-parts-make = Eines anlegen
# On the second element of a kind a document has one of.
document-window-parts-doubled = Nur das erste wird verwendet

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

document-window-look-hint = Wie die Seiten aussehen und wie das Dokument zitiert, wird unter „Aussehen“ eingestellt, in der Seitenleiste neben der Vorschau: das Layout und der Zitierstil, die Schrift, die Seite, das Aussehen der Arten.
document-window-look-now = Layout: { $layout } · Zitierstil: { $style }
document-window-look-open = Aussehen öffnen
document-window-layout = Layout
document-window-style = Zitierstil
document-window-style-change = Diesen Zitierstil ändern…

## The language.

document-window-language = Sprache des Textes

## The checklist: what the template requires, against what the tree holds.

document-window-checklist-hint = Was die Vorlage verlangt, gemessen am Text und am Baum. Gekürzt wird nichts.
document-window-checklist-clear = Nichts anzumerken.
document-window-requirement-words = Wörter im Text
document-window-requirement-anonymous = Zur Begutachtung: die Autoren bleiben aus dem Dokument weg.
