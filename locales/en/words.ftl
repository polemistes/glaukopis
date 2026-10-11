# The words of a language made into a project, to be read through and
# mended in Glaukopis, and written back as Fluent files (ADR 0034). In the
# settings of languages, and over such a project. See locales/README.md.

words-title = The words of Glaukopis, as a project
words-hint = Makes a project of the words of the interface in a language, to read them through and mend them here, with spelling, search and history: a tree for each part of the application, an element for each message, with the English above the words. What you change is written back as Fluent files with the button over the project, into the folder of the language in a copy of Glaukopis's code, or into any folder, to be sent to us.
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

# Putting the changed words to use at once, without a new version of
# Glaukopis (ADR 0035): they are written into the data directory and laid
# over the words Glaukopis came with.
words-use = Use them now
words-using = Putting them to use…
words-use-hint = Puts what you changed to use at once, in place of the words Glaukopis came with, without a new version. The Fluent files are not written by this.
words-use-failed = The words could not be put to use
# $count is how many messages.
words-used = { $count ->
    [0] Nothing was changed, and nothing put to use.
    [one] One message is now in use.
   *[other] { $count } messages are now in use.
}
words-used-title = The words put to use
words-used-refused = Not put to use, to be mended in the project
# $languages are the names of the languages: "English, Norwegian Bokmål".
words-own-in-use = Words you changed are in use, in place of those Glaukopis came with, for { $languages }.
words-own-remove = Take them away
words-own-remove-title = Take away the words you changed?
words-own-remove-message = The words you put to use for { $languages } are taken away, and those Glaukopis came with are used again. The projects of words are kept.
words-own-removed = The words Glaukopis came with are used again.
words-own-remove-failed = The words you changed could not be taken away
