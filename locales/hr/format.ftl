# Document formats: their kinds, and the editor of a format.

## The kinds of document format, as the formats are grouped by them.

format-kind-own = Vlastiti
format-kind-general = Opći
format-kind-style-guide = Stilski priručnici
format-kind-publisher = Nakladnici
format-kind-journal = Časopisi
format-kind-fiction = Proza
format-kind-stage = Kazalište i film
format-kind-poetry = Poezija

## The format editor.

format-name = Naziv formata
# The name a format of one's own is first given, made from that of the format it is made from.
format-name-changed = { $name }, izmijenjen
format-saved = „{ $name }” spremljen je među vaše formate
format-save-failed = Format nije bilo moguće spremiti.
format-delete-failed = Format nije bilo moguće izbrisati.
format-delete-title = Izbrisati format „{ $name }”?
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
# Beside a number of 0, in the place of its unit.
format-not-said = nije rečeno
format-align-left = Lijevo
format-align-center = Centrirano
format-align-right = Desno
format-align-justified = Obostrano
format-align-ragged = Lijevo, desno neporavnano
format-case-none = Kako je napisano
format-case-upper = VELIKA SLOVA
format-case-smallcaps = Kapitalke
format-spacing-single = Jednostruki
format-spacing-one-and-a-half = Jedan i pol
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
format-lengths-hint = Duljine se pišu s jedinicom: 2.5cm, 1in, 25mm, 12pt.
format-line-numbers = Numeriraj retke

## Type and spacing, and paragraphs.

format-typeface = Pismo
format-hyphenate = Rastavljaj riječi na kraju retka
format-paragraphs = Odlomci se razlikuju po
format-paragraphs-indent = Uvučenom prvom retku
format-paragraphs-spaced = Razmaku među njima
format-indent = Uvlaka
format-indent-first = I iza naslova
format-space-between = Razmak među odlomcima
format-italics = Kurziv se slaže
format-italics-italic = Kao kurziv
format-italics-underline = Podcrtano, kako su ga imali rukopisi s pisaćeg stroja

## Headings.

format-numbered = Numerirani
format-level = Razina { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = podebljano
format-level-italic = kurziv
format-level-capitals = velika slova
format-level-small-caps = kapitalke
format-level-centred = centrirano
format-level-right = desno
format-level-run-in = utječe u tekst
format-level-indent = Uvučen kao odlomak
format-level-new-page-said = na novoj stranici
format-space-before = Razmak prije
format-space-after = Razmak poslije
format-level-add = Dublja razina
format-level-remove = Ukloni najdublju

## The title and the abstract.

format-title-placement = Naslov stoji
format-title-top = Na vrhu prve stranice
format-title-own-page = Na zasebnoj stranici
format-title-authors = Autori
format-title-affiliations = Njihove ustanove
format-title-date = Datum
format-title-abstract = Sažetak i ključne riječi
format-title-abstract-label = Naslov sažetka
format-title-keywords-label = Riječ ispred ključnih riječi

## Quotations, notes and the bibliography.

format-quote-indent-left = Uvlaka slijeva
format-quote-indent-right = Uvlaka zdesna
format-quote-when = Kad se navod izdvaja
format-quote-from-words = Od ovoliko riječi
format-quote-from-lines = Ili ovoliko redaka
format-notes-kind = Bilješke stoje
format-notes-footnotes = U podnožju stranice
format-notes-endnotes = Na kraju teksta
format-notes-title = Naslov bilježaka
format-bibliography-title = Naslov
format-bibliography-new-page = Počinje na novoj stranici
format-bibliography-hanging-indent = Viseća uvlaka
format-bibliography-entry-spacing = Razmak među jedinicama

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = na temelju { $base }
format-as-the-base = Kao temelj
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = kao temelj
format-yes = Da
format-no = Ne
format-underline = Podcrtano
format-equal-width = Slova jednake širine
format-equal-width-hint = Kako se slaže kod
format-indent-left = Uvlaka slijeva
format-indent-right = Uvlaka zdesna
format-first-line = Prvi redak
format-first-line-hint = Koliko počinje uvučeno, više od ostalih
format-keep-with-next = Drži se uz sljedeći
format-keep-with-next-hint = Ne ostaje sam u podnožju stranice
format-new-page = Počinje novu stranicu
format-break-text = Što stoji u stanci
format-break-text-hint = * * * gdje ništa nije rečeno; # za rukopis
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = nije podebljano
format-look-not-italic = nije kurziv
format-look-underlined = podcrtano
format-look-not-underlined = nije podcrtano
format-look-as-written = kako je napisano
format-look-left = lijevo
format-look-justified = obostrano
format-look-indent-left = { $length } uvučeno slijeva
format-look-indent-right = { $length } uvučeno zdesna
format-look-first-line = prvi redak { $length }
format-look-space-before = { $length } prije
format-look-space-after = { $length } poslije
format-look-line-spacing = prored { $spacing }
format-look-equal-width = slova jednake širine
format-look-not-equal-width = slova nejednake širine
format-look-kept = drži se uz sljedeći
format-look-not-kept = ne drži se uz sljedeći
format-look-no-new-page = bez nove stranice
format-look-text = „{ $text }” u stanci

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Ilustracije
format-tables = Tablice
format-captioned-called = { $kind ->
    [figure] Ilustracija se zove
   *[table] Tablica se zove
}
format-captioned-reference = Gdje tekst na nju upućuje
format-captioned-label-bold = Riječ i broj podebljano
format-captioned-label-italic = Riječ i broj kurzivom
format-captioned-between = { $kind ->
    [figure] Između broja i opisa
   *[table] Između broja i opisa
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Točka ({ $called }. Opis)
   *[table] Točka ({ $called }. Opis)
}
format-between-colon = { $kind ->
    [figure] Dvotočka ({ $called }: Opis)
   *[table] Dvotočka ({ $called }: Opis)
}
format-between-line = { $kind ->
    [figure] Opis u zasebnom retku
   *[table] Opis u zasebnom retku
}
format-between-other = Drugo…
format-captioned-separator = Što stoji između njih
format-captioned-own-line = { $kind ->
    [figure] Zatim opis u zasebnom retku
   *[table] Zatim opis u zasebnom retku
}
format-caption = { $kind ->
    [figure] Opis
   *[table] Opis
}
format-caption-stands = { $kind ->
    [figure] Opis stoji
   *[table] Opis stoji
}
format-caption-below = { $kind ->
    [figure] Ispod slike
   *[table] Ispod tablice
}
format-caption-above = { $kind ->
    [figure] Iznad slike
   *[table] Iznad tablice
}
format-captioned-where = { $kind ->
    [figure] Gdje stoje ilustracije
   *[table] Gdje stoje tablice
}
format-captioned-stand = { $kind ->
    [figure] Ilustracije stoje
   *[table] Tablice stoje
}
format-captioned-wrap = Tekst ih optječe
format-captioned-placement = U dokumentu
format-captioned-in-text = U tekstu
format-captioned-at-end = Skupljene na kraju
format-captioned-end-title = { $kind ->
    [figure] Naslov iznad ilustracija
   *[table] Naslov iznad tablica
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Redak ostavljen u tekstu
format-captioned-placeholder-missing = Mora sadržavati {"{}"}, gdje idu riječ i broj
format-table-rules = Crte
format-table-rules-horizontal = Iznad, ispod i ispod zaglavlja
format-table-rules-grid = Oko svake ćelije
format-table-rules-none = Nikakve
format-table-header-bold = Zaglavlja podebljana
format-equations = Jednadžbe
format-equations-stand = Jednadžbe stoje
format-equations-before = Ispred broja
format-equations-after = Iza broja

## Page numbers and the running head.

format-page-numbers = Brojevi stranica
format-page-numbers-show = Stranice su numerirane

## About the format: where its requirements are from.

format-description = Opis
format-source = Odakle su zahtjevi
# The date the source was read on.
format-source-read = Pročitano { $date }.
format-source-high = Vrijednosti su one iz izvora.
format-source-medium = Izvor se mogao pročitati samo djelomično ili u ranijem stanju: provjerite što vam je važno.
format-source-low = Malo se toga moglo provjeriti: uzmite vrijednosti kao početak.
