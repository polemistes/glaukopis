# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Обликовање
editor-writing = Писање
editor-italic = Курзив
editor-bold = Полуцрно
editor-small-capitals = Мала велика слова
editor-superscript = Експонент
editor-subscript = Индекс
editor-struck = Прецртано
editor-quotation = Навод
editor-block-quotation = Издвојени навод
editor-list = Списак
editor-text = Текст
editor-text-hint = Пасус
editor-quotation-hint = Издвојен из текста
editor-list-hint = Са знаком испред сваке ставке
editor-numbered-list = Нумерисани списак
editor-numbered-list-hint = С бројем испред сваке ставке
editor-verse = Стихови
editor-verse-hint = Стихови поезије или драме, сваки као засебан ред
editor-speaker = Говорник
editor-speaker-hint = Ко говори, у засебном реду
editor-direction = Дидаскалија
editor-direction-hint = Шта се чини, курзивом
editor-line-numbers = Бројеви стихова
editor-line-numbers-hint = Нумериши стихове овог блока: од ког стиха, и на колико
editor-line-numbers-from = Бројеви од стиха
editor-line-numbers-none = Празно: без бројева
editor-line-numbers-every = Број на сваких
editor-line-numbers-number = Треба цео број.
editor-kinds-text = Текст
editor-kinds-quotation = Навод
editor-kinds-verse = Стихови
editor-kinds-script = Сценарио
editor-kinds-more = Још
editor-kinds-words = Речи
editor-attribution = Потпис
editor-attribution-hint = Чије су речи, под наводом, здесна
editor-epigraph = Мото
editor-epigraph-hint = Навод на почетку дела текста
editor-headword = Одредница
editor-headword-hint = Реч коју појмовник објашњава
editor-gloss = Објашњење
editor-gloss-hint = Шта одредница значи
editor-code = Кôд
editor-code-hint = Задржан слово по слово, словима једнаке ширине
editor-break = Прекид
editor-break-hint = Пауза између делова, са знаком који јој формат даје
editor-draft = Радна белешка
editor-draft-hint = За ваше очи: не улази ни у један документ
editor-foreign = Страни језик
editor-foreign-hint = Речи на другом језику, по којем се проверава правопис
editor-title-of-work = Наслов дела
editor-title-of-work-hint = Наслов књиге, драме, слике
editor-term = Термин
editor-term-hint = Термин тамо где се први пут употреби
editor-mention = Помен
editor-mention-hint = Реч о којој се говори као о речи, под наводницима
editor-highlight = Маркирано
editor-highlight-hint = За око на екрану: не улази ни у један документ
editor-underline = Подвучено
editor-code-words = Кôд у реду
editor-code-words-hint = Слова једнаке ширине, унутар реда
editor-scene = Наслов сцене
editor-scene-hint = ЕНТ. КУЋА – НОЋ
editor-action = Радња
editor-action-hint = Шта се види и чини
editor-character = Лик
editor-character-hint = Ко говори, изнад дијалога
editor-dialogue = Дијалог
editor-dialogue-hint = Шта се каже
editor-parenthetical = У загради
editor-parenthetical-hint = Како се каже, у заградама
editor-transition = Прелаз
editor-transition-hint = РЕЗ НА:, здесна
editor-comment = Коментар
editor-comment-hint = Коментар на изабрано
editor-comment-element-hint = Коментар на овај елемент; изаберите речи да бисте њих коментарисали
editor-parallel = Два текста упоредо
editor-parallel-hint = Оригинал и његов превод, сваки као засебан текст
editor-paragraph-kind = Врста пасуса
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Врста пасуса: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Још…
editor-kinds-in-hand = Врсте при руци
editor-kinds-own = Ваше сопствене
editor-kinds-make = Направи врсту…
editor-kinds-change-own = Измени сопствену врсту…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Изглед по формату „{ $format }“
editor-kinds-change-format = Измени формат…
editor-kinds-change-format-hint = Како је свака врста сложена у овом документу
editor-words = Речи
editor-words-hint = Подвлачење, експонент, кôд; речи на страном језику, наслов дела, термин
editor-words-make = Направи врсту речи…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = Језик мапе
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Обичне речи
editor-own-kind-new = Сопствена врста
editor-own-kind-change = Измени врсту
editor-own-kind-name = Назив
editor-own-kind-name-placeholder = Писмо, телеграм, молитва…
editor-own-kind-words-placeholder = Име брода, латински, кључна реч…
editor-own-kind-name-taken = Већ постоји врста с тим називом.
editor-own-kind-based-on = Заснована на
editor-own-kind-based-on-hint = Што доле није речено, као код ове врсте
editor-own-kind-look = По чему се разликује
editor-own-kind-create = Направи
editor-own-kind-delete-title = Обрисати врсту „{ $name }“?
editor-own-kind-delete-message = { $count ->
    [0] Ниједан текст није те врсте.
    [one] Што је те врсте у { $count } елементу остаје како је, а у документима се слаже као текст.
    [few] Што је те врсте у { $count } елемента остаје како је, а у документима се слаже као текст.
   *[other] Што је те врсте у { $count } елемената остаје како је, а у документима се слаже као текст.
}

## Citing, notes, and what is put into the text.

editor-cite = Цитирај
editor-cite-here = Цитирај дело овде
editor-cite-at-cursor = Цитирај дело на месту курсора
editor-note = Напомена
editor-note-selection = Претвори изабрано у напомену
editor-note-hint = Напомена, у дну стране или на крају
editor-insert = Уметни
editor-insert-hint = Слика, табела, математика, упутница
editor-new-element = Нови елемент
editor-new-element-hint = Нови елемент после овог, или под њим
editor-new-after = Нови елемент после овог
editor-new-under = Нови елемент под овим
editor-new-split = Подели овде
editor-new-split-hint = Што следи после курсора постаје нови елемент
editor-spelling-on = Правопис се проверава док пишете · притисните да престане
editor-spelling-off = Правопис се не проверава · притисните да се проверава
editor-picture-file = Слика из датотеке…
editor-picture-file-hint = Илустрација, с оним што се о њој каже
editor-picture-store = Слика из складишта…
editor-picture-store-hint = Оне које имате приказане су са стране
editor-equation = Једначина
editor-equation-hint = Математика у засебном реду
editor-table = Табела…
editor-table-hint = С толико редова и колона
editor-table-file = Табела из датотеке…
editor-table-file-hint = CSV, или табела из програма LibreOffice или Excel
editor-formula = Формула
editor-formula-hint = Математика у реду
editor-pointer = Упутница…
editor-pointer-hint = На илустрацију, табелу, једначину или део: „в. слику 2“
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = слика

## More.

editor-found = Пронађени цитати…
editor-found-count = { $count } за преглед, да од њих постану цитати
editor-found-none = И текст који личи на цитате, у овој мапи

## Choosing a work to cite.

editor-picker = Изаберите референцу
editor-picker-placeholder = Цитирај: аутор, наслов, година
editor-picker-search = Претражи референце
editor-picker-results = Референце
editor-picker-in-project = У овом пројекту
editor-picker-recent = Недавно додате
editor-picker-empty = Ваша библиотека је празна.
editor-picker-no-match = Ништа у вашој библиотеци не садржи те речи.
editor-picker-type = Куцајте да претражите библиотеку.
editor-picker-new = Нова референца…
editor-picker-import = Увези…

## A citation, and each work in it.

editor-citation = Цитат
editor-citation-add = Додај дело
editor-citation-add-purpose = Додај дело у цитат
editor-citation-in-text = Аутор у тексту: Nagy (1979)
editor-citation-remove = Уклони цитат
editor-citation-split = Одвој речи од цитата
editor-citation-split-hint = Речи испред и иза постају текст реда, а свако дело засебан цитат, са својом страном и ничим више
editor-citation-not-in-library = Ове референце нема у вашој библиотеци.
editor-citation-edit-reference = Уреди референцу
editor-citation-before = Испред
editor-citation-before-placeholder = в., уп.
editor-citation-after = Иза
editor-citation-after-placeholder = и даље
editor-citation-locator-kind = Врста места
editor-citation-suppress-author = Аутор је именован у мојој реченици: дај само годину
editor-citation-remove-work = Уклони ово дело
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [референца није пронађена]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (цитат)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Страна
editor-locator-chapter = Поглавље
editor-locator-section = Одељак
editor-locator-paragraph = Пасус
editor-locator-line = Ред
editor-locator-verse = Стих
editor-locator-book = Књига
editor-locator-volume = Том
editor-locator-part = Део
editor-locator-column = Стубац
editor-locator-folio = Лист
editor-locator-figure = Слика
editor-locator-note = Напомена
editor-locator-number = Број
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Напомена { $number }
editor-note-place = Где напомена стоји
editor-note-place-format = Где формат има напомене
editor-note-place-foot = У дну стране
editor-note-place-end = На крају текста
editor-note-placeholder = Текст напомене
