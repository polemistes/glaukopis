# Citations that were found in a text written elsewhere, and the panel at
# the side in which they are gone through (ADR 0015), in English. See
# locales/README.md.

## The panel.

found-title = Pronađeni citati
# On the tab of the panel, beside the other tabs: short.
found-tab = Pronađeni citati
found-between = Između mape i pronađenih citata
found-taken = Šta se uzima za citate
found-taken-always = Ono što je napravio program, i oznake
found-taken-years = Zagrade s godinom u njima
found-taken-named = Napomene koje imenuju djelo iz biblioteke
found-taken-notes = Svaka napomena
found-asking = Upit biblioteci…
found-make-certain = { $count ->
    [one] Napravi citat od onog koji je siguran
    [few] Napravi citate od { $count } koja su sigurna
   *[other] Napravi citate od { $count } koji su sigurni
}
found-made = { $count ->
    [one] Napravljen je jedan citat
    [few] Napravljena su { $count } citata
   *[other] Napravljeno je { $count } citata
}
found-made-undo = Ctrl+Z ih vraća, kao jedan korak.
found-library-failed = Biblioteku nije bilo moguće upitati.
found-nothing = Nema šta pregledati
found-nothing-looked = U ovoj mapi nije ostao nijedan pronađeni citat, a ništa u njoj ne liči na citat.
found-nothing-looked-more = U ovoj mapi nije ostao nijedan pronađeni citat, a ništa u njoj ne liči na citat. Gore se više toga može uzeti za citate.
found-nothing-not-looked = U ovoj mapi nije ostao nijedan pronađeni citat. Tekst koji samo liči na citat traži se kad gore kažete šta se za citat uzima: zagrade s godinom u njima, ili napomene.
found-list-label = Šta ima za pregled
found-untitled = Bez naslova
found-in-a-note = U napomeni
# The element of the map a citation stands in.
found-in = U „{ $element }“
found-in-note-of = U napomeni uz „{ $element }“
# Set small and high after the words a note stands after.
found-note-mark = napomena
found-position = { $index } od { $count }
found-previous = Prethodni
found-next = Sljedeći
found-list-show = Prikaži spisak
found-list-hide = Sakrij spisak
found-later = Kasnije
found-leave = Ostavi kao tekst
found-make = Napravi citat

## How sure the library is of what it proposes.

found-sure-certain = Biblioteka ga sigurno ima
found-sure-likely = Biblioteka ima ono što je vjerovatno on
found-sure-possible = Biblioteka ima ono što bi mogao biti on
found-sure-none = Neko njegovo djelo još nema referencu

## By what a citation was found.

found-by-zotero = Napravio Zotero
found-by-mendeley = Napravio Mendeley, ili program koji piše kao on
found-by-key = Oznaka koja imenuje referencu
found-by-form = Uzet za citat po izgledu

## The citation that is to be made.

found-the-citation = Citat
found-no-works = Ne imenuje nijedno djelo. Dodajte jedno ili ga ostavite kao tekst kakav jeste.
found-add-work = Dodaj djelo
found-author-in-text = Autor u tekstu: Nagy (1979)
found-pick-work = Djelo koje se citira: autor, naslov, godina
found-pick-add = Dodaj djelo u citat
found-too-little = Datoteka premalo kaže o ovom djelu da bi se od njega napravila referenca
found-reference-failed = Referencu nije bilo moguće napraviti

## A citation that stands in a note.

found-in-note = Stoji u napomeni
found-note-becomes = Napomena postaje citat
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = Ono što napomena još kaže ide prije i poslije njenih djela{ $has ->
        [before] : „{ $before }“ prije
        [after] : „{ $after }“ poslije
       *[both] : „{ $before }“ prije, „{ $after }“ poslije
    }. Stil citiranja smješta ga u red ili u napomenu.
found-note-style = Stil citiranja smješta ga u red ili u napomenu.
found-citation-in-note = Citat stoji u napomeni
    .hint = Napomena ostaje napomena, s ostalim što kaže.
found-for-all = Tako i za sve koji slijede
found-note-not = Ne stoji u napomeni.
# What else the note holds, by the name of what it is in the text.
found-note-holds = Napomena sadrži { $what ->
        [math] formulu
        [crossref] uputnicu
        [citation] citat
        [hard_break] drugi red
       *[other] nešto što nije tekst
    }, što riječi prije i poslije djela ne mogu sadržavati.
found-note-another = Napomena sadrži još jedan pronađeni citat, koji bi se izgubio u riječima poslije ovoga.

## Why what was asked could not be done.

found-trouble-gone = Više ga nema u tekstu.
found-trouble-changed = Tekst se ovdje promijenio otkako je predloženo, pa je ponovo pregledan.
found-trouble-cannot = Od njega se ovdje ne može napraviti citat.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } i { $second }
found-people-more = { $first } i dr.
found-work-a-work = Djelo
found-work-looking = { $work } se traži u vašoj biblioteci…
found-work-no-tag = { $work } je oznaka koju nema nijedna referenca iz vaše biblioteke.
found-work-not-found = { $work } nije pronađeno u vašoj biblioteci.
found-work-chosen = Vaš izbor
# The writer chose this reference for another citation of the same work, and this one followed.
found-work-followed = Kako ste odabrali za isto djelo
found-work-certain = Sigurno
found-work-likely = Vjerovatno
found-work-possible = Moguće
# What the text says the work is.
found-work-for = za „{ $work }“
found-work-others = Druge reference koje bi to mogle biti
found-work-or = Ili
found-work-may-be = Moglo bi biti
found-work-another = Druga…
found-work-find = Pronađi je…
found-work-add = Dodaj je u biblioteku
