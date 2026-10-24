# Document formats: their kinds, and the editor of a format.

## The kinds of document format, as the formats are grouped by them.

format-kind-own = Свои
format-kind-general = Общие
format-kind-style-guide = Руководства по стилю
format-kind-publisher = Издательства
format-kind-journal = Журналы
format-kind-fiction = Проза
format-kind-stage = Сцена и экран
format-kind-poetry = Поэзия

## The format editor.

format-name = Название формата
# The name a format of one's own is first given, made from that of the format it is made from.
format-name-changed = { $name }, изменённый
format-saved = «{ $name }» сохранён среди ваших форматов
format-save-failed = Не удалось сохранить формат.
format-delete-failed = Не удалось удалить формат.
format-delete-title = Удалить формат «{ $name }»?
format-delete-message = Карты, которые им пользуются, перейдут на общий формат рукописи.
format-delete-confirm = Удалить формат

## The parts of a format, as they are chosen at the left.

## Words that stand in several parts.

format-size = Размер
format-bold = Полужирный
format-italic = Курсив
format-letters = Буквы
format-alignment = Выравнивание
format-line-spacing = Межстрочный интервал
format-as-the-text = Как текст
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = как текст
format-align-left = По левому краю
format-align-center = По центру
format-align-right = По правому краю
format-align-justified = По ширине
format-align-ragged = По левому краю, правый рваный
format-case-none = Как написано
format-case-upper = ПРОПИСНЫЕ
format-case-smallcaps = Капитель
format-spacing-single = Одинарный
format-spacing-one-and-a-half = Полуторный
format-spacing-double = Двойной
format-stands-left = Слева
format-stands-center = Посередине
format-stands-right = Справа

## The page.

format-page-custom = Другой размер
format-page-width = Ширина
format-page-height = Высота
format-margins = Поля
format-margin-top = Верхнее
format-margin-bottom = Нижнее
format-margin-left = Левое
format-margin-right = Правое
format-lengths-hint = Длины пишутся с единицей: 2.5cm, 1in, 25mm, 12pt.
format-line-numbers = Нумеровать строки

## Type and spacing, and paragraphs.

format-typeface = Гарнитура
format-hyphenate = Переносить слова в концах строк
format-indent-first = И после заголовка
format-space-between = Отступ между абзацами
format-italics = Курсив набирается
format-italics-italic = Курсивом
format-italics-underline = Подчёркиванием, как в машинописных рукописях

## Headings.

format-numbered = Нумерованные
format-level = Уровень { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } пт
format-level-bold = полужирный
format-level-italic = курсив
format-level-capitals = прописные
format-level-small-caps = капитель
format-level-centred = по центру
format-level-right = справа
format-level-run-in = в подбор с текстом
format-level-indent = С отступом, как абзац
format-level-new-page-said = с новой страницы
format-space-before = Отступ сверху
format-space-after = Отступ снизу
format-level-add = Ещё уровень
format-level-remove = Убрать самый глубокий

## The title and the abstract.

format-title-placement = Заглавие стоит
format-title-top = Вверху первой страницы
format-title-own-page = На отдельной странице
format-title-authors = Авторы
format-title-affiliations = Их организации
format-title-date = Дата
format-title-abstract = Аннотация и ключевые слова
format-title-abstract-label = Заголовок аннотации
format-title-keywords-label = Слово перед ключевыми словами

## Quotations, notes and the bibliography.

format-quote-from-words = От стольких слов
format-quote-from-lines = Или от стольких строк
format-notes-kind = Сноски стоят
format-notes-footnotes = Внизу страницы
format-notes-endnotes = В конце текста
format-notes-title = Заголовок сносок
format-bibliography-title = Заголовок
format-bibliography-new-page = С новой страницы
format-bibliography-hanging-indent = Висячий отступ
format-bibliography-entry-spacing = Отступ между записями

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = на основе { $base }
format-as-the-base = Как основа
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = как основа
format-yes = Да
format-no = Нет
format-underline = Подчёркнутый
format-equal-width = Моноширинные буквы
format-equal-width-hint = Как набирается код
format-indent-left = Отступ слева
format-indent-right = Отступ справа
format-first-line = Первая строка
format-first-line-hint = Насколько она начинается глубже остальных
format-keep-with-next = Не отрывать от следующего
format-keep-with-next-hint = Не остаётся в одиночестве внизу страницы
format-new-page = С новой страницы
format-break-text = Что стоит в разделителе
format-break-text-hint = * * *, если ничего не сказано; # для рукописи
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = не полужирный
format-look-not-italic = не курсив
format-look-underlined = подчёркнутый
format-look-not-underlined = не подчёркнутый
format-look-as-written = как написано
format-look-left = слева
format-look-justified = по ширине
format-look-indent-left = отступ слева { $length }
format-look-indent-right = отступ справа { $length }
format-look-first-line = первая строка { $length }
format-look-space-before = { $length } сверху
format-look-space-after = { $length } снизу
format-look-line-spacing = интервал { $spacing }
format-look-equal-width = моноширинные буквы
format-look-not-equal-width = пропорциональные буквы
format-look-kept = не отрывается от следующего
format-look-not-kept = отрывается от следующего
format-look-no-new-page = без новой страницы
format-look-text = «{ $text }» в разделителе

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Рисунки
format-tables = Таблицы
format-captioned-called = { $kind ->
    [figure] Рисунок называется
   *[table] Таблица называется
}
format-captioned-reference = В отсылках из текста
format-captioned-label-bold = Слово и номер полужирным
format-captioned-label-italic = Слово и номер курсивом
format-captioned-between = { $kind ->
    [figure] Между номером и подписью
   *[table] Между номером и названием
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Точка ({ $called }. Подпись)
   *[table] Точка ({ $called }. Название)
}
format-between-colon = { $kind ->
    [figure] Двоеточие ({ $called }: Подпись)
   *[table] Двоеточие ({ $called }: Название)
}
format-between-line = { $kind ->
    [figure] Подпись на отдельной строке
   *[table] Название на отдельной строке
}
format-between-other = Другое…
format-captioned-separator = Что стоит между ними
format-captioned-own-line = { $kind ->
    [figure] Затем подпись на отдельной строке
   *[table] Затем название на отдельной строке
}
format-caption = { $kind ->
    [figure] Подпись
   *[table] Название
}
format-caption-stands = { $kind ->
    [figure] Подпись стоит
   *[table] Название стоит
}
format-caption-below = { $kind ->
    [figure] Под изображением
   *[table] Под таблицей
}
format-caption-above = { $kind ->
    [figure] Над изображением
   *[table] Над таблицей
}
format-captioned-where = { $kind ->
    [figure] Где стоят рисунки
   *[table] Где стоят таблицы
}
format-captioned-stand = { $kind ->
    [figure] Рисунки стоят
   *[table] Таблицы стоят
}
format-captioned-wrap = Текст их обтекает
format-captioned-placement = В документе
format-captioned-in-text = В тексте
format-captioned-at-end = Собраны в конце
format-captioned-end-title = { $kind ->
    [figure] Заголовок над рисунками
   *[table] Заголовок над таблицами
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Строка, оставляемая в тексте
format-captioned-placeholder-missing = В ней должно быть {"{}"}, куда встанут слово и номер
format-table-rules = Линии
format-table-rules-horizontal = Сверху, снизу и под заголовками
format-table-rules-grid = Вокруг каждой ячейки
format-table-rules-none = Нет
format-table-header-bold = Заголовки полужирным
format-equations = Уравнения
format-equations-stand = Уравнения стоят
format-equations-before = Перед номером
format-equations-after = После номера

## Page numbers and the running head.

format-page-numbers = Номера страниц
format-page-numbers-show = Страницы нумеруются

## About the format: where its requirements are from.

format-description = Описание
format-source = Откуда требования
# The date the source was read on.
format-source-read = Прочитано { $date }.
format-source-high = Значения — те, что в источнике.
format-source-medium = Источник удалось прочитать лишь частично или в прежнем состоянии: проверьте то, что для вас важно.
format-source-low = Проверить удалось немногое: считайте значения отправной точкой.
