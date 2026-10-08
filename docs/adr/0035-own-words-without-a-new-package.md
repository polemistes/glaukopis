# 0035 — Own words, used without a new package

Date: 2026-10-08. Status: accepted. Adds to ADR 0020 and ADR 0034.

## Context

The words of the interface are built into the program: those of the
interface into its page, those of the core (its messages, the words of
documents) into the program. A word mended in a project of words (ADR 0034)
was seen only in a package built after. The one the application is made
for asked for the changed words to be used without a new package.

## Decision

- **A folder of own words** in the data directory, `words/<tag>/`, holds
  Fluent files as `locales/<tag>/` does. Their messages are laid over the
  words that are built in: a message there takes the place of the one of the
  same name, and what it lacks is said as before. The interface reads them
  when the language is loaded; the core reads them for its messages and for
  the words of documents.
- **What does not fit is left out**, message by message, when the files are
  read: a message that is not good Fluent, whose variables are not those of
  the English that is built in, or which lacks a plural form of the
  language, is not used, and the built-in one stands. So own words written
  for an older version do no harm in a newer one.
- **Use them now**, beside *Write as Fluent files…* over a project of words,
  writes the changed words of the project into `words/<tag>/` (as the
  writing of files does, ADR 0034: only what was changed, over what the
  folder holds) and has the interface and the core read their words again,
  so that the change is seen at once.
- *Settings* › *Language* says where own words are in use, for which
  languages, and has them taken away again (the folder is emptied), after
  which the built-in words are used.
- Files of own words from someone else are used by putting them in the
  folder; the application reads them when it starts.

## Consequences

- The words of a language are those that are built in and those of the
  folder, which the tests of the built-in words do not see.
