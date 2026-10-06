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

Read `TRANSLATING.md`, which says how, and `GLOSSARY.md`, which says what
the application's own words mean. In short: copy `en/` to a directory named
by the tag of the language (`de`, `pt-BR`, `sr-Cyrl`), translate every
file, and give the language its name in `NAMES` in
`crates/core/src/i18n.rs`. `node scripts/check-locales.mjs <tag>` says what
is lacking and what is wrong. A language is offered in the settings as soon
as it has a `core.ftl`; what it lacks is said in English. A language that
has only `document.ftl` has words for documents and not an interface.
English and Bokmål must be complete; the tests (`pnpm test`, `cargo test`)
demand that, and that no language has anything wrong. Serbian in Latin
letters is made from the Cyrillic by `scripts/serbian-latin.mjs`, and is not
edited by hand. The words of a language are loaded when it is first spoken;
English and every `document.ftl` are at hand from the start.
