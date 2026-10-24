# Document formats: their kinds, and the editor of a format.

## The kinds of document format, as the formats are grouped by them.

format-kind-own = Ваші власні
format-kind-general = Загальні
format-kind-style-guide = Стильові настанови
format-kind-publisher = Видавництва
format-kind-journal = Журнали
format-kind-fiction = Проза
format-kind-stage = Сцена та екран
format-kind-poetry = Поезія

## The format editor.

format-name = Назва формату
# The name a format of one's own is first given, made from that of the format it is made from.
format-name-changed = { $name }, змінений
format-saved = «{ $name }» збережено серед ваших власних форматів
format-save-failed = Не вдалося зберегти формат.
format-delete-failed = Не вдалося видалити формат.
format-delete-title = Видалити формат «{ $name }»?
format-delete-message = Мапи, що ним користуються, натомість користуватимуться загальним форматом рукопису.
format-delete-confirm = Видалити формат

## The parts of a format, as they are chosen at the left.

## Words that stand in several parts.

format-size = Розмір
format-bold = Жирний
format-italic = Курсив
format-letters = Літери
format-alignment = Вирівнювання
format-line-spacing = Міжрядковий інтервал
format-as-the-text = Як текст
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = як текст
# Beside a number of 0, in the place of its unit.
format-not-said = не вказано
format-align-left = Ліворуч
format-align-center = По центру
format-align-right = Праворуч
format-align-justified = По ширині
format-align-ragged = Ліворуч, із нерівним правим краєм
format-case-none = Як написано
format-case-upper = ВЕЛИКІ ЛІТЕРИ
format-case-smallcaps = Капітель
format-spacing-single = Одинарний
format-spacing-one-and-a-half = Полуторний
format-spacing-double = Подвійний
format-stands-left = Ліворуч
format-stands-center = Посередині
format-stands-right = Праворуч

## The page.

format-page-custom = Інший розмір
format-page-width = Ширина
format-page-height = Висота
format-margins = Поля
format-margin-top = Верхнє
format-margin-bottom = Нижнє
format-margin-left = Ліве
format-margin-right = Праве
format-lengths-hint = Довжини пишуться з одиницею: 2.5cm, 1in, 25mm, 12pt.
format-line-numbers = Нумерувати рядки

## Type and spacing, and paragraphs.

format-typeface = Гарнітура
format-hyphenate = Переносити слова в кінці рядків
format-paragraphs = Абзаци розрізняються
format-paragraphs-indent = Відступом першого рядка
format-paragraphs-spaced = Проміжком між ними
format-indent = Відступ
format-indent-first = Також після заголовка
format-space-between = Проміжок між абзацами
format-italics = Курсив набирається
format-italics-italic = Курсивом
format-italics-underline = Підкресленням, як у машинописних рукописах

## Headings.

format-numbered = Нумеровані
format-level = Рівень { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } пт
format-level-bold = жирний
format-level-italic = курсив
format-level-capitals = великі літери
format-level-small-caps = капітель
format-level-centred = по центру
format-level-right = праворуч
format-level-run-in = у рядок із текстом
format-level-indent = З відступом, як абзац
format-level-new-page-said = з нової сторінки
format-space-before = Проміжок перед
format-space-after = Проміжок після
format-level-add = Глибший рівень
format-level-remove = Прибрати найглибший

## The title and the abstract.

format-title-placement = Назва стоїть
format-title-top = Угорі першої сторінки
format-title-own-page = На окремій сторінці
format-title-authors = Автори
format-title-affiliations = Їхні установи
format-title-date = Дата
format-title-abstract = Анотація та ключові слова
format-title-abstract-label = Заголовок анотації
format-title-keywords-label = Слово перед ключовими словами

## Quotations, notes and the bibliography.

format-quote-indent-left = Відступ ліворуч
format-quote-indent-right = Відступ праворуч
format-quote-when = Коли цитата виокремлюється
format-quote-from-words = Від стількох слів
format-quote-from-lines = Або стількох рядків
format-notes-kind = Примітки стоять
format-notes-footnotes = Унизу сторінки
format-notes-endnotes = У кінці тексту
format-notes-title = Заголовок приміток
format-bibliography-title = Заголовок
format-bibliography-new-page = Починається з нової сторінки
format-bibliography-hanging-indent = Виступ
format-bibliography-entry-spacing = Проміжок між записами

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = на основі { $base }
format-as-the-base = Як основа
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = як основа
format-yes = Так
format-no = Ні
format-underline = Підкреслений
format-equal-width = Літери однакової ширини
format-equal-width-hint = Як набирається код
format-indent-left = Відступ ліворуч
format-indent-right = Відступ праворуч
format-first-line = Перший рядок
format-first-line-hint = Наскільки він починається далі за решту
format-keep-with-next = Не відривати від наступного
format-keep-with-next-hint = Не залишається самотнім унизу сторінки
format-new-page = Починає нову сторінку
format-break-text = Що стоїть у розділювачі
format-break-text-hint = * * *, якщо нічого не сказано; # для рукопису
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = не жирний
format-look-not-italic = не курсив
format-look-underlined = підкреслений
format-look-not-underlined = не підкреслений
format-look-as-written = як написано
format-look-left = ліворуч
format-look-justified = по ширині
format-look-indent-left = відступ { $length } ліворуч
format-look-indent-right = відступ { $length } праворуч
format-look-first-line = перший рядок { $length }
format-look-space-before = { $length } перед
format-look-space-after = { $length } після
format-look-line-spacing = інтервал { $spacing }
format-look-equal-width = літери однакової ширини
format-look-not-equal-width = літери неоднакової ширини
format-look-kept = не відривати від наступного
format-look-not-kept = можна відривати від наступного
format-look-no-new-page = без нової сторінки
format-look-text = «{ $text }» у розділювачі

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Рисунки
format-tables = Таблиці
format-captioned-called = { $kind ->
    [figure] Рисунок називається
   *[table] Таблиця називається
}
format-captioned-reference = У посиланнях із тексту
format-captioned-label-bold = Слово й номер жирним
format-captioned-label-italic = Слово й номер курсивом
format-captioned-between = { $kind ->
    [figure] Між номером і підписом
   *[table] Між номером і підписом
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Крапка ({ $called }. Підпис)
   *[table] Крапка ({ $called }. Підпис)
}
format-between-colon = { $kind ->
    [figure] Двокрапка ({ $called }: Підпис)
   *[table] Двокрапка ({ $called }: Підпис)
}
format-between-line = { $kind ->
    [figure] Підпис в окремому рядку
   *[table] Підпис в окремому рядку
}
format-between-other = Інше…
format-captioned-separator = Що стоїть між ними
format-captioned-own-line = { $kind ->
    [figure] Далі підпис в окремому рядку
   *[table] Далі підпис в окремому рядку
}
format-caption = { $kind ->
    [figure] Підпис
   *[table] Підпис
}
format-caption-stands = { $kind ->
    [figure] Підпис стоїть
   *[table] Підпис стоїть
}
format-caption-below = { $kind ->
    [figure] Під зображенням
   *[table] Під таблицею
}
format-caption-above = { $kind ->
    [figure] Над зображенням
   *[table] Над таблицею
}
format-captioned-where = { $kind ->
    [figure] Де стоять рисунки
   *[table] Де стоять таблиці
}
format-captioned-stand = { $kind ->
    [figure] Рисунки стоять
   *[table] Таблиці стоять
}
format-captioned-wrap = Текст обтікає їх
format-captioned-placement = У документі
format-captioned-in-text = У тексті
format-captioned-at-end = Зібрані в кінці
format-captioned-end-title = { $kind ->
    [figure] Заголовок над рисунками
   *[table] Заголовок над таблицями
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Рядок, залишений у тексті
format-captioned-placeholder-missing = Він має містити {"{}"} там, де стоятимуть слово й номер
format-table-rules = Лінії
format-table-rules-horizontal = Над, під і під заголовками
format-table-rules-grid = Навколо кожної клітинки
format-table-rules-none = Немає
format-table-header-bold = Заголовки жирним
format-equations = Рівняння
format-equations-stand = Рівняння стоять
format-equations-before = Перед номером
format-equations-after = Після номера

## Page numbers and the running head.

format-page-numbers = Номери сторінок
format-page-numbers-show = Сторінки нумеруються

## About the format: where its requirements are from.

format-description = Опис
format-source = Звідки вимоги
# The date the source was read on.
format-source-read = Прочитано { $date }.
format-source-high = Значення — ті, що в джерелі вимог.
format-source-medium = Джерело вимог вдалося прочитати лише частково або в давнішому стані: перевірте те, що для вас важливе.
format-source-low = Перевірити вдалося мало: вважайте значення лише початком.
