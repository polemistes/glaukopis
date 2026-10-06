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
editor-quotation-hint = Skilt ut frå teksten
editor-list-hint = Med eit merke framfor kvart punkt
editor-numbered-list = Nummerert liste
editor-numbered-list-hint = Med eit tal framfor kvart punkt
editor-verse = Vers
editor-verse-hint = Linjer av dikt eller drama, kvar halden som ei linje
editor-speaker = Talar
editor-speaker-hint = Kven som talar, på ei eiga linje
editor-direction = Sceneanvising
editor-direction-hint = Det som blir gjort, i kursiv
editor-line-numbers = Linjenummer
editor-line-numbers-hint = Nummerer linjene i dette verset: frå kva linje, og kvar kor mange
editor-line-numbers-from = Nummerer linjene frå
editor-line-numbers-none = La stå tomt for ingen nummer
editor-line-numbers-every = Vis eit nummer kvar
editor-line-numbers-number = Det trengst eit heilt tal.
editor-kinds-text = Tekst
editor-kinds-quotation = Sitat
editor-kinds-verse = Vers
editor-kinds-script = Manus
editor-kinds-more = Meir
editor-kinds-words = Ord
editor-attribution = Kjelde
editor-attribution-hint = Kven orda er frå, under eit sitat, til høgre
editor-epigraph = Epigraf
editor-epigraph-hint = Eit sitat i byrjinga av ein del
editor-headword = Oppslagsord
editor-headword-hint = Ordet ei ordliste forklarer
editor-gloss = Forklaring
editor-gloss-hint = Kva oppslagsordet tyder
editor-code = Kode
editor-code-hint = Halden bokstav for bokstav, i bokstavar med lik breidd
editor-break = Skilje
editor-break-hint = Eit opphald mellom delar, med teiknet formatet gir det
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
editor-code-words-hint = Bokstavar med lik breidd, inne i linja
editor-scene = Sceneoverskrift
editor-scene-hint = INT. HUS – NATT
editor-action = Handling
editor-action-hint = Det som blir sett og gjort
editor-character = Rolle
editor-character-hint = Kven som snakkar, over replikken
editor-dialogue = Replikk
editor-dialogue-hint = Det som blir sagt
editor-parenthetical = Parentes
editor-parenthetical-hint = Korleis det blir sagt, i parentes
editor-transition = Overgang
editor-transition-hint = KLIPP TIL:, til høgre
editor-comment = Kommentar
editor-comment-hint = Ein kommentar til det som er merkt
editor-comment-element-hint = Ein kommentar til dette elementet; merk ord for å kommentere dei
editor-parallel = To tekstar side om side
editor-parallel-hint = Ein original og omsetjinga av han, kvar sin tekst
editor-paragraph-kind = Slag avsnitt
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Slag avsnitt: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Meir …
editor-kinds-in-hand = Slag for handa
editor-kinds-own = Dine eigne
editor-kinds-make = Lag eit slag …
editor-kinds-change-own = Endre eitt av dine eigne …
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Sette slik «{ $format }» har dei
editor-kinds-change-format = Endre formatet …
editor-kinds-change-format-hint = Korleis kvart slag blir sett i dette dokumentet
editor-words = Ord
editor-words-hint = Understreking, heva skrift, kode; ord på eit anna språk, tittelen på eit verk, ein term
editor-words-make = Lag eit slag ord …
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = Språket i kartet
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Vanlege ord
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

editor-cite = Vis til
editor-cite-here = Vis til eit verk her
editor-cite-at-cursor = Vis til eit verk der markøren står
editor-note = Note
editor-note-selection = Gjer det merkte til ein note
editor-note-hint = Ein note, nedst på sida eller til slutt
editor-insert = Set inn
editor-insert-hint = Eit bilete, ein tabell, matematikk, ein kryssreferanse
editor-new-element = Nytt element
editor-new-element-hint = Eit nytt element etter dette, eller under det
editor-new-after = Nytt element etter dette
editor-new-under = Nytt element under dette
editor-new-split = Del her
editor-new-split-hint = Det som står etter markøren, blir eit nytt element
editor-spelling-on = Stavinga blir kontrollert medan du skriv · trykk for å slutte
editor-spelling-off = Stavinga blir ikkje kontrollert · trykk for å kontrollere den
editor-picture-file = Bilete frå ei fil …
editor-picture-file-hint = Ein figur, med bilettekst
editor-picture-store = Bilete frå biletlageret …
editor-picture-store-hint = Dei du har, blir viste ved sida av
editor-equation = Likning
editor-equation-hint = Matematikk på ei eiga linje
editor-table = Tabell …
editor-table-hint = Med så mange rader og kolonnar
editor-table-file = Tabell frå ei fil …
editor-table-file-hint = CSV, eller eit ark frå LibreOffice eller Excel
editor-formula = Formel
editor-formula-hint = Matematikk i linja
editor-pointer = Kryssreferanse …
editor-pointer-hint = Til figur, tabell, likning eller del: «sjå figur 2»
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = bilete

## More.

editor-found = Funne kjeldetilvisingar …
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
editor-note-place-format = Der formatet har notane sine
editor-note-place-foot = Nedst på sida
editor-note-place-end = Til slutt i teksten
editor-note-placeholder = Teksten i noten
