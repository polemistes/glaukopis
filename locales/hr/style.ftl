# Reference styles: their kinds, the search for more, and the style editor,
# with the words it tells the parts of a style by.

## The kinds of reference style, as the styles are grouped by them.

style-kind-note = Bilješke
style-kind-author-date = Autor i godina
style-kind-numeric = Brojevi
style-kind-label = Oznake
style-kind-author = Autor
style-kind-other = Ostalo

## The search for reference styles of journals and publishers.

style-browser = Citatni stilovi
style-browser-subtitle = Više od deset tisuća stilova časopisa i nakladnika, po nazivu
style-browser-placeholder = Naziv časopisa, nakladnika ili stila
style-browser-search = Pretraži stilove
# Beside a style that has been fetched already.
style-browser-here = Ovdje
style-browser-fetch = Dohvati
style-browser-none-found = Nijedan stil nema te riječi u nazivu.
style-browser-about = Stilovi se dohvaćaju iz repozitorija projekta Citation Style Language i čuvaju uz vaše vlastite. One koje imate možete u uređivaču stilova prilagoditi željama nakladnika.
style-browser-import = Uvezi datoteku…
style-browser-import-title = Uvezi citatni stil
style-browser-fetch-failed = Stil nije bilo moguće dohvatiti.
style-browser-file-unread = Datoteku nije bilo moguće pročitati.

## The style editor.

style-editor = Citatni stil
style-name = Naziv stila
# The name a style of one's own is first given, made from that of the style it is made from.
style-name-changed = { $name }, izmijenjen
style-depth = Koliko duboko ići
style-depth-options = Uobičajene izmjene
style-depth-parts = Dio po dio
style-depth-source = Izvor
style-scope = Što mijenjati
style-scope-citations = Citate
style-scope-notes = Bilješke
style-scope-bibliography = Popis literature
style-bundled = Stilovi koji dolaze s Glaukopisom ostaju kakvi jesu. Vaše se izmjene spremaju kao vlastiti stil.
style-delete = Izbriši ovaj stil
style-save-own = Spremi kao vlastiti
style-saved = „{ $name }” spremljen je među vaše stilove
style-read-failed = Stil nije bilo moguće pročitati.
style-save-failed = Stil nije bilo moguće spremiti.
style-delete-failed = Stil nije bilo moguće izbrisati.
style-delete-title = Izbrisati stil „{ $name }”?
style-delete-message = Mape koje ga koriste koristit će umjesto njega drugi stil.
style-delete-confirm = Izbriši stil
style-leave-title = Otići bez spremanja?
style-leave-message = Izmjene koje ste načinili u stilu bit će izgubljene.
style-leave-confirm = Otiđi
style-leave-cancel = Nastavi uređivati

## Common changes: names.

style-names = Imena
# A sentence with two fields in it, where numbers are written: the least number of
# authors for which "et al." is used, and how many are named before it.
style-et-al = Uz { $min } ili više autora navedi prvih { $first } i „i dr.”
style-et-al-min = Broj autora od kojega se koristi „i dr.”
style-et-al-first = Broj autora navedenih prije „i dr.”
style-et-al-empty = Ako je prazno, navode se svi
# As the one before, for a work that has been cited before.
style-et-al-again = Pri ponovnom citiranju, uz { $min } ili više navedi prvih { $first }
style-et-al-again-min = Broj autora od kojega se u kasnijim citatima koristi „i dr.”
style-et-al-again-first = Broj autora navedenih u kasnijim citatima
style-et-al-again-empty = Ako je prazno, kao prvi put
style-before-last-name = Ispred posljednjeg imena
# The word the style prints there, in the language of the document.
style-and-word = i
style-and-nothing = Ništa
style-as-the-style-has-it = Kako stil ima
style-comma-before-last = Zarez ispred njega
style-comma-contextual = Uz tri imena ili više: A, B, i C
style-comma-always = Uvijek: A, i B
style-comma-never = Nikad: A, B i C
style-comma-after-inverted = Iza imena koje je okrenuto
style-given-names = Imena
style-given-full = Puna: John Miles
style-given-spaced = Inicijali: J. M.
style-given-close = Inicijali, zbijeno: J.M.
style-given-bare = Inicijali bez točaka: JM
style-given-bare-spaced = Inicijali bez točaka: J M
style-family-first = Prezime prvo
style-family-first-none = Ni za koga: John Foley
style-family-first-first = Za prvog autora: Foley, John, i Robert Fowler
style-family-first-all = Za sve: Foley, John, i Fowler, Robert
style-sort-separator = Između prezimena i imena
style-sort-separator-hint = Kad je prezime prvo

## Common changes: the citation, or the note, and the entries of the bibliography.

style-the-citation = Citat
style-the-note = Bilješka
style-begins-with = Počinje s
style-ends-with = Završava s
style-between-works = Između djela citiranih zajedno
style-collapse = Djela jednog autora citirana zajedno
style-collapse-none = Svako u cijelosti
style-collapse-year = Ime jednom: Nagy 1979, 1996
style-collapse-year-suffix = I godina jednom: Nagy 1979a, b
style-collapse-year-suffix-ranged = S rasponima: Nagy 1979a–c
style-collapse-citation-number = Brojevi kao rasponi: [1–3]
style-disambiguate = Kad bi se dva djela citirala jednako
style-disambiguate-year-suffix = Dodaj slovo godini
style-disambiguate-names = Navedi više autora
style-disambiguate-given-names = Dodaj imena ili inicijale
style-near-note = Bilješka se smatra bliskom unutar
style-near-note-hint = Bilježaka; za stilove koji skraćuju ono što je citirano u blizini
style-entries = Jedinice
style-entry-ends-with = Svaka završava s
style-author-repeated = Za ponovljenog autora
style-author-repeated-hint = Umjesto imena, u jedinicama iza prve
style-hanging-indent = Viseća uvlaka
style-hanging-indent-hint = Koliko duboko, odlučuje format dokumenta
style-second-field = Brojevi ili oznake stoje
style-second-field-line = U retku
style-second-field-column = U zasebnom stupcu
style-second-field-margin = Na margini
style-second-field-hint = Za stilove koji numeriraju svoje jedinice

## Common changes: throughout the style.

style-throughout = U cijelom stilu
style-page-ranges = Rasponi stranica
style-page-ranges-as-entered = Kako su uneseni
style-page-ranges-expanded = U cijelosti: 321–328
style-page-ranges-minimal = Najkraće: 321–8
style-page-ranges-minimal-two = Barem dvije znamenke: 321–28
style-page-ranges-chicago = Kako ima Chicago Manual
style-particles = „van”, „de”, „von” ispred prezimena
style-particles-never = Ostaju uz njega, a razvrstava se pod v, d
style-particles-sort-only = Ostaju uz njega, ali se po njima ne razvrstava
style-particles-display-and-sort = Idu iza imena: Gogh, Vincent van
style-hyphen = Spojnica između inicijala
style-hyphen-hint = J.-P. Sartre, ne J.P. Sartre
style-locale = Riječi stila su na jeziku
style-locale-document = Jezik dokumenta
style-locale-hint = „ur.”, „u”, „pristupljeno”, mjeseci

## Part by part.

# The scope is citation or bibliography.
style-parts-of = { $scope ->
    [citation] Dijelovi citata
   *[bibliography] Dijelovi popisa literature
}
style-parts-none = { $scope ->
    [citation] Ovaj stil nema citata.
   *[bibliography] Ovaj stil nema popisa literature.
}
style-parts-hint = Odaberite dio lijevo da promijenite kako se tiska: što stoji prije i poslije njega, njegovo pismo, velika slova. Dijelovi se otvaraju da pokažu od čega su načinjeni.
style-part-unfold = Otvori
style-part-fold = Zatvori
style-part-up = Pomakni gore
style-part-down = Pomakni dolje
style-part-add-after = Dodaj iza njega
style-part-take-away = Makni
style-part-add-within = Dodaj unutar njega
# A part of a macro: a part of the style that is used in several places.
style-part-shared = { $count ->
    [one] Ovo pripada „{ $macro }”, koji se koristi na { $count } mjestu. Izmjena ovdje vidi se na svima.
    [few] Ovo pripada „{ $macro }”, koji se koristi na { $count } mjesta. Izmjena ovdje vidi se na svima.
   *[other] Ovo pripada „{ $macro }”, koji se koristi na { $count } mjesta. Izmjena ovdje vidi se na svima.
}
style-add-words = Vlastite riječi
style-add-words-hint = Poput „u”, „pristupljeno”, ili interpunkcije
# Over the fields of a reference that a part can print.
style-add-from-reference = Iz reference
style-part-words = Riječi
style-part-before = Ispred njega
style-part-before-hint = Tiska se samo kad se tiska i sam dio
style-part-after = Iza njega
style-part-between = Između njegovih dijelova
style-slant = Nagib
style-slant-upright = Uspravno
style-slant-italic = Kurziv
style-weight = Debljina
style-weight-regular = Obično
style-weight-bold = Podebljano
style-letters = Slova
style-letters-as-written = Kako je napisano
style-letters-small-caps = Kapitalke
style-case = Velika slova
style-case-as-entered = Kako je uneseno
style-case-title = Naslovna Velika Slova
style-case-sentence = Kao u rečenici
style-case-capitalize-first = Prvo slovo veliko
style-case-capitalize-all = Svaka Riječ Velikim Slovom
style-case-uppercase = VELIKA SLOVA
style-case-lowercase = mala slova
style-height = Visina
style-height-baseline = Na retku
style-height-raised = Podignuto
style-height-lowered = Spušteno
style-quotes = U navodnicima
style-strip-periods = Bez točaka
style-strip-periods-hint = Za kratice: „ur” za „ur.”
style-text-form = Oblik
style-text-form-long = U cijelosti
style-text-form-short = Kratko, gdje ga referenca ima
style-term-form = Oblik riječi
style-term-form-long = U cijelosti: urednik, stranica
style-term-form-short = Kratko: ur., str.
style-term-form-verb = Kao glagol: uredio
style-term-form-verb-short = Kao glagol, kratko: ur.
style-term-form-symbol = Kao znak: §
style-date-parts = Datum se navodi
style-date-parts-year = Samo kao godina
style-date-parts-year-month = Kao godina i mjesec
style-date-parts-full = U cijelosti

## The source of the style, and the sample it is tried on.

style-source = Izvor stila
style-source-try = Isprobaj
style-source-unread = Izvor nije bilo moguće pročitati.
style-sample-unusable = Stil se ne može koristiti ovakav kakav jest
style-sample-failed = Stil nije bilo moguće isprobati.
style-sample-in-text = U tekstu
style-sample-in-notes = U bilješkama
style-sample-in-bibliography = U popisu literature
style-sample-cited = Citirano djelo
style-sample-same-page = Isto, na stranici
style-sample-another = Drugo, s riječju ispred
style-sample-first-again = Opet prvo, na poglavlju
style-sample-together = Dva djela zajedno
style-sample-in-sentence = S autorom u rečenici
style-sample-examples = Prikazano na primjerima: vaša je knjižnica prazna.
style-sample-library = Prikazano na djelima iz vaše knjižnice.

## The source of a style, where it cannot be read as one.

style-source-not-xml = Izvor nije ispravno oblikovan XML.
style-source-not-style = Ovo nije stil: ne počinje sa <style>.
style-source-dependent = Stil nema <citation>: samo imenuje drugi stil i ne može se mijenjati.

## The parts of a style, as the style editor tells them in words.

style-part-layout = Cjelina
style-part-text = Tekst
# A part that prints a word of the style's language: the term is its name in CSL.
style-part-term = Riječ za „{ $term }”
# A part that prints words written into the style.
style-part-value = Riječi „{ $value }”
style-part-name = Kako se pišu imena
# The name is family or given, as CSL has them.
style-part-name-part = { $name ->
    [family] Prezime
    [given] Ime
   *[other] Ime ({ $name })
}
style-part-et-al = „i dr.”
# The variables are one or more of those below: "the pages".
style-part-label = Riječ ispred: { $variables } („str.”, „ur.”)
style-part-role = Riječ za ulogu („ur.”, „prev.”)
style-part-substitute = Kad takvog imena nema, umjesto njega
# The name is day, month or year, as CSL has them, or part.
style-part-date-part = { $name ->
    [day] Dan
    [month] Mjesec
    [year] Godina
   *[other] { $name }
}
style-part-group = Zajedno
style-part-choose = Jedno od ovoga
# The condition is made of those below.
style-part-if = Ako { $condition }
style-part-else-if = Inače, ako { $condition }
style-part-else = Inače
# A name the style has, of a part of it (a macro) or of a variable it does not know.
style-quoted = „{ $text }”

## Words that join others: "the author, or else the editor", "a book or a chapter".
## The first may be a list of several, joined by commas.

style-or = { $first } ili { $last }
style-and = { $first } i { $last }
style-or-else = { $first }, a inače { $last }

## When a part of a style is printed: "If the work is a book".

style-if-type = je djelo { $types }
style-if-has = postoji { $variables }
style-if-lacks = nedostaje { $variables }
style-if-numeric = je brojčano: { $variables }
style-if-uncertain = je nesigurno: { $variables }
# The places are pages, chapters, verses and the like; see style-locator.
style-if-locator = je citirano mjesto { $locators }
style-if-disambiguate = bi se inače zamijenilo s drugim
style-if-always = uvijek
style-if-none-holds = ništa od ovoga ne vrijedi: { $conditions }
# A kind of place that a citation points to, as CSL names it: page, chapter, verse,
# sub-verbo, and so on. English leaves the names as they are.
style-locator = { $name }

## When a citation is printed, by where it stands among the others.

style-position-first = se citira prvi put
style-position-subsequent = je već citirano
style-position-ibid = je isto kao prethodni citat
style-position-ibid-with-locator = je isto kao prethodni citat, na drugom mjestu
style-position-near-note = je citirano u bliskoj bilješci

## How a part is set: "italic, in quotation marks, before “, ”".

style-form-italic = kurziv
style-form-bold = podebljano
style-form-small-caps = kapitalke
style-form-underlined = podcrtano
style-form-quoted = u navodnicima
# How the letters are set, as CSL names it; the words are that name with spaces for its dashes.
style-form-case = { $case ->
    [lowercase] mala slova
    [uppercase] velika slova
    [capitalize-first] prvo slovo veliko
    [capitalize-all] svaka riječ velikim slovom
    [sentence] kao u rečenici
    [title] naslovna velika slova
   *[other] { $words }
}
style-form-raised = podignuto
style-form-lowered = spušteno
# The part comes after these words.
style-form-after = iza „{ $text }”
# The part comes before these words.
style-form-before = ispred „{ $text }”
style-form-between = s „{ $text }” između

## The kinds of work a reference is of, as CSL names them.

style-type-book = knjiga
style-type-chapter = poglavlje
style-type-article-journal = članak u časopisu
style-type-article-magazine = članak u magazinu
style-type-article-newspaper = članak u novinama
style-type-article = članak
style-type-thesis = disertacija ili rad
style-type-report = izvještaj
style-type-webpage = mrežna stranica
style-type-paper-conference = rad sa skupa
style-type-entry-encyclopedia = natuknica u enciklopediji
style-type-entry-dictionary = natuknica u rječniku
style-type-entry = natuknica
style-type-review = prikaz
style-type-review-book = prikaz knjige
style-type-manuscript = rukopis
style-type-personal_communication = pismo ili drugo priopćenje
style-type-legal_case = sudska odluka
style-type-legislation = propis
style-type-bill = prijedlog zakona
style-type-patent = patent
style-type-dataset = skup podataka
style-type-software = softver
style-type-motion_picture = film
style-type-broadcast = emisija
style-type-song = snimka
style-type-speech = predavanje
style-type-interview = intervju
style-type-graphic = slika
style-type-map = zemljovid
style-type-pamphlet = pamflet
style-type-post-weblog = objava na blogu
style-type-post = objava
style-type-classic = klasično djelo
style-type-collection = zbirka
style-type-document = dokument
style-type-standard = norma
style-type-treaty = ugovor
style-type-periodical = periodika
style-type-musical_score = notni zapis
style-type-figure = ilustracija
style-type-event = događaj
style-type-performance = izvedba
style-type-regulation = pravilnik
style-type-hearing = saslušanje

## What a reference has, as CSL names it: with its article, and without it
## (.bare) as a field of a reference is named.

style-variable-title = naslov
    .bare = naslov
style-variable-title-short = kratki naslov
    .bare = kratki naslov
style-variable-container-title = naslov časopisa ili knjige
    .bare = naslov časopisa ili knjige
style-variable-container-title-short = kratki naslov časopisa
    .bare = kratki naslov časopisa
style-variable-collection-title = niz
    .bare = niz
style-variable-collection-number = broj u nizu
    .bare = broj u nizu
style-variable-original-title = izvorni naslov
    .bare = izvorni naslov
style-variable-reviewed-title = naslov prikazanog djela
    .bare = naslov prikazanog djela
style-variable-author = autor
    .bare = autor
style-variable-editor = urednik
    .bare = urednik
style-variable-translator = prevoditelj
    .bare = prevoditelj
style-variable-container-author = autor knjige
    .bare = autor knjige
style-variable-collection-editor = urednik niza
    .bare = urednik niza
style-variable-editorial-director = glavni urednik
    .bare = glavni urednik
style-variable-original-author = izvorni autor
    .bare = izvorni autor
style-variable-reviewed-author = autor prikazanog djela
    .bare = autor prikazanog djela
style-variable-interviewer = ispitivač
    .bare = ispitivač
style-variable-recipient = primatelj
    .bare = primatelj
style-variable-director = redatelj
    .bare = redatelj
style-variable-composer = skladatelj
    .bare = skladatelj
style-variable-illustrator = ilustrator
    .bare = ilustrator
style-variable-issued = datum
    .bare = datum
style-variable-accessed = datum pristupa
    .bare = datum pristupa
style-variable-original-date = izvorni datum
    .bare = izvorni datum
style-variable-event-date = datum događaja
    .bare = datum događaja
style-variable-submitted = datum predaje
    .bare = datum predaje
style-variable-volume = svezak
    .bare = svezak
style-variable-number-of-volumes = broj svezaka
    .bare = broj svezaka
style-variable-issue = broj časopisa
    .bare = broj časopisa
style-variable-edition = izdanje
    .bare = izdanje
style-variable-page = stranice
    .bare = stranice
style-variable-page-first = prva stranica
    .bare = prva stranica
style-variable-number-of-pages = broj stranica
    .bare = broj stranica
style-variable-number = broj
    .bare = broj
style-variable-chapter = poglavlje
    .bare = poglavlje
style-variable-chapter-number = broj poglavlja
    .bare = broj poglavlja
style-variable-publisher = nakladnik
    .bare = nakladnik
style-variable-publisher-place = mjesto izdanja
    .bare = mjesto izdanja
style-variable-original-publisher = izvorni nakladnik
    .bare = izvorni nakladnik
style-variable-original-publisher-place = izvorno mjesto izdanja
    .bare = izvorno mjesto izdanja
style-variable-locator = citirano mjesto
    .bare = citirano mjesto
style-variable-citation-number = broj citata
    .bare = broj citata
style-variable-citation-label = oznaka citata
    .bare = oznaka citata
style-variable-year-suffix = slovo iza godine
    .bare = slovo iza godine
style-variable-first-reference-note-number = broj bilješke u kojoj je prvi put citirano
    .bare = broj bilješke u kojoj je prvi put citirano
style-variable-DOI = DOI
    .bare = DOI
style-variable-URL = adresa
    .bare = adresa
style-variable-ISBN = ISBN
    .bare = ISBN
style-variable-ISSN = ISSN
    .bare = ISSN
style-variable-PMID = PMID
    .bare = PMID
style-variable-genre = vrsta djela
    .bare = vrsta djela
style-variable-medium = medij
    .bare = medij
style-variable-note = napomena
    .bare = napomena
style-variable-annote = anotacija
    .bare = anotacija
style-variable-abstract = sažetak
    .bare = sažetak
style-variable-archive = arhiv
    .bare = arhiv
style-variable-archive_location = mjesto u arhivu
    .bare = mjesto u arhivu
style-variable-archive-place = mjesto arhiva
    .bare = mjesto arhiva
style-variable-authority = nadležno tijelo
    .bare = nadležno tijelo
style-variable-call-number = signatura
    .bare = signatura
style-variable-event = događaj
    .bare = događaj
style-variable-event-place = mjesto događaja
    .bare = mjesto događaja
style-variable-event-title = naziv događaja
    .bare = naziv događaja
style-variable-section = odjeljak
    .bare = odjeljak
style-variable-source = izvor
    .bare = izvor
style-variable-status = stanje objavljivanja
    .bare = stanje objavljivanja
style-variable-version = inačica
    .bare = inačica
style-variable-language = jezik
    .bare = jezik
style-variable-dimensions = dimenzije
    .bare = dimenzije
style-variable-scale = mjerilo
    .bare = mjerilo
style-variable-references = reference
    .bare = reference
style-variable-keyword = ključne riječi
    .bare = ključne riječi
style-variable-jurisdiction = jurisdikcija
    .bare = jurisdikcija
