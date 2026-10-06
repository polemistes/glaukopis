# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = вставленому тексті
core-import-files = { $count ->
    [one] { $count } файлі
    [few] { $count } файлах
    [many] { $count } файлах
   *[other] { $count } файлах
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Файл «{ $name }» не знайдено.
core-import-empty-entry = Рядок { $line }: запис «{ $key }» порожній, і його пропущено.
# Where in a file a reference that has no key was found.
core-import-origin-line = рядок { $line }
core-import-origin-key-line = { $key }, рядок { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = «{ $title }»
core-import-merge-gone = { $reference }: запису, з яким треба обʼєднати, більше немає

## PDF files.

core-import-not-a-pdf = { $name } — не PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Відомості взято з { $service }.
core-import-number-unknown = У файлі знайдено номер, але в базах даних про нього нічого не відомо; відомості взято із самого файлу, і їх варто перевірити.
core-import-databases-failed = Не вдалося звернутися до баз даних ({ $error }); відомості взято із самого файлу, і їх варто перевірити.

## Zotero.

core-import-zotero-my-library = Моя бібліотека
core-import-zotero-group = Група { $id }
core-import-zotero-the-library = бібліотека { $id } у Zotero
core-import-zotero-own-library = власна бібліотека користувача в Zotero
core-import-zotero-the-collection = колекція { $key } у Zotero
core-import-zotero-unknown-base = Файл «{ $name }» не знайдено. Zotero посилається на нього з теки, яку вибрав сам і яка тут невідома.
core-import-zotero-empty-item = Запис { $key } у Zotero порожній, і його пропущено.
core-import-zotero-alone = { $count ->
    [one] { $count } файл або нотатка в Zotero не належить жодному джерелу, і його пропущено.
    [few] { $count } файли й нотатки в Zotero не належать жодному джерелу, і їх пропущено.
    [many] { $count } файлів і нотаток у Zotero не належать жодному джерелу, і їх пропущено.
   *[other] { $count } файлу або нотатки в Zotero не належить жодному джерелу, і їх пропущено.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero називає { $name } як { $role }, а BibLaTeX не має для цього поля. Імʼя пропущено.
core-import-zotero-left-out = Поле Zotero «{ $field }» не має відповідника в BibLaTeX, і його пропущено: { $value }

## Zotero's database.

core-import-zotero-no-database = база даних Zotero ({ $file }) у { $path }
core-import-zotero-copying = копіювання { $path } до тимчасової теки
core-import-zotero-empty = файл порожній
core-import-zotero-disturbed = Zotero писав у свою базу даних, поки її читали. Якщо чогось бракує, закрийте Zotero та імпортуйте знову.
core-import-zotero-backup-read = Не вдалося прочитати базу даних Zotero ({ $error }). Натомість прочитано її резервну копію, { $backup }: того, що змінилося в Zotero після її створення, бракує.
core-import-zotero-not-a-database = { $path } — не база даних Zotero.
core-import-zotero-unreadable = База даних Zotero має форму, яку тут не вдається прочитати: { $what }. Якщо її записала стара версія Zotero, досить один раз відкрити її в сучасній, і вона оновиться.
core-import-zotero-unreadable-version = База даних Zotero має форму, яку тут не вдається прочитати (версія { $version } бази даних Zotero): { $what }. Якщо її записала стара версія Zotero, досить один раз відкрити її в сучасній, і вона оновиться.
core-import-zotero-no-table = бракує таблиці «{ $table }»
core-import-zotero-no-column = таблиця «{ $table }» не має стовпця «{ $column }»
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = База даних Zotero не має таблиці «{ $table }» відомої тут форми: { $consequence }.
core-import-zotero-no-bin = записи в кошику Zotero не відрізнити від решти
core-import-zotero-no-collections = колекції не прочитано
core-import-zotero-no-attachments = вкладені файли не прочитано
core-import-zotero-no-notes = нотатки не прочитано
core-import-zotero-no-keywords = ключові слова не прочитано
core-import-zotero-no-group-names = назви групових бібліотек невідомі

## PDF files, as they are read for a reference.

core-import-pdf-empty = Файл «{ $name }» порожній.
core-import-pdf-not-a-pdf = Файл «{ $name }» — не PDF.
core-import-pdf-unreadable = Не вдалося прочитати файл: він пошкоджений, захищений паролем або завеликий.
core-import-pdf-scan = Файл не має текстового шару: це скан.
core-import-pdf-from-file = Відомості взято із самого файлу, а не з каталогу, і їх варто перевірити.
core-import-pdf-from-metadata = У файлі не знайдено ні DOI, ні ISBN; відомості взято з метаданих самого файлу, і їх варто перевірити.
core-import-pdf-unknown = У файлі не знайдено ні DOI, ні ISBN, а його метадані не кажуть, що це: відомості доведеться заповнити самим.

## Tables, from files of text and of sheets.

core-import-table-too-large = Файл має { $size } МБ. Таблиця читається з файлу щонайбільше { $most } МБ.
core-import-table-kinds = Таблиці читаються з CSV та іншого тексту зі значеннями, розділеними комами, крапками з комою або табуляцією, а також з аркушів LibreOffice (.ods) та Excel (.xlsx, .xls).
core-import-table-empty = У файлі нічого немає.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = { $rows ->
    [one] Таблиця має { $rows } рядок. Таблиця в тексті може мати щонайбільше { $most }: це не електронна таблиця.
    [few] Таблиця має { $rows } рядки. Таблиця в тексті може мати щонайбільше { $most }: це не електронна таблиця.
    [many] Таблиця має { $rows } рядків. Таблиця в тексті може мати щонайбільше { $most }: це не електронна таблиця.
   *[other] Таблиця має { $rows } рядків. Таблиця в тексті може мати щонайбільше { $most }: це не електронна таблиця.
}
core-import-table-columns = { $columns ->
    [one] Таблиця має { $columns } стовпець. Таблиця в тексті може мати щонайбільше { $most }: це не електронна таблиця.
    [few] Таблиця має { $columns } стовпці. Таблиця в тексті може мати щонайбільше { $most }: це не електронна таблиця.
    [many] Таблиця має { $columns } стовпців. Таблиця в тексті може мати щонайбільше { $most }: це не електронна таблиця.
   *[other] Таблиця має { $columns } стовпців. Таблиця в тексті може мати щонайбільше { $most }: це не електронна таблиця.
}
core-import-table-more-than = понад { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Читання зупинено.
core-import-pdfs-stopped = Зʼясування, що це за файли, зупинено. Нічого не додано.
core-import-document-kind = «{ $file }» не того виду, який можна внести як документ. Внести можна Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst і простий текст.
core-import-document-too-large = «{ $file }» більший за 50 МБ, а це більше, ніж можна внести як документ.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = «{ $file }» не вдалося прочитати як { $kind }. Можливо, він пошкоджений або іншого виду, ніж каже його назва. Pandoc, який його читає, сказав: { $message }
core-import-document-pandoc-unreadable = те, що Pandoc зробив із «{ $file }», не вдалося прочитати: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Без назви
core-import-document-plain-text = простий текст
core-import-document-notebook = блокнот Jupyter

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Знайдено { $count } цитування, ще не привʼязане до джерела вашої бібліотеки, зроблене програмою, що веде бібліографію. Воно стоїть як текст, яким було написане, і його можна переглянути, коли мапу буде створено, і пізніше.
       *[none] Знайдено { $count } цитування, ще не привʼязане до джерела вашої бібліотеки. Воно стоїть як текст, яким було написане, і його можна переглянути, коли мапу буде створено, і пізніше.
    }
    [few] { $made ->
        [all] Знайдено { $count } цитування, ще не привʼязані до джерел вашої бібліотеки, усі зроблені програмою, що веде бібліографію. Вони стоять як текст, яким були написані, і їх можна переглянути, коли мапу буде створено, і пізніше.
        [some] Знайдено { $count } цитування, ще не привʼязані до джерел вашої бібліотеки, { $some } з них зроблені програмою, що веде бібліографію. Вони стоять як текст, яким були написані, і їх можна переглянути, коли мапу буде створено, і пізніше.
       *[none] Знайдено { $count } цитування, ще не привʼязані до джерел вашої бібліотеки. Вони стоять як текст, яким були написані, і їх можна переглянути, коли мапу буде створено, і пізніше.
    }
    [many] { $made ->
        [all] Знайдено { $count } цитувань, ще не привʼязаних до джерел вашої бібліотеки, усі зроблені програмою, що веде бібліографію. Вони стоять як текст, яким були написані, і їх можна переглянути, коли мапу буде створено, і пізніше.
        [some] Знайдено { $count } цитувань, ще не привʼязаних до джерел вашої бібліотеки, { $some } з них зроблені програмою, що веде бібліографію. Вони стоять як текст, яким були написані, і їх можна переглянути, коли мапу буде створено, і пізніше.
       *[none] Знайдено { $count } цитувань, ще не привʼязаних до джерел вашої бібліотеки. Вони стоять як текст, яким були написані, і їх можна переглянути, коли мапу буде створено, і пізніше.
    }
   *[other] { $made ->
        [all] Знайдено { $count } цитування, ще не привʼязаних до джерел вашої бібліотеки, усі зроблені програмою, що веде бібліографію. Вони стоять як текст, яким були написані, і їх можна переглянути, коли мапу буде створено, і пізніше.
        [some] Знайдено { $count } цитування, ще не привʼязаних до джерел вашої бібліотеки, { $some } з них зроблені програмою, що веде бібліографію. Вони стоять як текст, яким були написані, і їх можна переглянути, коли мапу буде створено, і пізніше.
       *[none] Знайдено { $count } цитування, ще не привʼязаних до джерел вашої бібліотеки. Вони стоять як текст, яким були написані, і їх можна переглянути, коли мапу буде створено, і пізніше.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } цитування, зроблене EndNote, внесено як текст, який воно показує, і його немає серед знайдених: того, що EndNote каже про праці, не вдалося прочитати.
    [few] { $count } цитування, зроблені EndNote, внесено як текст, який вони показують, і їх немає серед знайдених: того, що EndNote каже про праці, не вдалося прочитати.
    [many] { $count } цитувань, зроблених EndNote, внесено як текст, який вони показують, і їх немає серед знайдених: того, що EndNote каже про праці, не вдалося прочитати.
   *[other] { $count } цитування, зроблених EndNote, внесено як текст, який вони показують, і їх немає серед знайдених: того, що EndNote каже про праці, не вдалося прочитати.
}
core-import-document-bookmarks = { $count ->
    [one] Документ тримає { $count } цитування в закладці, і того, що воно цитує, не вдалося прочитати: це текст, як він є. Zotero зберігає їх так, коли це вказано в налаштуваннях документа.
    [few] Документ тримає { $count } цитування в закладках, і того, що вони цитують, не вдалося прочитати: це текст, як він є. Zotero зберігає їх так, коли це вказано в налаштуваннях документа.
    [many] Документ тримає { $count } цитувань у закладках, і того, що вони цитують, не вдалося прочитати: це текст, як він є. Zotero зберігає їх так, коли це вказано в налаштуваннях документа.
   *[other] Документ тримає { $count } цитування в закладках, і того, що вони цитують, не вдалося прочитати: це текст, як він є. Zotero зберігає їх так, коли це вказано в налаштуваннях документа.
}
core-import-document-bibliography = Документ має список того, що цитує, під заголовком «{ $heading }». Його внесено як текст, як і решту. Мапа складає власну бібліографію з того, що в ній цитується.
core-import-document-bibliography-made = Документ має список того, що цитує, складений програмою, що веде його бібліографію. Його внесено як текст, як і решту. Мапа складає власну бібліографію з того, що в ній цитується.
core-import-document-tracked = У документі є відстежувані зміни. Текст внесено таким, яким він є, коли всі їх прийнято.
core-import-document-comments = У документі є коментарі на полях; їх пропущено.
core-import-document-heading-notes = { $count ->
    [one] { $count } примітка до заголовка стоїть на початку тексту під ним: заголовок не може мати примітки.
    [few] { $count } примітки до заголовків стоять на початку тексту під ними: заголовок не може мати примітки.
    [many] { $count } приміток до заголовків стоять на початку тексту під ними: заголовок не може мати примітки.
   *[other] { $count } примітки до заголовків стоять на початку тексту під ними: заголовок не може мати примітки.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } підпис починався зі слова й числа, як-от «{ $first }». Його пропущено: мапа нумерує свої рисунки й таблиці сама. Там, де текст називає котрийсь із них за номером, це текст, як його було написано, і він не йде за номерами мапи.
    [few] { $count } підписи починалися зі слова й числа, як-от «{ $first }». Їх пропущено: мапа нумерує свої рисунки й таблиці сама. Там, де текст називає котрийсь із них за номером, це текст, як його було написано, і він не йде за номерами мапи.
    [many] { $count } підписів починалися зі слова й числа, як-от «{ $first }». Їх пропущено: мапа нумерує свої рисунки й таблиці сама. Там, де текст називає котрийсь із них за номером, це текст, як його було написано, і він не йде за номерами мапи.
   *[other] { $count } підпису починалися зі слова й числа, як-от «{ $first }». Їх пропущено: мапа нумерує свої рисунки й таблиці сама. Там, де текст називає котрийсь із них за номером, це текст, як його було написано, і він не йде за номерами мапи.
}
core-import-document-label-example = Рисунок 1:
core-import-document-caption-notes = { $count ->
    [one] { $count } примітка в тому, що сказано про рисунок чи таблицю, стоїть там у дужках.
    [few] { $count } примітки в тому, що сказано про рисунки чи таблиці, стоять там у дужках.
    [many] { $count } приміток у тому, що сказано про рисунки чи таблиці, стоять там у дужках.
   *[other] { $count } примітки в тому, що сказано про рисунки чи таблиці, стоять там у дужках.
}
core-import-document-headings = { $count ->
    [one] { $count } заголовок у цитаті, списку чи таблиці внесено як абзац жирним.
    [few] { $count } заголовки в цитаті, списку чи таблиці внесено як абзаци жирним.
    [many] { $count } заголовків у цитаті, списку чи таблиці внесено як абзаци жирним.
   *[other] { $count } заголовка в цитаті, списку чи таблиці внесено як абзаци жирним.
}
core-import-document-code = { $count ->
    [one] { $count } блок коду внесено як прості абзаци, по рядку на кожен.
    [few] { $count } блоки коду внесено як прості абзаци, по рядку на кожен.
    [many] { $count } блоків коду внесено як прості абзаци, по рядку на кожен.
   *[other] { $count } блоку коду внесено як прості абзаци, по рядку на кожен.
}
core-import-document-definitions = { $count ->
    [one] { $count } список термінів з їхніми значеннями внесено як абзаци, терміни жирним.
    [few] { $count } списки термінів з їхніми значеннями внесено як абзаци, терміни жирним.
    [many] { $count } списків термінів з їхніми значеннями внесено як абзаци, терміни жирним.
   *[other] { $count } списку термінів з їхніми значеннями внесено як абзаци, терміни жирним.
}
core-import-document-rules = { $count ->
    [one] { $count } лінію через сторінку пропущено.
    [few] { $count } лінії через сторінку пропущено.
    [many] { $count } ліній через сторінку пропущено.
   *[other] { $count } лінії через сторінку пропущено.
}
core-import-document-raw = { $count ->
    [one] { $count } фрагмент, написаний у HTML чи TeX лише для одного виду документа, пропущено.
    [few] { $count } фрагменти, написані в HTML чи TeX лише для одного виду документа, пропущено.
    [many] { $count } фрагментів, написаних у HTML чи TeX лише для одного виду документа, пропущено.
   *[other] { $count } фрагмента, написаних у HTML чи TeX лише для одного виду документа, пропущено.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } зображення, яке є у файлі, немає в прочитаному тексті, і його пропущено. Воно може стояти в колонтитулі сторінок або всередині малюнка.
    [few] { $count } зображення, які є у файлі, немає в прочитаному тексті, і їх пропущено. Вони можуть стояти в колонтитулах сторінок або всередині малюнка.
    [many] { $count } зображень, які є у файлі, немає в прочитаному тексті, і їх пропущено. Вони можуть стояти в колонтитулах сторінок або всередині малюнка.
   *[other] { $count } зображення, які є у файлі, немає в прочитаному тексті, і їх пропущено. Вони можуть стояти в колонтитулах сторінок або всередині малюнка.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Зображення «{ $name }» пропущено: { $why }.
core-import-document-picture-kind = воно такого виду, який не читається ({ $kind })
core-import-document-picture-not-read = це не зображення того виду, що читається
core-import-document-picture-unreadable = його не вдалося прочитати
core-import-document-picture-network = воно в мережі, а звідти нічого не береться
core-import-document-picture-not-taken-out = його не вдалося видобути з файлу
core-import-document-picture-outside = воно не у файлі, а деінде на цьому компʼютері, і звідти не береться
core-import-document-picture-not-found = файлу не знайдено там, де каже документ
core-import-document-picture-too-large = воно більше за 50 МБ
core-import-document-picture-file-unreadable = файл не вдалося прочитати
