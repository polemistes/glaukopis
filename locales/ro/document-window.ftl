# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

document-window = Setările documentului
# In the menu of an element, and the button over the preview.
document-window-menu = Setările documentului…
document-window-sections = Părțile ferestrei
# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
document-window-usual = Ce folosiți de obicei ({ $name })
# The first choice of a layout or a style: what the template brings, named.
document-window-as-template = Ca în șablon ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
document-window-from-with = De la { $name } ({ $what })

## The parts of the window, as they stand down its left.

document-window-section-template = Șablon
document-window-section-details = Detalii
document-window-section-parts = Părți
document-window-section-look = Aspect
document-window-section-language = Limbă
document-window-section-checklist = Listă de verificare

## The template.

document-window-template-hint = Din ce constă documentul: părțile lui în ordinea lor, tipurile pe care le pune la îndemână, ce cere, precum și macheta și stilul de citare pe care le aduce.
document-window-template-search = Caută în șabloane
document-window-template-search-placeholder = Un fel de text, o revistă, o editură…
document-window-template-none-found = Niciun șablon nu are acest nume.
# Takes the template of the element over this one again, in place of this element's own.
document-window-template-again = Ia-l din nou de la { $name }
document-window-template-usual-again = Ia din nou ce folosiți de obicei
document-window-template-layout = Machetă: { $layout }
document-window-template-style = Stil de citare: { $style }
document-window-template-change = Modifică acest șablon…
document-window-template-new = Șablon nou…
# A template the project carries a copy of, that is not among the writer's own on this computer.
document-window-template-of-project = Păstrat în proiect: nu este printre șabloanele dumneavoastră de pe acest calculator.

## The details: what stands on the first page, and in the metadata of the files.

document-window-details-hint = Ce stă pe prima pagină și ce poartă fișierele ca metadate. Tot restul se scrie în arbore.
document-window-title = Titlu
document-window-title-placeholder = Numele elementului
document-window-title-hint = Dacă rămâne gol, titlul este numele elementului.
document-window-subtitle = Subtitlu
document-window-authors = Autori
document-window-name = Nume
document-window-author-name = Numele autorului { $number }
document-window-affiliation = Afiliere
document-window-author-affiliation = Afilierea autorului { $number }
document-window-email = E-mail
document-window-author-email = E-mailul autorului { $number }
document-window-orcid = ORCID
document-window-author-orcid = ORCID-ul autorului { $number }
# Beside a plus, under the authors: adds one.
document-window-add-author = autor
document-window-date = Dată
document-window-date-placeholder = Cum se va tipări
document-window-keywords = Cuvinte-cheie
document-window-keywords-placeholder = Despărțite prin virgule
document-window-keywords-count = { $count ->
    [one] { $count } cuvânt-cheie
    [few] { $count } cuvinte-cheie
   *[other] { $count } de cuvinte-cheie
}
# The keywords given, and the most the template allows.
document-window-keywords-of = { $count } din { $limit }
document-window-identifiers = Identificatori
document-window-identifier-isbn = ISBN
document-window-identifier-edition = Ediție
document-window-identifier-publisher = Editură
document-window-identifier-place = Loc
document-window-identifier-doi = DOI
document-window-identifier-name = Numele altui identificator
document-window-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
document-window-identifier-add = identificator

## The parts: the kinds of elements the template gives the document a place for.

document-window-parts-hint = Tipurile de elemente cărora acest șablon le dă un loc și elementele de sub acesta care le umplu pe fiecare. O parte este un element: textul ei se scrie în arbore.
document-window-parts-none = Acest șablon nu are alte părți în afară de corpul textului.
document-window-parts-missing = Niciunul încă
document-window-parts-make = Fă unul
# On the second element of a kind a document has one of.
document-window-parts-doubled = Se folosește numai primul

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

document-window-look-hint = Cum arată paginile și cum citează documentul se stabilesc în Aspect, panoul de lângă previzualizare: macheta și stilul de citare, fontul, pagina, aspectele tipurilor.
document-window-look-now = Machetă: { $layout } · Stil de citare: { $style }
document-window-look-open = Deschide panoul Aspect
document-window-layout = Machetă
document-window-style = Stil de citare
document-window-style-change = Modifică acest stil de citare…

## The language.

document-window-language = Limba textului

## The checklist: what the template requires, against what the tree holds.

document-window-checklist-hint = Ce cere șablonul, față de text și de arbore. Nu se taie nimic.
document-window-checklist-clear = Nimic de semnalat.
document-window-requirement-words = Cuvintele textului
document-window-requirement-anonymous = Pentru recenzare: autorii sunt lăsați afară din document.
