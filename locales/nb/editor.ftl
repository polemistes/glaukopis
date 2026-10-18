# Redigeringen av tekster: verktøyene for skriving, kildehenvisninger og noter.
# Se locales/README.md.

## Formateringen og slagene avsnitt, i linjen over det som er merket og i
## verktøyene over teksten.

editor-format = Formatering
editor-writing = Skriving
editor-italic = Kursiv
editor-bold = Fet
editor-small-capitals = Kapitéler
editor-superscript = Hevet skrift
editor-subscript = Senket skrift
editor-struck = Gjennomstreket
editor-quotation = Sitat
editor-block-quotation = Blokksitat
editor-list = Liste
editor-text = Tekst
editor-text-hint = Et avsnitt
editor-quotation-hint = En annens ord, skilt ut fra teksten
editor-list-hint = Et punkt i en liste; et innrykk lager en liste i listen
editor-numbered-list = Nummerert liste
editor-numbered-list-hint = Et punkt i en liste som telles; et innrykk lager en liste i listen
editor-verse = Vers
editor-verse-hint = En linje av dikt, drama eller en transkripsjon, beholdt som en linje
editor-speaker = Taler
editor-speaker-hint = Hvem som taler: på en egen linje, eller som ord i en linje
editor-direction = Sceneanvisning
editor-direction-hint = Det som gjøres på scenen: på en egen linje, eller som ord i en linje
editor-line-numbers = Nummer
editor-line-numbers-hint = Nummerer disse linjene: hvordan de telles, fra hvilket nummer, hver hvor mange og på hvilken side; og si hva som sies om linjen markøren står i. Linjer som nummereres sammen med de samme innstillingene, telles som én, hva slags de enn er.
editor-line-numbers-from = Nummerer fra
editor-line-numbers-from-hint = Den første linjen som telles, får dette nummeret, og tellingen går videre fra den.
editor-line-numbers-every = Vis et nummer hver
editor-line-numbers-number = Et helt tall trengs.
editor-line-this = Denne linjen
editor-line-number = Nummeret eller merket dens
editor-line-number-placeholder = Telles som de andre
editor-line-number-hint = 1234, 567a: vises alltid; linjene etter telles videre fra det.
editor-line-uncounted = Telles ikke
editor-line-uncounted-hint = Som andre halvdel av en linje to talere deler: tellingen går forbi den.
editor-line-hidden = Talt, men nummeret vises ikke
editor-line-hidden-hint = Tellingen går videre gjennom den som gjennom enhver linje, men intet nummer står ved den i dokumentet, heller ikke der et ville falt. Der du skriver, står det i parentes.
editor-line-number-held = Talt, men vises ikke i dokumentet. Trykk for å gi den et eget nummer.
editor-line-margin = Ord i margen
editor-line-margin-placeholder = Et versemål, en annen utgaves nummer
editor-line-margin-hint = Vises i margen ved siden av det, overfor numrene; telles ikke.
# Hvordan linjene i en strekning nummereres: se ADR 0041.
editor-numbering = Nummerering
editor-numbering-none = Ikke nummerert
editor-numbering-counted = Telt fra det første nummeret som er gitt
editor-numbering-given = Bare numrene som er gitt
editor-line-numbers-every-layout = Som oppsettet: hver { $every }
editor-line-numbers-side = Numrene på
editor-side-layout = Siden oppsettet sier ({ $side })
editor-side-left = Venstre
editor-side-right = Høyre
# Den første linjen som telles, er den markøren står i: nummeret dens er der tellingen begynner.
editor-line-number-first-hint = Tellingen begynner her.
# Over et nummer i margen av teksten, som åpner et felt for det når det trykkes.
editor-line-number-press = Nummeret til denne linjen: trykk for å endre det

## Numrene hører til det de nummererer (ADR 0041): Nummer-menyen tilbyr de
## tre, og hver sier hva den nummererer.
editor-numbers = Nummer
editor-numbers-hint = Nummerer linjene du skriver, merk et sted i prosa, eller nummerer linjene på siden
editor-numbers-lines = Nummerer disse linjene …
editor-numbers-lines-hint = Linjene i avsnittene der markøren står, eller i dem som er merket: fra hvilket nummer, hver hvor mange, på hvilken side
editor-numbers-refmark-hint = Et sted i prosa, ved et vers, en side eller et nummer i en utgave: 3:16, 327a
editor-numbers-page = Nummerer linjene på siden
editor-numbers-page-hint = Hver linje på den trykte siden, nummerert i margen, i dette dokumentet og dem under det

## Klammen til venstre for avsnitt av ett slag som står sammen (et løp), med
## navnet på slaget; menyen dens sier det som sies om dem.
# Etter navnet på slaget, der linjene i løpet er nummerert: «Vers · nummerert».
editor-bracket-numbered = nummerert
editor-run-label-hint = { $kind } · trykk for det som sies om disse avsnittene
editor-run-numbers = Nummer …
editor-run-numbers-hint = Hvordan linjene her telles, fra hvilket nummer, hver hvor mange og på hvilken side
editor-run-select = Merk disse avsnittene
editor-run-to-text = Gjør det til tekst
editor-run-to-text-hint = Avsnittene av dette slaget blir tekst; linjene deres, og alt annet, blir som de er
editor-run-begin = Begynn et nytt løp her
editor-run-begin-hint = Avsnittet markøren står i, begynner en egen klamme, selv om det foran er av samme slag
editor-run-join = Slå sammen med løpet foran
editor-run-join-hint = Disse avsnittene blir ett med dem av samme slag foran dem igjen
editor-kinds-text = Tekst
editor-kinds-quotation = Sitat
editor-kinds-verse = Vers
editor-kinds-script = Manus
editor-kinds-list = Liste
editor-kinds-more = Mer
editor-kinds-words = Ord
editor-attribution = Kildeangivelse
editor-attribution-hint = Hvem et sitat er fra
editor-epigraph = Epigraf
editor-epigraph-hint = Et sitat i begynnelsen av en del
editor-headword = Oppslagsord
editor-headword-hint = Ordet en ordliste forklarer
editor-gloss = Forklaring
editor-gloss-hint = Hva oppslagsordet betyr
editor-code = Kode
editor-code-hint = En linje kode, eller noe annet som beholdes bokstav for bokstav
editor-break = Skille
editor-break-hint = Et opphold mellom deler, med tegnet oppsettet gir det
editor-draft = Kladd
editor-draft-hint = For dine øyne: det kommer ikke med i noe dokument
editor-foreign = Annet språk
editor-foreign-hint = Ord på et annet språk, som stavingen følger
editor-title-of-work = Tittel på et verk
editor-title-of-work-hint = Tittelen på en bok, et skuespill, et maleri
editor-term = Term
editor-term-hint = En term der den brukes første gang
editor-mention = Omtalt ord
editor-mention-hint = Et ord omtalt som ord, i anførselstegn
editor-highlight = Utheving
editor-highlight-hint = For øyet på skjermen: det kommer ikke med i noe dokument
editor-underline = Understreket
editor-code-words = Kode i linjen
editor-code-words-hint = Bokstaver med lik bredde, inne i linjen
editor-scene = Sceneoverskrift
editor-scene-hint = Hvor og når en scene er: INT. HUS – NATT
editor-action = Handling
editor-action-hint = Det som ses og gjøres
editor-character = Rolle
editor-character-hint = Hvem som sier replikken som følger
editor-dialogue = Replikk
editor-dialogue-hint = Det som sies
editor-parenthetical = Parentes
editor-parenthetical-hint = Hvordan en replikk sies
editor-transition = Overgang
editor-transition-hint = Hvordan en scene går over i den neste: KLIPP TIL:
editor-comment = Kommentar
editor-comment-hint = En kommentar til det som er merket
editor-comment-element-hint = En kommentar til dette elementet; merk ord for å kommentere dem
editor-parallel = To tekster side om side
editor-parallel-hint = En original og dens oversettelse, hver sin tekst
editor-page-break = Sideskift
editor-page-break-hint = Det som følger, begynner på en ny side
editor-column-break = Spalteskift
editor-column-break-hint = Det som følger, begynner øverst i neste spalte, der oppsettet setter teksten i spalter
editor-paragraph-kind = Slags avsnitt
# Sies om knappen som viser hva slags avsnitt markøren står i.
editor-paragraph-kind-now = Slags avsnitt: { $kind }

## Menyen over slagene: slagene som skrives med dem markøren står i, slagene for hånden,
## hele katalogen under «Mer …», og oppsettet som setter dem, nederst. Menyen
## over ordene, med slagene ord. Og et eget slag, i vinduet sitt.

editor-kinds-menu-more = Mer …
editor-kinds-mixed = Blandet
editor-kinds-own = Dine egne
editor-kinds-make = Lag et slag …
editor-kinds-change-own = Endre et av dine egne …
# Over valget som åpner oppsettredigeringen: oppsettet bestemmer hvordan hvert slag ser ut.
editor-kinds-set-by = Satt slik «{ $format }» har dem
editor-kinds-change-look = Hvordan «{ $kind }» ser ut …
editor-kinds-change-look-hint = Utseendet i dette dokumentet, og resten av siden
editor-words = Ord
editor-words-hint = Understreking, hevet skrift, kode; språket i et stykke, ord på et annet språk, tittelen på et verk, en term, en taler i en linje
editor-words-make = Lag et slag ord …
# Først blant språkene ord på et annet språk kan være på: det teksten selv er på.
editor-foreign-of-text = Språket i teksten
# Det et slag ord bygger på når det ikke bygger på noe bestemt slag.
editor-plain-words = Vanlige ord
# Språket i et avsnitt av teksten, fra ett ord til mange avsnitt: det har ikke noe eget utseende.
editor-language = Språk
editor-language-of-text = Tekstens eget språk
editor-language-other = Annet språk …
editor-language-other-title = Språket i dette stykket
editor-language-tag = Språkkode
editor-language-no-tag = Det er ingen språkkode: en kode er som «grc», «la» eller «de-CH».
editor-language-unnamed = Et språk systemet ikke har navn på: koden beholdes slik den er skrevet.
editor-language-suggested = Språk som ofte siteres
editor-language-other-hint = Stykket kontrolleres med ordlisten for språket, der en er importert, og får være i fred der ingen er; et dokument som lages, forteller Word, OpenDocument, Typst og LaTeX hvilket språk det er.
editor-own-kind-new = Et eget slag
editor-own-kind-change = Endre slaget
editor-own-kind-name = Navn
editor-own-kind-name-placeholder = Brev, telegram, bønn …
editor-own-kind-words-placeholder = Skipsnavn, latin, et nøkkelord …
editor-own-kind-name-taken = Det finnes alt et slag med det navnet.
editor-own-kind-based-on = Bygger på
editor-own-kind-based-on-hint = Det som ikke sies nedenfor, er som dette slaget har det
editor-own-kind-look = Hvordan det skiller seg
editor-own-kind-create = Opprett
editor-own-kind-delete-title = Slette slaget «{ $name }»?
editor-own-kind-delete-message = { $count ->
    [0] Ingen tekst er av det.
    [one] Det som er av det i ett element, blir stående som det er, og settes som tekst i dokumenter.
   *[other] Det som er av det i { $count } elementer, blir stående som det er, og settes som tekst i dokumenter.
}

## Kildehenvisninger, noter og det som settes inn i teksten.

editor-cite = Henvis
editor-cite-here = Henvis til et verk her
editor-cite-at-cursor = Henvis til et verk der markøren står
editor-note = Note
editor-note-selection = Gjør det merkede til en note
editor-note-hint = En note, nederst på siden eller til slutt
editor-insert = Sett inn
editor-insert-hint = Et bilde, en tabell, matematikk, en kryssreferanse til en figur
editor-new-element = Nytt element
editor-new-element-hint = Et nytt element etter dette, eller under det
editor-new-after = Nytt element etter dette
editor-new-under = Nytt element under dette
editor-new-split = Del her
editor-new-split-hint = Det som står etter markøren, blir et nytt element
editor-spelling-on = Stavingen kontrolleres mens du skriver · trykk for å slutte
editor-spelling-off = Stavingen kontrolleres ikke · trykk for å kontrollere den
editor-break-signs = Tegnet for linjeskift i et avsnitt
editor-break-signs-on = Linjeskift i et avsnitt vises med ↵ · trykk for å skjule tegnet
editor-break-signs-off = Linjeskift i et avsnitt vises ikke · trykk for å vise dem med ↵
editor-picture-file = Bilde fra en fil …
editor-picture-file-hint = En figur, med bildetekst
editor-picture-store = Bilde fra bildelageret …
editor-picture-store-hint = De du har, vises ved siden av
editor-equation = Ligning
editor-equation-hint = Matematikk på en egen linje
editor-table = Tabell …
editor-table-hint = Med så mange rader og kolonner
editor-table-file = Tabell fra en fil …
editor-table-file-hint = CSV, eller et ark fra LibreOffice eller Excel
editor-formula = Formel
editor-formula-hint = Matematikk i linjen
editor-pointer = Kryssreferanse …
editor-pointer-hint = Til figur, tabell, ligning eller del: «se figur 2»
editor-refmark = Referansemerke …
editor-refmark-hint = Et vers, en side eller et nummer i en utgave: 3:16, 327a
editor-refmark-title = Referansemerke
editor-refmark-label = Merke
editor-refmark-placeholder = 3:16, 327a, 1094a1
editor-refmark-dialog-hint = Merket er ingen del av ordene: stavekontroll, søk og ordtelling går forbi det. Oppsettet bestemmer om det heves i linjen eller settes i margen.
# Det et bilde som ble limt inn uten eget navn, heter i bildelageret.
editor-pasted-picture = bilde

## Mer.

editor-found = Løse kildehenvisninger …
editor-found-count = { $count } å gå gjennom og gjøre til kildehenvisninger
editor-found-none = Og tekst som ser ut som kildehenvisninger, i dette kartet

## Å velge et verk å henvise til.

editor-picker = Velg en referanse
editor-picker-placeholder = Henvis til: forfatter, tittel, år
editor-picker-search = Søk i referansene
editor-picker-results = Referanser
editor-picker-in-project = I dette prosjektet
editor-picker-recent = Nylig lagt til
editor-picker-empty = Biblioteket ditt er tomt.
editor-picker-no-match = Ingenting i biblioteket ditt inneholder disse ordene.
editor-picker-type = Skriv for å søke i biblioteket ditt.
editor-picker-new = Ny referanse …
editor-picker-import = Importer …

## En kildehenvisning, og hvert verk i den.

editor-citation = Kildehenvisning
editor-citation-add = Legg til verk
editor-citation-add-purpose = Legg til et verk i kildehenvisningen
editor-citation-in-text = Forfatter i teksten: Nagy (1979)
editor-citation-remove = Fjern henvisningen
editor-citation-split = Skill ordene fra henvisningen
editor-citation-split-hint = Ordene før og etter blir tekst i linjen, og hvert verk en henvisning for seg, med siden sin og ikke annet
editor-citation-not-in-library = Denne referansen er ikke i biblioteket ditt.
editor-citation-edit-reference = Rediger referansen
editor-citation-before = Tekst foran
editor-citation-before-placeholder = se, jf.
editor-citation-after = Tekst etter
editor-citation-after-placeholder = og passim
editor-citation-locator-kind = Slags sted i verket
editor-citation-suppress-author = Forfatteren er nevnt i setningen min: vis bare årstallet
editor-citation-remove-work = Fjern dette verket
editor-citation-no-place = En kildehenvisning kan ikke stå der
editor-reference-not-kept = Referansen kunne ikke tas vare på i prosjektet
# Står i teksten i stedet for en kildehenvisning til et verk som verken er i biblioteket eller i prosjektet.
editor-citation-missing = [referansen ble ikke funnet]
# Står i teksten i stedet for en kildehenvisning til ingen verk.
editor-citation-empty = (kildehenvisning)

## Slagene steder i et verk en kildehenvisning kan vise til, slik menyen
## til en kildehenvisning kaller dem.

editor-locator-page = Side
editor-locator-chapter = Kapittel
editor-locator-section = Paragraf
editor-locator-paragraph = Avsnitt
editor-locator-line = Linje
editor-locator-verse = Vers
editor-locator-book = Bok
editor-locator-volume = Bind
editor-locator-part = Del
editor-locator-column = Kolonne
editor-locator-folio = Folio
editor-locator-figure = Figur
editor-locator-note = Note
editor-locator-number = Nummer
editor-locator-sub-verbo = Sub verbo

## En note, i panelet den skrives i.

# Tallet er notens nummer, eller en bokstav for en note som står et eget sted.
editor-note-numbered = Note { $number }
editor-note-place = Hvor noten står
editor-note-place-format = Der oppsettet har notene sine
editor-note-place-foot = Nederst på siden
editor-note-place-end = Til slutt i teksten
editor-note-placeholder = Teksten i noten
