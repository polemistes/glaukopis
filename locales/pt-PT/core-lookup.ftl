# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = «{ $doi }» não é um DOI.
core-lookup-not-arxiv = «{ $id }» não é um identificador do arXiv.
core-lookup-not-pubmed = «{ $id }» não é um número do PubMed.
core-lookup-isbn-length = «{ $isbn }» não é um ISBN: um ISBN tem 10 ou 13 algarismos, e este tem { $count }.
core-lookup-isbn-check = «{ $isbn }» não é um ISBN: o último algarismo calcula-se a partir dos outros, e não condiz com eles. Haverá um algarismo mal escrito?
core-lookup-not-isbn = «{ $isbn }» não é um ISBN.
core-lookup-address = Um endereço pode consultar-se quando contém um DOI, um identificador do arXiv ou um número do PubMed. Este não contém: procure antes pelo título.
core-lookup-nothing = Não há nada que consultar.

## The services, and what they ask to have said of them.

core-lookup-sikt = Bibliotecas académicas norueguesas (Sikt)
core-lookup-thanks-arxiv = Agradece-se ao arXiv o uso da sua interoperabilidade de acesso aberto.
core-lookup-thanks-sikt = Contém registos do catálogo das bibliotecas do Sikt, disponibilizados ao abrigo da Licença Norueguesa para Dados Públicos Abertos (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, para o livro

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } respondeu com algo que não se conseguiu ler
core-lookup-not-preprints = { $service } respondeu com algo que não é uma lista de pré-publicações
core-lookup-not-articles = { $service } respondeu com algo que não é uma lista de artigos
core-lookup-could-not-answer = { $service } não pôde responder à pergunta: { $said }
core-lookup-catalogue-could-not-answer = o catálogo não pôde responder à pergunta: { $said }
core-lookup-no-reason = sem razão dada
core-lookup-catalogue-unreadable = não foi possível ler a resposta
core-lookup-not-a-catalogue = a resposta não era a de um catálogo
core-lookup-pubmed-book = { $service } tem isto como livro ou parte de um, o que ainda não se consegue ler de lá
core-lookup-wrong-form = { $host } não dá o registo na forma pedida
core-lookup-not-a-record = { $service }: a resposta não era um registo que se pudesse ler.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Esta pré-publicação foi entretanto publicada. O DOI inserido é o da versão publicada: consulte { $doi } para citar antes essa.
core-lookup-arxiv-published = Esta pré-publicação foi entretanto publicada: { $journal }.
core-lookup-arxiv-year-only = Aqui só se dá o ano. Consultar arXiv:{ $id } dá o dia em que a pré-publicação foi enviada.
core-lookup-crossref-in-book = Uma procura não dá os editores nem o ISBN do livro. Consultar o DOI dá.
core-lookup-book-unreadable = Não foi possível ler o que o Crossref tem sobre o livro: podem faltar os editores.
core-lookup-book-not-fetched = Não foi possível obter o que o Crossref tem sobre o livro: podem faltar os editores.
core-lookup-chapter-author = O Crossref não nomeia autor para o capítulo. O autor do livro foi inserido como autor dele.
core-lookup-group-name = «{ $name }» foi dado como nome de pessoa, «{ $family }, { $given }», e foi tomado como nome de um grupo.
core-lookup-kind-none = O registo não dá nome ao tipo de publicação. Foi inserido como «misc»: escolha o tipo certo.
core-lookup-kind = O registo chama ao tipo de publicação «{ $kind }». Foi inserido como «misc»: escolha o tipo certo.
core-lookup-publisher-capitals = A editora estava em maiúsculas, «{ $publisher }», e foi escrita «{ $mended }».
core-lookup-no-creators = O registo não nomeia autor nem editor.
core-lookup-title-capitals = O título estava em maiúsculas e foi posto em minúsculas: veja se os nomes têm as suas maiúsculas.
core-lookup-name-capitals = O nome «{ $family }» estava em maiúsculas e foi escrito «{ $mended }».
core-lookup-pubmed-translated = O PubMed traduz o título para inglês como «{ $title }».
core-lookup-pubmed-translation = O título é a tradução do PubMed para inglês. O título na língua do artigo não é dado.
core-lookup-parallel-title = O registo dá também o título noutra língua, que não foi inserido: «{ $title }».
core-lookup-original-script = O título foi inserido como o catálogo o escreve em letras latinas. Na sua própria escrita é «{ $title }».
core-lookup-unplaced-name = O registo nomeia { $name } sem dizer como quê. O nome não foi inserido.
core-lookup-thesis = O livro é também uma tese: { $said }.
core-lookup-ebook = Um registo de livro eletrónico: o lugar, a editora e o ano são os da edição eletrónica.
core-lookup-sound = Uma gravação sonora.
core-lookup-audio-book = Um registo de audiolivro.
core-lookup-not-text = O registo não é de um texto. Foi inserido como se pôde: escolha o tipo certo.
core-lookup-other-form = O ISBN pedido é o de outra forma do livro. O ISBN do que este registo descreve é { $isbn }.
core-lookup-other-isbn = O registo não tem o ISBN pedido. O ISBN do que descreve é { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = nenhum
core-lookup-another-edition = Outra edição com o mesmo ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = edição { $edition }, { $year }
core-lookup-without-year = sem ano
