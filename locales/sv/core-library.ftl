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

## The files of the library and their folders.

core-library-the-file-of-library = filen i biblioteket
core-library-the-folder = mappen
core-library-needs-name = Ett namn behövs.
core-library-name-too-long = Det namnet är för långt.
core-library-folder-in-itself = En mapp kan inte läggas i sig själv.
# Why a file was not given to the reference chosen for it, when files are gone through.
core-library-assign-file-gone = En fil kopplades inte till sin referens: den finns inte längre bland bibliotekets filer.
core-library-assign-reference-gone = ”{ $name }” kopplades inte till sin referens: referensen finns inte längre i biblioteket.
core-library-assign-stored-gone = ”{ $name }” kopplades inte till sin referens: filen finns inte längre där biblioteket förvarar den, { $path }.
# The record of the files could not be read; it was put aside under another name.
core-library-files-unreadable = Förteckningen över bibliotekets filer kunde inte läsas, och lades undan som { $path }: { $message }
# The library file has bytes that are not UTF-8, as an editor that saves in Latin-1 writes them; $aside is the name of the copy kept in the same folder.
core-library-not-utf8 = { $path } har bokstäver som inte är i UTF-8, så som en redigerare som sparar i en annan teckenkodning skriver dem. De läses som �, och kommer att skrivas så; filen som den var sparas som { $aside } i samma mapp.

# One place for files (ADR 0070).
# A file of a kind that has no thumbnail, or one that could not be read for it; the interface shows the kind's icon instead.
core-library-no-small = det här slaget av fil visas inte i miniatyr
# The folder the images of the old store of pictures are put in, at the top of the files of the library.
core-library-images-folder = Bilder
# An image of the old store of pictures whose file was not there when it was taken into the library.
core-library-picture-missing = ”{ $name }” togs inte in i biblioteket: dess fil saknas.
# An image of the old store of pictures whose file does not hold what its name says.
core-library-picture-not-itself = ”{ $name }” togs inte in i biblioteket: dess fil är inte den bild den var.
# Bookmarks in a file (sources in tabs, 2026-10-29).
core-library-too-many-bookmarks = En fil kan ha högst { $most } bokmärken.
core-library-bookmark-no-place = Ett bokmärke måste stå på en sida i filen.
