# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = „{ $doi }“ nije DOI.
core-lookup-not-arxiv = „{ $id }“ nije identifikator arXiva.
core-lookup-not-pubmed = „{ $id }“ nije broj PubMeda.
core-lookup-isbn-length = „{ $isbn }“ nije ISBN: ISBN ima 10 ili 13 cifara, a ovaj ih ima { $count }.
core-lookup-isbn-check = „{ $isbn }“ nije ISBN: njegova posljednja cifra računa se iz ostalih, a s njima se ne slaže. Je li neka cifra pogrešno otkucana?
core-lookup-not-isbn = „{ $isbn }“ nije ISBN.
core-lookup-address = Adresa se može dohvatiti kad sadrži DOI, identifikator arXiva ili broj PubMeda. Ova ne sadrži: umjesto toga pretražite po naslovu.
core-lookup-nothing = Nema šta da se traži.

## The services, and what they ask to have said of them.

core-lookup-sikt = Norveške akademske biblioteke (Sikt)
core-lookup-thanks-arxiv = Zahvaljujemo arXivu na korištenju njegove interoperabilnosti otvorenog pristupa.
core-lookup-thanks-sikt = Sadrži zapise iz bibliotečkog kataloga Sikta, dostupne pod Norveškom licencom za otvorene podatke javne uprave (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, za knjigu

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } je odgovorio nečim što nije bilo moguće pročitati
core-lookup-not-preprints = { $service } je odgovorio nečim što nije spisak preprinta
core-lookup-not-articles = { $service } je odgovorio nečim što nije spisak članaka
core-lookup-could-not-answer = { $service } nije mogao odgovoriti na pitanje: { $said }
core-lookup-catalogue-could-not-answer = katalog nije mogao odgovoriti na pitanje: { $said }
core-lookup-no-reason = razlog nije naveden
core-lookup-catalogue-unreadable = odgovor nije bilo moguće pročitati
core-lookup-not-a-catalogue = odgovor nije bio odgovor kataloga
core-lookup-pubmed-book = { $service } ovo vodi kao knjigu ili dio knjige, što se iz njega još ne može pročitati
core-lookup-wrong-form = { $host } ne daje zapis u traženom obliku
core-lookup-not-a-record = { $service }: odgovor nije bio zapis koji se može pročitati.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Ovaj je preprint u međuvremenu objavljen. Uneseni DOI je DOI objavljene verzije: dohvatite { $doi } da umjesto toga citirate nju.
core-lookup-arxiv-published = Ovaj je preprint u međuvremenu objavljen: { $journal }.
core-lookup-arxiv-year-only = Ovdje je navedena samo godina. Dohvat arXiv:{ $id } daje dan kad je preprint poslan.
core-lookup-crossref-in-book = Pretraga ne daje urednike ni ISBN knjige. Dohvat po DOI-ju daje.
core-lookup-book-unreadable = Ono što Crossref ima o knjizi nije bilo moguće pročitati: možda nedostaju njeni urednici.
core-lookup-book-not-fetched = Ono što Crossref ima o knjizi nije bilo moguće dohvatiti: možda nedostaju njeni urednici.
core-lookup-chapter-author = Crossref ne navodi autora poglavlja. Kao njegov autor unesen je autor knjige.
core-lookup-group-name = „{ $name }“ bilo je navedeno kao ime osobe, „{ $family }, { $given }“, a uzeto je kao naziv grupe.
core-lookup-kind-none = Zapis vrstu publikacije ne naziva nikako. Unesena je kao „misc“: odaberite pravu vrstu.
core-lookup-kind = Zapis vrstu publikacije naziva „{ $kind }“. Unesena je kao „misc“: odaberite pravu vrstu.
core-lookup-publisher-capitals = Izdavač je bio napisan velikim slovima, „{ $publisher }“, i zapisan je kao „{ $mended }“.
core-lookup-no-creators = Zapis ne navodi ni autora ni urednika.
core-lookup-title-capitals = Naslov je bio napisan velikim slovima i prebačen je u mala: provjerite imaju li imena svoja velika slova.
core-lookup-name-capitals = Ime „{ $family }“ bilo je napisano velikim slovima i zapisano je kao „{ $mended }“.
core-lookup-pubmed-translated = PubMed prevodi naslov na engleski kao „{ $title }“.
core-lookup-pubmed-translation = Naslov je PubMedov prijevod na engleski. Naslov na jeziku članka nije naveden.
core-lookup-parallel-title = Zapis daje naslov i na drugom jeziku, koji nije unesen: „{ $title }“.
core-lookup-original-script = Naslov je unesen onako kako ga katalog piše latinicom. U vlastitom pismu glasi „{ $title }“.
core-lookup-unplaced-name = Zapis navodi { $name } ne kazujući kao šta. Ime nije uneseno.
core-lookup-thesis = Knjiga je ujedno i disertacija: { $said }.
core-lookup-ebook = Zapis e-knjige: mjesto, izdavač i godina su oni elektronskog izdanja.
core-lookup-sound = Zvučni zapis.
core-lookup-audio-book = Zapis audio-knjige.
core-lookup-not-text = Zapis nije zapis teksta. Unesen je kako se moglo: odaberite pravu vrstu.
core-lookup-other-form = Traženi ISBN je ISBN drugog oblika knjige. ISBN onoga što ovaj zapis opisuje je { $isbn }.
core-lookup-other-isbn = Zapis nema traženi ISBN. ISBN onoga što opisuje je { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = nijedan
core-lookup-another-edition = Drugo izdanje s istim ISBN-om ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = izdanje { $edition }, { $year }
core-lookup-without-year = bez godine
