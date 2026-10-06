# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Imagini
pictures-all = Toate imaginile
pictures-picture = Imagine
pictures-search-placeholder = Caută în imagini
pictures-clear-search = Șterge căutarea
pictures-count = { $count ->
    [one] { $count } imagine
    [few] { $count } imagini
   *[other] { $count } de imagini
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } din { $count ->
    [one] { $count } imagine
    [few] { $count } imagini
   *[other] { $count } de imagini
}
pictures-add = Adaugă imagini…
pictures-empty = Depozitul este gol
pictures-empty-text = Imaginile pe care le adăugați aici pot fi folosite în toate proiectele, iar o imagine pusă într-un text se păstrează aici. Adăugați câteva, sau trageți-le pe această fereastră.
pictures-nothing-found = Nu s-a găsit nimic
pictures-nothing-found-text = Nicio imagine nu cuprinde toate aceste cuvinte.
# What a picture that has no name is called.
pictures-unnamed = O imagine
pictures-with-notes = Cu note

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Adaugă imagini
pictures-files = Imagini
pictures-taken-in = { $count ->
    [one] „{ $name }” este în depozit
    [few] { $count } imagini sunt în depozit
   *[other] { $count } de imagini sunt în depozit
}
pictures-remove-title = Scoateți „{ $name }” din depozit?
pictures-remove-unused = Niciun proiect nu folosește imaginea. Ce se spune despre ea aici și notele dumneavoastră despre ea se scot odată cu ea.
pictures-remove-used = { $count ->
    [one] { $count } proiect folosește imaginea. Figurile lui vor rămâne fără imagine. Ce se spune despre ea aici și notele dumneavoastră despre ea se scot odată cu ea.
    [few] { $count } proiecte folosesc imaginea. Figurile lor vor rămâne fără imagine. Ce se spune despre ea aici și notele dumneavoastră despre ea se scot odată cu ea.
   *[other] { $count } de proiecte folosesc imaginea. Figurile lor vor rămâne fără imagine. Ce se spune despre ea aici și notele dumneavoastră despre ea se scot odată cu ea.
}
pictures-no-backend = Nu există partea din spate.

## One picture

pictures-name = Nume
pictures-name-placeholder = Cum se numește imaginea
pictures-caption = Legendă
pictures-caption-placeholder = Ce se spune despre imagine
pictures-caption-hint = Figurile făcute cu imaginea încep cu aceste cuvinte. Ce se spune despre o figură se poate schimba acolo fără a schimba asta.
pictures-italic = Cursiv
pictures-small-caps = Capităluțe
# What the picture shows, in words, for those who do not see it.
pictures-alt = Arată
pictures-alt-placeholder = În cuvinte, pentru cei care nu o pot vedea
pictures-absent = Imaginea nu este pe acest calculator. Este folosită în proiect și se arată când a sosit de la cel care a pus-o acolo.
pictures-notes = Note
pictures-note-project = În acest proiect
pictures-note-project-placeholder = Ce credeți despre ea, pentru această lucrare
pictures-note-project-hint = Ce se scrie aici este la toți cei care au proiectul.
pictures-note-for-all = Păstreaz-o pentru toate proiectele
pictures-note-write-for-all = Scrie pentru toate proiectele
pictures-note-all = În toate proiectele
pictures-note-all-placeholder = Ce credeți despre ea, oriunde o folosiți
pictures-note-all-hint = Păstrată cu imaginea în depozit, pe acest calculator.
pictures-note-placeholder = Ce credeți despre ea. Pentru dumneavoastră: nu face parte din niciun document.
pictures-note-label = Notele dumneavoastră despre această imagine
pictures-file = Fișierul
pictures-kind = Fel
pictures-kind-svg = SVG, un desen
pictures-dimensions-label = Lată și înaltă
pictures-dimensions = { $width } × { $height } puncte
pictures-size = Mărime
# When the picture was taken into the store.
pictures-added = Adăugată
pictures-used-in = Folosită în
pictures-this-project = Acest proiect
# A map that has no name.
pictures-untitled = Fără titlu
pictures-unused = Niciun proiect nu folosește imaginea.
pictures-remove = Scoate din depozit
