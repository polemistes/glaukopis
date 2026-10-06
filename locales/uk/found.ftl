# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Знайдені цитування
# On the tab of the panel, beside the other tabs: short.
found-tab = Знайдені
found-between = Між мапою та знайденими цитуваннями
found-taken = Що вважати цитуваннями
found-taken-always = Зроблене програмою, і теги
found-taken-years = Дужки з роком усередині
found-taken-named = Примітки, що називають працю з бібліотеки
found-taken-notes = Кожну примітку
found-asking = Запит до бібліотеки…
found-make-certain = { $count ->
    [one] Зробити цитуванням { $count } безсумнівне
    [few] Зробити цитуваннями { $count } безсумнівні
    [many] Зробити цитуваннями { $count } безсумнівних
   *[other] Зробити цитуваннями { $count } безсумнівних
}
found-made = { $count ->
    [one] Зроблено { $count } цитування
    [few] Зроблено { $count } цитування
    [many] Зроблено { $count } цитувань
   *[other] Зроблено { $count } цитування
}
found-made-undo = Ctrl+Z повертає їх назад, одним кроком.
found-library-failed = Не вдалося звернутися до бібліотеки.
found-nothing = Нема чого переглядати
found-nothing-looked = У цій мапі не лишилося жодного знайденого цитування, і ніщо в ній не схоже на цитування.
found-nothing-looked-more = У цій мапі не лишилося жодного знайденого цитування, і ніщо в ній не схоже на цитування. Вище можна вказати, що ще вважати цитуваннями.
found-nothing-not-looked = У цій мапі не лишилося жодного знайденого цитування. Текст, що лише схожий на цитування, шукається, коли ви вкажете вище, що вважати цитуванням: дужки з роком усередині або примітки.
found-list-label = Що є переглянути
found-untitled = Без назви
found-in-a-note = У примітці
# The element of the map a citation stands in.
found-in = У «{ $element }»
found-in-note-of = У примітці до «{ $element }»
# Set small and high after the words a note stands after.
found-note-mark = примітка
found-position = { $index } з { $count }
found-previous = Попереднє
found-next = Наступне
found-list-show = Показати список
found-list-hide = Сховати список
found-later = Пізніше
found-leave = Залишити текстом
found-make = Зробити цитуванням

## How sure the library is of what it proposes.

found-sure-certain = У бібліотеці воно є напевно
found-sure-likely = У бібліотеці є те, що, ймовірно, є ним
found-sure-possible = У бібліотеці є те, що може бути ним
found-sure-none = Якась його праця ще не має джерела

## By what a citation was found.

found-by-zotero = Зроблено Zotero
found-by-mendeley = Зроблено Mendeley або програмою, що пише так само
found-by-key = Тег, що називає джерело
found-by-form = Узято за цитування з вигляду

## The citation that is to be made.

found-the-citation = Цитування
found-no-works = Воно не називає жодної праці. Додайте якусь або залиште його текстом, яким воно є.
found-add-work = Додати працю
found-author-in-text = Автор у тексті: Nagy (1979)
found-pick-work = Цитована праця: автор, назва, рік
found-pick-add = Додати працю до цитування
found-too-little = Файл каже про цю працю замало, щоб зробити з неї джерело
found-reference-failed = Не вдалося створити джерело

## A citation that stands in a note.

found-in-note = Воно стоїть у примітці
found-note-becomes = Примітка стає цитуванням
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Решта сказаного в примітці йде перед її працями й після них{ $has ->
        [before] : «{ $before }» перед
        [after] : «{ $after }» після
       *[both] : «{ $before }» перед, «{ $after }» після
    }. Стиль цитування ставить це в рядок або в примітку.
found-note-style = Стиль цитування ставить це в рядок або в примітку.
found-citation-in-note = Цитування стоїть у примітці
    .hint = Примітка залишається приміткою, з усім іншим, що в ній сказано.
found-for-all = Так само для всіх наступних
found-note-not = Воно не стоїть у примітці.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Примітка містить { $what ->
        [math] формулу
        [crossref] посилання
        [citation] цитування
        [hard_break] другий рядок
       *[other] щось, що не є текстом
    }, чого слова перед працею й після неї вмістити не можуть.
found-note-another = Примітка містить ще одне знайдене цитування, яке загубилося б у словах після цього.

## Why what was asked could not be done.

found-trouble-gone = Його більше немає в тексті.
found-trouble-changed = Текст тут змінився, відколи це запропоновано, і його переглянуто знову.
found-trouble-cannot = Зробити з нього цитування тут не можна.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } і { $second }
found-people-more = { $first } та ін.
found-work-a-work = Праця
found-work-looking = { $work } шукається у вашій бібліотеці…
found-work-no-tag = { $work } — тег, якого не має жодне джерело вашої бібліотеки.
found-work-not-found = { $work } не знайдено у вашій бібліотеці.
found-work-chosen = Вибрано вами
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Як ви вибрали для тієї самої праці
found-work-certain = Напевно
found-work-likely = Імовірно
found-work-possible = Можливо
# What the text says the work is.
found-work-for = для «{ $work }»
found-work-others = Інші джерела, якими вона може бути
found-work-or = Або
found-work-may-be = Це може бути
found-work-another = Інше…
found-work-find = Знайти…
found-work-add = Додати до бібліотеки
