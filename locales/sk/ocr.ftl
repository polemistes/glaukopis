# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF a obrázky
ocr-no-tesseract = Tesseract, ktorý číta text v obrázkoch, nie je nainštalovaný alebo sa nenašiel. Nainštalujte ho správcom balíkov vášho systému spolu s dátami jazykov, ktoré čítate (na Archu: tesseract a tesseract-data-eng, tesseract-data-slk a podobne), alebo v nastaveniach povedzte, kde je.
ocr-failed = Text sa nepodarilo prečítať.
ocr-looking = Prezerá sa { $file }…
ocr-about-picture = Text sa číta z obrázka.
ocr-about-scan = { $pages ->
    [one] PDF nemá text: číta sa z obrázka jeho strany.
    [few] Žiadna z { $pages } strán nemá text: čítajú sa z ich obrázkov.
   *[other] Žiadna z { $pages } strán nemá text: čítajú sa z ich obrázkov.
}
ocr-about-some = { $without ->
    [one] Jedna z { $pages } strán nemá text a číta sa z jej obrázka; ostatné sa berú, ako sú.
    [few] { $without } z { $pages } strán nemajú text a čítajú sa z ich obrázkov; ostatné sa berú, ako sú.
   *[other] { $without } z { $pages } strán nemá text a čítajú sa z ich obrázkov; ostatné sa berú, ako sú.
}
ocr-about-text = { $pages ->
    [one] Strana má text, ktorý sa berie, ako je.
    [few] Každá strana má text, ktorý sa berie, ako je.
   *[other] Každá strana má text, ktorý sa berie, ako je.
}
ocr-read-all = Čítať aj strany, ktoré majú text
ocr-read-all-hint = Ich text ostane a prečítané sa položí naň.
ocr-read-all-map-hint = Prečítané nahradí ich text: pre prípad, že je zlý alebo sa nedá prečítať.
ocr-read = Prečítať text
ocr-read-text-pages = Vziať strany, ktoré majú text
ocr-take-text = Vziať text
ocr-reading = Číta sa { $file }…
ocr-reading-pages = { $done } z { $total } strán prečítaných
ocr-reading-hint = Strana trvá niekoľko sekúnd. Zrušiť zastaví čítanie.

## How the text is read: what to try when a reading goes badly

ocr-how = Ako sa číta
ocr-how-dpi = Rozlíšenie v bodoch na palec
ocr-how-layout = Rozloženie strany
ocr-how-layout-auto = Ako posúdi Tesseract
ocr-how-layout-column = Jeden stĺpec
ocr-how-layout-block = Jeden blok textu
ocr-how-layout-sparse = Riedky text
ocr-how-contrast = Čiernobielo
ocr-how-hint = Čo skúsiť, keď čítanie dopadne zle: vyššie rozlíšenie pre drobnú tlač, jeden stĺpec tam, kde sa stĺpce miešajú, jeden blok textu pre jediný odsek a čiernobielo pre tlač, ktorá je slabá alebo nerovnomerná.

## The languages of the text

ocr-languages = Jazyky textu
ocr-languages-hint = Najpravdepodobnejší prvý. Každý ďalší čítanie spomalí, a nie vždy zlepší.
ocr-language-add = Pridať jazyk…
ocr-language-remove = Odobrať { $language }
# A script rather than a language: "Latin script".
ocr-language-script = Písmo: { $script }
ocr-language-fraktur = { $language }, fraktúra
ocr-language-old = { $language }, staršia podoba
ocr-language-vertical = { $language }, písaný zvislo

## A PDF of the library made searchable

ocr-searchable-button = Urobiť prehľadávateľným…
ocr-searchable-title = Urobiť PDF prehľadávateľným
ocr-searchable-about = { $without ->
    [one] Jedna z { $pages } strán nemá text. Prečíta sa a jej text sa neviditeľne položí pod to, čo sa zobrazuje, aby sa dal hľadať a kopírovať. PDF vyzerá ako predtým.
    [few] { $without } z { $pages } strán nemajú text. Prečítajú sa a ich text sa neviditeľne položí pod to, čo sa zobrazuje, aby sa dal hľadať a kopírovať. PDF vyzerá ako predtým.
   *[other] { $without } z { $pages } strán nemá text. Prečítajú sa a ich text sa neviditeľne položí pod to, čo sa zobrazuje, aby sa dal hľadať a kopírovať. PDF vyzerá ako predtým.
}
ocr-searchable-has-text = { $pages ->
    [one] Strana má text: PDF sa už dá prehľadávať.
    [few] Každá strana má text: PDF sa už dá prehľadávať.
   *[other] Každá strana má text: PDF sa už dá prehľadávať.
}
ocr-searchable-damaged = PDF sa nepodarilo rozobrať na úpravu: môže byť poškodené. Jeho text sa však dá načítať do projektu ako mapa.
ocr-searchable-make = Urobiť prehľadávateľným
ocr-strip = Odobrať neviditeľný text, ktorý majú, a ponechať len prečítaný
ocr-strip-hint = Pre zlú textovú vrstvu, akú pod stranu kladie skener. Viditeľné písmená ostanú a strana vyzerá ako predtým.
ocr-searchable-done = { $count ->
    [one] PDF je prehľadávateľné: prečítala sa jedna strana
    [few] PDF je prehľadávateľné: prečítali sa { $count } strany
   *[other] PDF je prehľadávateľné: prečítalo sa { $count } strán
}
ocr-searchable-failed = { $count ->
    [one] Jednu stranu sa nepodarilo prečítať.
    [few] { $count } strany sa nepodarilo prečítať.
   *[other] { $count } strán sa nepodarilo prečítať.
}

## A map from a PDF of the library

ocr-map-button = Mapa jeho textu…
ocr-map-title = Mapa textu
ocr-map-into = Do projektu
ocr-map-new-project = Nový projekt, pomenovaný podľa neho
ocr-map-making = Vytvára sa mapa…
ocr-map-failed = Mapu sa nepodarilo vytvoriť.

## The text of a picture of the store

ocr-picture-read = Prečítať text v ňom…
ocr-picture-title = Text v obrázku
ocr-picture-empty = V obrázku sa nenašiel žiadny text.
ocr-picture-copy = Kopírovať
ocr-picture-copied = Text je skopírovaný
ocr-picture-map = Vytvoriť z neho mapu

## Tesseract in the settings

ocr-settings-looking = Hľadá sa…
ocr-settings-missing = Nenašiel sa. Je potrebný na čítanie textu zo skenov a obrázkov. Nainštalujte tesseract správcom balíkov vášho systému spolu s dátami jazykov, ktoré čítate (na Archu tesseract-data-eng pre angličtinu, tesseract-data-slk pre slovenčinu, tesseract-data-grc pre starú gréčtinu, …), alebo nižšie povedzte, kde je.
ocr-settings-by-itself = Nájdený sám
ocr-settings-where = Kde je Tesseract
ocr-settings-look-failed = Tesseract sa nepodarilo hľadať
ocr-settings-has = Číta { $languages }.
ocr-settings-has-none = Nemá dáta žiadneho jazyka: nainštalujte dáta niektorého, napríklad tesseract-data-eng.
ocr-settings-first = Na začiatku čítať v
ocr-settings-first-hint = Keď nie je zvolený žiadny, jazyk textu a jazyk rozhrania.
ocr-settings-how = Ako sa text na začiatku číta
