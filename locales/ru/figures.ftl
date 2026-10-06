# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Рисунок
figures-width = Ширина
figures-width-third = Треть
figures-width-half = Половина
figures-width-three-quarters = Три четверти
figures-width-whole = Вся
figures-width-of-row = От места, которое у него есть в ряду.
figures-width-of-text = От ширины текста в документе.
figures-shows = Показывает
figures-shows-placeholder = Словами, для тех, кто не может его увидеть
figures-numbered = Нумеруется, как «Рисунок 1»
figures-keep-caption = Хранить подпись вместе с изображением
figures-keep-caption-hint = Рисунки с этим изображением будут начинаться с того, что сказано здесь
figures-take-caption = Взять подпись изображения
figures-take-caption-hint = То, что хранится с изображением, подставляется сюда вместо нынешнего текста
figures-another-picture = Другое изображение…
figures-remove = Убрать рисунок
figures-caption-kept = Хранится с изображением
figures-caption-kept-detail = Рисунки с ним начинаются с этих слов.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Изображение
# What the files that can be chosen there are called.
figures-picture-files = Изображения

## The store of pictures, as the text reads it.

figures-pictures-unread = Не удалось прочитать изображения
figures-picture-not-taken = Не удалось добавить изображение
figures-picture-not-kept = Не удалось сохранить сказанное об изображении
figures-picture-not-removed = Не удалось убрать изображение

## Where a figure, a table or an equation stands.

figures-stands = Стоит
figures-stands-in-row = рядом с другими, в ряд
figures-stands-alone = Снова отдельно
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Где стоит { $kind ->
        [figure] рисунок
        [table] таблица
       *[equation] уравнение
    }
figures-side-format = Как в формате
figures-side-left = Слева
figures-side-middle = Посередине
figures-side-right = Справа
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = По формату { $kind ->
        [figure] рисунки
        [table] таблицы
       *[equation] уравнения
    } стоят { $side ->
        [left] слева
        [right] справа
       *[center] посередине
    }{ $flow ->
        [around] , и текст их обтекает
        [apart] , отдельно от текста
       *[none] {""}
    }.
figures-text = Текст
figures-flows-where = Обтекает ли текст { $kind ->
        [figure] рисунок
        [table] таблицу
       *[equation] уравнение
    }
figures-flow-format = Как в формате
figures-flow-around = Обтекает
figures-flow-apart = Стоит отдельно
figures-flow-at-side = Текст обтекает то, что стоит сбоку.
figures-beside = Поставить рядом с предыдущим

## A formula in the line, and an equation on a line of its own.

figures-formula = Формула
figures-equation = Уравнение
figures-equation-numbered = С номером
figures-formula-field = Формула в записи TeX
figures-formula-empty = Написанное показывается здесь так, как будет стоять.
figures-formula-hint = Записывается как в TeX. Enter — готово, Esc — оставить как было.
figures-equation-hint = Записывается как в TeX. Enter — готово, Shift+Enter — новая строка, Esc — оставить как было.
figures-formula-unread = Не удалось прочитать формулу.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = формула
figures-equation-blank = Уравнение

## What can be put into a formula by pressing.

figures-sign-raised = Верхний индекс
figures-sign-lowered = Нижний индекс
figures-sign-fraction = Дробь
figures-sign-root = Корень
figures-sign-sum = Сумма
figures-sign-integral = Интеграл
figures-sign-brackets = Скобки по размеру
figures-sign-alpha = альфа
figures-sign-beta = бета
figures-sign-gamma = гамма
figures-sign-lambda = лямбда
figures-sign-pi = пи
figures-sign-sigma = сигма
figures-sign-less-or-equal = Меньше или равно
figures-sign-greater-or-equal = Больше или равно
figures-sign-not-equal = Не равно
figures-sign-nearly-equal = Приблизительно равно
figures-sign-times = Умножить
figures-sign-plus-or-minus = Плюс-минус
figures-sign-arrow = Стрелка
figures-sign-infinity = Бесконечность
figures-sign-words = Слова внутри формулы

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Показывается как
figures-form-full = Слово и номер
figures-form-number = Только номер
figures-form-equation = Номер, как он стоит у уравнения
figures-form-its-number = Его номер
figures-form-its-name = Его название
figures-go-to = Перейти к тому, на что она указывает
figures-pointed-gone = Того, на что она указывает, больше нет в документе
figures-point-elsewhere = Указать на другое…

## Choosing what a cross-reference refers to.

figures-targets = Выберите, на что указать
figures-targets-placeholder = Указать на рисунок, таблицу, уравнение, часть
figures-targets-search = Поиск того, на что можно указать
figures-targets-results = На что можно указать
figures-targets-figures = Рисунки
figures-targets-tables = Таблицы
figures-targets-equations = Уравнения
figures-targets-parts = Части документа
figures-targets-figure-unsaid = Рисунок, о котором ничего не сказано
figures-targets-table-unsaid = Таблица, о которой ничего не сказано
figures-targets-no-match = В документе ничего не отзывается на эти слова.
figures-targets-none = Указывать пока не на что: ни рисунка, ни таблицы, ни нумерованного уравнения, ни части с названием.
figures-targets-hint = Перекрёстная ссылка следует за тем, на что указывает: за его номером и за тем, как его называет формат.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Изображения нет на этом компьютере
figures-caption-placeholder = Что сказано об изображении
