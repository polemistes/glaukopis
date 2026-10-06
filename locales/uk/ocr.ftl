# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF та зображення
ocr-no-tesseract = Tesseract, який читає текст у зображеннях, не встановлено або не вдалося знайти. Встановіть його менеджером пакунків вашої системи разом із даними мов, які ви читаєте (на Arch: tesseract і tesseract-data-ukr, tesseract-data-eng тощо), або вкажіть у налаштуваннях, де він є.
ocr-failed = Не вдалося прочитати текст.
ocr-looking = Розгляд { $file }…
ocr-about-picture = Текст читається із зображення.
ocr-about-scan = { $pages ->
    [one] PDF не має тексту: він читається із зображення його сторінки.
    [few] Жодна зі сторінок (усього { $pages }) не має тексту: вони читаються з їхніх зображень.
    [many] Жодна зі сторінок (усього { $pages }) не має тексту: вони читаються з їхніх зображень.
   *[other] Жодна зі сторінок (усього { $pages }) не має тексту: вони читаються з їхніх зображень.
}
ocr-about-some = { $without ->
    [one] Сторінок без тексту — { $without } з { $pages }: вона читається з її зображення, а решта беруться як є.
    [few] Сторінок без тексту — { $without } з { $pages }: вони читаються з їхніх зображень, а решта беруться як є.
    [many] Сторінок без тексту — { $without } з { $pages }: вони читаються з їхніх зображень, а решта беруться як є.
   *[other] Сторінок без тексту — { $without } з { $pages }: вони читаються з їхніх зображень, а решта беруться як є.
}
ocr-about-text = { $pages ->
    [one] Сторінка має текст, який береться як є.
    [few] Кожна сторінка має текст, який береться як є.
    [many] Кожна сторінка має текст, який береться як є.
   *[other] Кожна сторінка має текст, який береться як є.
}
ocr-read-all = Читати й сторінки, що мають текст
ocr-read-all-hint = Їхній текст залишається, а прочитане накладається поверх нього.
ocr-read-all-map-hint = Прочитане стає на місце їхнього тексту: коли він поганий або його не вдається прочитати.
ocr-read = Прочитати текст
ocr-read-text-pages = Узяти сторінки, що мають текст
ocr-take-text = Узяти текст
ocr-reading = Читання { $file }…
ocr-reading-pages = Прочитано сторінок: { $done } з { $total }
ocr-reading-hint = Сторінка потребує кількох секунд. «Скасувати» зупиняє читання.

## How the text is read: what to try when a reading goes badly

ocr-how = Як читається
ocr-how-dpi = Роздільність, у точках на дюйм
ocr-how-layout = Верстка сторінки
ocr-how-layout-auto = На розсуд Tesseract
ocr-how-layout-column = Одна колонка
ocr-how-layout-block = Один блок тексту
ocr-how-layout-sparse = Розріджений текст
ocr-how-contrast = Чорно-біле
ocr-how-hint = Що спробувати, коли читання йде погано: вищу роздільність для дрібного друку, одну колонку там, де колонки плутаються, один блок тексту для єдиного абзацу, і чорно-біле для блідого або нерівного друку.

## The languages of the text

ocr-languages = Мови тексту
ocr-languages-hint = Найімовірніша перша. Кожна додаткова сповільнює читання, і не завжди поліпшує його.
ocr-language-add = Додати мову…
ocr-language-remove = Прибрати { $language }
# A script rather than a language: "Latin script".
ocr-language-script = Письмо { $script }
ocr-language-fraktur = { $language }, фрактура
ocr-language-old = { $language }, давніша
ocr-language-vertical = { $language }, вертикальне письмо

## A PDF of the library made searchable

ocr-searchable-button = Зробити придатним для пошуку…
ocr-searchable-title = Зробити PDF придатним для пошуку
ocr-searchable-about = { $without ->
    [one] Сторінок без тексту — { $without } з { $pages }. Вона читається, і її текст кладеться невидимо під те, що показано, щоб його можна було шукати й копіювати. PDF виглядає як і раніше.
    [few] Сторінок без тексту — { $without } з { $pages }. Вони читаються, і їхній текст кладеться невидимо під те, що показано, щоб його можна було шукати й копіювати. PDF виглядає як і раніше.
    [many] Сторінок без тексту — { $without } з { $pages }. Вони читаються, і їхній текст кладеться невидимо під те, що показано, щоб його можна було шукати й копіювати. PDF виглядає як і раніше.
   *[other] Сторінок без тексту — { $without } з { $pages }. Вони читаються, і їхній текст кладеться невидимо під те, що показано, щоб його можна було шукати й копіювати. PDF виглядає як і раніше.
}
ocr-searchable-has-text = { $pages ->
    [one] Сторінка має текст: PDF уже можна шукати.
    [few] Кожна сторінка має текст: PDF уже можна шукати.
    [many] Кожна сторінка має текст: PDF уже можна шукати.
   *[other] Кожна сторінка має текст: PDF уже можна шукати.
}
ocr-searchable-damaged = PDF не вдалося розібрати, щоб змінити: можливо, він пошкоджений. Його текст усе ж можна внести в проєкт як мапу.
ocr-searchable-make = Зробити придатним для пошуку
ocr-strip = Прибрати невидимий текст, який вони мають, і залишити лише прочитане
ocr-strip-hint = Для поганого текстового шару, який сканер кладе під сторінку. Видимі літери залишаються, і сторінка виглядає як і раніше.
ocr-searchable-done = { $count ->
    [one] PDF придатний для пошуку: прочитано { $count } сторінку
    [few] PDF придатний для пошуку: прочитано { $count } сторінки
    [many] PDF придатний для пошуку: прочитано { $count } сторінок
   *[other] PDF придатний для пошуку: прочитано { $count } сторінки
}
ocr-searchable-failed = { $count ->
    [one] { $count } сторінку не вдалося прочитати.
    [few] { $count } сторінки не вдалося прочитати.
    [many] { $count } сторінок не вдалося прочитати.
   *[other] { $count } сторінки не вдалося прочитати.
}

## A map from a PDF of the library

ocr-map-button = Мапа його тексту…
ocr-map-title = Мапа тексту
ocr-map-into = У проєкт
ocr-map-new-project = Новий проєкт, названий за ним
ocr-map-making = Створення мапи…
ocr-map-failed = Не вдалося створити мапу.

## The text of a picture of the store

ocr-picture-read = Прочитати текст у ньому…
ocr-picture-title = Текст у зображенні
ocr-picture-empty = У зображенні не знайдено тексту.
ocr-picture-copy = Копіювати
ocr-picture-copied = Текст скопійовано
ocr-picture-map = Зробити з нього мапу

## Tesseract in the settings

ocr-settings-looking = Пошук…
ocr-settings-missing = Не знайдено. Потрібен, щоб читати текст зі сканів і зображень. Встановіть tesseract менеджером пакунків вашої системи разом із даними мов, які ви читаєте (на Arch: tesseract-data-ukr для української, tesseract-data-eng для англійської, tesseract-data-grc для давньогрецької…), або вкажіть нижче, де він є.
ocr-settings-by-itself = Знайдено самостійно
ocr-settings-where = Де Tesseract
ocr-settings-look-failed = Не вдалося пошукати Tesseract
ocr-settings-has = Він читає { $languages }.
ocr-settings-has-none = Він не має даних жодної мови: встановіть дані якоїсь, наприклад tesseract-data-ukr.
ocr-settings-first = Читати спочатку
ocr-settings-first-hint = Коли жодної не вибрано — мову тексту й мову інтерфейсу.
ocr-settings-how = Як текст читається спочатку
