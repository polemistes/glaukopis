# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } in { $second }
core-library-three-names = { $first }, { $second } in { $third }
core-library-et-al = { $first } idr.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (ur.)
    [two] { $names } (ur.)
    [few] { $names } (ur.)
   *[other] { $names } (ur.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = vrstica { $line }: { $message }
core-library-line-sentence = Vrstica { $line }: { $message }.
core-library-key-changed = ključ »{ $from }« je bil spremenjen v »{ $to }«
core-library-no-entry = Tu ni vnosa. Vnos se začne z @ in svojim tipom, kot @book{"{"}ključ, …{"}"}.
core-library-many-entries = { $count ->
    [one] Tu je { $count } vnos; pričakovan je en.
    [two] Tu sta { $count } vnosa; pričakovan je en.
    [few] Tu so { $count } vnosi; pričakovan je en.
   *[other] Tu je { $count } vnosov; pričakovan je en.
}

## Changing a reference.

core-library-bad-key = »{ $key }« ni mogoče uporabiti kot ključ navedbe.
core-library-key-letters = Ključ navedbe sme vsebovati le črke, števke in - _ : . Poskusite »{ $key }«.
core-library-key-taken = Ključ navedbe »{ $key }« je že v rabi.
core-library-no-type = Vir nima tipa publikacije.
core-library-not-a-type = »{ $kind }« ni tip publikacije.
core-library-merge-itself = Vnosa ni mogoče združiti s samim seboj.

## What was not found, shown after "not found: ".

core-library-the-reference = vir
core-library-the-stored-file = shranjena datoteka { $path }
core-library-the-file = datoteka { $path }
core-library-the-collection = zbirka
core-library-the-collection-to-put-in = zbirka, v katero naj gre
core-library-the-collection-to-move-to = zbirka, v katero naj se premakne

## Collections.

core-library-collection-needs-name = Zbirka potrebuje ime.
core-library-collection-exists = Tu je že zbirka z imenom »{ $name }«.
core-library-collection-in-itself = Zbirke ni mogoče postaviti vase.

## The files of references.

core-library-not-in-library = »{ $path }« ni pot znotraj knjižnice
core-library-not-a-file = { $path } ni datoteka
