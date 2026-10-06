# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Често коришћена
library-form-add-field = Додај поље
library-form-citation-key = Кључ цитата
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = направљен од аутора и године
library-form-date-problem = Датум пишите као 1979, 1979-05 или 1979-05-12; распон као 1979/1985.
library-form-remove-field = Уклони { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Установа или друго име које се чува цело
library-names-prefix-suffix = Префикс и суфикс
    .hint = „van“, „de la“ · „Jr.“, „III“
library-names-move-up = Помери горе
library-names-move-down = Помери доле
library-names-more = Још за ово име
library-names-name = Име
library-names-name-of = { $role }: име
library-names-family = Презиме
library-names-family-of = { $role }: презиме
library-names-given = Лична имена
library-names-given-of = { $role }: лична имена
library-names-prefix = Префикс: van, de la
library-names-prefix-of = { $role }: префикс
library-names-suffix = Суфикс: Jr., III
library-names-suffix-of = { $role }: суфикс

## Words for references, wherever they are shown.

library-untitled = Без наслова
library-no-author = Без аутора
library-no-title = Без наслова
library-in-library = У вашој библиотеци

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = исти DOI
library-reason-isbn = исти ISBN
library-reason-identical = једнаке у свему по чему се једно дело разликује од другог
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] исти наслов, аутор и година
            [like] исти наслов и аутор, година размака
           *[none] исти наслов и аутор, година само на једној
        }
        [like] { $year ->
            [same] исти наслов и година, и заједнички аутор
            [like] исти наслов, заједнички аутор, година размака
           *[none] исти наслов, заједнички аутор, година само на једној
        }
       *[none] { $year ->
            [same] исти наслов и година, аутор само на једној
            [like] исти наслов, година размака, аутор само на једној
           *[none] исти наслов, аутор и година само на једној
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] исти аутор и година, и сличан наслов
            [like] исти аутор, сличан наслов, година размака
           *[none] исти аутор, сличан наслов, година само на једној
        }
        [like] { $year ->
            [same] иста година, сличан наслов, заједнички аутор
            [like] сличан наслов, заједнички аутор, година размака
           *[none] сличан наслов, заједнички аутор, година само на једној
        }
       *[none] { $year ->
            [same] иста година, сличан наслов, аутор само на једној
            [like] сличан наслов, година размака, аутор само на једној
           *[none] сличан наслов, аутор и година само на једној
        }
    }
}
library-reason-file = иста датотека
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } и { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = Ово је већ у вашој библиотеци.
library-duplicate-probable = Ово је можда већ у вашој библиотеци.
library-duplicate-use = Користи ову

## Duplicates in the library.

library-duplicates-title = Дупликати
library-duplicates-count = { $count ->
    [one] Изгледа да је { $count } референца у библиотеци више пута
    [few] Изгледа да су { $count } референце у библиотеци више пута
   *[other] Изгледа да је { $count } референци у библиотеци више пута
}
library-duplicates-none = Нема дупликата
    .text = Изгледа да ниједна референца није у библиотеци више пута.
library-duplicates-no-more = Нема више дупликата
    .text = Цитати спојених референци сада цитирају оне које су задржане.
library-duplicates-how = Кад се референце споје у једну, она коју задржите добија од осталих оно што јој недостаје, а задржава своје где се разликују. Њихове датотеке и збирке се спајају, а оно што их цитира цитира задржану.
library-duplicates-same = Исте
library-duplicates-probably-same = Вероватно исте
library-duplicates-keep-which = Која се задржава
library-duplicates-kept = Задржана
library-duplicates-different = Различите су
library-duplicates-merge = Споји их
library-duplicates-merging = Спајање…
library-duplicates-failed = Дупликати у библиотеци нису могли да се потраже
library-duplicates-merge-failed = Нису могле да се споје

## Importing references: what a file holds, against what the library has.

library-import = Увези
library-import-title = Увези референце
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } референца у: { $source }
    [few] { $count } референце у: { $source }
   *[other] { $count } референци у: { $source }
}
library-import-review = { $count ->
    [one] { $count } референца је можда већ у вашој библиотеци
    [few] { $count } референце су можда већ у вашој библиотеци
   *[other] { $count } референци је можда већ у вашој библиотеци
}
library-import-new = { $count ->
    [one] { $count } нова референца
    [few] { $count } нове референце
   *[other] { $count } нових референци
}
library-import-complete = { $count ->
    [one] { $count } референца која је већ у вашој библиотеци добија податке
    [few] { $count } референце које су већ у вашој библиотеци добијају податке
   *[other] { $count } референци које су већ у вашој библиотеци добија податке
}
library-import-known = { $count ->
    [one] { $count } референца је већ у вашој библиотеци
    [few] { $count } референце су већ у вашој библиотеци
   *[other] { $count } референци је већ у вашој библиотеци
}
library-import-repeated = { $count ->
    [one] { $count } референца се понавља унутар увоза
    [few] { $count } референце се понављају унутар увоза
   *[other] { $count } референци се понавља унутар увоза
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Добила би: { $fields }
library-import-gains-file = Датотека
library-import-gains-zotero = Њен кључ у програму Zotero
library-import-what-to-do = Шта урадити
library-import-merge = Исто дело: допуни оно које имам
library-import-skip = Исто дело: остави моје какво јесте
library-import-add = Друго дело: додај га
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = { $count ->
    [one] За { $count } исту:
    [few] За све { $count } исте:
   *[other] За свих { $count } истих:
}
library-import-all-probable = { $count ->
    [one] За { $count } вероватно исту:
    [few] За све { $count } вероватно исте:
   *[other] За свих { $count } вероватно истих:
}
library-import-all-merge = Допуни оне које имам
library-import-all-skip = Остави моје какве јесу
library-import-all-add = Ипак их све додај
library-import-more = …и још { $count }.
library-import-unread = { $count ->
    [one] { $count } део датотеке није могао да се прочита
    [few] { $count } дела датотеке нису могла да се прочитају
   *[other] { $count } делова датотеке није могло да се прочита
}
library-import-importing = Увоз…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } за додавање{ $merge ->
        [0] {""}
       *[other] , { $merge } за допуну
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } изостављено
    }
library-import-failed = Увоз није успео.

## The library: the list of references, and what can be done with them.

library-references = Референце
library-unread = Библиотека није могла да се прочита
library-all-references = Све референце
library-count = { $count ->
    [one] { $count } референца
    [few] { $count } референце
   *[other] { $count } референци
}
library-selected = { $count ->
    [one] Изабрана { $count } референца
    [few] Изабране { $count } референце
   *[other] Изабрано { $count } референци
}
library-selected-of = { $count ->
    [one] Изабрано { $selected } од { $count } референце
    [few] Изабрано { $selected } од { $count } референце
   *[other] Изабрано { $selected } од { $count } референци
}
library-new-reference = Нова референца
library-search = Претражи библиотеку
library-search-in = Претражи у: { $name }
library-search-clear = Очисти претрагу
library-sort = Ређај
library-sort-author = Аутор
library-sort-year = Година
library-sort-title = Наслов
library-sort-added = Датум додавања
library-sort-modified = Датум измене
library-sort-descending = Опадајуће

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Филтер
library-filters-on = { $count ->
    [one] Филтер: { $count } укључен
    [few] Филтер: { $count } укључена
   *[other] Филтер: { $count } укључених
}
library-filter-kind = Врста
library-filter-publisher = Издавач
library-filter-publisher-hint = Део назива
library-filter-any-publisher = Било који издавач
library-filter-year = Година
library-filter-from = Од
library-filter-to = До
library-filter-clear = Очисти филтере
library-filter-nothing-here = Овде нема шта да се филтрира.
# When the filters let nothing through.
library-nothing-passes = Ниједна приказана референца не пролази кроз филтере.
library-import-export = Увоз и извоз
library-import-file = Увези датотеку…
    .hint = BibLaTeX или BibTeX
library-paste = Налепи референце…
library-add-pdfs = Додај PDF датотеке…
    .hint = Свака се проналази и чува
library-import-zotero = Увези из програма Zotero…
library-find-duplicates = Нађи дупликате…
library-map-library = Мапа библиотеке…
library-map-collection = Мапа збирке „{ $name }“…
library-export-library = Извези библиотеку…
library-export-collection = Извези „{ $name }“…
library-export-one = Извези…
library-export-many = { $count ->
    [one] Извези { $count } референцу…
    [few] Извези { $count } референце…
   *[other] Извези { $count } референци…
}
library-export-title = Извези референце
# What a file of exported references is called, before it is given a name.
library-export-file-references = референце
library-export-file-library = библиотека
library-exported = { $count ->
    [one] Извезена { $count } референца
    [few] Извезене { $count } референце
   *[other] Извезено { $count } референци
}
library-export-failed = Извоз није успео
library-empty = Ваша библиотека је празна
    .text = Референце које овде додате доступне су у свим вашим пројектима. Почните с једном, или учитајте оне које већ имате.
library-collection-empty = У овој збирци још нема ничега
    .text = Превуците овамо референце из библиотеке, или додајте нову.
library-nothing-found = Ништа није пронађено
    .text = Ниједна референца не садржи све ове речи.
library-open-file = Отвори датотеку
library-file-open-failed = Датотека није могла да се отвори
library-add-to-collection = Додај у збирку
library-remove-from = Уклони из „{ $name }“
library-copy-key = Копирај кључ цитата
library-copied-key = Копирано „{ $key }“
library-copy-biblatex = Копирај као BibLaTeX
library-copied = Копирано
library-delete-one-title = Обрисати „{ $name }“?
library-delete-many-title = { $count ->
    [one] Обрисати { $count } референцу?
    [few] Обрисати { $count } референце?
   *[other] Обрисати { $count } референци?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = Ово уклања референцу из ваше библиотеке, из сваке збирке{ $files ->
        [0] {""}
        [one] , заједно с { $files } приложеном датотеком
        [few] , заједно с { $files } приложене датотеке
       *[other] , заједно с { $files } приложених датотека
    }.{ $projects ->
        [0] {""}
        [one] {" "}Цитира се у { $projects } пројекту, који чува њену копију.
        [few] {" "}Цитира се у { $projects } пројекта, који чувају њену копију.
       *[other] {" "}Цитира се у { $projects } пројеката, који чувају њену копију.
    }
library-delete-many = Ово их уклања из ваше библиотеке, из сваке збирке{ $files ->
        [0] {""}
        [one] , заједно с { $files } приложеном датотеком
        [few] , заједно с { $files } приложене датотеке
       *[other] , заједно с { $files } приложених датотека
    }.{ $projects ->
        [0] {""}
        [one] {" "}Пројекат који неке од њих цитира чува њихову копију.
        [few] {" "}{ $projects } пројекта која неке од њих цитирају чувају њихову копију.
       *[other] {" "}{ $projects } пројеката која неке од њих цитирају чувају њихову копију.
    }
library-delete-failed = Референце нису могле да се обришу
library-not-done = То није могло да се уради

## Collections.

library-collections = Збирке
# The projects that cite a work, in its pane.
library-cited-in = Цитирано у
library-not-cited = Не цитира се ни у једном пројекту.
library-cited-reading = Читање пројеката…
library-collections-hint = Збирке окупљају референце за неку тему или рад. Референца може бити у колико год збирки.
library-collection-new = Нова збирка
library-collection-new-inside = Нова збирка унутар
library-collection-new-under = Нова збирка у „{ $name }“
library-collection-move-to = Премести у
library-collection-name = Назив збирке
library-collection-name-failed = Збирка није могла да се именује
library-collection-expand = Расклопи
library-collection-collapse = Склопи
library-collection-to-top = Премести на највиши ниво
library-collection-move-failed = Збирка није могла да се премести
library-collection-added = { $count ->
    [one] { $count } референца додата у „{ $name }“
    [few] { $count } референце додате у „{ $name }“
   *[other] { $count } референци додато у „{ $name }“
}
library-collection-already = Већ у „{ $name }“
library-collection-delete = Обриши збирку
library-collection-delete-title = Обрисати збирку „{ $name }“?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Референце остају у вашој библиотеци.
   *[other] Збирке унутар ње такође се бришу. Референце остају у вашој библиотеци.
}
library-collection-delete-failed = Збирка није могла да се обрише
library-collection-count = { $count ->
    [one] { $count } збирка
    [few] { $count } збирке
   *[other] { $count } збирки
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Мапа библиотеке
library-map-title-collection = Мапа збирке
# The name a project made of the whole library is given.
library-map-library-name = Библиотека
library-map-name = Назив
library-map-name-hint = Назив пројекта, његове мапе и елемента у средишту мапе.
library-map-what-library = Збирке постају елементи, угнежђени као што јесу, а свака референца елемент под својом збирком, чији је текст њен цитат. Референце које нису ни у једној збирци стоје у средишту.
library-map-what-collection = Збирке у њој постају елементи, угнежђени као што јесу, а свака референца елемент под својом збирком, чији је текст њен цитат.
library-map-nothing = Нема референци за мапу.
library-map-make = Направи пројекат
library-map-making = Прављење пројекта…
library-map-failed = Пројекат није могао да се направи.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } датотека
    [few] { $count } датотеке
   *[other] { $count } датотека
}
library-open-failed = Референца није могла да се отвори
library-known = { $count ->
    [one] Већ је у вашој библиотеци
    [few] Већ су у вашој библиотеци
   *[other] Већ су у вашој библиотеци
}
library-nothing-to-import = Нема шта да се увезе
library-none-found = Нису пронађене референце.
library-import-kinds = Референце се читају из .bib датотека и праве од PDF датотека.
library-filter-bib = BibLaTeX и BibTeX
library-filter-all = Све датотеке
library-files-read-failed = { $count ->
    [one] Датотека није могла да се прочита
    [few] Датотеке нису могле да се прочитају
   *[other] Датотеке нису могле да се прочитају
}
library-text-read-failed = Текст није могао да се прочита
library-add-pdfs-title = Додај PDF датотеке
library-pdfs-working = { $count ->
    [one] Утврђивање шта је { $count } датотека…
    [few] Утврђивање шта су { $count } датотеке…
   *[other] Утврђивање шта је { $count } датотека…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } од { $count }: { $name }
library-stop = Заустави
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } референца додата
    [few] { $count } референце додате
   *[other] { $count } референци додато
}
library-imported-completed = { $count } допуњено
library-imported-skipped = { $count } већ у библиотеци
library-imported-files = { $count ->
    [one] { $count } датотека сачувана
    [few] { $count } датотеке сачуване
   *[other] { $count } датотека сачувано
}
library-imported-nothing = Ништа није измењено
library-paste-title = Налепи референце
library-paste-subtitle = BibLaTeX или BibTeX, колико год уноса желите
library-paste-continue = Настави
library-source-label = BibLaTeX извор

## Importing from Zotero.

library-zotero-title = Увоз из програма Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = На овом рачунару Zotero није пронађен на местима где обично чува своје податке. Ако их чува другде, покажите где: фасциклу која садржи { $file }.
library-zotero-lead = Увезено се копира у вашу библиотеку, с датотекама. Zotero се само чита и ништа се у њему не мења; може да буде покренут за то време.
library-zotero-choose = Фасцикла с подацима програма Zotero
library-zotero-none-there = Тамо нема програма Zotero.
library-zotero-unread = Zotero није могао да се прочита.
library-zotero-library = Библиотека
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Моја библиотека
library-zotero-what = Шта увести
library-zotero-everything = Све
library-zotero-with-files = С приложеним датотекама
library-zotero-with-notes = С белешкама, као анотацијама
library-zotero-elsewhere = Друго место…
library-zotero-show-where = Покажи где…
library-zotero-reading = Читање…
library-zotero-read = { $count ->
    [0] Прочитано
    [one] Прочитана { $count } референца
    [few] Прочитане { $count } референце
   *[other] Прочитано { $count } референци
}

## Writing a reference.

library-dialog-edit = Уреди референцу
library-dialog-add = Додај референцу
library-dialog-back = Назад на образац
library-dialog-open-failed = Референца није могла да се отвори.
library-dialog-save-failed = Референца није могла да се сачува.
# The entry as BibLaTeX, as against the form.
library-source = Извор
library-source-unread = Извор није могао да се прочита.

## A reference, beside the list.

library-pane-label = Референца
library-pane-more = Још
library-pane-saved = Сачувано
library-pane-editing = Уређивање…
library-pane-not-saved = Није сачувано
library-pane-unread = Референца није могла да се прочита.
library-pane-save-failed = Измене нису могле да се сачувају.
library-pane-note-placeholder = Шта мислите о њој. За вас: није део онога што се цитира.
library-pane-files = Датотеке
library-pane-attach = Приложи
library-pane-attach-title = Приложи датотеке
library-pane-attach-failed = Датотека није могла да се приложи
# Of a file that is attached, and not where it should be.
library-pane-missing = недостаје
library-pane-reveal = Прикажи у управљачу датотека
library-pane-reveal-failed = Фасцикла није могла да се отвори
library-pane-no-files = Нема датотека. Приложите PDF, или га спустите овде.
library-pane-detach = Уклони датотеку
library-pane-detach-title = Уклонити „{ $name }“?
library-pane-detach-message = Датотека се брише из складишта библиотеке, осим ако је користи друга референца.
library-pane-detach-failed = Датотека није могла да се уклони
library-pane-leave-collection = Уклони из: { $name }
library-pane-duplicate = Удвостручи
    .hint = Нова референца која почиње овим подацима
library-pane-edit-source = Уреди извор…
library-pane-source-subtitle = Унос као BibLaTeX. Већина ствари је лакша у обрасцу.
library-pane-source-failed = Извор није могао да се прикаже
library-pane-added = Додато { $date }
library-pane-added-changed = Додато { $added } · измењено { $changed }

## Looking up a reference.

library-lookup-placeholder = Потражи: DOI, ISBN или речи из наслова и имена аутора
library-lookup-label = Потражи референцу
library-lookup-failed = Ништа није могло да се потражи.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Попуњено из: { $source }.
library-lookup-others = { $count ->
    [one] { $count } други запис
    [few] { $count } друга записа
   *[other] { $count } других записа
}
library-lookup-scope = Шта тражити
library-lookup-any = Било шта
library-lookup-books = Књиге
library-lookup-articles = Чланке
library-lookup-none = Ништа није пронађено. Мање речи може наћи више: презиме аутора и реч-две из наслова.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = О { $kind ->
        [doi] овом DOI-ју
        [isbn] овом ISBN-у
        [arxiv] овом броју са arXiv-а
       *[pmid] овом броју из базе PubMed
    } ништа се не зна тамо где је питано. Референца се може унети ручно испод.

## What the writer writes about a work.

library-notes = Белешке
library-notes-yours = Ваше белешке
library-notes-on-work = Ваше белешке о овом делу
library-notes-read = Прочитај своје белешке
library-notes-write = Напиши белешку
library-notes-write-on-work = Напиши белешку о овом делу
library-notes-not-in-library = Референца која није у вашој библиотеци
library-notes-this-project = У овом пројекту
library-notes-all-projects = У свим пројектима
library-notes-project-placeholder = Шта мислите о њему, за овај рад
library-notes-all-placeholder = Шта мислите о њему, где год да га цитирате
library-notes-keep-for-all = Сачувај за све пројекте
library-notes-write-for-all = Пиши за све пројекте
library-notes-carried = Референца је дошла с пројектом и није у вашој библиотеци. Што се овде напише, имају сви који имају пројекат.
library-notes-kept = Чува се уз референцу у вашој библиотеци. Иде уз пројекат који цитира дело.
library-notes-unread = Ваше белешке нису могле да се прочитају
library-notes-unsaved = Ваша белешка није могла да се сачува
