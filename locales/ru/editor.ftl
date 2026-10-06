# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Формат
editor-writing = Инструменты письма
editor-italic = Курсив
editor-bold = Полужирный
editor-small-capitals = Капитель
editor-superscript = Надстрочный
editor-subscript = Подстрочный
editor-struck = Зачёркнутый
editor-quotation = Цитата
editor-block-quotation = Цитата блоком
editor-list = Список
editor-text = Текст
editor-text-hint = Абзац
editor-quotation-hint = Отделена от текста
editor-list-hint = С маркером перед каждым пунктом
editor-numbered-list = Нумерованный список
editor-numbered-list-hint = С номером перед каждым пунктом
editor-verse = Стихи
editor-verse-hint = Строки стихов или драмы, каждая остаётся строкой
editor-speaker = Говорящий
editor-speaker-hint = Кто говорит, отдельной строкой
editor-direction = Ремарка
editor-direction-hint = Что происходит, курсивом
editor-line-numbers = Номера строк
editor-line-numbers-hint = Нумеровать строки этих стихов: с какой строки и через сколько
editor-line-numbers-from = Нумеровать строки с
editor-line-numbers-none = Пусто — без номеров
editor-line-numbers-every = Показывать номер через каждые
editor-line-numbers-number = Нужно целое число.
editor-kinds-text = Текст
editor-kinds-quotation = Цитата
editor-kinds-verse = Стихи
editor-kinds-script = Сценарий
editor-kinds-more = Ещё
editor-kinds-words = Слова
editor-attribution = Автор цитаты
editor-attribution-hint = Чьи это слова, под цитатой, справа
editor-epigraph = Эпиграф
editor-epigraph-hint = Цитата в начале части
editor-headword = Заглавное слово
editor-headword-hint = Слово, которое объясняет глоссарий
editor-gloss = Толкование
editor-gloss-hint = Что значит заглавное слово
editor-code = Код
editor-code-hint = Буква в букву, моноширинным шрифтом
editor-break = Разделитель
editor-break-hint = Пауза между частями, со знаком, который даёт ей формат
editor-draft = Черновая заметка
editor-draft-hint = Только для вас: в документ не попадает
editor-foreign = Иностранные слова
editor-foreign-hint = Слова на другом языке; орфография проверяется по нему
editor-title-of-work = Название произведения
editor-title-of-work-hint = Название книги, пьесы, картины
editor-term = Термин
editor-term-hint = Термин там, где он впервые употреблён
editor-mention = Упоминание
editor-mention-hint = Слово, о котором говорят как о слове, в кавычках
editor-highlight = Подсветка
editor-highlight-hint = Для глаза на экране: в документ не попадает
editor-underline = Подчёркнутый
editor-code-words = Код в строке
editor-code-words-hint = Моноширинным шрифтом, внутри строки
editor-scene = Заголовок сцены
editor-scene-hint = ИНТ. ДОМ – НОЧЬ
editor-action = Действие
editor-action-hint = Что видно и что происходит
editor-character = Персонаж
editor-character-hint = Кто говорит, над диалогом
editor-dialogue = Диалог
editor-dialogue-hint = Что говорится
editor-parenthetical = Ремарка в скобках
editor-parenthetical-hint = Как это говорится, в скобках
editor-transition = Переход
editor-transition-hint = «CUT TO:», справа
editor-comment = Комментарий
editor-comment-hint = Комментарий к выделенному
editor-comment-element-hint = Комментарий к этому элементу; выделите слова, чтобы комментировать их
editor-parallel = Два текста рядом
editor-parallel-hint = Оригинал и перевод, каждый — отдельный текст
editor-paragraph-kind = Вид абзаца
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Вид абзаца: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Ещё…
editor-kinds-in-hand = Под рукой
editor-kinds-own = Свои
editor-kinds-make = Создать вид…
editor-kinds-change-own = Изменить свой вид…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Оформление по формату «{ $format }»
editor-kinds-change-format = Изменить формат…
editor-kinds-change-format-hint = Как каждый вид оформляется в этом документе
editor-words = Слова
editor-words-hint = Подчёркивание, надстрочный, код; иностранные слова, название произведения, термин
editor-words-make = Создать вид слов…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = Язык карты
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Обычные слова
editor-own-kind-new = Свой вид
editor-own-kind-change = Изменить вид
editor-own-kind-name = Название
editor-own-kind-name-placeholder = Письмо, телеграмма, молитва…
editor-own-kind-words-placeholder = Название корабля, латынь, ключевое слово…
editor-own-kind-name-taken = Вид с таким названием уже есть.
editor-own-kind-based-on = На основе
editor-own-kind-based-on-hint = Что не сказано ниже, берётся из этого вида
editor-own-kind-look = Чем отличается
editor-own-kind-create = Создать
editor-own-kind-delete-title = Удалить вид «{ $name }»?
editor-own-kind-delete-message = { $count ->
    [0] Текста этого вида нет.
    [one] Текст этого вида в { $count } элементе остаётся как есть, а в документах оформляется как обычный текст.
    [few] Текст этого вида в { $count } элементах остаётся как есть, а в документах оформляется как обычный текст.
    [many] Текст этого вида в { $count } элементах остаётся как есть, а в документах оформляется как обычный текст.
   *[other] Текст этого вида в { $count } элементах остаётся как есть, а в документах оформляется как обычный текст.
}

## Citing, notes, and what is put into the text.

editor-cite = Сослаться
editor-cite-here = Сослаться на работу здесь
editor-cite-at-cursor = Сослаться на работу там, где курсор
editor-note = Сноска
editor-note-selection = Сделать выделенное сноской
editor-note-hint = Сноска внизу страницы или в конце
editor-insert = Вставить
editor-insert-hint = Изображение, таблицу, формулу, перекрёстную ссылку
editor-new-element = Новый элемент
editor-new-element-hint = Новый элемент после этого или под ним
editor-new-after = Новый элемент после этого
editor-new-under = Новый элемент под этим
editor-new-split = Разделить здесь
editor-new-split-hint = То, что после курсора, становится новым элементом
editor-spelling-on = Орфография проверяется при письме · нажмите, чтобы перестать
editor-spelling-off = Орфография не проверяется · нажмите, чтобы проверять
editor-picture-file = Изображение из файла…
editor-picture-file-hint = Рисунок с текстом к нему
editor-picture-store = Изображение из хранилища…
editor-picture-store-hint = Те, что у вас есть, показаны сбоку
editor-equation = Уравнение
editor-equation-hint = Математика отдельной строкой
editor-table = Таблица…
editor-table-hint = Из стольких-то строк и столбцов
editor-table-file = Таблица из файла…
editor-table-file-hint = CSV или таблица LibreOffice или Excel
editor-formula = Формула
editor-formula-hint = Математика в строке
editor-pointer = Перекрёстная ссылка…
editor-pointer-hint = На рисунок, таблицу, уравнение или часть: «см. рисунок 2»
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = изображение

## More.

editor-found = Найденные ссылки…
editor-found-count = Осталось разобрать и сделать ссылками: { $count }
editor-found-none = И текст, похожий на ссылки, в этой карте

## Choosing a work to cite.

editor-picker = Выбор источника
editor-picker-placeholder = Сослаться: автор, название, год
editor-picker-search = Поиск источников
editor-picker-results = Источники
editor-picker-in-project = В этом проекте
editor-picker-recent = Недавно добавленные
editor-picker-empty = Ваша библиотека пуста.
editor-picker-no-match = В вашей библиотеке нет ничего с этими словами.
editor-picker-type = Введите слова, чтобы искать в библиотеке.
editor-picker-new = Новый источник…
editor-picker-import = Импорт…

## A citation, and each work in it.

editor-citation = Ссылка
editor-citation-add = Добавить работу
editor-citation-add-purpose = Добавить работу в ссылку
editor-citation-in-text = Автор в тексте: Nagy (1979)
editor-citation-remove = Убрать ссылку
editor-citation-split = Отделить слова от ссылки
editor-citation-split-hint = Слова до и после становятся текстом строки, а каждая работа — отдельной ссылкой со своей страницей и ничем больше
editor-citation-not-in-library = Этого источника нет в вашей библиотеке.
editor-citation-edit-reference = Изменить источник
editor-citation-before = До
editor-citation-before-placeholder = см., ср.
editor-citation-after = После
editor-citation-after-placeholder = и далее
editor-citation-locator-kind = Где именно
editor-citation-suppress-author = Автор назван в моём предложении: только год
editor-citation-remove-work = Убрать эту работу
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [источник не найден]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (ссылка)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Страница
editor-locator-chapter = Глава
editor-locator-section = Раздел
editor-locator-paragraph = Абзац
editor-locator-line = Строка
editor-locator-verse = Стих
editor-locator-book = Книга
editor-locator-volume = Том
editor-locator-part = Часть
editor-locator-column = Столбец
editor-locator-folio = Лист
editor-locator-figure = Рисунок
editor-locator-note = Примечание
editor-locator-number = Номер
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Сноска { $number }
editor-note-place = Где стоит сноска
editor-note-place-format = Где формат ставит свои сноски
editor-note-place-foot = Внизу страницы
editor-note-place-end = В конце текста
editor-note-placeholder = Текст сноски
