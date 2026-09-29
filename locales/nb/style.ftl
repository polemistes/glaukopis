# Referansestiler: typene av dem, søket etter flere og redigeringen av en
# stil, med ordene delene av en stil beskrives med.

## Typene av referansestiler, som stilene grupperes etter.

style-kind-note = Noter
style-kind-author-date = Forfatter og år
style-kind-numeric = Numre
style-kind-label = Etiketter
style-kind-author = Forfatter
style-kind-other = Andre

## Søket etter referansestiler fra tidsskrifter og forlag.

style-browser = Referansestiler
style-browser-subtitle = Over ti tusen stiler fra tidsskrifter og forlag, etter navn
style-browser-placeholder = Navnet på et tidsskrift, et forlag eller en stil
style-browser-search = Søk etter stiler
# Ved siden av en stil som allerede er hentet.
style-browser-here = Her
style-browser-fetch = Hent
style-browser-none-found = Ingen stil har disse ordene i navnet.
style-browser-about = Stilene hentes fra samlingen til Citation Style Language-prosjektet og lagres sammen med dine egne. De du har, kan endres etter et forlags ønsker når du redigerer stilen.
style-browser-import = Importer en fil …
style-browser-import-title = Importer en referansestil
style-browser-fetch-failed = Stilen kunne ikke hentes.
style-browser-file-unread = Filen kunne ikke leses.

## Redigeringen av en stil.

style-editor = Referansestil
style-name = Navnet på stilen
# Navnet en egen stil først får, laget av navnet på stilen den lages av.
style-name-changed = { $name }, endret
style-depth = Hvor dypt
style-depth-options = Vanlige endringer
style-depth-parts = Del for del
style-depth-source = Kilde
style-scope = Hva som skal endres
style-scope-citations = Henvisninger
style-scope-notes = Noter
style-scope-bibliography = Litteraturliste
style-bundled = Stilene som følger med Glaukopis, forblir som de er. Endringene dine lagres som en egen stil.
style-delete = Slett denne stilen
style-save-own = Lagre som min egen
style-saved = «{ $name }» er lagret blant dine egne stiler
style-read-failed = Stilen kunne ikke leses.
style-save-failed = Stilen kunne ikke lagres.
style-delete-failed = Stilen kunne ikke slettes.
style-delete-title = Slette stilen «{ $name }»?
style-delete-message = Kart som bruker den, vil bruke en annen stil i stedet.
style-delete-confirm = Slett stilen
style-leave-title = Gå ut uten å lagre?
style-leave-message = Endringene du har gjort i stilen, går tapt.
style-leave-confirm = Gå ut
style-leave-cancel = Fortsett å redigere

## Vanlige endringer: navn.

style-names = Navn
# En setning med to felt i, der tall skrives: det minste antallet forfattere
# der «et al.» brukes, og hvor mange som nevnes før det.
style-et-al = Med { $min } forfattere eller flere, nevn de { $first } første og «et al.»
style-et-al-min = Fra hvor mange forfattere et al. brukes
style-et-al-first = Hvor mange forfattere som nevnes før et al.
style-et-al-empty = Står feltet tomt, nevnes alle
# Som den forrige, for et verk som er vist til før.
style-et-al-again = Ved senere henvisninger, med { $min } eller flere, nevn de { $first } første
style-et-al-again-min = Fra hvor mange forfattere et al. brukes i senere henvisninger
style-et-al-again-first = Hvor mange forfattere som nevnes i senere henvisninger
style-et-al-again-empty = Står feltet tomt, som første gang
style-before-last-name = Foran det siste navnet
# Ordet stilen skriver ut der, på dokumentets språk.
style-and-word = og
style-and-nothing = Ingenting
style-as-the-style-has-it = Slik stilen har det
style-comma-before-last = Komma foran det
style-comma-contextual = Med tre navn eller flere: A, B, og C
style-comma-always = Alltid: A, og B
style-comma-never = Aldri: A, B og C
style-comma-after-inverted = Etter et navn som er snudd
style-given-names = Fornavn
style-given-full = Fullt ut: John Miles
style-given-spaced = Initialer: J. M.
style-given-close = Initialer, tett: J.M.
style-given-bare = Initialer uten punktum: JM
style-given-bare-spaced = Initialer uten punktum: J M
style-family-first = Etternavnet først
style-family-first-none = For ingen: John Foley
style-family-first-first = For den første forfatteren: Foley, John, og Robert Fowler
style-family-first-all = For alle: Foley, John, og Fowler, Robert
style-sort-separator = Mellom etternavn og fornavn
style-sort-separator-hint = Når etternavnet står først

## Vanlige endringer: henvisningen, eller noten, og oppføringene i litteraturlisten.

style-the-citation = Henvisningen
style-the-note = Noten
style-begins-with = Begynner med
style-ends-with = Slutter med
style-between-works = Mellom verk det vises til sammen
style-collapse = Flere verk av samme forfatter
style-collapse-none = Hvert fullt ut
style-collapse-year = Navnet én gang: Nagy 1979, 1996
style-collapse-year-suffix = Og året én gang: Nagy 1979a, b
style-collapse-year-suffix-ranged = Med intervaller: Nagy 1979a–c
style-collapse-citation-number = Numre som intervaller: [1–3]
style-disambiguate = Når to verk ville blitt henvist til likt
style-disambiguate-year-suffix = Legg til en bokstav etter året
style-disambiguate-names = Nevn flere forfattere
style-disambiguate-given-names = Legg til fornavn eller initialer
style-near-note = En note regnes som nær innenfor
style-near-note-hint = Noter; for stiler som forkorter det som nylig er vist til
style-entries = Oppføringene
style-entry-ends-with = Hver slutter med
style-author-repeated = For en gjentatt forfatter
style-author-repeated-hint = I stedet for navnet, i oppføringene etter den første
style-hanging-indent = Hengende innrykk
style-hanging-indent-hint = Dokumentformatet bestemmer hvor dypt
style-second-field = Numre eller etiketter står
style-second-field-line = På linjen
style-second-field-column = I en egen kolonne
style-second-field-margin = I margen
style-second-field-hint = For stiler som nummererer oppføringene

## Vanlige endringer: i hele stilen.

style-throughout = I hele stilen
style-page-ranges = Sideintervaller
style-page-ranges-as-entered = Slik de er skrevet inn
style-page-ranges-expanded = Fullt ut: 321–328
style-page-ranges-minimal = Kortest mulig: 321–8
style-page-ranges-minimal-two = Minst to sifre: 321–28
style-page-ranges-chicago = Slik Chicago Manual har det
style-particles = «van», «de», «von» foran et etternavn
style-particles-never = Blir stående, og sorteres under v, d
style-particles-sort-only = Blir stående, men sorteres ikke etter
style-particles-display-and-sort = Flyttes etter fornavnet: Gogh, Vincent van
style-hyphen = Bindestrek mellom initialer
style-hyphen-hint = J.-P. Sartre, ikke J.P. Sartre
style-locale = Ordene i stilen er på
style-locale-document = Dokumentets språk
style-locale-hint = «red.», «i», «lest», månedene

## Del for del.

# Scope er citation eller bibliography.
style-parts-of = { $scope ->
    [citation] Delene av henvisningen
   *[bibliography] Delene av litteraturlisten
}
style-parts-none = { $scope ->
    [citation] Denne stilen har ingen henvisning.
   *[bibliography] Denne stilen har ingen litteraturliste.
}
style-parts-hint = Velg en del til venstre for å endre hvordan den skrives ut: det som står foran og etter den, skriften, de store bokstavene. Delene kan åpnes for å vise hva de består av.
style-part-unfold = Brett ut
style-part-fold = Brett sammen
style-part-up = Flytt opp
style-part-down = Flytt ned
style-part-add-after = Legg til etter
style-part-take-away = Ta bort
style-part-add-within = Legg til inni
# En del av en makro: en del av stilen som brukes flere steder.
style-part-shared = Dette hører til «{ $macro }», som brukes { $count } steder. En endring her vises alle stedene.
style-add-words = Egne ord
style-add-words-hint = Som «i», «lest» eller tegnsetting
# Over feltene i en referanse som en del kan skrive ut.
style-add-from-reference = Fra referansen
style-part-words = Ordene
style-part-before = Foran
style-part-before-hint = Skrives bare ut når selve delen skrives ut
style-part-after = Etter
style-part-between = Mellom delene
style-slant = Helling
style-slant-upright = Rett
style-slant-italic = Kursiv
style-weight = Vekt
style-weight-regular = Normal
style-weight-bold = Fet
style-letters = Bokstaver
style-letters-as-written = Som skrevet
style-letters-small-caps = Kapitéler
style-case = Store bokstaver
style-case-as-entered = Slik det er skrevet inn
style-case-title = Engelsk tittelform
style-case-sentence = Setningsform
style-case-capitalize-first = Stor forbokstav
style-case-capitalize-all = Stor Forbokstav I Hvert Ord
style-case-uppercase = STORE BOKSTAVER
style-case-lowercase = små bokstaver
style-height = Høyde
style-height-baseline = På linjen
style-height-raised = Hevet
style-height-lowered = Senket
style-quotes = I anførselstegn
style-strip-periods = Uten punktum
style-strip-periods-hint = For forkortelser: «red» for «red.»
style-text-form = Form
style-text-form-long = Fullt ut
style-text-form-short = Kort, der referansen har en kort form
style-term-form = Ordets form
style-term-form-long = Fullt ut: redaktør, side
style-term-form-short = Kort: red., s.
style-term-form-verb = Som verb: redigert av
style-term-form-verb-short = Som verb, kort: red. av
style-term-form-symbol = Som tegn: §
style-date-parts = Datoen oppgis
style-date-parts-year = Bare som år
style-date-parts-year-month = Som år og måned
style-date-parts-full = Fullt ut

## Kilden til stilen, og prøven den testes på.

style-source = Kilden til stilen
style-source-try = Prøv
style-source-unread = Kilden kunne ikke leses.
style-sample-unusable = Stilen kan ikke brukes slik den er
style-sample-failed = Stilen kunne ikke prøves.
style-sample-in-text = I teksten
style-sample-in-notes = I notene
style-sample-in-bibliography = I litteraturlisten
style-sample-cited = Et verk det vises til
style-sample-same-page = Det samme, med sidetall
style-sample-another = Et annet, med ord foran
style-sample-first-again = Det første igjen, med kapittel
style-sample-together = To verk sammen
style-sample-in-sentence = Med forfatteren i setningen
style-sample-examples = Vist med eksempler: biblioteket ditt er tomt.
style-sample-library = Vist med verk fra biblioteket ditt.

## Kilden til en stil, der den ikke kan leses som en stil.

style-source-not-xml = Kilden er ikke velformet XML.
style-source-not-style = Dette er ikke en stil: den begynner ikke med <style>.
style-source-dependent = Stilen har ingen <citation>: den bare viser til en annen stil, og kan ikke endres.

## Delene av en stil, slik redigeringen av stilen beskriver dem med ord.

style-part-layout = Det hele
style-part-text = Tekst
# En del som skriver ut et ord på stilens språk: termen er navnet ordet har i CSL.
style-part-term = Ordet for «{ $term }»
# En del som skriver ut ord som står i selve stilen.
style-part-value = Ordene «{ $value }»
style-part-name = Hvordan navnene skrives
# Navnet er family eller given, slik CSL har dem.
style-part-name-part = { $name ->
    [family] Etternavnet
    [given] Fornavnet
   *[other] Navnet
}
style-part-et-al = «et al.»
# Variablene er en eller flere av dem nedenfor: «sidene».
style-part-label = Ordet foran { $variables } («s.», «red.»)
style-part-role = Ordet for rollen («red.», «overs.»)
style-part-substitute = I stedet for navnet, når det mangler
# Navnet er day, month eller year, slik CSL har dem, eller part.
style-part-date-part = { $name ->
    [day] Dagen
    [month] Måneden
    [year] Året
   *[other] Delen
}
style-part-group = Sammen
style-part-choose = Ett av disse
# Betingelsen er satt sammen av dem nedenfor.
style-part-if = Hvis { $condition }
style-part-else-if = Ellers, hvis { $condition }
style-part-else = Ellers
# Et navn stilen har, på en del av den (en makro) eller på en variabel den ikke kjenner.
style-quoted = «{ $text }»

## Ord som binder andre sammen: «forfatteren, ellers redaktøren», «en bok eller et kapittel».
## Det første kan være en liste av flere, skilt med komma.

style-or = { $first } eller { $last }
style-and = { $first } og { $last }
style-or-else = { $first }, ellers { $last }

## Når en del av en stil skrives ut: «Hvis verket er en bok».

style-if-type = verket er { $types }
style-if-has = det har { $variables }
style-if-lacks = det mangler { $variables }
style-if-numeric = { $variables } er et tall
style-if-uncertain = { $variables } er usikker
# Stedene er sider, kapitler, vers og lignende; se style-locator.
style-if-locator = det vises til { $locators }
style-if-disambiguate = den ellers ville blitt forvekslet med en annen
style-if-always = alltid
style-if-none-holds = ikke noe av dette gjelder: { $conditions }
# Et slags sted en kildehenvisning viser til, slik CSL kaller det: page, chapter, verse,
# sub-verbo og så videre.
style-locator = { $name ->
    [act] en akt
    [appendix] et vedlegg
    [article-locator] en artikkel
    [book] en bok
    [canon] en kanon
    [chapter] et kapittel
    [column] en spalte
    [elocation] et elektronisk sted
    [equation] en ligning
    [figure] en figur
    [folio] et blad
    [issue] et hefte
    [line] en linje
    [note] en note
    [opus] et opus
    [page] en side
    [paragraph] et avsnitt
    [part] en del
    [rule] en regel
    [scene] en scene
    [section] en seksjon
    [sub-verbo] et oppslagsord
    [supplement] et tillegg
    [table] en tabell
    [timestamp] et tidspunkt
    [title-locator] en tittel
    [verse] et vers
    [volume] et bind
   *[other] { $name }
}

## Når en kildehenvisning skrives ut, etter hvor den står blant de andre.

style-position-first = verket vises til for første gang
style-position-subsequent = verket er vist til før
style-position-ibid = henvisningen er den samme som den forrige
style-position-ibid-with-locator = henvisningen er den samme som den forrige, men til et annet sted
style-position-near-note = verket ble vist til i en note like før

## Hvordan en del settes: «kursiv, i anførselstegn, foran «, »».

style-form-italic = kursiv
style-form-bold = fet
style-form-small-caps = kapitéler
style-form-underlined = understreket
style-form-quoted = i anførselstegn
# Hvordan bokstavene settes, slik CSL kaller det; ordene er det navnet med mellomrom for bindestrekene.
style-form-case = { $case ->
    [lowercase] små bokstaver
    [uppercase] store bokstaver
    [capitalize-first] stor forbokstav
    [capitalize-all] stor forbokstav i hvert ord
    [sentence] setningsform
    [title] tittelform
   *[other] { $words }
}
style-form-raised = hevet
style-form-lowered = senket
# Delen kommer etter disse ordene.
style-form-after = etter «{ $text }»
# Delen kommer foran disse ordene.
style-form-before = foran «{ $text }»
style-form-between = med «{ $text }» mellom

## Slag av verk en referanse kan være, slik CSL kaller dem.

style-type-book = en bok
style-type-chapter = et kapittel
style-type-article-journal = en artikkel i et tidsskrift
style-type-article-magazine = en artikkel i et magasin
style-type-article-newspaper = en avisartikkel
style-type-article = en artikkel
style-type-thesis = en avhandling
style-type-report = en rapport
style-type-webpage = en nettside
style-type-paper-conference = et konferansebidrag
style-type-entry-encyclopedia = et oppslag i et leksikon
style-type-entry-dictionary = et oppslag i en ordbok
style-type-entry = et oppslag
style-type-review = en anmeldelse
style-type-review-book = en bokanmeldelse
style-type-manuscript = et manuskript
style-type-personal_communication = et brev eller annen personlig kommunikasjon
style-type-legal_case = en dom
style-type-legislation = en lov
style-type-bill = et lovforslag
style-type-patent = et patent
style-type-dataset = et datasett
style-type-software = programvare
style-type-motion_picture = en film
style-type-broadcast = en sending
style-type-song = et opptak
style-type-speech = et foredrag
style-type-interview = et intervju
style-type-graphic = et bilde
style-type-map = et kart
style-type-pamphlet = en brosjyre
style-type-post-weblog = et blogginnlegg
style-type-post = et innlegg
style-type-classic = et klassisk verk
style-type-collection = en samling
style-type-document = et dokument
style-type-standard = en standard
style-type-treaty = en traktat
style-type-periodical = et periodikum
style-type-musical_score = et partitur
style-type-figure = en figur
style-type-event = en hendelse
style-type-performance = en forestilling
style-type-regulation = en forskrift
style-type-hearing = en høring

## Det en referanse har, slik CSL kaller det: i bestemt form, og i ubestemt
## form (.bare) slik et felt i en referanse heter.

style-variable-title = tittelen
    .bare = tittel
style-variable-title-short = den korte tittelen
    .bare = kort tittel
style-variable-container-title = tittelen på tidsskriftet eller boken
    .bare = tittel på tidsskrift eller bok
style-variable-container-title-short = den korte tittelen på tidsskriftet
    .bare = kort tittel på tidsskrift
style-variable-collection-title = serien
    .bare = serie
style-variable-collection-number = nummeret i serien
    .bare = nummer i serie
style-variable-original-title = originaltittelen
    .bare = originaltittel
style-variable-reviewed-title = tittelen på verket som anmeldes
    .bare = tittel på verk som anmeldes
style-variable-author = forfatteren
    .bare = forfatter
style-variable-editor = redaktøren
    .bare = redaktør
style-variable-translator = oversetteren
    .bare = oversetter
style-variable-container-author = forfatteren av boken
    .bare = forfatter av bok
style-variable-collection-editor = redaktøren av serien
    .bare = redaktør av serie
style-variable-editorial-director = den ansvarlige redaktøren
    .bare = ansvarlig redaktør
style-variable-original-author = den opprinnelige forfatteren
    .bare = opprinnelig forfatter
style-variable-reviewed-author = forfatteren av verket som anmeldes
    .bare = forfatter av verk som anmeldes
style-variable-interviewer = intervjueren
    .bare = intervjuer
style-variable-recipient = mottakeren
    .bare = mottaker
style-variable-director = regissøren
    .bare = regissør
style-variable-composer = komponisten
    .bare = komponist
style-variable-illustrator = illustratøren
    .bare = illustratør
style-variable-issued = datoen
    .bare = dato
style-variable-accessed = lesedatoen
    .bare = lesedato
style-variable-original-date = den opprinnelige datoen
    .bare = opprinnelig dato
style-variable-event-date = datoen for hendelsen
    .bare = dato for hendelse
style-variable-submitted = innleveringsdatoen
    .bare = innleveringsdato
style-variable-volume = bindet
    .bare = bind
style-variable-number-of-volumes = antallet bind
    .bare = antall bind
style-variable-issue = heftet
    .bare = hefte
style-variable-edition = utgaven
    .bare = utgave
style-variable-page = sidene
    .bare = sider
style-variable-page-first = den første siden
    .bare = første side
style-variable-number-of-pages = antallet sider
    .bare = antall sider
style-variable-number = nummeret
    .bare = nummer
style-variable-chapter = kapitlet
    .bare = kapittel
style-variable-chapter-number = kapittelnummeret
    .bare = kapittelnummer
style-variable-publisher = forlaget
    .bare = forlag
style-variable-publisher-place = utgivelsesstedet
    .bare = utgivelsessted
style-variable-original-publisher = det opprinnelige forlaget
    .bare = opprinnelig forlag
style-variable-original-publisher-place = det opprinnelige utgivelsesstedet
    .bare = opprinnelig utgivelsessted
style-variable-locator = sidetallet
    .bare = sidetall
style-variable-citation-number = nummeret på henvisningen
    .bare = nummer på henvisning
style-variable-citation-label = etiketten på henvisningen
    .bare = etikett på henvisning
style-variable-year-suffix = bokstaven etter årstallet
    .bare = bokstav etter årstall
style-variable-first-reference-note-number = nummeret på noten der verket først ble vist til
    .bare = nummer på note der verket først ble vist til
style-variable-DOI = DOI-en
    .bare = DOI
style-variable-URL = nettadressen
    .bare = nettadresse
style-variable-ISBN = ISBN-nummeret
    .bare = ISBN
style-variable-ISSN = ISSN-nummeret
    .bare = ISSN
style-variable-PMID = PMID-en
    .bare = PMID
style-variable-genre = typen verk
    .bare = type verk
style-variable-medium = mediet
    .bare = medium
style-variable-note = merknaden
    .bare = merknad
style-variable-annote = kommentaren
    .bare = kommentar
style-variable-abstract = sammendraget
    .bare = sammendrag
style-variable-archive = arkivet
    .bare = arkiv
style-variable-archive_location = plasseringen i arkivet
    .bare = plassering i arkiv
style-variable-archive-place = arkivstedet
    .bare = arkivsted
style-variable-authority = myndigheten
    .bare = myndighet
style-variable-call-number = hyllesignaturen
    .bare = hyllesignatur
style-variable-event = hendelsen
    .bare = hendelse
style-variable-event-place = stedet for hendelsen
    .bare = sted for hendelse
style-variable-event-title = tittelen på hendelsen
    .bare = tittel på hendelse
style-variable-section = seksjonen
    .bare = seksjon
style-variable-source = kilden
    .bare = kilde
style-variable-status = publiseringsstatusen
    .bare = publiseringsstatus
style-variable-version = versjonen
    .bare = versjon
style-variable-language = språket
    .bare = språk
style-variable-dimensions = målene
    .bare = mål
style-variable-scale = målestokken
    .bare = målestokk
style-variable-references = referansene
    .bare = referanser
style-variable-keyword = nøkkelordene
    .bare = nøkkelord
style-variable-jurisdiction = jurisdiksjonen
    .bare = jurisdiksjon
