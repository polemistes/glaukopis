# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Зображення «{ $name }» немає на цьому компʼютері, тому в документ воно не потрапляє.
core-export-astray = { $count ->
    [one] { $count } посилання в тексті вказує на те, чого в документі немає. Його набрано як [?].
    [few] { $count } посилання в тексті вказують на те, чого в документі немає. Їх набрано як [?].
    [many] { $count } посилань у тексті вказують на те, чого в документі немає. Їх набрано як [?].
   *[other] { $count } посилання в тексті вказує на те, чого в документі немає. Його набрано як [?].
}
core-export-latex-font = Шрифт { $font } не встановлено. Документ набрано шрифтом Latin Modern, власним шрифтом LaTeX.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] { $count } текст документа не надіслано, і його не збережено.
    [few] { $count } тексти документа не надіслано, і їх не збережено.
    [many] { $count } текстів документа не надіслано, і їх не збережено.
   *[other] { $count } тексту документа не надіслано, і їх не збережено.
}
# Shown after "not found: ".
core-export-preview-document = документ перегляду
core-export-reading-pdf = читання створеного PDF
core-export-reading-made = читання створеного документа

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = не вдалося прочитати документ-зразок: { $error }
core-export-pattern-lacks = у документі-зразку немає { $name }
core-export-pattern-reading = читання документа-зразка
core-export-pattern-writing = запис документа-зразка

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Формула обривається незавершеною.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } — невідома команда.
core-export-formula-unexpected = { $what } не очікується на цьому місці.
core-export-formula-unreadable = Не вдалося прочитати формулу.
core-export-formula-too-long = Формула надто довга.

## Reference styles.

core-export-style-bad-id = «{ $id }» не може бути ідентифікатором стилю
core-export-not-a-style = Це не стиль: { $error }.
core-export-not-a-style-begin = Це не стиль: він не починається з <style>.
core-export-dependent-style = Цей стиль лише називає інший стиль, з якого бере свою форму. Натомість отримайте той за його назвою.
core-export-style-unreadable = Збережений стиль не вдалося прочитати знову.
core-export-style-needs-name = Стилю потрібна назва.
core-export-style-own-only = Видаляти можна лише власні стилі.
# Shown after "not found: ".
core-export-the-reference-style = стиль цитування «{ $id }»
core-export-any-reference-style = жодного стилю цитування
core-export-the-style = стиль «{ $id }»

## Document formats.

core-export-format-bad-id = «{ $id }» не може бути ідентифікатором формату
core-export-format-needs-name = Формату потрібна назва.
core-export-format-own-only = Видаляти можна лише власні формати.
core-export-not-a-length = «{ $length }» — не довжина
# Shown after "not found: ".
core-export-the-format = формат «{ $id }»
