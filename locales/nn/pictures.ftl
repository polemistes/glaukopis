# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Bilete
pictures-all = Alle bilete
pictures-picture = Bilete
pictures-search-placeholder = Søk i bileta
pictures-clear-search = Tøm søket
pictures-count = { $count ->
    [one] { $count } bilete
   *[other] { $count } bilete
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } av { $count ->
    [one] { $count } bilete
   *[other] { $count } bilete
}
pictures-add = Legg til bilete …
pictures-empty = Biletlageret er tomt
pictures-empty-text = Bilete du legg til her, kan brukast i alle prosjekta dine, og eit bilete som blir sett inn i ein tekst, blir teke vare på her. Legg til nokre, eller slepp dei på dette vindauget.
pictures-nothing-found = Ingenting funne
pictures-nothing-found-text = Ingen bilete har alle desse orda.
# What a picture that has no name is called.
pictures-unnamed = Eit bilete
pictures-with-notes = Med notat

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Legg til bilete
pictures-files = Bilete
pictures-taken-in = { $count ->
    [one] «{ $name }» er i biletlageret
   *[other] { $count } bilete er i biletlageret
}
pictures-remove-title = Fjerne «{ $name }» frå biletlageret?
pictures-remove-unused = Ingen prosjekt bruker biletet. Det som er sagt om det her, og notata dine om det, blir fjerna saman med det.
pictures-remove-used = { $count ->
    [one] { $count } prosjekt bruker biletet. Figurane i det blir ståande utan biletet. Det som er sagt om det her, og notata dine om det, blir fjerna saman med det.
   *[other] { $count } prosjekt bruker biletet. Figurane i dei blir ståande utan biletet. Det som er sagt om det her, og notata dine om det, blir fjerna saman med det.
}
pictures-no-backend = Det er ingen backend.

## One picture

pictures-name = Namn
pictures-name-placeholder = Kva biletet heiter
pictures-caption = Bilettekst
pictures-caption-placeholder = Det som blir sagt om biletet
pictures-caption-hint = Figurar som blir laga med biletet, byrjar med desse orda. Biletteksten til ein figur kan endrast der utan at denne blir endra.
pictures-italic = Kursiv
pictures-small-caps = Kapitélar
# What the picture shows, in words, for those who do not see it.
pictures-alt = Viser
pictures-alt-placeholder = Med ord, for dei som ikkje kan sjå det
pictures-absent = Biletet er ikkje på denne datamaskina. Det blir brukt i prosjektet, og blir vist når det har kome frå den som sette det inn.
pictures-notes = Notat
pictures-note-project = I dette prosjektet
pictures-note-project-placeholder = Kva du tenkjer om det, for dette arbeidet
pictures-note-project-hint = Alle som har prosjektet, ser det som blir skrive her.
pictures-note-for-all = Lagre det for alle prosjekt
pictures-note-write-for-all = Skriv for alle prosjekt
pictures-note-all = I alle prosjekt
pictures-note-all-placeholder = Kva du tenkjer om det, kvar du enn bruker det
pictures-note-all-hint = Blir lagra med biletet i biletlageret, på denne datamaskina.
pictures-note-placeholder = Kva du tenkjer om det. For deg sjølv: det er ikkje del av noko dokument.
pictures-note-label = Notata dine om dette biletet
pictures-file = Fila
pictures-kind = Type
pictures-kind-svg = SVG, ei teikning
pictures-dimensions-label = Breidd og høgd
pictures-dimensions = { $width } × { $height } punkt
pictures-size = Storleik
# When the picture was taken into the store.
pictures-added = Lagt til
pictures-used-in = Brukt i
pictures-this-project = Dette prosjektet
# A map that has no name.
pictures-untitled = Utan namn
pictures-unused = Ingen prosjekt bruker biletet.
pictures-remove = Fjern frå biletlageret
