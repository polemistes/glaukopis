# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Slike
pictures-all = Sve slike
pictures-picture = Slika
pictures-search-placeholder = Pretraži slike
pictures-clear-search = Očisti pretragu
pictures-count = { $count ->
    [one] { $count } slika
    [few] { $count } slike
   *[other] { $count } slika
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } od { $count ->
    [one] { $count } slike
    [few] { $count } slike
   *[other] { $count } slika
}
pictures-add = Dodaj slike…
pictures-empty = Spremište je prazno
pictures-empty-text = Slike koje ovdje dodate mogu se koristiti u svim vašim projektima, a slika stavljena u tekst čuva se ovdje. Dodajte ih, ili ih ispustite na ovaj prozor.
pictures-nothing-found = Ništa nije pronađeno
pictures-nothing-found-text = Nijedna slika ne sadrži sve te riječi.
# What a picture that has no name is called.
pictures-unnamed = Slika
pictures-with-notes = S bilješkama

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Dodaj slike
pictures-files = Slike
pictures-taken-in = { $count ->
    [one] „{ $name }” je u spremištu
    [few] { $count } slike su u spremištu
   *[other] { $count } slika je u spremištu
}
pictures-remove-title = Ukloniti „{ $name }” iz spremišta?
pictures-remove-unused = Nijedan projekt ne koristi sliku. Što se ovdje o njoj kaže, i vaše bilješke o njoj, uklanjaju se s njom.
pictures-remove-used = { $count ->
    [one] { $count } projekt koristi sliku. Njegove će ilustracije ostati bez slike. Što se ovdje o njoj kaže, i vaše bilješke o njoj, uklanjaju se s njom.
    [few] { $count } projekta koriste sliku. Njihove će ilustracije ostati bez slike. Što se ovdje o njoj kaže, i vaše bilješke o njoj, uklanjaju se s njom.
   *[other] { $count } projekata koristi sliku. Njihove će ilustracije ostati bez slike. Što se ovdje o njoj kaže, i vaše bilješke o njoj, uklanjaju se s njom.
}
pictures-no-backend = Nema pozadinskog sustava.

## One picture

pictures-name = Naziv
pictures-name-placeholder = Kako se slika zove
pictures-caption = Opis
pictures-caption-placeholder = Što se o slici kaže
pictures-caption-hint = Ilustracije načinjene od slike počinju ovim riječima. Što se o ilustraciji kaže može se ondje promijeniti, a da se ovo ne mijenja.
pictures-italic = Kurziv
pictures-small-caps = Kapitalke
# What the picture shows, in words, for those who do not see it.
pictures-alt = Prikazuje
pictures-alt-placeholder = Riječima, za one koji je ne vide
pictures-absent = Slika nije na ovom računalu. Koristi se u projektu, a prikazat će se kad stigne od onoga tko ju je stavio.
pictures-notes = Bilješke
pictures-note-project = U ovom projektu
pictures-note-project-placeholder = Što o njoj mislite, za ovaj rad
pictures-note-project-hint = Što je ovdje napisano imaju svi koji imaju projekt.
pictures-note-for-all = Čuvaj za sve projekte
pictures-note-write-for-all = Piši za sve projekte
pictures-note-all = U svim projektima
pictures-note-all-placeholder = Što o njoj mislite, gdje god je koristili
pictures-note-all-hint = Čuva se uz sliku u spremištu, na ovom računalu.
pictures-note-placeholder = Što o njoj mislite. Za vas: nije dio nijednog dokumenta.
pictures-note-label = Vaše bilješke o ovoj slici
pictures-file = Datoteka
pictures-kind = Vrsta
pictures-kind-svg = SVG, crtež
pictures-dimensions-label = Širina i visina
pictures-dimensions = { $width } × { $height } točaka
pictures-size = Veličina
# When the picture was taken into the store.
pictures-added = Dodano
pictures-used-in = Koristi se u
pictures-this-project = Ovaj projekt
# A map that has no name.
pictures-untitled = Bez naslova
pictures-unused = Nijedan projekt ne koristi sliku.
pictures-remove = Ukloni iz spremišta
