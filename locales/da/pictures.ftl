# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Billeder
pictures-all = Alle billeder
pictures-picture = Billede
pictures-search-placeholder = Søg i billederne
pictures-clear-search = Ryd søgningen
pictures-count = { $count ->
    [one] { $count } billede
   *[other] { $count } billeder
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } af { $count ->
    [one] { $count } billede
   *[other] { $count } billeder
}
pictures-add = Tilføj billeder…
pictures-empty = Billedlageret er tomt
pictures-empty-text = Billeder, du tilføjer her, kan bruges i alle dine projekter, og et billede, der sættes ind i en tekst, gemmes her. Tilføj nogle, eller slip dem på dette vindue.
pictures-nothing-found = Intet fundet
pictures-nothing-found-text = Intet billede indeholder alle disse ord.
# What a picture that has no name is called.
pictures-unnamed = Et billede
pictures-with-notes = Med notater

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Tilføj billeder
pictures-files = Billeder
pictures-taken-in = { $count ->
    [one] »{ $name }« er i billedlageret
   *[other] { $count } billeder er i billedlageret
}
pictures-remove-title = Fjern »{ $name }« fra billedlageret?
pictures-remove-unused = Intet projekt bruger billedet. Det, der er sagt om det her, og dine notater om det fjernes sammen med det.
pictures-remove-used = { $count ->
    [one] { $count } projekt bruger billedet. Dets figurer bliver stående uden billedet. Det, der er sagt om det her, og dine notater om det fjernes sammen med det.
   *[other] { $count } projekter bruger billedet. Deres figurer bliver stående uden billedet. Det, der er sagt om det her, og dine notater om det fjernes sammen med det.
}
pictures-no-backend = Der er ingen backend.

## One picture

pictures-name = Navn
pictures-name-placeholder = Hvad billedet hedder
pictures-caption = Billedtekst
pictures-caption-placeholder = Det, der siges om billedet
pictures-caption-hint = Figurer lavet med billedet begynder med disse ord. Det, der siges om en figur, kan ændres dér uden at ændre dette.
pictures-italic = Kursiv
pictures-small-caps = Kapitæler
# What the picture shows, in words, for those who do not see it.
pictures-alt = Viser
pictures-alt-placeholder = Med ord, for dem, der ikke kan se det
pictures-absent = Billedet er ikke på denne computer. Det bruges i projektet og vises, når det er kommet fra den, der satte det ind.
pictures-notes = Notater
pictures-note-project = I dette projekt
pictures-note-project-placeholder = Hvad du får ud af det, til dette arbejde
pictures-note-project-hint = Det, der skrives her, er hos alle, der har projektet.
pictures-note-for-all = Gem det for alle projekter
pictures-note-write-for-all = Skriv for alle projekter
pictures-note-all = I alle projekter
pictures-note-all-placeholder = Hvad du får ud af det, hvor end du bruger det
pictures-note-all-hint = Gemt med billedet i billedlageret, på denne computer.
pictures-note-placeholder = Hvad du får ud af det. Til dig selv: det er ikke en del af noget dokument.
pictures-note-label = Dine notater om dette billede
pictures-file = Filen
pictures-kind = Type
pictures-kind-svg = SVG, en tegning
pictures-dimensions-label = Bredde og højde
pictures-dimensions = { $width } × { $height } punkter
pictures-size = Størrelse
# When the picture was taken into the store.
pictures-added = Tilføjet
pictures-used-in = Brugt i
pictures-this-project = Dette projekt
# A map that has no name.
pictures-untitled = Uden titel
pictures-unused = Intet projekt bruger billedet.
pictures-remove = Fjern fra billedlageret
