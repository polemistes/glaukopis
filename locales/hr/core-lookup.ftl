# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = „{ $doi }” nije DOI.
core-lookup-not-arxiv = „{ $id }” nije identifikator arXiva.
core-lookup-not-pubmed = „{ $id }” nije broj PubMeda.
core-lookup-isbn-length = „{ $isbn }” nije ISBN: ISBN ima 10 ili 13 znamenki, a ovaj ih ima { $count }.
core-lookup-isbn-check = „{ $isbn }” nije ISBN: njegova se posljednja znamenka računa iz ostalih, a s njima se ne slaže. Je li koja znamenka krivo utipkana?
core-lookup-not-isbn = „{ $isbn }” nije ISBN.
core-lookup-address = Adresa se može dohvatiti kad sadrži DOI, identifikator arXiva ili broj PubMeda. Ova ne sadrži: potražite radije naslov.
core-lookup-nothing = Nema se što tražiti.

## The services, and what they ask to have said of them.

core-lookup-sikt = Norveške akademske knjižnice (Sikt)
core-lookup-thanks-arxiv = Zahvaljujemo arXivu na korištenju njegove interoperabilnosti otvorenog pristupa.
core-lookup-thanks-sikt = Sadrži zapise iz knjižničnog kataloga Sikta, dostupne pod Norveškom licencijom za otvorene podatke javne uprave (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, za knjigu

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } je odgovorio nečim što se ne može pročitati
core-lookup-not-preprints = { $service } je odgovorio nečim što nije popis preprinta
core-lookup-not-articles = { $service } je odgovorio nečim što nije popis članaka
core-lookup-could-not-answer = { $service } nije mogao odgovoriti na upit: { $said }
core-lookup-catalogue-could-not-answer = katalog nije mogao odgovoriti na upit: { $said }
core-lookup-no-reason = razlog nije naveden
core-lookup-catalogue-unreadable = odgovor se ne može pročitati
core-lookup-not-a-catalogue = odgovor nije bio odgovor kataloga
core-lookup-pubmed-book = { $service } ovo vodi kao knjigu ili dio knjige, što se iz njega još ne može pročitati
core-lookup-wrong-form = { $host } ne daje zapis u traženom obliku
core-lookup-not-a-record = { $service }: odgovor nije bio zapis koji se može pročitati.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Ovaj je preprint u međuvremenu objavljen. Uneseni DOI pripada objavljenoj inačici: dohvatite { $doi } da biste citirali nju.
core-lookup-arxiv-published = Ovaj je preprint u međuvremenu objavljen: { $journal }.
core-lookup-arxiv-year-only = Ovdje je navedena samo godina. Dohvat arXiv:{ $id } daje dan kad je preprint poslan.
core-lookup-crossref-in-book = Pretraga ne daje urednike ni ISBN knjige. Dohvat prema DOI-ju daje.
core-lookup-book-unreadable = Što Crossref ima o knjizi nije bilo moguće pročitati: možda nedostaju njezini urednici.
core-lookup-book-not-fetched = Što Crossref ima o knjizi nije bilo moguće dohvatiti: možda nedostaju njezini urednici.
core-lookup-chapter-author = Crossref ne navodi autora poglavlja. Kao njegov autor unesen je autor knjige.
core-lookup-group-name = „{ $name }” bilo je navedeno kao ime osobe, „{ $family }, { $given }”, a uzeto je kao naziv skupine.
core-lookup-kind-none = Zapis vrstu publikacije nikako ne imenuje. Unesena je kao „misc”: odaberite pravu vrstu.
core-lookup-kind = Zapis vrstu publikacije zove „{ $kind }”. Unesena je kao „misc”: odaberite pravu vrstu.
core-lookup-publisher-capitals = Nakladnik je bio napisan velikim slovima, „{ $publisher }”, i napisan je kao „{ $mended }”.
core-lookup-no-creators = Zapis ne navodi ni autora ni urednika.
core-lookup-title-capitals = Naslov je bio napisan velikim slovima i prebačen je u mala: provjerite imaju li imena velika početna slova.
core-lookup-name-capitals = Prezime „{ $family }” bilo je napisano velikim slovima i napisano je kao „{ $mended }”.
core-lookup-pubmed-translated = PubMed prevodi naslov na engleski kao „{ $title }”.
core-lookup-pubmed-translation = Naslov je PubMedov prijevod na engleski. Naslov na jeziku članka nije naveden.
core-lookup-parallel-title = Zapis daje naslov i na drugom jeziku, koji nije unesen: „{ $title }”.
core-lookup-original-script = Naslov je unesen kako ga katalog piše latinicom. U vlastitom pismu glasi „{ $title }”.
core-lookup-unplaced-name = Zapis navodi { $name }, a ne kaže u kojoj ulozi. Ime nije uneseno.
core-lookup-thesis = Knjiga je ujedno i disertacija ili sličan rad: { $said }.
core-lookup-ebook = Zapis e-knjige: mjesto, nakladnik i godina pripadaju elektroničkom izdanju.
core-lookup-sound = Zvučni zapis.
core-lookup-audio-book = Zapis zvučne knjige.
core-lookup-not-text = Zapis nije zapis teksta. Unesen je kako se moglo: odaberite pravu vrstu.
core-lookup-other-form = Traženi ISBN pripada drugom obliku knjige. ISBN onoga što ovaj zapis opisuje: { $isbn }.
core-lookup-other-isbn = Zapis nema traženi ISBN. ISBN onoga što opisuje: { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = nema ga
core-lookup-another-edition = Drugo izdanje s istim ISBN-om ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = izdanje { $edition }, { $year }
core-lookup-without-year = bez godine
