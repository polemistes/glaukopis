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

about-title = Tytuł
about-title-placeholder = Nazwa elementu
about-subtitle = Podtytuł
about-name = Imię i nazwisko
about-affiliation = Afiliacja
about-email = E-mail
about-orcid = ORCID
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
