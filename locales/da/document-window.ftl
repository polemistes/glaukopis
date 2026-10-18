# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

document-window = Dokumentindstillinger
# In the menu of an element, and the button over the preview.
document-window-menu = Dokumentindstillinger…
document-window-sections = Vinduets dele
# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
document-window-usual = Din sædvanlige ({ $name })
# The first choice of a layout or a style: what the template brings, named.
document-window-as-template = Som skabelonen har det ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
document-window-from-with = Fra { $name } ({ $what })

## The parts of the window, as they stand down its left.

document-window-section-template = Skabelon
document-window-section-details = Oplysninger
document-window-section-parts = Dele
document-window-section-look = Udseende
document-window-section-language = Sprog
document-window-section-checklist = Tjekliste

## The template.

document-window-template-hint = Hvad dokumentet består af: dets dele i deres rækkefølge, de arter, skabelonen stiller til rådighed, hvad den kræver, og den opsætning og referencestil, den har med.
document-window-template-search = Søg i skabelonerne
document-window-template-search-placeholder = En artikel, en roman, et tidsskrift, et forlag…
document-window-template-none-found = Ingen skabelon har det navn.
# Takes the template of the element over this one again, in place of this element's own.
document-window-template-again = Tag den fra { $name } igen
document-window-template-usual-again = Tag din sædvanlige igen
document-window-template-layout = Opsætning: { $layout }
document-window-template-style = Referencestil: { $style }
document-window-template-change = Ændr denne skabelon…
document-window-template-new = Ny skabelon…
# A template the project carries a copy of, that is not among the writer's own on this computer.
document-window-template-of-project = Gemt i projektet: ikke blandt dine egne skabeloner på denne computer.

## The details: what stands on the first page, and in the metadata of the files.

document-window-details-hint = Det, der står på første side, og det, filerne har med som metadata. Alt andet skrives i træet.
document-window-title = Titel
document-window-title-placeholder = Elementets navn
document-window-title-hint = Står feltet tomt, er elementets navn titlen.
document-window-subtitle = Undertitel
document-window-authors = Forfattere
document-window-name = Navn
document-window-author-name = Navn på forfatter { $number }
document-window-affiliation = Tilhørsforhold
document-window-author-affiliation = Tilhørsforhold for forfatter { $number }
document-window-email = E-mail
document-window-author-email = E-mail for forfatter { $number }
document-window-orcid = ORCID
document-window-author-orcid = ORCID for forfatter { $number }
# Beside a plus, under the authors: adds one.
document-window-add-author = forfatter
document-window-date = Dato
document-window-date-placeholder = Som den skal udskrives
document-window-keywords = Nøgleord
document-window-keywords-placeholder = Adskilt af kommaer
document-window-keywords-count = { $count ->
    [one] { $count } nøgleord
   *[other] { $count } nøgleord
}
# The keywords given, and the most the template allows.
document-window-keywords-of = { $count } af { $limit }
document-window-identifiers = Identifikatorer
document-window-identifier-isbn = ISBN
document-window-identifier-edition = Udgave
document-window-identifier-publisher = Forlag
document-window-identifier-place = Sted
document-window-identifier-doi = DOI
document-window-identifier-name = Navnet på en anden identifikator
document-window-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
document-window-identifier-add = identifikator

## The parts: the kinds of elements the template gives the document a place for.

document-window-parts-hint = De arter af elementer, denne skabelon giver en plads, og de elementer under dette, der udfylder hver af dem. En del er et element: dens tekst skrives i træet.
document-window-parts-none = Denne skabelon har ingen dele ud over selve teksten.
document-window-parts-missing = Ingen endnu
document-window-parts-make = Lav en
# On the second element of a kind a document has one of.
document-window-parts-doubled = Kun det første bruges

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

document-window-look-hint = Hvordan siderne ser ud, og hvordan dokumentet henviser, indstilles i Udseende, panelet ved siden af forhåndsvisningen: opsætningen og referencestilen, skriften, siden, arternes udseende.
document-window-look-now = Opsætning: { $layout } · Referencestil: { $style }
document-window-look-open = Åbn Udseende
document-window-layout = Opsætning
document-window-style = Referencestil
document-window-style-change = Ændr denne referencestil…

## The language.

document-window-language = Tekstens sprog

## The checklist: what the template requires, against what the tree holds.

document-window-checklist-hint = Det, skabelonen kræver, holdt op mod teksten og træet. Intet skæres væk.
document-window-checklist-clear = Intet at bemærke.
document-window-requirement-words = Ord i teksten
document-window-requirement-anonymous = Til fagfællebedømmelse: forfatterne udelades af dokumentet.
