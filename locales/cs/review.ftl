# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Změny
# The button over the text that opens the panel.
review-open = Revidovat změny
review-since-last = Od vaší poslední revize
review-since-beginning = Od začátku historie
review-since-session = Od chvíle, kdy { $who } začal(a), { $when }
review-since-named = Od „{ $name }“
# When the moment compared with was, under what it is.
review-since-when = Od { $when }
review-choose-since = Revidovat od jiné chvíle
review-own = I vaše vlastní změny
review-unit = Revidovat po
review-by-sentence = Větách
review-by-paragraph = Odstavcích
review-left = { $count ->
    [one] Zbývá jedna změna
    [few] Zbývají { $count } změny
   *[other] Zbývá { $count } změn
}
review-position = { $index } z { $count }
review-working = Zjišťují se změny…
review-failed = Změny nelze zjistit.
review-nothing = Nezbývá nic k revizi
review-nothing-text = Každá změna, kterou ostatní od té doby udělali, byla přijata.
review-list = Změny této mapy

## What a change is.

review-kind-changed = Změněno
review-kind-added = Nový text
review-kind-removed = Smazaný text
review-kind-moved = Přesunuto
review-kind-object = { $what ->
    [figure] Vyobrazení
    [table] Tabulka
    [equation] Rovnice
    [citation] Citace
    [math] Vzorec
    [footnote] Poznámka
    [crossref] Křížový odkaz
   *[other] Něco, co není text
}
review-kind-put-in = Vloženo: { $what }
review-kind-taken-out = Odstraněno: { $what }
review-kind-altered = Změněno: { $what }
review-element-added = Prvek přidán
review-element-removed = Prvek smazán
review-element-moved = Prvek přesunut
review-element-heading = Tiskne se jako nadpis
review-element-no-heading = Už se netiskne jako nadpis
review-element-excluded = Vynechán z dokumentu
review-element-included = Vrácen do dokumentu
review-element-other = Prvek změněn
# Where a change is: the name of the element.
review-in = V „{ $element }“
review-moved-from = Z „{ $element }“
review-untitled = Bez názvu
review-gone-element = Prvek, který už není
review-was = Jak to bylo
review-is = Jak to je
review-nothing-there = Nic
review-someone = Někdo
review-now-under = Teď pod „{ $element }“
review-was-under = Byl pod „{ $element }“

## What is done with a change.

review-accept = Přijmout
review-reject = Odmítnout
review-later = Později
review-previous = Předchozí
review-reject-cannot = Co bylo z mapy smazáno, nebo vyobrazení, které bylo odstraněno, se vrací z historie.
review-versions = Jeho historie
review-versions-count = { $count ->
    [one] Jedna verze
    [few] { $count } verze
   *[other] { $count } verzí
}
review-versions-reading = Čte se jeho historie…
review-versions-none = Mezi oběma konci se nic nestalo.
review-version-by = { $who }, { $when }
review-accept-up-to = Přijmout až sem
review-use-version = Použít tuto verzi

## Without the history.

review-no-history = Historie tohoto projektu se nevede
review-no-history-text = Změny se revidují z historie projektu, která říká, kdo co změnil a kdy. Vede se od chvíle, kdy je zapnuta.
review-turn-on = Vést historii
review-turn-on-elsewhere = Zapíná se s historií projektu.
