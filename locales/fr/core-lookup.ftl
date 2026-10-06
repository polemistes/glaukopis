# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = « { $doi } » n’est pas un DOI.
core-lookup-not-arxiv = « { $id } » n’est pas un identifiant arXiv.
core-lookup-not-pubmed = « { $id } » n’est pas un numéro PubMed.
core-lookup-isbn-length = « { $isbn } » n’est pas un ISBN : un ISBN a 10 ou 13 chiffres, et celui-ci en a { $count }.
core-lookup-isbn-check = « { $isbn } » n’est pas un ISBN : son dernier chiffre se calcule à partir des autres, et il ne s’accorde pas avec eux. Un chiffre est-il mal tapé ?
core-lookup-not-isbn = « { $isbn } » n’est pas un ISBN.
core-lookup-address = Une adresse peut être cherchée quand elle contient un DOI, un identifiant arXiv ou un numéro PubMed. Celle-ci n’en contient pas : cherchez plutôt le titre.
core-lookup-nothing = Il n’y a rien à chercher.

## The services, and what they ask to have said of them.

core-lookup-sikt = Bibliothèques universitaires norvégiennes (Sikt)
core-lookup-thanks-arxiv = Merci à arXiv pour l’usage de son interface ouverte d’interopérabilité.
core-lookup-thanks-sikt = Contient des notices du catalogue de bibliothèque de Sikt, mises à disposition sous la licence norvégienne des données publiques ouvertes (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, pour le livre

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } a répondu quelque chose qui n’a pas pu être lu
core-lookup-not-preprints = { $service } a répondu quelque chose qui n’est pas une liste de prépublications
core-lookup-not-articles = { $service } a répondu quelque chose qui n’est pas une liste d’articles
core-lookup-could-not-answer = { $service } n’a pas pu répondre à la question : { $said }
core-lookup-catalogue-could-not-answer = le catalogue n’a pas pu répondre à la question : { $said }
core-lookup-no-reason = sans raison donnée
core-lookup-catalogue-unreadable = la réponse n’a pas pu être lue
core-lookup-not-a-catalogue = la réponse n’était pas celle d’un catalogue
core-lookup-pubmed-book = { $service } a ceci comme un livre ou une partie de livre, ce qui ne peut pas encore en être lu
core-lookup-wrong-form = { $host } ne donne pas la notice sous la forme demandée
core-lookup-not-a-record = { $service } : la réponse n’était pas une notice lisible.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Cette prépublication a depuis été publiée. Le DOI entré est celui de la version publiée : cherchez { $doi } pour citer celle-ci à la place.
core-lookup-arxiv-published = Cette prépublication a depuis été publiée : { $journal }.
core-lookup-arxiv-year-only = Seule l’année est donnée ici. Chercher arXiv:{ $id } donne le jour où la prépublication a été envoyée.
core-lookup-crossref-in-book = Une recherche ne donne pas les directeurs de publication ni l’ISBN du livre. La recherche par DOI les donne.
core-lookup-book-unreadable = Ce que Crossref a sur le livre n’a pas pu être lu : ses directeurs de publication manquent peut-être.
core-lookup-book-not-fetched = Ce que Crossref a sur le livre n’a pas pu être récupéré : ses directeurs de publication manquent peut-être.
core-lookup-chapter-author = Crossref ne nomme pas d’auteur pour le chapitre. L’auteur du livre a été entré comme son auteur.
core-lookup-group-name = « { $name } » était donné comme le nom d’une personne, « { $family }, { $given } », et a été pris comme le nom d’un groupe.
core-lookup-kind-none = La notice ne dit pas de quel type de publication il s’agit. Elle a été entrée comme « misc » : choisissez le bon type.
core-lookup-kind = La notice appelle le type de publication « { $kind } ». Elle a été entrée comme « misc » : choisissez le bon type.
core-lookup-publisher-capitals = L’éditeur était en capitales, « { $publisher } », et a été écrit « { $mended } ».
core-lookup-no-creators = La notice ne nomme ni auteur ni directeur de publication.
core-lookup-title-capitals = Le titre était en capitales et a été mis en minuscules : vérifiez que les noms ont leur majuscule.
core-lookup-name-capitals = Le nom « { $family } » était en capitales et a été écrit « { $mended } ».
core-lookup-pubmed-translated = PubMed traduit le titre en anglais par « { $title } ».
core-lookup-pubmed-translation = Le titre est la traduction en anglais de PubMed. Le titre dans la langue de l’article n’est pas donné.
core-lookup-parallel-title = La notice donne aussi le titre dans une autre langue, qui n’a pas été entré : « { $title } ».
core-lookup-original-script = Le titre est entré tel que le catalogue l’écrit en lettres latines. Dans sa propre écriture, c’est « { $title } ».
core-lookup-unplaced-name = La notice nomme { $name } sans dire à quel titre. Le nom n’a pas été entré.
core-lookup-thesis = Le livre est aussi une thèse : { $said }.
core-lookup-ebook = Une notice de livre numérique : le lieu, l’éditeur et l’année sont ceux de l’édition électronique.
core-lookup-sound = Un enregistrement sonore.
core-lookup-audio-book = Une notice de livre audio.
core-lookup-not-text = La notice n’est pas celle d’un texte. Elle a été entrée comme elle a pu l’être : choisissez le bon type.
core-lookup-other-form = L’ISBN demandé est celui d’une autre forme du livre. L’ISBN de ce que décrit cette notice est { $isbn }.
core-lookup-other-isbn = La notice n’a pas l’ISBN demandé. L’ISBN de ce qu’elle décrit est { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = aucun
core-lookup-another-edition = Une autre édition avec le même ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = édition { $edition }, { $year }
core-lookup-without-year = sans année
