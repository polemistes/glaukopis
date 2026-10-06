# The full history of a project, in English.
# See locales/README.md.

history-title = História
history-between = Medzi mapami a históriou
history-settings = Nastavenia histórie
history-failed = Históriu sa nepodarilo prečítať.
history-reading = Číta sa história…

## When it is not kept

history-off = História tohto projektu sa nevedie.
history-on-word = Každá zmena sa uchováva
history-off-word = Nevedie sa
history-off-about = Kým sa vedie, uchová sa každá zmena s tým, kto ju urobil a kedy: na projekt sa možno pozrieť, aký bol v ktorejkoľvek chvíli, a vrátiť ho. Zaberá miesto a v zdieľanom projekte ukazuje ostatným, čo kto napísal a kedy.
history-turn-on = Viesť históriu

## The moments

# Someone whose name the history does not know.
history-someone = Niekto
history-began = História sa začína
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = uchované menej podrobne
history-added = { $count ->
    [one] +1 znak
    [few] +{ $count } znaky
   *[other] +{ $count } znakov
}
history-removed = { $count ->
    [one] −1 znak
    [few] −{ $count } znaky
   *[other] −{ $count } znakov
}

## The map as it was

history-back = Späť do prítomnosti
history-as-it-was = Ako to bolo { $when }
history-marked = Čo sa od predchádzajúcej chvíle zmenilo, je vyznačené farbou toho, kto to zmenil.
history-map-not-there = Táto mapa vtedy ešte nebola.
history-added-by = Pridal(a) { $name }
history-removed-by = Odstránil(a) { $name }
history-changed-by = Zmenil(a) { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = odkaz
history-name-moment = Pomenovať túto chvíľu
history-name-placeholder = Ako ju nazvať
history-named = Chvíľa sa volá „{ $name }“.
history-bring-back-element = Vrátiť tento prvok, aký bol
history-bring-back-map = Vrátiť mapu, aká bola
history-brought-back = Vrátené, ako to bolo. Späť to vezme naspäť.
history-bring-back-failed = Nepodarilo sa to vrátiť.
history-open-copy = Otvoriť ako samostatný projekt
history-copy-name = { $name }, ako to bolo { $day }
history-copy-failed = Projekt sa nepodarilo vytvoriť.

## Archives

history-open-archive = Otvoriť archív…
history-archive-kind = História Glaukopisu
history-archive-unread = Archív sa nepodarilo prečítať.
history-archive-of = Archív: { $name }
history-archive-close = Zavrieť

## Settings

history-keep = Viesť históriu
history-room = História zaberá { $size }.
history-turn-off-title = Prestať viesť históriu?
history-turn-off-message = Čo bolo uchované, sa odstráni. Samotný projekt ostane, ako je.
history-turn-off-shared = Čo bolo uchované, sa odstráni, tu aj v počítačoch tých, s ktorými je projekt zdieľaný. Samotný projekt ostane, ako je.
history-turn-off = Odstrániť históriu
history-finely = Staršia história
history-finely-about = Staršie zmeny sa zlučujú, aby zaberali menej miesta a čítali sa rýchlejšie; chvíle v nich potom už nemožno rozlíšiť. Pomenované chvíle a tie, s ktorými porovnávajú revízie, sa zachovajú.
history-hourly = Zlúčiť každú hodinu do jednej po
history-weeks = { $count ->
    [one] týždni
    [few] týždňoch
   *[other] týždňoch
}
history-daily = Zlúčiť každý deň do jedného po
history-months = { $count ->
    [one] mesiaci
    [few] mesiacoch
   *[other] mesiacoch
}
history-before = Čo bolo predtým
history-before-choose = Vyberte chvíľu v histórii, aby ste archivovali alebo odstránili, čo bolo pred ňou.
history-before-about = Históriu pred { $when } možno archivovať do súboru, aby sa dala pozrieť neskôr, alebo odstrániť.
history-archive = Archivovať…
history-delete = Odstrániť
history-archive-title = Archivovať históriu pred { $when }?
history-delete-title = Odstrániť históriu pred { $when }?
history-cut-message = Čo ostane, sa začína projektom, aký bol vtedy.
history-cut-kept = { $count ->
    [one] Pred ňou je pomenovaná alebo revidovaná chvíľa, na ktorú sa tu už nebude dať pozrieť.
    [few] Pred ňou sú { $count } pomenované alebo revidované chvíle, na ktoré sa tu už nebude dať pozrieť.
   *[other] Pred ňou je { $count } pomenovaných alebo revidovaných chvíľ, na ktoré sa tu už nebude dať pozrieť.
}
history-cut-not-here = Históriu pred touto chvíľou nemožno vyňať.
history-cut-failed = Históriu sa nepodarilo vyňať.
history-archive-until = do { $when }
history-archived = História pred { $when } je archivovaná.
history-deleted = História pred { $when } je odstránená.
