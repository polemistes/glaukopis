# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Часто вживані
library-form-add-field = Додати поле
library-form-citation-key = Ключ цитування
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = складається з автора й року
library-form-date-problem = Пишіть дату як 1979, 1979-05 або 1979-05-12; проміжок — як 1979/1985.
library-form-remove-field = Вилучити { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Установа або інша назва, що береться цілою
library-names-prefix-suffix = Префікс і суфікс
    .hint = «van», «de la» · «Jr.», «III»
library-names-move-up = Угору
library-names-move-down = Униз
library-names-more = Більше для цього імені
library-names-name = Назва
library-names-name-of = { $role }: назва
library-names-family = Прізвище
library-names-family-of = { $role }: прізвище
library-names-given = Імена
library-names-given-of = { $role }: імена
library-names-prefix = Префікс: van, de la
library-names-prefix-of = { $role }: префікс
library-names-suffix = Суфікс: Jr., III
library-names-suffix-of = { $role }: суфікс

## Words for references, wherever they are shown.

library-untitled = Без назви
library-no-author = Без автора
library-no-title = Без назви
library-in-library = У вашій бібліотеці

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = той самий DOI
library-reason-isbn = той самий ISBN
library-reason-identical = збігаються в усьому, що відрізняє одну працю від іншої
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] ті самі назва, автор і рік
            [like] ті самі назва й автор, роки різняться на один
           *[none] ті самі назва й автор, рік лише в одного
        }
        [like] { $year ->
            [same] ті самі назва й рік, спільний автор
            [like] та сама назва, спільний автор, роки різняться на один
           *[none] та сама назва, спільний автор, рік лише в одного
        }
       *[none] { $year ->
            [same] ті самі назва й рік, автор лише в одного
            [like] та сама назва, роки різняться на один, автор лише в одного
           *[none] та сама назва, автор і рік лише в одного
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] ті самі автор і рік, схожа назва
            [like] той самий автор, схожа назва, роки різняться на один
           *[none] той самий автор, схожа назва, рік лише в одного
        }
        [like] { $year ->
            [same] той самий рік, схожа назва, спільний автор
            [like] схожа назва, спільний автор, роки різняться на один
           *[none] схожа назва, спільний автор, рік лише в одного
        }
       *[none] { $year ->
            [same] той самий рік, схожа назва, автор лише в одного
            [like] схожа назва, роки різняться на один, автор лише в одного
           *[none] схожа назва, автор і рік лише в одного
        }
    }
}
library-reason-file = той самий файл
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } і { $last }

## The size of a file.

library-size-bytes = { $size } Б
library-size-kilobytes = { $size } кБ
library-size-megabytes = { $size } МБ

## What may be in the library already, while a reference is written.

library-duplicate-certain = Це вже є у вашій бібліотеці.
library-duplicate-probable = Це, можливо, вже є у вашій бібліотеці.
library-duplicate-use = Узяти це

## Duplicates in the library.

library-duplicates-title = Дублікати
library-duplicates-count = { $count ->
    [one] { $count } джерело, здається, є в бібліотеці більше ніж раз
    [few] { $count } джерела, здається, є в бібліотеці більше ніж раз
    [many] { $count } джерел, здається, є в бібліотеці більше ніж раз
   *[other] { $count } джерела, здається, є в бібліотеці більше ніж раз
}
library-duplicates-none = Дублікатів немає
    .text = Жодне джерело, здається, не трапляється в бібліотеці більше ніж раз.
library-duplicates-no-more = Дублікатів більше немає
    .text = Цитування обʼєднаних джерел тепер цитують ті, що залишені.
library-duplicates-how = Коли джерела обʼєднуються в одне, те, яке ви залишаєте, дістає від інших те, чого йому бракує, а там, де вони різняться, зберігає своє. Їхні файли й колекції зводяться докупи, а те, що їх цитує, цитує залишене.
library-duplicates-same = Ті самі
library-duplicates-probably-same = Імовірно, ті самі
library-duplicates-keep-which = Яке залишити
library-duplicates-kept = Залишено
library-duplicates-different = Вони різні
library-duplicates-merge = Обʼєднати
library-duplicates-merging = Обʼєднання…
library-duplicates-failed = Не вдалося пошукати дублікати в бібліотеці
library-duplicates-merge-failed = Не вдалося їх обʼєднати

## Importing references: what a file holds, against what the library has.

library-import = Імпорт
library-import-title = Імпортувати джерела
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } джерело у { $source }
    [few] { $count } джерела у { $source }
    [many] { $count } джерел у { $source }
   *[other] { $count } джерела у { $source }
}
library-import-review = { $count ->
    [one] { $count } джерело, можливо, вже є у вашій бібліотеці
    [few] { $count } джерела, можливо, вже є у вашій бібліотеці
    [many] { $count } джерел, можливо, вже є у вашій бібліотеці
   *[other] { $count } джерела, можливо, вже є у вашій бібліотеці
}
library-import-new = { $count ->
    [one] { $count } нове джерело
    [few] { $count } нові джерела
    [many] { $count } нових джерел
   *[other] { $count } нового джерела
}
library-import-complete = { $count ->
    [one] { $count } джерело, що вже є у вашій бібліотеці, дістає відомості
    [few] { $count } джерела, що вже є у вашій бібліотеці, дістають відомості
    [many] { $count } джерел, що вже є у вашій бібліотеці, дістають відомості
   *[other] { $count } джерела, що вже є у вашій бібліотеці, дістають відомості
}
library-import-known = { $count ->
    [one] { $count } джерело вже є у вашій бібліотеці
    [few] { $count } джерела вже є у вашій бібліотеці
    [many] { $count } джерел уже є у вашій бібліотеці
   *[other] { $count } джерела вже є у вашій бібліотеці
}
library-import-repeated = { $count ->
    [one] { $count } джерело повторюється в імпорті
    [few] { $count } джерела повторюються в імпорті
    [many] { $count } джерел повторюються в імпорті
   *[other] { $count } джерела повторюється в імпорті
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Дістане: { $fields }
library-import-gains-file = Файл
library-import-gains-zotero = Його ключ у Zotero
library-import-what-to-do = Що робити
library-import-merge = Та сама праця: доповнити моє
library-import-skip = Та сама праця: залишити моє як є
library-import-add = Інша праця: додати
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = Для всіх { $count }, що ті самі:
library-import-all-probable = Для всіх { $count }, що, ймовірно, ті самі:
library-import-all-merge = Доповнити мої
library-import-all-skip = Залишити мої як є
library-import-all-add = Усе одно додати всі
library-import-more = …і ще { $count }.
library-import-unread = { $count ->
    [one] { $count } частину файлу не вдалося прочитати
    [few] { $count } частини файлу не вдалося прочитати
    [many] { $count } частин файлу не вдалося прочитати
   *[other] { $count } частини файлу не вдалося прочитати
}
library-import-importing = Імпортування…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = додати: { $add }{ $merge ->
        [0] {""}
       *[other] , доповнити: { $merge }
    }{ $skip ->
        [0] {""}
       *[other] , пропустити: { $skip }
    }
library-import-failed = Імпорт не вдався.

## The library: the list of references, and what can be done with them.

library-references = Джерела
library-unread = Не вдалося прочитати бібліотеку
library-all-references = Усі джерела
library-count = { $count ->
    [one] { $count } джерело
    [few] { $count } джерела
    [many] { $count } джерел
   *[other] { $count } джерела
}
library-selected = { $count ->
    [one] Виділено { $count } джерело
    [few] Виділено { $count } джерела
    [many] Виділено { $count } джерел
   *[other] Виділено { $count } джерела
}
library-selected-of = { $count ->
    [one] Виділено { $selected } з { $count } джерела
    [few] Виділено { $selected } з { $count } джерел
    [many] Виділено { $selected } з { $count } джерел
   *[other] Виділено { $selected } з { $count } джерела
}
library-new-reference = Нове джерело
library-search = Шукати в бібліотеці
library-search-in = Шукати в { $name }
library-search-clear = Очистити пошук
library-sort = Сортувати
library-sort-author = Автор
library-sort-year = Рік
library-sort-title = Назва
library-sort-added = Дата додавання
library-sort-modified = Дата зміни
library-sort-descending = За спаданням

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Фільтр
library-filters-on = { $count ->
    [one] Фільтр: увімкнено { $count }
    [few] Фільтр: увімкнено { $count }
    [many] Фільтр: увімкнено { $count }
   *[other] Фільтр: увімкнено { $count }
}
library-filter-kind = Вид
library-filter-publisher = Видавець
library-filter-publisher-hint = Частина назви
library-filter-any-publisher = Будь-який видавець
library-filter-year = Рік
library-filter-from = Від
library-filter-to = До
library-filter-clear = Скинути фільтри
library-filter-nothing-here = Тут нема що фільтрувати.
# When the filters let nothing through.
library-nothing-passes = Жодне джерело з показаних не проходить фільтри.
library-import-export = Імпорт та експорт
library-import-file = Імпортувати файл…
    .hint = BibLaTeX або BibTeX
library-paste = Вставити джерела…
library-add-pdfs = Додати файли PDF…
    .hint = Про кожен шукаються відомості, і він зберігається
library-import-zotero = Імпортувати із Zotero…
library-find-duplicates = Знайти дублікати…
library-map-library = Мапа бібліотеки…
library-map-collection = Мапа «{ $name }»…
library-export-library = Експортувати бібліотеку…
library-export-collection = Експортувати «{ $name }»…
library-export-one = Експортувати…
library-export-many = { $count ->
    [one] Експортувати { $count } джерело…
    [few] Експортувати { $count } джерела…
    [many] Експортувати { $count } джерел…
   *[other] Експортувати { $count } джерела…
}
library-export-title = Експортувати джерела
# What a file of exported references is called, before it is given a name.
library-export-file-references = джерела
library-export-file-library = бібліотека
library-exported = { $count ->
    [one] Експортовано { $count } джерело
    [few] Експортовано { $count } джерела
    [many] Експортовано { $count } джерел
   *[other] Експортовано { $count } джерела
}
library-export-failed = Експорт не вдався
library-empty = Ваша бібліотека порожня
    .text = Джерела, які ви додаєте сюди, доступні в усіх ваших проєктах. Почніть з одного або внесіть ті, що вже маєте.
library-collection-empty = У цій колекції ще нічого немає
    .text = Перетягніть сюди джерела з бібліотеки або додайте нове.
library-nothing-found = Нічого не знайдено
    .text = Жодне джерело не містить усіх цих слів.
library-open-file = Відкрити файл
library-file-open-failed = Не вдалося відкрити файл
library-add-to-collection = Додати до колекції
library-remove-from = Вилучити з «{ $name }»
library-copy-key = Копіювати ключ цитування
library-copied-key = Скопійовано «{ $key }»
library-copy-biblatex = Копіювати як BibLaTeX
library-copied = Скопійовано
library-delete-one-title = Видалити «{ $name }»?
library-delete-many-title = { $count ->
    [one] Видалити { $count } джерело?
    [few] Видалити { $count } джерела?
    [many] Видалити { $count } джерел?
   *[other] Видалити { $count } джерела?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Це вилучає джерело з вашої бібліотеки, з усіх колекцій{ $files ->
        [0] {""}
        [one] , разом із { $files } вкладеним файлом
        [few] , разом із { $files } вкладеними файлами
        [many] , разом із { $files } вкладеними файлами
       *[other] , разом із { $files } вкладеними файлами
    }.{ $projects ->
        [0] {""}
        [one] {" "}Воно цитується в { $projects } проєкті, який зберігає його копію.
        [few] {" "}Воно цитується в { $projects } проєктах, які зберігають його копію.
        [many] {" "}Воно цитується в { $projects } проєктах, які зберігають його копію.
       *[other] {" "}Воно цитується в { $projects } проєктах, які зберігають його копію.
    }
library-delete-many = Це вилучає їх з вашої бібліотеки, з усіх колекцій{ $files ->
        [0] {""}
        [one] , разом із { $files } вкладеним файлом
        [few] , разом із { $files } вкладеними файлами
        [many] , разом із { $files } вкладеними файлами
       *[other] , разом із { $files } вкладеними файлами
    }.{ $projects ->
        [0] {""}
        [one] {" "}{ $projects } проєкт, який цитує деякі з них, зберігає їхні копії.
        [few] {" "}{ $projects } проєкти, які цитують деякі з них, зберігають їхні копії.
        [many] {" "}{ $projects } проєктів, які цитують деякі з них, зберігають їхні копії.
       *[other] {" "}{ $projects } проєкту, які цитують деякі з них, зберігають їхні копії.
    }
library-delete-failed = Не вдалося видалити джерела
library-not-done = Цього не вдалося зробити

## Collections.

library-collections = Колекції
# The projects that cite a work, in its pane.
library-cited-in = Цитується в
library-not-cited = Не цитується в жодному проєкті.
library-cited-reading = Читання проєктів…
library-collections-hint = Колекції збирають джерела для теми або праці. Джерело може бути в будь-якій кількості їх.
library-collection-new = Нова колекція
library-collection-new-inside = Нова колекція всередині
library-collection-new-under = Нова колекція в «{ $name }»
library-collection-move-to = Перемістити до
library-collection-name = Назва колекції
library-collection-name-failed = Не вдалося назвати колекцію
library-collection-expand = Розгорнути
library-collection-collapse = Згорнути
library-collection-to-top = Перемістити на верхній рівень
library-collection-move-failed = Не вдалося перемістити колекцію
library-collection-added = { $count ->
    [one] { $count } джерело додано до «{ $name }»
    [few] { $count } джерела додано до «{ $name }»
    [many] { $count } джерел додано до «{ $name }»
   *[other] { $count } джерела додано до «{ $name }»
}
library-collection-already = Уже в «{ $name }»
library-collection-delete = Видалити колекцію
library-collection-delete-title = Видалити колекцію «{ $name }»?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Джерела залишаються у вашій бібліотеці.
   *[other] Колекції всередині неї також видаляються. Джерела залишаються у вашій бібліотеці.
}
library-collection-delete-failed = Не вдалося видалити колекцію
library-collection-count = { $count ->
    [one] { $count } колекція
    [few] { $count } колекції
    [many] { $count } колекцій
   *[other] { $count } колекції
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Мапа бібліотеки
library-map-title-collection = Мапа колекції
# The name a project made of the whole library is given.
library-map-library-name = Бібліотека
library-map-name = Назва
library-map-name-hint = Назва проєкту, його мапи та елемента в центрі мапи.
library-map-what-library = Колекції стають елементами, вкладеними як є, а кожне джерело — елементом під своєю колекцією, текст якого — цитування цього джерела. Джерела поза колекціями стоять у центрі.
library-map-what-collection = Колекції всередині неї стають елементами, вкладеними як є, а кожне джерело — елементом під своєю колекцією, текст якого — цитування цього джерела.
library-map-nothing = Немає джерел, які можна покласти на мапу.
library-map-make = Створити проєкт
library-map-making = Створення проєкту…
library-map-failed = Не вдалося створити проєкт.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } файл
    [few] { $count } файли
    [many] { $count } файлів
   *[other] { $count } файлу
}
library-open-failed = Не вдалося відкрити джерело
library-known = { $count ->
    [one] Воно вже є у вашій бібліотеці
    [few] Вони вже є у вашій бібліотеці
    [many] Вони вже є у вашій бібліотеці
   *[other] Вони вже є у вашій бібліотеці
}
library-nothing-to-import = Нема чого імпортувати
library-none-found = Джерел не знайдено.
library-import-kinds = Джерела читаються з файлів .bib і робляться з файлів PDF.
library-filter-bib = BibLaTeX і BibTeX
library-filter-all = Усі файли
library-files-read-failed = { $count ->
    [one] Не вдалося прочитати файл
    [few] Не вдалося прочитати файли
    [many] Не вдалося прочитати файли
   *[other] Не вдалося прочитати файли
}
library-text-read-failed = Не вдалося прочитати текст
library-add-pdfs-title = Додати файли PDF
library-pdfs-working = { $count ->
    [one] Зʼясування, що це за { $count } файл…
    [few] Зʼясування, що це за { $count } файли…
    [many] Зʼясування, що це за { $count } файлів…
   *[other] Зʼясування, що це за { $count } файлу…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } з { $count }: { $name }
library-stop = Зупинити
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } джерело додано
    [few] { $count } джерела додано
    [many] { $count } джерел додано
   *[other] { $count } джерела додано
}
library-imported-completed = { $count } доповнено
library-imported-skipped = { $count } уже в бібліотеці
library-imported-files = { $count ->
    [one] { $count } файл збережено
    [few] { $count } файли збережено
    [many] { $count } файлів збережено
   *[other] { $count } файлу збережено
}
library-imported-nothing = Нічого не змінено
library-paste-title = Вставити джерела
library-paste-subtitle = BibLaTeX або BibTeX, скільки завгодно записів
library-paste-continue = Далі
library-source-label = Код BibLaTeX

## Importing from Zotero.

library-zotero-title = Імпортувати із Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = На цьому компʼютері не знайдено Zotero в місцях, де він зазвичай тримає свої дані. Якщо він тримає їх деінде, покажіть де: теку, що містить { $file }.
library-zotero-lead = Імпортоване копіюється до вашої бібліотеки разом із файлами. Zotero лише читається, і нічого в ньому не змінюється; він може тим часом працювати.
library-zotero-choose = Тека даних Zotero
library-zotero-none-there = Там немає Zotero.
library-zotero-unread = Не вдалося прочитати Zotero.
library-zotero-library = Бібліотека
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Моя бібліотека
library-zotero-what = Що імпортувати
library-zotero-everything = Усе
library-zotero-with-files = Із вкладеними файлами
library-zotero-with-notes = Із нотатками, як анотаціями
library-zotero-elsewhere = Інше місце…
library-zotero-show-where = Показати де…
library-zotero-reading = Читання…
library-zotero-read = { $count ->
    [0] Прочитати
    [one] Прочитати { $count } джерело
    [few] Прочитати { $count } джерела
    [many] Прочитати { $count } джерел
   *[other] Прочитати { $count } джерела
}

## Writing a reference.

library-dialog-edit = Редагувати джерело
library-dialog-add = Додати джерело
library-dialog-back = Назад до форми
library-dialog-open-failed = Не вдалося відкрити джерело.
library-dialog-save-failed = Не вдалося зберегти джерело.
# The entry as BibLaTeX, as against the form.
library-source = Код
library-source-unread = Не вдалося прочитати код.

## A reference, beside the list.

library-pane-label = Джерело
library-pane-more = Більше
library-pane-saved = Збережено
library-pane-editing = Редагування…
library-pane-not-saved = Не збережено
library-pane-unread = Не вдалося прочитати джерело.
library-pane-save-failed = Не вдалося зберегти зміни.
library-pane-note-placeholder = Що ви про нього думаєте. Для себе: це не частина цитованого.
library-pane-files = Файли
library-pane-attach = Вкласти
library-pane-attach-title = Вкласти файли
library-pane-attach-failed = Не вдалося вкласти файл
# Of a file that is attached, and not where it should be.
library-pane-missing = відсутній
library-pane-reveal = Показати у файловому менеджері
library-pane-reveal-failed = Не вдалося відкрити теку
library-pane-no-files = Файлів немає. Вкладіть PDF або перетягніть його сюди.
library-pane-detach = Вилучити файл
library-pane-detach-title = Вилучити «{ $name }»?
library-pane-detach-message = Файл видаляється зі сховища бібліотеки, якщо ним не користується інше джерело.
library-pane-detach-failed = Не вдалося вилучити файл
library-pane-leave-collection = Вилучити з { $name }
library-pane-duplicate = Дублювати
    .hint = Нове джерело, що починається з цих відомостей
library-pane-edit-source = Редагувати код…
library-pane-source-subtitle = Запис як BibLaTeX. Більшість речей простіше зробити у формі.
library-pane-source-failed = Не вдалося показати код
library-pane-added = Додано { $date }
library-pane-added-changed = Додано { $added } · змінено { $changed }

## Looking up a reference.

library-lookup-placeholder = Знайти відомості: DOI, ISBN або слова з назви й автора
library-lookup-label = Знайти відомості про джерело
library-lookup-failed = Нічого не вдалося знайти.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Заповнено з { $source }.
library-lookup-others = { $count ->
    [one] Ще { $count } запис
    [few] Ще { $count } записи
    [many] Ще { $count } записів
   *[other] Ще { $count } запису
}
library-lookup-scope = Що шукати
library-lookup-any = Будь-що
library-lookup-books = Книжки
library-lookup-articles = Статті
library-lookup-none = Нічого не знайдено. Менше слів може знайти більше: прізвище автора й слово-два з назви.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Про цей { $kind ->
        [doi] DOI
        [isbn] ISBN
        [arxiv] номер arXiv
       *[pmid] номер PubMed
    } нічого не відомо там, де питали. Джерело можна ввести вручну нижче.

## What the writer writes about a work.

library-notes = Нотатки
library-notes-yours = Ваші нотатки
library-notes-on-work = Ваші нотатки про цю працю
library-notes-read = Читати ваші нотатки
library-notes-write = Написати нотатку
library-notes-write-on-work = Написати нотатку про цю працю
library-notes-not-in-library = Джерело, якого немає у вашій бібліотеці
library-notes-this-project = У цьому проєкті
library-notes-all-projects = В усіх проєктах
library-notes-project-placeholder = Що ви про неї думаєте, для цієї праці
library-notes-all-placeholder = Що ви про неї думаєте, де б ви її не цитували
library-notes-keep-for-all = Зберегти для всіх проєктів
library-notes-write-for-all = Писати для всіх проєктів
library-notes-carried = Джерело прийшло з проєктом, і його немає у вашій бібліотеці. Написане тут бачать усі, хто має проєкт.
library-notes-kept = Зберігається з джерелом у вашій бібліотеці. Іде разом із проєктом, що цитує працю.
library-notes-unread = Не вдалося прочитати ваші нотатки
library-notes-unsaved = Не вдалося зберегти вашу нотатку
