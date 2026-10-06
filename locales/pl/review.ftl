# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Zmiany
# The button over the text that opens the panel.
review-open = Przejrzyj zmiany
review-since-last = Od ostatniego przeglądu
review-since-beginning = Od początku historii
review-since-session = Od początku pracy: { $who }, { $when }
review-since-named = Od „{ $name }”
# When the moment compared with was, under what it is.
review-since-when = Od { $when }
review-choose-since = Przejrzyj od innej chwili
review-own = Także twoje własne zmiany
review-unit = Przeglądaj
review-by-sentence = Zdaniami
review-by-paragraph = Akapitami
review-left = { $count ->
    [one] Została jedna zmiana
    [few] Zostały { $count } zmiany
    [many] Zostało { $count } zmian
   *[other] Zostało { $count } zmian
}
review-position = { $index } z { $count }
review-working = Ustalanie zmian…
review-failed = Nie udało się ustalić zmian.
review-nothing = Nie ma już nic do przejrzenia
review-nothing-text = Każda zmiana, jaką inni od tego czasu zrobili, została przyjęta.
review-list = Zmiany tej mapy

## What a change is.

review-kind-changed = Zmienione
review-kind-added = Nowy tekst
review-kind-removed = Usunięty tekst
review-kind-moved = Przeniesione
review-kind-object = { $what ->
    [figure] Rycina
    [table] Tabela
    [equation] Równanie
    [citation] Cytowanie
    [math] Wzór
    [footnote] Przypis
    [crossref] Odsyłacz
   *[other] Coś, co nie jest tekstem
}
review-kind-put-in = Wstawiono: { $what }
review-kind-taken-out = Usunięto: { $what }
review-kind-altered = Zmieniono: { $what }
review-element-added = Element dodany
review-element-removed = Element usunięty
review-element-moved = Element przeniesiony
review-element-heading = Drukowany jako nagłówek
review-element-no-heading = Już nie drukowany jako nagłówek
review-element-excluded = Pominięty w dokumencie
review-element-included = Przywrócony do dokumentu
review-element-other = Element zmieniony
# Where a change is: the name of the element.
review-in = W „{ $element }”
review-moved-from = Z „{ $element }”
review-untitled = Bez tytułu
review-gone-element = Element, którego już nie ma
review-was = Jak było
review-is = Jak jest
review-nothing-there = Nic
review-someone = Ktoś
review-now-under = Teraz pod „{ $element }”
review-was-under = Było pod „{ $element }”

## What is done with a change.

review-accept = Przyjmij
review-reject = Odrzuć
review-later = Później
review-previous = Poprzednia
review-reject-cannot = To, co usunięto z mapy, albo rycina, którą wyjęto, jest przywracane z historii.
review-versions = Jej historia
review-versions-count = { $count ->
    [one] Jedna wersja
    [few] { $count } wersje
    [many] { $count } wersji
   *[other] { $count } wersji
}
review-versions-reading = Czytanie jej historii…
review-versions-none = Między oboma końcami nic się nie wydarzyło.
review-version-by = { $who }, { $when }
review-accept-up-to = Przyjmij do tego miejsca
review-use-version = Użyj tej wersji

## Without the history.

review-no-history = Historia tego projektu nie jest prowadzona
review-no-history-text = Zmiany przegląda się na podstawie historii projektu, która mówi, kto co zmienił i kiedy. Jest prowadzona od chwili, gdy się ją włączy.
review-turn-on = Prowadź historię
review-turn-on-elsewhere = Włącza się ją razem z historią projektu.
