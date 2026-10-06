# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Slike
pictures-all = Vse slike
pictures-picture = Slika
pictures-search-placeholder = Išči po slikah
pictures-clear-search = Počisti iskanje
pictures-count = { $count ->
    [one] { $count } slika
    [two] { $count } sliki
    [few] { $count } slike
   *[other] { $count } slik
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } od { $count ->
    [one] { $count } slike
    [two] { $count } slik
    [few] { $count } slik
   *[other] { $count } slik
}
pictures-add = Dodaj slike…
pictures-empty = Shramba je prazna
pictures-empty-text = Slike, ki jih dodate sem, je mogoče uporabiti v vseh vaših projektih, in slika, vstavljena v besedilo, se hrani tu. Dodajte jih nekaj ali jih spustite na to okno.
pictures-nothing-found = Nič ni najdeno
pictures-nothing-found-text = Nobena slika ne vsebuje vseh teh besed.
# What a picture that has no name is called.
pictures-unnamed = Slika
pictures-with-notes = Z zapiski

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Dodaj slike
pictures-files = Slike
pictures-taken-in = { $count ->
    [one] »{ $name }« je v shrambi
    [two] { $count } sliki sta v shrambi
    [few] { $count } slike so v shrambi
   *[other] { $count } slik je v shrambi
}
pictures-remove-title = Odstraniti »{ $name }« iz shrambe?
pictures-remove-unused = Noben projekt ne uporablja te slike. Kar je tu povedano o njej, in vaši zapiski o njej se odstranijo z njo.
pictures-remove-used = { $count ->
    [one] { $count } projekt uporablja to sliko. Njegove ilustracije bodo ostale brez slike. Kar je tu povedano o njej, in vaši zapiski o njej se odstranijo z njo.
    [two] { $count } projekta uporabljata to sliko. Njune ilustracije bodo ostale brez slike. Kar je tu povedano o njej, in vaši zapiski o njej se odstranijo z njo.
    [few] { $count } projekti uporabljajo to sliko. Njihove ilustracije bodo ostale brez slike. Kar je tu povedano o njej, in vaši zapiski o njej se odstranijo z njo.
   *[other] { $count } projektov uporablja to sliko. Njihove ilustracije bodo ostale brez slike. Kar je tu povedano o njej, in vaši zapiski o njej se odstranijo z njo.
}
pictures-no-backend = Ni zaledja.

## One picture

pictures-name = Ime
pictures-name-placeholder = Kako se slika imenuje
pictures-caption = Napis
pictures-caption-placeholder = Kar je povedano o sliki
pictures-caption-hint = Ilustracije, narejene s to sliko, se začnejo s temi besedami. Kar je povedano o ilustraciji, je mogoče spremeniti tam, ne da bi se spremenilo to.
pictures-italic = Ležeče
pictures-small-caps = Kapitelke
# What the picture shows, in words, for those who do not see it.
pictures-alt = Prikazuje
pictures-alt-placeholder = Z besedami, za tiste, ki je ne vidijo
pictures-absent = Slike ni na tem računalniku. Projekt jo uporablja; prikazana bo, ko pride od tistega, ki jo je vstavil.
pictures-notes = Zapiski
pictures-note-project = V tem projektu
pictures-note-project-placeholder = Kaj si mislite o njej, za to delo
pictures-note-project-hint = Kar je napisano tu, ima vsak, ki ima projekt.
pictures-note-for-all = Hrani za vse projekte
pictures-note-write-for-all = Piši za vse projekte
pictures-note-all = V vseh projektih
pictures-note-all-placeholder = Kaj si mislite o njej, kjer koli jo uporabite
pictures-note-all-hint = Hranjeno s sliko v shrambi, na tem računalniku.
pictures-note-placeholder = Kaj si mislite o njej. Zase: ni del nobenega dokumenta.
pictures-note-label = Vaši zapiski o tej sliki
pictures-file = Datoteka
pictures-kind = Vrsta
pictures-kind-svg = SVG, risba
pictures-dimensions-label = Širina in višina
pictures-dimensions = { $width } × { $height } točk
pictures-size = Velikost
# When the picture was taken into the store.
pictures-added = Dodana
pictures-used-in = Uporabljena v
pictures-this-project = Ta projekt
# A map that has no name.
pictures-untitled = Brez naslova
pictures-unused = Noben projekt ne uporablja te slike.
pictures-remove = Odstrani iz shrambe
