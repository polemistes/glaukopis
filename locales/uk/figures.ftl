# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Рисунок
figures-width = Ширина
figures-width-third = Третина
figures-width-half = Половина
figures-width-three-quarters = Три чверті
figures-width-whole = Уся
figures-width-of-row = Від місця, яке він має в ряду.
figures-width-of-text = Від ширини тексту в документі.
figures-shows = Показує
figures-shows-placeholder = Словами, для тих, хто не може його бачити
figures-numbered = Нумерований, як «Рисунок 1»
figures-keep-caption = Зберегти підпис із зображенням
figures-keep-caption-hint = Рисунки з цим зображенням тоді починатимуться з того, що сказано тут
figures-take-caption = Узяти власний підпис зображення
figures-take-caption-hint = Те, що збережено із зображенням, стає тут замість сказаного тепер
figures-another-picture = Інше зображення…
figures-remove = Вилучити рисунок
figures-caption-kept = Збережено із зображенням
figures-caption-kept-detail = Рисунки з ним починаються з цих слів.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Зображення
# What the files that can be chosen there are called.
figures-picture-files = Зображення

## The store of pictures, as the text reads it.

figures-pictures-unread = Не вдалося прочитати зображення
figures-picture-not-taken = Не вдалося додати зображення
figures-picture-not-kept = Не вдалося зберегти сказане про зображення
figures-picture-not-removed = Не вдалося вилучити зображення

## Where a figure, a table or an equation stands.

figures-stands = Стоїть
figures-stands-in-row = поруч з іншими, в ряду
figures-stands-alone = Знову окремо
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Де стоїть { $kind ->
        [figure] рисунок
        [table] таблиця
       *[equation] рівняння
    }
figures-side-format = Як у форматі
figures-side-left = Ліворуч
figures-side-middle = Посередині
figures-side-right = Праворуч
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = У форматі { $kind ->
        [figure] рисунки
        [table] таблиці
       *[equation] рівняння
    } стоять { $side ->
        [left] ліворуч
        [right] праворуч
       *[center] посередині
    }{ $flow ->
        [around] , і текст обтікає їх
        [apart] , окремо від тексту
       *[none] {""}
    }.
figures-text = Текст
figures-flows-where = Чи обтікає текст { $kind ->
        [figure] рисунок
        [table] таблицю
       *[equation] рівняння
    }
figures-flow-format = Як у форматі
figures-flow-around = Обтікає
figures-flow-apart = Стоїть окремо
figures-flow-at-side = Текст обтікає те, що стоїть збоку.
figures-beside = Поставити поруч із попереднім

## A formula in the line, and an equation on a line of its own.

figures-formula = Формула
figures-equation = Рівняння
figures-equation-numbered = Нумероване
figures-formula-field = Формула в записі TeX
figures-formula-empty = Написане показується тут так, як стоятиме.
figures-formula-hint = Пишеться як у TeX. Enter — готово, Esc — залишити як було.
figures-equation-hint = Пишеться як у TeX. Enter — готово, Shift+Enter — новий рядок, Esc — залишити як було.
figures-formula-unread = Не вдалося прочитати формулу.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = формула
figures-equation-blank = Рівняння

## What can be put into a formula by pressing.

figures-sign-raised = Верхній індекс
figures-sign-lowered = Нижній індекс
figures-sign-fraction = Дріб
figures-sign-root = Корінь
figures-sign-sum = Сума
figures-sign-integral = Інтеграл
figures-sign-brackets = Дужки, що ростуть
figures-sign-alpha = альфа
figures-sign-beta = бета
figures-sign-gamma = гамма
figures-sign-lambda = лямбда
figures-sign-pi = пі
figures-sign-sigma = сигма
figures-sign-less-or-equal = Менше або дорівнює
figures-sign-greater-or-equal = Більше або дорівнює
figures-sign-not-equal = Не дорівнює
figures-sign-nearly-equal = Приблизно дорівнює
figures-sign-times = Множення
figures-sign-plus-or-minus = Плюс-мінус
figures-sign-arrow = Стрілка
figures-sign-infinity = Нескінченність
figures-sign-words = Слова всередині формули

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Показано як
figures-form-full = Слово й номер
figures-form-number = Лише номер
figures-form-equation = Номер, як він стоїть біля рівняння
figures-form-its-number = Його номер
figures-form-its-name = Його назва
figures-go-to = Перейти до того, на що воно вказує
figures-pointed-gone = Того, на що воно вказує, в документі більше немає
figures-point-elsewhere = Посилатися на інше…

## Choosing what a cross-reference refers to.

figures-targets = Виберіть, на що посилатися
figures-targets-placeholder = Посилання на рисунок, таблицю, рівняння, частину
figures-targets-search = Шукати, на що можна послатися
figures-targets-results = На що можна послатися
figures-targets-figures = Рисунки
figures-targets-tables = Таблиці
figures-targets-equations = Рівняння
figures-targets-parts = Частини документа
figures-targets-figure-unsaid = Рисунок, про який нічого не сказано
figures-targets-table-unsaid = Таблиця, про яку нічого не сказано
figures-targets-no-match = Ніщо в документі не відповідає цим словам.
figures-targets-none = Поки що немає на що посилатися: ні рисунка, ні таблиці, ні нумерованого рівняння, ні частини з назвою.
figures-targets-hint = Посилання йде за тим, на що вказує: за його номером і тим, як формат його називає.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Зображення немає на цьому компʼютері
figures-caption-placeholder = Що сказано про зображення
