# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = „{ $doi }” nie jest DOI.
core-lookup-not-arxiv = „{ $id }” nie jest identyfikatorem arXiv.
core-lookup-not-pubmed = „{ $id }” nie jest numerem PubMed.
core-lookup-isbn-length = „{ $isbn }” nie jest ISBN: ISBN ma 10 lub 13 cyfr, a ten ma { $count }.
core-lookup-isbn-check = „{ $isbn }” nie jest ISBN: jego ostatnia cyfra wynika z pozostałych, a tu się z nimi nie zgadza. Czy któraś cyfra jest źle wpisana?
core-lookup-not-isbn = „{ $isbn }” nie jest ISBN.
core-lookup-address = Dane można pobrać dla adresu, który zawiera DOI, identyfikator arXiv lub numer PubMed. Ten nie zawiera: poszukaj zamiast tego po tytule.
core-lookup-nothing = Nie ma czego szukać.

## The services, and what they ask to have said of them.

core-lookup-sikt = Norweskie biblioteki akademickie (Sikt)
core-lookup-thanks-arxiv = Dziękujemy arXiv za możliwość korzystania z jego otwartego interfejsu wymiany danych.
core-lookup-thanks-sikt = Zawiera rekordy z katalogu bibliotecznego Sikt, udostępnione na norweskiej licencji otwartych danych publicznych (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, o książkę

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } odpowiedział czymś, czego nie dało się odczytać
core-lookup-not-preprints = { $service } odpowiedział czymś, co nie jest listą preprintów
core-lookup-not-articles = { $service } odpowiedział czymś, co nie jest listą artykułów
core-lookup-could-not-answer = { $service } nie mógł odpowiedzieć na pytanie: { $said }
core-lookup-catalogue-could-not-answer = katalog nie mógł odpowiedzieć na pytanie: { $said }
core-lookup-no-reason = nie podano powodu
core-lookup-catalogue-unreadable = nie dało się odczytać odpowiedzi
core-lookup-not-a-catalogue = odpowiedź nie była odpowiedzią katalogu
core-lookup-pubmed-book = { $service } ma to jako książkę lub jej część, a tego nie da się jeszcze stamtąd odczytać
core-lookup-wrong-form = { $host } nie podaje rekordu w postaci, o którą proszono
core-lookup-not-a-record = { $service }: odpowiedź nie była rekordem, który dałoby się odczytać.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Ten preprint został od tego czasu opublikowany. Wpisany DOI należy do wersji opublikowanej: pobierz dane { $doi }, by cytować ją zamiast preprintu.
core-lookup-arxiv-published = Ten preprint został od tego czasu opublikowany: { $journal }.
core-lookup-arxiv-year-only = Podany jest tu tylko rok. Pobranie danych arXiv:{ $id } daje dzień, w którym preprint wysłano.
core-lookup-crossref-in-book = Wyszukiwanie nie daje redaktorów ani ISBN książki. Pobranie danych po DOI je daje.
core-lookup-book-unreadable = Nie udało się odczytać tego, co Crossref ma o książce: może brakować jej redaktorów.
core-lookup-book-not-fetched = Nie udało się pobrać tego, co Crossref ma o książce: może brakować jej redaktorów.
core-lookup-chapter-author = Crossref nie podaje autora rozdziału. Jako jego autora wpisano autora książki.
core-lookup-group-name = „{ $name }” podano jako nazwisko osoby, „{ $family }, { $given }”; przyjęto je jako nazwę autora zbiorowego.
core-lookup-kind-none = Rekord nie podaje żadnego rodzaju publikacji. Wpisano „misc”: wybierz właściwy typ.
core-lookup-kind = Rekord nazywa rodzaj publikacji „{ $kind }”. Wpisano „misc”: wybierz właściwy typ.
core-lookup-publisher-capitals = Wydawca był zapisany wielkimi literami, „{ $publisher }”, i został zapisany jako „{ $mended }”.
core-lookup-no-creators = Rekord nie podaje autora ani redaktora.
core-lookup-title-capitals = Tytuł był zapisany wielkimi literami i został zamieniony na małe: sprawdź, czy nazwy własne mają wielkie litery.
core-lookup-name-capitals = Nazwisko „{ $family }” było zapisane wielkimi literami i zostało zapisane jako „{ $mended }”.
core-lookup-pubmed-translated = PubMed tłumaczy tytuł na angielski jako „{ $title }”.
core-lookup-pubmed-translation = Tytuł jest tłumaczeniem PubMed na angielski. Tytułu w języku artykułu nie podano.
core-lookup-parallel-title = Rekord podaje tytuł także w innym języku; nie wpisano go: „{ $title }”.
core-lookup-original-script = Tytuł wpisano tak, jak katalog zapisuje go alfabetem łacińskim. W swoim własnym piśmie brzmi „{ $title }”.
core-lookup-unplaced-name = Rekord wymienia { $name }, nie mówiąc, w jakiej roli. Nazwiska nie wpisano.
core-lookup-thesis = Książka jest też rozprawą: { $said }.
core-lookup-ebook = Rekord e-booka: miejsce, wydawca i rok są te wydania elektronicznego.
core-lookup-sound = Nagranie dźwiękowe.
core-lookup-audio-book = Rekord audiobooka.
core-lookup-not-text = Rekord nie dotyczy tekstu. Wpisano go, jak się dało: wybierz właściwy typ.
core-lookup-other-form = Podany ISBN należy do innej postaci książki. ISBN tego, co opisuje ten rekord: { $isbn }.
core-lookup-other-isbn = Rekord nie ma podanego ISBN. ISBN tego, co opisuje: { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = brak
core-lookup-another-edition = Inne wydanie z tym samym ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = wydanie { $edition }, { $year }
core-lookup-without-year = bez roku
