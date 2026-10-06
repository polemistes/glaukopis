# The projects: the list of them, and what is done with them.

home-title = Проєкти
home-join = Приєднатися до спільного проєкту
home-from-document = Проєкт із документа…
home-new = Новий проєкт

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Що показано
home-recent = Останні
home-all = Усі проєкти
# Under the cards, when there are more projects than they show.
home-show-all = { $count ->
    [one] Показати всі { $count } проєкт
    [few] Показати всі { $count } проєкти
    [many] Показати всі { $count } проєктів
   *[other] Показати всі { $count } проєкту
}
# The button that opens the menu of the page.
home-page-menu = Більше
home-search = Знайти проєкт
home-search-none = Проєкту з такою назвою немає.
home-list-none = Проєктів немає.

## Folders of projects

home-new-folder = Нова тека
home-folder-new-inside = Нова тека всередині…
home-folder-rename-title = Перейменувати теку
home-folder-name-placeholder = Що містить тека
home-folder-name-missing = Дайте теці назву.
home-folder-projects = { $count ->
    [one] { $count } проєкт
    [few] { $count } проєкти
    [many] { $count } проєктів
   *[other] { $count } проєкту
}
home-menu-move = Перемістити до теки
home-menu-out = Поза теками
home-folder-delete-title = Видалити теку «{ $name }»?
home-folder-delete-message = Теки й проєкти в ній зберігаються: вони переходять туди, де була тека.
home-folder-delete-confirm = Видалити теку
home-folder-failed = Із текою цього зробити не вдалося
home-moved-to = «{ $name }» переміщено до { $folder }
home-moved-out = «{ $name }» тепер поза теками
home-move-failed = Не вдалося перемістити проєкт

## A map of the projects

home-map-menu = Мапа проєктів…
home-map-title = Мапа проєктів
home-map-about = Новий проєкт з однією мапою: теки як елементи, а під кожною текою — проєкти в ній.
home-map-name-default = Проєкти
home-map-what = Що містить мапа
home-map-names = Лише назви
home-map-names-hint = Елемент для кожного проєкту, з його описом як текстом.
home-map-everything = З усім, що в них
home-map-everything-hint = Під кожним проєктом його мапи, а під кожною мапою всі її елементи, з назвами й текстами.
home-map-note = Цитування зберігають свої джерела. Посилання на рисунок чи частину в новому проєкті ні на що не вказує, а коментарі залишаються.
home-map-reading = Читання «{ $name }»…
home-map-working = Створення мапи…
home-map-make = Створити мапу
home-map-failed = Не вдалося створити мапу проєктів

## When there are none yet

home-welcome = Ласкаво просимо до Glaukopis
home-welcome-text = Проєкт містить роботу над однією книжкою чи статтею: мапи ваших ідей, тексти, які ви в них пишете, і джерела, на які вони спираються.
home-begin = Почати проєкт

## A project in the list

# Under the names of the first four maps.
home-more-maps = і ще { $count }
home-maps = { $count ->
    [one] { $count } мапа
    [few] { $count } мапи
    [many] { $count } мап
   *[other] { $count } мапи
}
home-elements = { $count ->
    [one] { $count } елемент
    [few] { $count } елементи
    [many] { $count } елементів
   *[other] { $count } елемента
}
home-words = { $count ->
    [one] { $count } слово
    [few] { $count } слова
    [many] { $count } слів
   *[other] { $count } слова
}
home-references = { $count ->
    [one] { $count } джерело
    [few] { $count } джерела
    [many] { $count } джерел
   *[other] { $count } джерела
}
home-not-begun = Не розпочато
home-shared = Спільний
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Змінено { $ago }
# The button that opens the menu of a project.
home-more-for = Більше для { $name }
home-deleted-projects = { $count ->
    [one] { $count } видалений проєкт
    [few] { $count } видалені проєкти
    [many] { $count } видалених проєктів
   *[other] { $count } видаленого проєкту
}

## The menu of a project

home-menu-rename = Перейменувати…
home-menu-duplicate = Дублювати…
home-menu-history = Давніші версії…

## Naming a project

home-rename-title = Перейменувати проєкт
home-duplicate-title = Дублювати проєкт
home-name = Назва
home-name-placeholder = Робоча назва книжки чи статті
home-name-missing = Дайте проєкту назву.
home-create = Створити
home-duplicate = Дублювати
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, копія
home-failed = Це не вдалося.

## Deleting a project

home-delete-title = Видалити «{ $name }»?
home-delete-message = Проєкт переміщується до кошика Glaukopis, звідки його можна повернути. Ваші джерела не зачіпаються.
home-delete-owner = Проєкт переміщується до кошика Glaukopis, звідки його можна повернути. Він залишається на сервері й у тих, з ким ви ним ділитеся; щоб забрати його із сервера, спершу відкрийте його й припиніть спільний доступ.
home-delete-member = Проєкт переміщується до кошика Glaukopis, звідки його можна повернути. В інших їхній залишається.
home-delete-confirm = Видалити проєкт
home-deleted = «{ $name }» переміщено до кошика
home-delete-failed = Не вдалося видалити проєкт

## The trash

home-trash-title = Видалені проєкти
home-trash-none = Їх немає.
home-deleted-ago = Видалено { $ago }
home-restore = Повернути
home-restored = «{ $name }» знову серед проєктів
home-restore-failed = Не вдалося повернути проєкт
home-purge = Вилучити назавжди
home-purge-title = Вилучити «{ $name }» назавжди?
home-purge-message = Після цього вміст проєкту повернути вже не можна. Ваші джерела не зачіпаються.
home-purge-failed = Не вдалося вилучити проєкт

## Earlier versions of a project

home-history-title = Давніші версії
home-history-about = Проєкту «{ $name }». Версія відкривається як окремий проєкт; цей залишається як є.
home-history-none = Жодної ще не збережено. Версія зберігається час від часу, поки ви працюєте: часто для недавнього, рідше для давнього.
home-history-open = Відкрити копію
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, станом на { $day }
home-history-unread = Не вдалося прочитати давніші версії
home-history-open-failed = Не вдалося відкрити цю версію
