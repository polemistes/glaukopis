# The words of Glaukopis

Every word the application shows or prints is kept here, in
[Fluent](https://projectfluent.org), the format Mozilla made for
translation: a directory for each language, named by its tag (`en`, `nb`),
and in it a file for each part of the application. English is the source.
See ADR 0020 for why it is done so.

```
locales/en/common.ftl      words used in many places: Cancel, Close, …
locales/en/shell.ftl       the rail
locales/en/library.ftl     the library, and so on for each part
locales/en/core*.ftl       what the core (Rust) says: errors, warnings, remarks
locales/en/document.ftl    what documents print: Notes, Abstract, Figure, …
```

## Messages

```ftl
# What a message is for, where that is not plain from its name.
search-found = { $count ->
    [one] One is found
   *[other] { $count } are found
}
```

- A name begins with the name of its file (`search-`, `library-`), and says
  what the message is, not what it says: `library-add-reference`, not
  `library-add-a-reference-to-the-library`.
- Variables (`$count`, `$name`) are the same in every language. Numbers are
  written in the way of the language; plurals are chosen by the language's
  own rules, with `[one]` and `*[other]` in English and Norwegian.
- Words are plain and short, in the voice of the rest of the application.
  A translation says what the English says, in the way the language says
  it; it is not a rendering word for word.
- What the interface does not find in a translation, it shows in English;
  what it does not find in English, it shows by its name.

## Documents

`document.ftl` holds the words a document prints, in the language of the
document, whatever the language of the interface. A language that has this
file has words for documents, and is offered for new texts. The document
formats have these words in English; a document prints them in its own
language, unless the format has words of its own.

## A new language

Copy `en/` to a directory named by the tag of the language, translate every
file, and add the language to `INTERFACE` in `crates/core/src/i18n.rs`. A
language that has only `document.ftl` has words for documents and not an
interface. The tests (`pnpm test`, `cargo test`) say what is missing, and
where the variables differ.
