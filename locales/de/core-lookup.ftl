# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = „{ $doi }“ ist keine DOI.
core-lookup-not-arxiv = „{ $id }“ ist keine Kennung von arXiv.
core-lookup-not-pubmed = „{ $id }“ ist keine Nummer von PubMed.
core-lookup-isbn-length = „{ $isbn }“ ist keine ISBN: eine ISBN hat 10 oder 13 Ziffern, diese hat { $count }.
core-lookup-isbn-check = „{ $isbn }“ ist keine ISBN: ihre letzte Ziffer wird aus den anderen errechnet und stimmt nicht mit ihnen überein. Ist eine Ziffer vertippt?
core-lookup-not-isbn = „{ $isbn }“ ist keine ISBN.
core-lookup-address = Eine Adresse kann nachgeschlagen werden, wenn sie eine DOI, eine Kennung von arXiv oder eine Nummer von PubMed enthält. Diese tut es nicht: suchen Sie stattdessen nach dem Titel.
core-lookup-nothing = Es gibt nichts zu suchen.

## The services, and what they ask to have said of them.

core-lookup-sikt = Norwegische wissenschaftliche Bibliotheken (Sikt)
core-lookup-thanks-arxiv = Dank an arXiv für die Nutzung seiner Open-Access-Interoperabilität.
core-lookup-thanks-sikt = Enthält Datensätze aus dem Bibliothekskatalog von Sikt, bereitgestellt unter der Norwegischen Lizenz für offene Verwaltungsdaten (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, für das Buch

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } hat mit etwas geantwortet, das nicht gelesen werden konnte
core-lookup-not-preprints = { $service } hat mit etwas geantwortet, das keine Liste von Preprints ist
core-lookup-not-articles = { $service } hat mit etwas geantwortet, das keine Liste von Artikeln ist
core-lookup-could-not-answer = { $service } konnte die Frage nicht beantworten: { $said }
core-lookup-catalogue-could-not-answer = der Katalog konnte die Frage nicht beantworten: { $said }
core-lookup-no-reason = kein Grund genannt
core-lookup-catalogue-unreadable = die Antwort konnte nicht gelesen werden
core-lookup-not-a-catalogue = die Antwort war nicht die eines Katalogs
core-lookup-pubmed-book = { $service } führt dies als Buch oder Teil eines Buches, was von dort noch nicht gelesen werden kann
core-lookup-wrong-form = { $host } gibt den Datensatz nicht in der verlangten Form
core-lookup-not-a-record = { $service }: die Antwort war kein Datensatz, der gelesen werden konnte.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Dieser Preprint ist inzwischen veröffentlicht. Die eingetragene DOI ist die der veröffentlichten Fassung: schlagen Sie { $doi } nach, um stattdessen diese zu zitieren.
core-lookup-arxiv-published = Dieser Preprint ist inzwischen veröffentlicht: { $journal }.
core-lookup-arxiv-year-only = Hier ist nur das Jahr angegeben. Das Nachschlagen von arXiv:{ $id } gibt den Tag, an dem der Preprint eingereicht wurde.
core-lookup-crossref-in-book = Eine Suche gibt die Herausgeber und die ISBN des Buches nicht. Das Nachschlagen der DOI tut es.
core-lookup-book-unreadable = Was Crossref über das Buch hat, konnte nicht gelesen werden: seine Herausgeber fehlen vielleicht.
core-lookup-book-not-fetched = Was Crossref über das Buch hat, konnte nicht geholt werden: seine Herausgeber fehlen vielleicht.
core-lookup-chapter-author = Crossref nennt keinen Autor für das Kapitel. Der Autor des Buches wurde als sein Autor eingetragen.
core-lookup-group-name = „{ $name }“ war als Name einer Person angegeben, „{ $family }, { $given }“, und wurde als Name einer Gruppe genommen.
core-lookup-kind-none = Der Datensatz nennt die Art der Veröffentlichung nicht. Sie wurde als „misc“ eingetragen: wählen Sie den richtigen Typ.
core-lookup-kind = Der Datensatz nennt die Art der Veröffentlichung „{ $kind }“. Sie wurde als „misc“ eingetragen: wählen Sie den richtigen Typ.
core-lookup-publisher-capitals = Der Verlag stand in Großbuchstaben, „{ $publisher }“, und wurde „{ $mended }“ geschrieben.
core-lookup-no-creators = Der Datensatz nennt keinen Autor und keinen Herausgeber.
core-lookup-title-capitals = Der Titel stand in Großbuchstaben und wurde kleingeschrieben: sehen Sie nach, dass Namen ihre großen Anfangsbuchstaben haben.
core-lookup-name-capitals = Der Name „{ $family }“ stand in Großbuchstaben und wurde „{ $mended }“ geschrieben.
core-lookup-pubmed-translated = PubMed übersetzt den Titel ins Englische als „{ $title }“.
core-lookup-pubmed-translation = Der Titel ist PubMeds Übersetzung ins Englische. Der Titel in der Sprache des Artikels ist nicht angegeben.
core-lookup-parallel-title = Der Datensatz gibt den Titel auch in einer anderen Sprache, die nicht eingetragen wurde: „{ $title }“.
core-lookup-original-script = Der Titel ist eingetragen, wie der Katalog ihn in lateinischen Buchstaben schreibt. In seiner eigenen Schrift lautet er „{ $title }“.
core-lookup-unplaced-name = Der Datensatz nennt { $name }, ohne zu sagen, als was. Der Name wurde nicht eingetragen.
core-lookup-thesis = Das Buch ist auch eine Hochschulschrift: { $said }.
core-lookup-ebook = Ein Datensatz eines E-Books: Ort, Verlag und Jahr sind die der elektronischen Ausgabe.
core-lookup-sound = Eine Tonaufnahme.
core-lookup-audio-book = Ein Datensatz eines Hörbuchs.
core-lookup-not-text = Der Datensatz ist nicht der eines Textes. Er wurde eingetragen, so gut es ging: wählen Sie den richtigen Typ.
core-lookup-other-form = Die gesuchte ISBN ist die einer anderen Form des Buches. Die ISBN dessen, was dieser Datensatz beschreibt, ist { $isbn }.
core-lookup-other-isbn = Der Datensatz hat die gesuchte ISBN nicht. Die ISBN dessen, was er beschreibt, ist { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = keine
core-lookup-another-edition = Eine andere Auflage mit derselben ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = Auflage { $edition }, { $year }
core-lookup-without-year = ohne Jahr
