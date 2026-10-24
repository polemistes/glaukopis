# Layouts, which the files and the code call formats: their kinds, and the rows by which their looks are set in the look of a document.

## The kinds of document layout, as the layouts are grouped by them.

format-kind-own = I tuoi
format-kind-general = Generali
format-kind-style-guide = Manuali di stile
format-kind-publisher = Editori
format-kind-journal = Riviste
format-kind-fiction = Narrativa
format-kind-stage = Teatro e cinema
format-kind-poetry = Poesia

## Layouts of the writer's own, kept from the changes of a document.

format-name = Nome dell'impaginazione
# The name a layout of one's own is first given, made from that of the layout it is made from.
format-name-changed = { $name }, modificato
format-saved = «{ $name }» è salvata tra le tue impaginazioni
format-save-failed = L'impaginazione non si è potuta salvare.
format-delete-failed = L'impaginazione non si è potuta eliminare.
format-delete-title = Eliminare l'impaginazione «{ $name }»?
format-delete-message = Gli elementi che la usano useranno invece l'impaginazione generale da manoscritto.
format-delete-confirm = Elimina l'impaginazione

## Words that stand in several parts.

format-size = Dimensione
format-bold = Grassetto
format-italic = Corsivo
format-letters = Lettere
format-alignment = Allineamento
format-line-spacing = Interlinea
format-as-the-text = Come il testo
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = come il testo
format-align-left = A sinistra
format-align-center = Centrato
format-align-right = A destra
format-align-justified = Giustificato
format-align-ragged = A sinistra, a bandiera
format-case-none = Come scritto
format-case-upper = MAIUSCOLE
format-case-smallcaps = Maiuscoletto
format-spacing-single = Singola
format-spacing-one-and-a-half = Uno e mezzo
format-spacing-double = Doppia
format-stands-left = A sinistra
format-stands-center = In mezzo
format-stands-right = A destra

## The page.

format-page-custom = Un'altra dimensione
format-page-width = Larghezza
format-page-height = Altezza
format-margins = Margini
format-margin-top = Sopra
format-margin-bottom = Sotto
format-margin-left = Sinistra
format-margin-right = Destra
format-columns-heading = Colonne
format-columns = Colonne
format-column-gap = Spazio tra le colonne
format-lengths-hint = Le lunghezze si scrivono con la loro unità: 2.5cm, 1in, 25mm, 12pt.
## Numbers belong to what they number (ADR 0041): the lines one numbers
## are shown as the layout says where they do not say otherwise; the lines
## of the page are the layout's alone.
format-verse-every = Mostra un numero ogni
format-verse-side = Lato dei numeri
format-side-left = Sinistra
format-side-right = Destra
format-numbers-page = Le righe della pagina
format-line-numbers = Numera le righe

## Type and spacing, and paragraphs.

format-typeface = Font
format-hyphenate = Dividi le parole a fine riga
format-indent-first = Anche dopo un titolo
format-space-between = Spazio tra i paragrafi
format-italics = Il corsivo è reso
format-italics-italic = Come corsivo
format-italics-underline = Sottolineato, come nei dattiloscritti
format-refmarks = I segni di riferimento sono resi
format-refmarks-raised = Piccoli e rialzati nella riga
format-refmarks-margin = Nel margine accanto alla loro riga

## Headings.

format-numbered = Numerati
format-level = Livello { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = grassetto
format-level-italic = corsivo
format-level-capitals = maiuscole
format-level-small-caps = maiuscoletto
format-level-centred = centrato
format-level-right = a destra
format-level-run-in = entra nel testo
format-level-indent = Rientrato come un paragrafo
format-level-begins-text = Nel testo
format-level-begins-page = Su una nuova pagina
format-level-begins-right-page = Su una pagina destra
format-level-right-page-said = su una pagina destra
format-level-numbering = Numerazione
format-level-numbering-as-above = Come il livello sopra
format-level-numbering-none = Nessuna
format-level-numbering-arabic = 1, 2, 3
format-level-numbering-alpha = A, B, C
format-level-numbering-alpha-lower = a, b, c
format-level-numbering-roman = I, II, III
format-level-numbering-roman-lower = i, ii, iii
# How a level is numbered, said among its look: "numbered I, II, III".
format-level-numbered-as = numerato { $style }
format-level-not-numbered = non numerato
format-level-new-page-said = su una nuova pagina
format-space-before = Spazio prima
format-space-after = Spazio dopo
format-level-add = Un livello più profondo
format-level-remove = Togli il più profondo

## The title and the abstract.

format-title-placement = Il titolo sta
format-title-top = In cima alla prima pagina
format-title-own-page = Su una pagina a sé
format-title-authors = Autori
format-title-affiliations = Le loro affiliazioni
format-title-date = Data
format-title-abstract = Abstract e parole chiave
format-title-abstract-label = Titolo dell'abstract
format-title-keywords-label = Parola prima delle parole chiave

## Quotations, notes and the bibliography.

format-quote-from-words = Da tante parole in su
format-quote-from-lines = O da tante righe in su
format-notes-kind = Le note stanno
format-notes-footnotes = A piè di pagina
format-notes-endnotes = Alla fine del testo
format-notes-title = Titolo delle note
format-bibliography-title = Titolo
format-bibliography-new-page = Comincia su una nuova pagina
format-bibliography-hanging-indent = Rientro sporgente
format-bibliography-entry-spacing = Spazio tra le voci

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = basato su { $base }
# Of the kind Text, which the parts for type and paragraphs set.
format-kind-text-note = come stabiliscono i caratteri e i paragrafi dell'impaginazione
# At the right of a kind's line where this layout says nothing of it.
format-kind-as-base = come la base
format-kind-resolved = Come apparirà: { $look }
format-kind-resolved-nothing = Come apparirà: come il testo intorno
format-kind-resolved-failed = Come apparirà non si è potuto stabilire: { $reason }
format-as-the-base = Come la base
# "As the base", with what the base comes to: "As the base (Yes)", "As the base (11 pt)".
format-as-the-base-is = Come la base ({ $value })
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = come la base
format-yes = Sì
format-no = No
format-underline = Sottolineato
format-equal-width = Lettere di larghezza uguale
format-equal-width-hint = Come si compone il codice
format-indent-left = Rientro a sinistra
format-indent-right = Rientro a destra
format-first-line = Prima riga
format-first-line-hint = Quanto comincia più in dentro del resto
format-keep-with-next = Tenuto con il seguente
format-keep-with-next-hint = Non lasciato solo a piè di pagina
format-new-page = Comincia una nuova pagina
format-break-text = Che cosa sta in uno stacco
format-break-text-hint = * * * dove non è detto nulla; # per un manoscritto
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = non grassetto
format-look-not-italic = non corsivo
format-look-underlined = sottolineato
format-look-not-underlined = non sottolineato
format-look-as-written = come scritto
format-look-left = a sinistra
format-look-justified = giustificato
format-look-indent-left = { $length } di rientro a sinistra
format-look-indent-right = { $length } di rientro a destra
format-look-first-line = prima riga { $length }
format-look-space-before = { $length } prima
format-look-space-after = { $length } dopo
format-look-line-spacing = interlinea { $spacing }
format-look-equal-width = lettere di larghezza uguale
format-look-not-equal-width = lettere di larghezza diversa
format-look-kept = tenuto con il seguente
format-look-not-kept = non tenuto con il seguente
format-look-no-new-page = nessuna nuova pagina
format-look-text = «{ $text }» in uno stacco

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Figure
format-tables = Tabelle
format-captioned-called = { $kind ->
    [figure] Una figura si chiama
   *[table] Una tabella si chiama
}
format-captioned-reference = Dove il testo vi rimanda
format-captioned-label-bold = Parola e numero in grassetto
format-captioned-label-italic = Parola e numero in corsivo
format-captioned-between = { $kind ->
    [figure] Tra il numero e la didascalia
   *[table] Tra il numero e la didascalia
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Punto ({ $called }. Didascalia)
   *[table] Punto ({ $called }. Didascalia)
}
format-between-colon = { $kind ->
    [figure] Due punti ({ $called }: Didascalia)
   *[table] Due punti ({ $called }: Didascalia)
}
format-between-line = { $kind ->
    [figure] Didascalia su una riga a sé
   *[table] Didascalia su una riga a sé
}
format-between-other = Altro…
format-captioned-separator = Che cosa sta tra di essi
format-captioned-own-line = { $kind ->
    [figure] Poi la didascalia su una riga a sé
   *[table] Poi la didascalia su una riga a sé
}
format-caption = { $kind ->
    [figure] Didascalia
   *[table] Didascalia
}
format-caption-stands = { $kind ->
    [figure] La didascalia sta
   *[table] La didascalia sta
}
format-caption-below = { $kind ->
    [figure] Sotto l'immagine
   *[table] Sotto la tabella
}
format-caption-above = { $kind ->
    [figure] Sopra l'immagine
   *[table] Sopra la tabella
}
format-captioned-where = { $kind ->
    [figure] Dove stanno le figure
   *[table] Dove stanno le tabelle
}
format-captioned-stand = { $kind ->
    [figure] Le figure stanno
   *[table] Le tabelle stanno
}
format-captioned-wrap = Il testo scorre intorno
format-captioned-placement = Nel documento
format-captioned-in-text = Nel testo
format-captioned-at-end = Raccolte alla fine
format-captioned-end-title = { $kind ->
    [figure] Titolo sopra le figure
   *[table] Titolo sopra le tabelle
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Riga lasciata nel testo
format-captioned-placeholder-missing = Deve contenere {"{}"}, dove vanno la parola e il numero
format-table-rules = Linee
format-table-rules-horizontal = Sopra, sotto, e sotto le intestazioni
format-table-rules-grid = Intorno a ogni cella
format-table-rules-none = Nessuna
format-table-header-bold = Intestazioni in grassetto
format-equations = Equazioni
format-equations-stand = Le equazioni stanno
format-equations-before = Prima del numero
format-equations-after = Dopo il numero

## Page numbers and the running head.

format-page-numbers = Numeri di pagina
format-page-numbers-show = Le pagine sono numerate
format-page-numbering = Stile dei numeri
format-number-arabic = 1, 2, 3
format-number-roman = I, II, III
format-number-roman-lower = i, ii, iii
format-number-letters = A, B, C
format-number-letters-lower = a, b, c
format-page-restart = Qui si ricomincia a contare le pagine
format-margin-header = Intestazione
format-margin-footer = Piè di pagina
format-margin-shown = Visibile
format-margin-first-page = Anche sulla prima pagina
format-margin-openers = Anche sulle pagine dove comincia un capitolo o una parte
format-margin-alternate = Cambia fra pagine sinistre e destre
format-margin-right-pages = Sulle pagine destre
format-margin-left-pages = Sulle pagine sinistre
format-margin-place-left = Sinistra
format-margin-place-center = Centro
format-margin-place-right = Destra
format-margin-add = Aggiungi…
# Said of an item in a place of the header or the footer.
format-margin-remove = Togli { $item }
format-margin-separator = Fra gli elementi
format-margin-text-placeholder = Le tue parole
format-item-page-number = Numero di pagina
format-item-title = Titolo
format-item-author = Autore
format-item-chapter = Capitolo
format-item-date = Data
format-item-text = Parole mie

## About the layout: where its requirements are from.

format-description = Descrizione
format-source = Da dove vengono i requisiti
# The date the source was read on.
format-source-read = Letta il { $date }.
format-source-high = I valori sono quelli della fonte.
format-source-medium = La fonte si è potuta leggere solo in parte o in uno stato precedente: controlla ciò che ti importa.
format-source-low = Poco si è potuto verificare: prendi i valori come un inizio.

## Fewer words, stage 3: the rows of Look in plain words.

format-level-begins-paragraph = Apre il paragrafo
format-level-placement = Collocazione
format-title-include = Includi
format-title-formatting = Formattazione
format-title-anonymize = Rendi anonima la prima pagina
format-table-inside = Dentro la tabella

## Fewer words, stage 4: the two lengths of paragraphs, and the warning of long quotations.

format-indent-first-line = Rientro della prima riga
format-quote-warn = Avvisa delle citazioni lunghe nel testo

## The contributors, stage 3: the lines of the editors and the translators on the front page, and their items.

format-title-roles = Curatori e traduttori
format-item-editor = Curatore
format-item-translator = Traduttore

## The numbering of lines, stage 2: the side of the annotations of lines.
format-verse-annotations = Lato delle annotazioni
format-verse-annotations-other = Dalla parte opposta ai numeri

## Where a line begins, stage 4: the step of an indent.
format-indent-step = Passo di rientro
