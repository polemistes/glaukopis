# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Afbeeldingen
pictures-all = Alle afbeeldingen
pictures-picture = Afbeelding
pictures-search-placeholder = In de afbeeldingen zoeken
pictures-clear-search = De zoekopdracht wissen
pictures-count = { $count ->
    [one] { $count } afbeelding
   *[other] { $count } afbeeldingen
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } van { $count ->
    [one] { $count } afbeelding
   *[other] { $count } afbeeldingen
}
pictures-add = Afbeeldingen toevoegen…
pictures-empty = De beeldbank is leeg
pictures-empty-text = Afbeeldingen die je hier toevoegt, kun je in al je projecten gebruiken, en een afbeelding die in een tekst wordt gezet, wordt hier bewaard. Voeg er enkele toe, of laat ze op dit venster vallen.
pictures-nothing-found = Niets gevonden
pictures-nothing-found-text = Geen afbeelding bevat al deze woorden.
# What a picture that has no name is called.
pictures-unnamed = Een afbeelding
pictures-with-notes = Met notities

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Afbeeldingen toevoegen
pictures-files = Afbeeldingen
pictures-taken-in = { $count ->
    [one] ‘{ $name }’ staat in de beeldbank
   *[other] { $count } afbeeldingen staan in de beeldbank
}
pictures-remove-title = ‘{ $name }’ uit de beeldbank verwijderen?
pictures-remove-unused = Geen project gebruikt de afbeelding. Wat er hier over wordt gezegd, en je notities erbij, worden mee verwijderd.
pictures-remove-used = { $count ->
    [one] { $count } project gebruikt de afbeelding. Zijn figuren blijven zonder de afbeelding achter. Wat er hier over wordt gezegd, en je notities erbij, worden mee verwijderd.
   *[other] { $count } projecten gebruiken de afbeelding. Hun figuren blijven zonder de afbeelding achter. Wat er hier over wordt gezegd, en je notities erbij, worden mee verwijderd.
}
pictures-no-backend = Er is geen backend.

## One picture

pictures-name = Naam
pictures-name-placeholder = Hoe de afbeelding heet
pictures-caption = Bijschrift
pictures-caption-placeholder = Wat over de afbeelding wordt gezegd
pictures-caption-hint = Figuren die met de afbeelding worden gemaakt, beginnen met deze woorden. Wat over een figuur wordt gezegd, kan daar worden veranderd zonder dit te veranderen.
pictures-italic = Cursief
pictures-small-caps = Klein kapitaal
# What the picture shows, in words, for those who do not see it.
pictures-alt = Toont
pictures-alt-placeholder = In woorden, voor wie ze niet kan zien
pictures-absent = De afbeelding staat niet op deze computer. Ze wordt in het project gebruikt, en wordt getoond zodra ze is gekomen van degene die ze erin heeft gezet.
pictures-notes = Notities
pictures-note-project = In dit project
pictures-note-project-placeholder = Wat je ervan vindt, voor dit werk
pictures-note-project-hint = Wat hier wordt geschreven, is bij iedereen die het project heeft.
pictures-note-for-all = Voor alle projecten bewaren
pictures-note-write-for-all = Voor alle projecten schrijven
pictures-note-all = In alle projecten
pictures-note-all-placeholder = Wat je ervan vindt, waar je ze ook gebruikt
pictures-note-all-hint = Bewaard bij de afbeelding in de beeldbank, op deze computer.
pictures-note-placeholder = Wat je ervan vindt. Voor jezelf: het hoort bij geen enkel document.
pictures-note-label = Je notities bij deze afbeelding
pictures-file = Het bestand
pictures-kind = Soort
pictures-kind-svg = SVG, een tekening
pictures-dimensions-label = Breed en hoog
pictures-dimensions = { $width } × { $height } punten
pictures-size = Grootte
# When the picture was taken into the store.
pictures-added = Toegevoegd
pictures-used-in = Gebruikt in
pictures-this-project = Dit project
# A map that has no name.
pictures-untitled = Zonder titel
pictures-unused = Geen project gebruikt de afbeelding.
pictures-remove = Uit de beeldbank verwijderen
