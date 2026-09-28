# 0019 — Spelling

Date: 2026-09-28. Status: accepted.

## Context

The one the application is made for asked for spelling to be checked, and
for a suggestion of what to check it with; grammar only if a free checker
is found that works well.

The web view can underline words it does not know, but it does so by the
system's means, differently on each system, without a say in the language
of a text, and it sees only the text that has an editor (ADR 0017).

The dictionaries that free programs share are those of Hunspell: LibreOffice
and Firefox use them, and there is one for almost every language. For
Norwegian, LibreOffice's is made from Norsk Ordbank of the National
Library. Hunspell itself is C++; Spellbook, which the editor Helix uses, reads
the same dictionaries in Rust. Tried against Hunspell with LibreOffice's
Bokmål dictionary, on 10,312 words, compounds among them, it judged every
one the same, and it reads the dictionary in less than a fifth of a second.

## Decision

- **Spellbook in the core, with Hunspell's dictionaries.** English (United
  States and Great Britain) and Norwegian (Bokmål and Nynorsk) come with
  the application, from LibreOffice's dictionaries, with their licences.
  Dictionaries that are installed on the system (`/usr/share/hunspell` and
  its like) are used for other languages, and a dictionary can be put in
  the data directory.
- **A text is checked in the language of its map** (ADR 0020). English
  without a country takes the words of both.
- **The writer's own words** are kept in the data directory, a list for each
  language, and hold in all projects. Words ignored in a project are kept
  in the project, so that those it is shared with have them too.
- **What is not checked:** citations, formulas and other things that are not
  text; words with digits; addresses; and words written in another script
  than the dictionary's, such as Greek in an English text.
- **Words are underlined where they stand**, in the editors and in the text
  that is drawn without one. The menu of a word gives what it may be, and
  lets it be added to one's words or ignored in the project.
- **Grammar is not checked.** Harper, a free checker in Rust, is good and
  fast, but only for English; LanguageTool knows many languages, but not
  Norwegian, and is a Java server.

## Why not otherwise

- *The web view's own checking*: different on every system, deaf to the
  language of the text, and blind to the text without an editor.
- *Hunspell or Nuspell compiled in*: the same dictionaries and the same
  judgements, with C++ to build on every system.

## Consequences

- The Norwegian dictionaries are large, some sixteen megabytes together;
  they are read when a text in the language is first checked.
- What is suggested for a misspelt word is found when it is asked for, and
  may take half a second in Norwegian, whose words are long.
