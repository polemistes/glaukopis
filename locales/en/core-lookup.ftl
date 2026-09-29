# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = “{ $doi }” is not a DOI.
core-lookup-not-arxiv = “{ $id }” is not an identifier of arXiv.
core-lookup-not-pubmed = “{ $id }” is not a number of PubMed.
core-lookup-isbn-length = “{ $isbn }” is not an ISBN: an ISBN has 10 or 13 digits, and this has { $count }.
core-lookup-isbn-check = “{ $isbn }” is not an ISBN: its last digit is reckoned from the others, and does not agree with them. Is a digit mistyped?
core-lookup-not-isbn = “{ $isbn }” is not an ISBN.
core-lookup-address = An address can be looked up when it holds a DOI, an identifier of arXiv or a number of PubMed. This one does not: search for the title instead.
core-lookup-nothing = There is nothing to look for.

## The services, and what they ask to have said of them.

core-lookup-sikt = Norwegian academic libraries (Sikt)
core-lookup-thanks-arxiv = Thank you to arXiv for use of its open access interoperability.
core-lookup-thanks-sikt = Contains records from the library catalogue of Sikt, made available under the Norwegian Licence for Open Government Data (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, for the book

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } answered with something that could not be read
core-lookup-not-preprints = { $service } answered with something that is not a list of preprints
core-lookup-not-articles = { $service } answered with something that is not a list of articles
core-lookup-could-not-answer = { $service } could not answer the question: { $said }
core-lookup-catalogue-could-not-answer = the catalogue could not answer the question: { $said }
core-lookup-no-reason = no reason given
core-lookup-catalogue-unreadable = the answer could not be read
core-lookup-not-a-catalogue = the answer was not that of a catalogue
core-lookup-pubmed-book = { $service } has this as a book or a part of one, which cannot be read from it yet
core-lookup-wrong-form = { $host } does not give the record in the form asked for
core-lookup-not-a-record = { $service }: the answer was not a record that could be read.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = This preprint has since been published. The DOI entered is that of the published version: look up { $doi } to cite that instead.
core-lookup-arxiv-published = This preprint has since been published: { $journal }.
core-lookup-arxiv-year-only = Only the year is given here. Looking up arXiv:{ $id } gives the day the preprint was sent in.
core-lookup-crossref-in-book = A search does not give the editors and the ISBN of the book. Looking up the DOI does.
core-lookup-book-unreadable = What Crossref has about the book could not be read: its editors may be missing.
core-lookup-book-not-fetched = What Crossref has about the book could not be fetched: its editors may be missing.
core-lookup-chapter-author = Crossref names no author for the chapter. The author of the book has been entered as its author.
core-lookup-group-name = “{ $name }” was given as the name of a person, “{ $family }, { $given }”, and has been taken as the name of a group.
core-lookup-kind-none = The record calls the kind of publication nothing. It has been entered as “misc”: choose the right type.
core-lookup-kind = The record calls the kind of publication “{ $kind }”. It has been entered as “misc”: choose the right type.
core-lookup-publisher-capitals = The publisher was in capitals, “{ $publisher }”, and has been written “{ $mended }”.
core-lookup-no-creators = The record names no author or editor.
core-lookup-title-capitals = The title was in capitals and has been put in lower case: see that names have their capital letters.
core-lookup-name-capitals = The name “{ $family }” was in capitals and has been written “{ $mended }”.
core-lookup-pubmed-translated = PubMed translates the title into English as “{ $title }”.
core-lookup-pubmed-translation = The title is PubMed's translation into English. The title in the language of the article is not given.
core-lookup-parallel-title = The record gives the title in another language as well, which has not been entered: “{ $title }”.
core-lookup-original-script = The title is entered as the catalogue writes it in Latin letters. In its own script it is “{ $title }”.
core-lookup-unplaced-name = The record names { $name } without saying as what. The name has not been entered.
core-lookup-thesis = The book is also a thesis: { $said }.
core-lookup-ebook = An e-book record: place, publisher and year are those of the electronic edition.
core-lookup-sound = A sound recording.
core-lookup-audio-book = A record of an audio book.
core-lookup-not-text = The record is not of a text. It has been entered as it could be: choose the right type.
core-lookup-other-form = The ISBN asked for is that of another form of the book. The ISBN of what this record describes is { $isbn }.
core-lookup-other-isbn = The record does not have the ISBN asked for. The ISBN of what it describes is { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = none
core-lookup-another-edition = Another edition with the same ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = edition { $edition }, { $year }
core-lookup-without-year = without a year
