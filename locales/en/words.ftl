# The words of a language made into a project, to be read through and
# mended in Glaukopis, and written back as Fluent files (ADR 0034). In the
# settings of languages, and over such a project. See locales/README.md.

words-title = The words of Glaukopis, as a project
words-hint = Makes a project of the words of the interface in a language, to read them through and mend them here, with spelling, search and history: a map for each part of the application, an element for each message, with the English above the words. What you change is written back as Fluent files with the button over the project, into the folder of the language in a copy of Glaukopis's code, or into any folder, to be sent to us.
words-language = Language
words-make = Make the project
words-making = Making it…
words-make-failed = The project of words could not be made
# $language is the name of the language: "Norwegian Bokmål".
words-project-name = Words: { $language }
words-not-a-project = This project holds no words of Glaukopis.
words-bar = The words of Glaukopis in { $language }. Change the words under the English; what you change is written back as Fluent files.
words-write = Write as Fluent files…
words-writing = Writing…
words-write-choose = The folder of the language's Fluent files
words-write-failed = The words could not be written
# $count is how many messages; $files how many files.
words-written = { $count ->
    [0] Nothing was changed, and nothing written.
    [one] One message was written, into { $files ->
        [one] one file
       *[other] { $files } files
    }.
   *[other] { $count } messages were written, into { $files ->
        [one] one file
       *[other] { $files } files
    }.
}
words-result-title = The words written
words-conflicts = Changed in the files since the project was made, and left as the files have them
words-refused = Not written, to be mended in the project
# $detail says more: the variables it has and must have, the plural forms it lacks.
words-refused-fluent = it is not good Fluent: { $detail }
words-refused-variables = its variables are not those of the English: { $detail }
words-refused-reference = it refers to { $detail }, which the English does not
words-refused-plurals = its plural forms are not those of the language: { $detail }
words-refused-missing = the English has no such message, or the message's text was not written
words-refused-file = the file { $detail } would not read afterwards
