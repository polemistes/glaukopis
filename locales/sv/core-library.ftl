# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } och { $second }
core-library-three-names = { $first }, { $second } och { $third }
core-library-et-al = { $first } m.fl.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (red.)
   *[other] { $names } (red.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = rad { $line }: { $message }
core-library-line-sentence = Rad { $line }: { $message }.
core-library-key-changed = nyckeln ”{ $from }” ändrades till ”{ $to }”
core-library-no-entry = Det finns ingen post här. En post börjar med @ och sin typ, som i @book{"{"}nyckel, …{"}"}.
core-library-many-entries = Det finns { $count } poster här; en väntas.

## Changing a reference.

core-library-bad-key = ”{ $key }” kan inte användas som hänvisningsnyckel.
core-library-key-letters = En hänvisningsnyckel får bara innehålla bokstäver, siffror och - _ : . Pröva ”{ $key }”.
core-library-key-taken = Hänvisningsnyckeln ”{ $key }” används redan.
core-library-no-type = Referensen har ingen publikationstyp.
core-library-not-a-type = ”{ $kind }” är inte en publikationstyp.
core-library-merge-itself = En post kan inte slås ihop med sig själv.

## What was not found, shown after "not found: ".

core-library-the-reference = referensen
core-library-the-stored-file = den lagrade filen { $path }
core-library-the-file = filen { $path }
core-library-the-collection = samlingen
core-library-the-collection-to-put-in = samlingen att lägga den i
core-library-the-collection-to-move-to = samlingen att flytta den till

## Collections.

core-library-collection-needs-name = En samling behöver ett namn.
core-library-collection-exists = Det finns redan en samling med namnet ”{ $name }” här.
core-library-collection-in-itself = En samling kan inte läggas inuti sig själv.

## The files of references.

core-library-not-in-library = ”{ $path }” är inte en sökväg inom biblioteket
core-library-not-a-file = { $path } är inte en fil
