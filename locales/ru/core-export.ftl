# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Изображения «{ $name }» нет на этом компьютере, и в документ оно не вошло.
core-export-astray = { $count ->
    [one] { $count } перекрёстная ссылка в тексте указывает на то, чего нет в документе. Она набрана как [?].
    [few] { $count } перекрёстные ссылки в тексте указывают на то, чего нет в документе. Они набраны как [?].
    [many] { $count } перекрёстных ссылок в тексте указывают на то, чего нет в документе. Они набраны как [?].
   *[other] { $count } перекрёстные ссылки в тексте указывают на то, чего нет в документе. Они набраны как [?].
}
core-export-latex-font = Шрифт { $font } не установлен. Документ набран шрифтом Latin Modern — собственным шрифтом LaTeX.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] { $count } текст документа не был отправлен и не сохранён.
    [few] { $count } текста документа не были отправлены и не сохранены.
    [many] { $count } текстов документа не были отправлены и не сохранены.
   *[other] { $count } текста документа не были отправлены и не сохранены.
}
# Shown after "not found: ".
core-export-preview-document = документ предпросмотра
core-export-reading-pdf = чтение сделанного PDF
core-export-reading-made = чтение сделанного документа

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = не удалось прочитать документ-образец: { $error }
core-export-pattern-lacks = в документе-образце нет { $name }
core-export-pattern-reading = чтение документа-образца
core-export-pattern-writing = запись документа-образца

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Формула обрывается, не закончившись.
# The command is as it was written: \frac.
core-export-formula-unknown = Команда { $command } неизвестна.
core-export-formula-unexpected = { $what } здесь не ожидалось.
core-export-formula-unreadable = Не удалось прочитать формулу.
core-export-formula-too-long = Формула слишком длинная.

## Reference styles.

core-export-style-bad-id = «{ $id }» не годится как идентификатор стиля
core-export-not-a-style = Это не стиль: { $error }.
core-export-not-a-style-begin = Это не стиль: он не начинается с <style>.
core-export-dependent-style = Этот стиль лишь называет другой стиль, у которого берёт свою форму. Скачайте тот по его имени.
core-export-style-unreadable = Не удалось прочитать стиль обратно.
core-export-style-needs-name = Стилю нужно имя.
core-export-style-own-only = Удалять можно только свои стили.
# Shown after "not found: ".
core-export-the-reference-style = стиль цитирования «{ $id }»
core-export-any-reference-style = хоть какой-нибудь стиль цитирования
core-export-the-style = стиль «{ $id }»

## Document formats.

core-export-format-bad-id = «{ $id }» не годится как идентификатор формата
core-export-format-needs-name = Формату нужно имя.
core-export-format-own-only = Удалять можно только свои форматы.
core-export-not-a-length = «{ $length }» — не длина
# Shown after "not found: ".
core-export-the-format = формат «{ $id }»
