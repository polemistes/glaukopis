# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Найденные ссылки
# On the tab of the panel, beside the other tabs: short.
found-tab = Найденные
found-between = Между картой и найденными ссылками
found-taken = Что считать ссылками
found-taken-always = Сделанное программой и метки
found-taken-years = Скобки с годом внутри
found-taken-named = Сноски, называющие работу из библиотеки
found-taken-notes = Все сноски
found-asking = Запрос к библиотеке…
found-make-certain = { $count ->
    [one] Сделать ссылкой { $count } несомненную
    [few] Сделать ссылками { $count } несомненные
    [many] Сделать ссылками { $count } несомненных
   *[other] Сделать ссылками { $count } несомненные
}
found-made = { $count ->
    [one] Сделана { $count } ссылка
    [few] Сделаны { $count } ссылки
    [many] Сделано { $count } ссылок
   *[other] Сделаны { $count } ссылки
}
found-made-undo = Ctrl+Z отменяет их одним шагом.
found-library-failed = Не удалось обратиться к библиотеке.
found-nothing = Разбирать нечего
found-nothing-looked = В этой карте не осталось найденных ссылок, и ничего в ней на ссылку не похоже.
found-nothing-looked-more = В этой карте не осталось найденных ссылок, и ничего в ней на ссылку не похоже. Выше можно считать ссылками больше.
found-nothing-not-looked = В этой карте не осталось найденных ссылок. Текст, лишь похожий на ссылку, ищется, когда вы укажете выше, что считать ссылкой: скобки с годом внутри или сноски.
found-list-label = Что осталось разобрать
found-untitled = Без названия
found-in-a-note = В сноске
# The element of the map a citation stands in.
found-in = В «{ $element }»
found-in-note-of = В сноске к «{ $element }»
# Set small and high after the words a note stands after.
found-note-mark = сноска
found-position = { $index } из { $count }
found-previous = Предыдущая
found-next = Следующая
found-list-show = Показать список
found-list-hide = Скрыть список
found-later = Позже
found-leave = Оставить текстом
found-make = Сделать ссылкой

## How sure the library is of what it proposes.

found-sure-certain = В библиотеке она есть несомненно
found-sure-likely = В библиотеке есть то, что, вероятно, она
found-sure-possible = В библиотеке есть то, что может быть ею
found-sure-none = У одной из её работ ещё нет источника

## By what a citation was found.

found-by-zotero = Сделана Zotero
found-by-mendeley = Сделана Mendeley или программой, которая пишет так же
found-by-key = Метка, называющая источник
found-by-form = Принята за ссылку по тому, как выглядит

## The citation that is to be made.

found-the-citation = Ссылка
found-no-works = Она не называет ни одной работы. Добавьте работу или оставьте её текстом, как есть.
found-add-work = Добавить работу
found-author-in-text = Автор в тексте: Nagy (1979)
found-pick-work = Цитируемая работа: автор, название, год
found-pick-add = Добавить работу в ссылку
found-too-little = Файл говорит об этой работе слишком мало, чтобы сделать из этого источник
found-reference-failed = Не удалось создать источник

## A citation that stands in a note.

found-in-note = Она стоит в сноске
found-note-becomes = Сноска становится ссылкой
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Остальное в сноске идёт до и после её работ{ $has ->
        [before] : «{ $before }» до
        [after] : «{ $after }» после
       *[both] : «{ $before }» до, «{ $after }» после
    }. Стиль цитирования ставит её в строку или в сноску.
found-note-style = Стиль цитирования ставит её в строку или в сноску.
found-citation-in-note = Ссылка стоит в сноске
    .hint = Сноска остаётся сноской со всем остальным, что в ней сказано.
found-for-all = Так же для всех последующих
found-note-not = Она не стоит в сноске.
# What else the note holds, by the name of what it is in the text.
found-note-holds = В сноске есть { $what ->
        [math] формула
        [crossref] перекрёстная ссылка
        [citation] ссылка
        [hard_break] вторая строка
       *[other] что-то, что не является текстом
    }, чего слова до и после работы вместить не могут.
found-note-another = В сноске есть ещё одна найденная ссылка, которая потерялась бы в словах после этой.

## Why what was asked could not be done.

found-trouble-gone = Её больше нет в тексте.
found-trouble-changed = Текст здесь изменился с тех пор, как она была предложена, и просмотрен заново.
found-trouble-cannot = Здесь из неё нельзя сделать ссылку.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } и { $second }
found-people-more = { $first } и др.
found-work-a-work = Работа
found-work-looking = { $work } ищется в вашей библиотеке…
found-work-no-tag = { $work } — метка, которой нет ни у одного источника в вашей библиотеке.
found-work-not-found = { $work } не найдено в вашей библиотеке.
found-work-chosen = Выбрано вами
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Как вы выбрали для той же работы
found-work-certain = Несомненно
found-work-likely = Вероятно
found-work-possible = Возможно
# What the text says the work is.
found-work-for = для «{ $work }»
found-work-others = Другие источники, которыми она может быть
found-work-or = Или
found-work-may-be = Может быть
found-work-another = Другой…
found-work-find = Найти…
found-work-add = Добавить в библиотеку
