# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = «{ $doi }» no es un DOI.
core-lookup-not-arxiv = «{ $id }» no es un identificador de arXiv.
core-lookup-not-pubmed = «{ $id }» no es un número de PubMed.
core-lookup-isbn-length = «{ $isbn }» no es un ISBN: un ISBN tiene 10 o 13 dígitos, y este tiene { $count }.
core-lookup-isbn-check = «{ $isbn }» no es un ISBN: su último dígito se calcula a partir de los demás, y no concuerda con ellos. ¿Hay algún dígito mal escrito?
core-lookup-not-isbn = «{ $isbn }» no es un ISBN.
core-lookup-address = Una dirección se puede consultar cuando contiene un DOI, un identificador de arXiv o un número de PubMed. Esta no: busque el título en su lugar.
core-lookup-nothing = No hay nada que buscar.

## The services, and what they ask to have said of them.

core-lookup-sikt = Bibliotecas académicas noruegas (Sikt)
core-lookup-thanks-arxiv = Gracias a arXiv por el uso de su interoperabilidad de acceso abierto.
core-lookup-thanks-sikt = Contiene registros del catálogo de bibliotecas de Sikt, disponibles bajo la Licencia Noruega de Datos Públicos Abiertos (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, para el libro

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } respondió con algo que no se pudo leer
core-lookup-not-preprints = { $service } respondió con algo que no es una lista de preprints
core-lookup-not-articles = { $service } respondió con algo que no es una lista de artículos
core-lookup-could-not-answer = { $service } no pudo responder a la pregunta: { $said }
core-lookup-catalogue-could-not-answer = el catálogo no pudo responder a la pregunta: { $said }
core-lookup-no-reason = sin motivo
core-lookup-catalogue-unreadable = no se pudo leer la respuesta
core-lookup-not-a-catalogue = la respuesta no era la de un catálogo
core-lookup-pubmed-book = { $service } tiene esto como un libro o una parte de uno, lo que aún no se puede leer de ahí
core-lookup-wrong-form = { $host } no da el registro en la forma pedida
core-lookup-not-a-record = { $service }: la respuesta no era un registro que se pudiera leer.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Este preprint se ha publicado después. El DOI introducido es el de la versión publicada: consulte { $doi } para citar esa en su lugar.
core-lookup-arxiv-published = Este preprint se ha publicado después: { $journal }.
core-lookup-arxiv-year-only = Aquí solo se da el año. Consultar arXiv:{ $id } da el día en que se envió el preprint.
core-lookup-crossref-in-book = Una búsqueda no da los editores ni el ISBN del libro. Consultar el DOI sí.
core-lookup-book-unreadable = No se pudo leer lo que Crossref tiene sobre el libro: pueden faltar sus editores.
core-lookup-book-not-fetched = No se pudo obtener lo que Crossref tiene sobre el libro: pueden faltar sus editores.
core-lookup-chapter-author = Crossref no nombra ningún autor para el capítulo. Se ha puesto como autor al autor del libro.
core-lookup-group-name = «{ $name }» venía como nombre de una persona, «{ $family }, { $given }», y se ha tomado como nombre de un grupo.
core-lookup-kind-none = El registro no dice de qué tipo de publicación se trata. Se ha puesto como «misc»: elija el tipo correcto.
core-lookup-kind = El registro llama «{ $kind }» al tipo de publicación. Se ha puesto como «misc»: elija el tipo correcto.
core-lookup-publisher-capitals = La editorial estaba en mayúsculas, «{ $publisher }», y se ha escrito «{ $mended }».
core-lookup-no-creators = El registro no nombra ningún autor ni editor.
core-lookup-title-capitals = El título estaba en mayúsculas y se ha puesto en minúsculas: compruebe que los nombres tengan su mayúscula.
core-lookup-name-capitals = El apellido «{ $family }» estaba en mayúsculas y se ha escrito «{ $mended }».
core-lookup-pubmed-translated = PubMed traduce el título al inglés como «{ $title }».
core-lookup-pubmed-translation = El título es la traducción de PubMed al inglés. No se da el título en el idioma del artículo.
core-lookup-parallel-title = El registro da también el título en otro idioma, que no se ha puesto: «{ $title }».
core-lookup-original-script = El título se ha puesto como lo escribe el catálogo en letras latinas. En su propia escritura es «{ $title }».
core-lookup-unplaced-name = El registro nombra a { $name } sin decir en calidad de qué. El nombre no se ha puesto.
core-lookup-thesis = El libro es también una tesis: { $said }.
core-lookup-ebook = Un registro de libro electrónico: lugar, editorial y año son los de la edición electrónica.
core-lookup-sound = Una grabación sonora.
core-lookup-audio-book = Un registro de audiolibro.
core-lookup-not-text = El registro no es de un texto. Se ha puesto como se ha podido: elija el tipo correcto.
core-lookup-other-form = El ISBN pedido es el de otra forma del libro. El ISBN de lo que describe este registro es { $isbn }.
core-lookup-other-isbn = El registro no tiene el ISBN pedido. El ISBN de lo que describe es { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = ninguno
core-lookup-another-edition = Otra edición con el mismo ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = edición { $edition }, { $year }
core-lookup-without-year = sin año
