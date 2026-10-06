# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Obrázky
pictures-all = Všetky obrázky
pictures-picture = Obrázok
pictures-search-placeholder = Hľadať v obrázkoch
pictures-clear-search = Vymazať hľadanie
pictures-count = { $count ->
    [one] { $count } obrázok
    [few] { $count } obrázky
   *[other] { $count } obrázkov
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } z { $count ->
    [one] { $count } obrázka
    [few] { $count } obrázkov
   *[other] { $count } obrázkov
}
pictures-add = Pridať obrázky…
pictures-empty = Úložisko je prázdne
pictures-empty-text = Obrázky, ktoré sem pridáte, možno použiť vo všetkých vašich projektoch a obrázok vložený do textu sa uchová tu. Pridajte nejaké alebo ich pustite na toto okno.
pictures-nothing-found = Nič sa nenašlo
pictures-nothing-found-text = Žiadny obrázok neobsahuje všetky tieto slová.
# What a picture that has no name is called.
pictures-unnamed = Obrázok
pictures-with-notes = S poznámkami

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Pridať obrázky
pictures-files = Obrázky
pictures-taken-in = { $count ->
    [one] „{ $name }“ je v úložisku
    [few] { $count } obrázky sú v úložisku
   *[other] { $count } obrázkov je v úložisku
}
pictures-remove-title = Odobrať „{ $name }“ z úložiska?
pictures-remove-unused = Obrázok nepoužíva žiadny projekt. Čo je o ňom tu povedané, a vaše poznámky k nemu, sa odstránia s ním.
pictures-remove-used = { $count ->
    [one] Obrázok používa { $count } projekt. Jeho vyobrazenia ostanú bez obrázka. Čo je o ňom tu povedané, a vaše poznámky k nemu, sa odstránia s ním.
    [few] Obrázok používajú { $count } projekty. Ich vyobrazenia ostanú bez obrázka. Čo je o ňom tu povedané, a vaše poznámky k nemu, sa odstránia s ním.
   *[other] Obrázok používa { $count } projektov. Ich vyobrazenia ostanú bez obrázka. Čo je o ňom tu povedané, a vaše poznámky k nemu, sa odstránia s ním.
}
pictures-no-backend = Nie je žiadny backend.

## One picture

pictures-name = Názov
pictures-name-placeholder = Ako sa obrázok volá
pictures-caption = Popiska
pictures-caption-placeholder = Čo sa hovorí o obrázku
pictures-caption-hint = Vyobrazenia vytvorené s obrázkom sa začínajú týmito slovami. Čo sa hovorí o vyobrazení, možno zmeniť tam bez zmeny tohto.
pictures-italic = Kurzíva
pictures-small-caps = Kapitálky
# What the picture shows, in words, for those who do not see it.
pictures-alt = Zobrazuje
pictures-alt-placeholder = Slovami, pre tých, ktorí ho nevidia
pictures-absent = Obrázok nie je v tomto počítači. Používa sa v projekte a zobrazí sa, keď príde od toho, kto ho tam dal.
pictures-notes = Poznámky
pictures-note-project = V tomto projekte
pictures-note-project-placeholder = Čo si o ňom myslíte, pre túto prácu
pictures-note-project-hint = Čo sa sem napíše, má každý, kto má projekt.
pictures-note-for-all = Uchovať pre všetky projekty
pictures-note-write-for-all = Písať pre všetky projekty
pictures-note-all = Vo všetkých projektoch
pictures-note-all-placeholder = Čo si o ňom myslíte, kdekoľvek ho použijete
pictures-note-all-hint = Uchované s obrázkom v úložisku, v tomto počítači.
pictures-note-placeholder = Čo si o ňom myslíte. Pre vás: nie je to súčasť žiadneho dokumentu.
pictures-note-label = Vaše poznámky k tomuto obrázku
pictures-file = Súbor
pictures-kind = Druh
pictures-kind-svg = SVG, kresba
pictures-dimensions-label = Šírka a výška
pictures-dimensions = { $width } × { $height } bodov
pictures-size = Veľkosť
# When the picture was taken into the store.
pictures-added = Pridaný
pictures-used-in = Použitý v
pictures-this-project = Tento projekt
# A map that has no name.
pictures-untitled = Bez názvu
pictures-unused = Obrázok nepoužíva žiadny projekt.
pictures-remove = Odobrať z úložiska
