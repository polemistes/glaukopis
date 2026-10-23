# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Formatering
editor-writing = Skriving
editor-italic = Kursiv
editor-bold = Feit
editor-small-capitals = Kapitélar
editor-superscript = Heva skrift
editor-subscript = Senka skrift
editor-struck = Gjennomstreka
editor-quotation = Sitat
editor-block-quotation = Blokksitat
editor-list = Liste
editor-text = Tekst
editor-text-hint = Eit avsnitt
editor-quotation-hint = Orda til ein annan, skilde ut frå teksten
editor-list-hint = Eit punkt i ei liste; eit innrykk lagar ei liste i lista
editor-numbered-list = Nummerert liste
editor-numbered-list-hint = Eit punkt i ei liste som blir nummerert; eit innrykk lagar ei liste i lista
editor-verse = Vers
editor-verse-hint = Ei linje av dikt, drama eller ein transkripsjon, halden som ei linje
editor-speaker = Talar
editor-speaker-hint = Kven som talar: på ei eiga linje, eller som ord inne i ei linje
editor-direction = Sceneanvising
editor-direction-hint = Det som blir gjort på scenen: på ei eiga linje, eller som ord inne i ei linje
editor-line-numbers = Nummer
editor-line-numbers-hint = Nummerer desse linjene: korleis dei blir talde, frå kva nummer, kvar kor mange og på kva side; og sei kva som blir sagt om linja markøren står i. Linjer som blir nummererte saman med dei same innstillingane, blir talde som éi, kva slag dei enn er.
editor-line-numbers-from = Nummerer frå
editor-line-numbers-from-hint = Den første linja som blir talt, får dette nummeret, og teljinga held fram frå det.
editor-line-numbers-every = Vis eit nummer kvar
editor-line-numbers-number = Det trengst eit heilt tal.
editor-line-this = Denne linja
editor-line-number = Nummeret eller merket
editor-line-number-placeholder = Talt som dei andre
editor-line-number-hint = 1234, 567a: blir alltid vist; linjene etter blir talde vidare frå det.
editor-line-uncounted = Ikkje talt
editor-line-uncounted-hint = Som den andre halvdelen av ei linje som er delt mellom talarar: teljinga går forbi den.
editor-line-hidden = Talt, utan at nummeret blir vist
editor-line-hidden-hint = Teljinga går gjennom den som gjennom kva linje som helst, men det står ikkje noko nummer ved sida av den i dokumentet, heller ikkje der eitt ville ha falle. Der du skriv, står det i parentes.
editor-line-number-held = Talt, og ikkje vist i dokumentet. Trykk for å gi den eit eige nummer.
editor-line-margin = Ord i margen
editor-line-margin-placeholder = Eit versemål, nummeret i ei anna utgåve
editor-line-margin-hint = Blir vist i margen ved sida av, overfor numra; blir ikkje talt.
# How the lines of a stretch are numbered: see ADR 0041.
editor-numbering = Nummerering
editor-numbering-none = Ikkje nummerert
editor-numbering-counted = Talt frå det første nummeret som er gitt
editor-numbering-given = Berre numra som er gitt
editor-line-numbers-every-layout = Som oppsettet: kvar { $every }
editor-line-numbers-side = Numra på
editor-side-layout = Sida oppsettet seier ({ $side })
editor-side-left = Venstre
editor-side-right = Høgre
# The first counted line of the stretch is the one the cursor is in: its number is where the count begins.
editor-line-number-first-hint = Teljinga byrjar her.
# Over a number in the margin of the text, which opens a field for it when pressed.
editor-line-number-press = Nummeret på denne linja: trykk for å endre det

## Numbers belong to what they number (ADR 0041): the Numbers menu offers
## the three, each saying what it numbers.
editor-numbers-lines = Nummerer desse linjene …
editor-numbers-lines-hint = Linjene i avsnitta der markøren står, eller i dei som er merkte: frå kva nummer, kvar kor mange, på kva side
editor-numbers-page = Nummerer linjene på sida
editor-numbers-page-hint = Kvar linje på den trykte sida, nummerert i margen, i dette dokumentet og dei under det

## The bracket at the left of paragraphs of one kind standing together (a
## run), named by the kind; its menu says what is said of them.
# After the name of the kind, where the lines of the run are numbered: "Verse · numbered".
editor-bracket-numbered = nummerert
editor-run-label-hint = { $kind } · trykk for det som blir sagt om desse avsnitta
editor-run-numbers = Nummer …
editor-run-numbers-hint = Korleis linjene her blir talde, frå kva nummer, kvar kor mange og på kva side
editor-run-select = Merk desse avsnitta
editor-run-to-text = Gjer det til tekst
editor-run-to-text-hint = Avsnitta av dette slaget blir tekst; linjene deira, og alt anna, blir verande som dei er
editor-run-begin = Byrj eit nytt løp her
editor-run-begin-hint = Avsnittet markøren står i, byrjar ei eiga klamme, sjølv om det framfor er av same slaget
editor-run-join = Slå saman med løpet framfor
editor-run-join-hint = Desse avsnitta blir eitt med dei av same slaget framfor seg igjen
editor-kinds-text = Tekst
editor-kinds-quotation = Sitat
editor-kinds-verse = Vers
editor-kinds-script = Manus
editor-kinds-list = Liste
editor-kinds-more = Meir
editor-kinds-words = Ord
editor-attribution = Kjelde
editor-attribution-hint = Kven eit sitat er frå
editor-epigraph = Epigraf
editor-epigraph-hint = Eit sitat i byrjinga av ein del
editor-headword = Oppslagsord
editor-headword-hint = Ordet ei ordliste forklarer
editor-gloss = Forklaring
editor-gloss-hint = Kva oppslagsordet tyder
editor-code = Kode
editor-code-hint = Ei linje med kode, eller med anna som blir halde bokstav for bokstav
editor-break = Skilje
editor-break-hint = Eit opphald mellom delar, med teiknet oppsettet gir det
editor-draft = Kladd
editor-draft-hint = For dine auge: det kjem ikkje med i noko dokument
editor-foreign = Anna språk
editor-foreign-hint = Ord på eit anna språk, som stavinga følgjer
editor-title-of-work = Tittel på eit verk
editor-title-of-work-hint = Tittelen på ei bok, eit skodespel, eit måleri
editor-term = Term
editor-term-hint = Ein term der den blir brukt første gong
editor-mention = Omtala ord
editor-mention-hint = Eit ord omtala som ord, i hermeteikn
editor-highlight = Utheving
editor-highlight-hint = For auget på skjermen: det kjem ikkje med i noko dokument
editor-underline = Understreka
editor-code-words = Kode i linja
editor-scene = Sceneoverskrift
editor-scene-hint = Kvar og når ein scene går føre seg: INT. HUS – NATT
editor-action = Handling
editor-action-hint = Det som blir sett og gjort
editor-character = Rolle
editor-character-hint = Kven som seier replikken som følgjer
editor-dialogue = Replikk
editor-dialogue-hint = Det som blir sagt
editor-parenthetical = Parentes
editor-parenthetical-hint = Korleis replikken skal seiast
editor-transition = Overgang
editor-transition-hint = Korleis ein scene går over i den neste: KLIPP TIL:
editor-comment = Kommentar
editor-parallel = To tekstar side om side
editor-page-break = Sideskift
editor-column-break = Spalteskift
editor-paragraph-kind = Slag avsnitt
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Slag avsnitt: { $kind }

## The kind menu: the kinds written with those where the cursor is, the kinds at hand,
## the whole catalogue under "More…", and the layout that sets them at its foot.
## The words menu, with the kinds of words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Meir …
editor-kinds-mixed = Blanda
editor-kinds-own = Dine eigne
editor-kinds-make = Lag eit slag …
editor-kinds-change-own = Endre eitt av dine eigne …
# Over the item that opens the look of the document at the kind the cursor is in.
editor-kinds-set-by = Sette slik «{ $format }» har dei
editor-kinds-change-look = Korleis «{ $kind }» ser ut …
editor-kinds-change-look-hint = Utsjånaden i dette dokumentet, og resten av sida
editor-words-make = Lag eit slag ord …
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-text = Språket i teksten
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Vanlege ord
# The language of a passage, from a word to many paragraphs: it has no look of its own.
editor-language = Språk
editor-language-of-text = Same språk som teksten
editor-language-other = Anna språk …
editor-language-other-title = Språket i stykket
editor-language-tag = Språkkode
editor-language-no-tag = Det er ikkje ein språkkode: ein kode er til dømes «grc», «la» eller «de-CH».
editor-language-unnamed = Eit språk systemet ikkje har namn på: koden blir halden slik den er skriven.
editor-language-suggested = Språk som ofte blir siterte
editor-language-other-hint = Stykket blir kontrollert mot ordboka for språket sitt, der ei er importert, og får vere i fred der ingen er; eit dokument som blir laga, fortel Word, OpenDocument, Typst og LaTeX kva språk det er.
editor-own-kind-new = Eit eige slag
editor-own-kind-change = Endre slaget
editor-own-kind-name = Namn
editor-own-kind-name-placeholder = Brev, telegram, bøn …
editor-own-kind-words-placeholder = Skipsnamn, latin, eit nøkkelord …
editor-own-kind-name-taken = Det finst alt eit slag med det namnet.
editor-own-kind-based-on = Byggjer på
editor-own-kind-based-on-hint = Det som ikkje blir sagt nedanfor, er som dette slaget har det
editor-own-kind-look = Korleis det skil seg
editor-own-kind-create = Opprett
editor-own-kind-delete-title = Slette slaget «{ $name }»?
editor-own-kind-delete-message = { $count ->
    [0] Ingen tekst er av det.
    [one] Det som er av det i eitt element, blir ståande som det er, og blir sett som tekst i dokument.
   *[other] Det som er av det i { $count } element, blir ståande som det er, og blir sett som tekst i dokument.
}

## Citing, notes, and what is put into the text.

editor-cite-here = Vis til eit verk her
editor-note = Note
editor-note-selection = Gjer det merkte til ein note
editor-insert = Set inn
editor-spelling-on = Stavinga blir kontrollert medan du skriv · trykk for å slutte
editor-spelling-off = Stavinga blir ikkje kontrollert · trykk for å kontrollere den
editor-equation = Likning
editor-table = Tabell …
editor-table-file = Tabell frå ei fil …
editor-formula = Formel
editor-pointer = Kryssreferanse …
editor-refmark-title = Referansemerke
editor-refmark-label = Merke
editor-refmark-placeholder = 3:16, 327a, 1094a1
editor-refmark-dialog-hint = Merket er ingen del av orda: stavekontrollen, søket og ordteljinga går forbi det. Oppsettet avgjer om det blir heva i linja eller sett i margen.
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = bilete

## More.

editor-found = Lause kjeldetilvisingar …
editor-found-count = { $count } å gå gjennom og gjere til kjeldetilvisingar
editor-found-none = Og tekst som ser ut som kjeldetilvisingar, i dette kartet

## Choosing a work to cite.

editor-picker = Vel ein referanse
editor-picker-placeholder = Vis til: forfattar, tittel, år
editor-picker-search = Søk i referansane
editor-picker-results = Referansar
editor-picker-in-project = I dette prosjektet
editor-picker-recent = Nyleg lagde til
editor-picker-empty = Biblioteket ditt er tomt.
editor-picker-no-match = Ingenting i biblioteket ditt inneheld desse orda.
editor-picker-type = Skriv for å søkje i biblioteket ditt.
editor-picker-new = Ny referanse …
editor-picker-import = Importer …

## A citation, and each work in it.

editor-citation = Kjeldetilvising
editor-citation-add = Legg til verk
editor-citation-add-purpose = Legg til eit verk i kjeldetilvisinga
editor-citation-in-text = Forfattar i teksten: Nagy (1979)
editor-citation-remove = Fjern tilvisinga
editor-citation-split = Skil orda frå tilvisinga
editor-citation-split-hint = Orda før og etter blir tekst i linja, og kvart verk ei tilvising for seg, med sida si og ikkje anna
editor-citation-not-in-library = Denne referansen er ikkje i biblioteket ditt.
editor-citation-edit-reference = Rediger referansen
editor-citation-before = Tekst framfor
editor-citation-before-placeholder = sjå, jf.
editor-citation-after = Tekst etter
editor-citation-after-placeholder = og passim
editor-citation-locator-kind = Stad i verket
editor-citation-suppress-author = Forfattaren er nemnd i setninga mi: vis berre årstalet
editor-citation-remove-work = Fjern dette verket
# A reference was dropped where a citation cannot stand, and the cursor is in no such place either.
editor-citation-no-place = Ei kjeldetilvising kan ikkje stå der
# The project keeps a copy of every reference it cites; this one could not be read from the library.
editor-reference-not-kept = Referansen kunne ikkje takast vare på i prosjektet
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [fann ikkje referansen]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (kjeldetilvising)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Side
editor-locator-chapter = Kapittel
editor-locator-section = Paragraf
editor-locator-paragraph = Avsnitt
editor-locator-line = Linje
editor-locator-verse = Vers
editor-locator-book = Bok
editor-locator-volume = Band
editor-locator-part = Del
editor-locator-column = Kolonne
editor-locator-folio = Folio
editor-locator-figure = Figur
editor-locator-note = Note
editor-locator-number = Nummer
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Note { $number }
editor-note-place = Kvar noten står
editor-note-place-format = Der oppsettet har notane sine
editor-note-place-foot = Nedst på sida
editor-note-place-end = Til slutt i teksten
editor-note-placeholder = Teksten i noten
