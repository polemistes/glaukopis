# Maler: hva et dokument av et slag består av (ADR 0038). Gruppene deres,
# delene et dokument er laget av, filtypene, og redigeringen av en mal.

## Gruppene av maler, slik velgeren viser dem.

template-group-own = Dine egne
template-group-plain = Til å begynne med
template-group-article = Artikler og oppgaver
template-group-book = Bøker og avhandlinger
template-group-fiction = Skjønnlitteratur
template-group-stage = Scene og film
template-group-poetry = Lyrikk
template-group-other = Andre tekster
template-group-journal = Tidsskrifter
template-group-publisher = Forlag
template-group-style-guide = Stilguider

## Hvor et slag element står i dokumentet.

template-part-group-front = Forstoff
template-part-group-back = Etterstoff
template-part-group-cover = Omslag

## Delene av et dokument som programmet lager selv.

template-generated-half-title = Smusstittel
template-generated-title-page = Tittelside
template-generated-keywords = Nøkkelord
template-generated-contents = Innholdsfortegnelse
template-generated-list-of-figures = Figurliste
template-generated-list-of-tables = Tabelliste
template-generated-body = Teksten
template-generated-notes = Noter
template-generated-bibliography = Litteraturliste

## Filtypene en mal lager.

template-target-pdf = PDF
template-target-pdf-latex = PDF, satt med LaTeX
template-target-docx = Word
template-target-odt = LibreOffice Writer
template-target-latex = LaTeX
template-target-typst = Typst
template-target-markdown = Markdown
template-target-html = Nettside
template-target-epub = E-bok

## Redigeringen av en mal.

template-editor = Mal
template-name = Navnet på malen
# Navnet en egen mal først får, laget av navnet på malen den lages av.
template-name-changed = { $name }, endret
template-name-own = { $name }, min egen
template-sections = Delene av malen
template-bundled = Malene som følger med Glaukopis, forblir som de er. Endringene dine lagres som en egen mal.
template-delete = Slett denne malen
template-save-own = Lagre som min egen
template-saved = «{ $name }» er lagret blant dine egne maler
template-read-failed = Malen kunne ikke leses.
template-save-failed = Malen kunne ikke lagres.
template-delete-failed = Malen kunne ikke slettes.
template-keep-failed = Malen kunne ikke tas vare på i prosjektet. På en annen datamaskin, og i en fil av prosjektet, får dokumentet den vanlige malen i stedet.
template-delete-title = Slette malen «{ $name }»?
template-delete-message = Elementer som bruker den, vil bruke malen den ble laget av i stedet.
template-delete-confirm = Slett malen
template-leave-title = Gå ut uten å lagre?
template-leave-message = Endringene du har gjort i malen, går tapt.
template-leave-confirm = Gå ut
template-leave-cancel = Fortsett å redigere

## Delene av redigeringen, slik de velges til venstre.

template-section-about = Om denne malen
template-section-looks = Oppsett og referansestil
template-section-contents = Innhold
template-section-kinds = Slag elementer
template-section-passage-kinds = Slag avsnitt og ord
template-section-requirements = Krav
template-section-outputs = Filer

## Om malen.

template-description = Beskrivelse
template-group = Gruppe
template-based-on = Bygger på
template-based-on-none = Ingenting bestemt
template-source-changed = Du har endret denne malen; kilden beskriver det den ble laget av.
template-source-none = Denne malen følger ikke noe bestemt forlags krav.

## Oppsettet og referansestilen den bringer med seg.

template-layout = Oppsett
template-layout-hint = Hvordan siden ser ut, for hvert dokument med denne malen
template-style = Referansestil
template-style-hint = Hvordan kildehenvisningene og litteraturlisten skrives; står feltet tomt, gjelder oppsettets egen
# Oppsettet eller stilen skribenten har valgt i innstillingene.
template-usual = Den vanlige, fra innstillingene

## Innholdet: rekkefølgen i dokumentet.

template-contents-hint = Rekkefølgen i dokumentet: delene programmet lager selv, og hvert element av et slag, i treets rekkefølge. Et slag som står før teksten, er forstoff, et som står etter, etterstoff.
# Et punkt i innholdet som plasserer hvert element av et slag.
template-contents-kind = Hvert element av slaget { $name }
template-contents-add-part = En del …
template-contents-add-kind = Et slag element …
template-contents-up = Opp
template-contents-down = Ned

## Slagene i hånden.

template-kinds-hint = Slagene elementer malen legger i hånden: de tilbys i menyen over slag. De som står i innholdet, er i hånden enten de velges her eller ikke.
template-kinds-in-contents = Står i innholdet
template-passage-kinds-hint = Slagene avsnitt og ord malen legger i hånden: de tilbys først i skriveverktøyene.

## Kravene.

template-requirements-hint = Det et dokument med denne malen skal oppfylle. Sjekklisten og forhåndsvisningen teller mot disse; ingenting kuttes.
template-requirement-words = Ord i teksten
template-requirement-abstract-words = Ord i sammendraget
template-requirement-keywords = Nøkkelord
template-requirement-note = Hva grensene teller
template-requirement-note-placeholder = Noter tatt med; litteraturlisten ikke
# Ved siden av tallet 0, der enheten står.
template-no-limit = ingen grense

## Filene malen lager.

template-outputs-hint = Filtypene dokumentet tilbys som når det eksporteres.
template-output-document = Dokumentet
template-output-cover = Omslaget
template-output-cover-note = Et eget omslag lages i en senere utgave; det malen sier om det, beholdes som det er.

## Navnene på teksttypene som følger med Glaukopis, slik velgeren av hva du skriver og knappen
## over forhåndsvisningen gir dem; tidsskrifter, forlag og stilguider beholder sine egne.

template-called-plain = Vanlig dokument
template-called-paper = Oppgave
template-called-article = Tidsskriftartikkel
template-called-report = Rapport
template-called-book = Fagbok
template-called-thesis = Avhandling
template-called-novel = Roman
template-called-novel-manuscript = Romanmanus
template-called-short-story = Novelle
template-called-story-collection = Novellesamling
template-called-poems = Dikt
template-called-play = Skuespill
template-called-screenplay = Filmmanus
template-called-letter = Brev
template-called-blog-post = Blogginnlegg
template-called-news-article = Nyhetsartikkel

## Fewer words, stage 3: the requirement of anonymity, in Look and in the editor of a document type.

template-requirement-anonymity = Anonymt
