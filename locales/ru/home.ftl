# The projects: the list of them, and what is done with them.

home-title = Проекты
home-join = Присоединиться к совместному проекту
home-from-document = Проект из документа…
home-new = Новый проект

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Что показывать
home-recent = Недавние
home-all = Все проекты
# Under the cards, when there are more projects than they show.
home-show-all = Показать все проекты ({ $count })
# The button that opens the menu of the page.
home-page-menu = Ещё
home-search = Найти проект
home-search-none = Проекта с таким названием нет.
home-list-none = Проектов нет.

## Folders of projects

home-new-folder = Новая папка
home-folder-new-inside = Новая папка внутри…
home-folder-rename-title = Переименовать папку
home-folder-name-placeholder = Что лежит в папке
home-folder-name-missing = Дайте папке название.
home-folder-projects = { $count ->
    [one] { $count } проект
    [few] { $count } проекта
    [many] { $count } проектов
   *[other] { $count } проекта
}
home-menu-move = Переместить в папку
home-menu-out = Вне папок
home-folder-delete-title = Удалить папку «{ $name }»?
home-folder-delete-message = Папки и проекты в ней сохраняются: они поднимаются туда, где была папка.
home-folder-delete-confirm = Удалить папку
home-folder-failed = Этого не удалось сделать с папкой
home-moved-to = «{ $name }» перемещён в { $folder }
home-moved-out = «{ $name }» теперь вне папок
home-move-failed = Не удалось переместить проект

## A map of the projects

home-map-menu = Карта проектов…
home-map-title = Карта проектов
home-map-about = Новый проект с одной картой: папки как элементы, а под каждой папкой — проекты в ней.
home-map-name-default = Проекты
home-map-what = Что входит в карту
home-map-names = Только названия
home-map-names-hint = Элемент для каждого проекта, с его описанием в качестве текста.
home-map-everything = Со всем содержимым
home-map-everything-hint = Под каждым проектом его карты, а под каждой картой все её элементы с названиями и текстами.
home-map-note = Ссылки сохраняют свои источники. Перекрёстная ссылка на рисунок или часть в новом проекте ни на что не указывает, а комментарии остаются позади.
home-map-reading = Чтение «{ $name }»…
home-map-working = Создание карты…
home-map-make = Создать карту
home-map-failed = Не удалось создать карту проектов

## When there are none yet

home-welcome = Добро пожаловать в Glaukopis
home-welcome-text = Проект хранит работу над одной книгой или статьёй: карты ваших мыслей, тексты, которые вы в них пишете, и источники, на которые они опираются.
home-begin = Начать проект

## A project in the list

# Under the names of the first four maps.
home-more-maps = и ещё { $count }
home-maps = { $count ->
    [one] { $count } карта
    [few] { $count } карты
    [many] { $count } карт
   *[other] { $count } карты
}
home-elements = { $count ->
    [one] { $count } элемент
    [few] { $count } элемента
    [many] { $count } элементов
   *[other] { $count } элемента
}
home-words = { $count ->
    [one] { $count } слово
    [few] { $count } слова
    [many] { $count } слов
   *[other] { $count } слова
}
home-references = { $count ->
    [one] { $count } источник
    [few] { $count } источника
    [many] { $count } источников
   *[other] { $count } источника
}
home-not-begun = Не начат
home-shared = Совместный
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Изменён { $ago }
# The button that opens the menu of a project.
home-more-for = Ещё для { $name }
home-deleted-projects = { $count ->
    [one] { $count } удалённый проект
    [few] { $count } удалённых проекта
    [many] { $count } удалённых проектов
   *[other] { $count } удалённых проекта
}

## The menu of a project

home-menu-rename = Переименовать…
home-menu-duplicate = Дублировать…
home-menu-history = Прежние версии…

## Naming a project

home-rename-title = Переименовать проект
home-duplicate-title = Дублировать проект
home-name = Название
home-name-placeholder = Рабочее название книги или статьи
home-name-missing = Дайте проекту название.
home-create = Создать
home-duplicate = Дублировать
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, копия
home-failed = Не получилось.

## Deleting a project

home-delete-title = Удалить «{ $name }»?
home-delete-message = Проект перемещается в корзину Glaukopis, откуда его можно вернуть. Ваши источники не затрагиваются.
home-delete-owner = Проект перемещается в корзину Glaukopis, откуда его можно вернуть. Он остаётся на сервере и у тех, кому вы его открыли; чтобы убрать его с сервера, сначала откройте его и закройте доступ.
home-delete-member = Проект перемещается в корзину Glaukopis, откуда его можно вернуть. У остальных их копии остаются.
home-delete-confirm = Удалить проект
home-deleted = «{ $name }» перемещён в корзину
home-delete-failed = Не удалось удалить проект

## The trash

home-trash-title = Удалённые проекты
home-trash-none = Их нет.
home-deleted-ago = Удалён { $ago }
home-restore = Вернуть
home-restored = «{ $name }» снова среди проектов
home-restore-failed = Не удалось вернуть проект
home-purge = Удалить навсегда
home-purge-title = Удалить «{ $name }» навсегда?
home-purge-message = После этого содержимое проекта вернуть будет нельзя. Ваши источники не затрагиваются.
home-purge-failed = Не удалось удалить проект

## Earlier versions of a project

home-history-title = Прежние версии
home-history-about = Проекта «{ $name }». Версия открывается как отдельный проект; этот остаётся как есть.
home-history-none = Пока ни одной не сохранено. Версия сохраняется время от времени, пока вы работаете: часто для недавнего, реже для старого.
home-history-open = Открыть копию
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, на { $day }
home-history-unread = Не удалось прочитать прежние версии
home-history-open-failed = Не удалось открыть эту версию
