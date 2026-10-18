# The words of a language made into a project, to be read through and
# mended in Glaukopis, and written back as Fluent files (ADR 0034). In the
# settings of languages, and over such a project. See locales/README.md.

words-title = Ein Übersetzungsprojekt aus den Texten von Glaukopis anlegen
words-hint = Für Übersetzer der Oberfläche von Glaukopis. Auch wer Glaukopis nur verwendet, kann damit die Texte der Oberfläche in der Sprache seiner Wahl in seiner eigenen Installation ändern.
words-language = Sprache
words-make = Projekt anlegen
words-making = Wird angelegt…
words-make-failed = Das Projekt der Texte konnte nicht angelegt werden
# $language is the name of the language: "Norwegian Bokmål".
words-project-name = Texte: { $language }
words-not-a-project = Dieses Projekt enthält keine Texte von Glaukopis.
words-bar = Die Texte von Glaukopis auf { $language }. Ändern Sie die Texte unter dem Englischen; was Sie ändern, wird als Fluent-Dateien zurückgeschrieben.
words-write = Als Fluent-Dateien schreiben…
words-writing = Wird geschrieben…
words-write-choose = Der Ordner der Fluent-Dateien der Sprache
words-write-failed = Die Texte konnten nicht geschrieben werden
# $count is how many messages; $files how many files.
words-written = { $count ->
    [0] Nichts wurde geändert und nichts geschrieben.
    [one] Ein Eintrag wurde geschrieben, in { $files ->
        [one] eine Datei
       *[other] { $files } Dateien
    }.
   *[other] { $count } Einträge wurden geschrieben, in { $files ->
        [one] eine Datei
       *[other] { $files } Dateien
    }.
}
words-result-title = Die geschriebenen Texte
words-conflicts = Seit das Projekt angelegt wurde, in den Dateien geändert und so gelassen, wie die Dateien es haben
words-refused = Nicht geschrieben, im Projekt zu berichtigen
# $detail says more: the variables it has and must have, the plural forms it lacks.
words-refused-fluent = er ist kein gutes Fluent: { $detail }
words-refused-variables = seine Variablen sind nicht die des Englischen: { $detail }
words-refused-reference = er verweist auf { $detail }, worauf das Englische nicht verweist
words-refused-plurals = seine Pluralformen sind nicht die der Sprache: { $detail }
words-refused-missing = das Englische hat keinen solchen Eintrag, oder sein Text wurde nicht geschrieben
words-refused-file = die Datei { $detail } ließe sich danach nicht lesen

# Putting the changed words to use at once, without a new version of
# Glaukopis (ADR 0035): they are written into the data directory and laid
# over the words Glaukopis came with.
words-use = Jetzt verwenden
words-using = Wird in Gebrauch genommen…
words-use-hint = Nimmt, was Sie geändert haben, sofort in Gebrauch, anstelle der Texte, die Glaukopis mitbringt, ohne eine neue Version. Die Fluent-Dateien werden dadurch nicht geschrieben.
words-use-failed = Die Texte konnten nicht in Gebrauch genommen werden
# $count is how many messages.
words-used = { $count ->
    [0] Nichts wurde geändert und nichts in Gebrauch genommen.
    [one] Ein Eintrag ist jetzt in Gebrauch.
   *[other] { $count } Einträge sind jetzt in Gebrauch.
}
words-used-title = Die in Gebrauch genommenen Texte
words-used-refused = Nicht in Gebrauch genommen, im Projekt zu berichtigen
# $languages are the names of the languages: "English, Norwegian Bokmål".
words-own-in-use = Texte, die Sie geändert haben, sind für { $languages } in Gebrauch, anstelle derer, die Glaukopis mitbringt.
words-own-remove = Wegnehmen
words-own-remove-title = Die Texte wegnehmen, die Sie geändert haben?
words-own-remove-message = Die Texte, die Sie für { $languages } in Gebrauch genommen haben, werden weggenommen, und die, die Glaukopis mitbringt, werden wieder verwendet. Die Projekte der Texte bleiben erhalten.
words-own-removed = Die Texte, die Glaukopis mitbringt, werden wieder verwendet.
words-own-remove-failed = Die Texte, die Sie geändert haben, konnten nicht weggenommen werden
