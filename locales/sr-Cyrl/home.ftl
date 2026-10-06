# The projects: the list of them, and what is done with them.

home-title = Пројекти
home-join = Придружи се дељеном пројекту
home-from-document = Пројекат из документа…
home-new = Нови пројекат

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Шта се приказује
home-recent = Последње коришћени
home-all = Сви пројекти
# Under the cards, when there are more projects than they show.
home-show-all = { $count ->
    [one] Прикажи { $count } пројекат
    [few] Прикажи сва { $count } пројекта
   *[other] Прикажи свих { $count } пројеката
}
# The button that opens the menu of the page.
home-page-menu = Још
home-search = Нађи пројекат
home-search-none = Ниједан пројекат се тако не зове.
home-list-none = Нема пројеката.

## Folders of projects

home-new-folder = Нова фасцикла
home-folder-new-inside = Нова фасцикла унутар…
home-folder-rename-title = Преименуј фасциклу
home-folder-name-placeholder = Шта фасцикла садржи
home-folder-name-missing = Дајте фасцикли назив.
home-folder-projects = { $count ->
    [one] { $count } пројекат
    [few] { $count } пројекта
   *[other] { $count } пројеката
}
home-menu-move = Премести у фасциклу
home-menu-out = Ван фасцикли
home-folder-delete-title = Обрисати фасциклу „{ $name }“?
home-folder-delete-message = Фасцикле и пројекти у њој се чувају: премештају се горе, где је фасцикла била.
home-folder-delete-confirm = Обриши фасциклу
home-folder-failed = То није могло да се уради с фасциклом
home-moved-to = „{ $name }“ је премештен у { $folder }
home-moved-out = „{ $name }“ сада није ни у једној фасцикли
home-move-failed = Пројекат није могао да се премести

## A map of the projects

home-map-menu = Мапа пројеката…
home-map-title = Мапа пројеката
home-map-about = Нови пројекат, с једном мапом: фасцикле као елементи, а под сваком фасциклом пројекти у њој.
home-map-name-default = Пројекти
home-map-what = Шта мапа садржи
home-map-names = Само називе
home-map-names-hint = По елемент за сваки пројекат, с његовим описом као текстом.
home-map-everything = Са свиме што је у њима
home-map-everything-hint = Под сваким пројектом његове мапе, а под сваком мапом сви њени елементи, с називима и текстовима.
home-map-note = Цитати задржавају своје референце. Упутница на илустрацију или део не упућује ни на шта у новом пројекту, а коментари остају где су били.
home-map-reading = Читање „{ $name }“…
home-map-working = Прављење мапе…
home-map-make = Направи мапу
home-map-failed = Мапа пројеката није могла да се направи

## When there are none yet

home-welcome = Добро дошли у Glaukopis
home-welcome-text = Пројекат садржи рад на једној књизи или чланку: мапе ваших идеја, текстове које у њих пишете и референце на које се ослањају.
home-begin = Започни пројекат

## A project in the list

# Under the names of the first four maps.
home-more-maps = и још { $count }
home-maps = { $count ->
    [one] { $count } мапа
    [few] { $count } мапе
   *[other] { $count } мапа
}
home-elements = { $count ->
    [one] { $count } елемент
    [few] { $count } елемента
   *[other] { $count } елемената
}
home-words = { $count ->
    [one] { $count } реч
    [few] { $count } речи
   *[other] { $count } речи
}
home-references = { $count ->
    [one] { $count } референца
    [few] { $count } референце
   *[other] { $count } референци
}
home-not-begun = Није започет
home-shared = Дели се
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Измењено { $ago }
# The button that opens the menu of a project.
home-more-for = Још за { $name }
home-deleted-projects = { $count ->
    [one] { $count } обрисан пројекат
    [few] { $count } обрисана пројекта
   *[other] { $count } обрисаних пројеката
}

## The menu of a project

home-menu-rename = Преименуј…
home-menu-duplicate = Удвостручи…
home-menu-history = Раније верзије…

## Naming a project

home-rename-title = Преименуј пројекат
home-duplicate-title = Удвостручи пројекат
home-name = Назив
home-name-placeholder = Радни наслов књиге или чланка
home-name-missing = Дајте пројекту назив.
home-create = Направи
home-duplicate = Удвостручи
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, копија
home-failed = То није успело.

## Deleting a project

home-delete-title = Обрисати „{ $name }“?
home-delete-message = Пројекат се премешта у корпу програма Glaukopis, одакле се може вратити. Ваше референце остају нетакнуте.
home-delete-owner = Пројекат се премешта у корпу програма Glaukopis, одакле се може вратити. Остаје на серверу и код оних с којима га делите; да бисте га скинули са сервера, прво га отворите и престаните да га делите.
home-delete-member = Пројекат се премешта у корпу програма Glaukopis, одакле се може вратити. Остали задржавају своје.
home-delete-confirm = Обриши пројекат
home-deleted = „{ $name }“ је премештен у корпу
home-delete-failed = Пројекат није могао да се обрише

## The trash

home-trash-title = Обрисани пројекти
home-trash-none = Нема их.
home-deleted-ago = Обрисан { $ago }
home-restore = Врати
home-restored = „{ $name }“ је поново међу пројектима
home-restore-failed = Пројекат није могао да се врати
home-purge = Уклони заувек
home-purge-title = Уклонити „{ $name }“ заувек?
home-purge-message = Што пројекат садржи не може се после овога вратити. Ваше референце остају нетакнуте.
home-purge-failed = Пројекат није могао да се уклони

## Earlier versions of a project

home-history-title = Раније верзије
home-history-about = Пројекта „{ $name }“. Верзија се отвара као засебан пројекат; овај остаје какав јесте.
home-history-none = Још ниједна није сачувана. Верзија се чува с времена на време док радите: густо за оно што је скорије, ређе за оно што је старије.
home-history-open = Отвори копију
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, од { $day }
home-history-unread = Раније верзије нису могле да се прочитају
home-history-open-failed = Та верзија није могла да се отвори
