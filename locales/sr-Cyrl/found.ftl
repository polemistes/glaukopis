# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Пронађени цитати
# On the tab of the panel, beside the other tabs: short.
found-tab = Пронађени цитати
found-between = Између мапе и пронађених цитата
found-taken = Шта се узима за цитате
found-taken-always = Што је направио програм, и ознаке
found-taken-years = Заграде у којима је година
found-taken-named = Напомене које именују дело из библиотеке
found-taken-notes = Свака напомена
found-asking = Упит библиотеци…
found-make-certain = { $count ->
    [one] Направи цитат од { $count } сигурног
    [few] Направи цитате од { $count } сигурна
   *[other] Направи цитате од { $count } сигурних
}
found-made = { $count ->
    [one] Направљен је { $count } цитат
    [few] Направљена су { $count } цитата
   *[other] Направљено је { $count } цитата
}
found-made-undo = Ctrl+Z их враћа, у једном кораку.
found-library-failed = Библиотеци није могао да се упути упит.
found-nothing = Нема шта да се прегледа
found-nothing-looked = У овој мапи није остао ниједан пронађени цитат, и ништа у њој не личи на цитат.
found-nothing-looked-more = У овој мапи није остао ниједан пронађени цитат, и ништа у њој не личи на цитат. Горе се може одредити да се више тога узима за цитате.
found-nothing-not-looked = У овој мапи није остао ниједан пронађени цитат. Текст који само личи на цитат тражи се кад горе одредите шта се узима за цитат: заграде у којима је година, или напомене.
found-list-label = Шта има да се прегледа
found-untitled = Без наслова
found-in-a-note = У напомени
# The element of the map a citation stands in.
found-in = У „{ $element }“
found-in-note-of = У напомени уз „{ $element }“
# Set small and high after the words a note stands after.
found-note-mark = напомена
found-position = { $index } од { $count }
found-previous = Претходни
found-next = Следећи
found-list-show = Прикажи списак
found-list-hide = Сакриј списак
found-later = Касније
found-leave = Остави као текст
found-make = Претвори у цитат

## How sure the library is of what it proposes.

found-sure-certain = Библиотека га сигурно има
found-sure-likely = Библиотека има оно што је вероватно он
found-sure-possible = Библиотека има оно што би могао бити он
found-sure-none = Неко од његових дела још нема референцу

## By what a citation was found.

found-by-zotero = Направио Zotero
found-by-mendeley = Направио Mendeley, или програм који пише као он
found-by-key = Ознака која именује референцу
found-by-form = Узет за цитат по изгледу

## The citation that is to be made.

found-the-citation = Цитат
found-no-works = Не именује ниједно дело. Додајте једно, или га оставите као текст какав јесте.
found-add-work = Додај дело
found-author-in-text = Аутор у тексту: Nagy (1979)
found-pick-work = Дело које се цитира: аутор, наслов, година
found-pick-add = Додај дело у цитат
found-too-little = Датотека прекратко говори о овом делу да би се од тога направила референца
found-reference-failed = Референца није могла да се направи

## A citation that stands in a note.

found-in-note = Стоји у напомени
found-note-becomes = Напомена постаје цитат
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Остало што напомена каже иде испред и иза њених дела{ $has ->
        [before] : „{ $before }“ испред
        [after] : „{ $after }“ иза
       *[both] : „{ $before }“ испред, „{ $after }“ иза
    }. Стил цитирања то ставља у ред или у напомену.
found-note-style = Стил цитирања то ставља у ред или у напомену.
found-citation-in-note = Цитат стоји у напомени
    .hint = Напомена остаје напомена, с осталим што каже.
found-for-all = Тако и за све што следи
found-note-not = Не стоји у напомени.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Напомена садржи { $what ->
        [math] формулу
        [crossref] упутницу
        [citation] цитат
        [hard_break] други ред
       *[other] нешто што није текст
    }, што речи испред и иза дела не могу да садрже.
found-note-another = Напомена садржи други пронађени цитат, који би се изгубио у речима иза овога.

## Why what was asked could not be done.

found-trouble-gone = Више није у тексту.
found-trouble-changed = Текст се овде изменио откако је предлог дат, па је поново прегледан.
found-trouble-cannot = Од овога се овде не може направити цитат.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } и { $second }
found-people-more = { $first } и др.
found-work-a-work = Дело
found-work-looking = { $work } се тражи у вашој библиотеци…
found-work-no-tag = { $work } је ознака коју нема ниједна референца ваше библиотеке.
found-work-not-found = { $work } није пронађено у вашој библиотеци.
found-work-chosen = Изабрали сте ви
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Као што сте изабрали за исто дело
found-work-certain = Сигурно
found-work-likely = Вероватно
found-work-possible = Могуће
# What the text says the work is.
found-work-for = за „{ $work }“
found-work-others = Друге референце које би могле бити
found-work-or = Или
found-work-may-be = Можда је
found-work-another = Друга…
found-work-find = Нађи је…
found-work-add = Додај у библиотеку
