# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = Документ, який внести
documents-filter = Документи
documents-filter-all = Усі файли
documents-title-map = Мапа з документа
documents-title-project = Проєкт із документа
documents-reading = Читання { $file }…
documents-reading-hint = Довгий документ потребує хвильку.
documents-no-pandoc = Документи цього виду читає Pandoc, який не встановлено або не вдалося знайти. Де він, можна вказати в налаштуваннях.
documents-unread = Не вдалося прочитати файл.
documents-title = Назва
documents-title-hint-map = Назва мапи та елемента в її центрі.
documents-title-hint-project = Назва проєкту, його мапи та елемента в центрі мапи.
# What a project made of a document is called when the document has no title.
documents-untitled = Без назви

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Частина
    [few] Частини
    [many] Частин
   *[other] Частини
}
documents-words = { $count ->
    [one] Слово
    [few] Слова
    [many] Слів
   *[other] Слова
}
documents-notes = { $count ->
    [one] Примітка
    [few] Примітки
    [many] Приміток
   *[other] Примітки
}
documents-figures = { $count ->
    [one] Рисунок
    [few] Рисунки
    [many] Рисунків
   *[other] Рисунка
}
documents-tables = { $count ->
    [one] Таблиця
    [few] Таблиці
    [many] Таблиць
   *[other] Таблиці
}
documents-equations = { $count ->
    [one] Рівняння
    [few] Рівняння
    [many] Рівнянь
   *[other] Рівняння
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Праці з вашої бібліотеки цитуються { $cited ->
        [1] один раз
        [2] двічі
        [one] { $cited } раз
        [few] { $cited } рази
        [many] { $cited } разів
       *[other] { $cited } разу
    }.
documents-cited-not-in-library = Праці, яких немає у вашій бібліотеці, цитуються { $missing ->
        [1] один раз
        [2] двічі
        [one] { $missing } раз
        [few] { $missing } рази
        [many] { $missing } разів
       *[other] { $missing } разу
    }.
documents-cited-both = Праці з вашої бібліотеки цитуються { $cited ->
        [1] один раз
        [2] двічі
        [one] { $cited } раз
        [few] { $cited } рази
        [many] { $cited } разів
       *[other] { $cited } разу
    }, праці, яких у ній немає, — { $missing ->
        [1] один раз
        [2] двічі
        [one] { $missing } раз
        [few] { $missing } рази
        [many] { $missing } разів
       *[other] { $missing } разу
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Знайдено { $count } цитування.
    [few] Знайдено { $count } цитування.
    [many] Знайдено { $count } цитувань.
   *[other] Знайдено { $count } цитування.
}
documents-found-made = { $count ->
    [one] Знайдено { $count } цитування, зроблене програмою, що веде бібліографію.
    [few] Знайдено { $count } цитування, усі зроблені програмою, що веде бібліографію.
    [many] Знайдено { $count } цитувань, усі зроблені програмою, що веде бібліографію.
   *[other] Знайдено { $count } цитування, усі зроблені програмою, що веде бібліографію.
}
documents-found-some-made = { $count ->
    [one] Знайдено { $count } цитування, { $made } з них зроблено програмою, що веде бібліографію.
    [few] Знайдено { $count } цитування, { $made } з них зроблено програмою, що веде бібліографію.
    [many] Знайдено { $count } цитувань, { $made } з них зроблено програмою, що веде бібліографію.
   *[other] Знайдено { $count } цитування, { $made } з них зроблено програмою, що веде бібліографію.
}
documents-at-once = Одразу зробити цитуваннями ті, що Zotero зробив із праць, які є у вашій бібліотеці
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Примітка, що є лише цитуванням, стає цитуванням у рядку, яке стиль цитування ставить у примітку або в рядок; примітка, що каже більше, зберігає своє цитування. Те, що ви вибрали для приміток на панелі знайдених цитувань, для всіх наступних, діє і тут.
documents-go-through-map = Переглянути цитування, коли мапу буде створено
documents-go-through-project = Переглянути цитування, коли проєкт буде створено

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Варто знати
documents-making = Створення мапи…
documents-make-map = Створити мапу
documents-make-project = Створити проєкт
documents-map-failed = Не вдалося створити мапу.
