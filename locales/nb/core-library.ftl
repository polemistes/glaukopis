# Det kjernen sier om referansebiblioteket, på bokmål.
# Se locales/README.md.

## Forfatterne av en referanse, slik listene viser dem.

core-library-two-names = { $first } og { $second }
core-library-three-names = { $first }, { $second } og { $third }
core-library-et-al = { $first } mfl.
core-library-edited = { $count ->
    [one] { $names } (red.)
   *[other] { $names } (red.)
}

## Å lese biblioteket, og en referanse slik den skrives.

core-library-line = linje { $line }: { $message }
core-library-line-sentence = Linje { $line }: { $message }.
core-library-key-changed = nøkkelen «{ $from }» ble endret til «{ $to }»
core-library-no-entry = Her er det ingen oppføring. En oppføring begynner med @ og typen, som i @book{"{"}nøkkel, …{"}"}.
core-library-many-entries = { $count ->
    [one] Her er det én oppføring; én var ventet.
   *[other] Her er det { $count } oppføringer; én var ventet.
}

## Å endre en referanse.

core-library-bad-key = «{ $key }» kan ikke brukes som nøkkel.
core-library-key-letters = En nøkkel kan bare inneholde bokstaver, sifre og - _ : . Prøv «{ $key }».
core-library-key-taken = Nøkkelen «{ $key }» er allerede i bruk.
core-library-no-type = Referansen har ingen publikasjonstype.
core-library-not-a-type = «{ $kind }» er ikke en publikasjonstype.
core-library-merge-itself = En oppføring kan ikke slås sammen med seg selv.

## Det som ikke ble funnet, vist etter «ikke funnet: ».

core-library-the-reference = referansen
core-library-the-stored-file = den lagrede filen { $path }
core-library-the-file = filen { $path }
core-library-the-collection = samlingen
core-library-the-collection-to-put-in = samlingen den skulle legges i
core-library-the-collection-to-move-to = samlingen den skulle flyttes til

## Samlinger.

core-library-collection-needs-name = En samling må ha et navn.
core-library-collection-exists = Det finnes allerede en samling som heter «{ $name }» her.
core-library-collection-in-itself = En samling kan ikke legges inni seg selv.

## Filene til referansene.

core-library-not-in-library = «{ $path }» er ikke en sti i biblioteket
core-library-not-a-file = { $path } er ikke en fil

## Filene i biblioteket og mappene deres.

core-library-the-file-of-library = filen i biblioteket
core-library-the-folder = mappen
core-library-needs-name = Et navn trengs.
core-library-name-too-long = Det navnet er for langt.
core-library-folder-in-itself = En mappe kan ikke legges i seg selv.
core-library-assign-file-gone = En fil ble ikke gitt til referansen sin: den er ikke lenger blant filene i biblioteket.
core-library-assign-reference-gone = «{ $name }» ble ikke gitt til referansen sin: referansen er ikke lenger i biblioteket.
core-library-assign-stored-gone = «{ $name }» ble ikke gitt til referansen sin: filen er ikke lenger der biblioteket har den, { $path }.
core-library-files-unreadable = Oversikten over filene i biblioteket kunne ikke leses, og ble lagt til side som { $path }: { $message }
core-library-not-utf8 = { $path } har bokstaver som ikke er i UTF-8, slik et redigeringsprogram som lagrer i en annen tegnkoding skriver dem. De leses som �, og blir skrevet slik; filen slik den var, er tatt vare på som { $aside } i samme mappe.

# Ett sted for filer (ADR 0070).
core-library-no-small = denne filtypen vises ikke i liten størrelse
core-library-images-folder = Bilder
core-library-picture-missing = «{ $name }» ble ikke tatt inn i biblioteket: filen mangler.
core-library-picture-not-itself = «{ $name }» ble ikke tatt inn i biblioteket: filen er ikke bildet den var.
