# Layouts, which the files and the code call formats: their kinds, and the rows by which their looks are set in the look of a document.

## The kinds of document layout, as the layouts are grouped by them.

format-kind-own = Dine egne
format-kind-general = Almindelige
format-kind-style-guide = Stilmanualer
format-kind-publisher = Forlag
format-kind-journal = Tidsskrifter
format-kind-fiction = Skønlitteratur
format-kind-stage = Scene og film
format-kind-poetry = Lyrik

## Layouts of the writer's own, kept from the changes of a document.

format-name = Opsætningens navn
# The name a layout of one's own is first given, made from that of the layout it is made from.
format-name-changed = { $name }, ændret
format-saved = »{ $name }« er gemt blandt dine egne opsætninger
format-save-failed = Opsætningen kunne ikke gemmes.
format-delete-failed = Opsætningen kunne ikke slettes.
format-delete-title = Slet opsætningen »{ $name }«?
format-delete-message = Elementer, der bruger den, vil bruge den almindelige manuskriptopsætning i stedet.
format-delete-confirm = Slet opsætningen

## Words that stand in several parts.

format-size = Størrelse
format-bold = Fed
format-italic = Kursiv
format-letters = Bogstaver
format-alignment = Justering
format-line-spacing = Linjeafstand
format-as-the-text = Som teksten
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = som teksten
format-align-left = Venstre
format-align-center = Centreret
format-align-right = Højre
format-align-justified = Lige margener
format-align-ragged = Venstre, ujævn højremargen
format-case-none = Som skrevet
format-case-upper = STORE BOGSTAVER
format-case-smallcaps = Kapitæler
format-spacing-single = Enkelt
format-spacing-one-and-a-half = Halvanden
format-spacing-double = Dobbelt
format-stands-left = Til venstre
format-stands-center = I midten
format-stands-right = Til højre

## The page.

format-page-custom = En anden størrelse
format-page-width = Bredde
format-page-height = Højde
format-margins = Margener
format-margin-top = Top
format-margin-bottom = Bund
format-margin-left = Venstre
format-margin-right = Højre
format-columns-heading = Spalter
format-columns = Antal spalter
format-column-gap = Afstand mellem spalter
format-lengths-hint = Længder skrives med deres enhed: 2,5cm, 1in, 25mm, 12pt.
## Numbers belong to what they number (ADR 0041): the lines one numbers
## are shown as the layout says where they do not say otherwise; the lines
## of the page are the layout's alone.
format-verse-every = Vis et nummer for hver
format-verse-side = Side for numrene
format-side-left = Venstre
format-side-right = Højre
format-numbers-page = Sidens linjer
format-line-numbers = Nummerer linjerne

## Type and spacing, and paragraphs.

format-typeface = Skrift
format-hyphenate = Del ord ved linjeskift
format-indent-first = Også efter en overskrift
format-space-between = Luft mellem afsnit
format-italics = Kursiv sættes
format-italics-italic = Som kursiv
format-italics-underline = Understreget, som maskinskrevne manuskripter havde det
format-refmarks = Stedmærker sættes
format-refmarks-raised = Små og hævet i linjen
format-refmarks-margin = I margenen ud for deres linje

## Headings.

format-numbered = Nummererede
format-level = Niveau { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = fed
format-level-italic = kursiv
format-level-capitals = store bogstaver
format-level-small-caps = kapitæler
format-level-centred = centreret
format-level-right = højre
format-level-run-in = løber ind i teksten
format-level-indent = Indrykket som et afsnit
format-level-begins-text = I teksten
format-level-begins-page = På en ny side
format-level-begins-right-page = På en højreside
format-level-right-page-said = på en højreside
format-level-numbering = Nummerering
format-level-numbering-as-above = Som niveauet over
format-level-numbering-none = Ingen
format-level-numbering-arabic = 1, 2, 3
format-level-numbering-alpha = A, B, C
format-level-numbering-alpha-lower = a, b, c
format-level-numbering-roman = I, II, III
format-level-numbering-roman-lower = i, ii, iii
# How a level is numbered, said among its look: "numbered I, II, III".
format-level-numbered-as = nummereret { $style }
format-level-not-numbered = ikke nummereret
format-level-new-page-said = på ny side
format-space-before = Luft før
format-space-after = Luft efter
format-level-add = Et dybere niveau
format-level-remove = Fjern det dybeste

## The title and the abstract.

format-title-placement = Titlen står
format-title-top = Øverst på første side
format-title-own-page = På en side for sig
format-title-authors = Forfattere
format-title-affiliations = Deres tilhørsforhold
format-title-date = Dato
format-title-abstract = Resumé og nøgleord
format-title-abstract-label = Overskrift over resuméet
format-title-keywords-label = Ord foran nøgleordene

## Quotations, notes and the bibliography.

format-quote-from-words = Fra så mange ord
format-quote-from-lines = Eller så mange linjer
format-notes-kind = Noterne står
format-notes-footnotes = Nederst på siden
format-notes-endnotes = Sidst i teksten
format-notes-title = Overskrift over noterne
format-bibliography-title = Overskrift
format-bibliography-new-page = Begynder på en ny side
format-bibliography-hanging-indent = Hængende indrykning
format-bibliography-entry-spacing = Luft mellem posterne

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = bygger på { $base }
# Of the kind Text, which the parts for type and paragraphs set.
format-kind-text-note = som opsætningens skrift og afsnit har det
# At the right of a kind's line where this layout says nothing of it.
format-kind-as-base = som grundlaget
format-kind-resolved = Som det kommer til at stå: { $look }
format-kind-resolved-nothing = Som det kommer til at stå: som teksten omkring det
format-kind-resolved-failed = Hvordan det kommer til at stå, kunne ikke regnes ud: { $reason }
format-as-the-base = Som grundlaget
# "As the base", with what the base comes to: "As the base (Yes)", "As the base (11 pt)".
format-as-the-base-is = Som grundlaget ({ $value })
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = som grundlaget
format-yes = Ja
format-no = Nej
format-underline = Understreget
format-equal-width = Bogstaver af samme bredde
format-equal-width-hint = Som kode sættes
format-indent-left = Indrykning til venstre
format-indent-right = Indrykning til højre
format-first-line = Første linje
format-first-line-hint = Hvor langt inde den begynder, ud over resten
format-keep-with-next = Holdes sammen med det næste
format-keep-with-next-hint = Efterlades ikke alene nederst på en side
format-new-page = Begynder på en ny side
format-break-text = Det, der står i et skille
format-break-text-hint = * * * hvor intet er sagt; # for et manuskript
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = ikke fed
format-look-not-italic = ikke kursiv
format-look-underlined = understreget
format-look-not-underlined = ikke understreget
format-look-as-written = som skrevet
format-look-left = venstre
format-look-justified = lige margener
format-look-indent-left = { $length } ind fra venstre
format-look-indent-right = { $length } ind fra højre
format-look-first-line = første linje { $length }
format-look-space-before = { $length } før
format-look-space-after = { $length } efter
format-look-line-spacing = afstand { $spacing }
format-look-equal-width = bogstaver af samme bredde
format-look-not-equal-width = bogstaver af forskellig bredde
format-look-kept = holdt sammen med det næste
format-look-not-kept = ikke holdt sammen med det næste
format-look-no-new-page = ingen ny side
format-look-text = »{ $text }« i et skille

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Figurer
format-tables = Tabeller
format-captioned-called = { $kind ->
    [figure] En figur kaldes
   *[table] En tabel kaldes
}
format-captioned-reference = Hvor teksten henviser til den
format-captioned-label-bold = Ordet og nummeret med fed
format-captioned-label-italic = Ordet og nummeret med kursiv
format-captioned-between = { $kind ->
    [figure] Mellem nummeret og billedteksten
   *[table] Mellem nummeret og tabelteksten
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Punktum ({ $called }. Billedtekst)
   *[table] Punktum ({ $called }. Tabeltekst)
}
format-between-colon = { $kind ->
    [figure] Kolon ({ $called }: Billedtekst)
   *[table] Kolon ({ $called }: Tabeltekst)
}
format-between-line = { $kind ->
    [figure] Billedteksten på en linje for sig
   *[table] Tabelteksten på en linje for sig
}
format-between-other = Andet…
format-captioned-separator = Det, der står mellem dem
format-captioned-own-line = { $kind ->
    [figure] Derefter billedteksten på en linje for sig
   *[table] Derefter tabelteksten på en linje for sig
}
format-caption = { $kind ->
    [figure] Billedtekst
   *[table] Tabeltekst
}
format-caption-stands = { $kind ->
    [figure] Billedteksten står
   *[table] Tabelteksten står
}
format-caption-below = { $kind ->
    [figure] Under billedet
   *[table] Under tabellen
}
format-caption-above = { $kind ->
    [figure] Over billedet
   *[table] Over tabellen
}
format-captioned-where = { $kind ->
    [figure] Hvor figurerne står
   *[table] Hvor tabellerne står
}
format-captioned-stand = { $kind ->
    [figure] Figurerne står
   *[table] Tabellerne står
}
format-captioned-wrap = Teksten løber omkring dem
format-captioned-placement = I dokumentet
format-captioned-in-text = I teksten
format-captioned-at-end = Samlet til sidst
format-captioned-end-title = { $kind ->
    [figure] Overskrift over figurerne
   *[table] Overskrift over tabellerne
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Linje, der bliver stående i teksten
format-captioned-placeholder-missing = Den skal indeholde {"{}"}, hvor ordet og nummeret skal stå
format-table-rules = Streger
format-table-rules-horizontal = Over, under og under overskrifterne
format-table-rules-grid = Omkring hver celle
format-table-rules-none = Ingen
format-table-header-bold = Overskrifter med fed
format-equations = Ligninger
format-equations-stand = Ligningerne står
format-equations-before = Foran nummeret
format-equations-after = Efter nummeret

## Page numbers and the running head.

format-page-numbers = Sidetal
format-page-numbers-show = Siderne nummereres
format-page-numbering = Tallenes form
format-number-arabic = 1, 2, 3
format-number-roman = I, II, III
format-number-roman-lower = i, ii, iii
format-number-letters = A, B, C
format-number-letters-lower = a, b, c
format-page-restart = Begynder at tælle siderne forfra her
format-margin-header = Sidehoved
format-margin-footer = Sidefod
format-margin-shown = Vises
format-margin-first-page = Også på første side
format-margin-openers = Også på de sider, hvor et kapitel eller en del begynder
format-margin-alternate = Forskelligt på venstre- og højresider
format-margin-right-pages = På højresider
format-margin-left-pages = På venstresider
format-margin-place-left = Venstre
format-margin-place-center = Midten
format-margin-place-right = Højre
format-margin-add = Tilføj…
# Said of an item in a place of the header or the footer.
format-margin-remove = Fjern { $item }
format-margin-separator = Mellem det, der står
format-margin-text-placeholder = Dine ord
format-item-page-number = Sidetal
format-item-title = Titel
format-item-author = Forfatter
format-item-chapter = Kapitel
format-item-date = Dato
format-item-text = Mine egne ord

## About the layout: where its requirements are from.

format-description = Beskrivelse
format-source = Hvor kravene kommer fra
# The date the source was read on.
format-source-read = Læst { $date }.
format-source-high = Værdierne er kildens.
format-source-medium = Kilden kunne kun læses delvist eller i en tidligere udgave: tjek det, der har betydning for dig.
format-source-low = Kun lidt kunne bekræftes: tag værdierne som et udgangspunkt.
