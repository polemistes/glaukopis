# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = texto colado
core-import-files = { $count ->
    [one] { $count } ficheiro
    [many] { $count } ficheiros
   *[other] { $count } ficheiros
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = O ficheiro «{ $name }» não foi encontrado.
core-import-empty-entry = Linha { $line }: a entrada «{ $key }» está vazia e ficou de fora.
# Where in a file a reference that has no key was found.
core-import-origin-line = linha { $line }
core-import-origin-key-line = { $key }, linha { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = «{ $title }»
core-import-merge-gone = { $reference }: a entrada com que se ia fundir já lá não está

## PDF files.

core-import-not-a-pdf = { $name } não é um PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Os dados vêm de { $service }.
core-import-number-unknown = Encontrou-se um número no ficheiro, mas as bases de dados nada sabem dele; os dados vêm do próprio ficheiro e devem ser verificados.
core-import-databases-failed = Não foi possível consultar as bases de dados ({ $error }); os dados vêm do próprio ficheiro e devem ser verificados.

## Zotero.

core-import-zotero-my-library = A Minha Biblioteca
core-import-zotero-group = Grupo { $id }
core-import-zotero-the-library = a biblioteca { $id } no Zotero
core-import-zotero-own-library = a biblioteca própria do utilizador no Zotero
core-import-zotero-the-collection = a coleção { $key } no Zotero
core-import-zotero-unknown-base = O ficheiro «{ $name }» não foi encontrado. O Zotero remete para ele a partir de uma pasta à sua escolha, que aqui não se conhece.
core-import-zotero-empty-item = O item { $key } no Zotero está vazio e ficou de fora.
core-import-zotero-alone = { $count ->
    [one] { $count } ficheiro ou nota está no Zotero sem pertencer a nenhuma referência, e ficou de fora.
    [many] { $count } ficheiros e notas estão no Zotero sem pertencer a nenhuma referência, e ficaram de fora.
   *[other] { $count } ficheiros e notas estão no Zotero sem pertencer a nenhuma referência, e ficaram de fora.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = O Zotero dá { $name } como { $role }, para o que o BibLaTeX não tem campo. O nome ficou de fora.
core-import-zotero-left-out = O campo «{ $field }» do Zotero não tem correspondente no BibLaTeX e ficou de fora: { $value }

## Zotero's database.

core-import-zotero-no-database = uma base de dados do Zotero ({ $file }) em { $path }
core-import-zotero-copying = ao copiar { $path } para uma pasta temporária
core-import-zotero-empty = o ficheiro está vazio
core-import-zotero-disturbed = O Zotero estava a escrever na sua base de dados enquanto esta era lida. Se faltar alguma coisa, feche o Zotero e importe de novo.
core-import-zotero-backup-read = Não foi possível ler a base de dados do Zotero ({ $error }). Leu-se em seu lugar a cópia de segurança, { $backup }: falta o que mudou no Zotero desde que a cópia foi feita.
core-import-zotero-not-a-database = { $path } não é uma base de dados do Zotero.
core-import-zotero-unreadable = A base de dados do Zotero tem uma forma que aqui não se consegue ler: { $what }. Se foi escrita por uma versão antiga do Zotero, abri-la uma vez numa versão atual põe-na em dia.
core-import-zotero-unreadable-version = A base de dados do Zotero tem uma forma que aqui não se consegue ler (versão { $version } da base de dados do Zotero): { $what }. Se foi escrita por uma versão antiga do Zotero, abri-la uma vez numa versão atual põe-na em dia.
core-import-zotero-no-table = falta a tabela «{ $table }»
core-import-zotero-no-column = a tabela «{ $table }» não tem a coluna «{ $column }»
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = A base de dados do Zotero não tem a tabela «{ $table }» na forma que aqui se conhece: { $consequence }.
core-import-zotero-no-bin = os itens do lixo do Zotero não se distinguem dos outros
core-import-zotero-no-collections = as coleções não foram lidas
core-import-zotero-no-attachments = os ficheiros anexos não foram lidos
core-import-zotero-no-notes = as notas não foram lidas
core-import-zotero-no-keywords = as palavras-chave não foram lidas
core-import-zotero-no-group-names = os nomes das bibliotecas de grupo não se conhecem

## PDF files, as they are read for a reference.

core-import-pdf-empty = O ficheiro «{ $name }» está vazio.
core-import-pdf-not-a-pdf = O ficheiro «{ $name }» não é um PDF.
core-import-pdf-unreadable = Não foi possível ler o ficheiro: está danificado, protegido por palavra-passe, ou é demasiado grande.
core-import-pdf-scan = O ficheiro não tem camada de texto: é uma digitalização.
core-import-pdf-from-file = Os dados vêm do próprio ficheiro, não de um catálogo, e devem ser verificados.
core-import-pdf-from-metadata = Não se encontrou DOI nem ISBN no ficheiro; os dados vêm dos metadados do próprio ficheiro e devem ser verificados.
core-import-pdf-unknown = Não se encontrou DOI nem ISBN no ficheiro, e os seus metadados não dizem o que ele é: os dados têm de ser preenchidos.

## Tables, from files of text and of sheets.

core-import-table-too-large = O ficheiro tem { $size } MB. Uma tabela lê-se de um ficheiro de { $most } MB no máximo.
core-import-table-kinds = As tabelas leem-se de CSV e de outro texto com os valores separados por vírgulas, pontos e vírgulas ou tabulações, e das folhas de cálculo do LibreOffice (.ods) e do Excel (.xlsx, .xls).
core-import-table-empty = Não há nada no ficheiro.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = A tabela tem { $rows } linhas. Uma tabela num texto pode ter { $most } no máximo: não é uma folha de cálculo.
core-import-table-columns = A tabela tem { $columns } colunas. Uma tabela num texto pode ter { $most } no máximo: não é uma folha de cálculo.
core-import-table-more-than = mais de { $count }

## Documents brought in, to become maps.

core-import-document-stopped = A leitura foi interrompida.
core-import-pdfs-stopped = Interrompeu-se a averiguação do que os ficheiros são. Nada foi acrescentado.
core-import-document-kind = «{ $file }» não é de um tipo que se possa trazer como documento. Podem trazer-se Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst e texto simples.
core-import-document-too-large = «{ $file }» tem mais de 50 MB, mais do que se pode trazer como documento.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = Não foi possível ler «{ $file }» como { $kind }. Pode estar danificado, ou ser de outro tipo que não o que o nome diz. O Pandoc, que o lê, disse: { $message }
core-import-document-pandoc-unreadable = não foi possível ler o que o Pandoc fez de «{ $file }»: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Sem título
core-import-document-plain-text = texto simples
core-import-document-notebook = caderno Jupyter

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Encontrou-se { $count } citação ainda não ligada a uma referência da biblioteca, feita por um programa que guarda referências. Fica como texto, tal como foi escrita, e pode ser percorrida quando o mapa se fizer, e mais tarde.
       *[none] Encontrou-se { $count } citação ainda não ligada a uma referência da biblioteca. Fica como texto, tal como foi escrita, e pode ser percorrida quando o mapa se fizer, e mais tarde.
    }
    [many] { $made ->
        [all] Encontraram-se { $count } citações ainda não ligadas a referências da biblioteca, todas feitas por um programa que guarda referências. Ficam como texto, tal como foram escritas, e podem ser percorridas uma a uma quando o mapa se fizer, e mais tarde.
        [some] Encontraram-se { $count } citações ainda não ligadas a referências da biblioteca, { $some } delas feitas por um programa que guarda referências. Ficam como texto, tal como foram escritas, e podem ser percorridas uma a uma quando o mapa se fizer, e mais tarde.
       *[none] Encontraram-se { $count } citações ainda não ligadas a referências da biblioteca. Ficam como texto, tal como foram escritas, e podem ser percorridas uma a uma quando o mapa se fizer, e mais tarde.
    }
   *[other] { $made ->
        [all] Encontraram-se { $count } citações ainda não ligadas a referências da biblioteca, todas feitas por um programa que guarda referências. Ficam como texto, tal como foram escritas, e podem ser percorridas uma a uma quando o mapa se fizer, e mais tarde.
        [some] Encontraram-se { $count } citações ainda não ligadas a referências da biblioteca, { $some } delas feitas por um programa que guarda referências. Ficam como texto, tal como foram escritas, e podem ser percorridas uma a uma quando o mapa se fizer, e mais tarde.
       *[none] Encontraram-se { $count } citações ainda não ligadas a referências da biblioteca. Ficam como texto, tal como foram escritas, e podem ser percorridas uma a uma quando o mapa se fizer, e mais tarde.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } citação feita pelo EndNote é trazida como o texto que mostra, e não está entre as encontradas: não foi possível ler o que o EndNote diz das obras.
    [many] { $count } citações feitas pelo EndNote são trazidas como o texto que mostram, e não estão entre as encontradas: não foi possível ler o que o EndNote diz das obras.
   *[other] { $count } citações feitas pelo EndNote são trazidas como o texto que mostram, e não estão entre as encontradas: não foi possível ler o que o EndNote diz das obras.
}
core-import-document-bookmarks = { $count ->
    [one] O documento guarda { $count } citação num marcador, e não foi possível ler o que ela cita: é texto tal como está. O Zotero guarda-as assim quando as preferências do documento o dizem.
    [many] O documento guarda { $count } citações em marcadores, e não foi possível ler o que elas citam: são texto tal como estão. O Zotero guarda-as assim quando as preferências do documento o dizem.
   *[other] O documento guarda { $count } citações em marcadores, e não foi possível ler o que elas citam: são texto tal como estão. O Zotero guarda-as assim quando as preferências do documento o dizem.
}
core-import-document-bibliography = O documento tem uma lista do que cita, sob «{ $heading }». É trazida como texto, como o resto. O mapa faz a sua própria bibliografia a partir do que nele se cita.
core-import-document-bibliography-made = O documento tem uma lista do que cita, feita pelo programa que guarda as suas referências. É trazida como texto, como o resto. O mapa faz a sua própria bibliografia a partir do que nele se cita.
core-import-document-tracked = O documento tem alterações registadas. O texto é trazido tal como fica quando todas são aceites.
core-import-document-comments = O documento tem comentários na margem, que ficam de fora.
core-import-document-heading-notes = { $count ->
    [one] Uma nota num título fica no início do texto que está sob ele: um título não pode ter nota.
    [many] { $count } notas em títulos ficam no início do texto que está sob cada um: um título não pode ter nota.
   *[other] { $count } notas em títulos ficam no início do texto que está sob cada um: um título não pode ter nota.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } legenda começava por uma palavra e um número, como «{ $first }». Fica de fora: o mapa numera ele próprio as suas figuras e tabelas. Onde o texto nomeia uma delas pelo número, isso é texto tal como foi escrito, e não segue a numeração do mapa.
    [many] { $count } legendas começavam por uma palavra e um número, como «{ $first }». Ficam de fora: o mapa numera ele próprio as suas figuras e tabelas. Onde o texto nomeia uma delas pelo número, isso é texto tal como foi escrito, e não segue a numeração do mapa.
   *[other] { $count } legendas começavam por uma palavra e um número, como «{ $first }». Ficam de fora: o mapa numera ele próprio as suas figuras e tabelas. Onde o texto nomeia uma delas pelo número, isso é texto tal como foi escrito, e não segue a numeração do mapa.
}
core-import-document-label-example = Figura 1:
core-import-document-caption-notes = { $count ->
    [one] Uma nota na legenda de uma figura ou de uma tabela fica aí, entre parênteses.
    [many] { $count } notas nas legendas de figuras ou tabelas ficam aí, entre parênteses.
   *[other] { $count } notas nas legendas de figuras ou tabelas ficam aí, entre parênteses.
}
core-import-document-headings = { $count ->
    [one] { $count } título dentro de uma citação, de uma lista ou de uma tabela é trazido como parágrafo em negrito.
    [many] { $count } títulos dentro de citações, listas ou tabelas são trazidos como parágrafos em negrito.
   *[other] { $count } títulos dentro de citações, listas ou tabelas são trazidos como parágrafos em negrito.
}
core-import-document-code = { $count ->
    [one] { $count } bloco de código é trazido como parágrafos simples, um por linha.
    [many] { $count } blocos de código são trazidos como parágrafos simples, um por linha.
   *[other] { $count } blocos de código são trazidos como parágrafos simples, um por linha.
}
core-import-document-definitions = { $count ->
    [one] { $count } lista de termos com o seu significado é trazida como parágrafos, com os termos em negrito.
    [many] { $count } listas de termos com o seu significado são trazidas como parágrafos, com os termos em negrito.
   *[other] { $count } listas de termos com o seu significado são trazidas como parágrafos, com os termos em negrito.
}
core-import-document-rules = { $count ->
    [one] { $count } linha atravessada na página fica de fora.
    [many] { $count } linhas atravessadas na página ficam de fora.
   *[other] { $count } linhas atravessadas na página ficam de fora.
}
core-import-document-raw = { $count ->
    [one] { $count } trecho escrito em HTML ou TeX só para um tipo de documento fica de fora.
    [many] { $count } trechos escritos em HTML ou TeX só para um tipo de documento ficam de fora.
   *[other] { $count } trechos escritos em HTML ou TeX só para um tipo de documento ficam de fora.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } imagem que o ficheiro contém não está no texto que foi lido, e fica de fora. Pode estar no cabeçalho ou no rodapé das páginas, ou num desenho.
    [many] { $count } imagens que o ficheiro contém não estão no texto que foi lido, e ficam de fora. Podem estar no cabeçalho ou no rodapé das páginas, ou num desenho.
   *[other] { $count } imagens que o ficheiro contém não estão no texto que foi lido, e ficam de fora. Podem estar no cabeçalho ou no rodapé das páginas, ou num desenho.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = A imagem «{ $name }» fica de fora: { $why }.
core-import-document-picture-kind = é de um tipo que não se lê ({ $kind })
core-import-document-picture-not-read = não é uma imagem de um tipo que se leia
core-import-document-picture-unreadable = não foi possível lê-la
core-import-document-picture-network = está na rede, e de lá nada se vai buscar
core-import-document-picture-not-taken-out = não foi possível tirá-la do ficheiro
core-import-document-picture-outside = não está no ficheiro, mas noutro lugar deste computador, e de lá não se tira
core-import-document-picture-not-found = o ficheiro não foi encontrado onde o documento diz que está
core-import-document-picture-too-large = tem mais de 50 MB
core-import-document-picture-file-unreadable = não foi possível ler o ficheiro
