# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } a { $second }
core-library-three-names = { $first }, { $second } a { $third }
core-library-et-al = { $first } a kol.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (ed.)
    [few] { $names } (eds.)
   *[other] { $names } (eds.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = riadok { $line }: { $message }
core-library-line-sentence = Riadok { $line }: { $message }.
core-library-key-changed = kľúč „{ $from }“ bol zmenený na „{ $to }“
core-library-no-entry = Nie je tu žiadny záznam. Záznam sa začína znakom @ a svojím typom, ako @book{"{"}kľúč, …{"}"}.
core-library-many-entries = { $count ->
    [one] Je tu { $count } záznam; očakáva sa jeden.
    [few] Sú tu { $count } záznamy; očakáva sa jeden.
   *[other] Je tu { $count } záznamov; očakáva sa jeden.
}

## Changing a reference.

core-library-bad-key = „{ $key }“ nemožno použiť ako citačný kľúč.
core-library-key-letters = Citačný kľúč môže obsahovať len písmená, číslice a - _ : . Skúste „{ $key }“.
core-library-key-taken = Citačný kľúč „{ $key }“ sa už používa.
core-library-no-type = Záznam nemá typ publikácie.
core-library-not-a-type = „{ $kind }“ nie je typ publikácie.
core-library-merge-itself = Záznam nemožno zlúčiť so sebou samým.

## What was not found, shown after "not found: ".

core-library-the-reference = záznam
core-library-the-stored-file = uložený súbor { $path }
core-library-the-file = súbor { $path }
core-library-the-collection = zbierka
core-library-the-collection-to-put-in = zbierka, do ktorej sa má vložiť
core-library-the-collection-to-move-to = zbierka, do ktorej sa má presunúť

## Collections.

core-library-collection-needs-name = Zbierka potrebuje názov.
core-library-collection-exists = Zbierka s názvom „{ $name }“ tu už je.
core-library-collection-in-itself = Zbierku nemožno vložiť do nej samej.

## The files of references.

core-library-not-in-library = „{ $path }“ nie je cesta v knižnici
core-library-not-a-file = { $path } nie je súbor
