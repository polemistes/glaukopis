# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } og { $second }
core-library-three-names = { $first }, { $second } og { $third }
core-library-et-al = { $first } mfl.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (red.)
   *[other] { $names } (red.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = linje { $line }: { $message }
core-library-line-sentence = Linje { $line }: { $message }.
core-library-key-changed = nøkkelen «{ $from }» vart endra til «{ $to }»
core-library-no-entry = Her er det inga oppføring. Ei oppføring byrjar med @ og typen, som i @book{"{"}nøkkel, …{"}"}.
core-library-many-entries = { $count ->
    [one] Her er det éi oppføring; éi var venta.
   *[other] Her er det { $count } oppføringar; éi var venta.
}

## Changing a reference.

core-library-bad-key = «{ $key }» kan ikkje brukast som nøkkel.
core-library-key-letters = Ein nøkkel kan berre innehalde bokstavar, siffer og - _ : . Prøv «{ $key }».
core-library-key-taken = Nøkkelen «{ $key }» er allereie i bruk.
core-library-no-type = Referansen har ingen publikasjonstype.
core-library-not-a-type = «{ $kind }» er ikkje ein publikasjonstype.
core-library-merge-itself = Ei oppføring kan ikkje slåast saman med seg sjølv.

## What was not found, shown after "not found: ".

core-library-the-reference = referansen
core-library-the-stored-file = den lagra fila { $path }
core-library-the-file = fila { $path }
core-library-the-collection = samlinga
core-library-the-collection-to-put-in = samlinga den skulle leggjast i
core-library-the-collection-to-move-to = samlinga den skulle flyttast til

## Collections.

core-library-collection-needs-name = Ei samling må ha eit namn.
core-library-collection-exists = Det finst allereie ei samling som heiter «{ $name }» her.
core-library-collection-in-itself = Ei samling kan ikkje leggjast inni seg sjølv.

## The files of references.

core-library-not-in-library = «{ $path }» er ikkje ein sti i biblioteket
core-library-not-a-file = { $path } er ikkje ei fil

## The files of the library and their folders.

core-library-the-file-of-library = fila i biblioteket
core-library-the-folder = mappa
core-library-needs-name = Det trengst eit namn.
core-library-name-too-long = Det namnet er for langt.
core-library-folder-in-itself = Ei mappe kan ikkje leggjast i seg sjølv.
# Why a file was not given to the reference chosen for it, when files are gone through.
core-library-assign-file-gone = Ei fil vart ikkje gitt til referansen sin: den er ikkje lenger mellom filene i biblioteket.
core-library-assign-reference-gone = «{ $name }» vart ikkje gitt til referansen sin: referansen er ikkje lenger i biblioteket.
core-library-assign-stored-gone = «{ $name }» vart ikkje gitt til referansen sin: fila er ikkje lenger der biblioteket har den, { $path }.
# The record of the files could not be read; it was put aside under another name.
core-library-files-unreadable = Oversynet over filene i biblioteket kunne ikkje lesast, og vart lagt til side som { $path }: { $message }
# The library file has bytes that are not UTF-8, as an editor that saves in Latin-1 writes them; $aside is the name of the copy kept in the same folder.
core-library-not-utf8 = { $path } har bokstavar som ikkje er i UTF-8, slik eit redigeringsprogram som lagrar i ei anna teiknkoding, skriv dei. Dei blir lesne som �, og blir skrivne slik; fila slik den var, er teken vare på som { $aside } i same mappe.
