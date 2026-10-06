# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = „{ $doi }“ nie je DOI.
core-lookup-not-arxiv = „{ $id }“ nie je identifikátor arXivu.
core-lookup-not-pubmed = „{ $id }“ nie je číslo PubMedu.
core-lookup-isbn-length = „{ $isbn }“ nie je ISBN: ISBN má 10 alebo 13 číslic a toto ich má { $count }.
core-lookup-isbn-check = „{ $isbn }“ nie je ISBN: jeho posledná číslica sa počíta z ostatných a s nimi sa nezhoduje. Nie je niektorá číslica preklepnutá?
core-lookup-not-isbn = „{ $isbn }“ nie je ISBN.
core-lookup-address = Adresu možno dohľadať, keď obsahuje DOI, identifikátor arXivu alebo číslo PubMedu. Táto neobsahuje: hľadajte radšej podľa názvu.
core-lookup-nothing = Nie je čo hľadať.

## The services, and what they ask to have said of them.

core-lookup-sikt = Nórske akademické knižnice (Sikt)
core-lookup-thanks-arxiv = Ďakujeme arXivu za možnosť využívať jeho otvorené rozhranie.
core-lookup-thanks-sikt = Obsahuje záznamy z knižničného katalógu Sikt, sprístupnené pod nórskou licenciou pre otvorené vládne dáta (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, pre knihu

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } odpovedal niečím, čo sa nedalo prečítať
core-lookup-not-preprints = { $service } odpovedal niečím, čo nie je zoznam preprintov
core-lookup-not-articles = { $service } odpovedal niečím, čo nie je zoznam článkov
core-lookup-could-not-answer = { $service } nedokázal na otázku odpovedať: { $said }
core-lookup-catalogue-could-not-answer = katalóg nedokázal na otázku odpovedať: { $said }
core-lookup-no-reason = bez udania dôvodu
core-lookup-catalogue-unreadable = odpoveď sa nedala prečítať
core-lookup-not-a-catalogue = odpoveď nebola odpoveďou katalógu
core-lookup-pubmed-book = { $service } to má ako knihu alebo jej časť, čo sa z neho zatiaľ nedá prečítať
core-lookup-wrong-form = { $host } nedáva záznam v požadovanej podobe
core-lookup-not-a-record = { $service }: odpoveď nebola záznam, ktorý by sa dal prečítať.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Tento preprint bol medzitým publikovaný. Zadané DOI je DOI publikovanej verzie: dohľadajte { $doi } a citujte radšej tú.
core-lookup-arxiv-published = Tento preprint bol medzitým publikovaný: { $journal }.
core-lookup-arxiv-year-only = Tu je uvedený len rok. Dohľadanie arXiv:{ $id } dá deň, keď bol preprint odoslaný.
core-lookup-crossref-in-book = Hľadanie nedáva editorov a ISBN knihy. Dohľadanie podľa DOI áno.
core-lookup-book-unreadable = Čo má Crossref o knihe, sa nedalo prečítať: môžu chýbať jej editori.
core-lookup-book-not-fetched = Čo má Crossref o knihe, sa nepodarilo stiahnuť: môžu chýbať jej editori.
core-lookup-chapter-author = Crossref neuvádza autora kapitoly. Ako jej autor bol zapísaný autor knihy.
core-lookup-group-name = „{ $name }“ bolo uvedené ako meno osoby, „{ $family }, { $given }“, a bolo vzaté ako názov skupiny.
core-lookup-kind-none = Záznam druh publikácie nijako nenazýva. Bol zapísaný ako „misc“: zvoľte správny typ.
core-lookup-kind = Záznam nazýva druh publikácie „{ $kind }“. Bol zapísaný ako „misc“: zvoľte správny typ.
core-lookup-publisher-capitals = Vydavateľ bol veľkými písmenami, „{ $publisher }“, a bol zapísaný ako „{ $mended }“.
core-lookup-no-creators = Záznam neuvádza autora ani editora.
core-lookup-title-capitals = Názov bol veľkými písmenami a bol prepísaný malými: skontrolujte, či majú mená veľké začiatočné písmená.
core-lookup-name-capitals = Meno „{ $family }“ bolo veľkými písmenami a bolo zapísané ako „{ $mended }“.
core-lookup-pubmed-translated = PubMed prekladá názov do angličtiny ako „{ $title }“.
core-lookup-pubmed-translation = Názov je preklad PubMedu do angličtiny. Názov v jazyku článku nie je uvedený.
core-lookup-parallel-title = Záznam uvádza názov aj v inom jazyku, ktorý nebol zapísaný: „{ $title }“.
core-lookup-original-script = Názov je zapísaný tak, ako ho katalóg píše latinkou. V jeho vlastnom písme znie „{ $title }“.
core-lookup-unplaced-name = Záznam uvádza { $name } bez toho, aby povedal, v akej úlohe. Meno nebolo zapísané.
core-lookup-thesis = Kniha je zároveň kvalifikačná práca: { $said }.
core-lookup-ebook = Záznam e-knihy: miesto, vydavateľ a rok sú tie elektronického vydania.
core-lookup-sound = Zvuková nahrávka.
core-lookup-audio-book = Záznam audioknihy.
core-lookup-not-text = Záznam nie je o texte. Bol zapísaný, ako sa dalo: zvoľte správny typ.
core-lookup-other-form = Požadované ISBN je ISBN inej podoby knihy. ISBN toho, čo tento záznam opisuje, je { $isbn }.
core-lookup-other-isbn = Záznam nemá požadované ISBN. ISBN toho, čo opisuje, je { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = žiadne
core-lookup-another-edition = Iné vydanie s tým istým ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = vydanie { $edition }, { $year }
core-lookup-without-year = bez roku
