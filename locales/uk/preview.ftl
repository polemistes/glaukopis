# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

preview = Перегляд
# Small, over the choice of the document format.
preview-format = Формат
preview-format-label = Формат документа
# Small, over the choice of the reference style.
preview-style = Джерела
preview-style-label = Стиль цитування
# The last among the reference styles, which opens the search for more.
preview-style-more = Більше стилів…
preview-change = Змінити формат або стиль
preview-change-format = Змінити цей формат…
preview-change-format-hint = Сторінка, шрифт, інтервали, заголовки
preview-change-style = Змінити цей стиль цитування…
preview-change-style-hint = Під побажання видавця
preview-details = Назва, автори, анотація
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Перейти до цього місця в тексті
# Moves the pages to where the element the text is at begins.
preview-show-text = Показати, де текст
preview-hide = Сховати перегляд
# When a format that goes with a reference style is chosen, the style is taken with it.
preview-style-taken = Стиль цитування тепер { $style }
preview-style-taken-why = Це той, що йде з цим форматом.
preview-style-keep-other = Залишити інший
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } не встановлено
preview-programs-needed = Перегляд та експорт роблять Pandoc і Typst. Встановіть їх менеджером пакунків вашої системи або вкажіть у налаштуваннях, де вони є.
preview-look-again = Пошукати знову
preview-looking-failed = Не вдалося пошукати програми
preview-reading-failed = Не вдалося прочитати стилі й формати
preview-failed = Не вдалося створити перегляд
preview-failed-message = Не вдалося створити перегляд.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Сторінка { $number }
# The name of an exported file, where the map has none.
preview-file-name = документ

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } сторінка
    [few] { $count } сторінки
    [many] { $count } сторінок
   *[other] { $count } сторінки
}
preview-words = { $count ->
    [one] { $count } слово
    [few] { $count } слова
    [many] { $count } слів
   *[other] { $count } слова
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } з { $limit } слова
    [few] { $count } з { $limit } слів
    [many] { $count } з { $limit } слів
   *[other] { $count } з { $limit } слова
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } з примітками
preview-remarks-count = { $count ->
    [one] { $count } зауваження
    [few] { $count } зауваження
    [many] { $count } зауважень
   *[other] { $count } зауваження
}
preview-remarks = Зауваження
preview-remarks-font = Шрифт
preview-font-missing = { $font } не встановлено.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = Замість нього вжито { $font }, тут у перегляді та у створеному PDF. У документі, експортованому для Word, LibreOffice чи LaTeX, шрифт названо так, як просить формат, і він буде в того, хто відкриє документ і має його.
preview-remarks-references = Джерела
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } цитовану працю не знайдено,
    [few] { $count } цитовані праці не знайдено,
    [many] { $count } цитованих праць не знайдено,
   *[other] { $count } цитованої праці не знайдено,
}
preview-works-missing-where = ні у вашій бібліотеці, ні в проєкті. Вони позначені в тексті.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Сказане під час створення документа

## The details of a document: what stands on its first page.

preview-details-dialog = Документ
preview-details-dialog-subtitle = Що стоїть на його першій сторінці
preview-details-title = Назва
preview-details-title-placeholder = Назва центру мапи
preview-details-title-hint = Якщо залишити порожнім, назвою буде назва центру мапи.
preview-details-subtitle = Підназва
preview-details-authors = Автори
preview-details-name = Імʼя
preview-details-author-name = Імʼя автора { $number }
preview-details-affiliation = Установа
preview-details-author-affiliation = Установа автора { $number }
preview-details-email = Електронна пошта
preview-details-author-email = Електронна пошта автора { $number }
# Beside a plus, under the authors: adds one.
preview-details-add-author = автор
preview-details-abstract = Анотація
preview-details-words = { $count ->
    [one] { $count } слово
    [few] { $count } слова
    [many] { $count } слів
   *[other] { $count } слова
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $limit ->
    [one] { $count } з { $limit } слова
    [few] { $count } з { $limit } слів
    [many] { $count } з { $limit } слів
   *[other] { $count } з { $limit } слова
}
preview-details-keywords = Ключові слова
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } з { $limit }
preview-details-keywords-placeholder = Через кому
preview-details-date = Дата
preview-details-date-placeholder = Як її друкувати
preview-details-language = Мова тексту
# A map that was given no language is printed in English.
preview-details-language-none = Не вказано (англійська)
preview-details-cover = Обкладинка
preview-details-cover-choose = Вибрати зображення…
preview-details-cover-other = Інше…
preview-details-cover-hint = Обкладинка електронної книжки: зображення зі сховища зображень. Більше ніде не вживається.

## The export: the kinds of file a document is made as.

preview-export = Експорт
preview-export-kind = Вид файлу
preview-export-pdf-about = Як показує перегляд
preview-export-pdflatex = PDF, набраний LaTeX
preview-export-pdflatex-about = Той самий документ у наборі LaTeX. Триває трохи довше.
preview-export-docx-about = Те, чого просить більшість видавців і журналів
preview-export-odt-about = Для LibreOffice Writer та інших
preview-export-latex-about = Для набору LuaLaTeX або XeLaTeX
preview-export-markdown-about = Простий текст, цитування як ключі
preview-export-html = Вебсторінка
preview-export-html-about = Один файл, щоб читати в браузері
preview-export-epub = Електронна книжка
preview-export-epub-about = EPUB, для читалок і програм, що їх читають; текст набирає читалка
preview-export-latex-missing = Для цього потрібен LaTeX, якого не знайдено. Він встановлюється як TeX Live.
preview-export-biblatex = Зберегти цитування як команди BibLaTeX
preview-export-biblatex-hint = Джерела записуються у файл .bib поруч із документом. Стиль цитування тоді — найближчий у BibLaTeX до вибраного.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Експортувати як { $kind }
preview-export-run = Експортувати…
preview-export-working = Створення документа…
preview-export-failed = Не вдалося створити документ.
preview-export-stop = Зупинити
preview-export-stopped = Створення зупинено. Файл не записано.
# Under the name of the file that was made: another file made with it.
preview-export-also = разом із { $file }
preview-export-missing = { $count ->
    [one] { $count } цитовану працю не знайдено, і її позначено в тексті.
    [few] { $count } цитовані праці не знайдено, і їх позначено в тексті.
    [many] { $count } цитованих праць не знайдено, і їх позначено в тексті.
   *[other] { $count } цитованої праці не знайдено, і їх позначено в тексті.
}
preview-export-show-in-folder = Показати в теці
preview-export-open-failed = Не вдалося відкрити файл
preview-export-folder-failed = Не вдалося відкрити теку
preview-export-another = Експортувати ще
