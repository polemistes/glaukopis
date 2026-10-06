# Reference styles: their kinds, the search for more, and the style editor,
# with the words it tells the parts of a style by.

## The kinds of reference style, as the styles are grouped by them.

style-kind-note = Poznámkové
style-kind-author-date = Autor a rok
style-kind-numeric = Číselné
style-kind-label = Návěští
style-kind-author = Autor
style-kind-other = Ostatní

## The search for reference styles of journals and publishers.

style-browser = Citační styly
style-browser-subtitle = Přes deset tisíc stylů časopisů a nakladatelů, podle názvu
style-browser-placeholder = Název časopisu, nakladatele nebo stylu
style-browser-search = Hledat styly
# Beside a style that has been fetched already.
style-browser-here = Staženo
style-browser-fetch = Stáhnout
style-browser-none-found = Žádný styl nemá tato slova v názvu.
style-browser-about = Styly se stahují z repozitáře projektu Citation Style Language a uchovávají s vašimi vlastními. Ty, které máte, lze v editoru stylů upravit podle přání nakladatele.
style-browser-import = Importovat soubor…
style-browser-import-title = Importovat citační styl
style-browser-fetch-failed = Styl nelze stáhnout.
style-browser-file-unread = Soubor nelze přečíst.

## The style editor.

style-editor = Citační styl
style-name = Název stylu
# The name a style of one's own is first given, made from that of the style it is made from.
style-name-changed = { $name }, upravený
style-depth = Jak hluboko jít
style-depth-options = Běžné změny
style-depth-parts = Část po části
style-depth-source = Zdroj
style-scope = Co změnit
style-scope-citations = Citace
style-scope-notes = Poznámky
style-scope-bibliography = Bibliografie
style-bundled = Styly, které jsou součástí Glaukopis, zůstávají, jak jsou. Vaše změny se uloží jako váš vlastní styl.
style-delete = Smazat tento styl
style-save-own = Uložit jako vlastní
style-saved = „{ $name }“ je uložen mezi vašimi styly
style-read-failed = Styl nelze přečíst.
style-save-failed = Styl nelze uložit.
style-delete-failed = Styl nelze smazat.
style-delete-title = Smazat styl „{ $name }“?
style-delete-message = Mapy, které ho používají, použijí místo něj jiný styl.
style-delete-confirm = Smazat styl
style-leave-title = Odejít bez uložení?
style-leave-message = Změny, které jste ve stylu udělali, budou ztraceny.
style-leave-confirm = Odejít
style-leave-cancel = Pokračovat v úpravách

## Common changes: names.

style-names = Jména
# A sentence with two fields in it, where numbers are written: the least number of
# authors for which "et al." is used, and how many are named before it.
style-et-al = Při { $min } a více autorech uvést prvních { $first } a „et al.“
style-et-al-min = Počet autorů, od něhož se užívá et al.
style-et-al-first = Počet autorů uvedených před et al.
style-et-al-empty = Zůstane-li prázdné, jmenují se všichni
# As the one before, for a work that has been cited before.
style-et-al-again = Při další citaci, při { $min } a více, uvést prvních { $first }
style-et-al-again-min = Počet autorů, od něhož se v dalších citacích užívá et al.
style-et-al-again-first = Počet autorů uvedených v dalších citacích
style-et-al-again-empty = Zůstane-li prázdné, jako poprvé
style-before-last-name = Před posledním jménem
# The word the style prints there, in the language of the document.
style-and-word = a
style-and-nothing = Nic
style-as-the-style-has-it = Jak to má styl
style-comma-before-last = Čárka před ním
style-comma-contextual = Při třech a více jménech: A, B, a C
style-comma-always = Vždy: A, a B
style-comma-never = Nikdy: A, B a C
style-comma-after-inverted = Za jménem v obráceném pořadí
style-given-names = Křestní jména
style-given-full = Celá: John Miles
style-given-spaced = Iniciály: J. M.
style-given-close = Iniciály, těsně: J.M.
style-given-bare = Iniciály bez teček: JM
style-given-bare-spaced = Iniciály bez teček: J M
style-family-first = Příjmení napřed
style-family-first-none = U nikoho: John Foley
style-family-first-first = U prvního autora: Foley, John, a Robert Fowler
style-family-first-all = U všech: Foley, John, a Fowler, Robert
style-sort-separator = Mezi příjmením a křestním jménem
style-sort-separator-hint = Když je příjmení napřed

## Common changes: the citation, or the note, and the entries of the bibliography.

style-the-citation = Citace
style-the-note = Poznámka
style-begins-with = Začíná
style-ends-with = Končí
style-between-works = Mezi díly citovanými spolu
style-collapse = Díla jednoho autora citovaná spolu
style-collapse-none = Každé celé
style-collapse-year = Jméno jednou: Nagy 1979, 1996
style-collapse-year-suffix = A rok jednou: Nagy 1979a, b
style-collapse-year-suffix-ranged = S rozsahy: Nagy 1979a–c
style-collapse-citation-number = Čísla jako rozsahy: [1–3]
style-disambiguate = Když by dvě díla byla citována stejně
style-disambiguate-year-suffix = Přidat k roku písmeno
style-disambiguate-names = Jmenovat více autorů
style-disambiguate-given-names = Přidat křestní jména nebo iniciály
style-near-note = Poznámka se počítá za blízkou v rozmezí
style-near-note-hint = Poznámek; pro styly, které zkracují, co bylo citováno nedávno
style-entries = Záznamy
style-entry-ends-with = Každý končí
style-author-repeated = U opakovaného autora
style-author-repeated-hint = Místo jména, v záznamech po prvním
style-hanging-indent = Předsazení
style-hanging-indent-hint = Jak hluboko, rozhoduje formát dokumentu
style-second-field = Čísla nebo návěští stojí
style-second-field-line = V řádku
style-second-field-column = Ve vlastním sloupci
style-second-field-margin = Na okraji
style-second-field-hint = Pro styly, které své záznamy číslují

## Common changes: throughout the style.

style-throughout = V celém stylu
style-page-ranges = Rozsahy stran
style-page-ranges-as-entered = Jak jsou zadány
style-page-ranges-expanded = Celé: 321–328
style-page-ranges-minimal = Nejkratší: 321–8
style-page-ranges-minimal-two = Nejméně dvě číslice: 321–28
style-page-ranges-chicago = Jak je má Chicago Manual
style-particles = „van“, „de“, „von“ před příjmením
style-particles-never = Zůstávají s ním a řadí se pod v, d
style-particles-sort-only = Zůstávají s ním, ale neřadí se podle nich
style-particles-display-and-sort = Jdou za křestní jméno: Gogh, Vincent van
style-hyphen = Spojovník mezi iniciálami
style-hyphen-hint = J.-P. Sartre, ne J.P. Sartre
style-locale = Slova stylu jsou v
style-locale-document = Jazyce dokumentu
style-locale-hint = „ed.“, „in“, „cit.“, měsíce

## Part by part.

# The scope is citation or bibliography.
style-parts-of = { $scope ->
    [citation] Části citace
   *[bibliography] Části bibliografie
}
style-parts-none = { $scope ->
    [citation] Tento styl nemá citaci.
   *[bibliography] Tento styl nemá bibliografii.
}
style-parts-hint = Zvolte vlevo část a změňte, jak se tiskne: co stojí před ní a za ní, její písmo, její velká písmena. Části se otevírají, aby ukázaly, z čeho se skládají.
style-part-unfold = Otevřít
style-part-fold = Zavřít
style-part-up = Posunout výš
style-part-down = Posunout níž
style-part-add-after = Přidat za ni
style-part-take-away = Odebrat
style-part-add-within = Přidat do ní
# A part of a macro: a part of the style that is used in several places.
style-part-shared = { $count ->
    [one] Patří k „{ $macro }“, které se užívá na { $count } místě. Změna zde se projeví všude.
    [few] Patří k „{ $macro }“, které se užívá na { $count } místech. Změna zde se projeví na všech.
   *[other] Patří k „{ $macro }“, které se užívá na { $count } místech. Změna zde se projeví na všech.
}
style-add-words = Vlastní slova
style-add-words-hint = Například „in“, „cit.“ nebo interpunkce
# Over the fields of a reference that a part can print.
style-add-from-reference = Ze záznamu
style-part-words = Slova
style-part-before = Před ní
style-part-before-hint = Tiskne se, jen když se tiskne část sama
style-part-after = Za ní
style-part-between = Mezi jejími částmi
style-slant = Sklon
style-slant-upright = Stojaté
style-slant-italic = Kurzíva
style-weight = Řez
style-weight-regular = Obyčejný
style-weight-bold = Tučný
style-letters = Písmena
style-letters-as-written = Jak je psáno
style-letters-small-caps = Kapitálky
style-case = Velká písmena
style-case-as-entered = Jak je zadáno
style-case-title = Velká Písmena Názvu
style-case-sentence = Jako ve větě
style-case-capitalize-first = První písmeno velké
style-case-capitalize-all = Každé Slovo Velké
style-case-uppercase = VERZÁLKY
style-case-lowercase = malá písmena
style-height = Výška
style-height-baseline = Na řádku
style-height-raised = Horní index
style-height-lowered = Dolní index
style-quotes = V uvozovkách
style-strip-periods = Bez teček
style-strip-periods-hint = Pro zkratky: „ed“ místo „ed.“
style-text-form = Podoba
style-text-form-long = Celá
style-text-form-short = Krátká, má-li ji záznam
style-term-form = Podoba slova
style-term-form-long = Celé: editor, strana
style-term-form-short = Krátké: ed., s.
style-term-form-verb = Jako sloveso: editoval
style-term-form-verb-short = Jako sloveso, krátce: ed.
style-term-form-symbol = Jako znak: §
style-date-parts = Datum se uvádí
style-date-parts-year = Jen jako rok
style-date-parts-year-month = Jako rok a měsíc
style-date-parts-full = Celé

## The source of the style, and the sample it is tried on.

style-source = Zdroj stylu
style-source-try = Vyzkoušet
style-source-unread = Zdroj nelze přečíst.
style-sample-unusable = Styl nelze použít, jak je
style-sample-failed = Styl nelze vyzkoušet.
style-sample-in-text = V textu
style-sample-in-notes = V poznámkách
style-sample-in-bibliography = V bibliografii
style-sample-cited = Citované dílo
style-sample-same-page = Totéž, na straně
style-sample-another = Jiné, se slovem před ním
style-sample-first-again = Opět první, na kapitole
style-sample-together = Dvě díla spolu
style-sample-in-sentence = S autorem ve větě
style-sample-examples = Ukázáno na příkladech: vaše knihovna je prázdná.
style-sample-library = Ukázáno na dílech z vaší knihovny.

## The source of a style, where it cannot be read as one.

style-source-not-xml = Zdroj není správně utvořené XML.
style-source-not-style = Toto není styl: nezačíná značkou <style>.
style-source-dependent = Styl nemá <citation>: jen odkazuje na jiný styl a nelze ho měnit.

## The parts of a style, as the style editor tells them in words.

style-part-layout = Celek
style-part-text = Text
# A part that prints a word of the style's language: the term is its name in CSL.
style-part-term = Slovo pro „{ $term }“
# A part that prints words written into the style.
style-part-value = Slova „{ $value }“
style-part-name = Jak se píší jména
# The name is family or given, as CSL has them.
style-part-name-part = { $name ->
    [family] Příjmení
    [given] Křestní jméno
   *[other] Jméno ({ $name })
}
style-part-et-al = „et al.“
# The variables are one or more of those below: "the pages".
style-part-label = Slovo před: { $variables } („s.“, „ed.“)
style-part-role = Slovo pro roli („ed.“, „přel.“)
style-part-substitute = Když takové jméno není, místo něj
# The name is day, month or year, as CSL has them, or part.
style-part-date-part = { $name ->
    [day] Den
    [month] Měsíc
    [year] Rok
   *[other] { $name }
}
style-part-group = Spolu
style-part-choose = Jedno z těchto
# The condition is made of those below.
style-part-if = Jestliže { $condition }
style-part-else-if = Jinak, jestliže { $condition }
style-part-else = Jinak
# A name the style has, of a part of it (a macro) or of a variable it does not know.
style-quoted = „{ $text }“

## Words that join others: "the author, or else the editor", "a book or a chapter".
## The first may be a list of several, joined by commas.

style-or = { $first } nebo { $last }
style-and = { $first } a { $last }
style-or-else = { $first }, jinak { $last }

## When a part of a style is printed: "If the work is a book".

style-if-type = dílo je { $types }
style-if-has = má { $variables }
style-if-lacks = nemá { $variables }
style-if-numeric = { $variables } je číslo
style-if-uncertain = { $variables } je nejisté
# The places are pages, chapters, verses and the like; see style-locator.
style-if-locator = citované místo je { $locators }
style-if-disambiguate = jinak by se zaměnilo s jiným
style-if-always = vždy
style-if-none-holds = nic z tohoto neplatí: { $conditions }
# A kind of place that a citation points to, as CSL names it: page, chapter, verse,
# sub-verbo, and so on. English leaves the names as they are.
style-locator = { $name }

## When a citation is printed, by where it stands among the others.

style-position-first = je citováno poprvé
style-position-subsequent = bylo citováno už dříve
style-position-ibid = je totéž jako předchozí citace
style-position-ibid-with-locator = je totéž jako předchozí citace, na jiném místě
style-position-near-note = bylo citováno v blízké poznámce

## How a part is set: "italic, in quotation marks, before “, ”".

style-form-italic = kurzívou
style-form-bold = tučně
style-form-small-caps = kapitálkami
style-form-underlined = podtrženě
style-form-quoted = v uvozovkách
# How the letters are set, as CSL names it; the words are that name with spaces for its dashes.
style-form-case = { $case ->
    [lowercase] malá písmena
    [uppercase] verzálky
    [capitalize-first] první písmeno velké
    [capitalize-all] každé slovo velké
    [sentence] jako ve větě
    [title] jako v názvu
   *[other] { $words }
}
style-form-raised = horní index
style-form-lowered = dolní index
# The part comes after these words.
style-form-after = za „{ $text }“
# The part comes before these words.
style-form-before = před „{ $text }“
style-form-between = s „{ $text }“ mezi

## The kinds of work a reference is of, as CSL names them.

style-type-book = kniha
style-type-chapter = kapitola
style-type-article-journal = článek v odborném časopise
style-type-article-magazine = článek v magazínu
style-type-article-newspaper = článek v novinách
style-type-article = článek
style-type-thesis = kvalifikační práce
style-type-report = zpráva
style-type-webpage = webová stránka
style-type-paper-conference = konferenční příspěvek
style-type-entry-encyclopedia = heslo v encyklopedii
style-type-entry-dictionary = heslo ve slovníku
style-type-entry = heslo
style-type-review = recenze
style-type-review-book = recenze knihy
style-type-manuscript = rukopis
style-type-personal_communication = dopis nebo jiné sdělení
style-type-legal_case = soudní rozhodnutí
style-type-legislation = právní předpis
style-type-bill = návrh zákona
style-type-patent = patent
style-type-dataset = datová sada
style-type-software = software
style-type-motion_picture = film
style-type-broadcast = vysílání
style-type-song = nahrávka
style-type-speech = přednáška
style-type-interview = rozhovor
style-type-graphic = obrázek
style-type-map = mapa
style-type-pamphlet = brožura
style-type-post-weblog = příspěvek na blogu
style-type-post = příspěvek
style-type-classic = klasické dílo
style-type-collection = sbírka
style-type-document = dokument
style-type-standard = norma
style-type-treaty = smlouva
style-type-periodical = periodikum
style-type-musical_score = notový zápis
style-type-figure = vyobrazení
style-type-event = událost
style-type-performance = představení
style-type-regulation = nařízení
style-type-hearing = slyšení

## What a reference has, as CSL names it: with its article, and without it
## (.bare) as a field of a reference is named.

style-variable-title = název
    .bare = název
style-variable-title-short = zkrácený název
    .bare = zkrácený název
style-variable-container-title = název časopisu nebo knihy
    .bare = název časopisu nebo knihy
style-variable-container-title-short = zkrácený název časopisu
    .bare = zkrácený název časopisu
style-variable-collection-title = edici
    .bare = edice
style-variable-collection-number = číslo v edici
    .bare = číslo v edici
style-variable-original-title = původní název
    .bare = původní název
style-variable-reviewed-title = název recenzovaného díla
    .bare = název recenzovaného díla
style-variable-author = autora
    .bare = autor
style-variable-editor = editora
    .bare = editor
style-variable-translator = překladatele
    .bare = překladatel
style-variable-container-author = autora knihy
    .bare = autor knihy
style-variable-collection-editor = editora edice
    .bare = editor edice
style-variable-editorial-director = vedoucího redakce
    .bare = vedoucí redakce
style-variable-original-author = původního autora
    .bare = původní autor
style-variable-reviewed-author = autora recenzovaného díla
    .bare = autor recenzovaného díla
style-variable-interviewer = tazatele
    .bare = tazatel
style-variable-recipient = adresáta
    .bare = adresát
style-variable-director = režiséra
    .bare = režisér
style-variable-composer = skladatele
    .bare = skladatel
style-variable-illustrator = ilustrátora
    .bare = ilustrátor
style-variable-issued = datum
    .bare = datum
style-variable-accessed = datum přístupu
    .bare = datum přístupu
style-variable-original-date = původní datum
    .bare = původní datum
style-variable-event-date = datum události
    .bare = datum události
style-variable-submitted = datum odeslání
    .bare = datum odeslání
style-variable-volume = svazek
    .bare = svazek
style-variable-number-of-volumes = počet svazků
    .bare = počet svazků
style-variable-issue = číslo časopisu
    .bare = číslo časopisu
style-variable-edition = vydání
    .bare = vydání
style-variable-page = strany
    .bare = strany
style-variable-page-first = první stranu
    .bare = první strana
style-variable-number-of-pages = počet stran
    .bare = počet stran
style-variable-number = číslo
    .bare = číslo
style-variable-chapter = kapitolu
    .bare = kapitola
style-variable-chapter-number = číslo kapitoly
    .bare = číslo kapitoly
style-variable-publisher = nakladatele
    .bare = nakladatel
style-variable-publisher-place = místo vydání
    .bare = místo vydání
style-variable-original-publisher = původního nakladatele
    .bare = původní nakladatel
style-variable-original-publisher-place = původní místo vydání
    .bare = původní místo vydání
style-variable-locator = citované místo
    .bare = citované místo
style-variable-citation-number = číslo citace
    .bare = číslo citace
style-variable-citation-label = návěští citace
    .bare = návěští citace
style-variable-year-suffix = písmeno za rokem
    .bare = písmeno za rokem
style-variable-first-reference-note-number = číslo poznámky, kde bylo poprvé citováno
    .bare = číslo poznámky, kde bylo poprvé citováno
style-variable-DOI = DOI
    .bare = DOI
style-variable-URL = adresu
    .bare = adresa
style-variable-ISBN = ISBN
    .bare = ISBN
style-variable-ISSN = ISSN
    .bare = ISSN
style-variable-PMID = PMID
    .bare = PMID
style-variable-genre = druh díla
    .bare = druh díla
style-variable-medium = médium
    .bare = médium
style-variable-note = poznámku
    .bare = poznámka
style-variable-annote = anotaci
    .bare = anotace
style-variable-abstract = abstrakt
    .bare = abstrakt
style-variable-archive = archiv
    .bare = archiv
style-variable-archive_location = místo v archivu
    .bare = místo v archivu
style-variable-archive-place = sídlo archivu
    .bare = sídlo archivu
style-variable-authority = vydávající orgán
    .bare = vydávající orgán
style-variable-call-number = signaturu
    .bare = signatura
style-variable-event = událost
    .bare = událost
style-variable-event-place = místo události
    .bare = místo události
style-variable-event-title = název události
    .bare = název události
style-variable-section = oddíl
    .bare = oddíl
style-variable-source = zdroj
    .bare = zdroj
style-variable-status = stav vydání
    .bare = stav vydání
style-variable-version = verzi
    .bare = verze
style-variable-language = jazyk
    .bare = jazyk
style-variable-dimensions = rozměry
    .bare = rozměry
style-variable-scale = měřítko
    .bare = měřítko
style-variable-references = odkazy
    .bare = odkazy
style-variable-keyword = klíčová slova
    .bare = klíčová slova
style-variable-jurisdiction = jurisdikci
    .bare = jurisdikce
