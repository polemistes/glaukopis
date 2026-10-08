# 0034 — The words of the interface as a project

Date: 2026-10-08. Status: accepted.

## Context

The one the application is made for is to read through all the Norwegian
words of the interface and make them read as a person writes. A spreadsheet
of them could be made (`scripts/locale-sheet.mjs`); asked whether a project
of Glaukopis would not serve better, the answer was yes: with the spelling
of the language, the application's search and replace, its history, its
status of elements, and the words read where they will stand.

## Decision

- **Settings › Language › The words of Glaukopis, as a project** makes a
  project, *Words: <language>*, of the words of any language the
  application has, from the Fluent files it carries: a map for each file, an
  element for each part of a message (`name`, or `name.hint` for an
  attribute), named by it. Its text is the English, as a quotation in foreign
  words (so that the spelling of the language leaves it alone), with the
  note the English file has for translators, and after it the words of the
  language, as paragraphs, a line to a line: the Fluent of the message,
  without the indentation of its lines. The maps are in the language.
- **Each element keeps which part it is and its words as they were**
  (`words` on the element, `words` in the project's `meta`).
- **Write as Fluent files…**, in a bar over such a project, writes what was
  changed into the Fluent files of a folder chosen: the language's folder in
  a copy of the code, or any folder, to send the files on. As the
  spreadsheet does (`words/fluent.ts`): only what was changed is written, by
  the place of each message in its file; what was changed in the file since
  is left as the file has it; what is not good Fluent, or lacks a variable of
  the English or a plural form of the language, is not written, and is
  named, to be mended in the project and written again. What is written
  becomes what the element was, without being undone by Undo.
- The app reads and writes only Fluent files named as its own, directly in
  the folder chosen (`words_read`, `words_write`).

## Consequences

- `@fluent/syntax` is part of the application, not only of its tools.
- A project of a language's words has some 3,200 elements.
