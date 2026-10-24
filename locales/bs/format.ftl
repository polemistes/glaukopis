# Document formats: their kinds, and the editor of a format.

## The kinds of document format, as the formats are grouped by them.

format-kind-own = Vaši vlastiti
format-kind-general = Opći
format-kind-style-guide = Stilski priručnici
format-kind-publisher = Izdavači
format-kind-journal = Časopisi
format-kind-fiction = Beletristika
format-kind-stage = Scena i ekran
format-kind-poetry = Poezija

## The format editor.

format-name = Naziv formata
# The name a format of one's own is first given, made from that of the format it is made from.
format-name-changed = { $name }, izmijenjen
format-saved = „{ $name }“ je sačuvan među vašim vlastitim formatima
format-save-failed = Format nije bilo moguće sačuvati.
format-delete-failed = Format nije bilo moguće izbrisati.
format-delete-title = Izbrisati format „{ $name }“?
format-delete-message = Mape koje ga koriste koristit će umjesto njega opći format rukopisa.
format-delete-confirm = Izbriši format

## The parts of a format, as they are chosen at the left.

## Words that stand in several parts.

format-size = Veličina
format-bold = Podebljano
format-italic = Kurziv
format-letters = Slova
format-alignment = Poravnanje
format-line-spacing = Prored
format-as-the-text = Kao tekst
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = kao tekst
format-align-left = Lijevo
format-align-center = Centrirano
format-align-right = Desno
format-align-justified = Obostrano
format-align-ragged = Lijevo, desno neporavnato
format-case-none = Kako je napisano
format-case-upper = VELIKA SLOVA
format-case-smallcaps = Kapitalice
format-spacing-single = Jednostruki
format-spacing-one-and-a-half = Jedan i po
format-spacing-double = Dvostruki
format-stands-left = Lijevo
format-stands-center = U sredini
format-stands-right = Desno

## The page.

format-page-custom = Druga veličina
format-page-width = Širina
format-page-height = Visina
format-margins = Margine
format-margin-top = Gore
format-margin-bottom = Dolje
format-margin-left = Lijevo
format-margin-right = Desno
format-lengths-hint = Dužine se pišu s jedinicom: 2.5cm, 1in, 25mm, 12pt.
format-line-numbers = Numeriraj redove

## Type and spacing, and paragraphs.

format-typeface = Font
format-hyphenate = Rastavljaj riječi na kraju reda
format-indent-first = I poslije naslova
format-space-between = Razmak između pasusa
format-italics = Kurziv se slaže
format-italics-italic = Kao kurziv
format-italics-underline = Podvučeno, kako su ga imali rukopisi pisani mašinom

## Headings.

format-numbered = Numerirani
format-level = Nivo { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = podebljano
format-level-italic = kurziv
format-level-capitals = velika slova
format-level-small-caps = kapitalice
format-level-centred = centrirano
format-level-right = desno
format-level-run-in = utapa se u tekst
format-level-indent = Uvučen kao pasus
format-level-new-page-said = na novoj stranici
format-space-before = Razmak prije
format-space-after = Razmak poslije
format-level-add = Dublji nivo
format-level-remove = Ukloni najdublji

## The title and the abstract.

format-title-placement = Naslov stoji
format-title-top = Na vrhu prve stranice
format-title-own-page = Na vlastitoj stranici
format-title-authors = Autori
format-title-affiliations = Njihove ustanove
format-title-date = Datum
format-title-abstract = Sažetak i ključne riječi
format-title-abstract-label = Naslov sažetka
format-title-keywords-label = Riječ ispred ključnih riječi

## Quotations, notes and the bibliography.

format-quote-from-words = Od ovoliko riječi
format-quote-from-lines = Ili ovoliko redova
format-notes-kind = Napomene stoje
format-notes-footnotes = Na dnu stranice
format-notes-endnotes = Na kraju teksta
format-notes-title = Naslov napomena
format-bibliography-title = Naslov
format-bibliography-new-page = Počinje na novoj stranici
format-bibliography-hanging-indent = Viseća uvlaka
format-bibliography-entry-spacing = Razmak između jedinica

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = zasnovana na { $base }
format-as-the-base = Kao osnova
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = kao osnova
format-yes = Da
format-no = Ne
format-underline = Podvučeno
format-equal-width = Slova jednake širine
format-equal-width-hint = Kako se slaže kod
format-indent-left = Uvlaka slijeva
format-indent-right = Uvlaka zdesna
format-first-line = Prvi red
format-first-line-hint = Koliko dalje počinje od ostalih
format-keep-with-next = Drži se uz sljedeći
format-keep-with-next-hint = Ne ostaje sam na dnu stranice
format-new-page = Počinje novu stranicu
format-break-text = Šta stoji u prekidu
format-break-text-hint = * * * gdje ništa nije rečeno; # za rukopis
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = nepodebljano
format-look-not-italic = bez kurziva
format-look-underlined = podvučeno
format-look-not-underlined = nepodvučeno
format-look-as-written = kako je napisano
format-look-left = lijevo
format-look-justified = obostrano
format-look-indent-left = { $length } uvučeno slijeva
format-look-indent-right = { $length } uvučeno zdesna
format-look-first-line = prvi red { $length }
format-look-space-before = { $length } prije
format-look-space-after = { $length } poslije
format-look-line-spacing = prored { $spacing }
format-look-equal-width = slova jednake širine
format-look-not-equal-width = slova nejednake širine
format-look-kept = drži se uz sljedeći
format-look-not-kept = ne drži se uz sljedeći
format-look-no-new-page = bez nove stranice
format-look-text = „{ $text }“ u prekidu

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Ilustracije
format-tables = Tabele
format-captioned-called = { $kind ->
    [figure] Ilustracija se zove
   *[table] Tabela se zove
}
format-captioned-reference = Gdje tekst na nju upućuje
format-captioned-label-bold = Riječ i broj podebljani
format-captioned-label-italic = Riječ i broj kurzivom
format-captioned-between = { $kind ->
    [figure] Između broja i natpisa
   *[table] Između broja i natpisa
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Tačka ({ $called }. Natpis)
   *[table] Tačka ({ $called }. Natpis)
}
format-between-colon = { $kind ->
    [figure] Dvotačka ({ $called }: Natpis)
   *[table] Dvotačka ({ $called }: Natpis)
}
format-between-line = { $kind ->
    [figure] Natpis u vlastitom redu
   *[table] Natpis u vlastitom redu
}
format-between-other = Drugo…
format-captioned-separator = Šta stoji između njih
format-captioned-own-line = { $kind ->
    [figure] Zatim natpis u vlastitom redu
   *[table] Zatim natpis u vlastitom redu
}
format-caption = { $kind ->
    [figure] Natpis
   *[table] Natpis
}
format-caption-stands = { $kind ->
    [figure] Natpis stoji
   *[table] Natpis stoji
}
format-caption-below = { $kind ->
    [figure] Ispod slike
   *[table] Ispod tabele
}
format-caption-above = { $kind ->
    [figure] Iznad slike
   *[table] Iznad tabele
}
format-captioned-where = { $kind ->
    [figure] Gdje ilustracije stoje
   *[table] Gdje tabele stoje
}
format-captioned-stand = { $kind ->
    [figure] Ilustracije stoje
   *[table] Tabele stoje
}
format-captioned-wrap = Tekst teče oko njih
format-captioned-placement = U dokumentu
format-captioned-in-text = U tekstu
format-captioned-at-end = Skupljene na kraju
format-captioned-end-title = { $kind ->
    [figure] Naslov iznad ilustracija
   *[table] Naslov iznad tabela
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Red ostavljen u tekstu
format-captioned-placeholder-missing = Mora sadržavati {"{}"}, gdje idu riječ i broj
format-table-rules = Linije
format-table-rules-horizontal = Iznad, ispod i ispod zaglavlja
format-table-rules-grid = Oko svake ćelije
format-table-rules-none = Nikakve
format-table-header-bold = Zaglavlja podebljana
format-equations = Jednačine
format-equations-stand = Jednačine stoje
format-equations-before = Prije broja
format-equations-after = Poslije broja

## Page numbers and the running head.

format-page-numbers = Brojevi stranica
format-page-numbers-show = Stranice su numerirane

## About the format: where its requirements are from.

format-description = Opis
format-source = Odakle su zahtjevi
# The date the source was read on.
format-source-read = Pročitano { $date }.
format-source-high = Vrijednosti su one iz izvora.
format-source-medium = Izvor se mogao pročitati samo djelimično ili u ranijem stanju: provjerite ono što vam je važno.
format-source-low = Malo se moglo provjeriti: uzmite vrijednosti kao početak.
