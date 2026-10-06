# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Найти
search-replace-with = Заменить на
search-replace = Заменить
search-replace-all = Заменить все
search-previous = Предыдущее
search-next = Следующее
search-close = Закрыть поиск
search-show-replace = И заменить
search-hide-replace = Только найти
# Which of those found is shown: "3 of 17".
search-count = { $current } из { $count }
search-found = { $count ->
    [one] Найдено { $count }
    [few] Найдено { $count }
    [many] Найдено { $count }
   *[other] Найдено { $count }
}
search-nothing = Ничего не найдено
search-invalid = Не регулярное выражение
search-replaced = { $count ->
    [0] Ничего не заменено
    [one] Заменено { $count }
    [few] Заменено { $count }
    [many] Заменено { $count }
   *[other] Заменено { $count }
}

## The options

search-case = Учитывать регистр
search-whole-words = Только целые слова
search-accents = Буквы с диакритикой и без — одинаково
search-accents-sign = é=e
search-regex = Регулярное выражение
search-selection = Только в выделенном тексте
search-selection-none = Сначала выделите текст, чтобы искать только в нём
search-labels = И в ссылках, формулах и перекрёстных ссылках
search-labels-outside = И в том, что стоит вне текстов

## The search through everything

search-everything = Поиск
search-everything-title = Искать везде
search-everything-field = Поиск по проектам
search-last-project = Последний проект
search-all-projects = Все проекты
search-reading = Чтение { $name }…
search-no-projects = Нет проектов, в которых искать.
search-more = { $count ->
    [one] и ещё { $count }
    [few] и ещё { $count }
    [many] и ещё { $count }
   *[other] и ещё { $count }
}
search-in-project = { $count ->
    [one] { $count } в этом проекте
    [few] { $count } в этом проекте
    [many] { $count } в этом проекте
   *[other] { $count } в этом проекте
}
search-everything-found = { $count ->
    [one] Найдено { $count }
    [few] Найдено { $count }
    [many] Найдено { $count }
   *[other] Найдено { $count }
} { $projects ->
    [one] в { $projects } проекте
    [few] в { $projects } проектах
    [many] в { $projects } проектах
   *[other] в { $projects } проектах
}
search-where-details = Сведения о документе
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = Связь { $ends }
search-where-note = Что вы думаете о { $work }
# Said before what was found in a note.
search-in-note = сноска
search-untitled = Без названия
search-could-not-read = Не удалось прочитать { $name }.
