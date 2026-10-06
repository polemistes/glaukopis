# Timelines: when elements are, and a map seen along an axis of time.

timeline-title = Oś czasu
timeline-view = Oś czasu
timeline-settings = Oś czasu
timeline-axis = Oś
timeline-axis-dates = Daty
timeline-axis-units = Własne jednostki
timeline-dates-hint = Lata, z BC tam, gdzie trzeba: 431 BC, c. 480 BCE, May 1453, 1453-05-29, 5th century BC.
timeline-unit = Jak nazywa się jednostka
timeline-unit-placeholder = rok, dzień, cykl…
timeline-units-hint = Czasy to liczby jednostek: Rok 12, Dzień 3 albo po prostu 12. Mogą być ujemne.
timeline-lanes = Tory
timeline-lanes-given = Każde dziecko środka jest torem, póki nie wybierzesz inaczej. Tor mieści to, co umieszczono w jego gałęzi; jego własne umieszczenie, jeśli je ma, jest rozpiętością toru.
timeline-lanes-chosen = Wybrane przez ciebie tory, w kolejności tekstu.
timeline-lanes-reset = Znów każde dziecko środka
timeline-one-lane = Jeden tor
timeline-each-child = { $count ->
    [one] Jego dziecko torem
    [few] Każde z { $count } dzieci torem
    [many] Każde z { $count } dzieci torem
   *[other] Każde z { $count } dzieci torem
}
timeline-no-branches = Mapa nie ma jeszcze nic pod swoim środkiem.
timeline-lanes-by-kind = Tory według rodzaju
timeline-lanes-by-kind-hint = Każdy element danego rodzaju osobnym torem: każda postać, każde miejsce.
timeline-each-of-kind = Każdy torem
timeline-chronology = Dodaj do mapy chronologię
timeline-chronology-hint = Element z tabelą wszystkiego, co umieszczono, w porządku czasu, do pisania i drukowania
timeline-chronology-title = Chronologia
timeline-chronology-when = Kiedy
timeline-chronology-what = Co
timeline-chronology-made = Do mapy dodano chronologię
timeline-elsewhere = Gdzie indziej w mapie
timeline-elsewhere-chosen = Tory są wybrane: to, co nie stoi w żadnym z nich, stoi tutaj. Naciśnij, by wybrać tory na nowo.
timeline-ordered = Po kolei, bez dat
timeline-empty = Nic jeszcze nie mówi, kiedy jest. Wybierz „Powiedz, kiedy jest…” z menu elementu.
timeline-unplaced = { $count ->
    [one] Jednego elementu nie udało się umieścić:
    [few] { $count } elementów nie udało się umieścić:
    [many] { $count } elementów nie udało się umieścić:
   *[other] { $count } elementów nie udało się umieścić:
}
timeline-contradiction = nie może być tam, gdzie mówi, że jest
# Dragging what is placed, and placing what is not.
timeline-moving = Przesuwaj przeciąganiem
timeline-moving-hint = Przeciągnij element wzdłuż osi albo brzeg okresu, by zmienić jego czas; wyłączone, by nic nie przesunęło się przez pomyłkę
timeline-without = Elementy bez czasu
timeline-without-hint = Przeciągnij któryś na oś czasu albo naciśnij go, by powiedzieć, kiedy jest:
timeline-waiting-hint = Nic jeszcze nie mówi o swoim czasie: naciśnij go, by powiedzieć, kiedy jest, albo przeciągnij wzdłuż toru, by go umieścić
timeline-unknown = odnosi się do tego, co nie jest umieszczone, albo do czasu, którego nie da się odczytać

## Saying when an element is
when-title = Kiedy jest
when-say = Powiedz, kiedy jest…
when-change = Kiedy jest…
when-clear = Już nie mów
when-kind = W punkcie czy w okresie
when-point = W punkcie
when-span = W okresie
when-when = Kiedy
when-start = Od
when-end = Do
when-at = W czasie
when-after = Po elemencie
when-before = Przed elementem
when-between = Między dwoma elementami
when-during = Podczas elementu
when-time = Czas
when-time-placeholder = 431 BC, May 1453, c. 480…
when-unit-placeholder = Rok 12, Dzień 3, 12…
when-unread = Nie da się tego odczytać jako czasu.
when-after-what = Po
when-before-what = Przed
when-during-what = Podczas
when-choose = Wybierz element…
when-approx = W przybliżeniu
# A margin either side of a written time, drawn fading away both ways from it.
when-margin = Plus minus
when-margin-placeholder = 5 years, 3 months, 10 days…
when-margin-unit-placeholder = 5…
when-margin-unread = Nie da się tego odczytać jako długości czasu.
when-hint-dates = Czyta się lata, daty, miesiące, wieki i dekady, z BC lub BCE tam, gdzie trzeba. Rok oznacza cały rok.
when-hint-units = Czasy to liczby jednostek osi czasu, ustawianej pod jej torami. „Rok 12” i „12” to to samo.
when-bc = p.n.e.
# $month: 1 to 12; $year: as written.
when-month-of = { $year }, miesiąc { $month }
# How a placement is said beside the element: "after the quarrel, before the embassy".
when-said-after = po
when-said-before = przed
when-said-during = podczas
when-said-to = do
when-said-approx = ok.
