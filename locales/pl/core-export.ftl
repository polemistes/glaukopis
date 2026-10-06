# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Obrazu „{ $name }” nie ma na tym komputerze, więc został pominięty w dokumencie.
core-export-astray = { $count ->
    [one] Jeden odsyłacz w tekście wskazuje coś, czego nie ma w dokumencie. Jest składany jako [?].
    [few] { $count } odsyłacze w tekście wskazują to, czego nie ma w dokumencie. Są składane jako [?].
    [many] { $count } odsyłaczy w tekście wskazuje to, czego nie ma w dokumencie. Są składane jako [?].
   *[other] { $count } odsyłaczy w tekście wskazuje to, czego nie ma w dokumencie. Są składane jako [?].
}
core-export-latex-font = Czcionka { $font } nie jest zainstalowana. Dokument składany jest w Latin Modern, własnej czcionce systemu LaTeX.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] Jeden tekst dokumentu nie został przysłany i nie jest przechowywany.
    [few] { $count } teksty dokumentu nie zostały przysłane i nie są przechowywane.
    [many] { $count } tekstów dokumentu nie zostało przysłanych i nie jest przechowywanych.
   *[other] { $count } tekstów dokumentu nie zostało przysłanych i nie jest przechowywanych.
}
# Shown after "not found: ".
core-export-preview-document = dokument podglądu
core-export-reading-pdf = odczyt utworzonego pliku PDF
core-export-reading-made = odczyt utworzonego dokumentu

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = nie udało się odczytać dokumentu wzorcowego: { $error }
core-export-pattern-lacks = w dokumencie wzorcowym brakuje { $name }
core-export-pattern-reading = odczyt dokumentu wzorcowego
core-export-pattern-writing = zapis dokumentu wzorcowego

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Wzór urywa się przed końcem.
# The command is as it was written: \frac.
core-export-formula-unknown = Polecenie { $command } nie jest znane.
core-export-formula-unexpected = W tym miejscu nie oczekiwano { $what }.
core-export-formula-unreadable = Nie udało się odczytać wzoru.
core-export-formula-too-long = Wzór jest za długi.

## Reference styles.

core-export-style-bad-id = „{ $id }” nie może być identyfikatorem stylu
core-export-not-a-style = To nie jest styl: { $error }.
core-export-not-a-style-begin = To nie jest styl: nie zaczyna się od <style>.
core-export-dependent-style = Ten styl tylko wskazuje inny styl, z którego bierze swoją postać. Pobierz zamiast niego tamten, po nazwie.
core-export-style-unreadable = Nie udało się odczytać zapisanego stylu.
core-export-style-needs-name = Styl musi mieć nazwę.
core-export-style-own-only = Usunąć można tylko własne style.
# Shown after "not found: ".
core-export-the-reference-style = styl cytowania „{ $id }”
core-export-any-reference-style = jakikolwiek styl cytowania
core-export-the-style = styl „{ $id }”

## Document formats.

core-export-format-bad-id = „{ $id }” nie może być identyfikatorem formatu
core-export-format-needs-name = Format musi mieć nazwę.
core-export-format-own-only = Usunąć można tylko własne formaty.
core-export-not-a-length = „{ $length }” nie jest długością
# Shown after "not found: ".
core-export-the-format = format „{ $id }”
