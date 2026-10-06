# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Не вдалося прочитати проєкти

## The view of a project

project-open-failed = Не вдалося відкрити проєкт
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Не вдалося відкрити проєкт.
project-back = Назад до проєктів
project-fetching = Отримання проєкту
project-fetching-offline = Сервер недосяжний. Проєкт буде отримано, коли це стане можливо.
project-fetching-on-the-way = Він уже йде із сервера.
project-all-projects = Усі проєкти
project-name = Назва проєкту
project-rename = Перейменувати проєкт
project-not-saved = Не збережено
project-redo = Повторити дію
project-view = Вигляд мапи
project-view-this = Вигляд цієї мапи
project-diagram = Схема
project-text = Текст
project-one-at-a-time = По одній
project-side-by-side = Дві поруч
project-close-side = Закрити цю частину
project-references = Джерела
project-pictures = Зображення
project-side = Джерела, зображення, історія та зміни
project-side-tabs = Що показує бічна панель
project-side-map = Мапа
project-preview = Перегляд та експорт
project-share = Поділитися
project-shared = Спільний
project-shared-offline = Спільний · сервер недосяжний
project-shared-too-large = Спільний · сервер не приймає останніх змін
project-between-maps = Між двома мапами
project-between-preview = Між мапою та переглядом
project-between-pictures = Між мапою та зображеннями
project-between-references = Між мапою та джерелами

## When the sharing ends from the other side

project-unshared = Проєкт більше не спільний
project-unshared-this = Цей проєкт більше не спільний
project-left-out = Ви більше не серед співавторів
project-unshared-unfetched = Його не було отримано, тож на цьому компʼютері нічого з нього немає.
project-unshared-kept = Той, хто ним поділився, забрав його із сервера. Проєкт залишається у вас таким, як є тепер, і ви можете працювати над ним далі самі.
project-left-out-kept = Проєкт залишається у вас таким, як є тепер, і ви можете працювати над ним далі самі. Те, що інші напишуть після цього, до вас не дійде.
project-understood = Зрозуміло

## Files dropped on the project

project-drop-picture = Киньте зображення на елемент, якому воно належить
project-cited-in = { $count ->
    [one] { $count } джерело процитовано в «{ $name }»
    [few] { $count } джерела процитовано в «{ $name }»
    [many] { $count } джерел процитовано в «{ $name }»
   *[other] { $count } джерела процитовано в «{ $name }»
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] { $count } джерело процитовано в елементі
    [few] { $count } джерела процитовано в елементі
    [many] { $count } джерел процитовано в елементі
   *[other] { $count } джерела процитовано в елементі
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Без назви
# The name of a copy of a map.
project-map-copy = { $name }, копія
project-maps = Мапи
project-map-name = Назва мапи
project-new-map = Нова мапа
project-map-from-document = Мапа з документа…
project-drop-on-map = Киньте на мапу, щоб перемістити туди · тримайте Ctrl, щоб скопіювати
project-duplicate = Дублювати
project-duplicate-hint = Копія для роботи; ця залишається як є
project-open-beside = Відкрити поруч
project-open-beside-hint = Дві мапи поруч, щоб переносити елементи між ними
project-this-map-actions = Ця мапа, і мапи
project-maps-hint = Мапи проєкту: виберіть одну, щоб відкрити
project-map-beside = поруч із цією
project-side-by-side-short = Поруч
project-preview-short = Перегляд
project-found = Знайдені цитування…
# The count is of those found in the map.
project-found-hint = Переглянути й зробити цитуваннями: { $count }
project-found-none = І текст, схожий на цитування
project-delete-map = Видалити мапу
project-delete-map-title = Видалити мапу «{ $name }»?
project-delete-map-message = { $count ->
    [one] { $count } елемент і текст у ньому зникнуть. Це можна скасувати, поки проєкт відкритий.
    [few] { $count } елементи й текст у них зникнуть. Це можна скасувати, поки проєкт відкритий.
    [many] { $count } елементів і текст у них зникнуть. Це можна скасувати, поки проєкт відкритий.
   *[other] { $count } елемента й текст у них зникнуть. Це можна скасувати, поки проєкт відкритий.
}
project-copied-to = Скопійовано до «{ $name }»
project-moved-to = Переміщено до «{ $name }»

## What is done to elements, in the diagram and in the text

project-add-under = Додати елемент під ним
project-add = Додати елемент
project-add-after = Додати елемент після нього
project-write-text = Писати його текст
project-double-click = Подвійне клацання
project-associate = Повʼязати з…
project-associate-hint = Потім клацніть інший елемент
project-heading = Друкувати назву як заголовок
project-heading-hint = Вимкнено: назва — позначка для вас; друкується лише текст
project-leave-out = Не включати в документ
project-leave-out-hint = З усім, що під ним
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Стоїть замість «{ $name }»
project-stand-for = Стояти замість іншої мапи
project-stand-for-heading = У документі на його місці стоїть ця мапа
project-stand-for-none = Жодної
project-copy-to-map = Копіювати до мапи
project-copy = Копіювати
# Pasting what was copied under the element the menu is of.
project-paste-under = Вставити під ним
project-move-to-map = Перемістити до мапи
project-map-from-branch = Нова мапа з цієї гілки
project-map-from-branch-hint = Копія для роботи; ця залишається
project-detach = Відʼєднати від батьківського
project-detach-hint = Вільний елемент, щоб розмістити пізніше
project-tidy-branch = Упорядкувати цю гілку
project-place-automatically = Розмістити автоматично
project-delete-keeping = Видалити, зберігши те, що під ним
project-centre-stays = Центр мапи залишається
project-centre-stays-detail = Саму мапу видаляйте з її вкладки.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] «{ $name }» видалено
    [one] «{ $name }» видалено разом із { $under } елементом під ним
    [few] «{ $name }» видалено разом із { $under } елементами під ним
    [many] «{ $name }» видалено разом із { $under } елементами під ним
   *[other] «{ $name }» видалено разом із { $under } елементами під ним
}
project-deleted-many = { $count ->
    [one] Видалено { $count } елемент
    [few] Видалено { $count } елементи
    [many] Видалено { $count } елементів
   *[other] Видалено { $count } елемента
}

project-delete-busy-title = Тут хтось пише
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] працює
    [few] працюють
    [many] працюють
   *[other] працюють
} над тим, що буде видалено. Те, що там пишеться зараз, пропаде разом із ним, і повернути це не можна.
project-delete-busy-confirm = Усе одно видалити

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Елемент
project-name-placeholder = Назва
project-write-here = Пишіть тут. Наберіть @, щоб цитувати.
project-words = { $count ->
    [one] { $count } слово
    [few] { $count } слова
    [many] { $count } слів
   *[other] { $count } слова
}
project-read-on = Двічі клацніть, щоб читати далі
project-stands-for-map = Стоїть замість мапи «{ $name }»
project-name-not-printed = Назва не друкується
project-left-out-of-document = Не включено в документ

## The panels at the side: the references and the pictures

project-this-map = Ця мапа
project-project = Проєкт
project-library = Бібліотека
project-nothing-found = Нічого не знайдено
project-edit-reference = Редагувати джерело…
project-new-reference = Нове джерело
project-import-file = Імпортувати файл
project-which-references = Які джерела
project-search-references = Шукати джерела
project-library-empty = Ваша бібліотека порожня
project-library-empty-hint = Додайте джерело або імпортуйте ті, що маєте.
project-no-references = Джерел ще немає
project-no-references-hint = Те, що ви цитуєте під час письма, перелічено тут. Щоб процитувати, виберіть «Цитувати» над текстом або наберіть @.
project-cited-in-heading = Цитується в
project-not-cited = Не цитується в цьому проєкті.
project-references-drag = Перетягніть джерело в текст, щоб процитувати його там, або на елемент, щоб процитувати в кінці його тексту.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } із цього проєкту немає у вашій бібліотеці.
    [few] { $count } із цього проєкту немає у вашій бібліотеці.
    [many] { $count } із цього проєкту немає у вашій бібліотеці.
   *[other] { $count } із цього проєкту немає у вашій бібліотеці.
}
# The store of pictures.
project-store = Сховище
project-open-picture = Відкрити…
project-put-into-text = Вставити в текст
project-add-pictures = Додати зображення з файлів
project-which-pictures = Які зображення
project-search-pictures = Шукати зображення
project-a-picture = Зображення
project-with-notes = З нотатками
project-not-on-computer = Немає на цьому компʼютері
project-nothing-said = Про нього ще нічого не сказано
project-store-empty = Сховище порожнє
project-store-empty-hint = Додайте зображення з файлів або киньте їх на текст.
project-no-pictures = Зображень ще немає
project-no-pictures-map = Зображення рисунків цієї мапи перелічено тут. Зображення сховища — під «Сховище».
project-no-pictures-project = Зображення рисунків проєкту перелічено тут. Зображення сховища — під «Сховище».
project-pictures-drag = Перетягніть зображення в текст, щоб зробити там із нього рисунок, або на елемент, щоб поставити його в кінці тексту елемента.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } із цієї мапи немає на цьому компʼютері.
    [few] { $count } із цієї мапи немає на цьому компʼютері.
    [many] { $count } із цієї мапи немає на цьому компʼютері.
   *[other] { $count } із цієї мапи немає на цьому компʼютері.
}
project-pictures-absent-project = { $count ->
    [one] { $count } із цього проєкту немає на цьому компʼютері.
    [few] { $count } із цього проєкту немає на цьому компʼютері.
    [many] { $count } із цього проєкту немає на цьому компʼютері.
   *[other] { $count } із цього проєкту немає на цьому компʼютері.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } елемент
    [few] { $count } елементи
    [many] { $count } елементів
   *[other] { $count } елемента
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } тут
project-link-placeholder = Як вони повʼязані
project-link-label = Підпис звʼязку

## A copy and its original, in another map.
copy-title = Копія та її оригінал
copy-from = Скопійовано з «{ $name }» у мапі «{ $map }»
copy-original-changed = Оригінал змінився, відколи його скопійовано або відколи це востаннє бачили.
copy-original-same = Оригінал такий, яким був, коли його скопійовано.
copy-original-unknown = Чи змінився оригінал, відколи його скопійовано, невідомо: копію зроблено раніше, ніж це почали зберігати.
copy-original-gone = Оригіналу більше немає.
copy-how-shown = Нижче закреслено те, що є лише в оригіналі, а позначено те, що є лише в цій копії.
copy-alike = Їхні назви й тексти однакові. Вони можуть різнитися тим, що не є словами: цитуваннями, зображеннями, накресленнями.
copy-only-original = Лише в оригіналі
copy-only-copy = Лише в цій копії
copy-go = Перейти до оригіналу
copy-seen = Залишити цю копію як є
copy-take = Узяти назву й текст оригіналу
copy-changed-mark = Оригінал змінився, відколи це скопійовано
copy-compare = Порівняти з оригіналом…
copy-copied-from = Скопійовано з «{ $name }» у «{ $map }»
copy-copied-from-changed = Скопійовано з «{ $name }» у «{ $map }», що відтоді змінився

## How far the writing of an element has come, as its writer says.
status = Стан
status-idea = Задум
status-draft = Чернетка
status-done = Готово
status-none = Без стану
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } слово
    [few] { $count } слова
    [many] { $count } слів
   *[other] { $count } слова
}
status-count-idea = { $count ->
    [one] { $count } задум
    [few] { $count } задуми
    [many] { $count } задумів
   *[other] { $count } задуму
}
status-count-draft = { $count ->
    [one] { $count } чернетка
    [few] { $count } чернетки
    [many] { $count } чернеток
   *[other] { $count } чернетки
}
status-count-done = { $count } готово
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } слово написано
    [few] { $count } слова написано
    [many] { $count } слів написано
   *[other] { $count } слова написано
}
status-progress = Наскільки мапа просунулася
