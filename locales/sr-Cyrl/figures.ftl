# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Илустрација
figures-width = Ширина
figures-width-third = Трећина
figures-width-half = Половина
figures-width-three-quarters = Три четвртине
figures-width-whole = Цела
figures-width-of-row = Од простора који има у низу.
figures-width-of-text = Од ширине текста, у документу.
figures-shows = Приказује
figures-shows-placeholder = Речима, за оне који је не виде
figures-numbered = Нумерисана, као „Слика 1“
figures-keep-caption = Сачувај натпис уз слику
figures-keep-caption-hint = Илустрације направљене с овом сликом онда почињу оним што је овде речено
figures-take-caption = Узми натпис саме слике
figures-take-caption-hint = Оно што је сачувано уз слику долази овде, уместо онога што сада пише
figures-another-picture = Друга слика…
figures-remove = Уклони илустрацију
figures-caption-kept = Сачувано уз слику
figures-caption-kept-detail = Илустрације направљене с њом почињу овим речима.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Слика
# What the files that can be chosen there are called.
figures-picture-files = Слике

## The store of pictures, as the text reads it.

figures-pictures-unread = Слике нису могле да се прочитају
figures-picture-not-taken = Слика није могла да се дода
figures-picture-not-kept = Оно што је речено о слици није могло да се сачува
figures-picture-not-removed = Слика није могла да се уклони

## Where a figure, a table or an equation stands.

figures-stands = Положај
figures-stands-in-row = поред других, у низу
figures-stands-alone = Поново самостално
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = Где стоји { $kind ->
        [figure] илустрација
        [table] табела
       *[equation] једначина
    }
figures-side-format = Као у формату
figures-side-left = Лево
figures-side-middle = У средини
figures-side-right = Десно
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Формат ставља { $kind ->
        [figure] илустрације
        [table] табеле
       *[equation] једначине
    } { $side ->
        [left] лево
        [right] десно
       *[center] у средину
    }{ $flow ->
        [around] , с текстом који их оптиче
        [apart] , одвојено од текста
       *[none] {""}
    }.
figures-text = Текст
figures-flows-where = Да ли текст оптиче { $kind ->
        [figure] илустрацију
        [table] табелу
       *[equation] једначину
    }
figures-flow-format = Као у формату
figures-flow-around = Оптиче је
figures-flow-apart = Стоји одвојено
figures-flow-at-side = Текст оптиче оно што стоји са стране.
figures-beside = Стави је поред претходне

## A formula in the line, and an equation on a line of its own.

figures-formula = Формула
figures-equation = Једначина
figures-equation-numbered = Нумерисана
figures-formula-field = Формула, у нотацији TeX-а
figures-formula-empty = Написано се овде приказује онако како ће стајати.
figures-formula-hint = Пише се као у TeX-у. Enter кад завршите, Esc да остане како је било.
figures-equation-hint = Пише се као у TeX-у. Enter кад завршите, Shift+Enter за нови ред, Esc да остане како је било.
figures-formula-unread = Формула није могла да се прочита.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = формула
figures-equation-blank = Једначина

## What can be put into a formula by pressing.

figures-sign-raised = Изнад
figures-sign-lowered = Испод
figures-sign-fraction = Разломак
figures-sign-root = Корен
figures-sign-sum = Збир
figures-sign-integral = Интеграл
figures-sign-brackets = Заграде које расту
figures-sign-alpha = алфа
figures-sign-beta = бета
figures-sign-gamma = гама
figures-sign-lambda = ламбда
figures-sign-pi = пи
figures-sign-sigma = сигма
figures-sign-less-or-equal = Мање или једнако
figures-sign-greater-or-equal = Веће или једнако
figures-sign-not-equal = Није једнако
figures-sign-nearly-equal = Приближно једнако
figures-sign-times = Пута
figures-sign-plus-or-minus = Плус или минус
figures-sign-arrow = Стрелица
figures-sign-infinity = Бесконачно
figures-sign-words = Речи унутар формуле

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Приказано као
figures-form-full = Реч и број
figures-form-number = Само број
figures-form-equation = Број онакав какав стоји уз једначину
figures-form-its-number = Његов број
figures-form-its-name = Његов назив
figures-go-to = Иди на оно на шта упућује
figures-pointed-gone = Онога на шта ово упућује више нема у документу
figures-point-elsewhere = Упути на нешто друго…

## Choosing what a cross-reference refers to.

figures-targets = Изаберите на шта се упућује
figures-targets-placeholder = Упути на илустрацију, табелу, једначину, део
figures-targets-search = Претражи оно на шта се може упутити
figures-targets-results = На шта се може упутити
figures-targets-figures = Илустрације
figures-targets-tables = Табеле
figures-targets-equations = Једначине
figures-targets-parts = Делови документа
figures-targets-figure-unsaid = Илустрација о којој ништа није речено
figures-targets-table-unsaid = Табела о којој ништа није речено
figures-targets-no-match = Ништа у документу не одговара овим речима.
figures-targets-none = Још нема на шта да се упути: нема илустрације, табеле, нумерисане једначине ни дела с називом.
figures-targets-hint = Упутница прати оно на шта упућује: његов број и како га формат зове.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Слике нема на овом рачунару
figures-caption-placeholder = Шта се каже о слици
