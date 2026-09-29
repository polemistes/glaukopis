# Søk: i teksten til et kart, i redigeringsboksen til et element, og
# gjennom alt. Se locales/README.md og docs/adr/0017.

## Linjen over en tekst

search-find = Søk
search-replace-with = Erstatt med
search-replace = Erstatt
search-replace-all = Erstatt alle
search-previous = Forrige
search-next = Neste
search-close = Lukk søket
search-show-replace = Erstatt også
search-hide-replace = Bare søk
# Hvilket av treffene som vises: «3 av 17».
search-count = { $current } av { $count }
search-found = { $count ->
    [one] Ett treff
   *[other] { $count } treff
}
search-nothing = Ingen treff
search-invalid = Ikke et regulært uttrykk
search-replaced = { $count ->
    [0] Ingenting erstattet
    [one] Ett erstattet
   *[other] { $count } erstattet
}

## Valgene

search-case = Store og små bokstaver slik de er skrevet
search-whole-words = Bare hele ord
search-accents = Bokstaver med og uten aksenter regnes like
search-accents-sign = é=e
search-regex = Et regulært uttrykk
search-selection = Bare i den markerte teksten
search-selection-none = Marker tekst først for å søke bare i den
search-labels = Også henvisninger, formler og ord som viser til noe
search-labels-outside = Også det som står utenfor tekstene

## Søket gjennom alt

search-everything = Søk
search-everything-title = Søk gjennom alt
search-everything-field = Søk i prosjektene
search-last-project = Det siste prosjektet
search-all-projects = Alle prosjekter
search-reading = Leser { $name } …
search-no-projects = Det er ingen prosjekter å søke i.
search-more = { $count ->
    [one] og ett til
   *[other] og { $count } til
}
search-in-project = { $count ->
    [one] Ett i dette prosjektet
   *[other] { $count } i dette prosjektet
}
search-everything-found = { $count ->
    [one] Ett treff
   *[other] { $count } treff
} { $projects ->
    [one] i ett prosjekt
   *[other] i { $projects } prosjekter
}
search-where-details = Opplysningene om dokumentet
# En assosiasjon som har et navn, med elementene i endene: «Del 1 ↔ Del 2».
search-where-association = Assosiasjonen { $ends }
search-where-note = Det du tenker om { $work }
# Står foran det som ble funnet i en note.
search-in-note = note
search-untitled = Uten navn
search-could-not-read = { $name } kunne ikke leses.
