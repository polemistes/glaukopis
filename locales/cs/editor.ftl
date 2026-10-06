# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Formát
editor-writing = Psaní
editor-italic = Kurzíva
editor-bold = Tučně
editor-small-capitals = Kapitálky
editor-superscript = Horní index
editor-subscript = Dolní index
editor-struck = Přeškrtnuté
editor-quotation = Citát
editor-block-quotation = Blokový citát
editor-list = Seznam
editor-text = Text
editor-text-hint = Odstavec
editor-quotation-hint = Oddělený od textu
editor-list-hint = S odrážkou před každým bodem
editor-numbered-list = Číslovaný seznam
editor-numbered-list-hint = S číslem před každým bodem
editor-verse = Verše
editor-verse-hint = Řádky poezie nebo dramatu, každý zachován jako řádek
editor-speaker = Mluvčí
editor-speaker-hint = Kdo mluví, na vlastním řádku
editor-direction = Scénická poznámka
editor-direction-hint = Co se děje, kurzívou
editor-line-numbers = Čísla řádků
editor-line-numbers-hint = Číslovat řádky těchto veršů: od kterého řádku a po kolika
editor-line-numbers-from = Číslovat řádky od
editor-line-numbers-none = Prázdné znamená bez čísel
editor-line-numbers-every = Číslo zobrazit po každých
editor-line-numbers-number = Je třeba celé číslo.
editor-kinds-text = Text
editor-kinds-quotation = Citát
editor-kinds-verse = Verše
editor-kinds-script = Scénář
editor-kinds-more = Další
editor-kinds-words = Slova
editor-attribution = Autor citátu
editor-attribution-hint = Čí jsou to slova, pod citátem, vpravo
editor-epigraph = Motto
editor-epigraph-hint = Citát v čele části
editor-headword = Heslo
editor-headword-hint = Slovo, které glosář vysvětluje
editor-gloss = Výklad
editor-gloss-hint = Co heslo znamená
editor-code = Kód
editor-code-hint = Zachován písmeno po písmenu, písmem stejné šířky
editor-break = Předěl
editor-break-hint = Pauza mezi částmi, se znakem, který jí dává formát
editor-draft = Pracovní poznámka
editor-draft-hint = Jen pro vaše oči: do žádného dokumentu nejde
editor-foreign = Cizojazyčná slova
editor-foreign-hint = Slova v jiném jazyce, jímž se řídí kontrola pravopisu
editor-title-of-work = Název díla
editor-title-of-work-hint = Název knihy, hry, obrazu
editor-term = Termín
editor-term-hint = Termín tam, kde je poprvé užit
editor-mention = Zmínka
editor-mention-hint = Slovo, o němž se mluví jako o slovu, v uvozovkách
editor-highlight = Zvýraznění
editor-highlight-hint = Pro oko na obrazovce: do žádného dokumentu nejde
editor-underline = Podtržené
editor-code-words = Kód v řádku
editor-code-words-hint = Písmo stejné šířky, uvnitř řádku
editor-scene = Nadpis scény
editor-scene-hint = INT. DŮM – NOC
editor-action = Akce
editor-action-hint = Co je vidět a co se děje
editor-character = Postava
editor-character-hint = Kdo mluví, nad dialogem
editor-dialogue = Dialog
editor-dialogue-hint = Co se říká
editor-parenthetical = Poznámka v závorce
editor-parenthetical-hint = Jak se to říká, v závorkách
editor-transition = Přechod
editor-transition-hint = STŘIH NA:, vpravo
editor-comment = Komentář
editor-comment-hint = Komentář k vybranému
editor-comment-element-hint = Komentář k tomuto prvku; vyberte slova, chcete-li komentovat je
editor-parallel = Dva texty vedle sebe
editor-parallel-hint = Originál a jeho překlad, každý jako samostatný text
editor-paragraph-kind = Druh odstavce
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Druh odstavce: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Další…
editor-kinds-in-hand = Druhy po ruce
editor-kinds-own = Vaše vlastní
editor-kinds-make = Vytvořit druh…
editor-kinds-change-own = Upravit vlastní druh…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Vzhled podle formátu „{ $format }“
editor-kinds-change-format = Upravit formát…
editor-kinds-change-format-hint = Jak je každý druh v tomto dokumentu vysázen
editor-words = Slova
editor-words-hint = Podtržení, horní index, kód; cizojazyčná slova, název díla, termín
editor-words-make = Vytvořit druh slov…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = Jazyk mapy
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Prostá slova
editor-own-kind-new = Vlastní druh
editor-own-kind-change = Upravit druh
editor-own-kind-name = Název
editor-own-kind-name-placeholder = Dopis, telegram, modlitba…
editor-own-kind-words-placeholder = Jméno lodi, latina, klíčové slovo…
editor-own-kind-name-taken = Druh s tímto názvem už existuje.
editor-own-kind-based-on = Založen na
editor-own-kind-based-on-hint = Co není řečeno níže, je jako u tohoto druhu
editor-own-kind-look = Čím se liší
editor-own-kind-create = Vytvořit
editor-own-kind-delete-title = Smazat druh „{ $name }“?
editor-own-kind-delete-message = { $count ->
    [0] Žádný text ho nemá.
    [one] Co je jím označeno v jednom prvku, zůstane, jak je, a v dokumentech se vysází jako text.
    [few] Co je jím označeno ve { $count } prvcích, zůstane, jak je, a v dokumentech se vysází jako text.
   *[other] Co je jím označeno v { $count } prvcích, zůstane, jak je, a v dokumentech se vysází jako text.
}

## Citing, notes, and what is put into the text.

editor-cite = Citovat
editor-cite-here = Citovat zde dílo
editor-cite-at-cursor = Citovat dílo tam, kde je kurzor
editor-note = Poznámka
editor-note-selection = Udělat z výběru poznámku
editor-note-hint = Poznámka pod čarou nebo na konci
editor-insert = Vložit
editor-insert-hint = Obrázek, tabulku, matematiku, křížový odkaz
editor-new-element = Nový prvek
editor-new-element-hint = Nový prvek za tímto, nebo pod ním
editor-new-after = Nový prvek za tímto
editor-new-under = Nový prvek pod tímto
editor-new-split = Rozdělit zde
editor-new-split-hint = Co následuje za kurzorem, se stane novým prvkem
editor-spelling-on = Pravopis se kontroluje při psaní · stisknutím vypnete
editor-spelling-off = Pravopis se nekontroluje · stisknutím zapnete
editor-picture-file = Obrázek ze souboru…
editor-picture-file-hint = Vyobrazení, s tím, co se o něm říká
editor-picture-store = Obrázek z úložiště…
editor-picture-store-hint = Ty, které máte, se zobrazí na straně
editor-equation = Rovnice
editor-equation-hint = Matematika na vlastním řádku
editor-table = Tabulka…
editor-table-hint = O tolika řádcích a sloupcích
editor-table-file = Tabulka ze souboru…
editor-table-file-hint = CSV nebo sešit LibreOffice či Excelu
editor-formula = Vzorec
editor-formula-hint = Matematika v řádku
editor-pointer = Křížový odkaz…
editor-pointer-hint = Na vyobrazení, tabulku, rovnici nebo část: „viz obrázek 2“
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = obrazek

## More.

editor-found = Nalezené citace…
editor-found-count = { $count } k projití a převedení na citace
editor-found-none = A text, který vypadá jako citace, v této mapě

## Choosing a work to cite.

editor-picker = Vyberte záznam
editor-picker-placeholder = Citovat: autor, název, rok
editor-picker-search = Hledat záznamy
editor-picker-results = Záznamy
editor-picker-in-project = V tomto projektu
editor-picker-recent = Nedávno přidané
editor-picker-empty = Vaše knihovna je prázdná.
editor-picker-no-match = Nic ve vaší knihovně tato slova neobsahuje.
editor-picker-type = Pište a hledejte ve své knihovně.
editor-picker-new = Nový záznam…
editor-picker-import = Importovat…

## A citation, and each work in it.

editor-citation = Citace
editor-citation-add = Přidat dílo
editor-citation-add-purpose = Přidat dílo do citace
editor-citation-in-text = Autor v textu: Nagy (1979)
editor-citation-remove = Odstranit citaci
editor-citation-split = Oddělit slova od citace
editor-citation-split-hint = Slova před a za se stanou textem řádku a každé dílo samostatnou citací, jen se svou stranou
editor-citation-not-in-library = Tento záznam není ve vaší knihovně.
editor-citation-edit-reference = Upravit záznam
editor-citation-before = Před
editor-citation-before-placeholder = viz, srov.
editor-citation-after = Za
editor-citation-after-placeholder = a passim
editor-citation-locator-kind = Druh místa
editor-citation-suppress-author = Autora jmenuje má věta: uvést jen rok
editor-citation-remove-work = Odebrat toto dílo
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [záznam nenalezen]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (citace)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Strana
editor-locator-chapter = Kapitola
editor-locator-section = Oddíl
editor-locator-paragraph = Odstavec
editor-locator-line = Řádek
editor-locator-verse = Verš
editor-locator-book = Kniha
editor-locator-volume = Svazek
editor-locator-part = Část
editor-locator-column = Sloupec
editor-locator-folio = Folio
editor-locator-figure = Obrázek
editor-locator-note = Poznámka
editor-locator-number = Číslo
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Poznámka { $number }
editor-note-place = Kde poznámka stojí
editor-note-place-format = Kde má formát své poznámky
editor-note-place-foot = Pod čarou
editor-note-place-end = Na konci textu
editor-note-placeholder = Text poznámky
