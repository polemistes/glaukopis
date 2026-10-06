# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = ”{ $doi }” är inte en DOI.
core-lookup-not-arxiv = ”{ $id }” är inte en identifierare hos arXiv.
core-lookup-not-pubmed = ”{ $id }” är inte ett nummer hos PubMed.
core-lookup-isbn-length = ”{ $isbn }” är inte ett ISBN: ett ISBN har 10 eller 13 siffror, och detta har { $count }.
core-lookup-isbn-check = ”{ $isbn }” är inte ett ISBN: den sista siffran räknas fram ur de andra, och stämmer inte med dem. Är någon siffra felskriven?
core-lookup-not-isbn = ”{ $isbn }” är inte ett ISBN.
core-lookup-address = En adress kan slås upp när den innehåller en DOI, en identifierare hos arXiv eller ett nummer hos PubMed. Den här gör inte det: sök på titeln i stället.
core-lookup-nothing = Det finns inget att söka efter.

## The services, and what they ask to have said of them.

core-lookup-sikt = Norska akademiska bibliotek (Sikt)
core-lookup-thanks-arxiv = Tack till arXiv för användningen av dess öppna gränssnitt för utbyte av data.
core-lookup-thanks-sikt = Innehåller poster från Sikts bibliotekskatalog, tillgängliga under norska licensen för öppna offentliga data (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, om boken

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } svarade med något som inte kunde läsas
core-lookup-not-preprints = { $service } svarade med något som inte är en lista över preprints
core-lookup-not-articles = { $service } svarade med något som inte är en lista över artiklar
core-lookup-could-not-answer = { $service } kunde inte besvara frågan: { $said }
core-lookup-catalogue-could-not-answer = katalogen kunde inte besvara frågan: { $said }
core-lookup-no-reason = ingen orsak angavs
core-lookup-catalogue-unreadable = svaret kunde inte läsas
core-lookup-not-a-catalogue = svaret var inte en katalogs
core-lookup-pubmed-book = { $service } har detta som en bok eller en del av en, vilket ännu inte kan läsas därifrån
core-lookup-wrong-form = { $host } ger inte posten i den form som bads om
core-lookup-not-a-record = { $service }: svaret var inte en post som kunde läsas.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Detta preprint har sedan dess publicerats. Den DOI som förts in är den publicerade versionens: slå upp { $doi } för att hänvisa till den i stället.
core-lookup-arxiv-published = Detta preprint har sedan dess publicerats: { $journal }.
core-lookup-arxiv-year-only = Bara året anges här. Att slå upp arXiv:{ $id } ger dagen då preprintet sändes in.
core-lookup-crossref-in-book = En sökning ger inte bokens redaktörer och ISBN. Det gör en uppslagning av DOI.
core-lookup-book-unreadable = Det Crossref har om boken kunde inte läsas: dess redaktörer kan saknas.
core-lookup-book-not-fetched = Det Crossref har om boken kunde inte hämtas: dess redaktörer kan saknas.
core-lookup-chapter-author = Crossref anger ingen författare till kapitlet. Bokens författare har förts in som dess författare.
core-lookup-group-name = ”{ $name }” angavs som namnet på en person, ”{ $family }, { $given }”, och har tagits som namnet på en grupp.
core-lookup-kind-none = Posten kallar slaget av publikation ingenting. Den har förts in som ”misc”: välj rätt typ.
core-lookup-kind = Posten kallar slaget av publikation ”{ $kind }”. Den har förts in som ”misc”: välj rätt typ.
core-lookup-publisher-capitals = Förlaget stod med versaler, ”{ $publisher }”, och har skrivits ”{ $mended }”.
core-lookup-no-creators = Posten anger ingen författare eller redaktör.
core-lookup-title-capitals = Titeln stod med versaler och har satts med gemener: se till att namnen får sina stora bokstäver.
core-lookup-name-capitals = Namnet ”{ $family }” stod med versaler och har skrivits ”{ $mended }”.
core-lookup-pubmed-translated = PubMed översätter titeln till engelska som ”{ $title }”.
core-lookup-pubmed-translation = Titeln är PubMeds översättning till engelska. Titeln på artikelns eget språk anges inte.
core-lookup-parallel-title = Posten anger titeln även på ett annat språk, vilket inte har förts in: ”{ $title }”.
core-lookup-original-script = Titeln har förts in som katalogen skriver den med latinska bokstäver. I sin egen skrift är den ”{ $title }”.
core-lookup-unplaced-name = Posten nämner { $name } utan att säga som vad. Namnet har inte förts in.
core-lookup-thesis = Boken är också en avhandling: { $said }.
core-lookup-ebook = En post för en e-bok: ort, förlag och år är den elektroniska utgåvans.
core-lookup-sound = En ljudinspelning.
core-lookup-audio-book = En post för en ljudbok.
core-lookup-not-text = Posten gäller inte en text. Den har förts in så gott det gick: välj rätt typ.
core-lookup-other-form = Det ISBN som bads om är en annan form av bokens. ISBN för det som den här posten beskriver är { $isbn }.
core-lookup-other-isbn = Posten har inte det ISBN som bads om. ISBN för det som den beskriver är { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = inget
core-lookup-another-edition = En annan utgåva med samma ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = utgåva { $edition }, { $year }
core-lookup-without-year = utan år
