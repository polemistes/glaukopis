# The projects: the list of them, and what is done with them.

home-title = Projetos
home-join = Juntar-se a um projeto partilhado
home-from-document = Um projeto a partir de um documento…
home-new = Novo projeto

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = O que se mostra
home-recent = Usados há pouco
home-all = Todos os projetos
# Under the cards, when there are more projects than they show.
home-show-all = Mostrar todos os { $count } projetos
# The button that opens the menu of the page.
home-page-menu = Mais
home-search = Encontrar um projeto
home-search-none = Nenhum projeto tem esse nome.
home-list-none = Não há projetos.

## Folders of projects

home-new-folder = Nova pasta
home-folder-new-inside = Nova pasta dentro…
home-folder-rename-title = Mudar o nome da pasta
home-folder-name-placeholder = O que a pasta contém
home-folder-name-missing = Dê um nome à pasta.
home-folder-projects = { $count ->
    [one] { $count } projeto
    [many] { $count } projetos
   *[other] { $count } projetos
}
home-menu-move = Mover para a pasta
home-menu-out = Fora das pastas
home-folder-delete-title = Eliminar a pasta «{ $name }»?
home-folder-delete-message = As pastas e os projetos que contém ficam: sobem para onde a pasta estava.
home-folder-delete-confirm = Eliminar a pasta
home-folder-failed = Não foi possível fazer isso com a pasta
home-moved-to = «{ $name }» foi movido para { $folder }
home-moved-out = «{ $name }» já não está em nenhuma pasta
home-move-failed = Não foi possível mover o projeto

## A map of the projects

home-map-menu = Um mapa dos projetos…
home-map-title = Um mapa dos projetos
home-map-about = Um novo projeto, com um mapa: as pastas como elementos, e sob cada pasta os projetos que contém.
home-map-name-default = Projetos
home-map-what = O que o mapa contém
home-map-names = Só os nomes
home-map-names-hint = Um elemento por projeto, com a sua descrição como texto.
home-map-everything = Com tudo o que têm dentro
home-map-everything-hint = Sob cada projeto os seus mapas, e sob cada mapa todos os seus elementos, com os nomes e os textos.
home-map-note = As citações guardam as suas referências. Uma remissão para uma figura ou uma parte não aponta para nada no novo projeto, e os comentários ficam para trás.
home-map-reading = A ler «{ $name }»…
home-map-working = A fazer o mapa…
home-map-make = Fazer o mapa
home-map-failed = Não foi possível fazer o mapa dos projetos

## When there are none yet

home-welcome = Boas-vindas ao Glaukopis
home-welcome-text = Um projeto contém o trabalho sobre um livro ou um artigo: os mapas das ideias, os textos que neles se escrevem, e as referências em que assentam.
home-begin = Começar um projeto

## A project in the list

# Under the names of the first four maps.
home-more-maps = e mais { $count }
home-maps = { $count ->
    [one] { $count } mapa
    [many] { $count } mapas
   *[other] { $count } mapas
}
home-elements = { $count ->
    [one] { $count } elemento
    [many] { $count } elementos
   *[other] { $count } elementos
}
home-words = { $count ->
    [one] { $count } palavra
    [many] { $count } palavras
   *[other] { $count } palavras
}
home-references = { $count ->
    [one] { $count } referência
    [many] { $count } referências
   *[other] { $count } referências
}
home-not-begun = Por começar
home-shared = Partilhado
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Alterado { $ago }
# The button that opens the menu of a project.
home-more-for = Mais para { $name }
home-deleted-projects = { $count ->
    [one] { $count } projeto eliminado
    [many] { $count } projetos eliminados
   *[other] { $count } projetos eliminados
}

## The menu of a project

home-menu-rename = Mudar o nome…
home-menu-duplicate = Duplicar…
home-menu-history = Versões anteriores…

## Naming a project

home-rename-title = Mudar o nome do projeto
home-duplicate-title = Duplicar o projeto
home-name = Nome
home-name-placeholder = O título de trabalho do livro ou do artigo
home-name-missing = Dê um nome ao projeto.
home-create = Criar
home-duplicate = Duplicar
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, cópia
home-failed = Isso não resultou.

## Deleting a project

home-delete-title = Eliminar «{ $name }»?
home-delete-message = O projeto é movido para o lixo do Glaukopis, de onde pode ser trazido de volta. As referências não são tocadas.
home-delete-owner = O projeto é movido para o lixo do Glaukopis, de onde pode ser trazido de volta. Fica no servidor e com aqueles com quem o partilha; para o tirar do servidor, abra-o e deixe primeiro de o partilhar.
home-delete-member = O projeto é movido para o lixo do Glaukopis, de onde pode ser trazido de volta. Os outros ficam com o deles.
home-delete-confirm = Eliminar o projeto
home-deleted = «{ $name }» foi movido para o lixo
home-delete-failed = Não foi possível eliminar o projeto

## The trash

home-trash-title = Projetos eliminados
home-trash-none = Não há nenhum.
home-deleted-ago = Eliminado { $ago }
home-restore = Trazer de volta
home-restored = «{ $name }» está de volta entre os projetos
home-restore-failed = Não foi possível trazer o projeto de volta
home-purge = Remover de vez
home-purge-title = Remover «{ $name }» de vez?
home-purge-message = O que o projeto contém não pode ser trazido de volta depois disto. As referências não são tocadas.
home-purge-failed = Não foi possível remover o projeto

## Earlier versions of a project

home-history-title = Versões anteriores
home-history-about = De «{ $name }». Uma versão abre-se como projeto próprio; este fica como está.
home-history-none = Ainda não se guardou nenhuma. Uma versão guarda-se de vez em quando enquanto se trabalha: de perto para o recente, mais espaçadamente para o antigo.
home-history-open = Abrir uma cópia
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, em { $day }
home-history-unread = Não foi possível ler as versões anteriores
home-history-open-failed = Não foi possível abrir essa versão
