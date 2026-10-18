# Orda i Glaukopis på nynorsk

Vala her gjeld i alle filene under `locales/nn/`. Engelsk er kjelda;
bokmålsomsetjinga (`locales/nb/`) er gjord av forfattaren av programmet, og
vala hennar er tekne med der dei er god nynorsk. Norma er Språkrådet si
nynorsknorm frå 2012.

Vala vart gjorde 2026-10-06 og utvida 2026-10-18, då grensesnittet hadde
fått oppsett, malar, dokumentinnstillingar, delar, panelet Utsjånad,
sjekklista, filene i biblioteket, språkpakkar og uglekartet, og eit
prosjekt hadde vorte eitt tre.

## Tiltaleform og språkdrag

- **Tiltale**: *du* (deg, din/di/ditt/dine), som programvare på norsk
  gjer i dag. Programmet sjølv er *vi* der det må seie noko om seg sjølv
  («ber oss vente»). Knappar og menyval står i imperativ: *Lagre*,
  *Slett*, *Gi nytt namn*.
- **Infinitiv**: e-infinitiv (å skrive, å lagre, å hente), gjennomført.
- **Pronomen for ting**: *den* og *det* etter kjønn, ikkje *han/ho*, som
  norma tillèt og som er lettast å lese på skjerm.
- **Fortid av bli**: *vart* (blir – vart – blitt). *Gi – gir – gav – gitt.*
  *Søkje – søkjer – søkte – søkt.* *Byrje* heller enn *begynne*.
- **Typografi**: «…» som hermeteikn, ellipse-teiknet … med mellomrom
  framfor, som i bokmålsfilene («Vel …»), tankestrek –.
- **Fleirtalsformer** i Fluent: `one` og `other`. Hokjønnsord får -er/-ene,
  hankjønnsord -ar/-ane, inkjekjønnsord -/-a.

## Arbeidet

- **project** — prosjekt (eit prosjekt, prosjektet, prosjekt, prosjekta):
  eitt tre av element, der det øvste elementet ber namnet på prosjektet
- **tree** — tre (eit tre, treet, tre, trea)
- **map** — kart (eit kart, kartet, kart, karta). Kva element som helst
  kan **opnast som kart** («Opne som kart»), og ein går **opp til**
  elementet over («Opp til «…»»)
- **the owl map** — **uglekartet**: alle prosjekta teikna som eit kart
  rundt ugla (ei ugle, ugla), med mappene som merkelappar; òg «kartet over
  prosjekta». Som i bokmål («Uglekartet»)
- **element** — element (eit element, elementet, element, elementa); kva
  element som helst kan skrivast ut som eit dokument
- **the centre** — midten (elementet i midten); der engelsk no seier *the
  element in view*: **elementet du står i**, som i bokmål
- **the diagram** — diagrammet
- **the text** — teksten; «tekstvising» for text mode der det trengst
- **passage** — stykke (eit stykke av teksten, det merkte stykket)
- **kind** — som i bokmål to ord etter kva det er slag av: **type** for
  element (ein type, typen, typar, typane: person, stad, hending) og
  **slag** for avsnitt og ord (eit slag, slaget, slag, slaga: sitat, vers,
  liste). Begge er tydingar, aldri utsjånad. Bokmål skriv «slag elementer»
  nokre stader i `template.ftl` og `document-window.ftl`, men «type» i
  `kinds.ftl` og `parts.ftl`; nynorsk held seg til **type** for element
  overalt: «typar av element», «typemenyen»
- **look** — utsjånad (utsjånaden); «korleis eit slag blir sett» der det
  les betre. Utsjånaden høyrer til oppsettet, ikkje til teksten
- **the Look panel** — **Utsjånad**: panelet ved sida av
  førehandsvisinga, der alt som avgjer korleis sidene ser ut, blir stilt
  inn; «Opne Utsjånad». Same ordet som for *Appearance* i innstillingane,
  som i bokmål («Utseende»)
- **layout** — **oppsett** (eit oppsett, oppsettet, oppsett, oppsetta):
  korleis sida i eit dokument ser ut — margar, skrifter, overskrifter,
  notar, utsjånaden til slaga. «Manuskript» er eit oppsett. Filene og
  koden kallar det *format*. Som i bokmål
- **format** — no berre om filformat (Word, PDF): eit format, formatet,
  format, formata. Der grensesnittet før sa *format* om korleis sida ser
  ut, seier det no **oppsett**. Meldingane frå kjernen som framleis seier
  *format* på engelsk (`core-export.ftl`), har «dokumentformat» som før,
  som i bokmål
- **template** — **mal** (ein mal, malen, malar, malane): kva eit
  dokument av eit slag består av — kva delar det har og i kva rekkjefølgje,
  kva typar og slag det legg i handa, kva oppsett og referansestil det tek
  med seg, kva det krev, og kva filer det lagar. Ein mal blir vald i
  dokumentinnstillingane til eit element, og går i arv nedover treet. Som
  i bokmål
- **document settings** — **dokumentinnstillingar**: vindauget med
  dokumentet til eit element — malen, opplysningane, delane, utsjånaden,
  språket og sjekklista; i menyen «Dokumentinnstillingar …». Som i bokmål
- **details** — opplysningar (tittel, forfattarar, dato, nøkkelord,
  identifikatorar)
- **part** — **del** (ein del, delen, delar, delane): ein type element som
  har ein plass i dokumentet — samandrag, tileigning, vedlegg, omslag.
  Plassane er **forstoff**, **etterstoff** og **omslaget** (eit omslag).
  Som i bokmål
- **checklist** — **sjekkliste** (ei sjekkliste, sjekklista): det malen
  krev, mot teksten og treet; **requirement** — krav
- **style** — stil, referansestil (berre om tilvisingar og litteraturlista)
- **document** — dokument
- **the manuscript** — manuskriptet
- **the preview** — førehandsvisinga
- **export** — eksportere, eksport
- **bring in** — hente inn (hentar inn, henta inn); frå Zotero blir
  referansar *importerte*, som i bokmål. Der engelsk no sjølv seier
  *import* (språkpakkar, ordbøker, «Import the text as a map»), står
  **importere**, som i bokmål

## Referansar og tilvisingar

- **the library** — biblioteket
- **reference** — referanse (ein referanse, referansen, referansar, referansane)
- **work** — verk
- **collection** — samling (ei samling, samlinga, samlingar, samlingane)
- **attachment** — vedlegg
- **note** (i biblioteket) — notat (eit notat, notatet, notat, notata); ein
  merknad i ein kommentartråd er **merknad**
- **citation** — kjeldetilvising (ei kjeldetilvising, kjeldetilvisinga,
  kjeldetilvisingar, kjeldetilvisingane); å sitere eit verk er «å vise til»
- **locator** — stad i verket (side, kapittel, vers, linje)
- **lookup** — oppslag; å slå opp
- **loose citations** — **lause kjeldetilvisingar** (ei laus
  kjeldetilvising, dei lause kjeldetilvisingane): kjeldetilvisingar i ein
  tekst som er henta inn utanfrå, kjende att, men enno ikkje knytte til
  ein referanse i biblioteket; på fana «Lause tilvisingar». Før 2026-10-18
  heitte dei *funne kjeldetilvisingar*. Bokmål: «Løse kildehenvisninger»
- **citation key** — nøkkel
- **the files of the library** — **filene i biblioteket**: eit eige lager
  ved sida av bileta, i eigne mapper; ei fil høyrer til ingen, éin eller
  fleire referansar. **assign** — gi til ein referanse; **unassigned** —
  utan referanse; **going-through** — gjennomgangen, å gå gjennom filene

## Ord og merke

- **foreign words** — anna språk; ord på eit anna språk
- **title of a work** — tittel på eit verk
- **term** — term
- **mention** — omtala ord
- **highlight** — utheving
- **marks** — merke (eit merke, merket, merke, merka): kursiv, feit,
  kapitelar, understreking, heva, senka, gjennomstreka, kode

## Bilete, figurar, tabellar og formlar

- **picture** — bilete (eit bilete, biletet, bilete, bileta)
- **the store** — biletlageret
- **figure** — figur (ein figur, figuren, figurar, figurane)
- **caption** — bilettekst under ein figur; tabelltekst over ein tabell;
  «teksten under/over» der begge er meinte
- **pointer** — kryssreferanse; å vise til
- **table** — tabell (ein tabell, tabellen, tabellar, tabellane)
- **formula** — formel (ein formel, formelen, formlar, formlane);
  **equation** — likning
- **placing** — plassering

## Tid, kommentarar, historikk

- **timeline** — tidslinje (ei tidslinje, tidslinja)
- **when** — når; tida eit element har
- **comment** — kommentar (ein kommentar, kommentaren, kommentarar,
  kommentarane); ein tråd blir **avgjord** (settled) og **opna att**
- **history** — historikk (historikken); eit **augneblink** i historikken
- **changes** / **review** — endringar / gjennomgang; å gå gjennom endringar
- **sharing**, **working together** — deling, å dele; samarbeid; ein
  **blir med i** eit delt prosjekt

## Lesing og kontroll

- **spelling** — staving, stavekontroll; **dictionary** — ordbok (ei
  ordbok, ordboka, ordbøker, ordbøkene); **own words** — eigne ord
- **reading text** / **OCR** — å lese teksten (i ein PDF eller eit
  bilete); ein PDF blir **gjord søkbar**
- **language package** — **språkpakke** (ein språkpakke, språkpakken,
  språkpakkar, språkpakkane): ordbøker for staving og språkfiler for OCR,
  importerte frå ein tenar; «tenaren for språkpakkar»
- **search** / **replace** / **found** — søk / byt ut / funne

## Grensesnittet

- **the rail** — skinna til venstre
- **the panel at the side** — sidepanelet
- **pane** — rute (ei rute, ruta), når to kart står side om side
- **the palette** — paletten (kommandopaletten)
- **the writing tools** — skriveverktøya
- **fold**, **fold away** — brette saman, brette bort; **unfold** — brette ut
- **settings** — innstillingar
- **data directory** — datamappa
- **folder** — mappe (ei mappe, mappa, mapper, mappene)
- **file** — fil (ei fil, fila, filer, filene)
- **window** — vindauge (eit vindauge, vindauget)
- **server** — tenar
- **credits** — bidrag og lisensar (som i bokmål)

## Namn som ikkje blir omsette

Som i `locales/GLOSSARY.md`: Glaukopis; Pandoc, Typst, Tesseract, Hunspell,
LaTeX, LuaLaTeX, BibLaTeX, Zotero, CSL, Markdown; filformat (DOCX, ODT,
PDF, EPUB, RTF, HTML, SVG, PNG); skrifter; referansestilar (APA, Chicago,
MLA); DOI, ISBN, ISSN, arXiv, URL; tastane som eit norsk tastatur skriv
dei (Ctrl, Shift, Alt, Enter, Escape).
