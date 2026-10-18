# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = Popis balíčku nelze přečíst: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = „{ $file }“ nelze přečíst jako soubor ZIP: { $message }
core-packages-too-large = „{ $file }“ je větší, než smí být jazykový balíček.
core-packages-nothing = V tom, co bylo zvoleno, není slovník pravopisu (soubory .aff a .dic) ani data pro Tesseract (soubor .traineddata).
# $name is the name a package would give its files.
core-packages-bad-name = „{ $name }“ nemůže být názvem jazyka: název se skládá z písmen, číslic, _ a - a začíná jazykem, například cs_CZ nebo ces.
core-packages-empty = „{ $file }“ je prázdný.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = { $url } nelze stáhnout: { $message }
core-packages-fetch-status = { $url } nelze stáhnout: server odpověděl { $status }.
# $server is the address of the server, or the folder.
core-packages-index = Co nabízí { $server }, nelze přečíst: { $message }
core-packages-checksum = „{ $file }“ není tím, čím podle serveru měl být. Nic nebylo importováno; zkuste to později znovu.
