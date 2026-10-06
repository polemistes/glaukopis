# Tables in the text: making them, their tools, and what can be said of them.
# See locales/README.md.

## A table and its size, as its panel and the reading of a file show them.

tables-table = Таблица
tables-size = { $rows ->
        [one] { $rows } строка
        [few] { $rows } строки
        [many] { $rows } строк
       *[other] { $rows } строки
    }, { $columns ->
        [one] { $columns } столбец
        [few] { $columns } столбца
        [many] { $columns } столбцов
       *[other] { $columns } столбца
    }
# The size, where only the first rows of what was read are shown.
tables-size-shown = { tables-size }. Показаны первые { $shown }.

## The bar over a table, and the menu on its cells.

tables-row = Строка
tables-row-hint = Строка выше или ниже; убрать строку
tables-row-above = Строка выше
tables-row-below = Строка ниже
tables-row-remove = Убрать строку
tables-column = Столбец
tables-column-hint = Столбец до или после; убрать столбец
tables-column-before = Столбец до
tables-column-after = Столбец после
tables-column-remove = Убрать столбец
tables-join = Объединить ячейки
tables-join-hint = Объединить выделенные ячейки
tables-split = Разделить ячейку
tables-split-hint = Разделить ячейку на те, из которых она объединена
tables-headings = Заголовки
tables-headings-hint = Являются ли первая строка и первый столбец заголовками
tables-first-row-headings = Первая строка — заголовки
tables-first-column-headings = Первый столбец — заголовки
tables-cell-stands = Содержимое ячейки стоит
tables-left = Слева
tables-left-hint = Содержимое ячейки стоит слева
tables-middle = Посередине
tables-middle-hint = Содержимое ячейки стоит посередине
tables-right = Справа
tables-right-hint = Содержимое ячейки стоит справа
tables-table-hint = Нумеруется ли, какой ширины; убрать её
tables-numbered = С номером
tables-the-table = Таблица…
tables-the-table-hint = Какой она ширины
tables-remove = Убрать таблицу

## The panel of what can be said of a table as a whole.

tables-width = Ширина
tables-width-needed = Сколько нужно
tables-width-half = Половина
tables-width-three-quarters = Три четверти
tables-width-whole = Вся
tables-width-of-text = От ширины текста в документе.
tables-width-as-needed = Столько, сколько нужно её содержимому.
tables-numbered-as = Нумеруется, как «Таблица 1»

## A table asked for by its size.

tables-ask = Таблица какого размера
tables-ask-heading = Таблица
tables-ask-grid = Укажите размер таблицы
tables-ask-by = { $rows } на { $columns }
tables-ask-rows = Строк
tables-ask-columns = Столбцов
tables-ask-put = Вставить

## A table from a file.

tables-from-file = Таблица из файла
tables-sheet = Лист
# A sheet of a file that has no name of its own.
tables-sheet-number = Лист { $number }
tables-first-rows = Первые строки, как они будут
tables-caption = Что сказано о таблице
tables-caption-placeholder = Её название, которое можно изменить в тексте
tables-header-row = В первой строке — заголовки
tables-header-column = В первом столбце — заголовки
tables-numbers-right = Столбцы с числами выравниваются вправо.
tables-put = Вставить в текст
# The title of the window in which a file is chosen among the files of the computer.
tables-choose = Таблица
# What the files that can be chosen there are called.
tables-files = Таблицы
tables-unreadable = { $file } не удалось прочитать как таблицу
tables-cannot-stand = Таблица здесь стоять не может
tables-drop-on-text = Перетащите таблицу на текст, к которому она относится

## Shown by the stylesheet, where the page has no element for the words.

tables-caption-empty = Что сказано о таблице
