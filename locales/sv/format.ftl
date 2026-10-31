# Layouts, which the files and the code call formats: their kinds, and the rows by which their looks are set in the look of a document.

## The kinds of document layout, as the layouts are grouped by them.

format-kind-own = Dina egna
format-kind-general = Allmänna
format-kind-style-guide = Stilguider
format-kind-publisher = Förlag
format-kind-journal = Tidskrifter
format-kind-fiction = Skönlitteratur
format-kind-stage = Scen och film
format-kind-poetry = Poesi

## Layouts of the writer's own, kept from the changes of a document.

format-name = Layoutens namn
# The name a layout of one's own is first given, made from that of the layout it is made from.
format-name-changed = { $name }, ändrad
format-saved = ”{ $name }” är sparad bland dina egna layouter
format-save-failed = Layouten kunde inte sparas.
format-delete-failed = Layouten kunde inte raderas.
format-delete-title = Radera layouten ”{ $name }”?
format-delete-message = Element som använder den kommer att använda den allmänna manuskriptlayouten i stället.
format-delete-confirm = Radera layouten

## Words that stand in several parts.

format-size = Storlek
format-bold = Fet
format-italic = Kursiv
format-letters = Bokstäver
format-alignment = Justering
format-line-spacing = Radavstånd
format-as-the-text = Som texten
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = som texten
format-align-left = Vänster
format-align-center = Centrerad
format-align-right = Höger
format-align-justified = Marginaljusterad
format-align-ragged = Vänster, ojämn höger
format-case-none = Som skrivet
format-case-upper = VERSALER
format-case-smallcaps = Kapitäler
format-spacing-single = Enkelt
format-spacing-one-and-a-half = Ett och ett halvt
format-spacing-double = Dubbelt
format-stands-left = Till vänster
format-stands-center = I mitten
format-stands-right = Till höger

## The page.

format-page-custom = En annan storlek
format-page-width = Bredd
format-page-height = Höjd
format-margins = Marginaler
format-margin-top = Övre
format-margin-bottom = Nedre
format-margin-left = Vänster
format-margin-right = Höger
format-columns-heading = Spalter
format-columns = Spalter
format-column-gap = Mellanrum mellan spalterna
format-lengths-hint = Längder skrivs med sin enhet: 2.5cm, 1in, 25mm, 12pt.
## Numbers belong to what they number (ADR 0041): the lines one numbers
## are shown as the layout says where they do not say otherwise; the lines
## of the page are the layout's alone.
format-verse-every = Visa ett nummer var
format-verse-side = Numren till
format-side-left = Vänster
format-side-right = Höger
format-numbers-page = Sidans rader
format-line-numbers = Numrera raderna

## Type and spacing, and paragraphs.

format-typeface = Typsnitt
format-hyphenate = Avstava ord vid radslut
format-indent-first = Också efter en rubrik
format-space-between = Mellanrum mellan stycken
format-italics = Kursiv sätts
format-italics-italic = Som kursiv
format-italics-underline = Understruken, som maskinskrivna manuskript hade den
format-refmarks = Referensmärken sätts
format-refmarks-raised = Små och upphöjda i raden
format-refmarks-margin = I marginalen bredvid sin rad

## Headings.

format-numbered = Numrerade
format-level = Nivå { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = fet
format-level-italic = kursiv
format-level-capitals = versaler
format-level-small-caps = kapitäler
format-level-centred = centrerad
format-level-right = höger
format-level-run-in = löper in i texten
format-level-indent = Indragen som ett stycke
format-level-begins-text = I texten
format-level-begins-page = På en ny sida
format-level-begins-right-page = På en högersida
format-level-right-page-said = på en högersida
format-level-numbering = Numrering
format-level-numbering-as-above = Som nivån ovanför
format-level-numbering-none = Ingen
format-level-numbering-arabic = 1, 2, 3
format-level-numbering-alpha = A, B, C
format-level-numbering-alpha-lower = a, b, c
format-level-numbering-roman = I, II, III
format-level-numbering-roman-lower = i, ii, iii
format-level-counted = Räkning
format-level-counted-under = Under nivån ovanför
format-level-counted-through = Genom hela dokumentet
format-level-counted-through-said = räknad genom hela dokumentet
# How a level is numbered, said among its look: "numbered I, II, III".
format-level-numbered-as = numrerad { $style }
format-level-not-numbered = inte numrerad
format-level-new-page-said = på ny sida
format-space-before = Mellanrum före
format-space-after = Mellanrum efter
format-level-add = En nivå djupare
format-level-remove = Ta bort den djupaste

## The title and the abstract.

format-title-placement = Titeln står
format-title-top = Överst på första sidan
format-title-own-page = På en egen sida
format-title-authors = Författare
format-title-affiliations = Deras tillhörighet
format-title-date = Datum
format-title-abstract = Sammanfattning och nyckelord
format-title-abstract-label = Sammanfattningens rubrik
format-title-keywords-label = Ordet före nyckelorden

## Quotations, notes and the bibliography.

format-quote-from-words = Från så här många ord
format-quote-from-lines = Eller så här många rader
format-notes-kind = Noter står
format-notes-footnotes = Längst ner på sidan
format-notes-endnotes = I slutet av texten
format-notes-title = Noternas rubrik
format-bibliography-title = Rubrik
format-bibliography-new-page = Börjar på ny sida
format-bibliography-hanging-indent = Hängande indrag
format-bibliography-entry-spacing = Mellanrum mellan posterna

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = bygger på { $base }
# Of the kind Text, which the parts for type and paragraphs set.
format-kind-text-note = som layoutens typografi och stycken har det
# At the right of a kind's line where this layout says nothing of it.
format-kind-as-base = som grunden
format-kind-resolved = Som det kommer att stå: { $look }
format-kind-resolved-nothing = Som det kommer att stå: som texten omkring
format-kind-resolved-failed = Hur det kommer att stå kunde inte räknas ut: { $reason }
format-as-the-base = Som grunden
# "As the base", with what the base comes to: "As the base (Yes)", "As the base (11 pt)".
format-as-the-base-is = Som grunden ({ $value })
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = som grunden
format-yes = Ja
format-no = Nej
format-underline = Understruken
format-equal-width = Lika breda tecken
format-equal-width-hint = Som kod sätts
format-indent-left = Indrag till vänster
format-indent-right = Indrag till höger
format-first-line = Första raden
format-first-line-hint = Hur långt in den börjar, utöver resten
format-keep-with-next = Hålls ihop med nästa
format-keep-with-next-hint = Lämnas inte ensamt längst ner på en sida
format-new-page = Börjar en ny sida
format-break-text = Vad som står i en avdelare
format-break-text-hint = * * * där inget sägs; # för ett manuskript
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = inte fet
format-look-not-italic = inte kursiv
format-look-underlined = understruken
format-look-not-underlined = inte understruken
format-look-as-written = som skrivet
format-look-left = vänster
format-look-justified = marginaljusterad
format-look-indent-left = { $length } in från vänster
format-look-indent-right = { $length } in från höger
format-look-first-line = första raden { $length }
format-look-space-before = { $length } före
format-look-space-after = { $length } efter
format-look-line-spacing = radavstånd { $spacing }
format-look-equal-width = lika breda tecken
format-look-not-equal-width = olika breda tecken
format-look-kept = hålls ihop med nästa
format-look-not-kept = hålls inte ihop med nästa
format-look-no-new-page = ingen ny sida
format-look-text = ”{ $text }” i en avdelare

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Figurer
format-tables = Tabeller
format-captioned-called = { $kind ->
    [figure] En figur kallas
   *[table] En tabell kallas
}
format-captioned-reference = Där texten hänvisar till den
format-captioned-label-bold = Ordet och numret i fet
format-captioned-label-italic = Ordet och numret i kursiv
format-captioned-between = { $kind ->
    [figure] Mellan numret och bildtexten
   *[table] Mellan numret och tabelltexten
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Punkt ({ $called }. Bildtext)
   *[table] Punkt ({ $called }. Tabelltext)
}
format-between-colon = { $kind ->
    [figure] Kolon ({ $called }: Bildtext)
   *[table] Kolon ({ $called }: Tabelltext)
}
format-between-line = { $kind ->
    [figure] Bildtexten på en egen rad
   *[table] Tabelltexten på en egen rad
}
format-between-other = Annat…
format-captioned-separator = Vad som står mellan dem
format-captioned-own-line = { $kind ->
    [figure] Sedan bildtexten på en egen rad
   *[table] Sedan tabelltexten på en egen rad
}
format-caption = { $kind ->
    [figure] Bildtext
   *[table] Tabelltext
}
format-caption-stands = { $kind ->
    [figure] Bildtexten står
   *[table] Tabelltexten står
}
format-caption-below = { $kind ->
    [figure] Under bilden
   *[table] Under tabellen
}
format-caption-above = { $kind ->
    [figure] Över bilden
   *[table] Över tabellen
}
format-captioned-where = { $kind ->
    [figure] Var figurer står
   *[table] Var tabeller står
}
format-captioned-stand = { $kind ->
    [figure] Figurer står
   *[table] Tabeller står
}
format-captioned-wrap = Texten flyter runt dem
format-captioned-placement = I dokumentet
format-captioned-in-text = I texten
format-captioned-at-end = Samlade i slutet
format-captioned-end-title = { $kind ->
    [figure] Rubrik över figurerna
   *[table] Rubrik över tabellerna
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Rad som lämnas i texten
format-captioned-placeholder-missing = Den måste innehålla {"{}"}, där ordet och numret ska stå
format-table-rules = Linjer
format-table-rules-horizontal = Över, under, och under rubrikerna
format-table-rules-grid = Runt varje cell
format-table-rules-none = Inga
format-table-header-bold = Rubriker i fet
format-equations = Ekvationer
format-equations-stand = Ekvationer står
format-equations-before = Före numret
format-equations-after = Efter numret

## Page numbers and the running head.

format-page-numbers = Sidnummer
format-page-numbers-show = Sidorna numreras
format-page-numbering = Siffrornas form
format-number-arabic = 1, 2, 3
format-number-roman = I, II, III
format-number-roman-lower = i, ii, iii
format-number-letters = A, B, C
format-number-letters-lower = a, b, c
format-page-restart = Börjar räkna sidorna på nytt här
format-margin-header = Sidhuvud
format-margin-footer = Sidfot
format-margin-shown = Visas
format-margin-first-page = Också på första sidan
format-margin-openers = Också på sidorna där ett kapitel eller en del börjar
format-margin-alternate = Olika på vänster- och högersidor
format-margin-right-pages = På högersidor
format-margin-left-pages = På vänstersidor
format-margin-place-left = Vänster
format-margin-place-center = Mitten
format-margin-place-right = Höger
format-margin-add = Lägg till…
# Said of an item in a place of the header or the footer.
format-margin-remove = Ta bort { $item }
format-margin-separator = Mellan det som står
format-margin-text-placeholder = Dina ord
format-item-page-number = Sidnummer
format-item-title = Titel
format-item-author = Författare
format-item-chapter = Kapitel
format-item-date = Datum
format-item-text = Egna ord

## About the layout: where its requirements are from.

format-description = Beskrivning
format-source = Var kraven kommer från
# The date the source was read on.
format-source-read = Läst { $date }.
format-source-high = Värdena är källans.
format-source-medium = Källan kunde bara läsas delvis eller i ett tidigare skick: kontrollera det som är viktigt för dig.
format-source-low = Lite kunde bekräftas: ta värdena som en början.

## Fewer words, stage 3: the rows of Look in plain words.

format-level-begins-paragraph = Inleder stycket
format-level-placement = Placering
format-title-include = Ta med
format-title-formatting = Utformning
format-title-anonymize = Anonymisera framsidan
format-table-inside = Inne i tabellen

## Fewer words, stage 4: the two lengths of paragraphs, and the warning of long quotations.

format-indent-first-line = Indrag av första raden
format-quote-warn = Varna för långa citat i löptexten

## The contributors, stage 3: the lines of the editors and the translators on the front page, and their items.

format-title-roles = Redaktörer och översättare
format-item-editor = Redaktör
format-item-translator = Översättare

## The numbering of lines, stage 2: the side of the annotations of lines.
format-verse-annotations = Anmärkningarna till
format-verse-annotations-other = Sidan mitt emot numren

## Where a line begins, stage 4: the step of an indent.
format-indent-step = Indragssteg

# The distance of the numbers and the annotations from the text (docs/plans/the-distance-of-numbers-and-annotations.md).
format-verse-numbers-gap = Numrens avstånd från texten
format-verse-annotations-gap = Anmärkningarnas avstånd från texten
