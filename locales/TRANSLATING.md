# Translating Glaukopis

Every word the application shows is in the Fluent files under `locales/`:
a folder for each language, named by its tag (`de`, `pt-BR`, `sr-Cyrl`),
and in it the same forty-four files as `locales/en/`. English is the
source. Norwegian Bokmål (`nb`) is complete, and shows how a translation
into a related language was done. `GLOSSARY.md` beside this file says what
the application's own words mean; read it first.

What a language lacks is shown in English, so a translation may be partial
while it is being made, but nothing it has may be wrong: a message with
the wrong variables is worse than none.

## The voice

The English is plain and short, in everyday words used carefully, not in
the words of computing: a document is *brought in*, not imported; the
application *says* something, it does not display a notification. Write
the same way in your language: as a careful, friendly person who knows the
work of a scholar would put it, in the words a scholar of the language
uses. Say what the English says, in the way the language says it. It is
not a rendering word for word: change the order, split or join sentences,
leave out what the language does not need.

- **The application's own words** (map, element, kind, look, format,
  style, passage, the store, the rail…) are chosen once, from
  `GLOSSARY.md`, and used the same in every file. Write your choices first,
  in `locales/<tag>/GLOSSARY.md`, before translating; add to it as you go.
- **The form of address** is the one that software in your language uses
  today, and the same throughout; note it in your glossary. Many languages
  put commands in the infinitive or the imperative and address the writer
  only where they must.
- **Short things stay short.** A button, a menu item, a tab, a heading of
  a settings group should be about as long as the English, since the space
  is made for it. Hints and messages may run longer where the language
  needs it.
- **Typography of the language**: its own quotation marks („…“, « … »,
  「…」), the no-break space before `;` `:` `!` `?` in French, the
  ellipsis character `…`, its own dashes. Numbers and dates are written
  by the program in the way of the language: do not reorder `{ $count }`
  into words.
- **Names stay names**: see the end of `GLOSSARY.md`. Keys are written as
  the keyboard of the language writes them.

## Fluent

A file is a list of messages. A message is a name, `=`, and its text.
Keep the names, the attributes, the order of the messages, the blank lines
and the comments exactly as in English, so that the files line up; the
comments stay in English, since they are for translators.

```ftl
# What a message is for, where that is not plain from its name.
search-found = { $count ->
    [one] One is found
   *[other] { $count } are found
}
field-shortauthor = Short form of the author
    .hint = For citations, when the full name is long
kinds-delete-title = Delete the kind “{ $name }”?
core-bib-expected-brace = `@{ $kind }` is not followed by `{"{"}` or `(`
field-editoratype-organizer = { field-editortype-organizer }
```

- `{ $name }` is a variable, put in by the program. Every message keeps
  exactly the variables the English has, with the same names; a variable
  may stand anywhere in the sentence.
- `.hint = …` is an attribute: a second text of the same message. Keep
  every attribute.
- `{ other-message }` puts in another message; keep such references.
- `{"{"}` is a literal brace; `{ "" }` at the start or end keeps a space.
- A text that runs over several lines is indented by four spaces on the
  lines after the first; one that begins on the line after `=` is indented
  the same.
- A choice by number, `{ $count -> … }`, has one line for each plural form
  of the language, and the last, marked `*`, is the one taken when none
  other fits. **The forms are those of your language, not of English.**
  English has `one` and `other`. Russian, Ukrainian, Belarusian and Polish
  need `one`, `few` and `many`; Czech and Slovak `one`, `few` and `other`;
  Croatian, Bosnian, Serbian and Romanian `one`, `few` and `other`;
  Slovenian `one`, `two`, `few` and `other`; Chinese and Japanese `other`
  alone (take the `[one]` line away). Keep `*[other]` as the last line
  always, even where whole numbers never take it. The check below tells
  you the forms of your language, and faults a choice that lacks one. Where
  English writes `{ $count } pages` with no choice at all, and your
  language inflects the noun by the number, make the choice yourself:
  `{ $count -> [one] { $count } страница [few] { $count } страницы *[other] { $count } страниц }`.
- `[0]` and `[1]` choose an exact number and may be kept or added where
  the language says it better ("none" rather than "0").

## How to work

1. **See what is there.** Files that already exist in `locales/<tag>/`
   are done, or were begun: do not do them again unless the check faults
   them. Begin with the glossary, then take the files that are missing, one
   at a time, in the order of `ls locales/en`.
2. **One file at a time.** Read `locales/en/<file>.ftl`, and write
   `locales/<tag>/<file>.ftl` whole, with the Write tool. Never write a
   Fluent file with a shell heredoc or `sed`: the shell eats `$count` and
   backticks. Write the whole file in one go, so that it is never half
   there.
3. **Check it at once:**

   ```
   node scripts/check-locales.mjs <tag>
   ```

   It names every fault: a file that does not read, a name English has
   not, variables or attributes that differ, a plural form that is missing
   or foreign. Mend the faults before going on. `--missing` lists what is
   still lacking.
4. **Change nothing else.** Only `locales/<tag>/` is yours: not the English
   files, not other languages, not the code. Do not run the test suites or
   build the application; that is done afterwards for all languages at
   once.
5. **At the end** the check says `3062 of 3062 messages translated` and
   `0 fault(s)`. Then say, briefly: the form of address you chose; the
   glossary words that were hard to choose and why; the messages whose
   English you found unclear, by name; and anything you left as it was.

## The files

`common.ftl` has the words used everywhere; `shell.ftl` the rail; the
other files each have one part of the application, named by the file:
`library`, `project`, `editor`, `preview`, `settings` and so on. `keys.ftl`
describes the keys of the keyboard; `fields.ftl` names the fields of a
reference, as a librarian would name them in your language; `style.ftl`
is the editor of reference styles; `format.ftl` the editor of formats.
Files named `core-…` hold what the Rust core says: errors, warnings and
remarks, often whole sentences. `document.ftl` is different from the rest:
its words are printed in documents (Figure, Table, Notes, Abstract,
Keywords, Bibliography, Contents…), in the language of the document, and
must be the standard words of scholarly publishing in the language.
