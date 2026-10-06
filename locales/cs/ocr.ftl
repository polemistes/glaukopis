# Text read from PDFs and pictures by Tesseract: in the dialog of documents
# brought in, in the files of a reference, in the store of pictures, and in
# the settings. See locales/README.md.

## Reading

ocr-filter = PDF a obrázky
ocr-no-tesseract = Tesseract, který čte text v obrázcích, není nainstalován nebo nebyl nalezen. Nainstalujte ho správcem balíčků svého systému, s daty jazyků, které čtete (na Archu: tesseract a tesseract-data-eng, tesseract-data-ces a tak dále), nebo řekněte v nastavení, kde je.
ocr-failed = Text nelze přečíst.
ocr-looking = Prohlíží se { $file }…
ocr-about-picture = Text se čte z obrázku.
ocr-about-scan = { $pages ->
    [one] PDF nemá text: čte se z obrazu jeho stránky.
    [few] Žádná z { $pages } stránek nemá text: čtou se z jejich obrazů.
   *[other] Žádná z { $pages } stránek nemá text: čtou se z jejich obrazů.
}
ocr-about-some = { $without ->
    [one] Jedna z { $pages } stránek nemá text a čte se z jejího obrazu; ostatní se přebírají, jak jsou.
    [few] { $without } z { $pages } stránek nemají text a čtou se z jejich obrazů; ostatní se přebírají, jak jsou.
   *[other] { $without } z { $pages } stránek nemá text a čte se z jejich obrazů; ostatní se přebírají, jak jsou.
}
ocr-about-text = { $pages ->
    [one] Stránka má text, který se přebírá, jak je.
    [few] Každá stránka má text, který se přebírá, jak je.
   *[other] Každá stránka má text, který se přebírá, jak je.
}
ocr-read-all = Číst i stránky, které text mají
ocr-read-all-hint = Jejich text zůstane a přečtené se položí přes něj.
ocr-read-all-map-hint = Přečtené nahradí jejich text: pro případ, že je špatný nebo nejde přečíst.
ocr-read = Číst text
ocr-read-text-pages = Převzít stránky, které text mají
ocr-take-text = Převzít text
ocr-reading = Čte se { $file }…
ocr-reading-pages = { $done ->
    [one] Přečtena { $done } z { $total } stránek
    [few] Přečteny { $done } z { $total } stránek
   *[other] Přečteno { $done } z { $total } stránek
}
ocr-reading-hint = Stránka trvá několik sekund. Zrušit čtení zastaví.

## How the text is read: what to try when a reading goes badly

ocr-how = Jak se čte
ocr-how-dpi = Rozlišení, v bodech na palec
ocr-how-layout = Rozvržení stránky
ocr-how-layout-auto = Jak usoudí Tesseract
ocr-how-layout-column = Jeden sloupec
ocr-how-layout-block = Jeden blok textu
ocr-how-layout-sparse = Řídký text
ocr-how-contrast = Černobíle
ocr-how-hint = Co zkusit, když čtení dopadne špatně: vyšší rozlišení pro drobný tisk, jeden sloupec, když se sloupce pletou, jeden blok textu pro jediný odstavec a černobíle pro slabý nebo nerovnoměrný tisk.

## The languages of the text

ocr-languages = Jazyky textu
ocr-languages-hint = Nejpravděpodobnější první. Každý další čtení zpomalí a ne vždy zlepší.
ocr-language-add = Přidat jazyk…
ocr-language-remove = Odebrat { $language }
# A script rather than a language: "Latin script".
ocr-language-script = { $script } (písmo)
ocr-language-fraktur = { $language }, fraktura
ocr-language-old = { $language }, starší
ocr-language-vertical = { $language }, psaný svisle

## A PDF of the library made searchable

ocr-searchable-button = Učinit prohledávatelným…
ocr-searchable-title = Učinit PDF prohledávatelným
ocr-searchable-about = { $without ->
    [one] Jedna z { $pages } stránek nemá text. Přečte se a její text se neviditelně položí pod to, co je vidět, aby se v něm dalo hledat a kopírovat. PDF bude vypadat jako dosud.
    [few] { $without } z { $pages } stránek nemají text. Přečtou se a jejich text se neviditelně položí pod to, co je vidět, aby se v něm dalo hledat a kopírovat. PDF bude vypadat jako dosud.
   *[other] { $without } z { $pages } stránek nemá text. Přečtou se a jejich text se neviditelně položí pod to, co je vidět, aby se v něm dalo hledat a kopírovat. PDF bude vypadat jako dosud.
}
ocr-searchable-has-text = { $pages ->
    [one] Stránka má text: v PDF už lze hledat.
    [few] Každá stránka má text: v PDF už lze hledat.
   *[other] Každá stránka má text: v PDF už lze hledat.
}
ocr-searchable-damaged = PDF nelze rozebrat, aby se dalo změnit: může být poškozené. Jeho text lze přesto načíst do projektu jako mapu.
ocr-searchable-make = Učinit prohledávatelným
ocr-strip = Odstranit neviditelný text, který mají, a ponechat jen přečtený
ocr-strip-hint = Pro špatnou textovou vrstvu, jakou pod stránku klade skener. Viditelná písmena zůstanou a stránka bude vypadat jako dosud.
ocr-searchable-done = { $count ->
    [one] PDF je prohledávatelné: přečtena jedna stránka
    [few] PDF je prohledávatelné: přečteny { $count } stránky
   *[other] PDF je prohledávatelné: přečteno { $count } stránek
}
ocr-searchable-failed = { $count ->
    [one] Jednu stránku nelze přečíst.
    [few] { $count } stránky nelze přečíst.
   *[other] { $count } stránek nelze přečíst.
}

## A map from a PDF of the library

ocr-map-button = Mapa jeho textu…
ocr-map-title = Mapa textu
ocr-map-into = Do projektu
ocr-map-new-project = Nový projekt, pojmenovaný po něm
ocr-map-making = Vytváří se mapa…
ocr-map-failed = Mapu nelze vytvořit.

## The text of a picture of the store

ocr-picture-read = Přečíst text v něm…
ocr-picture-title = Text v obrázku
ocr-picture-empty = V obrázku nebyl nalezen žádný text.
ocr-picture-copy = Kopírovat
ocr-picture-copied = Text je zkopírován
ocr-picture-map = Vytvořit z něj mapu

## Tesseract in the settings

ocr-settings-looking = Hledá se…
ocr-settings-missing = Nenalezen. Je potřeba ke čtení textu ze skenů a obrázků. Nainstalujte tesseract správcem balíčků svého systému, s daty jazyků, které čtete (na Archu tesseract-data-eng pro angličtinu, tesseract-data-ces pro češtinu, tesseract-data-grc pro starou řečtinu, …), nebo níže řekněte, kde je.
ocr-settings-by-itself = Nalezen sám
ocr-settings-where = Kde je Tesseract
ocr-settings-look-failed = Tesseract nelze hledat
ocr-settings-has = Čte { $languages }.
ocr-settings-has-none = Nemá data žádného jazyka: nainstalujte data některého, například tesseract-data-eng.
ocr-settings-first = Zprvu číst v
ocr-settings-first-hint = Není-li zvolen žádný, jazyk textu a jazyk rozhraní.
ocr-settings-how = Jak se text zprvu čte
