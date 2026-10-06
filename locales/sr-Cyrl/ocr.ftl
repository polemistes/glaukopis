# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF датотеке и слике
ocr-no-tesseract = Tesseract, који чита текст на сликама, није инсталиран или није могао да се нађе. Инсталирајте га управљачем пакета свог система, с подацима за језике које читате (на систему Arch: tesseract и tesseract-data-eng, tesseract-data-srp и тако даље), или у подешавањима реците где је.
ocr-failed = Текст није могао да се прочита.
ocr-looking = Преглед датотеке { $file }…
ocr-about-picture = Текст се чита са слике.
ocr-about-scan = { $pages ->
    [1] PDF нема текст: чита се са слике своје стране.
    [one] Ниједна од { $pages } стране нема текст: читају се са својих слика.
    [few] Ниједна од { $pages } стране нема текст: читају се са својих слика.
   *[other] Ниједна од { $pages } страна нема текст: читају се са својих слика.
}
ocr-about-some = { $without ->
    [one] { $without } од { $pages } страна нема текст и чита се са своје слике; остале се узимају какве јесу.
    [few] { $without } од { $pages } страна немају текст и читају се са својих слика; остале се узимају какве јесу.
   *[other] { $without } од { $pages } страна немају текст и читају се са својих слика; остале се узимају какве јесу.
}
ocr-about-text = { $pages ->
    [1] Страна има текст, који се узима какав јесте.
    [one] Свака страна има текст, који се узима какав јесте.
    [few] Свака страна има текст, који се узима какав јесте.
   *[other] Свака страна има текст, који се узима какав јесте.
}
ocr-read-all = Читај и стране које имају текст
ocr-read-all-hint = Њихов текст остаје, а прочитано се полаже преко њега.
ocr-read-all-map-hint = Прочитано заузима место њиховог текста: за кад је лош, или не може да се прочита.
ocr-read = Читај текст
ocr-read-text-pages = Узми стране које имају текст
ocr-take-text = Узми текст
ocr-reading = Читање { $file }…
ocr-reading-pages = { $done } од { $total } страна прочитано
ocr-reading-hint = Страна траје неколико секунди. „Откажи“ зауставља читање.

## How the text is read: what to try when a reading goes badly

ocr-how = Како се чита
ocr-how-dpi = Резолуција, у тачкама по инчу
ocr-how-layout = Распоред стране
ocr-how-layout-auto = Како Tesseract процени
ocr-how-layout-column = Један ступац
ocr-how-layout-block = Један блок текста
ocr-how-layout-sparse = Ретко распоређен текст
ocr-how-contrast = Црно-бело
ocr-how-hint = Шта покушати кад читање иде лоше: већа резолуција за ситна слова, један ступац где се ступци мешају, један блок текста за један пасус, и црно-бело за слабу или неуједначену штампу.

## The languages of the text

ocr-languages = Језици текста
ocr-languages-hint = Највероватнији први. Сваки следећи чини читање споријим, а не увек бољим.
ocr-language-add = Додај језик…
ocr-language-remove = Уклони { $language }
# A script rather than a language: "Latin script".
ocr-language-script = Писмо: { $script }
ocr-language-fraktur = { $language }, фрактура
ocr-language-old = { $language }, старији
ocr-language-vertical = { $language }, писан одозго надоле

## A PDF of the library made searchable

ocr-searchable-button = Учини претраживим…
ocr-searchable-title = Учини PDF претраживим
ocr-searchable-about = { $without ->
    [one] { $without } од { $pages } страна нема текст. Чита се, а њен текст се невидљиво полаже под оно што се приказује, да би могао да се претражује и копира. PDF изгледа као и пре.
    [few] { $without } од { $pages } страна немају текст. Читају се, а њихов текст се невидљиво полаже под оно што се приказује, да би могао да се претражује и копира. PDF изгледа као и пре.
   *[other] { $without } од { $pages } страна немају текст. Читају се, а њихов текст се невидљиво полаже под оно што се приказује, да би могао да се претражује и копира. PDF изгледа као и пре.
}
ocr-searchable-has-text = { $pages ->
    [1] Страна има текст: PDF већ може да се претражује.
    [one] Свака страна има текст: PDF већ може да се претражује.
    [few] Свака страна има текст: PDF већ може да се претражује.
   *[other] Свака страна има текст: PDF већ може да се претражује.
}
ocr-searchable-damaged = PDF није могао да се растави да би се изменио: можда је оштећен. Његов текст се ипак може учитати у пројекат као мапа.
ocr-searchable-make = Учини претраживим
ocr-strip = Уклони невидљиви текст који имају, и задржи само прочитано
ocr-strip-hint = За лош текстуални слој, какав скенер полаже под страну. Видљива слова остају, а страна изгледа као и пре.
ocr-searchable-done = { $count ->
    [one] PDF је претражив: прочитана је { $count } страна
    [few] PDF је претражив: прочитане су { $count } стране
   *[other] PDF је претражив: прочитано је { $count } страна
}
ocr-searchable-failed = { $count ->
    [one] { $count } страна није могла да се прочита.
    [few] { $count } стране нису могле да се прочитају.
   *[other] { $count } страна није могло да се прочита.
}

## A map from a PDF of the library

ocr-map-button = Мапа његовог текста…
ocr-map-title = Мапа текста
ocr-map-into = У пројекат
ocr-map-new-project = Нови пројекат, назван по њему
ocr-map-making = Прављење мапе…
ocr-map-failed = Мапа није могла да се направи.

## The text of a picture of the store

ocr-picture-read = Читај текст на њој…
ocr-picture-title = Текст на слици
ocr-picture-empty = На слици није пронађен текст.
ocr-picture-copy = Копирај
ocr-picture-copied = Текст је копиран
ocr-picture-map = Направи мапу од њега

## Tesseract in the settings

ocr-settings-looking = Тражење…
ocr-settings-missing = Није пронађен. Потребан је за читање текста са скенова и слика. Инсталирајте tesseract управљачем пакета свог система, с подацима за језике које читате (на систему Arch tesseract-data-eng за енглески, tesseract-data-srp за српски, tesseract-data-grc за старогрчки, …), или испод реците где је.
ocr-settings-by-itself = Пронађен сам од себе
ocr-settings-where = Где је Tesseract
ocr-settings-look-failed = Tesseract није могао да се потражи
ocr-settings-has = Чита: { $languages }.
ocr-settings-has-none = Нема податке ни за један језик: инсталирајте податке за неки, као tesseract-data-eng.
ocr-settings-first = Подразумевано читај на
ocr-settings-first-hint = Кад ниједан није изабран, језик текста и језик интерфејса.
ocr-settings-how = Како се текст подразумевано чита
