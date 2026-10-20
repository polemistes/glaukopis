# Layouts, which the files and the code call formats: their kinds, and the rows by which their looks are set in the look of a document.

## The kinds of document layout, as the layouts are grouped by them.

format-kind-own = Dine eigne
format-kind-general = Generelle
format-kind-style-guide = Stilguidar
format-kind-publisher = Forlag
format-kind-journal = Tidsskrift
format-kind-fiction = Skjønnlitteratur
format-kind-stage = Scene og film
format-kind-poetry = Lyrikk

## Layouts of the writer's own, kept from the changes of a document.

format-name = Namnet på oppsettet
# The name a layout of one's own is first given, made from that of the layout it is made from.
format-name-changed = { $name }, endra
format-saved = «{ $name }» er lagra blant dine eigne oppsett
format-save-failed = Oppsettet kunne ikkje lagrast.
format-delete-failed = Oppsettet kunne ikkje slettast.
format-delete-title = Slette oppsettet «{ $name }»?
format-delete-message = Element som bruker det, vil bruke det generelle manusoppsettet i staden.
format-delete-confirm = Slett oppsettet

## Words that stand in several parts.

format-size = Storleik
format-bold = Feit
format-italic = Kursiv
format-letters = Bokstavar
format-alignment = Justering
format-line-spacing = Linjeavstand
format-as-the-text = Som teksten
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = som teksten
format-size-zero-hint = 0 for storleiken til teksten
# Beside a number of 0, in the place of its unit.
format-not-said = ikkje oppgitt
format-unless-said = Med mindre noko anna er sagt om den einskilde
format-as-it-will-stand = Slik det blir
format-align-left = Venstre
format-align-center = Midtstilt
format-align-right = Høgre
format-align-justified = Blokkjustert
format-align-ragged = Venstre, ujamn høgremarg
format-case-none = Som skrive
format-case-upper = STORE BOKSTAVAR
format-case-smallcaps = Kapitélar
format-spacing-single = Enkel
format-spacing-one-and-a-half = Halvannan
format-spacing-double = Dobbel
format-stands-left = Til venstre
format-stands-center = I midten
format-stands-right = Til høgre

## The page.

format-page-custom = Ein annan storleik
format-page-width = Breidd
format-page-height = Høgd
format-margins = Margar
format-margin-top = Øvst
format-margin-bottom = Nedst
format-margin-left = Venstre
format-margin-right = Høgre
format-columns-heading = Spalter
format-columns = Spalter
format-columns-hint = Teksten blir sett i så mange spalter på sida; 1 for ingen. Eit spalteskift i teksten byrjar den neste.
format-column-gap = Avstand mellom spaltene
format-lengths-hint = Lengder blir skrivne med eining: 2,5cm, 1in, 25mm, 12pt.
## Numbers belong to what they number (ADR 0041): the lines one numbers
## are shown as the layout says where they do not say otherwise; the lines
## of the page are the layout's alone.
format-numbers-hint = Korleis numra på linjer du nummererer blir viste, der dei ikkje seier noko anna; og om linjene på sida blir nummererte.
format-verse-every = Vis eit nummer kvar
format-verse-every-hint = Av linjene du nummererer: 5 viser 5, 10, 15
format-verse-side = Numra på
format-side-left = Venstre
format-side-right = Høgre
format-numbers-page = Linjene på sida
format-line-numbers = Nummerer linjene
format-line-numbers-hint = Som nokre tidsskrift ber om til fagfellevurdering

## Type and spacing, and paragraphs.

format-typeface = Skrift
format-typeface-hint = Er den ikkje installert, blir den næraste brukt i førehandsvisinga
format-hyphenate = Del ord ved linjeslutt
format-paragraphs = Avsnitt blir skilde med
format-paragraphs-indent = Innrykk i første linje
format-paragraphs-spaced = Luft mellom dei
format-indent = Innrykk
format-indent-first = Òg etter ei overskrift
format-indent-first-hint = Typografisk skikk er å ikkje rykkje inn første avsnitt; APA og andre rykkjer det inn
format-space-between = Luft mellom avsnitta
format-italics = Kursiv blir sett
format-italics-italic = Som kursiv
format-italics-underline = Understreka, slik maskinskrivne manuskript hadde det
format-refmarks = Referansemerke blir sette
format-refmarks-raised = Små og heva i linja
format-refmarks-margin = I margen ved sida av linja si
format-refmarks-hint = Vers, Stephanus-sider, Bekker-nummer. Word og Writer har ikkje plass i margen: der blir dei heva.

## Headings.

format-numbered = Nummererte
format-level = Nivå { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = feit
format-level-italic = kursiv
format-level-capitals = store bokstavar
format-level-small-caps = kapitélar
format-level-centred = midtstilt
format-level-right = høgre
format-level-run-in = går inn i teksten
format-level-indent = Rykt inn som eit avsnitt
format-level-run-in-label = Går inn i teksten
format-level-run-in-hint = Overskrifta innleier avsnittet og sluttar med punktum
format-level-begins = Byrjar
format-level-begins-hint = På ei høgreside blir det sett inn ei tom venstreside der det trengst, utan noko i topp- eller botnteksten
format-level-begins-text = I teksten
format-level-begins-page = På ny side
format-level-begins-right-page = På ei høgreside
format-level-right-page-said = på ei høgreside
format-level-numbering = Nummerering
format-level-numbering-hint = Eit nivå «som nivået over» blir nummerert på same vis som det, under nummeret til det
format-level-numbering-as-above = Som nivået over
format-level-numbering-none = Ingen
format-level-numbering-arabic = 1, 2, 3
format-level-numbering-alpha = A, B, C
format-level-numbering-alpha-lower = a, b, c
format-level-numbering-roman = I, II, III
format-level-numbering-roman-lower = i, ii, iii
# How a level is numbered, said among its look: "numbered I, II, III".
format-level-numbered-as = nummerert { $style }
format-level-not-numbered = ikkje nummerert
format-level-new-page-said = på ny side
format-space-before = Luft før
format-space-after = Luft etter
format-level-add = Eit djupare nivå
format-level-remove = Fjern det djupaste
format-levels-hint = Overskrifter djupare enn det djupaste nivået som er beskrive, blir skrivne ut som det nivået.

## The title and the abstract.

format-title-placement = Tittelen står
format-title-top = Øvst på første side
format-title-own-page = På ei eiga side
format-title-shown = Kva som blir vist
format-title-how = Korleis den blir sett
format-title-anonymous = Utan namna på forfattarane
format-title-anonymous-hint = Til fagfellevurdering: forfattarane blir utelatne overalt, òg i toppteksten
format-title-authors = Forfattarar
format-title-affiliations = Tilknytinga deira
format-title-date = Dato
format-title-abstract = Samandrag og nøkkelord
format-title-abstract-label = Overskrift over samandraget
format-title-keywords-label = Ord framfor nøkkelorda

## Quotations, notes and the bibliography.

format-quote-indent-left = Innrykk til venstre
format-quote-indent-right = Innrykk til høgre
format-quote-when = Når eit sitat blir sett som blokksitat
format-quote-from-words = Frå så mange ord
format-quote-from-words-hint = Ei påminning: skribenten avgjer
format-quote-from-lines = Eller så mange linjer
format-notes-kind = Notane står
format-notes-footnotes = Nedst på sida
format-notes-endnotes = Til slutt i teksten
format-notes-title = Overskrift over notane
format-bibliography-title = Overskrift
# Headings a bibliography may have.
format-bibliography-title-hint = Litteratur, Referansar, Kjelder
format-bibliography-new-page = Byrjar på ny side
format-bibliography-hanging-indent = Hengande innrykk
format-bibliography-entry-spacing = Luft mellom oppføringane

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kinds-hint = Kvart slag, med utsjånaden slik den blir: grunnutsjånaden til slaget, så slaga det byggjer på, så det dette oppsettet seier om det. Radene endrar berre det dette oppsettet seier; det som ikkje blir sagt, er som grunnlaget har det.
format-kind-based-on = byggjer på { $base }
# Of the kind Text, which the parts for type and paragraphs set.
format-kind-text-note = som skrifta og avsnitta i oppsettet har det
# At the right of a kind's line where this layout says nothing of it.
format-kind-as-base = som grunnlaget
format-kind-resolved = Slik det blir: { $look }
format-kind-resolved-nothing = Slik det blir: som teksten rundt
format-kind-resolved-failed = Korleis det blir, lét seg ikkje rekne ut: { $reason }
format-as-the-base = Som grunnlaget
# "As the base", with what the base comes to: "As the base (Yes)", "As the base (11 pt)".
format-as-the-base-is = Som grunnlaget ({ $value })
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = som grunnlaget
format-yes = Ja
format-no = Nei
format-underline = Understreka
format-equal-width = Bokstavar med lik breidd
format-equal-width-hint = Slik kode blir sett
format-indent-left = Innrykk til venstre
format-indent-right = Innrykk til høgre
format-first-line = Første linje
format-first-line-hint = Kor langt inn den byrjar, utover resten
format-keep-with-next = Blir halde saman med det neste
format-keep-with-next-hint = Blir ikkje ståande åleine nedst på ei side
format-new-page = Byrjar på ny side
format-break-text = Det som står i eit skilje
format-break-text-hint = * * * der ingenting er sagt; # for eit manuskript
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = ikkje feit
format-look-not-italic = ikkje kursiv
format-look-underlined = understreka
format-look-not-underlined = ikkje understreka
format-look-as-written = som skrive
format-look-left = venstre
format-look-justified = blokkjustert
format-look-indent-left = { $length } inn frå venstre
format-look-indent-right = { $length } inn frå høgre
format-look-first-line = første linje { $length }
format-look-space-before = { $length } før
format-look-space-after = { $length } etter
format-look-line-spacing = avstand { $spacing }
format-look-equal-width = bokstavar med lik breidd
format-look-not-equal-width = bokstavar med ulik breidd
format-look-kept = halde saman med det neste
format-look-not-kept = ikkje halde saman med det neste
format-look-no-new-page = ikkje ny side
format-look-text = «{ $text }» i eit skilje

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Figurar
format-tables = Tabellar
format-captioned-called = { $kind ->
    [figure] Ein figur blir kalla
   *[table] Ein tabell blir kalla
}
# Words a figure or table may be called by.
format-captioned-called-hint = { $kind ->
    [figure] Figur, Fig., Figure
   *[table] Tabell, Tab., Table
}
format-captioned-reference = Der teksten viser til den
format-captioned-reference-hint = { $kind ->
    [figure] fig., figur; tomt for same ord
   *[table] tab., tabell; tomt for same ord
}
format-captioned-label-bold = Ordet og nummeret i feit skrift
format-captioned-label-italic = Ordet og nummeret i kursiv
format-captioned-between = { $kind ->
    [figure] Mellom nummeret og biletteksten
   *[table] Mellom nummeret og tabellteksten
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Punktum ({ $called }. Bilettekst)
   *[table] Punktum ({ $called }. Tabelltekst)
}
format-between-colon = { $kind ->
    [figure] Kolon ({ $called }: Bilettekst)
   *[table] Kolon ({ $called }: Tabelltekst)
}
format-between-line = { $kind ->
    [figure] Biletteksten på eiga linje
   *[table] Tabellteksten på eiga linje
}
format-between-other = Anna …
format-captioned-separator = Det som står mellom dei
format-captioned-separator-hint = Mellomrom tel: skriv dei der dei skal stå
format-captioned-own-line = { $kind ->
    [figure] Så biletteksten på eiga linje
   *[table] Så tabellteksten på eiga linje
}
format-caption = { $kind ->
    [figure] Bilettekst
   *[table] Tabelltekst
}
format-caption-stands = { $kind ->
    [figure] Biletteksten står
   *[table] Tabellteksten står
}
format-caption-below = { $kind ->
    [figure] Under biletet
   *[table] Under tabellen
}
format-caption-above = { $kind ->
    [figure] Over biletet
   *[table] Over tabellen
}
format-caption-align-hint = { $kind ->
    [figure] Står figuren til éi side, står biletteksten på same side
   *[table] Står tabellen til éi side, står tabellteksten på same side
}
# In the example of how the number and the caption will stand.
format-caption-example = { $kind ->
    [figure] Bilettekst
   *[table] Tabelltekst
}
format-captioned-where = { $kind ->
    [figure] Kvar figurane står
   *[table] Kvar tabellane står
}
format-captioned-stand = { $kind ->
    [figure] Figurane står
   *[table] Tabellane står
}
format-captioned-wrap = Teksten flyt rundt dei
format-captioned-placement = I dokumentet
format-captioned-in-text = I teksten
format-captioned-at-end = Samla til slutt
format-captioned-placement-hint = Mange tidsskrift vil ha dei til slutt i manuskriptet
format-captioned-end-title = { $kind ->
    [figure] Overskrift over figurane
   *[table] Overskrift over tabellane
}
format-captioned-end-title-hint = { $kind ->
    [figure] Figurar, Illustrasjonar; tomt for inga
   *[table] Tabellar; tomt for inga
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Linje som blir ståande i teksten
# The braces are written as they are; line is how the line will stand.
format-captioned-placeholder-shown = {"{}"} står for ordet og nummeret: { $line }
format-captioned-placeholder-missing = Den må innehalde {"{}"}, der ordet og nummeret skal stå
format-table-itself = Sjølve tabellen
format-table-rules = Linjer
format-table-rules-horizontal = Over, under og under overskriftene
format-table-rules-grid = Rundt kvar celle
format-table-rules-none = Ingen
format-table-rules-hint = Bøker og tidsskrift har det første
format-table-header-bold = Overskrifter i feit skrift
format-equations = Likningar
format-equations-stand = Likningane står
format-equations-before = Framfor nummeret
format-equations-after = Etter nummeret

## Page numbers and the running head.

format-page-numbers = Sidetal
format-page-numbers-show = Sidene blir nummererte
format-page-numbering = Forma på tala
format-number-arabic = 1, 2, 3
format-number-roman = I, II, III
format-number-roman-lower = i, ii, iii
format-number-letters = A, B, C
format-number-letters-lower = a, b, c
format-page-restart = Byrjar å telje sidene på nytt her
format-margin-header = Topptekst
format-margin-footer = Botntekst
format-margin-shown = Blir vist
format-margin-first-page = Òg på første side
format-margin-openers = Òg på sidene der eit kapittel eller ein del byrjar
format-margin-openers-hint = Ei overskrift som byrjar ei side, eller ein del på ei eiga side
format-margin-alternate = Ulik på venstre- og høgresider
format-margin-right-pages = På høgresider
format-margin-left-pages = På venstresider
format-margin-place-left = Venstre
format-margin-place-center = Midten
format-margin-place-right = Høgre
format-margin-add = Legg til …
# Said of an item in a place of the header or the footer.
format-margin-remove = Ta bort { $item }
format-margin-separator = Mellom det som står
format-margin-text-placeholder = Dine eigne ord
format-item-page-number = Sidetal
format-item-title = Tittel
format-item-author = Forfattar
format-item-chapter = Kapittel
format-item-date = Dato
format-item-text = Eigne ord

## About the layout: where its requirements are from.

format-description = Beskriving
format-source = Kvar krava kjem frå
# The date the source was read on.
format-source-read = Lesen { $date }.
format-source-high = Verdiane er kjelda sine.
format-source-medium = Kjelda kunne berre lesast delvis eller i ei tidlegare utgåve: sjekk det som tyder noko for deg.
format-source-low = Lite kunne stadfestast: sjå verdiane som eit utgangspunkt.
format-source-changed = Du har endra dette oppsettet; kjelda beskriv det det vart laga av.
format-source-none = Dette oppsettet følgjer ikkje krava til noko bestemt forlag.
