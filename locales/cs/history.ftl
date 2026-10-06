# The full history of a project, in English.
# See locales/README.md.

history-title = Historie
history-between = Mezi mapami a historií
history-settings = Nastavení historie
history-failed = Historii nelze přečíst.
history-reading = Čte se historie…

## When it is not kept

history-off = Historie tohoto projektu se nevede.
history-on-word = Každá změna se uchovává
history-off-word = Nevede se
history-off-about = Dokud se vede, uchovává se každá změna s tím, kdo ji udělal a kdy: na projekt se lze podívat, jak byl v kterékoli chvíli, a vrátit ho zpět. Zabírá místo a ve sdíleném projektu ukazuje ostatním, kdo co napsal a kdy.
history-turn-on = Vést historii

## The moments

# Someone whose name the history does not know.
history-someone = Někdo
history-began = Historie začíná
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = uchováno hruběji
history-added = { $count ->
    [one] +1 znak
    [few] +{ $count } znaky
   *[other] +{ $count } znaků
}
history-removed = { $count ->
    [one] −1 znak
    [few] −{ $count } znaky
   *[other] −{ $count } znaků
}

## The map as it was

history-back = Zpět do přítomnosti
history-as-it-was = Jak byla { $when }
history-marked = Co se od předchozí chvíle změnilo, je označeno barvou toho, kdo to změnil.
history-map-not-there = Tato mapa tehdy ještě nebyla.
history-added-by = Přidal(a) { $name }
history-removed-by = Odstranil(a) { $name }
history-changed-by = Změnil(a) { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = křížový odkaz
history-name-moment = Pojmenovat tuto chvíli
history-name-placeholder = Jak ji nazvat
history-named = Chvíle se jmenuje „{ $name }“.
history-bring-back-element = Vrátit tento prvek, jak byl
history-bring-back-map = Vrátit mapu, jak byla
history-brought-back = Vráceno, jak bylo. Zpět to vezme zpátky.
history-bring-back-failed = Nelze to vrátit.
history-open-copy = Otevřít jako samostatný projekt
history-copy-name = { $name }, jak byl { $day }
history-copy-failed = Projekt nelze vytvořit.

## Archives

history-open-archive = Otevřít archiv…
history-archive-kind = Historie Glaukopis
history-archive-unread = Archiv nelze přečíst.
history-archive-of = Archiv: { $name }
history-archive-close = Zavřít

## Settings

history-keep = Vést historii
history-room = Historie zabírá { $size }.
history-turn-off-title = Přestat vést historii?
history-turn-off-message = Co bylo uchováno, se smaže. Projekt sám zůstane, jak je.
history-turn-off-shared = Co bylo uchováno, se smaže, zde i na počítačích těch, s nimiž je projekt sdílen. Projekt sám zůstane, jak je.
history-turn-off = Smazat historii
history-finely = Starší historie
history-finely-about = Starší změny se slučují, aby zabíraly méně místa a četly se rychleji; chvíle uvnitř nich pak už nelze rozlišit. Pojmenované chvíle a ty, s nimiž srovnávají revize, zůstávají.
history-hourly = Každou hodinu sloučit v jednu po
history-weeks = { $count ->
    [one] týdnu
    [few] týdnech
   *[other] týdnech
}
history-daily = Každý den sloučit v jeden po
history-months = { $count ->
    [one] měsíci
    [few] měsících
   *[other] měsících
}
history-before = Co bylo dřív
history-before-choose = Zvolte chvíli v historii, abyste archivovali nebo smazali, co bylo před ní.
history-before-about = Historii před { $when } lze archivovat do souboru, k pozdějšímu nahlédnutí, nebo smazat.
history-archive = Archivovat…
history-delete = Smazat
history-archive-title = Archivovat historii před { $when }?
history-delete-title = Smazat historii před { $when }?
history-cut-message = Co zůstane, začíná projektem, jak byl tehdy.
history-cut-kept = { $count ->
    [one] Před ní je pojmenovaná nebo revidovaná chvíle, na niž se zde už nebude možné podívat.
    [few] Před ní jsou { $count } pojmenované nebo revidované chvíle, na něž se zde už nebude možné podívat.
   *[other] Před ní je { $count } pojmenovaných nebo revidovaných chvil, na něž se zde už nebude možné podívat.
}
history-cut-not-here = Historii před touto chvílí nelze vyjmout.
history-cut-failed = Historii nelze vyjmout.
history-archive-until = do { $when }
history-archived = Historie před { $when } je archivována.
history-deleted = Historie před { $when } je smazána.
