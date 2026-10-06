# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF-ji in slike
ocr-no-tesseract = Tesseract, ki bere besedilo v slikah, ni nameščen ali ga ni bilo mogoče najti. Namestite ga z upraviteljem paketov svojega sistema, skupaj s podatki za jezike, ki jih berete (na Archu: tesseract in tesseract-data-eng, tesseract-data-slv in tako naprej), ali pa v nastavitvah povejte, kje je.
ocr-failed = Besedila ni bilo mogoče prebrati.
ocr-looking = Ogled { $file }…
ocr-about-picture = Besedilo se prebere iz slike.
ocr-about-scan = { $pages ->
    [one] PDF nima besedila: prebere se iz slike njegove strani.
    [two] Nobena od { $pages } strani nima besedila: prebereta se iz svojih slik.
    [few] Nobena od { $pages } strani nima besedila: preberejo se iz svojih slik.
   *[other] Nobena od { $pages } strani nima besedila: preberejo se iz svojih slik.
}
ocr-about-some = { $without ->
    [one] Ena od { $pages } strani nima besedila in se prebere iz svoje slike; druge se vzamejo, kakršne so.
    [two] { $without } od { $pages } strani nimata besedila in se prebereta iz svojih slik; druge se vzamejo, kakršne so.
    [few] { $without } od { $pages } strani nimajo besedila in se preberejo iz svojih slik; druge se vzamejo, kakršne so.
   *[other] { $without } od { $pages } strani nima besedila in se preberejo iz svojih slik; druge se vzamejo, kakršne so.
}
ocr-about-text = { $pages ->
    [one] Stran ima besedilo, ki se vzame, kakršno je.
    [two] Obe strani imata besedilo, ki se vzame, kakršno je.
    [few] Vse strani imajo besedilo, ki se vzame, kakršno je.
   *[other] Vse strani imajo besedilo, ki se vzame, kakršno je.
}
ocr-read-all = Preberi tudi strani, ki imajo besedilo
ocr-read-all-hint = Njihovo besedilo ostane, prebrano pa se položi čezenj.
ocr-read-all-map-hint = Prebrano nadomesti njihovo besedilo: za kadar je slabo ali ga ni mogoče prebrati.
ocr-read = Preberi besedilo
ocr-read-text-pages = Vzemi strani, ki imajo besedilo
ocr-take-text = Vzemi besedilo
ocr-reading = Branje { $file }…
ocr-reading-pages = Prebranih { $done } od { $total } strani
ocr-reading-hint = Stran vzame nekaj sekund. Prekliči ustavi branje.

## How the text is read: what to try when a reading goes badly

ocr-how = Kako se bere
ocr-how-dpi = Ločljivost, v pikah na palec
ocr-how-layout = Postavitev strani
ocr-how-layout-auto = Kakor presodi Tesseract
ocr-how-layout-column = En stolpec
ocr-how-layout-block = En blok besedila
ocr-how-layout-sparse = Redko besedilo
ocr-how-contrast = Črno-belo
ocr-how-hint = Kaj poskusiti, kadar branje ne gre dobro: višjo ločljivost za droben tisk, en stolpec, kjer se stolpci mešajo, en blok besedila za en sam odstavek in črno-belo za bled ali neenakomeren tisk.

## The languages of the text

ocr-languages = Jeziki besedila
ocr-languages-hint = Najverjetnejši najprej. Vsak dodatni upočasni branje, ne izboljša pa ga vedno.
ocr-language-add = Dodaj jezik…
ocr-language-remove = Odstrani { $language }
# A script rather than a language: "Latin script".
ocr-language-script = pisava { $script }
ocr-language-fraktur = { $language }, fraktura
ocr-language-old = { $language }, starejša
ocr-language-vertical = { $language }, pisano navzdol

## A PDF of the library made searchable

ocr-searchable-button = Dodaj besedilo za iskanje…
ocr-searchable-title = Dodaj PDF-ju besedilo za iskanje
ocr-searchable-about = { $without ->
    [one] Ena od { $pages } strani nima besedila. Prebere se in njeno besedilo se nevidno položi pod prikazano, da ga je mogoče iskati in kopirati. PDF je videti, kakor je bil.
    [two] { $without } od { $pages } strani nimata besedila. Prebereta se in njuno besedilo se nevidno položi pod prikazano, da ga je mogoče iskati in kopirati. PDF je videti, kakor je bil.
    [few] { $without } od { $pages } strani nimajo besedila. Preberejo se in njihovo besedilo se nevidno položi pod prikazano, da ga je mogoče iskati in kopirati. PDF je videti, kakor je bil.
   *[other] { $without } od { $pages } strani nima besedila. Preberejo se in njihovo besedilo se nevidno položi pod prikazano, da ga je mogoče iskati in kopirati. PDF je videti, kakor je bil.
}
ocr-searchable-has-text = { $pages ->
    [one] Stran ima besedilo: po PDF-ju je že mogoče iskati.
    [two] Obe strani imata besedilo: po PDF-ju je že mogoče iskati.
    [few] Vse strani imajo besedilo: po PDF-ju je že mogoče iskati.
   *[other] Vse strani imajo besedilo: po PDF-ju je že mogoče iskati.
}
ocr-searchable-damaged = PDF-ja ni bilo mogoče razstaviti, da bi ga spremenili: morda je poškodovan. Njegovo besedilo je vseeno mogoče uvoziti v projekt kot miselni vzorec.
ocr-searchable-make = Dodaj besedilo za iskanje
ocr-strip = Odstrani nevidno besedilo, ki ga strani imajo, in obdrži le prebrano
ocr-strip-hint = Za slabo besedilno plast, kakršno skener položi pod stran. Vidne črke ostanejo in stran je videti, kakor je bila.
ocr-searchable-done = { $count ->
    [one] Po PDF-ju je mogoče iskati: prebrana je bila { $count } stran
    [two] Po PDF-ju je mogoče iskati: prebrani sta bili { $count } strani
    [few] Po PDF-ju je mogoče iskati: prebrane so bile { $count } strani
   *[other] Po PDF-ju je mogoče iskati: prebranih je bilo { $count } strani
}
ocr-searchable-failed = { $count ->
    [one] { $count } strani ni bilo mogoče prebrati.
    [two] { $count } strani ni bilo mogoče prebrati.
    [few] { $count } strani ni bilo mogoče prebrati.
   *[other] { $count } strani ni bilo mogoče prebrati.
}

## A map from a PDF of the library

ocr-map-button = Miselni vzorec iz njegovega besedila…
ocr-map-title = Miselni vzorec iz besedila
ocr-map-into = V projekt
ocr-map-new-project = Nov projekt, poimenovan po njem
ocr-map-making = Izdelava miselnega vzorca…
ocr-map-failed = Miselnega vzorca ni bilo mogoče narediti.

## The text of a picture of the store

ocr-picture-read = Preberi besedilo v njej…
ocr-picture-title = Besedilo v sliki
ocr-picture-empty = V sliki ni bilo najdeno nobeno besedilo.
ocr-picture-copy = Kopiraj
ocr-picture-copied = Besedilo je kopirano
ocr-picture-map = Naredi iz njega miselni vzorec

## Tesseract in the settings

ocr-settings-looking = Iskanje…
ocr-settings-missing = Ni najden. Potreben je za branje besedila iz skenov in slik. Namestite tesseract z upraviteljem paketov svojega sistema, skupaj s podatki za jezike, ki jih berete (na Archu tesseract-data-eng za angleščino, tesseract-data-slv za slovenščino, tesseract-data-grc za staro grščino …), ali pa spodaj povejte, kje je.
ocr-settings-by-itself = Najden sam od sebe
ocr-settings-where = Kje je Tesseract
ocr-settings-look-failed = Tesseracta ni bilo mogoče poiskati
ocr-settings-has = Bere { $languages }.
ocr-settings-has-none = Nima podatkov za noben jezik: namestite jih za katerega, na primer tesseract-data-eng.
ocr-settings-first = Sprva beri v
ocr-settings-first-hint = Kadar ni izbran noben, jezik besedila in jezik vmesnika.
ocr-settings-how = Kako se besedilo sprva bere
