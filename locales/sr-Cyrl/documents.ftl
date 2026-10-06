# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Документ за учитавање
documents-filter = Документи
documents-filter-all = Све датотеке
documents-title-map = Мапа из документа
documents-title-project = Пројекат из документа
documents-reading = Читање { $file }…
documents-reading-hint = Дугачак документ потраје који тренутак.
documents-no-pandoc = Документе ове врсте чита Pandoc, који није инсталиран или није могао да се нађе. Где је, може се рећи у подешавањима.
documents-unread = Датотека није могла да се прочита.
documents-title = Наслов
documents-title-hint-map = Назив мапе и елемента у њеном средишту.
documents-title-hint-project = Назив пројекта, његове мапе и елемента у средишту мапе.
# What a project made of a document is called when the document has no title.
documents-untitled = Без наслова

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Део
    [few] Дела
   *[other] Делова
}
documents-words = { $count ->
    [one] Реч
    [few] Речи
   *[other] Речи
}
documents-notes = { $count ->
    [one] Напомена
    [few] Напомене
   *[other] Напомена
}
documents-figures = { $count ->
    [one] Илустрација
    [few] Илустрације
   *[other] Илустрација
}
documents-tables = { $count ->
    [one] Табела
    [few] Табеле
   *[other] Табела
}
documents-equations = { $count ->
    [one] Једначина
    [few] Једначине
   *[other] Једначина
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Дела из ваше библиотеке цитирана су { $cited ->
        [1] једном
        [2] двапут
        [one] { $cited } пут
        [few] { $cited } пута
       *[other] { $cited } пута
    }.
documents-cited-not-in-library = Дела којих нема у вашој библиотеци цитирана су { $missing ->
        [1] једном
        [2] двапут
        [one] { $missing } пут
        [few] { $missing } пута
       *[other] { $missing } пута
    }.
documents-cited-both = Дела из ваше библиотеке цитирана су { $cited ->
        [1] једном
        [2] двапут
        [one] { $cited } пут
        [few] { $cited } пута
       *[other] { $cited } пута
    }, а дела којих у њој нема { $missing ->
        [1] једном
        [2] двапут
        [one] { $missing } пут
        [few] { $missing } пута
       *[other] { $missing } пута
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Пронађен је { $count } цитат.
    [few] Пронађена су { $count } цитата.
   *[other] Пронађено је { $count } цитата.
}
documents-found-made = { $count ->
    [one] Пронађен је { $count } цитат, који је направио програм за вођење референци.
    [few] Пронађена су { $count } цитата, а све их је направио програм за вођење референци.
   *[other] Пронађено је { $count } цитата, а све их је направио програм за вођење референци.
}
documents-found-some-made = { $count ->
    [one] Пронађен је { $count } цитат; { $made } од њих направио је програм за вођење референци.
    [few] Пронађена су { $count } цитата; { $made } од њих направио је програм за вођење референци.
   *[other] Пронађено је { $count } цитата; { $made } од њих направио је програм за вођење референци.
}
documents-at-once = Одмах направи цитате од оних које је Zotero направио од дела која ваша библиотека има
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Напомена која је само цитат постаје цитат у реду, који стил цитирања ставља у напомену или у ред; напомена која каже више задржава свој цитат. Што сте за напомене изабрали у панелу пронађених цитата, за све што следи, важи и овде.
documents-go-through-map = Прегледај цитате кад се мапа направи
documents-go-through-project = Прегледај цитате кад се пројекат направи

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Добро је знати
documents-making = Прављење мапе…
documents-make-map = Направи мапу
documents-make-project = Направи пројекат
documents-map-failed = Мапа није могла да се направи.
