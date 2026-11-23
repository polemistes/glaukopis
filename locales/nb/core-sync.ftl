# Det kjernen sier om synkronisering mellom skriverens enheter, på bokmål.
# Se locales/README.md.

## Det som ligger på disken.

# Byte som skulle være en endring i et dokument og ikke lar seg lese som det.
# Grunnen er bibliotekets, på engelsk.
core-sync-not-a-change = En endring i et dokument lar seg ikke lese: { $why }

## Tjeneren.

core-sync-old-server = Tjeneren på { $host } er eldre enn denne versjonen av Glaukopis og kan ikke synkronisere. Den må oppdateres.
core-sync-refused = Tjeneren slipper ikke lenger inn denne enheten. Den ble tatt ut av dem som synkroniseres, eller ingenting av dem er lenger lagret på tjeneren.
# Sies på en enhet der versjonen av Glaukopis er eldre enn formen på noe av det som synkroniseres: synkroniseringen har stoppet der, helt, til Glaukopis er oppdatert. Ordene er eierens.
core-sync-update-needed = Oppdatering trengs for synkronisering.

## Å slå det på, og enhetene.

core-sync-not-on = Denne enheten synkroniseres ikke.
core-sync-already = Denne enheten synkroniseres allerede.
core-sync-needs-name = Gi denne enheten et navn.
core-sync-remove-self = Denne enheten tas ut ved å stoppe synkroniseringen her.

## Det som ikke lot seg synkronisere. Grunnen er en setning for seg.

core-sync-problem-project = «{ $name }» lot seg ikke synkronisere. { $why }
core-sync-problem-notebook = Notatblokken lot seg ikke synkronisere. { $why }
core-sync-problem-library = Biblioteket lot seg ikke synkronisere. { $why }
# En fil i biblioteket, med navnet den har der.
core-sync-file-too-large = «{ $name }» er større enn tjeneren tar imot (høyst { $most } MB), og finnes ikke på de andre enhetene dine.
# Tjeneren har ikke plass til flere filer: hvor mange filer på denne enheten som ikke ble sendt av den grunn, de i notatene for seg (core-sync-server-full-notes). Sies så lenge det er slik.
core-sync-server-full = { $count ->
    [one] Tjeneren er full. Én fil finnes ikke på de andre enhetene dine.
   *[other] Tjeneren er full. { $count } filer finnes ikke på de andre enhetene dine.
}
# Det samme om filene som notater har, framfor alt bilder, sagt før de andre.
core-sync-server-full-notes = { $count ->
    [one] Tjeneren er full. Én fil i notatene dine finnes ikke på de andre enhetene dine.
   *[other] Tjeneren er full. { $count } filer i notatene dine finnes ikke på de andre enhetene dine.
}
core-sync-file-not-sent = «{ $name }» kunne ikke sendes til tjeneren. { $why }
core-sync-file-not-fetched = «{ $name }» kunne ikke hentes fra tjeneren. { $why }
core-sync-file-not-as-named = Det tjeneren ga, er ikke filen det ble bedt om: den ble skadet underveis eller der den lagres.
# Navnet på et prosjekt som kom fra en annen enhet og ikke sier noe navn selv.
core-sync-unnamed = Uten navn
