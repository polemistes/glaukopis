# The full history of a project, in English.
# See locales/README.md.

history-title = Zgodovina
history-between = Med miselnimi vzorci in zgodovino
history-settings = Nastavitve zgodovine
history-failed = Zgodovine ni bilo mogoče prebrati.
history-reading = Branje zgodovine…

## When it is not kept

history-off = Zgodovina tega projekta se ne hrani.
history-on-word = Vsaka sprememba se hrani
history-off-word = Se ne hrani
history-off-about = Dokler se hrani, se shrani vsaka sprememba, s tem, kdo jo je naredil in kdaj: projekt si je mogoče ogledati, kakršen je bil v katerem koli trenutku, in ga vrniti. To vzame prostor, v deljenem projektu pa drugim pokaže, kaj je kdo napisal in kdaj.
history-turn-on = Hrani zgodovino

## The moments

# Someone whose name the history does not know.
history-someone = Nekdo
history-began = Zgodovina se začne
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = hranjeno manj natančno
history-added = { $count ->
    [one] +{ $count } znak
    [two] +{ $count } znaka
    [few] +{ $count } znaki
   *[other] +{ $count } znakov
}
history-removed = { $count ->
    [one] −{ $count } znak
    [two] −{ $count } znaka
    [few] −{ $count } znaki
   *[other] −{ $count } znakov
}

## The map as it was

history-back = Nazaj v sedanjost
history-as-it-was = Kakor je bilo { $when }
history-marked = Kar se je spremenilo od prejšnjega trenutka, je označeno z barvo tistega, ki je to spremenil.
history-map-not-there = Tega miselnega vzorca takrat še ni bilo.
history-added-by = Dodal { $name }
history-removed-by = Odstranil { $name }
history-changed-by = Spremenil { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = sklic
history-name-moment = Poimenuj ta trenutek
history-name-placeholder = Kako naj se imenuje
history-named = Trenutek se imenuje »{ $name }«.
history-bring-back-element = Vrni ta element, kakršen je bil
history-bring-back-map = Vrni miselni vzorec, kakršen je bil
history-brought-back = Vrnjeno, kakor je bilo. Razveljavi vzame nazaj.
history-bring-back-failed = Ni bilo mogoče vrniti.
history-open-copy = Odpri kot svoj projekt
history-copy-name = { $name }, kakor je bil { $day }
history-copy-failed = Projekta ni bilo mogoče narediti.

## Archives

history-open-archive = Odpri arhiv…
history-archive-kind = Zgodovina Glaukopisa
history-archive-unread = Arhiva ni bilo mogoče prebrati.
history-archive-of = Arhiv: { $name }
history-archive-close = Zapri

## Settings

history-keep = Hrani zgodovino
history-room = Zgodovina zavzema { $size }.
history-turn-off-title = Nehati hraniti zgodovino?
history-turn-off-message = Kar je bilo shranjeno, se izbriše. Sam projekt ostane, kakršen je.
history-turn-off-shared = Kar je bilo shranjeno, se izbriše, tu in na računalnikih tistih, s katerimi je projekt deljen. Sam projekt ostane, kakršen je.
history-turn-off = Izbriši zgodovino
history-finely = Starejša zgodovina
history-finely-about = Starejše spremembe se združijo, da zavzamejo manj prostora in se hitreje preberejo; trenutkov znotraj njih potem ni več mogoče ločiti. Poimenovani trenutki in tisti, s katerimi primerjajo pregledi, se ohranijo.
history-hourly = Vsako uro združi v eno po
history-weeks = { $count ->
    [one] tednu
    [two] tednih
    [few] tednih
   *[other] tednih
}
history-daily = Vsak dan združi v enega po
history-months = { $count ->
    [one] mesecu
    [two] mesecih
    [few] mesecih
   *[other] mesecih
}
history-before = Kar je bilo prej
history-before-choose = Izberite trenutek v zgodovini, da arhivirate ali izbrišete, kar je bilo pred njim.
history-before-about = Zgodovino pred { $when } je mogoče arhivirati v datoteko, da si jo ogledate pozneje, ali izbrisati.
history-archive = Arhiviraj…
history-delete = Izbriši
history-archive-title = Arhivirati zgodovino pred { $when }?
history-delete-title = Izbrisati zgodovino pred { $when }?
history-cut-message = Kar ostane, se začne s projektom, kakršen je bil takrat.
history-cut-kept = { $count ->
    [one] Pred njim je { $count } poimenovan ali pregledan trenutek, ki si ga tu ne bo več mogoče ogledati.
    [two] Pred njim sta { $count } poimenovana ali pregledana trenutka, ki si ju tu ne bo več mogoče ogledati.
    [few] Pred njim so { $count } poimenovani ali pregledani trenutki, ki si jih tu ne bo več mogoče ogledati.
   *[other] Pred njim je { $count } poimenovanih ali pregledanih trenutkov, ki si jih tu ne bo več mogoče ogledati.
}
history-cut-not-here = Zgodovine pred tem trenutkom ni mogoče vzeti ven.
history-cut-failed = Zgodovine ni bilo mogoče vzeti ven.
history-archive-until = do { $when }
history-archived = Zgodovina pred { $when } je arhivirana.
history-deleted = Zgodovina pred { $when } je izbrisana.
