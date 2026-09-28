# Det kjernen sier om å slå opp referanser i andres databaser, på bokmål.
# Se locales/README.md.

## Det som ble skrevet inn for å slås opp.

core-lookup-not-a-doi = «{ $doi }» er ikke en DOI.
core-lookup-not-arxiv = «{ $id }» er ikke en identifikator i arXiv.
core-lookup-not-pubmed = «{ $id }» er ikke et nummer i PubMed.
core-lookup-isbn-length = «{ $isbn }» er ikke et ISBN: et ISBN har 10 eller 13 sifre, og dette har { $count }.
core-lookup-isbn-check = «{ $isbn }» er ikke et ISBN: det siste sifferet regnes ut fra de andre, og stemmer ikke med dem. Er et siffer skrevet feil?
core-lookup-not-isbn = «{ $isbn }» er ikke et ISBN.
core-lookup-address = En adresse kan slås opp når den inneholder en DOI, en identifikator i arXiv eller et nummer i PubMed. Denne gjør ikke det: søk etter tittelen i stedet.
core-lookup-nothing = Det er ingenting å søke etter.

## Tjenestene, og det de ber om å få sagt om seg.

core-lookup-sikt = Norske fagbibliotek (Sikt)
core-lookup-thanks-arxiv = Takk til arXiv for at vi kan bruke det åpne grensesnittet deres.
core-lookup-thanks-sikt = Inneholder poster fra bibliotekkatalogen til Sikt, tilgjengeliggjort under norsk lisens for offentlige data (NLOD).
core-lookup-crossref-for-book = Crossref, for boken

## En tjeneste som ikke svarte som den skulle. Vises etter «nettverket: ».

core-lookup-unreadable = { $service } svarte med noe som ikke kunne leses
core-lookup-not-preprints = { $service } svarte med noe som ikke er en liste over preprinter
core-lookup-not-articles = { $service } svarte med noe som ikke er en liste over artikler
core-lookup-could-not-answer = { $service } kunne ikke svare på spørsmålet: { $said }
core-lookup-catalogue-could-not-answer = katalogen kunne ikke svare på spørsmålet: { $said }
core-lookup-no-reason = ingen grunn oppgitt
core-lookup-catalogue-unreadable = svaret kunne ikke leses
core-lookup-not-a-catalogue = svaret kom ikke fra en katalog
core-lookup-pubmed-book = { $service } har dette som en bok eller en del av en bok, og det kan ikke leses derfra ennå
core-lookup-wrong-form = { $host } gir ikke posten i den formen det ble bedt om
core-lookup-not-a-record = { $service }: svaret var ikke en post som kunne leses.

## Det den som tar en post, bør vite om den.

core-lookup-arxiv-published-doi = Denne preprinten er publisert senere. DOI-en som er ført inn, er den publiserte versjonens: slå opp { $doi } for å vise til den i stedet.
core-lookup-arxiv-published = Denne preprinten er publisert senere: { $journal }.
core-lookup-arxiv-year-only = Bare året er oppgitt her. Et oppslag på arXiv:{ $id } gir dagen preprinten ble sendt inn.
core-lookup-crossref-in-book = Et søk gir ikke redaktørene og ISBN-et til boken. Det gjør et oppslag på DOI-en.
core-lookup-book-unreadable = Det Crossref har om boken, kunne ikke leses: redaktørene kan mangle.
core-lookup-book-not-fetched = Det Crossref har om boken, kunne ikke hentes: redaktørene kan mangle.
core-lookup-chapter-author = Crossref oppgir ingen forfatter for kapitlet. Forfatteren av boken er ført inn som forfatter.
core-lookup-group-name = «{ $name }» var oppgitt som navnet på en person, «{ $family }, { $given }», og er tatt som navnet på en gruppe.
core-lookup-kind-none = Posten oppgir ingen publikasjonstype. Den er ført inn som «misc»: velg riktig type.
core-lookup-kind = Posten kaller publikasjonstypen «{ $kind }». Den er ført inn som «misc»: velg riktig type.
core-lookup-publisher-capitals = Forlaget sto med store bokstaver, «{ $publisher }», og er skrevet «{ $mended }».
core-lookup-no-creators = Posten oppgir ingen forfatter eller redaktør.
core-lookup-title-capitals = Tittelen sto med store bokstaver og er satt med små: se etter at navn har stor forbokstav.
core-lookup-name-capitals = Navnet «{ $family }» sto med store bokstaver og er skrevet «{ $mended }».
core-lookup-pubmed-translated = PubMed oversetter tittelen til engelsk som «{ $title }».
core-lookup-pubmed-translation = Tittelen er PubMeds oversettelse til engelsk. Tittelen på artikkelens eget språk er ikke oppgitt.
core-lookup-parallel-title = Posten gir også tittelen på et annet språk, og den er ikke ført inn: «{ $title }».
core-lookup-original-script = Tittelen er ført inn slik katalogen skriver den med latinske bokstaver. Med sin egen skrift er den «{ $title }».
core-lookup-unplaced-name = Posten nevner { $name } uten å si i hvilken rolle. Navnet er ikke ført inn.
core-lookup-thesis = Boken er også en avhandling: { $said }.
core-lookup-ebook = En post for en e-bok: sted, forlag og år gjelder den elektroniske utgaven.
core-lookup-sound = Et lydopptak.
core-lookup-audio-book = En post for en lydbok.
core-lookup-not-text = Posten gjelder ikke en tekst. Den er ført inn så godt det lot seg gjøre: velg riktig type.
core-lookup-other-form = ISBN-et det ble spurt etter, hører til en annen form av boken. ISBN-et til det denne posten beskriver, er { $isbn }.
core-lookup-other-isbn = Posten har ikke ISBN-et det ble spurt etter. ISBN-et til det den beskriver, er { $isbn }.
core-lookup-isbn-none = ingen
core-lookup-another-edition = En annen utgave med samme ISBN ({ $which }).
core-lookup-edition-year = { $edition }. utgave, { $year }
core-lookup-without-year = uten år
