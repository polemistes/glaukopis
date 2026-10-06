# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = „{ $doi }“ není DOI.
core-lookup-not-arxiv = „{ $id }“ není identifikátor arXivu.
core-lookup-not-pubmed = „{ $id }“ není číslo PubMedu.
core-lookup-isbn-length = „{ $isbn }“ není ISBN: ISBN má 10 nebo 13 číslic, toto jich má { $count }.
core-lookup-isbn-check = „{ $isbn }“ není ISBN: jeho poslední číslice se počítá z ostatních a s nimi nesouhlasí. Není některá číslice přepsaná?
core-lookup-not-isbn = „{ $isbn }“ není ISBN.
core-lookup-address = Adresu lze dohledat, pokud obsahuje DOI, identifikátor arXivu nebo číslo PubMedu. Tato žádné neobsahuje: hledejte raději podle názvu.
core-lookup-nothing = Není co hledat.

## The services, and what they ask to have said of them.

core-lookup-sikt = Norské akademické knihovny (Sikt)
core-lookup-thanks-arxiv = Děkujeme arXivu za možnost využívat jeho otevřené rozhraní.
core-lookup-thanks-sikt = Obsahuje záznamy z knihovního katalogu Sikt, zpřístupněné pod norskou licencí pro otevřená data veřejné správy (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, pro knihu

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = služba { $service } odpověděla něčím, co nelze přečíst
core-lookup-not-preprints = služba { $service } odpověděla něčím, co není seznam preprintů
core-lookup-not-articles = služba { $service } odpověděla něčím, co není seznam článků
core-lookup-could-not-answer = služba { $service } nedokázala na dotaz odpovědět: { $said }
core-lookup-catalogue-could-not-answer = katalog nedokázal na dotaz odpovědět: { $said }
core-lookup-no-reason = bez udání důvodu
core-lookup-catalogue-unreadable = odpověď nelze přečíst
core-lookup-not-a-catalogue = odpověď nebyla odpovědí katalogu
core-lookup-pubmed-book = služba { $service } to vede jako knihu nebo její část, což z ní zatím nelze přečíst
core-lookup-wrong-form = { $host } nedává záznam v podobě, o niž bylo žádáno
core-lookup-not-a-record = { $service }: odpověď nebyla záznam, který by šel přečíst.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Tento preprint byl mezitím publikován. Zadané DOI patří publikované verzi: chcete-li citovat tu, dohledejte { $doi }.
core-lookup-arxiv-published = Tento preprint byl mezitím publikován: { $journal }.
core-lookup-arxiv-year-only = Je tu uveden jen rok. Dohledání arXiv:{ $id } dá den, kdy byl preprint odeslán.
core-lookup-crossref-in-book = Hledání nedá editory a ISBN knihy. Dohledání podle DOI ano.
core-lookup-book-unreadable = Co má Crossref o knize, nelze přečíst: její editoři mohou chybět.
core-lookup-book-not-fetched = Co má Crossref o knize, se nepodařilo stáhnout: její editoři mohou chybět.
core-lookup-chapter-author = Crossref u kapitoly neuvádí autora. Jako její autor byl zapsán autor knihy.
core-lookup-group-name = „{ $name }“ bylo uvedeno jako jméno osoby, „{ $family }, { $given }“, a bylo vzato jako název skupiny.
core-lookup-kind-none = Záznam druh publikace nijak nenazývá. Byl zapsán jako „misc“: zvolte správný typ.
core-lookup-kind = Záznam nazývá druh publikace „{ $kind }“. Byl zapsán jako „misc“: zvolte správný typ.
core-lookup-publisher-capitals = Nakladatel byl velkými písmeny, „{ $publisher }“, a byl zapsán jako „{ $mended }“.
core-lookup-no-creators = Záznam neuvádí žádného autora ani editora.
core-lookup-title-capitals = Název byl velkými písmeny a byl převeden na malá: dohlédněte, aby jména měla velká písmena.
core-lookup-name-capitals = Jméno „{ $family }“ bylo velkými písmeny a bylo zapsáno jako „{ $mended }“.
core-lookup-pubmed-translated = PubMed překládá název do angličtiny jako „{ $title }“.
core-lookup-pubmed-translation = Název je překlad PubMedu do angličtiny. Název v jazyce článku není uveden.
core-lookup-parallel-title = Záznam uvádí název i v jiném jazyce, který nebyl zapsán: „{ $title }“.
core-lookup-original-script = Název je zapsán tak, jak jej katalog píše latinkou. Ve vlastním písmu zní „{ $title }“.
core-lookup-unplaced-name = Záznam uvádí jméno { $name }, aniž říká, v jaké roli. Jméno nebylo zapsáno.
core-lookup-thesis = Kniha je zároveň kvalifikační prací: { $said }.
core-lookup-ebook = Záznam e-knihy: místo, nakladatel a rok jsou ty elektronického vydání.
core-lookup-sound = Zvuková nahrávka.
core-lookup-audio-book = Záznam audioknihy.
core-lookup-not-text = Záznam nepopisuje text. Byl zapsán, jak to šlo: zvolte správný typ.
core-lookup-other-form = Hledané ISBN patří jiné podobě knihy. ISBN toho, co tento záznam popisuje, je { $isbn }.
core-lookup-other-isbn = Záznam nemá hledané ISBN. ISBN toho, co popisuje, je { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = žádné
core-lookup-another-edition = Jiné vydání se stejným ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = vydání { $edition }, { $year }
core-lookup-without-year = bez roku
