# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = Nie da się odczytać manifestu pakietu: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = Nie da się odczytać „{ $file }” jako pliku zip: { $message }
core-packages-too-large = „{ $file }” jest większy, niż może być pakiet językowy.
core-packages-nothing = W tym, co wybrano, nie ma słownika pisowni (plików .aff i .dic) ani danych dla programu Tesseract (pliku .traineddata).
# $name is the name a package would give its files.
core-packages-bad-name = „{ $name }” nie może być nazwą języka: nazwa składa się z liter, cyfr, _ i - i zaczyna się od języka, jak nb_NO albo nor.
core-packages-empty = „{ $file }” jest pusty.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = Nie udało się pobrać { $url }: { $message }
core-packages-fetch-status = Nie udało się pobrać { $url }: serwer odpowiedział { $status }.
# $server is the address of the server, or the folder.
core-packages-index = Nie da się odczytać tego, co oferuje { $server }: { $message }
core-packages-checksum = „{ $file }” nie jest tym, czym miał być według serwera. Niczego nie zaimportowano; spróbuj ponownie później.
