# Bildelageret: alle bildene i programmet, og ett av dem.

pictures-title = Bilder
pictures-all = Alle bilder
pictures-picture = Bilde
pictures-search-placeholder = Søk i bildene
pictures-clear-search = Tøm søket
pictures-count = { $count ->
    [one] { $count } bilde
   *[other] { $count } bilder
}
pictures-shown = { $shown } av { $count ->
    [one] { $count } bilde
   *[other] { $count } bilder
}
pictures-add = Legg til bilder …
pictures-empty = Bildelageret er tomt
pictures-empty-text = Bilder du legger til her, kan brukes i alle prosjektene dine, og et bilde som settes inn i en tekst, tas vare på her. Legg til noen, eller slipp dem på dette vinduet.
pictures-nothing-found = Ingenting funnet
pictures-nothing-found-text = Ingen bilder har alle disse ordene.
pictures-unnamed = Et bilde
pictures-with-notes = Med notater

## Å ta inn bilder, og å fjerne dem

pictures-add-title = Legg til bilder
pictures-files = Bilder
pictures-taken-in = { $count ->
    [one] «{ $name }» er i bildelageret
   *[other] { $count } bilder er i bildelageret
}
pictures-remove-title = Fjerne «{ $name }» fra bildelageret?
pictures-remove-unused = Ingen prosjekter bruker bildet. Det som er sagt om det her, og notatene dine om det, fjernes sammen med det.
pictures-remove-used = { $count ->
    [one] { $count } prosjekt bruker bildet. Figurene i det blir stående uten bildet. Det som er sagt om det her, og notatene dine om det, fjernes sammen med det.
   *[other] { $count } prosjekter bruker bildet. Figurene i dem blir stående uten bildet. Det som er sagt om det her, og notatene dine om det, fjernes sammen med det.
}
pictures-no-backend = Det er ingen backend.

## Ett bilde

pictures-name = Navn
pictures-name-placeholder = Hva bildet heter
pictures-caption = Bildetekst
pictures-caption-placeholder = Det som sies om bildet
pictures-caption-hint = Figurer som lages med bildet, begynner med disse ordene. Bildeteksten til en figur kan endres der uten at denne endres.
pictures-italic = Kursiv
pictures-small-caps = Kapitéler
pictures-alt = Viser
pictures-alt-placeholder = Med ord, for dem som ikke kan se det
pictures-absent = Bildet er ikke på denne datamaskinen. Det brukes i prosjektet, og vises når det har kommet fra den som satte det inn.
pictures-notes = Notater
pictures-note-project = I dette prosjektet
pictures-note-project-placeholder = Hva du tenker om det, for dette arbeidet
pictures-note-project-hint = Alle som har prosjektet, ser det som skrives her.
pictures-note-for-all = Lagre det for alle prosjekter
pictures-note-write-for-all = Skriv for alle prosjekter
pictures-note-all = I alle prosjekter
pictures-note-all-placeholder = Hva du tenker om det, uansett hvor du bruker det
pictures-note-all-hint = Lagres med bildet i bildelageret, på denne datamaskinen.
pictures-note-placeholder = Hva du tenker om det. For deg selv: det er ikke del av noe dokument.
pictures-note-label = Notatene dine om dette bildet
pictures-file = Filen
pictures-kind = Type
pictures-kind-svg = SVG, en tegning
pictures-dimensions-label = Bredde og høyde
pictures-dimensions = { $width } × { $height } punkter
pictures-size = Størrelse
pictures-added = Lagt til
pictures-used-in = Brukt i
pictures-this-project = Dette prosjektet
pictures-untitled = Uten navn
pictures-unused = Ingen prosjekter bruker bildet.
pictures-remove = Fjern fra bildelageret
