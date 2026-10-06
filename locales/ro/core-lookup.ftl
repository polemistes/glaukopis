# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = „{ $doi }” nu este un DOI.
core-lookup-not-arxiv = „{ $id }” nu este un identificator arXiv.
core-lookup-not-pubmed = „{ $id }” nu este un număr PubMed.
core-lookup-isbn-length = „{ $isbn }” nu este un ISBN: un ISBN are 10 sau 13 cifre, iar acesta are { $count }.
core-lookup-isbn-check = „{ $isbn }” nu este un ISBN: ultima lui cifră se socotește din celelalte și nu se potrivește cu ele. Este o cifră greșită?
core-lookup-not-isbn = „{ $isbn }” nu este un ISBN.
core-lookup-address = O adresă poate fi căutată când cuprinde un DOI, un identificator arXiv sau un număr PubMed. Aceasta nu cuprinde: căutați titlul în schimb.
core-lookup-nothing = Nu este nimic de căutat.

## The services, and what they ask to have said of them.

core-lookup-sikt = Bibliotecile academice norvegiene (Sikt)
core-lookup-thanks-arxiv = Mulțumim arXiv pentru folosirea interoperabilității sale cu acces deschis.
core-lookup-thanks-sikt = Cuprinde înregistrări din catalogul de bibliotecă al Sikt, puse la dispoziție sub Licența norvegiană pentru date guvernamentale deschise (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, pentru carte

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } a răspuns cu ceva ce nu s-a putut citi
core-lookup-not-preprints = { $service } a răspuns cu ceva ce nu este o listă de preprinturi
core-lookup-not-articles = { $service } a răspuns cu ceva ce nu este o listă de articole
core-lookup-could-not-answer = { $service } nu a putut răspunde la întrebare: { $said }
core-lookup-catalogue-could-not-answer = catalogul nu a putut răspunde la întrebare: { $said }
core-lookup-no-reason = fără motiv
core-lookup-catalogue-unreadable = răspunsul nu s-a putut citi
core-lookup-not-a-catalogue = răspunsul nu a fost al unui catalog
core-lookup-pubmed-book = { $service } are aceasta ca o carte sau ca o parte a uneia, ceea ce nu se poate citi încă de acolo
core-lookup-wrong-form = { $host } nu dă înregistrarea în forma cerută
core-lookup-not-a-record = { $service }: răspunsul nu a fost o înregistrare care să se poată citi.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Acest preprint a fost publicat între timp. DOI-ul introdus este al versiunii publicate: căutați { $doi } ca să o citați pe aceea în schimb.
core-lookup-arxiv-published = Acest preprint a fost publicat între timp: { $journal }.
core-lookup-arxiv-year-only = Aici este dat numai anul. Căutarea arXiv:{ $id } dă ziua în care a fost trimis preprintul.
core-lookup-crossref-in-book = O căutare nu dă editorii și ISBN-ul cărții. Căutarea după DOI le dă.
core-lookup-book-unreadable = Ce are Crossref despre carte nu s-a putut citi: editorii ei pot lipsi.
core-lookup-book-not-fetched = Ce are Crossref despre carte nu s-a putut lua: editorii ei pot lipsi.
core-lookup-chapter-author = Crossref nu numește niciun autor pentru capitol. Autorul cărții a fost introdus ca autor al lui.
core-lookup-group-name = „{ $name }” a fost dat ca numele unei persoane, „{ $family }, { $given }”, și a fost luat ca numele unui grup.
core-lookup-kind-none = Înregistrarea nu numește în niciun fel tipul publicației. A fost introdusă ca „misc”: alegeți tipul potrivit.
core-lookup-kind = Înregistrarea numește tipul publicației „{ $kind }”. A fost introdusă ca „misc”: alegeți tipul potrivit.
core-lookup-publisher-capitals = Editura era cu majuscule, „{ $publisher }”, și a fost scrisă „{ $mended }”.
core-lookup-no-creators = Înregistrarea nu numește niciun autor sau editor.
core-lookup-title-capitals = Titlul era cu majuscule și a fost trecut cu litere mici: vedeți ca numele să-și aibă majusculele.
core-lookup-name-capitals = Numele „{ $family }” era cu majuscule și a fost scris „{ $mended }”.
core-lookup-pubmed-translated = PubMed traduce titlul în engleză ca „{ $title }”.
core-lookup-pubmed-translation = Titlul este traducerea în engleză făcută de PubMed. Titlul în limba articolului nu este dat.
core-lookup-parallel-title = Înregistrarea dă titlul și într-o altă limbă, care nu a fost introdus: „{ $title }”.
core-lookup-original-script = Titlul este introdus așa cum îl scrie catalogul cu litere latine. În scrierea lui proprie este „{ $title }”.
core-lookup-unplaced-name = Înregistrarea îl numește pe { $name } fără să spună în ce calitate. Numele nu a fost introdus.
core-lookup-thesis = Cartea este și o teză: { $said }.
core-lookup-ebook = O înregistrare de carte electronică: locul, editura și anul sunt cele ale ediției electronice.
core-lookup-sound = O înregistrare sonoră.
core-lookup-audio-book = O înregistrare a unei cărți audio.
core-lookup-not-text = Înregistrarea nu este a unui text. A fost introdusă cum s-a putut: alegeți tipul potrivit.
core-lookup-other-form = ISBN-ul cerut este al unei alte forme a cărții. ISBN-ul a ceea ce descrie această înregistrare este { $isbn }.
core-lookup-other-isbn = Înregistrarea nu are ISBN-ul cerut. ISBN-ul a ceea ce descrie este { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = niciunul
core-lookup-another-edition = O altă ediție cu același ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = ediția { $edition }, { $year }
core-lookup-without-year = fără an
