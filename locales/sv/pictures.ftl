# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Bilder
pictures-all = Alla bilder
pictures-picture = Bild
pictures-search-placeholder = Sök bland bilderna
pictures-clear-search = Rensa sökningen
pictures-count = { $count ->
    [one] { $count } bild
   *[other] { $count } bilder
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } av { $count ->
    [one] { $count } bild
   *[other] { $count } bilder
}
pictures-add = Lägg till bilder…
pictures-empty = Förrådet är tomt
pictures-empty-text = Bilder du lägger till här kan användas i alla dina projekt, och en bild som sätts in i en text sparas här. Lägg till några, eller släpp dem på det här fönstret.
pictures-nothing-found = Inget hittat
pictures-nothing-found-text = Ingen bild innehåller alla de här orden.
# What a picture that has no name is called.
pictures-unnamed = En bild
pictures-with-notes = Med anteckningar

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Lägg till bilder
pictures-files = Bilder
pictures-taken-in = { $count ->
    [one] ”{ $name }” finns i förrådet
   *[other] { $count } bilder finns i förrådet
}
pictures-remove-title = Ta bort ”{ $name }” från förrådet?
pictures-remove-unused = Inget projekt använder bilden. Det som sägs om den här, och dina anteckningar om den, tas bort med den.
pictures-remove-used = { $count ->
    [one] { $count } projekt använder bilden. Dess figurer blir utan bilden. Det som sägs om den här, och dina anteckningar om den, tas bort med den.
   *[other] { $count } projekt använder bilden. Deras figurer blir utan bilden. Det som sägs om den här, och dina anteckningar om den, tas bort med den.
}
pictures-no-backend = Det finns inget bakomliggande program.

## One picture

pictures-name = Namn
pictures-name-placeholder = Vad bilden heter
pictures-caption = Bildtext
pictures-caption-placeholder = Vad som sägs om bilden
pictures-caption-hint = Figurer som görs med bilden börjar med de här orden. Det som sägs om en figur kan ändras där utan att detta ändras.
pictures-italic = Kursiv
pictures-small-caps = Kapitäler
# What the picture shows, in words, for those who do not see it.
pictures-alt = Visar
pictures-alt-placeholder = I ord, för dem som inte kan se den
pictures-absent = Bilden finns inte på den här datorn. Den används i projektet, och visas när den har kommit från den som satte in den.
pictures-notes = Anteckningar
pictures-note-project = I det här projektet
pictures-note-project-placeholder = Vad du tycker om den, för det här arbetet
pictures-note-project-hint = Det som skrivs här finns hos alla som har projektet.
pictures-note-for-all = Behåll den för alla projekt
pictures-note-write-for-all = Skriv för alla projekt
pictures-note-all = I alla projekt
pictures-note-all-placeholder = Vad du tycker om den, var du än använder den
pictures-note-all-hint = Sparas med bilden i förrådet, på den här datorn.
pictures-note-placeholder = Vad du tycker om den. För dig själv: den är inte del av något dokument.
pictures-note-label = Dina anteckningar om den här bilden
pictures-file = Filen
pictures-kind = Slag
pictures-kind-svg = SVG, en ritning
pictures-dimensions-label = Bredd och höjd
pictures-dimensions = { $width } × { $height } punkter
pictures-size = Storlek
# When the picture was taken into the store.
pictures-added = Tillagd
pictures-used-in = Används i
pictures-this-project = Det här projektet
# A map that has no name.
pictures-untitled = Utan titel
pictures-unused = Inget projekt använder bilden.
pictures-remove = Ta bort från förrådet
