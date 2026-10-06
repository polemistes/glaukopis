# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = вставленного текста
core-import-files = { $count ->
    [one] { $count } файла
    [few] { $count } файлов
    [many] { $count } файлов
   *[other] { $count } файла
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Файл «{ $name }» не найден.
core-import-empty-entry = Строка { $line }: запись «{ $key }» пуста и пропущена.
# Where in a file a reference that has no key was found.
core-import-origin-line = строка { $line }
core-import-origin-key-line = { $key }, строка { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = «{ $title }»
core-import-merge-gone = { $reference }: записи, с которой нужно объединить, больше нет

## PDF files.

core-import-not-a-pdf = { $name } — не PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Сведения взяты из { $service }.
core-import-number-unknown = В файле найден номер, но в базах данных о нём ничего не известно; сведения взяты из самого файла, и их стоит проверить.
core-import-databases-failed = Не удалось обратиться к базам данных ({ $error }); сведения взяты из самого файла, и их стоит проверить.

## Zotero.

core-import-zotero-my-library = Моя библиотека
core-import-zotero-group = Группа { $id }
core-import-zotero-the-library = библиотека { $id } в Zotero
core-import-zotero-own-library = собственная библиотека пользователя в Zotero
core-import-zotero-the-collection = коллекция { $key } в Zotero
core-import-zotero-unknown-base = Файл «{ $name }» не найден. Zotero ссылается на него из папки, которую выбирает сам и которая здесь неизвестна.
core-import-zotero-empty-item = Запись { $key } в Zotero пуста и пропущена.
core-import-zotero-alone = { $count ->
    [one] { $count } файл или заметка в Zotero не относится ни к какому источнику и пропущен.
    [few] { $count } файла и заметки в Zotero не относятся ни к какому источнику и пропущены.
    [many] { $count } файлов и заметок в Zotero не относятся ни к какому источнику и пропущены.
   *[other] { $count } файла и заметки в Zotero не относятся ни к какому источнику и пропущены.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero называет { $name } как { $role }, а для этого в BibLaTeX нет поля. Имя пропущено.
core-import-zotero-left-out = У поля Zotero «{ $field }» нет соответствия в BibLaTeX, и оно пропущено: { $value }

## Zotero's database.

core-import-zotero-no-database = база данных Zotero ({ $file }) в { $path }
core-import-zotero-copying = копирование { $path } во временную папку
core-import-zotero-empty = файл пуст
core-import-zotero-disturbed = Zotero писал в свою базу данных, пока она читалась. Если чего-то не хватает, закройте Zotero и импортируйте снова.
core-import-zotero-backup-read = Не удалось прочитать базу данных Zotero ({ $error }). Вместо неё прочитана её резервная копия, { $backup }: того, что изменилось в Zotero после её создания, не хватает.
core-import-zotero-not-a-database = { $path } — не база данных Zotero.
core-import-zotero-unreadable = База данных Zotero имеет форму, которую здесь нельзя прочитать: { $what }. Если её записала старая версия Zotero, достаточно один раз открыть её в текущей, и она обновится.
core-import-zotero-unreadable-version = База данных Zotero имеет форму, которую здесь нельзя прочитать (версия базы данных Zotero { $version }): { $what }. Если её записала старая версия Zotero, достаточно один раз открыть её в текущей, и она обновится.
core-import-zotero-no-table = нет таблицы «{ $table }»
core-import-zotero-no-column = в таблице «{ $table }» нет столбца «{ $column }»
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = В базе данных Zotero нет таблицы «{ $table }» известной здесь формы: { $consequence }.
core-import-zotero-no-bin = записи из корзины Zotero нельзя отличить от остальных
core-import-zotero-no-collections = коллекции не прочитаны
core-import-zotero-no-attachments = вложенные файлы не прочитаны
core-import-zotero-no-notes = заметки не прочитаны
core-import-zotero-no-keywords = ключевые слова не прочитаны
core-import-zotero-no-group-names = названия групповых библиотек неизвестны

## PDF files, as they are read for a reference.

core-import-pdf-empty = Файл «{ $name }» пуст.
core-import-pdf-not-a-pdf = Файл «{ $name }» — не PDF.
core-import-pdf-unreadable = Не удалось прочитать файл: он повреждён, защищён паролем или слишком велик.
core-import-pdf-scan = В файле нет текстового слоя: это скан.
core-import-pdf-from-file = Сведения взяты из самого файла, а не из каталога, и их стоит проверить.
core-import-pdf-from-metadata = В файле не найдено ни DOI, ни ISBN; сведения взяты из метаданных самого файла, и их стоит проверить.
core-import-pdf-unknown = В файле не найдено ни DOI, ни ISBN, а его метаданные не говорят, что это: сведения нужно заполнить.

## Tables, from files of text and of sheets.

core-import-table-too-large = В файле { $size } МБ. Таблица читается из файла размером не больше { $most } МБ.
core-import-table-kinds = Таблицы читаются из CSV и другого текста со значениями через запятую, точку с запятой или табуляцию, а также из таблиц LibreOffice (.ods) и Excel (.xlsx, .xls).
core-import-table-empty = В файле ничего нет.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Строк в таблице: { $rows }. В таблице в тексте их может быть не больше { $most }: это не электронная таблица.
core-import-table-columns = Столбцов в таблице: { $columns }. В таблице в тексте их может быть не больше { $most }: это не электронная таблица.
core-import-table-more-than = больше { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Чтение остановлено.
core-import-pdfs-stopped = Выяснение того, что это за файлы, остановлено. Ничего не добавлено.
core-import-document-kind = «{ $file }» — не того вида, который можно загрузить как документ. Загрузить можно Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst и простой текст.
core-import-document-too-large = «{ $file }» больше 50 МБ — больше, чем можно загрузить как документ.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = «{ $file }» не удалось прочитать как { $kind }. Возможно, он повреждён или другого вида, чем говорит его имя. Pandoc, который его читает, сказал: { $message }
core-import-document-pandoc-unreadable = не удалось прочитать то, что Pandoc сделал из «{ $file }»: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Без названия
core-import-document-plain-text = простой текст
core-import-document-notebook = блокнот Jupyter

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Найдена { $count } ссылка, ещё не связанная с источником из вашей библиотеки; её сделала программа, которая ведёт источники. Она стоит как текст, которым была записана; её можно разобрать, когда карта будет сделана, и позже.
       *[none] Найдена { $count } ссылка, ещё не связанная с источником из вашей библиотеки. Она стоит как текст, которым была записана; её можно разобрать, когда карта будет сделана, и позже.
    }
    [few] { $made ->
        [all] Найдены { $count } ссылки, ещё не связанные с источниками из вашей библиотеки; все их сделала программа, которая ведёт источники. Они стоят как текст, которым были записаны; их можно разобрать, когда карта будет сделана, и позже.
        [some] Найдены { $count } ссылки, ещё не связанные с источниками из вашей библиотеки; { $some } из них сделала программа, которая ведёт источники. Они стоят как текст, которым были записаны; их можно разобрать, когда карта будет сделана, и позже.
       *[none] Найдены { $count } ссылки, ещё не связанные с источниками из вашей библиотеки. Они стоят как текст, которым были записаны; их можно разобрать, когда карта будет сделана, и позже.
    }
    [many] { $made ->
        [all] Найдено { $count } ссылок, ещё не связанных с источниками из вашей библиотеки; все их сделала программа, которая ведёт источники. Они стоят как текст, которым были записаны; их можно разобрать, когда карта будет сделана, и позже.
        [some] Найдено { $count } ссылок, ещё не связанных с источниками из вашей библиотеки; { $some } из них сделала программа, которая ведёт источники. Они стоят как текст, которым были записаны; их можно разобрать, когда карта будет сделана, и позже.
       *[none] Найдено { $count } ссылок, ещё не связанных с источниками из вашей библиотеки. Они стоят как текст, которым были записаны; их можно разобрать, когда карта будет сделана, и позже.
    }
   *[other] { $made ->
        [all] Найдены { $count } ссылки, ещё не связанные с источниками из вашей библиотеки; все их сделала программа, которая ведёт источники. Они стоят как текст, которым были записаны; их можно разобрать, когда карта будет сделана, и позже.
        [some] Найдены { $count } ссылки, ещё не связанные с источниками из вашей библиотеки; { $some } из них сделала программа, которая ведёт источники. Они стоят как текст, которым были записаны; их можно разобрать, когда карта будет сделана, и позже.
       *[none] Найдены { $count } ссылки, ещё не связанные с источниками из вашей библиотеки. Они стоят как текст, которым были записаны; их можно разобрать, когда карта будет сделана, и позже.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } ссылка, сделанная EndNote, загружена как текст, который она показывает, и не входит в найденные: то, что EndNote говорит о работах, прочитать не удалось.
    [few] { $count } ссылки, сделанные EndNote, загружены как текст, который они показывают, и не входят в найденные: то, что EndNote говорит о работах, прочитать не удалось.
    [many] { $count } ссылок, сделанных EndNote, загружены как текст, который они показывают, и не входят в найденные: то, что EndNote говорит о работах, прочитать не удалось.
   *[other] { $count } ссылки, сделанные EndNote, загружены как текст, который они показывают, и не входят в найденные: то, что EndNote говорит о работах, прочитать не удалось.
}
core-import-document-bookmarks = { $count ->
    [one] Документ хранит { $count } ссылку в закладке, и прочитать, на что она ссылается, не удалось: это текст, как он есть. Zotero хранит их иначе, когда так сказано в настройках документа.
    [few] Документ хранит { $count } ссылки в закладках, и прочитать, на что они ссылаются, не удалось: это текст, как он есть. Zotero хранит их иначе, когда так сказано в настройках документа.
    [many] Документ хранит { $count } ссылок в закладках, и прочитать, на что они ссылаются, не удалось: это текст, как он есть. Zotero хранит их иначе, когда так сказано в настройках документа.
   *[other] Документ хранит { $count } ссылки в закладках, и прочитать, на что они ссылаются, не удалось: это текст, как он есть. Zotero хранит их иначе, когда так сказано в настройках документа.
}
core-import-document-bibliography = В документе есть список того, на что он ссылается, под заголовком «{ $heading }». Он загружен как текст, как и всё остальное. Карта составляет свой список литературы из того, на что в ней ссылаются.
core-import-document-bibliography-made = В документе есть список того, на что он ссылается, составленный программой, которая ведёт его источники. Он загружен как текст, как и всё остальное. Карта составляет свой список литературы из того, на что в ней ссылаются.
core-import-document-tracked = В документе есть записанные исправления. Текст загружен таким, каким он будет, когда все они приняты.
core-import-document-comments = В документе есть примечания на полях; они пропущены.
core-import-document-heading-notes = { $count ->
    [one] { $count } сноска к заголовку стоит в начале текста под ним: у заголовка не может быть сноски.
    [few] { $count } сноски к заголовкам стоят в начале текста под ними: у заголовка не может быть сноски.
    [many] { $count } сносок к заголовкам стоят в начале текста под ними: у заголовка не может быть сноски.
   *[other] { $count } сноски к заголовкам стоят в начале текста под ними: у заголовка не может быть сноски.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } подпись начиналась со слова и номера, например «{ $first }». Он пропущен: карта сама нумерует свои рисунки и таблицы. Там, где текст называет один из них по номеру, это текст, как он был написан, и за номерами карты он не следует.
    [few] { $count } подписи начинались со слова и номера, например «{ $first }». Они пропущены: карта сама нумерует свои рисунки и таблицы. Там, где текст называет один из них по номеру, это текст, как он был написан, и за номерами карты он не следует.
    [many] { $count } подписей начинались со слова и номера, например «{ $first }». Они пропущены: карта сама нумерует свои рисунки и таблицы. Там, где текст называет один из них по номеру, это текст, как он был написан, и за номерами карты он не следует.
   *[other] { $count } подписи начинались со слова и номера, например «{ $first }». Они пропущены: карта сама нумерует свои рисунки и таблицы. Там, где текст называет один из них по номеру, это текст, как он был написан, и за номерами карты он не следует.
}
core-import-document-label-example = Рисунок 1:
core-import-document-caption-notes = { $count ->
    [one] { $count } сноска в тексте к рисунку или таблице стоит там в скобках.
    [few] { $count } сноски в тексте к рисункам или таблицам стоят там в скобках.
    [many] { $count } сносок в тексте к рисункам или таблицам стоят там в скобках.
   *[other] { $count } сноски в тексте к рисункам или таблицам стоят там в скобках.
}
core-import-document-headings = { $count ->
    [one] { $count } заголовок внутри цитаты, списка или таблицы загружен как абзац полужирным.
    [few] { $count } заголовка внутри цитаты, списка или таблицы загружены как абзацы полужирным.
    [many] { $count } заголовков внутри цитаты, списка или таблицы загружены как абзацы полужирным.
   *[other] { $count } заголовка внутри цитаты, списка или таблицы загружены как абзацы полужирным.
}
core-import-document-code = { $count ->
    [one] { $count } блок кода загружен как простые абзацы, по одному на строку.
    [few] { $count } блока кода загружены как простые абзацы, по одному на строку.
    [many] { $count } блоков кода загружены как простые абзацы, по одному на строку.
   *[other] { $count } блока кода загружены как простые абзацы, по одному на строку.
}
core-import-document-definitions = { $count ->
    [one] { $count } список терминов с их значениями загружен как абзацы, термины полужирным.
    [few] { $count } списка терминов с их значениями загружены как абзацы, термины полужирным.
    [many] { $count } списков терминов с их значениями загружены как абзацы, термины полужирным.
   *[other] { $count } списка терминов с их значениями загружены как абзацы, термины полужирным.
}
core-import-document-rules = { $count ->
    [one] { $count } линия через страницу пропущена.
    [few] { $count } линии через страницу пропущены.
    [many] { $count } линий через страницу пропущены.
   *[other] { $count } линии через страницу пропущены.
}
core-import-document-raw = { $count ->
    [one] { $count } вставка на HTML или TeX, предназначенная только для одного вида документа, пропущена.
    [few] { $count } вставки на HTML или TeX, предназначенные только для одного вида документа, пропущены.
    [many] { $count } вставок на HTML или TeX, предназначенных только для одного вида документа, пропущены.
   *[other] { $count } вставки на HTML или TeX, предназначенные только для одного вида документа, пропущены.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } изображение, которое есть в файле, не попало в прочитанный текст и пропущено. Оно может стоять в колонтитуле или в графическом объекте.
    [few] { $count } изображения, которые есть в файле, не попали в прочитанный текст и пропущены. Они могут стоять в колонтитулах или в графических объектах.
    [many] { $count } изображений, которые есть в файле, не попали в прочитанный текст и пропущены. Они могут стоять в колонтитулах или в графических объектах.
   *[other] { $count } изображения, которые есть в файле, не попали в прочитанный текст и пропущены. Они могут стоять в колонтитулах или в графических объектах.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Изображение «{ $name }» пропущено: { $why }.
core-import-document-picture-kind = оно такого вида, который не читается ({ $kind })
core-import-document-picture-not-read = это не изображение читаемого вида
core-import-document-picture-unreadable = его не удалось прочитать
core-import-document-picture-network = оно в сети, а оттуда ничего не скачивается
core-import-document-picture-not-taken-out = его не удалось извлечь из файла
core-import-document-picture-outside = оно не в файле, а в другом месте на этом компьютере, и оттуда не берётся
core-import-document-picture-not-found = файл не найден там, где его указывает документ
core-import-document-picture-too-large = оно больше 50 МБ
core-import-document-picture-file-unreadable = файл не удалось прочитать
