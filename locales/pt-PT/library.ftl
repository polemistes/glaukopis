# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Mais usados
library-form-add-field = Acrescentar campo
library-form-citation-key = Chave de citação
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = feita do autor e do ano
library-form-date-problem = Escreva uma data como 1979, 1979-05 ou 1979-05-12; um intervalo como 1979/1985.
library-form-remove-field = Remover { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Instituição ou outro nome que fica inteiro
library-names-prefix-suffix = Prefixo e sufixo
    .hint = «van», «de la» · «Jr.», «III»
library-names-move-up = Mover para cima
library-names-move-down = Mover para baixo
library-names-more = Mais para este nome
library-names-name = Nome
library-names-name-of = { $role }: nome
library-names-family = Apelido
library-names-family-of = { $role }: apelido
library-names-given = Nomes próprios
library-names-given-of = { $role }: nomes próprios
library-names-prefix = Prefixo: van, de la
library-names-prefix-of = { $role }: prefixo
library-names-suffix = Sufixo: Jr., III
library-names-suffix-of = { $role }: sufixo

## Words for references, wherever they are shown.

library-untitled = Sem título
library-no-author = Sem autor
library-no-title = Sem título
library-in-library = Na biblioteca

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = o mesmo DOI
library-reason-isbn = o mesmo ISBN
library-reason-identical = iguais em tudo o que distingue uma obra de outra
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] o mesmo título, autor e ano
            [like] o mesmo título e autor, um ano de diferença
           *[none] o mesmo título e autor, o ano só numa delas
        }
        [like] { $year ->
            [same] o mesmo título e ano, e um autor em comum
            [like] o mesmo título, um autor em comum, um ano de diferença
           *[none] o mesmo título, um autor em comum, o ano só numa delas
        }
       *[none] { $year ->
            [same] o mesmo título e ano, o autor só numa delas
            [like] o mesmo título, um ano de diferença, o autor só numa delas
           *[none] o mesmo título, o autor e o ano só numa delas
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] o mesmo autor e ano, e um título parecido
            [like] o mesmo autor, um título parecido, um ano de diferença
           *[none] o mesmo autor, um título parecido, o ano só numa delas
        }
        [like] { $year ->
            [same] o mesmo ano, um título parecido, um autor em comum
            [like] um título parecido, um autor em comum, um ano de diferença
           *[none] um título parecido, um autor em comum, o ano só numa delas
        }
       *[none] { $year ->
            [same] o mesmo ano, um título parecido, o autor só numa delas
            [like] um título parecido, um ano de diferença, o autor só numa delas
           *[none] um título parecido, o autor e o ano só numa delas
        }
    }
}
library-reason-file = o mesmo ficheiro
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } e { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Isto já está na biblioteca.
library-duplicate-probable = Isto pode já estar na biblioteca.
library-duplicate-use = Usar esta

## Duplicates in the library.

library-duplicates-title = Duplicados
library-duplicates-count = { $count ->
    [one] { $count } referência parece estar na biblioteca mais de uma vez
    [many] { $count } referências parecem estar na biblioteca mais de uma vez
   *[other] { $count } referências parecem estar na biblioteca mais de uma vez
}
library-duplicates-none = Sem duplicados
    .text = Nenhuma referência parece estar na biblioteca mais de uma vez.
library-duplicates-no-more = Não há mais duplicados
    .text = As citações das referências que se fundiram citam agora as que ficaram.
library-duplicates-how = Quando as referências se fazem uma só, a que fica recebe das outras o que lhe falta, e guarda o seu onde diferem. Os ficheiros e as coleções juntam-se, e o que as citava cita a que ficou.
library-duplicates-same = A mesma
library-duplicates-probably-same = Provavelmente a mesma
library-duplicates-keep-which = A que fica
library-duplicates-kept = Fica
library-duplicates-different = São diferentes
library-duplicates-merge = Fazer delas uma só
library-duplicates-merging = A fazer delas uma só…
library-duplicates-failed = Não foi possível procurar duplicados na biblioteca
library-duplicates-merge-failed = Não foi possível fazer delas uma só

## Importing references: what a file holds, against what the library has.

library-import = Importar
library-import-title = Importar referências
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } referência em { $source }
    [many] { $count } referências em { $source }
   *[other] { $count } referências em { $source }
}
library-import-review = { $count ->
    [one] { $count } referência pode já estar na biblioteca
    [many] { $count } referências podem já estar na biblioteca
   *[other] { $count } referências podem já estar na biblioteca
}
library-import-new = { $count ->
    [one] { $count } referência nova
    [many] { $count } referências novas
   *[other] { $count } referências novas
}
library-import-complete = { $count ->
    [one] { $count } referência já na biblioteca ganha dados
    [many] { $count } referências já na biblioteca ganham dados
   *[other] { $count } referências já na biblioteca ganham dados
}
library-import-known = { $count ->
    [one] { $count } referência já na biblioteca
    [many] { $count } referências já na biblioteca
   *[other] { $count } referências já na biblioteca
}
library-import-repeated = { $count ->
    [one] { $count } referência repetida dentro da importação
    [many] { $count } referências repetidas dentro da importação
   *[other] { $count } referências repetidas dentro da importação
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Ganharia: { $fields }
library-import-gains-file = Ficheiro
library-import-gains-zotero = A sua chave no Zotero
library-import-what-to-do = O que fazer
library-import-merge = A mesma obra: completar a que tenho
library-import-skip = A mesma obra: deixar a minha como está
library-import-add = Outra obra: acrescentá-la
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = Para todas as { $count } que são a mesma:
library-import-all-probable = Para todas as { $count } que provavelmente são a mesma:
library-import-all-merge = Completar as que tenho
library-import-all-skip = Deixar as minhas como estão
library-import-all-add = Acrescentá-las mesmo assim
library-import-more = …e mais { $count }.
library-import-unread = { $count ->
    [one] { $count } parte do ficheiro não se pôde ler
    [many] { $count } partes do ficheiro não se puderam ler
   *[other] { $count } partes do ficheiro não se puderam ler
}
library-import-importing = A importar…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } a acrescentar{ $merge ->
        [0] {""}
       *[other] , { $merge } a completar
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } de fora
    }
library-import-failed = A importação falhou.

## The library: the list of references, and what can be done with them.

library-references = Referências
library-unread = Não foi possível ler a biblioteca
library-all-references = Todas as referências
library-count = { $count ->
    [one] { $count } referência
    [many] { $count } referências
   *[other] { $count } referências
}
library-selected = { $count ->
    [one] { $count } referência selecionada
    [many] { $count } referências selecionadas
   *[other] { $count } referências selecionadas
}
library-selected-of = { $count ->
    [one] { $selected } de { $count } referência selecionada
    [many] { $selected } de { $count } referências selecionadas
   *[other] { $selected } de { $count } referências selecionadas
}
library-new-reference = Nova referência
library-search = Procurar na biblioteca
library-search-in = Procurar em { $name }
library-search-clear = Limpar a procura
library-sort = Ordenar
library-sort-author = Autor
library-sort-year = Ano
library-sort-title = Título
library-sort-added = Data de adição
library-sort-modified = Data de alteração
library-sort-descending = Descendente

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filtrar
library-filters-on = { $count ->
    [one] Filtro: { $count } ativo
    [many] Filtro: { $count } ativos
   *[other] Filtro: { $count } ativos
}
library-filter-kind = Tipo
library-filter-publisher = Editora
library-filter-publisher-hint = Parte do nome
library-filter-any-publisher = Qualquer editora
library-filter-year = Ano
library-filter-from = De
library-filter-to = A
library-filter-clear = Limpar os filtros
library-filter-nothing-here = Nada que filtrar aqui.
# When the filters let nothing through.
library-nothing-passes = Nenhuma referência à vista passa os filtros.
library-import-export = Importar e exportar
library-import-file = Importar um ficheiro…
    .hint = BibLaTeX ou BibTeX
library-paste = Colar referências…
library-add-pdfs = Acrescentar ficheiros PDF…
    .hint = Cada um é consultado, e guardado
library-import-zotero = Importar do Zotero…
library-find-duplicates = Procurar duplicados…
library-map-library = Um mapa da biblioteca…
library-map-collection = Um mapa de «{ $name }»…
library-export-library = Exportar a biblioteca…
library-export-collection = Exportar «{ $name }»…
library-export-one = Exportar…
library-export-many = { $count ->
    [one] Exportar { $count } referência…
    [many] Exportar { $count } referências…
   *[other] Exportar { $count } referências…
}
library-export-title = Exportar referências
# What a file of exported references is called, before it is given a name.
library-export-file-references = referências
library-export-file-library = biblioteca
library-exported = { $count ->
    [one] { $count } referência exportada
    [many] { $count } referências exportadas
   *[other] { $count } referências exportadas
}
library-export-failed = A exportação falhou
library-empty = A biblioteca está vazia
    .text = As referências que aqui se acrescentam ficam disponíveis em todos os projetos. Comece por uma, ou traga as que já tem.
library-collection-empty = Ainda nada nesta coleção
    .text = Arraste referências da biblioteca para aqui, ou acrescente uma nova.
library-nothing-found = Nada encontrado
    .text = Nenhuma referência contém todas estas palavras.
library-open-file = Abrir o ficheiro
library-file-open-failed = Não foi possível abrir o ficheiro
library-add-to-collection = Acrescentar à coleção
library-remove-from = Remover de «{ $name }»
library-copy-key = Copiar a chave de citação
library-copied-key = Copiada «{ $key }»
library-copy-biblatex = Copiar como BibLaTeX
library-copied = Copiado
library-delete-one-title = Eliminar «{ $name }»?
library-delete-many-title = { $count ->
    [one] Eliminar { $count } referência?
    [many] Eliminar { $count } referências?
   *[other] Eliminar { $count } referências?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Isto remove a referência da biblioteca, de todas as coleções{ $files ->
        [0] {""}
        [one] , juntamente com { $files } ficheiro anexo
        [many] , juntamente com { $files } ficheiros anexos
       *[other] , juntamente com { $files } ficheiros anexos
    }.{ $projects ->
        [0] {""}
        [one] {" "}É citada num projeto, que guarda uma cópia dela.
        [many] {" "}É citada em { $projects } projetos, que guardam uma cópia dela.
       *[other] {" "}É citada em { $projects } projetos, que guardam uma cópia dela.
    }
library-delete-many = Isto remove-as da biblioteca, de todas as coleções{ $files ->
        [0] {""}
        [one] , juntamente com { $files } ficheiro anexo
        [many] , juntamente com { $files } ficheiros anexos
       *[other] , juntamente com { $files } ficheiros anexos
    }.{ $projects ->
        [0] {""}
        [one] {" "}Um projeto que cita algumas delas guarda uma cópia dessas.
        [many] {" "}{ $projects } projetos que citam algumas delas guardam uma cópia dessas.
       *[other] {" "}{ $projects } projetos que citam algumas delas guardam uma cópia dessas.
    }
library-delete-failed = Não foi possível eliminar as referências
library-not-done = Não foi possível fazer isso

## Collections.

library-collections = Coleções
# The projects that cite a work, in its pane.
library-cited-in = Citada em
library-not-cited = Não é citada em nenhum projeto.
library-cited-reading = A ler os projetos…
library-collections-hint = As coleções reúnem referências para um assunto ou um trabalho. Uma referência pode estar em quantas se quiser.
library-collection-new = Nova coleção
library-collection-new-inside = Nova coleção dentro
library-collection-new-under = Nova coleção em «{ $name }»
library-collection-move-to = Mover para
library-collection-name = Nome da coleção
library-collection-name-failed = Não foi possível dar nome à coleção
library-collection-expand = Expandir
library-collection-collapse = Recolher
library-collection-to-top = Mover para o nível de cima
library-collection-move-failed = Não foi possível mover a coleção
library-collection-added = { $count ->
    [one] { $count } referência acrescentada a «{ $name }»
    [many] { $count } referências acrescentadas a «{ $name }»
   *[other] { $count } referências acrescentadas a «{ $name }»
}
library-collection-already = Já está em «{ $name }»
library-collection-delete = Eliminar a coleção
library-collection-delete-title = Eliminar a coleção «{ $name }»?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] As referências ficam na biblioteca.
   *[other] As coleções dentro dela são eliminadas também. As referências ficam na biblioteca.
}
library-collection-delete-failed = Não foi possível eliminar a coleção
library-collection-count = { $count ->
    [one] { $count } coleção
    [many] { $count } coleções
   *[other] { $count } coleções
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Um mapa da biblioteca
library-map-title-collection = Um mapa de uma coleção
# The name a project made of the whole library is given.
library-map-library-name = A biblioteca
library-map-name = Nome
library-map-name-hint = O nome do projeto, do seu mapa, e do elemento no centro do mapa.
library-map-what-library = As coleções tornam-se elementos, encaixadas como estão, e cada referência um elemento sob a sua coleção, cujo texto é uma citação dela. As referências que não estão em nenhuma coleção ficam no centro.
library-map-what-collection = As coleções dentro dela tornam-se elementos, encaixadas como estão, e cada referência um elemento sob a sua coleção, cujo texto é uma citação dela.
library-map-nothing = Não há referências para pôr no mapa.
library-map-make = Fazer o projeto
library-map-making = A fazer o projeto…
library-map-failed = Não foi possível fazer o projeto.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } ficheiro
    [many] { $count } ficheiros
   *[other] { $count } ficheiros
}
library-open-failed = Não foi possível abrir a referência
library-known = { $count ->
    [one] Já está na biblioteca
    [many] Já estão na biblioteca
   *[other] Já estão na biblioteca
}
library-nothing-to-import = Nada que importar
library-none-found = Não se encontraram referências.
library-import-kinds = As referências leem-se de ficheiros .bib, e fazem-se de ficheiros PDF.
library-filter-bib = BibLaTeX e BibTeX
library-filter-all = Todos os ficheiros
library-files-read-failed = { $count ->
    [one] Não foi possível ler o ficheiro
    [many] Não foi possível ler os ficheiros
   *[other] Não foi possível ler os ficheiros
}
library-text-read-failed = Não foi possível ler o texto
library-add-pdfs-title = Acrescentar ficheiros PDF
library-pdfs-working = { $count ->
    [one] A averiguar o que o ficheiro é…
    [many] A averiguar o que { $count } ficheiros são…
   *[other] A averiguar o que { $count } ficheiros são…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } de { $count }: { $name }
library-stop = Parar
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } referência acrescentada
    [many] { $count } referências acrescentadas
   *[other] { $count } referências acrescentadas
}
library-imported-completed = { $count ->
    [one] { $count } completada
    [many] { $count } completadas
   *[other] { $count } completadas
}
library-imported-skipped = { $count } já na biblioteca
library-imported-files = { $count ->
    [one] { $count } ficheiro guardado
    [many] { $count } ficheiros guardados
   *[other] { $count } ficheiros guardados
}
library-imported-nothing = Nada foi alterado
library-paste-title = Colar referências
library-paste-subtitle = BibLaTeX ou BibTeX, tantas entradas quantas quiser
library-paste-continue = Continuar
library-source-label = Código BibLaTeX

## Importing from Zotero.

library-zotero-title = Importar do Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Não se encontrou nenhum Zotero neste computador, nos lugares onde costuma guardar os dados. Se os guarda noutro lado, mostre onde: a pasta que contém { $file }.
library-zotero-lead = O que se importa é copiado para a biblioteca, com os seus ficheiros. O Zotero é apenas lido, e nada nele se altera; pode estar aberto entretanto.
library-zotero-choose = A pasta de dados do Zotero
library-zotero-none-there = Aí não há nenhum Zotero.
library-zotero-unread = Não foi possível ler o Zotero.
library-zotero-library = Biblioteca
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = A minha biblioteca
library-zotero-what = O que importar
library-zotero-everything = Tudo
library-zotero-with-files = Com os ficheiros anexos
library-zotero-with-notes = Com as notas, como anotações
library-zotero-elsewhere = Outro lugar…
library-zotero-show-where = Mostrar onde…
library-zotero-reading = A ler…
library-zotero-read = { $count ->
    [0] Ler
    [one] Ler { $count } referência
    [many] Ler { $count } referências
   *[other] Ler { $count } referências
}

## Writing a reference.

library-dialog-edit = Alterar a referência
library-dialog-add = Acrescentar uma referência
library-dialog-back = Voltar ao formulário
library-dialog-open-failed = Não foi possível abrir a referência.
library-dialog-save-failed = Não foi possível guardar a referência.
# The entry as BibLaTeX, as against the form.
library-source = Código
library-source-unread = Não foi possível ler o código.

## A reference, beside the list.

library-pane-label = Referência
library-pane-more = Mais
library-pane-saved = Guardada
library-pane-editing = A alterar…
library-pane-not-saved = Não guardada
library-pane-unread = Não foi possível ler a referência.
library-pane-save-failed = Não foi possível guardar as alterações.
library-pane-note-placeholder = O que pensa dela. Para si: não faz parte do que se cita.
library-pane-files = Ficheiros
library-pane-attach = Anexar
library-pane-attach-title = Anexar ficheiros
library-pane-attach-failed = Não foi possível anexar o ficheiro
# Of a file that is attached, and not where it should be.
library-pane-missing = em falta
library-pane-reveal = Mostrar no gestor de ficheiros
library-pane-reveal-failed = Não foi possível abrir a pasta
library-pane-no-files = Sem ficheiros. Anexe um PDF, ou largue um aqui.
library-pane-detach = Remover o ficheiro
library-pane-detach-title = Remover «{ $name }»?
library-pane-detach-message = O ficheiro é eliminado de onde a biblioteca o guarda, a não ser que outra referência o use.
library-pane-detach-failed = Não foi possível remover o ficheiro
library-pane-leave-collection = Remover de { $name }
library-pane-duplicate = Duplicar
    .hint = Uma nova referência que começa com estes dados
library-pane-edit-source = Alterar o código…
library-pane-source-subtitle = A entrada em BibLaTeX. A maior parte das coisas é mais fácil no formulário.
library-pane-source-failed = Não foi possível mostrar o código
library-pane-added = Acrescentada a { $date }
library-pane-added-changed = Acrescentada a { $added } · alterada a { $changed }

## Looking up a reference.

library-lookup-placeholder = Consultar: um DOI, um ISBN, ou palavras do título e do autor
library-lookup-label = Consultar uma referência
library-lookup-failed = Não foi possível consultar nada.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Preenchida a partir de { $source }.
library-lookup-others = { $count ->
    [one] { $count } outro registo
    [many] { $count } outros registos
   *[other] { $count } outros registos
}
library-lookup-scope = O que procurar
library-lookup-any = Qualquer coisa
library-lookup-books = Livros
library-lookup-articles = Artigos
library-lookup-none = Nada se encontrou. Menos palavras podem encontrar mais: o apelido do autor e uma ou duas palavras do título.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Nada se sabe deste { $kind ->
        [doi] DOI
        [isbn] ISBN
        [arxiv] número do arXiv
       *[pmid] número do PubMed
    } onde foi perguntado. A referência pode escrever-se à mão, abaixo.

## What the writer writes about a work.

library-notes = Notas
library-notes-yours = As suas notas
library-notes-on-work = As suas notas sobre esta obra
library-notes-read = Ler as suas notas
library-notes-write = Escrever uma nota
library-notes-write-on-work = Escrever uma nota sobre esta obra
library-notes-not-in-library = Uma referência que não está na biblioteca
library-notes-this-project = Neste projeto
library-notes-all-projects = Em todos os projetos
library-notes-project-placeholder = O que pensa dela, para este trabalho
library-notes-all-placeholder = O que pensa dela, onde quer que a cite
library-notes-keep-for-all = Guardar para todos os projetos
library-notes-write-for-all = Escrever para todos os projetos
library-notes-carried = A referência veio com o projeto, e não está na biblioteca. O que aqui se escreve fica com todos os que têm o projeto.
library-notes-kept = Guardada com a referência na biblioteca. Acompanha um projeto que cite a obra.
library-notes-unread = Não foi possível ler as suas notas
library-notes-unsaved = Não foi possível guardar a sua nota
