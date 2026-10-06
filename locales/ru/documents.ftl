# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Документ для загрузки
documents-filter = Документы
documents-filter-all = Все файлы
documents-title-map = Карта из документа
documents-title-project = Проект из документа
documents-reading = Чтение { $file }…
documents-reading-hint = Длинный документ читается не сразу.
documents-no-pandoc = Документы этого вида читает Pandoc, а он не установлен или не найден. Где он, можно указать в настройках.
documents-unread = Не удалось прочитать файл.
documents-title = Название
documents-title-hint-map = Название карты и элемента в её центре.
documents-title-hint-project = Название проекта, его карты и элемента в центре карты.
# What a project made of a document is called when the document has no title.
documents-untitled = Без названия

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Часть
    [few] Части
    [many] Частей
   *[other] Части
}
documents-words = { $count ->
    [one] Слово
    [few] Слова
    [many] Слов
   *[other] Слова
}
documents-notes = { $count ->
    [one] Сноска
    [few] Сноски
    [many] Сносок
   *[other] Сноски
}
documents-figures = { $count ->
    [one] Рисунок
    [few] Рисунка
    [many] Рисунков
   *[other] Рисунка
}
documents-tables = { $count ->
    [one] Таблица
    [few] Таблицы
    [many] Таблиц
   *[other] Таблицы
}
documents-equations = { $count ->
    [one] Уравнение
    [few] Уравнения
    [many] Уравнений
   *[other] Уравнения
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = На работы из вашей библиотеки ссылаются { $cited ->
        [1] один раз
        [2] дважды
        [one] { $cited } раз
        [few] { $cited } раза
        [many] { $cited } раз
       *[other] { $cited } раза
    }.
documents-cited-not-in-library = На работы, которых нет в вашей библиотеке, ссылаются { $missing ->
        [1] один раз
        [2] дважды
        [one] { $missing } раз
        [few] { $missing } раза
        [many] { $missing } раз
       *[other] { $missing } раза
    }.
documents-cited-both = На работы из вашей библиотеки ссылаются { $cited ->
        [1] один раз
        [2] дважды
        [one] { $cited } раз
        [few] { $cited } раза
        [many] { $cited } раз
       *[other] { $cited } раза
    }, на работы, которых в ней нет, — { $missing ->
        [1] один раз
        [2] дважды
        [one] { $missing } раз
        [few] { $missing } раза
        [many] { $missing } раз
       *[other] { $missing } раза
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Найдена { $count } ссылка.
    [few] Найдены { $count } ссылки.
    [many] Найдено { $count } ссылок.
   *[other] Найдены { $count } ссылки.
}
documents-found-made = { $count ->
    [one] Найдена { $count } ссылка, сделанная программой, которая ведёт источники.
    [few] Найдены { $count } ссылки, все сделаны программой, которая ведёт источники.
    [many] Найдено { $count } ссылок, все сделаны программой, которая ведёт источники.
   *[other] Найдены { $count } ссылки, все сделаны программой, которая ведёт источники.
}
documents-found-some-made = { $count ->
    [one] Найдена { $count } ссылка, { $made } из них — от программы, которая ведёт источники.
    [few] Найдены { $count } ссылки, { $made } из них — от программы, которая ведёт источники.
    [many] Найдено { $count } ссылок, { $made } из них — от программы, которая ведёт источники.
   *[other] Найдены { $count } ссылки, { $made } из них — от программы, которая ведёт источники.
}
documents-at-once = Сразу сделать ссылками те, что сделаны Zotero на работы из вашей библиотеки
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Сноска, в которой нет ничего, кроме ссылки, становится ссылкой в строке, а стиль цитирования ставит её в сноску или в строку; сноска, в которой сказано больше, сохраняет свою ссылку. То, что вы выбрали для сносок на панели найденных ссылок — для всех последующих, — действует и здесь.
documents-go-through-map = Разобрать ссылки, когда карта будет создана
documents-go-through-project = Разобрать ссылки, когда проект будет создан

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Стоит знать
documents-making = Создание карты…
documents-make-map = Создать карту
documents-make-project = Создать проект
documents-map-failed = Не удалось создать карту.
