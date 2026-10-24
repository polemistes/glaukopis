# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-writing = Pisanje
editor-italic = Ležeče
editor-bold = Krepko
editor-small-capitals = Kapitelke
editor-superscript = Nadpisano
editor-subscript = Podpisano
editor-struck = Prečrtano
editor-quotation = Citat
editor-block-quotation = Daljši citat
editor-list = Seznam
editor-text = Besedilo
editor-text-hint = Odstavek
editor-quotation-hint = Ločen od besedila
editor-list-hint = Z oznako pred vsako točko
editor-numbered-list = Oštevilčen seznam
editor-numbered-list-hint = S številko pred vsako točko
editor-verse = Verzi
editor-verse-hint = Vrstice poezije ali drame, vsaka ohranjena kot vrstica
editor-speaker = Govorec
editor-speaker-hint = Kdo govori, v svoji vrstici
editor-direction = Didaskalija
editor-direction-hint = Kaj se dogaja, ležeče
editor-line-numbers-from = Številči vrstice od
editor-line-numbers-every = Pokaži številko na vsakih
editor-line-numbers-number = Potrebno je celo število.
editor-kinds-text = Besedilo
editor-kinds-quotation = Citat
editor-kinds-verse = Verzi
editor-kinds-script = Scenarij
editor-kinds-more = Več
editor-kinds-words = Besede
editor-attribution = Avtor citata
editor-attribution-hint = Čigave so besede, pod citatom, na desni
editor-epigraph = Moto
editor-epigraph-hint = Citat na čelu dela
editor-headword = Geslo
editor-headword-hint = Beseda, ki jo slovarček razlaga
editor-gloss = Razlaga
editor-gloss-hint = Kaj geslo pomeni
editor-code = Koda
editor-code-hint = Ohranjena črko za črko, v enako širokih črkah
editor-break = Premor
editor-break-hint = Premor med deli, z znakom, ki mu ga daje format
editor-draft = Delovna opomba
editor-draft-hint = Za vaše oči: ne gre v noben dokument
editor-foreign = Tujejezične besede
editor-foreign-hint = Besede v drugem jeziku, ki mu sledi črkovanje
editor-title-of-work = Naslov dela
editor-title-of-work-hint = Naslov knjige, drame, slike
editor-term = Izraz
editor-term-hint = Izraz, kjer je prvič uporabljen
editor-mention = Omemba
editor-mention-hint = Beseda, o kateri govorimo kot o besedi, v narekovajih
editor-highlight = Poudarek
editor-highlight-hint = Za oko na zaslonu: ne gre v noben dokument
editor-underline = Podčrtano
editor-code-words = Koda v vrstici
editor-scene = Naslov prizora
editor-scene-hint = INT. HIŠA – NOČ
editor-action = Dogajanje
editor-action-hint = Kaj se vidi in dogaja
editor-character = Lik
editor-character-hint = Kdo govori, nad dialogom
editor-dialogue = Dialog
editor-dialogue-hint = Kaj je rečeno
editor-parenthetical = Opomba v oklepaju
editor-parenthetical-hint = Kako je rečeno, v oklepaju
editor-transition = Prehod
editor-transition-hint = REZ NA:, na desni
editor-comment = Komentar
editor-parallel = Dve besedili vzporedno
editor-paragraph-kind = Vrsta odstavka
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Vrsta odstavka: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Več…
editor-kinds-own = Vaše lastne
editor-kinds-make = Naredi vrsto…
editor-kinds-change-own = Spremeni lastno vrsto…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Postavljene, kakor jih ima »{ $format }«
editor-words-make = Naredi vrsto besed…
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Navadne besede
editor-own-kind-new = Lastna vrsta
editor-own-kind-change = Spremeni vrsto
editor-own-kind-name = Ime
editor-own-kind-name-placeholder = Pismo, telegram, molitev…
editor-own-kind-words-placeholder = Ime ladje, latinščina, ključna beseda…
editor-own-kind-name-taken = Vrsta s tem imenom že obstaja.
editor-own-kind-based-on = Izhaja iz
editor-own-kind-based-on-hint = Kar spodaj ni povedano, je, kakor ima ta vrsta
editor-own-kind-look = V čem se razlikuje
editor-own-kind-create = Ustvari
editor-own-kind-delete-title = Izbrisati vrsto »{ $name }«?
editor-own-kind-delete-message = { $count ->
    [0] Nobeno besedilo ni te vrste.
    [one] Kar je te vrste v { $count } elementu, ostane, kakor je, in se v dokumentih postavi kot besedilo.
    [two] Kar je te vrste v { $count } elementih, ostane, kakor je, in se v dokumentih postavi kot besedilo.
    [few] Kar je te vrste v { $count } elementih, ostane, kakor je, in se v dokumentih postavi kot besedilo.
   *[other] Kar je te vrste v { $count } elementih, ostane, kakor je, in se v dokumentih postavi kot besedilo.
}

## Citing, notes, and what is put into the text.

editor-cite-here = Navedi delo tukaj
editor-note = Opomba
editor-note-selection = Naredi iz izbora opombo
editor-insert = Vstavi
editor-spelling-on = Črkovanje se preverja med pisanjem · pritisnite, da nehate
editor-spelling-off = Črkovanje se ne preverja · pritisnite, da se preverja
editor-equation = Enačba
editor-table = Tabela…
editor-table-file = Tabela iz datoteke…
editor-formula = Formula
editor-pointer = Sklic…
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = slika

## More.


## Choosing a work to cite.

editor-picker = Izberite vir
editor-picker-placeholder = Navedi: avtor, naslov, leto
editor-picker-search = Išči vire
editor-picker-results = Viri
editor-picker-in-project = V tem projektu
editor-picker-recent = Nedavno dodani
editor-picker-empty = Vaša knjižnica je prazna.
editor-picker-no-match = Nič v vaši knjižnici ne vsebuje teh besed.
editor-picker-type = Tipkajte, da iščete po knjižnici.
editor-picker-new = Nov vir…
editor-picker-import = Uvozi…

## A citation, and each work in it.

editor-citation = Navedba
editor-citation-add = Dodaj delo
editor-citation-add-purpose = Dodaj delo v navedbo
editor-citation-in-text = Avtor v besedilu: Nagy (1979)
editor-citation-remove = Odstrani navedbo
editor-citation-split = Loči besede od navedbe
editor-citation-split-hint = Besede pred njo in za njo postanejo besedilo vrstice, vsako delo pa svoja navedba, s svojo stranjo in ničimer drugim
editor-citation-not-in-library = Tega vira ni v vaši knjižnici.
editor-citation-edit-reference = Uredi vir
editor-citation-before = Pred
editor-citation-before-placeholder = gl., prim.
editor-citation-after = Za
editor-citation-after-placeholder = in passim
editor-citation-locator-kind = Vrsta mesta
editor-citation-suppress-author = Avtor je imenovan v mojem stavku: podaj le leto
editor-citation-remove-work = Odstrani to delo
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [vir ni najden]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (navedba)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Stran
editor-locator-chapter = Poglavje
editor-locator-section = Razdelek
editor-locator-paragraph = Odstavek
editor-locator-line = Vrstica
editor-locator-verse = Verz
editor-locator-book = Knjiga
editor-locator-volume = Zvezek
editor-locator-part = Del
editor-locator-column = Stolpec
editor-locator-folio = Folij
editor-locator-figure = Slika
editor-locator-note = Opomba
editor-locator-number = Številka
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Opomba { $number }
editor-note-place = Kje stoji opomba
editor-note-place-format = Kjer ima format svoje opombe
editor-note-place-foot = Pod črto
editor-note-place-end = Na koncu besedila
editor-note-placeholder = Besedilo opombe
