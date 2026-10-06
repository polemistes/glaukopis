# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Zmeny
# The button over the text that opens the panel.
review-open = Revidovať zmeny
review-since-last = Od vašej poslednej revízie
review-since-beginning = Od začiatku histórie
review-since-session = Odkedy { $who } začal(a), { $when }
review-since-named = Od „{ $name }“
# When the moment compared with was, under what it is.
review-since-when = Od { $when }
review-choose-since = Revidovať od inej chvíle
review-own = Aj vaše vlastné zmeny
review-unit = Revidovať po
review-by-sentence = Vetách
review-by-paragraph = Odsekoch
review-left = { $count ->
    [one] Ostáva jedna zmena
    [few] Ostávajú { $count } zmeny
   *[other] Ostáva { $count } zmien
}
review-position = { $index } z { $count }
review-working = Zisťujú sa zmeny…
review-failed = Zmeny sa nepodarilo zistiť.
review-nothing = Nie je čo revidovať
review-nothing-text = Každá zmena, ktorú odvtedy ostatní urobili, bola prijatá.
review-list = Zmeny tejto mapy

## What a change is.

review-kind-changed = Zmenené
review-kind-added = Nový text
review-kind-removed = Odstránený text
review-kind-moved = Presunuté
review-kind-object = { $what ->
    [figure] Vyobrazenie
    [table] Tabuľka
    [equation] Rovnica
    [citation] Citácia
    [math] Vzorec
    [footnote] Poznámka
    [crossref] Odkaz
   *[other] Niečo, čo nie je text
}
review-kind-put-in = { $what }: vložené
review-kind-taken-out = { $what }: vybrané
review-kind-altered = { $what }: zmenené
review-element-added = Prvok pridaný
review-element-removed = Prvok odstránený
review-element-moved = Prvok presunutý
review-element-heading = Tlačí sa ako nadpis
review-element-no-heading = Už sa netlačí ako nadpis
review-element-excluded = Vynechaný z dokumentu
review-element-included = Vrátený do dokumentu
review-element-other = Prvok zmenený
# Where a change is: the name of the element.
review-in = V „{ $element }“
review-moved-from = Z „{ $element }“
review-untitled = Bez názvu
review-gone-element = Prvok, ktorý už neexistuje
review-was = Ako to bolo
review-is = Ako to je
review-nothing-there = Nič
review-someone = Niekto
review-now-under = Teraz pod „{ $element }“
review-was-under = Bol pod „{ $element }“

## What is done with a change.

review-accept = Prijať
review-reject = Odmietnuť
review-later = Neskôr
review-previous = Predchádzajúca
review-reject-cannot = Čo bolo z mapy odstránené, alebo vybrané vyobrazenie, sa vráti z histórie.
review-versions = Jej história
review-versions-count = { $count ->
    [one] Jedna verzia
    [few] { $count } verzie
   *[other] { $count } verzií
}
review-versions-reading = Číta sa jej história…
review-versions-none = Medzi oboma koncami sa nič nestalo.
review-version-by = { $who }, { $when }
review-accept-up-to = Prijať až potiaľto
review-use-version = Použiť túto verziu

## Without the history.

review-no-history = História tohto projektu sa nevedie
review-no-history-text = Zmeny sa revidujú z histórie projektu, ktorá hovorí, kto čo zmenil a kedy. Vedie sa od chvíle, keď sa zapne.
review-turn-on = Viesť históriu
review-turn-on-elsewhere = Zapína sa s históriou projektu.
