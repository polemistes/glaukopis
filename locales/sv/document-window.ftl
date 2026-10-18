# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

document-window = Dokumentinställningar
# In the menu of an element, and the button over the preview.
document-window-menu = Dokumentinställningar…
document-window-sections = Fönstrets delar
# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
document-window-usual = Din vanliga ({ $name })
# The first choice of a layout or a style: what the template brings, named.
document-window-as-template = Som mallen har det ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
document-window-from-with = Från { $name } ({ $what })

## The parts of the window, as they stand down its left.

document-window-section-template = Mall
document-window-section-details = Uppgifter
document-window-section-parts = Delar
document-window-section-look = Utseende
document-window-section-language = Språk
document-window-section-checklist = Checklista

## The template.

document-window-template-hint = Vad dokumentet består av: dess delar i deras ordning, de slag det har till hands, vad det kräver, och den layout och referensstil det har med sig.
document-window-template-search = Sök bland mallarna
document-window-template-search-placeholder = Ett slags text, en tidskrift, ett förlag…
document-window-template-none-found = Ingen mall heter så.
# Takes the template of the element over this one again, in place of this element's own.
document-window-template-again = Ta den från { $name } igen
document-window-template-usual-again = Ta din vanliga igen
document-window-template-layout = Layout: { $layout }
document-window-template-style = Referensstil: { $style }
document-window-template-change = Ändra den här mallen…
document-window-template-new = Ny mall…
# A template the project carries a copy of, that is not among the writer's own on this computer.
document-window-template-of-project = Sparad i projektet: inte bland dina egna mallar på den här datorn.

## The details: what stands on the first page, and in the metadata of the files.

document-window-details-hint = Det som står på första sidan, och det som filerna bär med sig som metadata. Allt annat skrivs i trädet.
document-window-title = Titel
document-window-title-placeholder = Elementets namn
document-window-title-hint = Lämnas den tom är elementets namn titeln.
document-window-subtitle = Undertitel
document-window-authors = Författare
document-window-name = Namn
document-window-author-name = Namn på författare { $number }
document-window-affiliation = Tillhörighet
document-window-author-affiliation = Tillhörighet för författare { $number }
document-window-email = E-post
document-window-author-email = E-post för författare { $number }
document-window-orcid = ORCID
document-window-author-orcid = ORCID för författare { $number }
# Beside a plus, under the authors: adds one.
document-window-add-author = författare
document-window-date = Datum
document-window-date-placeholder = Som det ska skrivas ut
document-window-keywords = Nyckelord
document-window-keywords-placeholder = Åtskilda med kommatecken
document-window-keywords-count = { $count ->
    [one] { $count } nyckelord
   *[other] { $count } nyckelord
}
# The keywords given, and the most the template allows.
document-window-keywords-of = { $count } av { $limit }
document-window-identifiers = Identifierare
document-window-identifier-isbn = ISBN
document-window-identifier-edition = Upplaga
document-window-identifier-publisher = Förlag
document-window-identifier-place = Ort
document-window-identifier-doi = DOI
document-window-identifier-name = Namn på en annan identifierare
document-window-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
document-window-identifier-add = identifierare

## The parts: the kinds of elements the template gives the document a place for.

document-window-parts-hint = De slag av element som den här mallen ger en plats, och de element under det här som fyller var och en. En del är ett element: dess text skrivs i trädet.
document-window-parts-none = Den här mallen har inga delar utöver själva texten.
document-window-parts-missing = Inget än
document-window-parts-make = Gör ett
# On the second element of a kind a document has one of.
document-window-parts-doubled = Bara det första används

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

document-window-look-hint = Hur sidorna ser ut, och hur dokumentet hänvisar, ställs in i Utseende, panelen bredvid förhandsvisningen: layouten och referensstilen, typsnittet, sidan, slagens utseenden.
document-window-look-now = Layout: { $layout } · Referensstil: { $style }
document-window-look-open = Öppna Utseende
document-window-layout = Layout
document-window-style = Referensstil
document-window-style-change = Ändra den här referensstilen…

## The language.

document-window-language = Textens språk

## The checklist: what the template requires, against what the tree holds.

document-window-checklist-hint = Vad mallen kräver, mot texten och trädet. Inget skärs bort.
document-window-checklist-clear = Inget att anmärka på.
document-window-requirement-words = Ord i texten
document-window-requirement-anonymous = För granskning: författarna utelämnas ur dokumentet.
