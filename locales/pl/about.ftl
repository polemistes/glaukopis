# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

about-sections = Części okna

## The parts of the window, as they stand down its left.

about-section-details = Dane
about-section-language = Język
about-section-checklist = Lista kontrolna

## The template.

## The details: what stands on the first page, and in the metadata of the files.

about-details-hint = To, co stoi na pierwszej stronie, i to, co pliki niosą jako metadane. Całą resztę pisze się w drzewie.
about-title = Tytuł
about-title-placeholder = Nazwa elementu
about-title-hint = Gdy pole jest puste, tytułem jest nazwa elementu.
about-subtitle = Podtytuł
about-authors = Autorzy
about-name = Imię i nazwisko
about-author-name = Imię i nazwisko autora { $number }
about-affiliation = Afiliacja
about-author-affiliation = Afiliacja autora { $number }
about-email = E-mail
about-author-email = E-mail autora { $number }
about-orcid = ORCID
about-author-orcid = ORCID autora { $number }
# Beside a plus, under the authors: adds one.
about-add-author = autor
about-date = Data
about-date-placeholder = Tak, jak ma być wydrukowana
about-keywords = Słowa kluczowe
about-keywords-placeholder = Rozdzielone przecinkami
about-keywords-count = { $count ->
    [one] { $count } słowo kluczowe
    [few] { $count } słowa kluczowe
    [many] { $count } słów kluczowych
   *[other] { $count } słów kluczowych
}
# The keywords given, and the most the template allows.
about-keywords-of = { $count } z { $limit }
about-identifiers = Identyfikatory
about-identifier-isbn = ISBN
about-identifier-edition = Wydanie
about-identifier-publisher = Wydawca
about-identifier-place = Miejsce wydania
about-identifier-doi = DOI
about-identifier-name = Nazwa innego identyfikatora
about-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
about-identifier-add = identyfikator

## The parts: the kinds of elements the template gives the document a place for.

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

## The language.

about-language = Język tekstu

## The checklist: what the template requires, against what the tree holds.

about-checklist-hint = Wymagania szablonu zestawione z tekstem i drzewem. Nic nie jest obcinane.
about-checklist-clear = Bez uwag.
about-requirement-words = Słowa w tekście
about-requirement-anonymous = Do recenzji: autorzy są pominięci w dokumencie.
