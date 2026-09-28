# Hvorfor en referanse i biblioteket kan være verket en kildehenvisning funnet
# i en tekst nevner, med få ord, på bokmål. Se locales/README.md.

## Etter det som skiller ett verk fra et annet.

core-found-same-zotero-item = samme element i Zotero
core-found-same-key = samme nøkkel
core-found-earlier-key = en nøkkel den hadde før
core-found-same-doi = samme DOI
core-found-same-isbn = samme ISBN
core-found-alike-in-all = lik i alt som skiller ett verk fra et annet
core-found-same-doi-other-title = samme DOI, men en annen tittel
core-found-same-isbn-other-title = samme ISBN, men en annen tittel
core-found-same-title-author-year = samme tittel, forfatter og år
core-found-alike = { $like ->
    [yes] { $same ->
        [author] samme forfatter, og en lignende tittel
        [year] samme år, og en lignende tittel
        [author-year] samme forfatter og år, og en lignende tittel
       *[none] en lignende tittel
    }
   *[no] { $same ->
        [author] samme forfatter
        [year] samme år
        [title] samme tittel
        [author-year] samme forfatter og år
        [author-title] samme forfatter og tittel
        [year-title] samme år og tittel
        [author-year-title] samme forfatter, år og tittel
       *[none] {""}
    }
}

## Etter ordene som nevner verket. Personene er referansens, slik listene
## viser dem: «Nagy og Lord».

core-found-another-year = { $people }, et annet år
core-found-behind = { $year }, og navnet er på en som står bak { $people }
core-found-name-like = { $year }, og et navn som ligner { $people }
core-found-cited-before = verket det ble vist til like før: { $why }
