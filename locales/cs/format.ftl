# Document formats: their kinds, and the editor of a format.

## The kinds of document format, as the formats are grouped by them.

format-kind-own = Vaše vlastní
format-kind-general = Obecné
format-kind-style-guide = Stylistické příručky
format-kind-publisher = Nakladatelství
format-kind-journal = Časopisy
format-kind-fiction = Beletrie
format-kind-stage = Divadlo a film
format-kind-poetry = Poezie

## The format editor.

format-name = Název formátu
# The name a format of one's own is first given, made from that of the format it is made from.
format-name-changed = { $name }, upravený
format-saved = „{ $name }“ je uložen mezi vašimi formáty
format-save-failed = Formát nelze uložit.
format-delete-failed = Formát nelze smazat.
format-delete-title = Smazat formát „{ $name }“?
format-delete-message = Mapy, které ho používají, použijí místo něj obecný formát rukopisu.
format-delete-confirm = Smazat formát

## The parts of a format, as they are chosen at the left.

## Words that stand in several parts.

format-size = Velikost
format-bold = Tučně
format-italic = Kurzíva
format-letters = Písmena
format-alignment = Zarovnání
format-line-spacing = Řádkování
format-as-the-text = Jako text
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = jako text
format-align-left = Vlevo
format-align-center = Na střed
format-align-right = Vpravo
format-align-justified = Do bloku
format-align-ragged = Vlevo, s nezarovnaným pravým okrajem
format-case-none = Jak je psáno
format-case-upper = VERZÁLKY
format-case-smallcaps = Kapitálky
format-spacing-single = Jednoduché
format-spacing-one-and-a-half = Jedna a půl
format-spacing-double = Dvojité
format-stands-left = Vlevo
format-stands-center = Uprostřed
format-stands-right = Vpravo

## The page.

format-page-custom = Jiná velikost
format-page-width = Šířka
format-page-height = Výška
format-margins = Okraje
format-margin-top = Horní
format-margin-bottom = Dolní
format-margin-left = Levý
format-margin-right = Pravý
format-lengths-hint = Délky se píší s jednotkou: 2.5cm, 1in, 25mm, 12pt.
format-line-numbers = Číslovat řádky

## Type and spacing, and paragraphs.

format-typeface = Písmo
format-hyphenate = Dělit slova na koncích řádků
format-indent-first = I za nadpisem
format-space-between = Mezera mezi odstavci
format-italics = Kurzíva se sází
format-italics-italic = Jako kurzíva
format-italics-underline = Podtržením, jako ve strojopisných rukopisech

## Headings.

format-numbered = Číslované
format-level = Úroveň { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = tučně
format-level-italic = kurzívou
format-level-capitals = verzálkami
format-level-small-caps = kapitálkami
format-level-centred = na střed
format-level-right = vpravo
format-level-run-in = vbíhá do textu
format-level-indent = Odsazen jako odstavec
format-level-new-page-said = na nové straně
format-space-before = Mezera před
format-space-after = Mezera za
format-level-add = Hlubší úroveň
format-level-remove = Odebrat nejhlubší

## The title and the abstract.

format-title-placement = Název stojí
format-title-top = Nahoře na první straně
format-title-own-page = Na vlastní straně
format-title-authors = Autoři
format-title-affiliations = Jejich pracoviště
format-title-date = Datum
format-title-abstract = Abstrakt a klíčová slova
format-title-abstract-label = Nadpis abstraktu
format-title-keywords-label = Slovo před klíčovými slovy

## Quotations, notes and the bibliography.

format-quote-from-words = Od tohoto počtu slov
format-quote-from-lines = Nebo tohoto počtu řádků
format-notes-kind = Poznámky stojí
format-notes-footnotes = Pod čarou
format-notes-endnotes = Na konci textu
format-notes-title = Nadpis poznámek
format-bibliography-title = Nadpis
format-bibliography-new-page = Začíná na nové straně
format-bibliography-hanging-indent = Předsazení
format-bibliography-entry-spacing = Mezera mezi záznamy

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = založen na { $base }
format-as-the-base = Jako základ
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = jako základ
format-yes = Ano
format-no = Ne
format-underline = Podtržené
format-equal-width = Písmo stejné šířky
format-equal-width-hint = Jako se sází kód
format-indent-left = Odsazení zleva
format-indent-right = Odsazení zprava
format-first-line = První řádek
format-first-line-hint = O kolik začíná dál než ostatní
format-keep-with-next = Držet s následujícím
format-keep-with-next-hint = Nezůstane sám na konci strany
format-new-page = Začíná novou stranu
format-break-text = Co stojí v předělu
format-break-text-hint = * * * není-li řečeno nic; # pro rukopis
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = ne tučně
format-look-not-italic = ne kurzívou
format-look-underlined = podtržené
format-look-not-underlined = nepodtržené
format-look-as-written = jak je psáno
format-look-left = vlevo
format-look-justified = do bloku
format-look-indent-left = { $length } zleva
format-look-indent-right = { $length } zprava
format-look-first-line = první řádek { $length }
format-look-space-before = { $length } před
format-look-space-after = { $length } za
format-look-line-spacing = řádkování { $spacing }
format-look-equal-width = písmo stejné šířky
format-look-not-equal-width = písmo nestejné šířky
format-look-kept = drženo s následujícím
format-look-not-kept = nedrženo s následujícím
format-look-no-new-page = bez nové strany
format-look-text = „{ $text }“ v předělu

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Vyobrazení
format-tables = Tabulky
format-captioned-called = { $kind ->
    [figure] Vyobrazení se nazývá
   *[table] Tabulka se nazývá
}
format-captioned-reference = Kde na ně text odkazuje
format-captioned-label-bold = Slovo a číslo tučně
format-captioned-label-italic = Slovo a číslo kurzívou
format-captioned-between = { $kind ->
    [figure] Mezi číslem a popiskem
   *[table] Mezi číslem a popiskem
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Tečka ({ $called }. Popisek)
   *[table] Tečka ({ $called }. Popisek)
}
format-between-colon = { $kind ->
    [figure] Dvojtečka ({ $called }: Popisek)
   *[table] Dvojtečka ({ $called }: Popisek)
}
format-between-line = { $kind ->
    [figure] Popisek na vlastním řádku
   *[table] Popisek na vlastním řádku
}
format-between-other = Jiné…
format-captioned-separator = Co stojí mezi nimi
format-captioned-own-line = { $kind ->
    [figure] Pak popisek na vlastním řádku
   *[table] Pak popisek na vlastním řádku
}
format-caption = { $kind ->
    [figure] Popisek
   *[table] Popisek
}
format-caption-stands = { $kind ->
    [figure] Popisek stojí
   *[table] Popisek stojí
}
format-caption-below = { $kind ->
    [figure] Pod obrázkem
   *[table] Pod tabulkou
}
format-caption-above = { $kind ->
    [figure] Nad obrázkem
   *[table] Nad tabulkou
}
format-captioned-where = { $kind ->
    [figure] Kde vyobrazení stojí
   *[table] Kde tabulky stojí
}
format-captioned-stand = { $kind ->
    [figure] Vyobrazení stojí
   *[table] Tabulky stojí
}
format-captioned-wrap = Text je obtéká
format-captioned-placement = V dokumentu
format-captioned-in-text = V textu
format-captioned-at-end = Shromážděné na konci
format-captioned-end-title = { $kind ->
    [figure] Nadpis nad vyobrazeními
   *[table] Nadpis nad tabulkami
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Řádek ponechaný v textu
format-captioned-placeholder-missing = Musí obsahovat {"{}"}, kam přijde slovo a číslo
format-table-rules = Linky
format-table-rules-horizontal = Nad, pod a pod záhlavím
format-table-rules-grid = Kolem každé buňky
format-table-rules-none = Žádné
format-table-header-bold = Záhlaví tučně
format-equations = Rovnice
format-equations-stand = Rovnice stojí
format-equations-before = Před číslem
format-equations-after = Za číslem

## Page numbers and the running head.

format-page-numbers = Čísla stran
format-page-numbers-show = Strany jsou číslovány

## About the format: where its requirements are from.

format-description = Popis
format-source = Odkud požadavky pocházejí
# The date the source was read on.
format-source-read = Přečteno { $date }.
format-source-high = Hodnoty jsou ty ze zdroje.
format-source-medium = Zdroj bylo možné přečíst jen zčásti nebo v dřívějším stavu: ověřte si, na čem vám záleží.
format-source-low = Málo se dalo ověřit: berte hodnoty jako východisko.
