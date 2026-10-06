# The full history of a project, in English.
# See locales/README.md.

history-title = Povijest
history-between = Između mapa i povijesti
history-settings = Postavke povijesti
history-failed = Povijest nije bilo moguće pročitati.
history-reading = Čitanje povijesti…

## When it is not kept

history-off = Povijest ovog projekta ne čuva se.
history-on-word = Svaka se izmjena čuva
history-off-word = Ne čuva se
history-off-about = Dok se čuva, čuva se svaka izmjena, s onim tko ju je načinio i kada: projekt se može pogledati kakav je bio u bilo kojem trenutku i vratiti. To zauzima prostor, a u dijeljenom projektu drugima pokazuje što je tko napisao i kada.
history-turn-on = Čuvaj povijest

## The moments

# Someone whose name the history does not know.
history-someone = Netko
history-began = Povijest počinje
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

history-back = Natrag u sadašnjost
history-as-it-was = Kako je bilo { $when }
history-marked = Što se promijenilo od prethodnog trenutka označeno je bojom onoga tko je to promijenio.
history-map-not-there = Ove mape tada nije bilo.
history-added-by = Dodano: { $name }
history-removed-by = Uklonjeno: { $name }
history-changed-by = Izmijenjeno: { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = uputnica
history-name-moment = Imenuj ovaj trenutak
history-name-placeholder = Kako ga nazvati
history-named = Trenutak se zove „{ $name }”.
history-bring-back-element = Vrati ovaj element kakav je bio
history-bring-back-map = Vrati mapu kakva je bila
history-brought-back = Vraćeno kako je bilo. Poništi to vraća natrag.
history-bring-back-failed = Nije bilo moguće vratiti.
history-open-copy = Otvori kao zaseban projekt
history-copy-name = { $name }, kako je bio { $day }
history-copy-failed = Projekt nije bilo moguće načiniti.

## Archives

history-open-archive = Otvori arhiv…
history-archive-kind = Povijest Glaukopisa
history-archive-unread = Arhiv nije bilo moguće pročitati.
history-archive-of = Arhiv: { $name }
history-archive-close = Zatvori

## Settings

history-keep = Čuvaj povijest
history-room = Povijest zauzima { $size }.
history-turn-off-title = Prestati čuvati povijest?
history-turn-off-message = Što je sačuvano briše se. Sam projekt ostaje kakav jest.
history-turn-off-shared = Što je sačuvano briše se, ovdje i na računalima onih s kojima se projekt dijeli. Sam projekt ostaje kakav jest.
history-turn-off = Izbriši povijest
history-finely = Starija povijest
history-finely-about = Starije se izmjene spajaju, da zauzimaju manje prostora i brže se čitaju; trenuci unutar njih tada se više ne mogu razlučiti. Imenovani trenuci, i oni s kojima se uspoređuju pregledi izmjena, čuvaju se.
history-hourly = Spoji svaki sat u jedan nakon
history-weeks = { $count ->
    [one] tjedan
    [few] tjedna
   *[other] tjedana
}
history-daily = Spoji svaki dan u jedan nakon
history-months = { $count ->
    [one] mjesec
    [few] mjeseca
   *[other] mjeseci
}
history-before = Što je bilo prije
history-before-choose = Odaberite trenutak u povijesti da arhivirate ili izbrišete što je bilo prije njega.
history-before-about = Povijest prije { $when } može se arhivirati u datoteku, da se poslije pogleda, ili izbrisati.
history-archive = Arhiviraj…
history-delete = Izbriši
history-archive-title = Arhivirati povijest prije { $when }?
history-delete-title = Izbrisati povijest prije { $when }?
history-cut-message = Što ostaje počinje projektom kakav je tada bio.
history-cut-kept = { $count ->
    [1] Prije njega je jedan imenovani ili pregledani trenutak, koji se ovdje više ne može pogledati.
    [one] Prije njega je { $count } imenovani ili pregledani trenutak, koji se ovdje više ne može pogledati.
    [few] Prije njega su { $count } imenovana ili pregledana trenutka, koji se ovdje više ne mogu pogledati.
   *[other] Prije njega je { $count } imenovanih ili pregledanih trenutaka, koji se ovdje više ne mogu pogledati.
}
history-cut-not-here = Povijest se ne može izdvojiti prije ovog trenutka.
history-cut-failed = Povijest nije bilo moguće izdvojiti.
history-archive-until = do { $when }
history-archived = Povijest prije { $when } je arhivirana.
history-deleted = Povijest prije { $when } je izbrisana.
