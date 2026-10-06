# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Obrazy
pictures-all = Wszystkie obrazy
pictures-picture = Obraz
pictures-search-placeholder = Szukaj w obrazach
pictures-clear-search = Wyczyść wyszukiwanie
pictures-count = { $count ->
    [one] { $count } obraz
    [few] { $count } obrazy
    [many] { $count } obrazów
   *[other] { $count } obrazów
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } z { $count ->
    [one] { $count } obrazu
    [few] { $count } obrazów
    [many] { $count } obrazów
   *[other] { $count } obrazów
}
pictures-add = Dodaj obrazy…
pictures-empty = Zbiór jest pusty
pictures-empty-text = Obrazów, które tu dodasz, można używać we wszystkich twoich projektach, a obraz wstawiony do tekstu jest tu zachowywany. Dodaj jakieś albo upuść je na to okno.
pictures-nothing-found = Nic nie znaleziono
pictures-nothing-found-text = Żaden obraz nie zawiera wszystkich tych słów.
# What a picture that has no name is called.
pictures-unnamed = Obraz
pictures-with-notes = Z notatkami

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Dodaj obrazy
pictures-files = Obrazy
pictures-taken-in = { $count ->
    [one] „{ $name }” jest w zbiorze
    [few] { $count } obrazy są w zbiorze
    [many] { $count } obrazów jest w zbiorze
   *[other] { $count } obrazów jest w zbiorze
}
pictures-remove-title = Usunąć „{ $name }” ze zbioru?
pictures-remove-unused = Żaden projekt nie używa tego obrazu. To, co o nim tu powiedziano, i twoje notatki o nim są usuwane razem z nim.
pictures-remove-used = { $count ->
    [one] { $count } projekt używa tego obrazu. Jego ryciny zostaną bez obrazu. To, co o nim tu powiedziano, i twoje notatki o nim są usuwane razem z nim.
    [few] { $count } projekty używają tego obrazu. Ich ryciny zostaną bez obrazu. To, co o nim tu powiedziano, i twoje notatki o nim są usuwane razem z nim.
    [many] { $count } projektów używa tego obrazu. Ich ryciny zostaną bez obrazu. To, co o nim tu powiedziano, i twoje notatki o nim są usuwane razem z nim.
   *[other] { $count } projektów używa tego obrazu. Ich ryciny zostaną bez obrazu. To, co o nim tu powiedziano, i twoje notatki o nim są usuwane razem z nim.
}
pictures-no-backend = Brak zaplecza programu.

## One picture

pictures-name = Nazwa
pictures-name-placeholder = Jak obraz się nazywa
pictures-caption = Podpis
pictures-caption-placeholder = Co się mówi o obrazie
pictures-caption-hint = Ryciny zrobione z tego obrazu zaczynają się od tych słów. To, co mówi się o rycinie, można zmienić tam, nie zmieniając tego.
pictures-italic = Kursywa
pictures-small-caps = Kapitaliki
# What the picture shows, in words, for those who do not see it.
pictures-alt = Przedstawia
pictures-alt-placeholder = Słowami, dla tych, którzy nie mogą go zobaczyć
pictures-absent = Obrazu nie ma na tym komputerze. Jest używany w projekcie i pokaże się, gdy nadejdzie od tego, kto go tam umieścił.
pictures-notes = Notatki
pictures-note-project = W tym projekcie
pictures-note-project-placeholder = Co o nim sądzisz, na potrzeby tej pracy
pictures-note-project-hint = To, co tu napisano, ma każdy, kto ma projekt.
pictures-note-for-all = Zachowaj dla wszystkich projektów
pictures-note-write-for-all = Napisz dla wszystkich projektów
pictures-note-all = We wszystkich projektach
pictures-note-all-placeholder = Co o nim sądzisz, gdziekolwiek go używasz
pictures-note-all-hint = Zachowane z obrazem w zbiorze, na tym komputerze.
pictures-note-placeholder = Co o nim sądzisz. Dla siebie: nie jest częścią żadnego dokumentu.
pictures-note-label = Twoje notatki o tym obrazie
pictures-file = Plik
pictures-kind = Rodzaj
pictures-kind-svg = SVG, rysunek
pictures-dimensions-label = Szerokość i wysokość
pictures-dimensions = { $width } × { $height } punktów
pictures-size = Rozmiar
# When the picture was taken into the store.
pictures-added = Dodano
pictures-used-in = Używany w
pictures-this-project = Ten projekt
# A map that has no name.
pictures-untitled = Bez tytułu
pictures-unused = Żaden projekt nie używa tego obrazu.
pictures-remove = Usuń ze zbioru
