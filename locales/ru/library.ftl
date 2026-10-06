# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Часто используемые
library-form-add-field = Добавить поле
library-form-citation-key = Ключ цитирования
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = из автора и года
library-form-date-problem = Дату пишите как 1979, 1979-05 или 1979-05-12; диапазон — как 1979/1985.
library-form-remove-field = Убрать поле «{ $field }»

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Организация или иное имя целиком
library-names-prefix-suffix = Приставка и суффикс
    .hint = «van», «de la» · «Jr.», «III»
library-names-move-up = Выше
library-names-move-down = Ниже
library-names-more = Ещё для этого имени
library-names-name = Имя целиком
library-names-name-of = { $role }: имя целиком
library-names-family = Фамилия
library-names-family-of = { $role }: фамилия
library-names-given = Имя
library-names-given-of = { $role }: имя
library-names-prefix = Приставка: van, de la
library-names-prefix-of = { $role }: приставка
library-names-suffix = Суффикс: Jr., III
library-names-suffix-of = { $role }: суффикс

## Words for references, wherever they are shown.

library-untitled = Без названия
library-no-author = Без автора
library-no-title = Без названия
library-in-library = В вашей библиотеке

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = тот же DOI
library-reason-isbn = тот же ISBN
library-reason-identical = совпадает во всём, что отличает одну работу от другой
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] те же название, автор и год
            [like] те же название и автор, разница в год
           *[none] те же название и автор, год указан лишь у одной
        }
        [like] { $year ->
            [same] те же название и год, общий автор
            [like] то же название, общий автор, разница в год
           *[none] то же название, общий автор, год указан лишь у одной
        }
       *[none] { $year ->
            [same] те же название и год, автор указан лишь у одной
            [like] то же название, разница в год, автор указан лишь у одной
           *[none] то же название, автор и год указаны лишь у одной
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] те же автор и год, похожее название
            [like] тот же автор, похожее название, разница в год
           *[none] тот же автор, похожее название, год указан лишь у одной
        }
        [like] { $year ->
            [same] тот же год, похожее название, общий автор
            [like] похожее название, общий автор, разница в год
           *[none] похожее название, общий автор, год указан лишь у одной
        }
       *[none] { $year ->
            [same] тот же год, похожее название, автор указан лишь у одной
            [like] похожее название, разница в год, автор указан лишь у одной
           *[none] похожее название, автор и год указаны лишь у одной
        }
    }
}
library-reason-file = тот же файл
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } и { $last }

## The size of a file.

library-size-bytes = { $size } Б
library-size-kilobytes = { $size } кБ
library-size-megabytes = { $size } МБ

## What may be in the library already, while a reference is written.

library-duplicate-certain = Это уже есть в вашей библиотеке.
library-duplicate-probable = Это, возможно, уже есть в вашей библиотеке.
library-duplicate-use = Взять этот

## Duplicates in the library.

library-duplicates-title = Дубликаты
library-duplicates-count = { $count ->
    [one] { $count } источник, похоже, есть в библиотеке не один раз
    [few] { $count } источника, похоже, есть в библиотеке не один раз
    [many] { $count } источников, похоже, есть в библиотеке не один раз
   *[other] { $count } источника, похоже, есть в библиотеке не один раз
}
library-duplicates-none = Дубликатов нет
    .text = Ни один источник, похоже, не встречается в библиотеке дважды.
library-duplicates-no-more = Дубликатов больше нет
    .text = Ссылки на объединённые источники теперь ведут на те, что оставлены.
library-duplicates-how = Когда источники объединяются, тот, который вы оставляете, получает от остальных то, чего ему не хватает, а там, где они расходятся, сохраняет своё. Их файлы и коллекции сводятся вместе, а всё, что на них ссылалось, ссылается на оставленный.
library-duplicates-same = Одно и то же
library-duplicates-probably-same = Вероятно, одно и то же
library-duplicates-keep-which = Какой оставить
library-duplicates-kept = Оставлен
library-duplicates-different = Это разные
library-duplicates-merge = Объединить
library-duplicates-merging = Объединение…
library-duplicates-failed = Не удалось поискать дубликаты в библиотеке
library-duplicates-merge-failed = Не удалось объединить

## Importing references: what a file holds, against what the library has.

library-import = Импорт
library-import-title = Импорт источников
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } источник из { $source }
    [few] { $count } источника из { $source }
    [many] { $count } источников из { $source }
   *[other] { $count } источника из { $source }
}
library-import-review = { $count ->
    [one] { $count } источник, возможно, уже есть в вашей библиотеке
    [few] { $count } источника, возможно, уже есть в вашей библиотеке
    [many] { $count } источников, возможно, уже есть в вашей библиотеке
   *[other] { $count } источника, возможно, уже есть в вашей библиотеке
}
library-import-new = { $count ->
    [one] { $count } новый источник
    [few] { $count } новых источника
    [many] { $count } новых источников
   *[other] { $count } новых источника
}
library-import-complete = { $count ->
    [one] { $count } источник, уже имеющийся в вашей библиотеке, получит дополнения
    [few] { $count } источника, уже имеющихся в вашей библиотеке, получат дополнения
    [many] { $count } источников, уже имеющихся в вашей библиотеке, получат дополнения
   *[other] { $count } источника, уже имеющихся в вашей библиотеке, получат дополнения
}
library-import-known = { $count ->
    [one] { $count } источник уже есть в вашей библиотеке
    [few] { $count } источника уже есть в вашей библиотеке
    [many] { $count } источников уже есть в вашей библиотеке
   *[other] { $count } источника уже есть в вашей библиотеке
}
library-import-repeated = { $count ->
    [one] { $count } источник повторяется внутри импорта
    [few] { $count } источника повторяются внутри импорта
    [many] { $count } источников повторяются внутри импорта
   *[other] { $count } источника повторяются внутри импорта
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Получит: { $fields }
library-import-gains-file = Файл
library-import-gains-zotero = Его ключ в Zotero
library-import-what-to-do = Что делать
library-import-merge = Та же работа: дополнить мой
library-import-skip = Та же работа: оставить мой как есть
library-import-add = Другая работа: добавить
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = Для всех { $count }, что совпадают:
library-import-all-probable = Для всех { $count }, что, вероятно, совпадают:
library-import-all-merge = Дополнить мои
library-import-all-skip = Оставить мои как есть
library-import-all-add = Всё равно добавить все
library-import-more = …и ещё { $count }.
library-import-unread = { $count ->
    [one] { $count } часть файла не удалось прочитать
    [few] { $count } части файла не удалось прочитать
    [many] { $count } частей файла не удалось прочитать
   *[other] { $count } части файла не удалось прочитать
}
library-import-importing = Импорт…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = Добавить { $add }{ $merge ->
        [0] {""}
       *[other] , дополнить { $merge }
    }{ $skip ->
        [0] {""}
       *[other] , пропустить { $skip }
    }
library-import-failed = Импорт не удался.

## The library: the list of references, and what can be done with them.

library-references = Источники
library-unread = Не удалось прочитать библиотеку
library-all-references = Все источники
library-count = { $count ->
    [one] { $count } источник
    [few] { $count } источника
    [many] { $count } источников
   *[other] { $count } источника
}
library-selected = { $count ->
    [one] Выделен { $count } источник
    [few] Выделены { $count } источника
    [many] Выделено { $count } источников
   *[other] Выделены { $count } источника
}
library-selected-of = { $count ->
    [one] Выделено { $selected } из { $count } источника
    [few] Выделено { $selected } из { $count } источников
    [many] Выделено { $selected } из { $count } источников
   *[other] Выделено { $selected } из { $count } источника
}
library-new-reference = Новый источник
library-search = Поиск в библиотеке
library-search-in = Поиск в { $name }
library-search-clear = Очистить поиск
library-sort = Сортировка
library-sort-author = Автор
library-sort-year = Год
library-sort-title = Название
library-sort-added = Дата добавления
library-sort-modified = Дата изменения
library-sort-descending = По убыванию

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Фильтр
library-filters-on = Фильтр: включено { $count }
library-filter-kind = Тип
library-filter-publisher = Издательство
library-filter-publisher-hint = Часть названия
library-filter-any-publisher = Любое издательство
library-filter-year = Год
library-filter-from = С
library-filter-to = По
library-filter-clear = Сбросить фильтры
library-filter-nothing-here = Здесь нечего фильтровать.
# When the filters let nothing through.
library-nothing-passes = Ни один источник из показанных не проходит фильтры.
library-import-export = Импорт и экспорт
library-import-file = Импортировать файл…
    .hint = BibLaTeX или BibTeX
library-paste = Вставить источники…
library-add-pdfs = Добавить файлы PDF…
    .hint = Каждый ищется в сети и сохраняется
library-import-zotero = Импортировать из Zotero…
library-find-duplicates = Найти дубликаты…
library-map-library = Карта библиотеки…
library-map-collection = Карта коллекции «{ $name }»…
library-export-library = Экспортировать библиотеку…
library-export-collection = Экспортировать «{ $name }»…
library-export-one = Экспортировать…
library-export-many = { $count ->
    [one] Экспортировать { $count } источник…
    [few] Экспортировать { $count } источника…
    [many] Экспортировать { $count } источников…
   *[other] Экспортировать { $count } источника…
}
library-export-title = Экспорт источников
# What a file of exported references is called, before it is given a name.
library-export-file-references = источники
library-export-file-library = библиотека
library-exported = { $count ->
    [one] Экспортирован { $count } источник
    [few] Экспортированы { $count } источника
    [many] Экспортировано { $count } источников
   *[other] Экспортированы { $count } источника
}
library-export-failed = Экспорт не удался
library-empty = Ваша библиотека пуста
    .text = Источники, добавленные сюда, доступны во всех ваших проектах. Начните с одного или загрузите те, что у вас уже есть.
library-collection-empty = В этой коллекции пока ничего нет
    .text = Перетащите сюда источники из библиотеки или добавьте новый.
library-nothing-found = Ничего не найдено
    .text = Ни один источник не содержит всех этих слов.
library-open-file = Открыть файл
library-file-open-failed = Не удалось открыть файл
library-add-to-collection = Добавить в коллекцию
library-remove-from = Убрать из «{ $name }»
library-copy-key = Копировать ключ цитирования
library-copied-key = Скопировано: «{ $key }»
library-copy-biblatex = Копировать как BibLaTeX
library-copied = Скопировано
library-delete-one-title = Удалить «{ $name }»?
library-delete-many-title = { $count ->
    [one] Удалить { $count } источник?
    [few] Удалить { $count } источника?
    [many] Удалить { $count } источников?
   *[other] Удалить { $count } источника?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Источник будет убран из вашей библиотеки и из всех коллекций{ $files ->
        [0] {""}
        [one] , вместе с { $files } вложенным файлом
        [few] , вместе с { $files } вложенными файлами
        [many] , вместе с { $files } вложенными файлами
       *[other] , вместе с { $files } вложенными файлами
    }.{ $projects ->
        [0] {""}
        [one] {" "}На него ссылается { $projects } проект, у которого остаётся своя копия.
        [few] {" "}На него ссылаются { $projects } проекта, у которых остаётся своя копия.
        [many] {" "}На него ссылаются { $projects } проектов, у которых остаётся своя копия.
       *[other] {" "}На него ссылаются { $projects } проекта, у которых остаётся своя копия.
    }
library-delete-many = Они будут убраны из вашей библиотеки и из всех коллекций{ $files ->
        [0] {""}
        [one] , вместе с { $files } вложенным файлом
        [few] , вместе с { $files } вложенными файлами
        [many] , вместе с { $files } вложенными файлами
       *[other] , вместе с { $files } вложенными файлами
    }.{ $projects ->
        [0] {""}
        [one] {" "}У { $projects } проекта, который ссылается на некоторые из них, остаётся своя копия тех.
        [few] {" "}У { $projects } проектов, которые ссылаются на некоторые из них, остаётся своя копия тех.
        [many] {" "}У { $projects } проектов, которые ссылаются на некоторые из них, остаётся своя копия тех.
       *[other] {" "}У { $projects } проектов, которые ссылаются на некоторые из них, остаётся своя копия тех.
    }
library-delete-failed = Не удалось удалить источники
library-not-done = Этого не удалось сделать

## Collections.

library-collections = Коллекции
# The projects that cite a work, in its pane.
library-cited-in = Цитируется в
library-not-cited = Не цитируется ни в одном проекте.
library-cited-reading = Чтение проектов…
library-collections-hint = Коллекции собирают источники по теме или по работе. Источник может быть в любом числе коллекций.
library-collection-new = Новая коллекция
library-collection-new-inside = Новая коллекция внутри
library-collection-new-under = Новая коллекция в «{ $name }»
library-collection-move-to = Переместить в
library-collection-name = Название коллекции
library-collection-name-failed = Не удалось назвать коллекцию
library-collection-expand = Развернуть
library-collection-collapse = Свернуть
library-collection-to-top = На верхний уровень
library-collection-move-failed = Не удалось переместить коллекцию
library-collection-added = { $count ->
    [one] { $count } источник добавлен в «{ $name }»
    [few] { $count } источника добавлены в «{ $name }»
    [many] { $count } источников добавлены в «{ $name }»
   *[other] { $count } источника добавлены в «{ $name }»
}
library-collection-already = Уже в «{ $name }»
library-collection-delete = Удалить коллекцию
library-collection-delete-title = Удалить коллекцию «{ $name }»?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Источники остаются в вашей библиотеке.
   *[other] Коллекции внутри неё тоже удаляются. Источники остаются в вашей библиотеке.
}
library-collection-delete-failed = Не удалось удалить коллекцию
library-collection-count = { $count ->
    [one] { $count } коллекция
    [few] { $count } коллекции
    [many] { $count } коллекций
   *[other] { $count } коллекции
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Карта библиотеки
library-map-title-collection = Карта коллекции
# The name a project made of the whole library is given.
library-map-library-name = Библиотека
library-map-name = Название
library-map-name-hint = Название проекта, его карты и элемента в центре карты.
library-map-what-library = Коллекции становятся элементами, вложенными как есть, а каждый источник — элементом под своей коллекцией, текст которого — ссылка на него. Источники вне коллекций стоят в центре.
library-map-what-collection = Коллекции внутри неё становятся элементами, вложенными как есть, а каждый источник — элементом под своей коллекцией, текст которого — ссылка на него.
library-map-nothing = Нет источников, которые можно поместить на карту.
library-map-make = Создать проект
library-map-making = Создание проекта…
library-map-failed = Не удалось создать проект.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } файл
    [few] { $count } файла
    [many] { $count } файлов
   *[other] { $count } файла
}
library-open-failed = Не удалось открыть источник
library-known = { $count ->
    [one] Он уже есть в вашей библиотеке
    [few] Они уже есть в вашей библиотеке
    [many] Они уже есть в вашей библиотеке
   *[other] Они уже есть в вашей библиотеке
}
library-nothing-to-import = Импортировать нечего
library-none-found = Источников не найдено.
library-import-kinds = Источники читаются из файлов .bib и создаются из файлов PDF.
library-filter-bib = BibLaTeX и BibTeX
library-filter-all = Все файлы
library-files-read-failed = { $count ->
    [one] Не удалось прочитать файл
    [few] Не удалось прочитать файлы
    [many] Не удалось прочитать файлы
   *[other] Не удалось прочитать файлы
}
library-text-read-failed = Не удалось прочитать текст
library-add-pdfs-title = Добавить файлы PDF
library-pdfs-working = { $count ->
    [one] Выясняется, что это за файл…
    [few] Выясняется, что это за { $count } файла…
    [many] Выясняется, что это за { $count } файлов…
   *[other] Выясняется, что это за { $count } файла…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } из { $count }: { $name }
library-stop = Остановить
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } источник добавлен
    [few] { $count } источника добавлены
    [many] { $count } источников добавлено
   *[other] { $count } источника добавлены
}
library-imported-completed = { $count } дополнено
library-imported-skipped = { $count } уже в библиотеке
library-imported-files = { $count ->
    [one] { $count } файл сохранён
    [few] { $count } файла сохранены
    [many] { $count } файлов сохранено
   *[other] { $count } файла сохранены
}
library-imported-nothing = Ничего не изменилось
library-paste-title = Вставить источники
library-paste-subtitle = BibLaTeX или BibTeX, сколько угодно записей
library-paste-continue = Продолжить
library-source-label = Исходный текст BibLaTeX

## Importing from Zotero.

library-zotero-title = Импорт из Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = На этом компьютере не найден Zotero в тех местах, где он обычно хранит данные. Если он хранит их в другом месте, покажите где: папку, в которой лежит { $file }.
library-zotero-lead = Импортируемое копируется в вашу библиотеку вместе с файлами. Zotero только читается, и ничего в нём не меняется; он может быть запущен в это время.
library-zotero-choose = Папка данных Zotero
library-zotero-none-there = Там нет Zotero.
library-zotero-unread = Не удалось прочитать Zotero.
library-zotero-library = Библиотека
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Моя библиотека
library-zotero-what = Что импортировать
library-zotero-everything = Всё
library-zotero-with-files = С вложенными файлами
library-zotero-with-notes = С заметками, как замечания
library-zotero-elsewhere = Другое место…
library-zotero-show-where = Показать где…
library-zotero-reading = Чтение…
library-zotero-read = { $count ->
    [0] Прочитать
    [one] Прочитать { $count } источник
    [few] Прочитать { $count } источника
    [many] Прочитать { $count } источников
   *[other] Прочитать { $count } источника
}

## Writing a reference.

library-dialog-edit = Изменить источник
library-dialog-add = Добавить источник
library-dialog-back = Назад к форме
library-dialog-open-failed = Не удалось открыть источник.
library-dialog-save-failed = Не удалось сохранить источник.
# The entry as BibLaTeX, as against the form.
library-source = Исходный текст
library-source-unread = Не удалось прочитать исходный текст.

## A reference, beside the list.

library-pane-label = Источник
library-pane-more = Ещё
library-pane-saved = Сохранено
library-pane-editing = Правка…
library-pane-not-saved = Не сохранено
library-pane-unread = Не удалось прочитать источник.
library-pane-save-failed = Не удалось сохранить изменения.
library-pane-note-placeholder = Что вы об этом думаете. Для себя: это не входит в то, что цитируется.
library-pane-files = Файлы
library-pane-attach = Вложить
library-pane-attach-title = Вложить файлы
library-pane-attach-failed = Не удалось вложить файл
# Of a file that is attached, and not where it should be.
library-pane-missing = отсутствует
library-pane-reveal = Показать в файловом менеджере
library-pane-reveal-failed = Не удалось открыть папку
library-pane-no-files = Файлов нет. Вложите PDF или перетащите его сюда.
library-pane-detach = Убрать файл
library-pane-detach-title = Убрать «{ $name }»?
library-pane-detach-message = Файл удаляется из хранилища библиотеки, если его не использует другой источник.
library-pane-detach-failed = Не удалось убрать файл
library-pane-leave-collection = Убрать из { $name }
library-pane-duplicate = Дублировать
    .hint = Новый источник, начинающийся с этих же сведений
library-pane-edit-source = Изменить исходный текст…
library-pane-source-subtitle = Запись как BibLaTeX. Большинство вещей проще сделать в форме.
library-pane-source-failed = Не удалось показать исходный текст
library-pane-added = Добавлен { $date }
library-pane-added-changed = Добавлен { $added } · изменён { $changed }

## Looking up a reference.

library-lookup-placeholder = Найти в сети: DOI, ISBN или слова из названия и автор
library-lookup-label = Найти источник в сети
library-lookup-failed = Ничего найти не удалось.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Заполнено из { $source }.
library-lookup-others = { $count ->
    [one] Ещё { $count } запись
    [few] Ещё { $count } записи
    [many] Ещё { $count } записей
   *[other] Ещё { $count } записи
}
library-lookup-scope = Что искать
library-lookup-any = Что угодно
library-lookup-books = Книги
library-lookup-articles = Статьи
library-lookup-none = Ничего не найдено. Меньше слов могут найти больше: фамилия автора и одно-два слова из названия.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Об этом { $kind ->
        [doi] DOI
        [isbn] ISBN
        [arxiv] номере arXiv
       *[pmid] номере PubMed
    } ничего не известно там, где его спрашивали. Источник можно ввести вручную ниже.

## What the writer writes about a work.

library-notes = Заметки
library-notes-yours = Ваши заметки
library-notes-on-work = Ваши заметки об этой работе
library-notes-read = Прочитать ваши заметки
library-notes-write = Написать заметку
library-notes-write-on-work = Написать заметку об этой работе
library-notes-not-in-library = Источник, которого нет в вашей библиотеке
library-notes-this-project = В этом проекте
library-notes-all-projects = Во всех проектах
library-notes-project-placeholder = Что вы об этом думаете, для этой работы
library-notes-all-placeholder = Что вы об этом думаете, где бы вы её ни цитировали
library-notes-keep-for-all = Хранить для всех проектов
library-notes-write-for-all = Написать для всех проектов
library-notes-carried = Источник пришёл вместе с проектом, и его нет в вашей библиотеке. Написанное здесь есть у всех, у кого есть проект.
library-notes-kept = Хранится с источником в вашей библиотеке. Идёт вместе с проектом, который цитирует работу.
library-notes-unread = Не удалось прочитать ваши заметки
library-notes-unsaved = Не удалось сохранить вашу заметку
