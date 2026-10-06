# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } a { $second }
core-library-three-names = { $first }, { $second } a { $third }
core-library-et-al = { $first } et al.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (ed.)
    [few] { $names } (eds.)
   *[other] { $names } (eds.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = řádek { $line }: { $message }
core-library-line-sentence = Řádek { $line }: { $message }.
core-library-key-changed = klíč „{ $from }“ byl změněn na „{ $to }“
core-library-no-entry = Není tu žádný záznam. Záznam začíná znakem @ a svým typem, například @book{"{"}klíč, …{"}"}.
core-library-many-entries = { $count ->
    [one] Je tu { $count } záznam; očekává se jeden.
    [few] Jsou tu { $count } záznamy; očekává se jeden.
   *[other] Je tu { $count } záznamů; očekává se jeden.
}

## Changing a reference.

core-library-bad-key = „{ $key }“ nelze použít jako citační klíč.
core-library-key-letters = Citační klíč smí obsahovat jen písmena, číslice a - _ : . Zkuste „{ $key }“.
core-library-key-taken = Citační klíč „{ $key }“ se už používá.
core-library-no-type = Záznam nemá typ publikace.
core-library-not-a-type = „{ $kind }“ není typ publikace.
core-library-merge-itself = Záznam nelze sloučit sám se sebou.

## What was not found, shown after "not found: ".

core-library-the-reference = záznam
core-library-the-stored-file = uložený soubor { $path }
core-library-the-file = soubor { $path }
core-library-the-collection = sbírka
core-library-the-collection-to-put-in = sbírka, do níž má být vložen
core-library-the-collection-to-move-to = sbírka, do níž má být přesunut

## Collections.

core-library-collection-needs-name = Sbírka potřebuje název.
core-library-collection-exists = Sbírka s názvem „{ $name }“ tu už je.
core-library-collection-in-itself = Sbírku nelze vložit do ní samé.

## The files of references.

core-library-not-in-library = „{ $path }“ není cesta uvnitř knihovny
core-library-not-a-file = { $path } není soubor
