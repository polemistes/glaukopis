# Gjennomgang av endringer i ettertid (ADR 0022): panelet med endringer ved
# siden av teksten, på bokmål. Se locales/README.md.

review-title = Endringer
review-open = Gå gjennom endringer
review-since-last = Siden du sist gikk gjennom
review-since-beginning = Siden historikken begynte
review-since-session = Siden { $who } begynte, { $when }
review-since-named = Siden «{ $name }»
review-since-when = Fra { $when }
review-choose-since = Gå gjennom fra et annet tidspunkt
review-own = Dine egne endringer også
review-unit = Gå gjennom etter
review-by-sentence = Setning
review-by-paragraph = Avsnitt
review-left = { $count ->
    [one] Én endring igjen
   *[other] { $count } endringer igjen
}
review-position = { $index } av { $count }
review-working = Finner endringene …
review-failed = Endringene kunne ikke finnes.
review-nothing = Ingenting igjen å gå gjennom
review-nothing-text = Alle endringene de andre har gjort siden da, er godtatt.
review-list = Endringene i dette kartet

## Hva en endring er.

review-kind-changed = Endret
review-kind-added = Ny tekst
review-kind-removed = Slettet tekst
review-kind-moved = Flyttet
review-kind-object = { $what ->
    [figure] Figur
    [table] Tabell
    [equation] Ligning
    [citation] Kildehenvisning
    [math] Formel
    [footnote] Note
    [crossref] Kryssreferanse
   *[other] Noe som ikke er tekst
}
review-kind-put-in = { $what } satt inn
review-kind-taken-out = { $what } tatt ut
review-kind-altered = { $what } endret
review-element-added = Element lagt til
review-element-removed = Element slettet
review-element-moved = Element flyttet
review-element-heading = Skrives ut som overskrift
review-element-no-heading = Skrives ikke lenger ut som overskrift
review-element-excluded = Utelatt fra dokumentet
review-element-included = Tatt med i dokumentet igjen
review-element-other = Element endret
review-in = I «{ $element }»
review-moved-from = Fra «{ $element }»
review-untitled = Uten navn
review-gone-element = Et element som ikke finnes lenger
review-was = Slik det var
review-is = Slik det er
review-nothing-there = Ingenting
review-someone = Noen
review-now-under = Nå under «{ $element }»
review-was-under = Var under «{ $element }»

## Hva som gjøres med en endring.

review-accept = Godta
review-reject = Avvis
review-later = Senere
review-previous = Den forrige
review-reject-cannot = Det som er slettet fra kartet, eller en figur som er tatt ut, hentes tilbake fra historikken.
review-versions = Historikken
review-versions-count = { $count ->
    [one] Én versjon
   *[other] { $count } versjoner
}
review-versions-reading = Leser historikken …
review-versions-none = Ingenting skjedde mellom de to endene.
review-version-by = { $who }, { $when }
review-accept-up-to = Godta hit
review-use-version = Bruk denne versjonen

## Uten historikk.

review-no-history = Historikken for dette prosjektet tas ikke vare på
review-no-history-text = Endringer gås gjennom ut fra prosjektets historikk, som forteller hvem som endret hva, og når. Den tas vare på fra den blir slått på.
review-turn-on = Ta vare på historikken
review-turn-on-elsewhere = Den slås på sammen med prosjektets historikk.
