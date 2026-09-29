# Figurer, formler og ligninger i teksten, og kryssreferanser til dem.
# Se locales/README.md.

## En figur, og panelet med det som kan sies om den.

figures-figure = Figur
figures-width = Bredde
figures-width-third = En tredel
figures-width-half = Halv
figures-width-three-quarters = Tre firedeler
figures-width-whole = Hel
figures-width-of-row = Av plassen den har i raden.
figures-width-of-text = Av tekstbredden i dokumentet.
figures-shows = Viser
figures-shows-placeholder = Med ord, for dem som ikke kan se det
figures-numbered = Nummerert, som «Figur 1»
figures-keep-caption = Lagre bildeteksten med bildet
figures-keep-caption-hint = Figurer som lages med dette bildet, begynner da med det som står her
figures-take-caption = Bruk bildets egen
figures-take-caption-hint = Det som er lagret med bildet, settes her i stedet for det som står nå
figures-another-picture = Et annet bilde …
figures-remove = Fjern figuren
figures-caption-kept = Lagret med bildet
figures-caption-kept-detail = Figurer som lages med det, begynner med disse ordene.
# Tittelen på vinduet der et bilde velges blant filene på datamaskinen.
figures-choose-picture = Et bilde
# Hva filene som kan velges der, kalles.
figures-picture-files = Bilder

## Bildelageret, slik teksten leser det.

figures-pictures-unread = Bildene kunne ikke leses
figures-picture-not-taken = Bildet kunne ikke hentes inn
figures-picture-not-kept = Det som ble sagt om bildet, kunne ikke lagres
figures-picture-not-removed = Bildet kunne ikke fjernes

## Hvor en figur, en tabell eller en ligning står.

figures-stands = Står
figures-stands-in-row = ved siden av andre, i en rad
figures-stands-alone = For seg selv igjen
# Sies om valgene av hvor den står; slaget er figur, tabell eller ligning.
figures-stands-where = Hvor { $kind ->
        [figure] figuren
        [table] tabellen
       *[equation] ligningen
    } står
figures-side-format = Som formatet
figures-side-left = Venstre
figures-side-middle = Midten
figures-side-right = Høyre
# Det formatet til dokumentet sier om hvor ting av et slag står. Flyten er
# ingen for ligninger, og for det som står i midten.
figures-usual = Formatet har { $kind ->
        [figure] figurer
        [table] tabeller
       *[equation] ligninger
    } { $side ->
        [left] til venstre
        [right] til høyre
       *[center] i midten
    }{ $flow ->
        [around] , med teksten rundt seg
        [apart] , atskilt fra teksten
       *[none] {""}
    }.
figures-text = Tekst
figures-flows-where = Om teksten flyter rundt { $kind ->
        [figure] figuren
        [table] tabellen
       *[equation] ligningen
    }
figures-flow-format = Som formatet
figures-flow-around = Flyter rundt
figures-flow-apart = Står for seg
figures-flow-at-side = Teksten flyter rundt det som står ved en side.
figures-beside = Sett den ved siden av den foran

## En formel i linjen, og en ligning på en egen linje.

figures-formula = Formel
figures-equation = Ligning
figures-equation-numbered = Nummerert
figures-formula-field = Formelen, skrevet som i TeX
figures-formula-empty = Det som skrives, vises her slik det vil stå.
figures-formula-hint = Skrives som i TeX. Enter når du er ferdig, Escape for å la den være som den var.
figures-equation-hint = Skrives som i TeX. Enter når du er ferdig, Shift+Enter for ny linje, Escape for å la den være som den var.
figures-formula-unread = Formelen kunne ikke leses.
# Vises i teksten der en formel ennå ikke har noe skrevet i seg.
figures-formula-blank = formel
figures-equation-blank = En ligning

## Det som kan settes inn i en formel med et trykk.

figures-sign-raised = Hevet
figures-sign-lowered = Senket
figures-sign-fraction = Brøk
figures-sign-root = Rot
figures-sign-sum = Sum
figures-sign-integral = Integral
figures-sign-brackets = Parenteser som vokser
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gamma
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Mindre enn eller lik
figures-sign-greater-or-equal = Større enn eller lik
figures-sign-not-equal = Ikke lik
figures-sign-nearly-equal = Omtrent lik
figures-sign-times = Ganger
figures-sign-plus-or-minus = Pluss eller minus
figures-sign-arrow = Pil
figures-sign-infinity = Uendelig
figures-sign-words = Ord i en formel

## Kryssreferanser til en figur, en tabell, en ligning eller en del.

figures-points-by = Viser
figures-form-full = Ordet og tallet
figures-form-number = Bare tallet
figures-form-equation = Tallet slik det står ved ligningen
figures-form-its-number = Nummeret
figures-form-its-name = Navnet
figures-go-to = Gå til det den viser til
figures-pointed-gone = Det denne viste til, er ikke i dokumentet
figures-point-elsewhere = Vis til noe annet …

## Å velge hva det skal vises til.

figures-targets = Velg hva det skal vises til
figures-targets-placeholder = Vis til en figur, en tabell, en ligning, en del
figures-targets-search = Søk i det som kan vises til
figures-targets-results = Det som kan vises til
figures-targets-figures = Figurer
figures-targets-tables = Tabeller
figures-targets-equations = Ligninger
figures-targets-parts = Deler av dokumentet
figures-targets-figure-unsaid = En figur uten bildetekst
figures-targets-table-unsaid = En tabell uten tabelltekst
figures-targets-no-match = Ingenting i dokumentet svarer til disse ordene.
figures-targets-none = Det er ingenting å vise til ennå: ingen figur, ingen tabell, ingen nummerert ligning, ingen del med navn.
figures-targets-hint = Ordene følger det de viser til: nummeret, og hva formatet kaller det.

## Vist av stilarket, der siden ikke har noe element for ordene.

figures-picture-absent = Bildet finnes ikke på denne datamaskinen
figures-caption-placeholder = Bildetekst
