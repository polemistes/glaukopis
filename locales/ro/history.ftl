# The full history of a project, in English.
# See locales/README.md.

history-title = Istoric
history-between = Între hărți și istoric
history-settings = Setările istoricului
history-failed = Istoricul nu s-a putut citi.
history-reading = Se citește istoricul…

## When it is not kept

history-off = Istoricul acestui proiect nu se păstrează.
history-on-word = Fiecare modificare se păstrează
history-off-word = Nu se păstrează
history-off-about = Cât timp se păstrează, fiecare modificare este ținută, cu cine a făcut-o și când: proiectul poate fi văzut așa cum era în orice clipă și readus. Ocupă loc, iar într-un proiect partajat le arată celorlalți ce a scris fiecare și când.
history-turn-on = Păstrează istoricul

## The moments

# Someone whose name the history does not know.
history-someone = Cineva
history-began = Istoricul începe
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = păstrat mai puțin fin
history-added = { $count ->
    [one] +1 caracter
    [few] +{ $count } caractere
   *[other] +{ $count } de caractere
}
history-removed = { $count ->
    [one] −1 caracter
    [few] −{ $count } caractere
   *[other] −{ $count } de caractere
}

## The map as it was

history-back = Înapoi la prezent
history-as-it-was = Așa cum era { $when }
history-marked = Ce s-a schimbat de la momentul dinainte este marcat în culoarea celui care a schimbat.
history-map-not-there = Această hartă nu exista atunci.
history-added-by = Adăugat de { $name }
history-removed-by = Scos de { $name }
history-changed-by = Modificat de { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = trimitere
history-name-moment = Numește acest moment
history-name-placeholder = Cum să se numească
history-named = Momentul se numește „{ $name }”.
history-bring-back-element = Readu acest element așa cum era
history-bring-back-map = Readu harta așa cum era
history-brought-back = Readus așa cum era. Anularea îl ia înapoi.
history-bring-back-failed = Nu s-a putut readuce.
history-open-copy = Deschide ca proiect de sine stătător
history-copy-name = { $name }, așa cum era { $day }
history-copy-failed = Proiectul nu s-a putut face.

## Archives

history-open-archive = Deschide o arhivă…
history-archive-kind = Istoric Glaukopis
history-archive-unread = Arhiva nu s-a putut citi.
history-archive-of = Arhivă: { $name }
history-archive-close = Închide

## Settings

history-keep = Păstrează istoricul
history-room = Istoricul ocupă { $size }.
history-turn-off-title = Nu mai păstrați istoricul?
history-turn-off-message = Ce s-a păstrat se șterge. Proiectul însuși rămâne cum este.
history-turn-off-shared = Ce s-a păstrat se șterge, aici și pe calculatoarele celor cu care este partajat proiectul. Proiectul însuși rămâne cum este.
history-turn-off = Șterge istoricul
history-finely = Istoricul mai vechi
history-finely-about = Modificările mai vechi se contopesc, ca să ocupe mai puțin loc și să se citească mai repede; momentele dinăuntrul lor nu se mai pot deosebi atunci. Momentele numite și cele cu care se compară revizuirile se păstrează.
history-hourly = Contopește fiecare oră într-una după
history-weeks = { $count ->
    [one] săptămână
    [few] săptămâni
   *[other] de săptămâni
}
history-daily = Contopește fiecare zi într-una după
history-months = { $count ->
    [one] lună
    [few] luni
   *[other] de luni
}
history-before = Ce a fost înainte
history-before-choose = Alegeți un moment din istoric ca să arhivați sau să ștergeți ce a fost înaintea lui.
history-before-about = Istoricul dinainte de { $when } poate fi arhivat într-un fișier, ca să fie văzut mai târziu, sau șters.
history-archive = Arhivează…
history-delete = Șterge
history-archive-title = Arhivați istoricul dinainte de { $when }?
history-delete-title = Ștergeți istoricul dinainte de { $when }?
history-cut-message = Ce rămâne începe cu proiectul așa cum era atunci.
history-cut-kept = { $count ->
    [one] Un moment numit sau revizuit este înaintea lui și nu mai poate fi văzut aici.
    [few] { $count } momente numite sau revizuite sunt înaintea lui și nu mai pot fi văzute aici.
   *[other] { $count } de momente numite sau revizuite sunt înaintea lui și nu mai pot fi văzute aici.
}
history-cut-not-here = Istoricul nu poate fi scos înainte de acest moment.
history-cut-failed = Istoricul nu s-a putut scoate.
history-archive-until = până la { $when }
history-archived = Istoricul dinainte de { $when } este arhivat.
history-deleted = Istoricul dinainte de { $when } este șters.
