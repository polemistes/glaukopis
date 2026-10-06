# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } i { $second }
core-library-three-names = { $first }, { $second } i { $third }
core-library-et-al = { $first } i dr.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (ur.)
    [few] { $names } (ur.)
   *[other] { $names } (ur.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = red { $line }: { $message }
core-library-line-sentence = Red { $line }: { $message }.
core-library-key-changed = ključ „{ $from }“ promijenjen je u „{ $to }“
core-library-no-entry = Ovdje nema unosa. Unos počinje znakom @ i svojom vrstom, kao @book{"{"}ključ, …{"}"}.
core-library-many-entries = { $count ->
    [one] Ovdje je { $count } unos; očekuje se jedan.
    [few] Ovdje su { $count } unosa; očekuje se jedan.
   *[other] Ovdje je { $count } unosa; očekuje se jedan.
}

## Changing a reference.

core-library-bad-key = „{ $key }“ se ne može koristiti kao ključ citata.
core-library-key-letters = Ključ citata može sadržavati samo slova, cifre i - _ : . Pokušajte s „{ $key }“.
core-library-key-taken = Ključ citata „{ $key }“ se već koristi.
core-library-no-type = Referenca nema vrstu publikacije.
core-library-not-a-type = „{ $kind }“ nije vrsta publikacije.
core-library-merge-itself = Unos se ne može spojiti sam sa sobom.

## What was not found, shown after "not found: ".

core-library-the-reference = referenca
core-library-the-stored-file = spremljena datoteka { $path }
core-library-the-file = datoteka { $path }
core-library-the-collection = zbirka
core-library-the-collection-to-put-in = zbirka u koju treba staviti
core-library-the-collection-to-move-to = zbirka u koju treba premjestiti

## Collections.

core-library-collection-needs-name = Zbirci treba naziv.
core-library-collection-exists = Ovdje već postoji zbirka pod nazivom „{ $name }“.
core-library-collection-in-itself = Zbirka se ne može staviti u samu sebe.

## The files of references.

core-library-not-in-library = „{ $path }“ nije putanja unutar biblioteke
core-library-not-a-file = { $path } nije datoteka
