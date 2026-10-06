# The full history of a project, in English.
# See locales/README.md.

history-title = Historia
history-between = Między mapami a historią
history-settings = Ustawienia historii
history-failed = Nie udało się odczytać historii.
history-reading = Czytanie historii…

## When it is not kept

history-off = Historia tego projektu nie jest prowadzona.
history-on-word = Każda zmiana jest zachowywana
history-off-word = Nieprowadzona
history-off-about = Gdy jest prowadzona, każda zmiana zostaje zachowana, z tym, kto ją zrobił i kiedy: projekt można obejrzeć takim, jaki był w dowolnej chwili, i przywrócić. Zajmuje to miejsce, a w projekcie udostępnionym pokazuje innym, kto co napisał i kiedy.
history-turn-on = Prowadź historię

## The moments

# Someone whose name the history does not know.
history-someone = Ktoś
history-began = Historia się zaczyna
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = zachowane mniej dokładnie
history-added = { $count ->
    [one] +1 znak
    [few] +{ $count } znaki
    [many] +{ $count } znaków
   *[other] +{ $count } znaków
}
history-removed = { $count ->
    [one] −1 znak
    [few] −{ $count } znaki
    [many] −{ $count } znaków
   *[other] −{ $count } znaków
}

## The map as it was

history-back = Z powrotem do teraz
history-as-it-was = Stan z { $when }
history-marked = To, co zmieniło się od poprzedniej chwili, jest oznaczone kolorem tego, kto to zmienił.
history-map-not-there = Tej mapy wtedy nie było.
history-added-by = Dodane przez { $name }
history-removed-by = Usunięte przez { $name }
history-changed-by = Zmienione przez { $name }
# A cross-reference to a figure, a table or a part, where it is not known what it said.
history-pointer = odsyłacz
history-name-moment = Nazwij tę chwilę
history-name-placeholder = Jak ją nazwać
history-named = Ta chwila nazywa się „{ $name }”.
history-bring-back-element = Przywróć ten element, jak był
history-bring-back-map = Przywróć mapę, jak była
history-brought-back = Przywrócono, jak było. Cofnij to wycofuje.
history-bring-back-failed = Nie udało się przywrócić.
history-open-copy = Otwórz jako osobny projekt
history-copy-name = { $name }, stan z { $day }
history-copy-failed = Nie udało się utworzyć projektu.

## Archives

history-open-archive = Otwórz archiwum…
history-archive-kind = Historia Glaukopis
history-archive-unread = Nie udało się odczytać archiwum.
history-archive-of = Archiwum: { $name }
history-archive-close = Zamknij

## Settings

history-keep = Prowadź historię
history-room = Historia zajmuje { $size }.
history-turn-off-title = Przestać prowadzić historię?
history-turn-off-message = To, co zachowano, zostanie usunięte. Sam projekt pozostaje, jak jest.
history-turn-off-shared = To, co zachowano, zostanie usunięte tutaj i na komputerach tych, którym projekt udostępniono. Sam projekt pozostaje, jak jest.
history-turn-off = Usuń historię
history-finely = Starsza historia
history-finely-about = Starsze zmiany są scalane, by zajmowały mniej miejsca i czytały się szybciej; chwil w ich obrębie nie da się już wtedy rozróżnić. Chwile nazwane oraz te, z którymi porównują przeglądy, są zachowywane.
history-hourly = Scalaj każdą godzinę w jedną po
history-weeks = { $count ->
    [one] tygodniu
    [few] tygodniach
    [many] tygodniach
   *[other] tygodniach
}
history-daily = Scalaj każdy dzień w jeden po
history-months = { $count ->
    [one] miesiącu
    [few] miesiącach
    [many] miesiącach
   *[other] miesiącach
}
history-before = Co było wcześniej
history-before-choose = Wybierz chwilę w historii, by zarchiwizować lub usunąć to, co było przed nią.
history-before-about = Historię sprzed { $when } można zarchiwizować w pliku, by obejrzeć ją później, albo usunąć.
history-archive = Archiwizuj…
history-delete = Usuń
history-archive-title = Zarchiwizować historię sprzed { $when }?
history-delete-title = Usunąć historię sprzed { $when }?
history-cut-message = To, co zostanie, zaczyna się od projektu, jaki był wtedy.
history-cut-kept = { $count ->
    [one] Przed nią jest jedna nazwana lub przeglądana chwila, której nie da się już tu obejrzeć.
    [few] Przed nią są { $count } nazwane lub przeglądane chwile, których nie da się już tu obejrzeć.
    [many] Przed nią jest { $count } nazwanych lub przeglądanych chwil, których nie da się już tu obejrzeć.
   *[other] Przed nią jest { $count } nazwanych lub przeglądanych chwil, których nie da się już tu obejrzeć.
}
history-cut-not-here = Historii nie da się wyciąć przed tą chwilą.
history-cut-failed = Nie udało się wyciąć historii.
history-archive-until = do { $when }
history-archived = Historia sprzed { $when } została zarchiwizowana.
history-deleted = Historia sprzed { $when } została usunięta.
