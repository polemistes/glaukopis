# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = »{ $doi }« er ikke en DOI.
core-lookup-not-arxiv = »{ $id }« er ikke en identifikator i arXiv.
core-lookup-not-pubmed = »{ $id }« er ikke et nummer i PubMed.
core-lookup-isbn-length = »{ $isbn }« er ikke et ISBN: et ISBN har 10 eller 13 cifre, og dette har { $count }.
core-lookup-isbn-check = »{ $isbn }« er ikke et ISBN: det sidste ciffer udregnes af de andre og stemmer ikke med dem. Er et ciffer skrevet forkert?
core-lookup-not-isbn = »{ $isbn }« er ikke et ISBN.
core-lookup-address = En adresse kan slås op, når den indeholder en DOI, en identifikator i arXiv eller et nummer i PubMed. Det gør denne ikke: søg efter titlen i stedet.
core-lookup-nothing = Der er intet at søge efter.

## The services, and what they ask to have said of them.

core-lookup-sikt = Norske fagbiblioteker (Sikt)
core-lookup-thanks-arxiv = Tak til arXiv for brugen af dets åbne grænseflade.
core-lookup-thanks-sikt = Indeholder poster fra Sikts bibliotekskatalog, stillet til rådighed under den norske licens for offentlige data (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, for bogen

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } svarede med noget, der ikke kunne læses
core-lookup-not-preprints = { $service } svarede med noget, der ikke er en liste over preprints
core-lookup-not-articles = { $service } svarede med noget, der ikke er en liste over artikler
core-lookup-could-not-answer = { $service } kunne ikke besvare spørgsmålet: { $said }
core-lookup-catalogue-could-not-answer = kataloget kunne ikke besvare spørgsmålet: { $said }
core-lookup-no-reason = ingen grund angivet
core-lookup-catalogue-unreadable = svaret kunne ikke læses
core-lookup-not-a-catalogue = svaret kom ikke fra et katalog
core-lookup-pubmed-book = { $service } har dette som en bog eller en del af en, hvilket endnu ikke kan læses derfra
core-lookup-wrong-form = { $host } giver ikke posten i den form, der blev bedt om
core-lookup-not-a-record = { $service }: svaret var ikke en post, der kunne læses.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Dette preprint er siden blevet udgivet. Den DOI, der blev indtastet, er den udgivne versions: slå { $doi } op for at henvise til den i stedet.
core-lookup-arxiv-published = Dette preprint er siden blevet udgivet: { $journal }.
core-lookup-arxiv-year-only = Kun året er angivet her. Et opslag på arXiv:{ $id } giver den dag, preprintet blev indsendt.
core-lookup-crossref-in-book = En søgning giver ikke bogens redaktører og ISBN. Det gør et opslag på DOI'en.
core-lookup-book-unreadable = Det, Crossref har om bogen, kunne ikke læses: dens redaktører kan mangle.
core-lookup-book-not-fetched = Det, Crossref har om bogen, kunne ikke hentes: dens redaktører kan mangle.
core-lookup-chapter-author = Crossref nævner ingen forfatter til kapitlet. Bogens forfatter er indført som dets forfatter.
core-lookup-group-name = »{ $name }« var angivet som navnet på en person, »{ $family }, { $given }«, og er taget som navnet på en gruppe.
core-lookup-kind-none = Posten kalder publikationstypen ingenting. Den er indført som »misc«: vælg den rette type.
core-lookup-kind = Posten kalder publikationstypen »{ $kind }«. Den er indført som »misc«: vælg den rette type.
core-lookup-publisher-capitals = Forlaget stod med store bogstaver, »{ $publisher }«, og er skrevet »{ $mended }«.
core-lookup-no-creators = Posten nævner hverken forfatter eller redaktør.
core-lookup-title-capitals = Titlen stod med store bogstaver og er sat med små: se efter, at navne har deres store begyndelsesbogstaver.
core-lookup-name-capitals = Navnet »{ $family }« stod med store bogstaver og er skrevet »{ $mended }«.
core-lookup-pubmed-translated = PubMed oversætter titlen til engelsk som »{ $title }«.
core-lookup-pubmed-translation = Titlen er PubMeds oversættelse til engelsk. Titlen på artiklens eget sprog er ikke angivet.
core-lookup-parallel-title = Posten giver også titlen på et andet sprog, som ikke er indført: »{ $title }«.
core-lookup-original-script = Titlen er indført, som kataloget skriver den med latinske bogstaver. I sin egen skrift er den »{ $title }«.
core-lookup-unplaced-name = Posten nævner { $name } uden at sige som hvad. Navnet er ikke indført.
core-lookup-thesis = Bogen er også en afhandling: { $said }.
core-lookup-ebook = En post for en e-bog: sted, forlag og år er den elektroniske udgaves.
core-lookup-sound = En lydoptagelse.
core-lookup-audio-book = En post for en lydbog.
core-lookup-not-text = Posten gælder ikke en tekst. Den er indført, så godt det lod sig gøre: vælg den rette type.
core-lookup-other-form = Det ISBN, der blev spurgt efter, hører til en anden form af bogen. ISBN'et for det, denne post beskriver, er { $isbn }.
core-lookup-other-isbn = Posten har ikke det ISBN, der blev spurgt efter. ISBN'et for det, den beskriver, er { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = intet
core-lookup-another-edition = En anden udgave med samme ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = udgave { $edition }, { $year }
core-lookup-without-year = uden år
