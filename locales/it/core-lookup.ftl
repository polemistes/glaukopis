# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = «{ $doi }» non è un DOI.
core-lookup-not-arxiv = «{ $id }» non è un identificativo di arXiv.
core-lookup-not-pubmed = «{ $id }» non è un numero di PubMed.
core-lookup-isbn-length = «{ $isbn }» non è un ISBN: un ISBN ha 10 o 13 cifre, e questo ne ha { $count }.
core-lookup-isbn-check = «{ $isbn }» non è un ISBN: la sua ultima cifra si calcola dalle altre, e non torna con esse. C'è una cifra sbagliata?
core-lookup-not-isbn = «{ $isbn }» non è un ISBN.
core-lookup-address = Un indirizzo si può cercare in rete quando contiene un DOI, un identificativo di arXiv o un numero di PubMed. Questo non ne ha: cerca invece il titolo.
core-lookup-nothing = Non c'è nulla da cercare.

## The services, and what they ask to have said of them.

core-lookup-sikt = Biblioteche accademiche norvegesi (Sikt)
core-lookup-thanks-arxiv = Grazie ad arXiv per l'uso della sua interfaccia aperta di interoperabilità.
core-lookup-thanks-sikt = Contiene record del catalogo delle biblioteche di Sikt, resi disponibili con la Licenza norvegese per i dati aperti della pubblica amministrazione (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, per il libro

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } ha risposto con qualcosa che non si è potuto leggere
core-lookup-not-preprints = { $service } ha risposto con qualcosa che non è un elenco di preprint
core-lookup-not-articles = { $service } ha risposto con qualcosa che non è un elenco di articoli
core-lookup-could-not-answer = { $service } non ha potuto rispondere alla domanda: { $said }
core-lookup-catalogue-could-not-answer = il catalogo non ha potuto rispondere alla domanda: { $said }
core-lookup-no-reason = senza dire perché
core-lookup-catalogue-unreadable = la risposta non si è potuta leggere
core-lookup-not-a-catalogue = la risposta non era quella di un catalogo
core-lookup-pubmed-book = { $service } ha questo come libro o parte di un libro, che da lì non si può ancora leggere
core-lookup-wrong-form = { $host } non dà il record nella forma richiesta
core-lookup-not-a-record = { $service }: la risposta non era un record leggibile.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Questo preprint è stato poi pubblicato. Il DOI inserito è quello della versione pubblicata: cerca { $doi } per citare quella.
core-lookup-arxiv-published = Questo preprint è stato poi pubblicato: { $journal }.
core-lookup-arxiv-year-only = Qui è dato solo l'anno. Cercando arXiv:{ $id } si ha il giorno in cui il preprint è stato inviato.
core-lookup-crossref-in-book = Una ricerca non dà i curatori e l'ISBN del libro. Cercare il DOI sì.
core-lookup-book-unreadable = Ciò che Crossref ha sul libro non si è potuto leggere: possono mancare i curatori.
core-lookup-book-not-fetched = Ciò che Crossref ha sul libro non si è potuto scaricare: possono mancare i curatori.
core-lookup-chapter-author = Crossref non nomina un autore per il capitolo. Come suo autore è stato inserito l'autore del libro.
core-lookup-group-name = «{ $name }» era dato come nome di persona, «{ $family }, { $given }», ed è stato preso come nome di un ente.
core-lookup-kind-none = Il record non dice di che tipo di pubblicazione si tratti. È stato inserito come «misc»: scegli il tipo giusto.
core-lookup-kind = Il record chiama il tipo di pubblicazione «{ $kind }». È stato inserito come «misc»: scegli il tipo giusto.
core-lookup-publisher-capitals = L'editore era in maiuscole, «{ $publisher }», ed è stato scritto «{ $mended }».
core-lookup-no-creators = Il record non nomina né un autore né un curatore.
core-lookup-title-capitals = Il titolo era in maiuscole ed è stato messo in minuscole: controlla che i nomi abbiano la maiuscola.
core-lookup-name-capitals = Il nome «{ $family }» era in maiuscole ed è stato scritto «{ $mended }».
core-lookup-pubmed-translated = PubMed traduce il titolo in inglese come «{ $title }».
core-lookup-pubmed-translation = Il titolo è la traduzione in inglese di PubMed. Il titolo nella lingua dell'articolo non è dato.
core-lookup-parallel-title = Il record dà il titolo anche in un'altra lingua, che non è stato inserito: «{ $title }».
core-lookup-original-script = Il titolo è inserito come il catalogo lo scrive in lettere latine. Nella sua scrittura è «{ $title }».
core-lookup-unplaced-name = Il record nomina { $name } senza dire in che veste. Il nome non è stato inserito.
core-lookup-thesis = Il libro è anche una tesi: { $said }.
core-lookup-ebook = Un record di e-book: luogo, editore e anno sono quelli dell'edizione elettronica.
core-lookup-sound = Una registrazione sonora.
core-lookup-audio-book = Il record di un audiolibro.
core-lookup-not-text = Il record non è di un testo. È stato inserito come si è potuto: scegli il tipo giusto.
core-lookup-other-form = L'ISBN cercato è quello di un'altra forma del libro. L'ISBN di ciò che questo record descrive è { $isbn }.
core-lookup-other-isbn = Il record non ha l'ISBN cercato. L'ISBN di ciò che descrive è { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = nessuno
core-lookup-another-edition = Un'altra edizione con lo stesso ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = edizione { $edition }, { $year }
core-lookup-without-year = senza anno
