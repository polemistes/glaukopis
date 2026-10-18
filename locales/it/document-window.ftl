# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

document-window = Impostazioni del documento
# In the menu of an element, and the button over the preview.
document-window-menu = Impostazioni del documento…
document-window-sections = Parti della finestra
# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
document-window-usual = Il tuo solito ({ $name })
# The first choice of a layout or a style: what the template brings, named.
document-window-as-template = Come vuole il modello ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
document-window-from-with = Da { $name } ({ $what })

## The parts of the window, as they stand down its left.

document-window-section-template = Modello
document-window-section-details = Dettagli
document-window-section-parts = Parti
document-window-section-look = Aspetto
document-window-section-language = Lingua
document-window-section-checklist = Lista di controllo

## The template.

document-window-template-hint = Ciò di cui il documento consiste: le sue parti nel loro ordine, i tipi che mette a portata di mano, ciò che chiede, e l'impaginazione e lo stile di citazione che porta con sé.
document-window-template-search = Cerca tra i modelli
document-window-template-search-placeholder = Un genere di testo, una rivista, un editore…
document-window-template-none-found = Nessun modello ha quel nome.
# Takes the template of the element over this one again, in place of this element's own.
document-window-template-again = Riprendilo da { $name }
document-window-template-usual-again = Riprendi il tuo solito
document-window-template-layout = Impaginazione: { $layout }
document-window-template-style = Stile di citazione: { $style }
document-window-template-change = Modifica questo modello…
document-window-template-new = Nuovo modello…
# A template the project carries a copy of, that is not among the writer's own on this computer.
document-window-template-of-project = Tenuto nel progetto: non è tra i tuoi modelli su questo computer.

## The details: what stands on the first page, and in the metadata of the files.

document-window-details-hint = Ciò che sta sulla prima pagina, e ciò che i file portano come metadati. Tutto il resto si scrive nell'albero.
document-window-title = Titolo
document-window-title-placeholder = Il nome dell'elemento
document-window-title-hint = Se resta vuoto, il titolo è il nome dell'elemento.
document-window-subtitle = Sottotitolo
document-window-authors = Autori
document-window-name = Nome
document-window-author-name = Nome dell'autore { $number }
document-window-affiliation = Affiliazione
document-window-author-affiliation = Affiliazione dell'autore { $number }
document-window-email = E-mail
document-window-author-email = E-mail dell'autore { $number }
document-window-orcid = ORCID
document-window-author-orcid = ORCID dell'autore { $number }
# Beside a plus, under the authors: adds one.
document-window-add-author = autore
document-window-date = Data
document-window-date-placeholder = Come va stampata
document-window-keywords = Parole chiave
document-window-keywords-placeholder = Separate da virgole
document-window-keywords-count = { $count ->
    [one] { $count } parola chiave
    [many] { $count } parole chiave
   *[other] { $count } parole chiave
}
# The keywords given, and the most the template allows.
document-window-keywords-of = { $count } di { $limit }
document-window-identifiers = Identificativi
document-window-identifier-isbn = ISBN
document-window-identifier-edition = Edizione
document-window-identifier-publisher = Editore
document-window-identifier-place = Luogo
document-window-identifier-doi = DOI
document-window-identifier-name = Nome di un altro identificativo
document-window-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
document-window-identifier-add = identificativo

## The parts: the kinds of elements the template gives the document a place for.

document-window-parts-hint = I tipi di elementi a cui questo modello dà un posto, e gli elementi sotto questo che riempiono ciascuno. Una parte è un elemento: il suo testo si scrive nell'albero.
document-window-parts-none = Questo modello non ha parti oltre al corpo del testo.
document-window-parts-missing = Ancora nessuno
document-window-parts-make = Fanne uno
# On the second element of a kind a document has one of.
document-window-parts-doubled = Si usa solo il primo

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

document-window-look-hint = Come appaiono le pagine, e come il documento cita, si stabilisce in Aspetto, il pannello accanto all'anteprima: l'impaginazione e lo stile di citazione, il font, la pagina, gli aspetti dei tipi.
document-window-look-now = Impaginazione: { $layout } · Stile di citazione: { $style }
document-window-look-open = Apri Aspetto
document-window-layout = Impaginazione
document-window-style = Stile di citazione
document-window-style-change = Modifica questo stile di citazione…

## The language.

document-window-language = Lingua del testo

## The checklist: what the template requires, against what the tree holds.

document-window-checklist-hint = Ciò che il modello chiede, a confronto con il testo e l'albero. Nulla viene tagliato.
document-window-checklist-clear = Nulla da segnalare.
document-window-requirement-words = Parole del testo
document-window-requirement-anonymous = Per la revisione: gli autori sono lasciati fuori dal documento.
