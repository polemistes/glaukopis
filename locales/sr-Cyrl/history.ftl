# The full history of a project, in English.
# See locales/README.md.

history-title = Историја
history-between = Између мапа и историје
history-settings = Подешавања историје
history-failed = Историја није могла да се прочита.
history-reading = Читање историје…

## When it is not kept

history-off = Историја овог пројекта се не води.
history-on-word = Свака измена се чува
history-off-word = Не води се
history-off-about = Док се води, чува се свака измена, с тим ко ју је направио и кад: пројекат се може погледати какав је био у било ком тренутку, и вратити. Заузима простор, а у дељеном пројекту показује осталима шта је ко написао, и кад.
history-turn-on = Води историју

## The moments

# Someone whose name the history does not know.
history-someone = Неко
history-began = Историја почиње
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = сачувано мање детаљно
history-added = { $count ->
    [one] +{ $count } знак
    [few] +{ $count } знака
   *[other] +{ $count } знакова
}
history-removed = { $count ->
    [one] −{ $count } знак
    [few] −{ $count } знака
   *[other] −{ $count } знакова
}

## The map as it was

history-back = Назад у садашњост
history-as-it-was = Каква је била { $when }
history-marked = Што се изменило од претходног тренутка обележено је бојом онога ко је изменио.
history-map-not-there = Ове мапе тада није било.
history-added-by = Додао/ла { $name }
history-removed-by = Уклонио/ла { $name }
history-changed-by = Изменио/ла { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = упутница
history-name-moment = Именуј овај тренутак
history-name-placeholder = Како да се зове
history-named = Тренутак се зове „{ $name }“.
history-bring-back-element = Врати овај елемент какав је био
history-bring-back-map = Врати мапу какву је била
history-brought-back = Враћено какво је било. „Опозови“ то поништава.
history-bring-back-failed = Није могло да се врати.
history-open-copy = Отвори као засебан пројекат
history-copy-name = { $name }, какав је био { $day }
history-copy-failed = Пројекат није могао да се направи.

## Archives

history-open-archive = Отвори архиву…
history-archive-kind = Историја програма Glaukopis
history-archive-unread = Архива није могла да се прочита.
history-archive-of = Архива: { $name }
history-archive-close = Затвори

## Settings

history-keep = Води историју
history-room = Историја заузима { $size }.
history-turn-off-title = Престати с вођењем историје?
history-turn-off-message = Сачувано се брише. Сам пројекат остаје какав јесте.
history-turn-off-shared = Сачувано се брише, овде и на рачунарима оних с којима се пројекат дели. Сам пројекат остаје какав јесте.
history-turn-off = Обриши историју
history-finely = Старија историја
history-finely-about = Старије измене се спајају, да би заузимале мање простора и брже се читале; тренуци унутар њих онда се више не могу разликовати. Именовани тренуци, и они с којима се пореде прегледи измена, чувају се.
history-hourly = Спој сваки сат у један после
history-weeks = { $count ->
    [one] недеље
    [few] недеље
   *[other] недеља
}
history-daily = Спој сваки дан у један после
history-months = { $count ->
    [one] месеца
    [few] месеца
   *[other] месеци
}
history-before = Што је било пре
history-before-choose = Изаберите тренутак у историји да архивирате или обришете оно што је било пре њега.
history-before-about = Историја пре { $when } може се архивирати у датотеку, да се погледа касније, или обрисати.
history-archive = Архивирај…
history-delete = Обриши
history-archive-title = Архивирати историју пре { $when }?
history-delete-title = Обрисати историју пре { $when }?
history-cut-message = Оно што остаје почиње пројектом какав је тада био.
history-cut-kept = { $count ->
    [one] { $count } именовани или прегледани тренутак је пре њега и више се не може погледати овде.
    [few] { $count } именована или прегледана тренутка су пре њега и више се не могу погледати овде.
   *[other] { $count } именованих или прегледаних тренутака је пре њега и више се не могу погледати овде.
}
history-cut-not-here = Историја се не може скратити пре овог тренутка.
history-cut-failed = Историја није могла да се скрати.
history-archive-until = до { $when }
history-archived = Историја пре { $when } је архивирана.
history-deleted = Историја пре { $when } је обрисана.
