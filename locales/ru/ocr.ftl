# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF и изображения
ocr-no-tesseract = Tesseract, который читает текст на изображениях, не установлен или не найден. Установите его менеджером пакетов вашей системы вместе с данными языков, которые вы читаете (в Arch: tesseract и tesseract-data-eng, tesseract-data-rus и так далее), или укажите в настройках, где он.
ocr-failed = Не удалось прочитать текст.
ocr-looking = Просмотр { $file }…
ocr-about-picture = Текст читается с изображения.
ocr-about-scan = { $pages ->
    [one] В PDF нет текста: он читается с изображения его страницы.
    [few] Ни на одной из { $pages } страниц нет текста: они читаются с их изображений.
    [many] Ни на одной из { $pages } страниц нет текста: они читаются с их изображений.
   *[other] Ни на одной из { $pages } страниц нет текста: они читаются с их изображений.
}
ocr-about-some = { $without ->
    [one] Страниц без текста: { $without } из { $pages }; она читается с изображения, остальные берутся как есть.
    [few] Страниц без текста: { $without } из { $pages }; они читаются с изображений, остальные берутся как есть.
    [many] Страниц без текста: { $without } из { $pages }; они читаются с изображений, остальные берутся как есть.
   *[other] Страниц без текста: { $without } из { $pages }; они читаются с изображений, остальные берутся как есть.
}
ocr-about-text = { $pages ->
    [one] На странице есть текст, он берётся как есть.
    [few] На всех страницах есть текст, он берётся как есть.
    [many] На всех страницах есть текст, он берётся как есть.
   *[other] На всех страницах есть текст, он берётся как есть.
}
ocr-read-all = Читать и страницы с текстом
ocr-read-all-hint = Их текст остаётся, а прочитанное кладётся поверх него.
ocr-read-all-map-hint = Прочитанное заменяет их текст: когда он плох или не читается.
ocr-read = Прочитать текст
ocr-read-text-pages = Взять страницы с текстом
ocr-take-text = Взять текст
ocr-reading = Чтение { $file }…
ocr-reading-pages = Прочитано страниц: { $done } из { $total }
ocr-reading-hint = Страница занимает несколько секунд. Отмена останавливает чтение.

## How the text is read: what to try when a reading goes badly

ocr-how = Как читается
ocr-how-dpi = Разрешение, точек на дюйм
ocr-how-layout = Разметка страницы
ocr-how-layout-auto = Как сочтёт Tesseract
ocr-how-layout-column = Одна колонка
ocr-how-layout-block = Один блок текста
ocr-how-layout-sparse = Разреженный текст
ocr-how-contrast = Чёрно-белое
ocr-how-hint = Что попробовать, когда чтение идёт плохо: разрешение повыше для мелкого шрифта, одну колонку, когда колонки перепутаны, один блок текста для отдельного абзаца и чёрно-белое для бледной или неровной печати.

## The languages of the text

ocr-languages = Языки текста
ocr-languages-hint = Сначала самый вероятный. Каждый лишний замедляет чтение и не всегда улучшает его.
ocr-language-add = Добавить язык…
ocr-language-remove = Убрать { $language }
# A script rather than a language: "Latin script".
ocr-language-script = Письмо { $script }
ocr-language-fraktur = { $language }, фрактура
ocr-language-old = { $language }, старый
ocr-language-vertical = { $language }, вертикальное письмо

## A PDF of the library made searchable

ocr-searchable-button = Добавить текстовый слой…
ocr-searchable-title = Добавить в PDF текстовый слой
ocr-searchable-about = { $without ->
    [one] Страниц без текста: { $without } из { $pages }. Она читается, и её текст кладётся невидимо под изображение, чтобы его можно было искать и копировать. PDF выглядит как прежде.
    [few] Страниц без текста: { $without } из { $pages }. Они читаются, и их текст кладётся невидимо под изображение, чтобы его можно было искать и копировать. PDF выглядит как прежде.
    [many] Страниц без текста: { $without } из { $pages }. Они читаются, и их текст кладётся невидимо под изображение, чтобы его можно было искать и копировать. PDF выглядит как прежде.
   *[other] Страниц без текста: { $without } из { $pages }. Они читаются, и их текст кладётся невидимо под изображение, чтобы его можно было искать и копировать. PDF выглядит как прежде.
}
ocr-searchable-has-text = { $pages ->
    [one] На странице есть текст: в PDF уже можно искать.
    [few] На всех страницах есть текст: в PDF уже можно искать.
    [many] На всех страницах есть текст: в PDF уже можно искать.
   *[other] На всех страницах есть текст: в PDF уже можно искать.
}
ocr-searchable-damaged = PDF не удалось разобрать для изменения: возможно, он повреждён. Его текст всё же можно загрузить в проект как карту.
ocr-searchable-make = Добавить текстовый слой
ocr-strip = Убрать невидимый текст, который у них есть, и оставить только прочитанное
ocr-strip-hint = Для плохого текстового слоя, какой кладёт под страницу сканер. Видимые буквы остаются, и страница выглядит как прежде.
ocr-searchable-done = { $count ->
    [one] В PDF есть текстовый слой: прочитана { $count } страница
    [few] В PDF есть текстовый слой: прочитаны { $count } страницы
    [many] В PDF есть текстовый слой: прочитано { $count } страниц
   *[other] В PDF есть текстовый слой: прочитаны { $count } страницы
}
ocr-searchable-failed = { $count ->
    [one] { $count } страницу не удалось прочитать.
    [few] { $count } страницы не удалось прочитать.
    [many] { $count } страниц не удалось прочитать.
   *[other] { $count } страницы не удалось прочитать.
}

## A map from a PDF of the library

ocr-map-button = Карта его текста…
ocr-map-title = Карта текста
ocr-map-into = В проект
ocr-map-new-project = Новый проект, названный по нему
ocr-map-making = Создание карты…
ocr-map-failed = Не удалось создать карту.

## The text of a picture of the store

ocr-picture-read = Прочитать текст на нём…
ocr-picture-title = Текст на изображении
ocr-picture-empty = Текст на изображении не найден.
ocr-picture-copy = Копировать
ocr-picture-copied = Текст скопирован
ocr-picture-map = Сделать из него карту

## Tesseract in the settings

ocr-settings-looking = Поиск…
ocr-settings-missing = Не найден. Нужен, чтобы читать текст со сканов и изображений. Установите tesseract менеджером пакетов вашей системы вместе с данными языков, которые вы читаете (в Arch: tesseract-data-eng для английского, tesseract-data-rus для русского, tesseract-data-grc для древнегреческого, …), или укажите ниже, где он.
ocr-settings-by-itself = Найден сам
ocr-settings-where = Где Tesseract
ocr-settings-look-failed = Не удалось поискать Tesseract
ocr-settings-has = Читает: { $languages }.
ocr-settings-has-none = У него нет данных ни одного языка: установите данные какого-нибудь, например tesseract-data-eng.
ocr-settings-first = Читать сначала на
ocr-settings-first-hint = Когда ничего не выбрано — язык текста и язык интерфейса.
ocr-settings-how = Как текст читается сначала
