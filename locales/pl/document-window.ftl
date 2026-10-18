# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

document-window = Ustawienia dokumentu
# In the menu of an element, and the button over the preview.
document-window-menu = Ustawienia dokumentu…
document-window-sections = Części okna
# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
document-window-usual = Twój zwykły ({ $name })
# The first choice of a layout or a style: what the template brings, named.
document-window-as-template = Jak w szablonie ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
document-window-from-with = Z elementu „{ $name }” ({ $what })

## The parts of the window, as they stand down its left.

document-window-section-template = Szablon
document-window-section-details = Dane
document-window-section-parts = Części
document-window-section-look = Wygląd
document-window-section-language = Język
document-window-section-checklist = Lista kontrolna

## The template.

document-window-template-hint = Z czego składa się dokument: jego części w kolejności, rodzaje, które podsuwa, jego wymagania oraz układ i styl cytowania, które ze sobą przynosi.
document-window-template-search = Szukaj szablonu
document-window-template-search-placeholder = Rodzaj tekstu, czasopismo, wydawca…
document-window-template-none-found = Nie ma szablonu o takiej nazwie.
# Takes the template of the element over this one again, in place of this element's own.
document-window-template-again = Weź znowu z elementu „{ $name }”
document-window-template-usual-again = Weź znowu swój zwykły
document-window-template-layout = Układ: { $layout }
document-window-template-style = Styl cytowania: { $style }
document-window-template-change = Zmień ten szablon…
document-window-template-new = Nowy szablon…
# A template the project carries a copy of, that is not among the writer's own on this computer.
document-window-template-of-project = Przechowywany w projekcie: nie ma go wśród twoich własnych szablonów na tym komputerze.

## The details: what stands on the first page, and in the metadata of the files.

document-window-details-hint = To, co stoi na pierwszej stronie, i to, co pliki niosą jako metadane. Całą resztę pisze się w drzewie.
document-window-title = Tytuł
document-window-title-placeholder = Nazwa elementu
document-window-title-hint = Gdy pole jest puste, tytułem jest nazwa elementu.
document-window-subtitle = Podtytuł
document-window-authors = Autorzy
document-window-name = Imię i nazwisko
document-window-author-name = Imię i nazwisko autora { $number }
document-window-affiliation = Afiliacja
document-window-author-affiliation = Afiliacja autora { $number }
document-window-email = E-mail
document-window-author-email = E-mail autora { $number }
document-window-orcid = ORCID
document-window-author-orcid = ORCID autora { $number }
# Beside a plus, under the authors: adds one.
document-window-add-author = autor
document-window-date = Data
document-window-date-placeholder = Tak, jak ma być wydrukowana
document-window-keywords = Słowa kluczowe
document-window-keywords-placeholder = Rozdzielone przecinkami
document-window-keywords-count = { $count ->
    [one] { $count } słowo kluczowe
    [few] { $count } słowa kluczowe
    [many] { $count } słów kluczowych
   *[other] { $count } słów kluczowych
}
# The keywords given, and the most the template allows.
document-window-keywords-of = { $count } z { $limit }
document-window-identifiers = Identyfikatory
document-window-identifier-isbn = ISBN
document-window-identifier-edition = Wydanie
document-window-identifier-publisher = Wydawca
document-window-identifier-place = Miejsce wydania
document-window-identifier-doi = DOI
document-window-identifier-name = Nazwa innego identyfikatora
document-window-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
document-window-identifier-add = identyfikator

## The parts: the kinds of elements the template gives the document a place for.

document-window-parts-hint = Rodzaje elementów, którym ten szablon daje miejsce, i elementy pod tym, które je wypełniają. Część jest elementem: jej tekst pisze się w drzewie.
document-window-parts-none = Ten szablon nie ma części poza tekstem głównym.
document-window-parts-missing = Jeszcze brak
document-window-parts-make = Utwórz
# On the second element of a kind a document has one of.
document-window-parts-doubled = Używany jest tylko pierwszy

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

document-window-look-hint = To, jak wyglądają strony i jak dokument cytuje, ustawia się w panelu Wygląd obok podglądu: układ i styl cytowania, czcionkę, stronę, wygląd rodzajów.
document-window-look-now = Układ: { $layout } · Styl cytowania: { $style }
document-window-look-open = Otwórz Wygląd
document-window-layout = Układ
document-window-style = Styl cytowania
document-window-style-change = Zmień ten styl cytowania…

## The language.

document-window-language = Język tekstu

## The checklist: what the template requires, against what the tree holds.

document-window-checklist-hint = Wymagania szablonu zestawione z tekstem i drzewem. Nic nie jest obcinane.
document-window-checklist-clear = Bez uwag.
document-window-requirement-words = Słowa w tekście
document-window-requirement-anonymous = Do recenzji: autorzy są pominięci w dokumencie.
