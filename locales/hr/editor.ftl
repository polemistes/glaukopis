# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Format
editor-writing = Pisanje
editor-italic = Kurziv
editor-bold = Podebljano
editor-small-capitals = Kapitalke
editor-superscript = Eksponent
editor-subscript = Indeks
editor-struck = Precrtano
editor-quotation = Navod
editor-block-quotation = Izdvojeni navod
editor-list = Popis
editor-text = Tekst
editor-text-hint = Odlomak
editor-quotation-hint = Izdvojen iz teksta
editor-list-hint = S oznakom ispred svake točke
editor-numbered-list = Numerirani popis
editor-numbered-list-hint = S brojem ispred svake točke
editor-verse = Stihovi
editor-verse-hint = Redci poezije ili drame, svaki zadržan kao redak
editor-speaker = Govornik
editor-speaker-hint = Tko govori, u zasebnom retku
editor-direction = Didaskalija
editor-direction-hint = Što se radi, kurzivom
editor-line-numbers = Brojevi redaka
editor-line-numbers-hint = Numeriraj retke ovih stihova: od kojeg retka i svakih koliko
editor-line-numbers-from = Numeriraj retke od
editor-line-numbers-none = Prazno: bez brojeva
editor-line-numbers-every = Prikaži broj svakih
editor-line-numbers-number = Potreban je cijeli broj.
editor-kinds-text = Tekst
editor-kinds-quotation = Navod
editor-kinds-verse = Stihovi
editor-kinds-script = Scenarij
editor-kinds-more = Više
editor-kinds-words = Riječi
editor-attribution = Izvor navoda
editor-attribution-hint = Čije su riječi, ispod navoda, desno
editor-epigraph = Moto
editor-epigraph-hint = Navod na čelu dijela
editor-headword = Natuknica
editor-headword-hint = Riječ koju pojmovnik objašnjava
editor-gloss = Objašnjenje
editor-gloss-hint = Što natuknica znači
editor-code = Kod
editor-code-hint = Slovo po slovo, slovima jednake širine
editor-break = Stanka
editor-break-hint = Stanka između dijelova, sa znakom koji joj format daje
editor-draft = Radna bilješka
editor-draft-hint = Samo za vaše oči: ne ide ni u jedan dokument
editor-foreign = Strani jezik
editor-foreign-hint = Riječi na drugom jeziku, prema kojem se provjerava pravopis
editor-title-of-work = Naslov djela
editor-title-of-work-hint = Naslov knjige, drame, slike
editor-term = Termin
editor-term-hint = Termin ondje gdje se prvi put upotrebljava
editor-mention = Spomen
editor-mention-hint = Riječ o kojoj se govori kao o riječi, u navodnicima
editor-highlight = Isticanje
editor-highlight-hint = Za oko na zaslonu: ne ide ni u jedan dokument
editor-underline = Podcrtano
editor-code-words = Kod u retku
editor-code-words-hint = Slova jednake širine, unutar retka
editor-scene = Naslov scene
editor-scene-hint = INT. KUĆA – NOĆ
editor-action = Radnja
editor-action-hint = Što se vidi i radi
editor-character = Lik
editor-character-hint = Tko govori, iznad dijaloga
editor-dialogue = Dijalog
editor-dialogue-hint = Što se govori
editor-parenthetical = Napomena u zagradi
editor-parenthetical-hint = Kako se govori, u zagradama
editor-transition = Prijelaz
editor-transition-hint = REZ NA:, desno
editor-comment = Komentar
editor-comment-hint = Komentar na odabrano
editor-comment-element-hint = Komentar na ovaj element; odaberite riječi da komentirate njih
editor-parallel = Dva teksta usporedo
editor-parallel-hint = Izvornik i njegov prijevod, svaki kao zaseban tekst
editor-paragraph-kind = Vrsta odlomka
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Vrsta odlomka: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Više…
editor-kinds-in-hand = Vrste pri ruci
editor-kinds-own = Vaše vlastite
editor-kinds-make = Načini vrstu…
editor-kinds-change-own = Izmijeni vlastitu vrstu…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Složene kako ih ima „{ $format }”
editor-kinds-change-format = Izmijeni format…
editor-kinds-change-format-hint = Kako je svaka vrsta složena u ovom dokumentu
editor-words = Riječi
editor-words-hint = Podcrtano, eksponent, kod; riječi na stranom jeziku, naslov djela, termin
editor-words-make = Načini vrstu riječi…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = Jezik mape
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Obične riječi
editor-own-kind-new = Vlastita vrsta
editor-own-kind-change = Izmijeni vrstu
editor-own-kind-name = Naziv
editor-own-kind-name-placeholder = Pismo, brzojav, molitva…
editor-own-kind-words-placeholder = Ime broda, latinski, ključna riječ…
editor-own-kind-name-taken = Vrsta s tim nazivom već postoji.
editor-own-kind-based-on = Na temelju
editor-own-kind-based-on-hint = Što dolje nije rečeno, kao u toj vrsti
editor-own-kind-look = Po čemu se razlikuje
editor-own-kind-create = Stvori
editor-own-kind-delete-title = Izbrisati vrstu „{ $name }”?
editor-own-kind-delete-message = { $count ->
    [0] Nijedan tekst nije te vrste.
    [1] Što je te vrste u jednom elementu ostaje kako jest, a u dokumentima se slaže kao tekst.
    [one] Što je te vrste u { $count } elementu ostaje kako jest, a u dokumentima se slaže kao tekst.
    [few] Što je te vrste u { $count } elementa ostaje kako jest, a u dokumentima se slaže kao tekst.
   *[other] Što je te vrste u { $count } elemenata ostaje kako jest, a u dokumentima se slaže kao tekst.
}

## Citing, notes, and what is put into the text.

editor-cite = Citiraj
editor-cite-here = Citiraj djelo ovdje
editor-cite-at-cursor = Citiraj djelo na mjestu pokazivača
editor-note = Bilješka
editor-note-selection = Pretvori odabir u bilješku
editor-note-hint = Bilješka, u podnožju stranice ili na kraju
editor-insert = Umetni
editor-insert-hint = Slika, tablica, matematika, uputnica
editor-new-element = Novi element
editor-new-element-hint = Novi element iza ovoga, ili ispod njega
editor-new-after = Novi element iza ovoga
editor-new-under = Novi element ispod ovoga
editor-new-split = Razdvoji ovdje
editor-new-split-hint = Što slijedi iza pokazivača postaje novi element
editor-spelling-on = Pravopis se provjerava dok pišete · pritisnite da prestane
editor-spelling-off = Pravopis se ne provjerava · pritisnite da se provjerava
editor-picture-file = Slika iz datoteke…
editor-picture-file-hint = Ilustracija, s onim što se o njoj kaže
editor-picture-store = Slika iz spremišta…
editor-picture-store-hint = One koje imate prikazane su sa strane
editor-equation = Jednadžba
editor-equation-hint = Matematika u zasebnom retku
editor-table = Tablica…
editor-table-hint = S toliko redaka i stupaca
editor-table-file = Tablica iz datoteke…
editor-table-file-hint = CSV, ili tablica LibreOfficea ili Excela
editor-formula = Formula
editor-formula-hint = Matematika u retku
editor-pointer = Uputnica…
editor-pointer-hint = Na ilustraciju, tablicu, jednadžbu ili dio: „vidi sliku 2”
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = slika

## More.

editor-found = Pronađeni citati…
editor-found-count = { $count } za proći i pretvoriti u citate
editor-found-none = I tekst koji nalikuje citatima, u ovoj mapi

## Choosing a work to cite.

editor-picker = Odaberite referencu
editor-picker-placeholder = Citiraj: autor, naslov, godina
editor-picker-search = Pretraži reference
editor-picker-results = Reference
editor-picker-in-project = U ovom projektu
editor-picker-recent = Nedavno dodano
editor-picker-empty = Vaša je knjižnica prazna.
editor-picker-no-match = Ništa u vašoj knjižnici ne sadrži te riječi.
editor-picker-type = Tipkajte da pretražite knjižnicu.
editor-picker-new = Nova referenca…
editor-picker-import = Uvezi…

## A citation, and each work in it.

editor-citation = Citat
editor-citation-add = Dodaj djelo
editor-citation-add-purpose = Dodaj djelo u citat
editor-citation-in-text = Autor u tekstu: Nagy (1979)
editor-citation-remove = Ukloni citat
editor-citation-split = Odvoji riječi od citata
editor-citation-split-hint = Riječi prije i poslije postaju tekst retka, a svako djelo zaseban citat, sa svojom stranicom i ničim drugim
editor-citation-not-in-library = Ove reference nema u vašoj knjižnici.
editor-citation-edit-reference = Uredi referencu
editor-citation-before = Prije
editor-citation-before-placeholder = vidi, usp.
editor-citation-after = Poslije
editor-citation-after-placeholder = i passim
editor-citation-locator-kind = Vrsta mjesta
editor-citation-suppress-author = Autor je imenovan u mojoj rečenici: navedi samo godinu
editor-citation-remove-work = Ukloni ovo djelo
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [referenca nije pronađena]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (citat)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Stranica
editor-locator-chapter = Poglavlje
editor-locator-section = Odjeljak
editor-locator-paragraph = Odlomak
editor-locator-line = Redak
editor-locator-verse = Stih
editor-locator-book = Knjiga
editor-locator-volume = Svezak
editor-locator-part = Dio
editor-locator-column = Stupac
editor-locator-folio = Folij
editor-locator-figure = Slika
editor-locator-note = Bilješka
editor-locator-number = Broj
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Bilješka { $number }
editor-note-place = Gdje bilješka stoji
editor-note-place-format = Gdje format ima svoje bilješke
editor-note-place-foot = U podnožju stranice
editor-note-place-end = Na kraju teksta
editor-note-placeholder = Tekst bilješke
