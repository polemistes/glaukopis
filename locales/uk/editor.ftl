# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Формат
editor-writing = Письмо
editor-italic = Курсив
editor-bold = Жирний
editor-small-capitals = Капітель
editor-superscript = Верхній індекс
editor-subscript = Нижній індекс
editor-struck = Закреслений
editor-quotation = Цитата
editor-block-quotation = Виокремлена цитата
editor-list = Список
editor-text = Текст
editor-text-hint = Абзац
editor-quotation-hint = Відокремлена від тексту
editor-list-hint = Із позначкою перед кожним пунктом
editor-numbered-list = Нумерований список
editor-numbered-list-hint = Із числом перед кожним пунктом
editor-verse = Вірш
editor-verse-hint = Рядки поезії чи драми, кожен збережений як рядок
editor-speaker = Мовець
editor-speaker-hint = Хто говорить, в окремому рядку
editor-direction = Ремарка
editor-direction-hint = Що робиться, курсивом
editor-line-numbers = Номери рядків
editor-line-numbers-hint = Нумерувати рядки цього вірша: з якого рядка і через скільки
editor-line-numbers-from = Нумерувати рядки з
editor-line-numbers-none = Залиште порожнім, щоб без номерів
editor-line-numbers-every = Показувати номер кожні
editor-line-numbers-number = Потрібне ціле число.
editor-kinds-text = Текст
editor-kinds-quotation = Цитата
editor-kinds-verse = Вірш
editor-kinds-script = Сценарій
editor-kinds-more = Інше
editor-kinds-words = Слова
editor-attribution = Авторство
editor-attribution-hint = Чиї це слова, під цитатою, праворуч
editor-epigraph = Епіграф
editor-epigraph-hint = Цитата на початку частини
editor-headword = Заголовне слово
editor-headword-hint = Слово, яке пояснює глосарій
editor-gloss = Тлумачення
editor-gloss-hint = Що означає заголовне слово
editor-code = Код
editor-code-hint = Збережений літера в літеру, літерами однакової ширини
editor-break = Розділювач
editor-break-hint = Пауза між частинами, зі знаком, який дає їй формат
editor-draft = Чернеткова нотатка
editor-draft-hint = Лише для ваших очей: не потрапляє в жодний документ
editor-foreign = Іншомовні слова
editor-foreign-hint = Слова іншою мовою, за якою перевіряється правопис
editor-title-of-work = Назва твору
editor-title-of-work-hint = Назва книжки, пʼєси, картини
editor-term = Термін
editor-term-hint = Термін там, де його вжито вперше
editor-mention = Згадка
editor-mention-hint = Слово, про яке йдеться як про слово, у лапках
editor-highlight = Підсвічування
editor-highlight-hint = Для ока на екрані: не потрапляє в жодний документ
editor-underline = Підкреслений
editor-code-words = Код у рядку
editor-code-words-hint = Літери однакової ширини, всередині рядка
editor-scene = Заголовок сцени
editor-scene-hint = ІНТ. БУДИНОК – НІЧ
editor-action = Дія
editor-action-hint = Що видно і що робиться
editor-character = Персонаж
editor-character-hint = Хто говорить, над діалогом
editor-dialogue = Діалог
editor-dialogue-hint = Що сказано
editor-parenthetical = Ремарка в дужках
editor-parenthetical-hint = Як це сказано, у дужках
editor-transition = Перехід
editor-transition-hint = «ПЕРЕХІД ДО:», праворуч
editor-comment = Коментар
editor-comment-hint = Коментар до виділеного
editor-comment-element-hint = Коментар до цього елемента; виділіть слова, щоб коментувати їх
editor-parallel = Два тексти поруч
editor-parallel-hint = Оригінал і його переклад, кожен — окремий текст
editor-paragraph-kind = Вид абзацу
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Вид абзацу: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Інше…
editor-kinds-in-hand = Види напохваті
editor-kinds-own = Ваші власні
editor-kinds-make = Створити вид…
editor-kinds-change-own = Змінити власний вид…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = Набрано так, як у «{ $format }»
editor-kinds-change-format = Змінити формат…
editor-kinds-change-format-hint = Як кожен вид набирається в цьому документі
editor-words = Слова
editor-words-hint = Підкреслення, верхній індекс, код; іншомовні слова, назва твору, термін
editor-words-make = Створити вид слів…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = Мова мапи
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Прості слова
editor-own-kind-new = Власний вид
editor-own-kind-change = Змінити вид
editor-own-kind-name = Назва
editor-own-kind-name-placeholder = Лист, телеграма, молитва…
editor-own-kind-words-placeholder = Назва корабля, латина, ключове слово…
editor-own-kind-name-taken = Вид із такою назвою вже є.
editor-own-kind-based-on = На основі
editor-own-kind-based-on-hint = Те, чого не сказано нижче, — як у цього виду
editor-own-kind-look = Чим відрізняється
editor-own-kind-create = Створити
editor-own-kind-delete-title = Видалити вид «{ $name }»?
editor-own-kind-delete-message = { $count ->
    [0] Жодного тексту цього виду немає.
    [one] Те, що є цього виду в { $count } елементі, залишається як є і набирається в документах як текст.
    [few] Те, що є цього виду у { $count } елементах, залишається як є і набирається в документах як текст.
    [many] Те, що є цього виду у { $count } елементах, залишається як є і набирається в документах як текст.
   *[other] Те, що є цього виду у { $count } елементах, залишається як є і набирається в документах як текст.
}

## Citing, notes, and what is put into the text.

editor-cite = Цитувати
editor-cite-here = Процитувати працю тут
editor-cite-at-cursor = Процитувати працю там, де курсор
editor-note = Примітка
editor-note-selection = Зробити виділене приміткою
editor-note-hint = Примітка внизу сторінки або в кінці
editor-insert = Вставити
editor-insert-hint = Зображення, таблицю, математику, посилання
editor-new-element = Новий елемент
editor-new-element-hint = Новий елемент після цього або під ним
editor-new-after = Новий елемент після цього
editor-new-under = Новий елемент під цим
editor-new-split = Розділити тут
editor-new-split-hint = Те, що після курсора, стає новим елементом
editor-spelling-on = Правопис перевіряється, поки ви пишете · натисніть, щоб припинити
editor-spelling-off = Правопис не перевіряється · натисніть, щоб перевіряти
editor-picture-file = Зображення з файлу…
editor-picture-file-hint = Рисунок, із тим, що про нього сказано
editor-picture-store = Зображення зі сховища…
editor-picture-store-hint = Ті, що у вас є, показано збоку
editor-equation = Рівняння
editor-equation-hint = Математика в окремому рядку
editor-table = Таблиця…
editor-table-hint = На стільки-то рядків і стовпців
editor-table-file = Таблиця з файлу…
editor-table-file-hint = CSV або аркуш LibreOffice чи Excel
editor-formula = Формула
editor-formula-hint = Математика в рядку
editor-pointer = Посилання…
editor-pointer-hint = На рисунок, таблицю, рівняння чи частину: «див. рис. 2»
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = зображення

## More.

editor-found = Знайдені цитування…
editor-found-count = Переглянути й зробити цитуваннями: { $count }
editor-found-none = І текст, схожий на цитування, у цій мапі

## Choosing a work to cite.

editor-picker = Виберіть джерело
editor-picker-placeholder = Цитувати: автор, назва, рік
editor-picker-search = Шукати джерела
editor-picker-results = Джерела
editor-picker-in-project = У цьому проєкті
editor-picker-recent = Нещодавно додані
editor-picker-empty = Ваша бібліотека порожня.
editor-picker-no-match = Ніщо у вашій бібліотеці не містить цих слів.
editor-picker-type = Почніть писати, щоб шукати в бібліотеці.
editor-picker-new = Нове джерело…
editor-picker-import = Імпортувати…

## A citation, and each work in it.

editor-citation = Цитування
editor-citation-add = Додати працю
editor-citation-add-purpose = Додати працю до цитування
editor-citation-in-text = Автор у тексті: Nagy (1979)
editor-citation-remove = Вилучити цитування
editor-citation-split = Відділити слова від цитування
editor-citation-split-hint = Слова перед і після стають текстом рядка, а кожна праця — окремим цитуванням, зі своєю сторінкою й нічим більше
editor-citation-not-in-library = Цього джерела немає у вашій бібліотеці.
editor-citation-edit-reference = Редагувати джерело
editor-citation-before = Перед
editor-citation-before-placeholder = див., пор.
editor-citation-after = Після
editor-citation-after-placeholder = та passim
editor-citation-locator-kind = Вид місця
editor-citation-suppress-author = Автора названо в моєму реченні: подати лише рік
editor-citation-remove-work = Вилучити цю працю
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [джерело не знайдено]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (цитування)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Сторінка
editor-locator-chapter = Розділ
editor-locator-section = Параграф
editor-locator-paragraph = Абзац
editor-locator-line = Рядок
editor-locator-verse = Вірш
editor-locator-book = Книга
editor-locator-volume = Том
editor-locator-part = Частина
editor-locator-column = Стовпець
editor-locator-folio = Аркуш
editor-locator-figure = Рисунок
editor-locator-note = Примітка
editor-locator-number = Номер
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Примітка { $number }
editor-note-place = Де стоїть примітка
editor-note-place-format = Там, де формат має свої примітки
editor-note-place-foot = Унизу сторінки
editor-note-place-end = У кінці тексту
editor-note-placeholder = Текст примітки
