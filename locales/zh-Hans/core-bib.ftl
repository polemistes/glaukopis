# What the core says of faults in a file of BibTeX or BibLaTeX, in English.
# They are shown after the line they are on. See locales/README.md.

core-bib-string-without-name = 一个没有名称的 @string
core-bib-expected-found = 此处应为 `{ $expected }`，却是 `{ $found }`
core-bib-expected-end = 此处应为 `{ $expected }`，文件却已结束
core-bib-expected-brace = `@{ $kind }` 后面没有 `{"{"}` 或 `(`
core-bib-comment-not-closed = 一处注释没有结束
core-bib-entry-not-closed = 条目 `{ $key }` 没有结束
core-bib-expected-field = 在 `{ $key }` 中：此处应为字段名，却是 `{ $found }`
core-bib-field-without-value = 在 `{ $key }` 中：字段 `{ $field }` 没有值
# Where in an entry a fault is, before the fault itself.
core-bib-in-field = 在 `{ $key }` 的字段 `{ $field }` 中：{ $message }
core-bib-brace-not-closed = 一个花括号没有闭合
core-bib-quote-not-closed = 一个引号没有闭合
core-bib-expected-value = 此处应为一个值，却是 `{ $found }`
core-bib-abbreviation = 缩写 `{ $name }` 没有定义
core-bib-ended-in-value = 文件在一个值的中间结束了
