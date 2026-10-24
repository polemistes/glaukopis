# Document properties: what an element's document says of itself, its
# details, its type (what you are writing, its template), its language and
# the checklist of what its template requires. How it looks and what it
# contains are set in Look.

about-window = Proprietà del documento
# In the menu of an element, and at the foot of Look.
about-menu = Proprietà del documento…
about-sections = Parti della finestra

## The parts of the window, as they stand down its left.

about-section-details = Dettagli
about-section-language = Lingua
about-section-checklist = Lista di controllo

## The template.

## The details: what stands on the first page, and in the metadata of the files.

about-title = Titolo
about-title-placeholder = Il nome dell'elemento
about-subtitle = Sottotitolo
about-name = Nome
about-affiliation = Affiliazione
about-email = E-mail
about-orcid = ORCID
about-date = Data
about-date-placeholder = Come va stampata
about-keywords = Parole chiave
about-keywords-placeholder = Separate da virgole
about-keywords-count = { $count ->
    [one] { $count } parola chiave
    [many] { $count } parole chiave
   *[other] { $count } parole chiave
}
# The keywords given, and the most the template allows.
about-keywords-of = { $count } di { $limit }
about-identifiers = Identificativi
about-identifier-isbn = ISBN
about-identifier-edition = Edizione
about-identifier-publisher = Editore
about-identifier-place = Luogo
about-identifier-doi = DOI
about-identifier-name = Nome di un altro identificativo
about-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
about-identifier-add = identificativo

## The parts: the kinds of elements the template gives the document a place for.

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

## The language.

about-language = Lingua del testo

## The checklist: what the template requires, against what the tree holds.

about-checklist-hint = Ciò che il modello chiede, a confronto con il testo e l'albero. Nulla viene tagliato.
about-checklist-clear = Nulla da segnalare.
about-requirement-words = Parole del testo
about-requirement-anonymous = Per la revisione: i contributori sono lasciati fuori dal documento.

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# The tab of what the document is: what you are writing, its template.
about-section-type = Tipo di documento

## Fewer words, stage 3: the source of a layout's requirements, under the layout the type brings.

about-layout-source = Fonte: { $name }

## The contributors, stage 3: the persons of a document, each with a role.

about-contributors = Contributori
# Beside a plus, under the contributors: adds one.
about-add-contributor = Aggiungi un contributore
about-contributor-role = Ruolo del contributore { $number }
about-role-author = Autore
about-role-editor = Curatore
about-role-translator = Traduttore
about-contributor-name = Nome del contributore { $number }
about-contributor-affiliation = Affiliazione del contributore { $number }
about-contributor-email = E-mail del contributore { $number }
about-contributor-orcid = ORCID del contributore { $number }
# Under the details: whether every line of the printed page is numbered in the margin.
about-page-lines = Numera ogni riga della pagina stampata
