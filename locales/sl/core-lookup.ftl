# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = »{ $doi }« ni DOI.
core-lookup-not-arxiv = »{ $id }« ni identifikator arXiva.
core-lookup-not-pubmed = »{ $id }« ni številka PubMeda.
core-lookup-isbn-length = »{ $isbn }« ni ISBN: ISBN ima 10 ali 13 števk, ta pa jih ima { $count }.
core-lookup-isbn-check = »{ $isbn }« ni ISBN: zadnja števka se izračuna iz drugih in se z njimi ne ujema. Je katera števka napačno vtipkana?
core-lookup-not-isbn = »{ $isbn }« ni ISBN.
core-lookup-address = Naslov je mogoče poiskati, kadar vsebuje DOI, identifikator arXiva ali številko PubMeda. Ta ga ne vsebuje: raje poiščite po naslovu dela.
core-lookup-nothing = Ni česa iskati.

## The services, and what they ask to have said of them.

core-lookup-sikt = Norveške akademske knjižnice (Sikt)
core-lookup-thanks-arxiv = Hvala arXivu za uporabo njegove odprte interoperabilnosti.
core-lookup-thanks-sikt = Vsebuje zapise iz knjižničnega kataloga Sikt, dostopne pod norveško licenco za odprte podatke javne uprave (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, za knjigo

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } je odgovoril z nečim, česar ni bilo mogoče prebrati
core-lookup-not-preprints = { $service } je odgovoril z nečim, kar ni seznam predobjav
core-lookup-not-articles = { $service } je odgovoril z nečim, kar ni seznam člankov
core-lookup-could-not-answer = { $service } ni mogel odgovoriti na vprašanje: { $said }
core-lookup-catalogue-could-not-answer = katalog ni mogel odgovoriti na vprašanje: { $said }
core-lookup-no-reason = razlog ni naveden
core-lookup-catalogue-unreadable = odgovora ni bilo mogoče prebrati
core-lookup-not-a-catalogue = odgovor ni bil odgovor kataloga
core-lookup-pubmed-book = { $service } ima to kot knjigo ali njen del, česar od njega še ni mogoče prebrati
core-lookup-wrong-form = { $host } ne daje zapisa v zahtevani obliki
core-lookup-not-a-record = { $service }: odgovor ni bil zapis, ki bi ga bilo mogoče prebrati.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Ta predobjava je bila medtem objavljena. Vneseni DOI je DOI objavljene različice: poiščite { $doi } in raje navedite tisto.
core-lookup-arxiv-published = Ta predobjava je bila medtem objavljena: { $journal }.
core-lookup-arxiv-year-only = Tu je podano le leto. Poizvedba po arXiv:{ $id } da dan, ko je bila predobjava poslana.
core-lookup-crossref-in-book = Iskanje ne da urednikov in ISBN knjige. Poizvedba po DOI jih da.
core-lookup-book-unreadable = Tega, kar ima Crossref o knjigi, ni bilo mogoče prebrati: njeni uredniki morda manjkajo.
core-lookup-book-not-fetched = Tega, kar ima Crossref o knjigi, ni bilo mogoče pridobiti: njeni uredniki morda manjkajo.
core-lookup-chapter-author = Crossref ne navaja avtorja poglavja. Kot njegov avtor je vpisan avtor knjige.
core-lookup-group-name = »{ $name }« je bilo podano kot ime osebe, »{ $family }, { $given }«, in je vzeto kot ime skupine.
core-lookup-kind-none = Zapis ne pove tipa publikacije. Vpisan je kot »misc«: izberite pravi tip.
core-lookup-kind = Zapis imenuje tip publikacije »{ $kind }«. Vpisan je kot »misc«: izberite pravi tip.
core-lookup-publisher-capitals = Založnik je bil z velikimi črkami, »{ $publisher }«, in je zapisan »{ $mended }«.
core-lookup-no-creators = Zapis ne navaja avtorja ali urednika.
core-lookup-title-capitals = Naslov je bil z velikimi črkami in je prepisan z malimi: preverite, da imajo imena velike začetnice.
core-lookup-name-capitals = Ime »{ $family }« je bilo z velikimi črkami in je zapisano »{ $mended }«.
core-lookup-pubmed-translated = PubMed prevaja naslov v angleščino kot »{ $title }«.
core-lookup-pubmed-translation = Naslov je PubMedov prevod v angleščino. Naslov v jeziku članka ni podan.
core-lookup-parallel-title = Zapis daje naslov tudi v drugem jeziku, ki ni vpisan: »{ $title }«.
core-lookup-original-script = Naslov je vpisan, kakor ga katalog piše v latinici. V lastni pisavi je »{ $title }«.
core-lookup-unplaced-name = Zapis imenuje { $name }, ne da bi povedal, v kakšni vlogi. Ime ni vpisano.
core-lookup-thesis = Knjiga je tudi disertacija ali drugo zaključno delo: { $said }.
core-lookup-ebook = Zapis e-knjige: kraj, založnik in leto so tisti elektronske izdaje.
core-lookup-sound = Zvočni posnetek.
core-lookup-audio-book = Zapis zvočne knjige.
core-lookup-not-text = Zapis ni zapis besedila. Vpisan je, kakor je bilo mogoče: izberite pravi tip.
core-lookup-other-form = Iskani ISBN je ISBN druge oblike knjige. ISBN tega, kar ta zapis opisuje: { $isbn }.
core-lookup-other-isbn = Zapis nima iskanega ISBN. ISBN tega, kar opisuje: { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = nobeden
core-lookup-another-edition = Druga izdaja z istim ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = izdaja { $edition }, { $year }
core-lookup-without-year = brez leta
