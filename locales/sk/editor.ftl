# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Formát
editor-writing = Písanie
editor-italic = Kurzíva
editor-bold = Tučné
editor-small-capitals = Kapitálky
editor-superscript = Horný index
editor-subscript = Dolný index
editor-struck = Prečiarknuté
editor-quotation = Citát
editor-block-quotation = Blokový citát
editor-list = Zoznam
editor-text = Text
editor-text-hint = Odsek
editor-quotation-hint = Oddelený od textu
editor-list-hint = So značkou pred každým bodom
editor-numbered-list = Číslovaný zoznam
editor-numbered-list-hint = S číslom pred každým bodom
editor-verse = Verš
editor-verse-hint = Riadky poézie alebo drámy, každý zachovaný ako riadok
editor-speaker = Hovoriaci
editor-speaker-hint = Kto hovorí, na vlastnom riadku
editor-direction = Scénická poznámka
editor-direction-hint = Čo sa deje, kurzívou
editor-line-numbers = Čísla riadkov
editor-line-numbers-hint = Číslovať riadky tohto verša: od ktorého riadku a po koľkých
editor-line-numbers-from = Číslovať riadky od
editor-line-numbers-none = Nechajte prázdne, ak nechcete čísla
editor-line-numbers-every = Zobraziť číslo každých
editor-line-numbers-number = Treba celé číslo.
editor-kinds-text = Text
editor-kinds-quotation = Citát
editor-kinds-verse = Verš
editor-kinds-script = Scenár
editor-kinds-more = Ďalšie
editor-kinds-words = Slová
editor-attribution = Autor citátu
editor-attribution-hint = Čie sú to slová, pod citátom vpravo
editor-epigraph = Epigraf
editor-epigraph-hint = Citát v záhlaví časti
editor-headword = Heslo
editor-headword-hint = Slovo, ktoré slovníček vysvetľuje
editor-gloss = Výklad
editor-gloss-hint = Čo heslo znamená
editor-code = Kód
editor-code-hint = Zachovaný písmeno po písmene, písmom rovnakej šírky
editor-break = Predel
editor-break-hint = Pauza medzi časťami so znakom, ktorý jej dáva formát
editor-draft = Pracovná poznámka
editor-draft-hint = Len pre vaše oči: do dokumentu nejde
editor-foreign = Cudzojazyčné slová
editor-foreign-hint = Slová v inom jazyku, ktorým sa riadi pravopis
editor-title-of-work = Názov diela
editor-title-of-work-hint = Názov knihy, hry, obrazu
editor-term = Termín
editor-term-hint = Termín tam, kde sa prvý raz používa
editor-mention = Zmienka
editor-mention-hint = Slovo, o ktorom sa hovorí ako o slove, v úvodzovkách
editor-highlight = Zvýraznenie
editor-highlight-hint = Pre oko na obrazovke: do dokumentu nejde
editor-underline = Podčiarknuté
editor-code-words = Kód v riadku
editor-code-words-hint = Písmo rovnakej šírky, vnútri riadku
editor-scene = Nadpis scény
editor-scene-hint = INT. DOM – NOC
editor-action = Akcia
editor-action-hint = Čo vidno a čo sa deje
editor-character = Postava
editor-character-hint = Kto hovorí, nad dialógom
editor-dialogue = Dialóg
editor-dialogue-hint = Čo sa hovorí
editor-parenthetical = Poznámka v zátvorke
editor-parenthetical-hint = Ako sa to hovorí, v zátvorkách
editor-transition = Prechod
editor-transition-hint = STRIH NA:, vpravo
editor-comment = Komentár
editor-comment-hint = Komentár k vybranému
editor-comment-element-hint = Komentár k tomuto prvku; vyberte slová, ak chcete komentovať ich
editor-parallel = Dva texty vedľa seba
editor-parallel-hint = Originál a jeho preklad, každý ako vlastný text
editor-paragraph-kind = Druh odseku
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Druh odseku: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Ďalšie…
editor-kinds-in-hand = Druhy poruke
editor-kinds-own = Vaše vlastné
editor-kinds-make = Vytvoriť druh…
editor-kinds-change-own = Zmeniť vlastný druh…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Vysádzané, ako ich má „{ $format }“
editor-kinds-change-format = Zmeniť formát…
editor-kinds-change-format-hint = Ako je každý druh vysádzaný v tomto dokumente
editor-words = Slová
editor-words-hint = Podčiarknutie, horný index, kód; cudzojazyčné slová, názov diela, termín
editor-words-make = Vytvoriť druh slov…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = Jazyk mapy
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Obyčajné slová
editor-own-kind-new = Vlastný druh
editor-own-kind-change = Zmeniť druh
editor-own-kind-name = Názov
editor-own-kind-name-placeholder = List, telegram, modlitba…
editor-own-kind-words-placeholder = Meno lode, latinčina, kľúčové slovo…
editor-own-kind-name-taken = Druh s týmto názvom už existuje.
editor-own-kind-based-on = Založený na
editor-own-kind-based-on-hint = Čo nie je povedané nižšie, je ako pri tomto druhu
editor-own-kind-look = Čím sa líši
editor-own-kind-create = Vytvoriť
editor-own-kind-delete-title = Odstrániť druh „{ $name }“?
editor-own-kind-delete-message = { $count ->
    [0] Žiadny text ho nemá.
    [one] Čo ho má v jednom prvku, ostane, ako je, a v dokumentoch sa vysádza ako text.
    [few] Čo ho má v { $count } prvkoch, ostane, ako je, a v dokumentoch sa vysádza ako text.
   *[other] Čo ho má v { $count } prvkoch, ostane, ako je, a v dokumentoch sa vysádza ako text.
}

## Citing, notes, and what is put into the text.

editor-cite = Citovať
editor-cite-here = Citovať dielo tu
editor-cite-at-cursor = Citovať dielo tam, kde je kurzor
editor-note = Poznámka
editor-note-selection = Urobiť z výberu poznámku
editor-note-hint = Poznámka pod čiarou alebo na konci
editor-insert = Vložiť
editor-insert-hint = Obrázok, tabuľka, matematika, odkaz
editor-new-element = Nový prvok
editor-new-element-hint = Nový prvok za týmto alebo pod ním
editor-new-after = Nový prvok za týmto
editor-new-under = Nový prvok pod týmto
editor-new-split = Rozdeliť tu
editor-new-split-hint = Čo nasleduje za kurzorom, sa stane novým prvkom
editor-spelling-on = Pravopis sa kontroluje pri písaní · stlačením vypnete
editor-spelling-off = Pravopis sa nekontroluje · stlačením zapnete
editor-picture-file = Obrázok zo súboru…
editor-picture-file-hint = Vyobrazenie s popiskou
editor-picture-store = Obrázok z úložiska…
editor-picture-store-hint = Tie, ktoré máte, sa zobrazia na boku
editor-equation = Rovnica
editor-equation-hint = Matematika na vlastnom riadku
editor-table = Tabuľka…
editor-table-hint = S toľkými riadkami a stĺpcami
editor-table-file = Tabuľka zo súboru…
editor-table-file-hint = CSV alebo hárok LibreOffice či Excelu
editor-formula = Vzorec
editor-formula-hint = Matematika v riadku
editor-pointer = Odkaz…
editor-pointer-hint = Na vyobrazenie, tabuľku, rovnicu alebo časť: „pozri obrázok 2“
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = obrázok

## More.

editor-found = Nájdené citácie…
editor-found-count = { $count ->
    [one] Treba prejsť { $count } a urobiť z nej citáciu
    [few] Treba prejsť { $count } a urobiť z nich citácie
   *[other] Treba prejsť { $count } a urobiť z nich citácie
}
editor-found-none = A text, ktorý vyzerá ako citácie, v tejto mape

## Choosing a work to cite.

editor-picker = Vyberte záznam
editor-picker-placeholder = Citovať: autor, názov, rok
editor-picker-search = Hľadať záznamy
editor-picker-results = Záznamy
editor-picker-in-project = V tomto projekte
editor-picker-recent = Nedávno pridané
editor-picker-empty = Vaša knižnica je prázdna.
editor-picker-no-match = Nič vo vašej knižnici neobsahuje tieto slová.
editor-picker-type = Píšte a hľadajte vo svojej knižnici.
editor-picker-new = Nový záznam…
editor-picker-import = Importovať…

## A citation, and each work in it.

editor-citation = Citácia
editor-citation-add = Pridať dielo
editor-citation-add-purpose = Pridať dielo do citácie
editor-citation-in-text = Autor v texte: Nagy (1979)
editor-citation-remove = Odstrániť citáciu
editor-citation-split = Oddeliť slová od citácie
editor-citation-split-hint = Slová pred a za sa stanú textom riadku a každé dielo vlastnou citáciou, len so svojou stranou a ničím iným
editor-citation-not-in-library = Tento záznam nie je vo vašej knižnici.
editor-citation-edit-reference = Upraviť záznam
editor-citation-before = Pred
editor-citation-before-placeholder = pozri, porov.
editor-citation-after = Za
editor-citation-after-placeholder = a passim
editor-citation-locator-kind = Druh miesta
editor-citation-suppress-author = Autora menujem vo svojej vete: uviesť len rok
editor-citation-remove-work = Odstrániť toto dielo
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [záznam nenájdený]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (citácia)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Strana
editor-locator-chapter = Kapitola
editor-locator-section = Oddiel
editor-locator-paragraph = Odsek
editor-locator-line = Riadok
editor-locator-verse = Verš
editor-locator-book = Kniha
editor-locator-volume = Zväzok
editor-locator-part = Časť
editor-locator-column = Stĺpec
editor-locator-folio = Fólio
editor-locator-figure = Obrázok
editor-locator-note = Poznámka
editor-locator-number = Číslo
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Poznámka { $number }
editor-note-place = Kde poznámka stojí
editor-note-place-format = Kde má formát svoje poznámky
editor-note-place-foot = Pod čiarou
editor-note-place-end = Na konci textu
editor-note-placeholder = Text poznámky
