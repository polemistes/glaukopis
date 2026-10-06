# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = Не удалось прочитать проекты

## The view of a project

project-open-failed = Не удалось открыть проект
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = Не удалось открыть проект.
project-back = Назад к проектам
project-fetching = Получение проекта
project-fetching-offline = Сервер недоступен. Проект будет получен, когда это станет возможно.
project-fetching-on-the-way = Он идёт с сервера.
project-all-projects = Все проекты
project-name = Название проекта
project-rename = Переименовать проект
project-not-saved = Не сохранено
project-redo = Повторить
project-view = Режим карты
project-view-this = Режим этой карты
project-diagram = Схема
project-text = Текст
project-one-at-a-time = По одной
project-side-by-side = Две рядом
project-close-side = Закрыть эту сторону
project-references = Источники
project-pictures = Изображения
project-side = Источники, изображения, история и изменения
project-side-tabs = Что показывает боковая панель
project-side-map = Карта
project-preview = Предпросмотр и экспорт
project-share = Поделиться
project-shared = Совместный
project-shared-offline = Совместный · сервер недоступен
project-shared-too-large = Совместный · сервер не принимает последние изменения
project-between-maps = Между двумя картами
project-between-preview = Между картой и предпросмотром
project-between-pictures = Между картой и изображениями
project-between-references = Между картой и источниками

## When the sharing ends from the other side

project-unshared = Проект больше не совместный
project-unshared-this = Этот проект больше не совместный
project-left-out = Вы больше не среди участников
project-unshared-unfetched = Он не был получен, так что на этом компьютере от него ничего нет.
project-unshared-kept = Тот, кто им поделился, убрал его с сервера. Проект остаётся у вас таким, какой он сейчас, и вы можете работать над ним дальше сами.
project-left-out-kept = Проект остаётся у вас таким, какой он сейчас, и вы можете работать над ним дальше сами. То, что остальные напишут после этого, до вас не дойдёт.
project-understood = Понятно

## Files dropped on the project

project-drop-picture = Перетащите изображение на элемент, к которому оно относится
project-cited-in = { $count ->
    [one] { $count } источник цитируется в «{ $name }»
    [few] { $count } источника цитируются в «{ $name }»
    [many] { $count } источников цитируются в «{ $name }»
   *[other] { $count } источника цитируются в «{ $name }»
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] { $count } источник цитируется в элементе
    [few] { $count } источника цитируются в элементе
    [many] { $count } источников цитируются в элементе
   *[other] { $count } источника цитируются в элементе
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Без названия
# The name of a copy of a map.
project-map-copy = { $name }, копия
project-maps = Карты
project-map-name = Название карты
project-new-map = Новая карта
project-map-from-document = Карта из документа…
project-drop-on-map = Отпустите на карте, чтобы переместить туда · с Ctrl — копировать
project-duplicate = Дублировать
project-duplicate-hint = Копия для работы; эта остаётся как есть
project-open-beside = Открыть рядом
project-open-beside-hint = Две карты рядом, чтобы переносить элементы между ними
project-this-map-actions = Эта карта и карты
project-maps-hint = Карты проекта: выберите одну, чтобы открыть
project-map-beside = рядом с этой
project-side-by-side-short = Рядом
project-preview-short = Предпросмотр
project-found = Найденные ссылки…
# The count is of those found in the map.
project-found-hint = Осталось разобрать и сделать ссылками: { $count }
project-found-none = И текст, похожий на ссылки
project-delete-map = Удалить карту
project-delete-map-title = Удалить карту «{ $name }»?
project-delete-map-message = { $count ->
    [one] Пропадёт { $count } элемент и текст в нём. Это можно отменить, пока проект открыт.
    [few] Пропадут { $count } элемента и текст в них. Это можно отменить, пока проект открыт.
    [many] Пропадут { $count } элементов и текст в них. Это можно отменить, пока проект открыт.
   *[other] Пропадут { $count } элемента и текст в них. Это можно отменить, пока проект открыт.
}
project-copied-to = Скопировано в «{ $name }»
project-moved-to = Перемещено в «{ $name }»

## What is done to elements, in the diagram and in the text

project-add-under = Добавить элемент под ним
project-add = Добавить элемент
project-add-after = Добавить элемент после него
project-write-text = Писать его текст
project-double-click = Двойной щелчок
project-associate = Связать с…
project-associate-hint = Затем щёлкните другой элемент
project-heading = Печатать название как заголовок
project-heading-hint = Выключено: название — ярлык для вас; печатается только текст
project-leave-out = Не включать в документ
project-leave-out-hint = Со всем, что под ним
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Замещает «{ $name }»
project-stand-for = Замещать другую карту
project-stand-for-heading = В документе на его месте стоит эта карта
project-stand-for-none = Никакую
project-copy-to-map = Копировать в карту
project-copy = Копировать
# Pasting what was copied under the element the menu is of.
project-paste-under = Вставить под него
project-move-to-map = Переместить в карту
project-map-from-branch = Новая карта из этой ветви
project-map-from-branch-hint = Копия для работы; эта остаётся
project-detach = Отделить от родителя
project-detach-hint = Свободный элемент, чтобы разместить позже
project-tidy-branch = Прибрать эту ветвь
project-place-automatically = Разместить автоматически
project-delete-keeping = Удалить, сохранив то, что под ним
project-centre-stays = Центр карты остаётся
project-centre-stays-detail = Саму карту удаляйте с её вкладки.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] «{ $name }» удалён
    [one] «{ $name }» удалён вместе с { $under } элементом под ним
    [few] «{ $name }» удалён вместе с { $under } элементами под ним
    [many] «{ $name }» удалён вместе с { $under } элементами под ним
   *[other] «{ $name }» удалён вместе с { $under } элементами под ним
}
project-deleted-many = { $count ->
    [one] Удалён { $count } элемент
    [few] Удалены { $count } элемента
    [many] Удалено { $count } элементов
   *[other] Удалены { $count } элемента
}

project-delete-busy-title = Здесь кто-то пишет
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] работает
    [few] работают
    [many] работают
   *[other] работают
} в том, что будет удалено. То, что там сейчас пишется, пропадёт вместе с ним, и вернуть это будет нельзя.
project-delete-busy-confirm = Всё равно удалить

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Элемент
project-name-placeholder = Название
project-write-here = Пишите здесь. Введите @, чтобы сослаться.
project-words = { $count ->
    [one] { $count } слово
    [few] { $count } слова
    [many] { $count } слов
   *[other] { $count } слова
}
project-read-on = Двойной щелчок — читать дальше
project-stands-for-map = Замещает карту «{ $name }»
project-name-not-printed = Название не печатается
project-left-out-of-document = Не входит в документ

## The panels at the side: the references and the pictures

project-this-map = Эта карта
project-project = Проект
project-library = Библиотека
project-nothing-found = Ничего не найдено
project-edit-reference = Изменить источник…
project-new-reference = Новый источник
project-import-file = Импортировать файл
project-which-references = Какие источники
project-search-references = Поиск источников
project-library-empty = Ваша библиотека пуста
project-library-empty-hint = Добавьте источник или импортируйте те, что у вас есть.
project-no-references = Источников пока нет
project-no-references-hint = То, на что вы ссылаетесь при письме, перечислено здесь. Чтобы сослаться, выберите «Сослаться» над текстом или введите @.
project-cited-in-heading = Цитируется в
project-not-cited = В этом проекте не цитируется.
project-references-drag = Перетащите источник в текст, чтобы сослаться на него там, или на элемент, чтобы сослаться в конце его текста.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count } из этого проекта нет в вашей библиотеке.
# The store of pictures.
project-store = Хранилище
project-open-picture = Открыть…
project-put-into-text = Вставить в текст
project-add-pictures = Добавить изображения из файлов
project-which-pictures = Какие изображения
project-search-pictures = Поиск изображений
project-a-picture = Изображение
project-with-notes = С заметками
project-not-on-computer = Нет на этом компьютере
project-nothing-said = О нём пока ничего не сказано
project-store-empty = Хранилище пусто
project-store-empty-hint = Добавьте изображения из файлов или перетащите их в текст.
project-no-pictures = Изображений пока нет
project-no-pictures-map = Изображения рисунков этой карты перечислены здесь. Изображения хранилища — под «Хранилище».
project-no-pictures-project = Изображения рисунков проекта перечислены здесь. Изображения хранилища — под «Хранилище».
project-pictures-drag = Перетащите изображение в текст, чтобы сделать там рисунок, или на элемент, чтобы поставить его в конце его текста.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count } из этой карты нет на этом компьютере.
project-pictures-absent-project = { $count } из этого проекта нет на этом компьютере.

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } элемент
    [few] { $count } элемента
    [many] { $count } элементов
   *[other] { $count } элемента
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } здесь
project-link-placeholder = Как они связаны
project-link-label = Подпись связи

## A copy and its original, in another map.
copy-title = Копия и оригинал
copy-from = Скопировано из «{ $name }» в карте «{ $map }»
copy-original-changed = Оригинал изменился с тех пор, как был скопирован, или с тех пор, как это видели в последний раз.
copy-original-same = Оригинал таков, каким был при копировании.
copy-original-unknown = Изменился ли оригинал с тех пор, как был скопирован, неизвестно: копия сделана до того, как это стали сохранять.
copy-original-gone = Оригинала больше нет.
copy-how-shown = Ниже зачёркнуто то, что есть только в оригинале, и отмечено то, что есть только в этой копии.
copy-alike = Их названия и тексты совпадают. Они могут различаться в том, что не слова: ссылки, изображения, начертания.
copy-only-original = Только в оригинале
copy-only-copy = Только в этой копии
copy-go = Перейти к оригиналу
copy-seen = Оставить эту копию как есть
copy-take = Взять название и текст оригинала
copy-changed-mark = Оригинал изменился с тех пор, как это было скопировано
copy-compare = Сравнить с оригиналом…
copy-copied-from = Скопировано из «{ $name }» в «{ $map }»
copy-copied-from-changed = Скопировано из «{ $name }» в «{ $map }», который с тех пор изменился

## How far the writing of an element has come, as its writer says.
status = Статус
status-idea = Замысел
status-draft = Черновик
status-done = Готово
status-none = Без статуса
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } слово
    [few] { $count } слова
    [many] { $count } слов
   *[other] { $count } слова
}
status-count-idea = { $count ->
    [one] { $count } замысел
    [few] { $count } замысла
    [many] { $count } замыслов
   *[other] { $count } замысла
}
status-count-draft = { $count ->
    [one] { $count } черновик
    [few] { $count } черновика
    [many] { $count } черновиков
   *[other] { $count } черновика
}
status-count-done = { $count } готово
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } слово написано
    [few] { $count } слова написано
    [many] { $count } слов написано
   *[other] { $count } слова написано
}
status-progress = Как далеко продвинулась карта
