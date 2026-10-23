# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The panel beside the map, and what is chosen over it.

# The last among the reference styles, which opens the search for more.
preview-style-more = Другие стили…
# Shows in the text the element whose place in the pages is looked at.
preview-go-to-text = Перейти к этому месту в тексте
# Moves the pages to where the element the text is at begins.
preview-show-text = Показать, где текст
# The name of the program is Pandoc, Typst or LaTeX.
preview-program-missing = { $program } не установлен
preview-programs-needed = Предпросмотр и экспорт делаются с помощью Pandoc и Typst. Установите их менеджером пакетов вашей системы или укажите в настройках, где они.
preview-look-again = Поискать снова
preview-looking-failed = Не удалось поискать программы
preview-reading-failed = Не удалось прочитать стили и форматы
preview-failed = Не удалось сделать предпросмотр
preview-failed-message = Не удалось сделать предпросмотр.
# A page of the preview, as it is told to those who cannot see it.
preview-page = Страница { $number }
# The name of an exported file, where the map has none.
preview-file-name = документ

## At the foot of the preview: how long the document is, and what there is to remark.

preview-pages = { $count ->
    [one] { $count } страница
    [few] { $count } страницы
    [many] { $count } страниц
   *[other] { $count } страницы
}
preview-words = { $count ->
    [one] { $count } слово
    [few] { $count } слова
    [many] { $count } слов
   *[other] { $count } слова
}
# The words of the text, and the most the format allows.
preview-words-of = { $limit ->
    [one] { $count } из { $limit } слова
    [few] { $count } из { $limit } слов
    [many] { $count } из { $limit } слов
   *[other] { $count } из { $limit } слова
}
# The words of the text and of its notes together.
preview-words-with-notes = { $count } со сносками
preview-remarks-count = { $count ->
    [one] { $count } замечание
    [few] { $count } замечания
    [many] { $count } замечаний
   *[other] { $count } замечания
}
preview-remarks = Замечания
preview-remarks-font = Шрифт
preview-font-missing = { $font } не установлен.
# The first name is that of the font the format asks for; this is of the one used in its place.
preview-font-substitute = Вместо него используется { $font } — здесь, в предпросмотре, и в создаваемом PDF. В документе, экспортированном для Word, LibreOffice или LaTeX, шрифт назван так, как просит формат, и будет у того, кто откроет документ и имеет его.
preview-remarks-references = Источники
# In bold, and the next follows it in the same sentence.
preview-works-missing = { $count ->
    [one] { $count } цитируемая работа не найдена
    [few] { $count } цитируемые работы не найдены
    [many] { $count } цитируемых работ не найдены
   *[other] { $count } цитируемые работы не найдены
}
preview-works-missing-where = ни в вашей библиотеке, ни в проекте. Такие места отмечены в тексте.
# Over what Pandoc and Typst said while they made the document.
preview-remarks-warnings = Сказано при создании документа

## The export: the kinds of file a document is made as.

preview-export = Экспорт
preview-export-kind = Вид файла
preview-export-pdf-about = Как показывает предпросмотр
preview-export-pdflatex = PDF, набранный LaTeX
preview-export-pdflatex-about = Тот же документ в наборе LaTeX. Это занимает чуть дольше.
preview-export-docx-about = То, что просят большинство издательств и журналов
preview-export-odt-about = Для LibreOffice Writer и других
preview-export-latex-about = Для набора в LuaLaTeX или XeLaTeX
preview-export-markdown-about = Простой текст, ссылки — ключами
preview-export-html = Веб-страница
preview-export-html-about = Один файл, для чтения в браузере
preview-export-epub = Электронная книга
preview-export-epub-about = EPUB, для читалок и приложений для чтения; текст набирает читалка
preview-export-latex-missing = Для этого нужен LaTeX, а он не найден. Он устанавливается как TeX Live.
preview-export-biblatex = Оставить ссылки командами BibLaTeX
preview-export-biblatex-hint = Источники записываются в файл .bib рядом с документом. Стилем цитирования тогда служит ближайший к выбранному стиль BibLaTeX.
# The title of the window where the file is named; the kind is PDF, Word, and so on.
preview-export-as = Экспортировать как { $kind }
preview-export-run = Экспортировать…
preview-export-working = Создание документа…
preview-export-failed = Не удалось создать документ.
preview-export-stop = Остановить
preview-export-stopped = Создание остановлено. Файл не записан.
# Under the name of the file that was made: another file made with it.
preview-export-also = вместе с { $file }
preview-export-missing = { $count ->
    [one] { $count } цитируемая работа не найдена и отмечена в тексте.
    [few] { $count } цитируемые работы не найдены и отмечены в тексте.
    [many] { $count } цитируемых работ не найдены и отмечены в тексте.
   *[other] { $count } цитируемые работы не найдены и отмечены в тексте.
}
preview-export-show-in-folder = Показать в папке
preview-export-open-failed = Не удалось открыть файл
preview-export-folder-failed = Не удалось открыть папку
preview-export-another = Экспортировать ещё
