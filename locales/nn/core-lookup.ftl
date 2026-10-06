# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = «{ $doi }» er ikkje ein DOI.
core-lookup-not-arxiv = «{ $id }» er ikkje ein identifikator i arXiv.
core-lookup-not-pubmed = «{ $id }» er ikkje eit nummer i PubMed.
core-lookup-isbn-length = «{ $isbn }» er ikkje eit ISBN: eit ISBN har 10 eller 13 siffer, og dette har { $count }.
core-lookup-isbn-check = «{ $isbn }» er ikkje eit ISBN: det siste sifferet blir rekna ut frå dei andre, og stemmer ikkje med dei. Er eit siffer skrive feil?
core-lookup-not-isbn = «{ $isbn }» er ikkje eit ISBN.
core-lookup-address = Ei adresse kan slåast opp når den inneheld ein DOI, ein identifikator i arXiv eller eit nummer i PubMed. Denne gjer ikkje det: søk etter tittelen i staden.
core-lookup-nothing = Det er ingenting å søkje etter.

## The services, and what they ask to have said of them.

core-lookup-sikt = Norske fagbibliotek (Sikt)
core-lookup-thanks-arxiv = Takk til arXiv for at vi kan bruke det opne grensesnittet deira.
core-lookup-thanks-sikt = Inneheld postar frå bibliotekkatalogen til Sikt, gjorde tilgjengelege under Norsk lisens for offentlege data (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, for boka

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } svarte med noko som ikkje kunne lesast
core-lookup-not-preprints = { $service } svarte med noko som ikkje er ei liste over førehandstrykk
core-lookup-not-articles = { $service } svarte med noko som ikkje er ei liste over artiklar
core-lookup-could-not-answer = { $service } kunne ikkje svare på spørsmålet: { $said }
core-lookup-catalogue-could-not-answer = katalogen kunne ikkje svare på spørsmålet: { $said }
core-lookup-no-reason = ingen grunn oppgitt
core-lookup-catalogue-unreadable = svaret kunne ikkje lesast
core-lookup-not-a-catalogue = svaret kom ikkje frå ein katalog
core-lookup-pubmed-book = { $service } har dette som ei bok eller ein del av ei bok, og det kan ikkje lesast derifrå enno
core-lookup-wrong-form = { $host } gir ikkje posten i den forma det vart bede om
core-lookup-not-a-record = { $service }: svaret var ikkje ein post som kunne lesast.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Dette førehandstrykket er publisert seinare. DOI-en som er ført inn, er den til den publiserte versjonen: slå opp { $doi } for å vise til den i staden.
core-lookup-arxiv-published = Dette førehandstrykket er publisert seinare: { $journal }.
core-lookup-arxiv-year-only = Berre året er oppgitt her. Eit oppslag på arXiv:{ $id } gir dagen førehandstrykket vart sendt inn.
core-lookup-crossref-in-book = Eit søk gir ikkje redaktørane og ISBN-et til boka. Det gjer eit oppslag på DOI-en.
core-lookup-book-unreadable = Det Crossref har om boka, kunne ikkje lesast: redaktørane kan mangle.
core-lookup-book-not-fetched = Det Crossref har om boka, kunne ikkje hentast: redaktørane kan mangle.
core-lookup-chapter-author = Crossref oppgir ingen forfattar for kapittelet. Forfattaren av boka er ført inn som forfattar.
core-lookup-group-name = «{ $name }» var oppgitt som namnet på ein person, «{ $family }, { $given }», og er teke som namnet på ei gruppe.
core-lookup-kind-none = Posten oppgir ingen publikasjonstype. Den er ført inn som «misc»: vel rett type.
core-lookup-kind = Posten kallar publikasjonstypen «{ $kind }». Den er ført inn som «misc»: vel rett type.
core-lookup-publisher-capitals = Forlaget stod med store bokstavar, «{ $publisher }», og er skrive «{ $mended }».
core-lookup-no-creators = Posten oppgir ingen forfattar eller redaktør.
core-lookup-title-capitals = Tittelen stod med store bokstavar og er sett med små: sjå etter at namn har stor forbokstav.
core-lookup-name-capitals = Namnet «{ $family }» stod med store bokstavar og er skrive «{ $mended }».
core-lookup-pubmed-translated = PubMed omset tittelen til engelsk som «{ $title }».
core-lookup-pubmed-translation = Tittelen er PubMed si omsetjing til engelsk. Tittelen på språket til artikkelen er ikkje oppgitt.
core-lookup-parallel-title = Posten gir òg tittelen på eit anna språk, og den er ikkje ført inn: «{ $title }».
core-lookup-original-script = Tittelen er ført inn slik katalogen skriv den med latinske bokstavar. Med si eiga skrift er den «{ $title }».
core-lookup-unplaced-name = Posten nemner { $name } utan å seie i kva rolle. Namnet er ikkje ført inn.
core-lookup-thesis = Boka er òg ei avhandling: { $said }.
core-lookup-ebook = Ein post for ei e-bok: stad, forlag og år gjeld den elektroniske utgåva.
core-lookup-sound = Eit lydopptak.
core-lookup-audio-book = Ein post for ei lydbok.
core-lookup-not-text = Posten gjeld ikkje ein tekst. Den er ført inn så godt det lét seg gjere: vel rett type.
core-lookup-other-form = ISBN-et det vart spurt etter, høyrer til ei anna form av boka. ISBN-et til det denne posten beskriv, er { $isbn }.
core-lookup-other-isbn = Posten har ikkje ISBN-et det vart spurt etter. ISBN-et til det den beskriv, er { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = ikkje oppgitt
core-lookup-another-edition = Ei anna utgåve med same ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = { $edition }. utgåve, { $year }
core-lookup-without-year = utan år
