# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } и { $second }
core-library-three-names = { $first }, { $second } и { $third }
core-library-et-al = { $first } и др.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (ур.)
    [few] { $names } (ур.)
   *[other] { $names } (ур.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = ред { $line }: { $message }
core-library-line-sentence = Ред { $line }: { $message }.
core-library-key-changed = кључ „{ $from }“ је промењен у „{ $to }“
core-library-no-entry = Овде нема уноса. Унос почиње знаком @ и својим типом, као @book{"{"}кључ, …{"}"}.
core-library-many-entries = { $count ->
    [one] Овде је { $count } унос; очекује се један.
    [few] Овде су { $count } уноса; очекује се један.
   *[other] Овде је { $count } уноса; очекује се један.
}

## Changing a reference.

core-library-bad-key = „{ $key }“ не може бити кључ цитата.
core-library-key-letters = Кључ цитата сме да садржи само слова, цифре и - _ : . Покушајте „{ $key }“.
core-library-key-taken = Кључ цитата „{ $key }“ је већ у употреби.
core-library-no-type = Референца нема тип публикације.
core-library-not-a-type = „{ $kind }“ није тип публикације.
core-library-merge-itself = Унос не може да се споји сам са собом.

## What was not found, shown after "not found: ".

core-library-the-reference = референца
core-library-the-stored-file = смештена датотека { $path }
core-library-the-file = датотека { $path }
core-library-the-collection = збирка
core-library-the-collection-to-put-in = збирка у коју би се ставила
core-library-the-collection-to-move-to = збирка у коју би се преместила

## Collections.

core-library-collection-needs-name = Збирци треба назив.
core-library-collection-exists = Овде већ постоји збирка под називом „{ $name }“.
core-library-collection-in-itself = Збирка не може да се стави у саму себе.

## The files of references.

core-library-not-in-library = „{ $path }“ није путања унутар библиотеке
core-library-not-a-file = { $path } није датотека
