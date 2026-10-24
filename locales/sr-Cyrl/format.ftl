# Document formats: their kinds, and the editor of a format.

## The kinds of document format, as the formats are grouped by them.

format-kind-own = Ваши сопствени
format-kind-general = Општи
format-kind-style-guide = Приручници стила
format-kind-publisher = Издавачи
format-kind-journal = Часописи
format-kind-fiction = Проза
format-kind-stage = Позорница и екран
format-kind-poetry = Поезија

## The format editor.

format-name = Назив формата
# The name a format of one's own is first given, made from that of the format it is made from.
format-name-changed = { $name }, измењен
format-saved = „{ $name }“ је сачуван међу вашим форматима
format-save-failed = Формат није могао да се сачува.
format-delete-failed = Формат није могао да се обрише.
format-delete-title = Обрисати формат „{ $name }“?
format-delete-message = Мапе које га користе користиће уместо њега општи формат рукописа.
format-delete-confirm = Обриши формат

## The parts of a format, as they are chosen at the left.

## Words that stand in several parts.

format-size = Величина
format-bold = Полуцрно
format-italic = Курзив
format-letters = Слова
format-alignment = Поравнање
format-line-spacing = Проред
format-as-the-text = Као текст
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = као текст
# Beside a number of 0, in the place of its unit.
format-not-said = није речено
format-align-left = Лево
format-align-center = Центрирано
format-align-right = Десно
format-align-justified = Обострано
format-align-ragged = Лево, неравно десно
format-case-none = Како је написано
format-case-upper = ВЕЛИКА СЛОВА
format-case-smallcaps = Мала велика слова
format-spacing-single = Једноструки
format-spacing-one-and-a-half = Један и по
format-spacing-double = Двоструки
format-stands-left = Лево
format-stands-center = У средини
format-stands-right = Десно

## The page.

format-page-custom = Друга величина
format-page-width = Ширина
format-page-height = Висина
format-margins = Маргине
format-margin-top = Горе
format-margin-bottom = Доле
format-margin-left = Лево
format-margin-right = Десно
format-lengths-hint = Дужине се пишу с јединицом: 2.5cm, 1in, 25mm, 12pt.
format-line-numbers = Нумериши редове

## Type and spacing, and paragraphs.

format-typeface = Фонт
format-hyphenate = Растављај речи на крају реда
format-paragraphs = Пасуси се разликују по
format-paragraphs-indent = Увученом првом реду
format-paragraphs-spaced = Размаку између њих
format-indent = Увлачење
format-indent-first = И после наслова
format-space-between = Размак између пасуса
format-italics = Курзив се слаже
format-italics-italic = Као курзив
format-italics-underline = Подвучено, као у рукописима писаним на машини

## Headings.

format-numbered = Нумерисани
format-level = Ниво { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = полуцрно
format-level-italic = курзив
format-level-capitals = велика слова
format-level-small-caps = мала велика слова
format-level-centred = центрирано
format-level-right = десно
format-level-run-in = улива се у текст
format-level-indent = Увучен као пасус
format-level-new-page-said = на новој страни
format-space-before = Размак испред
format-space-after = Размак иза
format-level-add = Дубљи ниво
format-level-remove = Уклони најдубљи

## The title and the abstract.

format-title-placement = Наслов стоји
format-title-top = На врху прве стране
format-title-own-page = На засебној страни
format-title-authors = Аутори
format-title-affiliations = Њихове установе
format-title-date = Датум
format-title-abstract = Сажетак и кључне речи
format-title-abstract-label = Наслов сажетка
format-title-keywords-label = Реч испред кључних речи

## Quotations, notes and the bibliography.

format-quote-indent-left = Увлачење слева
format-quote-indent-right = Увлачење здесна
format-quote-when = Кад се навод издваја
format-quote-from-words = Од толико речи
format-quote-from-lines = Или толико редова
format-notes-kind = Напомене стоје
format-notes-footnotes = У дну стране
format-notes-endnotes = На крају текста
format-notes-title = Наслов напомена
format-bibliography-title = Наслов
format-bibliography-new-page = Почиње на новој страни
format-bibliography-hanging-indent = Висеће увлачење
format-bibliography-entry-spacing = Размак између јединица

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = заснована на: { $base }
format-as-the-base = Као основа
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = као основа
format-yes = Да
format-no = Не
format-underline = Подвучено
format-equal-width = Слова једнаке ширине
format-equal-width-hint = Како се слаже кôд
format-indent-left = Увлачење слева
format-indent-right = Увлачење здесна
format-first-line = Први ред
format-first-line-hint = Колико више од осталих почиње увучено
format-keep-with-next = Уз следећи
format-keep-with-next-hint = Не остаје сам у дну стране
format-new-page = Почиње нову страну
format-break-text = Шта стоји у прекиду
format-break-text-hint = * * * где ништа није речено; # за рукопис
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = није полуцрно
format-look-not-italic = није курзив
format-look-underlined = подвучено
format-look-not-underlined = није подвучено
format-look-as-written = како је написано
format-look-left = лево
format-look-justified = обострано
format-look-indent-left = { $length } увучено слева
format-look-indent-right = { $length } увучено здесна
format-look-first-line = први ред { $length }
format-look-space-before = { $length } испред
format-look-space-after = { $length } иза
format-look-line-spacing = проред { $spacing }
format-look-equal-width = слова једнаке ширине
format-look-not-equal-width = слова неједнаке ширине
format-look-kept = уз следећи
format-look-not-kept = није уз следећи
format-look-no-new-page = без нове стране
format-look-text = „{ $text }“ у прекиду

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Илустрације
format-tables = Табеле
format-captioned-called = { $kind ->
    [figure] Илустрација се зове
   *[table] Табела се зове
}
format-captioned-reference = Где текст упућује на њу
format-captioned-label-bold = Реч и број полуцрно
format-captioned-label-italic = Реч и број курзивом
format-captioned-between = { $kind ->
    [figure] Између броја и натписа
   *[table] Између броја и натписа
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Тачка ({ $called }. Натпис)
   *[table] Тачка ({ $called }. Натпис)
}
format-between-colon = { $kind ->
    [figure] Две тачке ({ $called }: Натпис)
   *[table] Две тачке ({ $called }: Натпис)
}
format-between-line = { $kind ->
    [figure] Натпис у засебном реду
   *[table] Натпис у засебном реду
}
format-between-other = Друго…
format-captioned-separator = Шта стоји између њих
format-captioned-own-line = { $kind ->
    [figure] Па натпис у засебном реду
   *[table] Па натпис у засебном реду
}
format-caption = { $kind ->
    [figure] Натпис
   *[table] Натпис
}
format-caption-stands = { $kind ->
    [figure] Натпис стоји
   *[table] Натпис стоји
}
format-caption-below = { $kind ->
    [figure] Испод слике
   *[table] Испод табеле
}
format-caption-above = { $kind ->
    [figure] Изнад слике
   *[table] Изнад табеле
}
format-captioned-where = { $kind ->
    [figure] Где стоје илустрације
   *[table] Где стоје табеле
}
format-captioned-stand = { $kind ->
    [figure] Илустрације стоје
   *[table] Табеле стоје
}
format-captioned-wrap = Текст их оптиче
format-captioned-placement = У документу
format-captioned-in-text = У тексту
format-captioned-at-end = Скупљене на крају
format-captioned-end-title = { $kind ->
    [figure] Наслов изнад илустрација
   *[table] Наслов изнад табела
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Ред остављен у тексту
format-captioned-placeholder-missing = Мора садржати {"{}"}, где иду реч и број
format-table-rules = Линије
format-table-rules-horizontal = Изнад, испод и испод заглавља
format-table-rules-grid = Око сваке ћелије
format-table-rules-none = Нема
format-table-header-bold = Заглавља полуцрно
format-equations = Једначине
format-equations-stand = Једначине стоје
format-equations-before = Испред броја
format-equations-after = Иза броја

## Page numbers and the running head.

format-page-numbers = Бројеви страна
format-page-numbers-show = Стране су нумерисане

## About the format: where its requirements are from.

format-description = Опис
format-source = Одакле су захтеви
# The date the source was read on.
format-source-read = Прочитано { $date }.
format-source-high = Вредности су из извора.
format-source-medium = Извор је могао да се прочита само делом или у ранијем стању: проверите што вам је важно.
format-source-low = Мало тога је могло да се провери: узмите вредности као почетак.
