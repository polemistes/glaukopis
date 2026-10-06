# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Слике „{ $name }“ нема на овом рачунару, па је изостављена из документа.
core-export-astray = { $count ->
    [one] { $count } упутница у тексту упућује на нешто чега у документу нема. На њеном месту стоји [?].
    [few] { $count } упутнице у тексту упућују на нешто чега у документу нема. На њиховом месту стоји [?].
   *[other] { $count } упутница у тексту упућује на нешто чега у документу нема. На њиховом месту стоји [?].
}
core-export-latex-font = Фонт { $font } није инсталиран. Документ је сложен у фонту Latin Modern, који LaTeX носи са собом.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] { $count } текст документа није послат, а није ни сачуван.
    [few] { $count } текста документа нису послата, а нису ни сачувана.
   *[other] { $count } текстова документа није послато, а није ни сачувано.
}
# Shown after "not found: ".
core-export-preview-document = документ прегледа
core-export-reading-pdf = читање направљеног PDF-а
core-export-reading-made = читање направљеног документа

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = образац документа није могао да се прочита: { $error }
core-export-pattern-lacks = образац документа нема { $name }
core-export-pattern-reading = читање обрасца документа
core-export-pattern-writing = писање обрасца документа

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Формула се завршава пре него што је потпуна.
# The command is as it was written: \frac.
core-export-formula-unknown = Наредба { $command } није позната.
core-export-formula-unexpected = { $what } се не очекује на месту где стоји.
core-export-formula-unreadable = Формула није могла да се прочита.
core-export-formula-too-long = Формула је предугачка.

## Reference styles.

core-export-style-bad-id = „{ $id }“ не може бити ознака стила
core-export-not-a-style = Ово није стил: { $error }.
core-export-not-a-style-begin = Ово није стил: не почиње са <style>.
core-export-dependent-style = Овај стил само именује други стил, од кога преузима облик. Преузмите радије тај други, по његовом имену.
core-export-style-unreadable = Стил није могао поново да се прочита.
core-export-style-needs-name = Стилу треба назив.
core-export-style-own-only = Могу се обрисати само сопствени стилови.
# Shown after "not found: ".
core-export-the-reference-style = стил цитирања „{ $id }“
core-export-any-reference-style = иједан стил цитирања
core-export-the-style = стил „{ $id }“

## Document formats.

core-export-format-bad-id = „{ $id }“ не може бити ознака формата
core-export-format-needs-name = Формату треба назив.
core-export-format-own-only = Могу се обрисати само сопствени формати.
core-export-not-a-length = „{ $length }“ није дужина
# Shown after "not found: ".
core-export-the-format = формат „{ $id }“
