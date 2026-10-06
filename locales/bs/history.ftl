# The full history of a project, in English.
# See locales/README.md.

history-title = Historija
history-between = Između mapa i historije
history-settings = Postavke historije
history-failed = Historiju nije bilo moguće pročitati.
history-reading = Čitanje historije…

## When it is not kept

history-off = Historija ovog projekta se ne čuva.
history-on-word = Svaka izmjena se čuva
history-off-word = Ne čuva se
history-off-about = Dok se čuva, čuva se svaka izmjena, s tim ko ju je napravio i kada: projekat se može pogledati kakav je bio u bilo kojem trenutku i vratiti. To zauzima prostor, a u dijeljenom projektu drugima pokazuje šta je ko napisao i kada.
history-turn-on = Čuvaj historiju

## The moments

# Someone whose name the history does not know.
history-someone = Neko
history-began = Historija počinje
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = sačuvano grublje
history-added = { $count ->
    [one] +{ $count } znak
    [few] +{ $count } znaka
   *[other] +{ $count } znakova
}
history-removed = { $count ->
    [one] −{ $count } znak
    [few] −{ $count } znaka
   *[other] −{ $count } znakova
}

## The map as it was

history-back = Nazad u sadašnjost
history-as-it-was = Kako je bilo { $when }
history-marked = Ono što se promijenilo od prethodnog trenutka označeno je bojom onoga ko je to promijenio.
history-map-not-there = Ove mape tada nije bilo.
history-added-by = Dodano: { $name }
history-removed-by = Uklonjeno: { $name }
history-changed-by = Izmijenjeno: { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = uputnica
history-name-moment = Imenuj ovaj trenutak
history-name-placeholder = Kako ga nazvati
history-named = Trenutak se zove „{ $name }“.
history-bring-back-element = Vrati ovaj element kakav je bio
history-bring-back-map = Vrati mapu kakva je bila
history-brought-back = Vraćeno kako je bilo. Poništi to vraća nazad.
history-bring-back-failed = Nije bilo moguće vratiti.
history-open-copy = Otvori kao zaseban projekat
history-copy-name = { $name }, kako je bilo { $day }
history-copy-failed = Projekat nije bilo moguće napraviti.

## Archives

history-open-archive = Otvori arhivu…
history-archive-kind = Historija Glaukopisa
history-archive-unread = Arhivu nije bilo moguće pročitati.
history-archive-of = Arhiva: { $name }
history-archive-close = Zatvori

## Settings

history-keep = Čuvaj historiju
history-room = Historija zauzima { $size }.
history-turn-off-title = Prestati čuvati historiju?
history-turn-off-message = Ono što je sačuvano briše se. Sam projekat ostaje kakav jeste.
history-turn-off-shared = Ono što je sačuvano briše se, ovdje i na računarima onih s kojima se projekat dijeli. Sam projekat ostaje kakav jeste.
history-turn-off = Izbriši historiju
history-finely = Starija historija
history-finely-about = Starije izmjene se spajaju, da zauzimaju manje prostora i brže se čitaju; trenuci unutar njih onda se više ne mogu razlikovati. Imenovani trenuci, i oni s kojima revizije porede, čuvaju se.
history-hourly = Spoji svaki sat u jedan nakon
history-weeks = { $count ->
    [one] sedmice
    [few] sedmice
   *[other] sedmica
}
history-daily = Spoji svaki dan u jedan nakon
history-months = { $count ->
    [one] mjeseca
    [few] mjeseca
   *[other] mjeseci
}
history-before = Ono što je prije
history-before-choose = Odaberite trenutak u historiji da arhivirate ili izbrišete ono što je prije njega.
history-before-about = Historija prije { $when } može se arhivirati u datoteku, da se kasnije pogleda, ili izbrisati.
history-archive = Arhiviraj…
history-delete = Izbriši
history-archive-title = Arhivirati historiju prije { $when }?
history-delete-title = Izbrisati historiju prije { $when }?
history-cut-message = Ono što ostaje počinje projektom kakav je tada bio.
history-cut-kept = { $count ->
    [one] Prije njega je jedan imenovani ili revidirani trenutak, koji se ovdje više neće moći pogledati.
    [few] Prije njega su { $count } imenovana ili revidirana trenutka, koji se ovdje više neće moći pogledati.
   *[other] Prije njega je { $count } imenovanih ili revidiranih trenutaka, koji se ovdje više neće moći pogledati.
}
history-cut-not-here = Historija se ne može izdvojiti prije ovog trenutka.
history-cut-failed = Historiju nije bilo moguće izdvojiti.
history-archive-until = do { $when }
history-archived = Historija prije { $when } je arhivirana.
history-deleted = Historija prije { $when } je izbrisana.
