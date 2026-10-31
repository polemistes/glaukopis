# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } og { $second }
core-library-three-names = { $first }, { $second } og { $third }
core-library-et-al = { $first } m.fl.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (red.)
   *[other] { $names } (red.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = linje { $line }: { $message }
core-library-line-sentence = Linje { $line }: { $message }.
core-library-key-changed = nøglen »{ $from }« blev ændret til »{ $to }«
core-library-no-entry = Der er ingen post her. En post begynder med @ og sin type, som i @book{"{"}nøgle, …{"}"}.
core-library-many-entries = { $count ->
    [one] Der er én post her; én var ventet.
   *[other] Der er { $count } poster her; én var ventet.
}

## Changing a reference.

core-library-bad-key = »{ $key }« kan ikke bruges som nøgle.
core-library-key-letters = En nøgle må kun indeholde bogstaver, cifre og - _ : . Prøv »{ $key }«.
core-library-key-taken = Nøglen »{ $key }« er allerede i brug.
core-library-no-type = Referencen har ingen publikationstype.
core-library-not-a-type = »{ $kind }« er ikke en publikationstype.
core-library-merge-itself = En post kan ikke slås sammen med sig selv.

## What was not found, shown after "not found: ".

core-library-the-reference = referencen
core-library-the-stored-file = den gemte fil { $path }
core-library-the-file = filen { $path }
core-library-the-collection = samlingen
core-library-the-collection-to-put-in = den samling, den skulle lægges i
core-library-the-collection-to-move-to = den samling, den skulle flyttes til

## Collections.

core-library-collection-needs-name = En samling skal have et navn.
core-library-collection-exists = Der findes allerede en samling her med navnet »{ $name }«.
core-library-collection-in-itself = En samling kan ikke lægges ind i sig selv.

## The files of references.

core-library-not-in-library = »{ $path }« er ikke en sti i biblioteket
core-library-not-a-file = { $path } er ikke en fil

## The files of the library and their folders.

core-library-the-file-of-library = filen i biblioteket
core-library-the-folder = mappen
core-library-needs-name = Der skal gives et navn.
core-library-name-too-long = Det navn er for langt.
core-library-folder-in-itself = En mappe kan ikke lægges ind i sig selv.
# Why a file was not given to the reference chosen for it, when files are gone through.
core-library-assign-file-gone = En fil blev ikke knyttet til sin reference: den er ikke længere blandt bibliotekets filer.
core-library-assign-reference-gone = »{ $name }« blev ikke knyttet til sin reference: referencen er ikke længere i biblioteket.
core-library-assign-stored-gone = »{ $name }« blev ikke knyttet til sin reference: filen er ikke længere der, hvor biblioteket har den, { $path }.
# The record of the files could not be read; it was put aside under another name.
core-library-files-unreadable = Fortegnelsen over bibliotekets filer kunne ikke læses og blev lagt til side som { $path }: { $message }
# The library file has bytes that are not UTF-8, as an editor that saves in Latin-1 writes them; $aside is the name of the copy kept in the same folder.
core-library-not-utf8 = { $path } har bogstaver, der ikke er i UTF-8, som et redigeringsprogram, der gemmer i en anden tegnkodning, skriver dem. De læses som � og bliver skrevet sådan; filen, som den var, er gemt som { $aside } i samme mappe.

# One place for files (ADR 0070).
# A file of a kind that has no thumbnail, or one that could not be read for it; the interface shows the kind's icon instead.
core-library-no-small = denne type fil vises ikke som miniature
# The folder the images of the old store of pictures are put in, at the top of the files of the library.
core-library-images-folder = Billeder
# An image of the old store of pictures whose file was not there when it was taken into the library.
core-library-picture-missing = »{ $name }« blev ikke taget ind i biblioteket: dets fil mangler.
# An image of the old store of pictures whose file does not hold what its name says.
core-library-picture-not-itself = »{ $name }« blev ikke taget ind i biblioteket: dets fil er ikke det billede, det var.
# Bookmarks in a file (sources in tabs, 2026-10-29).
core-library-too-many-bookmarks = En fil kan højst have { $most } bogmærker.
core-library-bookmark-no-place = Et bogmærke skal stå på en side i filen.
