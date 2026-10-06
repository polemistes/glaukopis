# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = ‘{ $doi }’ is geen DOI.
core-lookup-not-arxiv = ‘{ $id }’ is geen identificatie van arXiv.
core-lookup-not-pubmed = ‘{ $id }’ is geen nummer van PubMed.
core-lookup-isbn-length = ‘{ $isbn }’ is geen ISBN: een ISBN heeft 10 of 13 cijfers, en dit heeft er { $count }.
core-lookup-isbn-check = ‘{ $isbn }’ is geen ISBN: het laatste cijfer wordt uit de andere berekend, en klopt daar niet mee. Is er een cijfer verkeerd getypt?
core-lookup-not-isbn = ‘{ $isbn }’ is geen ISBN.
core-lookup-address = Een adres kan worden opgezocht als het een DOI, een identificatie van arXiv of een nummer van PubMed bevat. Dit adres niet: zoek in plaats daarvan op de titel.
core-lookup-nothing = Er is niets om naar te zoeken.

## The services, and what they ask to have said of them.

core-lookup-sikt = Noorse academische bibliotheken (Sikt)
core-lookup-thanks-arxiv = Met dank aan arXiv voor het gebruik van zijn open access interoperability.
core-lookup-thanks-sikt = Bevat records uit de bibliotheekcatalogus van Sikt, beschikbaar gesteld onder de Norwegian Licence for Open Government Data (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, voor het boek

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } antwoordde met iets dat niet kon worden gelezen
core-lookup-not-preprints = { $service } antwoordde met iets dat geen lijst van preprints is
core-lookup-not-articles = { $service } antwoordde met iets dat geen lijst van artikelen is
core-lookup-could-not-answer = { $service } kon de vraag niet beantwoorden: { $said }
core-lookup-catalogue-could-not-answer = de catalogus kon de vraag niet beantwoorden: { $said }
core-lookup-no-reason = geen reden gegeven
core-lookup-catalogue-unreadable = het antwoord kon niet worden gelezen
core-lookup-not-a-catalogue = het antwoord was niet dat van een catalogus
core-lookup-pubmed-book = { $service } heeft dit als een boek of een deel ervan, wat daar nog niet uit kan worden gelezen
core-lookup-wrong-form = { $host } geeft het record niet in de gevraagde vorm
core-lookup-not-a-record = { $service }: het antwoord was geen record dat kon worden gelezen.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Deze preprint is sindsdien gepubliceerd. De ingevulde DOI is die van de gepubliceerde versie: zoek { $doi } op om die te citeren.
core-lookup-arxiv-published = Deze preprint is sindsdien gepubliceerd: { $journal }.
core-lookup-arxiv-year-only = Hier is alleen het jaar gegeven. Het opzoeken van arXiv:{ $id } geeft de dag waarop de preprint is ingediend.
core-lookup-crossref-in-book = Een zoekopdracht geeft de redacteuren en het ISBN van het boek niet. Het opzoeken van de DOI wel.
core-lookup-book-unreadable = Wat Crossref over het boek heeft, kon niet worden gelezen: de redacteuren kunnen ontbreken.
core-lookup-book-not-fetched = Wat Crossref over het boek heeft, kon niet worden opgehaald: de redacteuren kunnen ontbreken.
core-lookup-chapter-author = Crossref noemt geen auteur voor het hoofdstuk. De auteur van het boek is als auteur ingevuld.
core-lookup-group-name = ‘{ $name }’ was gegeven als de naam van een persoon, ‘{ $family }, { $given }’, en is opgevat als de naam van een groep.
core-lookup-kind-none = Het record noemt de soort publicatie niet. Ze is ingevuld als ‘misc’: kies het juiste type.
core-lookup-kind = Het record noemt de soort publicatie ‘{ $kind }’. Ze is ingevuld als ‘misc’: kies het juiste type.
core-lookup-publisher-capitals = De uitgever stond in hoofdletters, ‘{ $publisher }’, en is geschreven als ‘{ $mended }’.
core-lookup-no-creators = Het record noemt geen auteur of redacteur.
core-lookup-title-capitals = De titel stond in hoofdletters en is in kleine letters gezet: kijk na of namen hun hoofdletters hebben.
core-lookup-name-capitals = De naam ‘{ $family }’ stond in hoofdletters en is geschreven als ‘{ $mended }’.
core-lookup-pubmed-translated = PubMed vertaalt de titel in het Engels als ‘{ $title }’.
core-lookup-pubmed-translation = De titel is de Engelse vertaling van PubMed. De titel in de taal van het artikel is niet gegeven.
core-lookup-parallel-title = Het record geeft de titel ook in een andere taal, die niet is ingevuld: ‘{ $title }’.
core-lookup-original-script = De titel is ingevuld zoals de catalogus hem in Latijnse letters schrijft. In zijn eigen schrift luidt hij ‘{ $title }’.
core-lookup-unplaced-name = Het record noemt { $name } zonder te zeggen als wat. De naam is niet ingevuld.
core-lookup-thesis = Het boek is ook een proefschrift: { $said }.
core-lookup-ebook = Een record van een e-boek: plaats, uitgever en jaar zijn die van de elektronische uitgave.
core-lookup-sound = Een geluidsopname.
core-lookup-audio-book = Een record van een luisterboek.
core-lookup-not-text = Het record is niet van een tekst. Het is ingevuld zoals het kon: kies het juiste type.
core-lookup-other-form = Het gevraagde ISBN is dat van een andere vorm van het boek. Het ISBN van wat dit record beschrijft is { $isbn }.
core-lookup-other-isbn = Het record heeft het gevraagde ISBN niet. Het ISBN van wat het beschrijft is { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = er niet
core-lookup-another-edition = Een andere uitgave met hetzelfde ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = uitgave { $edition }, { $year }
core-lookup-without-year = zonder jaar
