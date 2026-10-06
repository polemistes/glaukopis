# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Obrázky
pictures-all = Všechny obrázky
pictures-picture = Obrázek
pictures-search-placeholder = Hledat v obrázcích
pictures-clear-search = Vymazat hledání
pictures-count = { $count ->
    [one] { $count } obrázek
    [few] { $count } obrázky
   *[other] { $count } obrázků
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } z { $count ->
    [one] { $count } obrázku
    [few] { $count } obrázků
   *[other] { $count } obrázků
}
pictures-add = Přidat obrázky…
pictures-empty = Úložiště je prázdné
pictures-empty-text = Obrázky, které sem přidáte, lze použít ve všech vašich projektech, a obrázek vložený do textu se uchová zde. Přidejte nějaké, nebo je přetáhněte do tohoto okna.
pictures-nothing-found = Nic nenalezeno
pictures-nothing-found-text = Žádný obrázek neobsahuje všechna tato slova.
# What a picture that has no name is called.
pictures-unnamed = Obrázek
pictures-with-notes = S poznámkami

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Přidat obrázky
pictures-files = Obrázky
pictures-taken-in = { $count ->
    [one] „{ $name }“ je v úložišti
    [few] { $count } obrázky jsou v úložišti
   *[other] { $count } obrázků je v úložišti
}
pictures-remove-title = Odebrat „{ $name }“ z úložiště?
pictures-remove-unused = Žádný projekt obrázek nepoužívá. Co se o něm zde říká, i vaše poznámky k němu, se odeberou s ním.
pictures-remove-used = { $count ->
    [one] { $count } projekt obrázek používá. Jeho vyobrazení zůstanou bez obrázku. Co se o něm zde říká, i vaše poznámky k němu, se odeberou s ním.
    [few] { $count } projekty obrázek používají. Jejich vyobrazení zůstanou bez obrázku. Co se o něm zde říká, i vaše poznámky k němu, se odeberou s ním.
   *[other] { $count } projektů obrázek používá. Jejich vyobrazení zůstanou bez obrázku. Co se o něm zde říká, i vaše poznámky k němu, se odeberou s ním.
}
pictures-no-backend = Není žádný backend.

## One picture

pictures-name = Název
pictures-name-placeholder = Jak se obrázek jmenuje
pictures-caption = Popisek
pictures-caption-placeholder = Co se o obrázku říká
pictures-caption-hint = Vyobrazení z tohoto obrázku začínají těmito slovy. Co se říká o vyobrazení, lze změnit tam, aniž se změní toto.
pictures-italic = Kurzíva
pictures-small-caps = Kapitálky
# What the picture shows, in words, for those who do not see it.
pictures-alt = Zobrazuje
pictures-alt-placeholder = Slovy, pro ty, kdo jej nevidí
pictures-absent = Obrázek není v tomto počítači. Projekt ho používá a zobrazí se, až přijde od toho, kdo ho tam vložil.
pictures-notes = Poznámky
pictures-note-project = V tomto projektu
pictures-note-project-placeholder = Co si o něm myslíte, pro tuto práci
pictures-note-project-hint = Co je zde napsáno, mají všichni, kdo mají projekt.
pictures-note-for-all = Ponechat pro všechny projekty
pictures-note-write-for-all = Psát pro všechny projekty
pictures-note-all = Ve všech projektech
pictures-note-all-placeholder = Co si o něm myslíte, ať ho použijete kdekoli
pictures-note-all-hint = Uchováno s obrázkem v úložišti, v tomto počítači.
pictures-note-placeholder = Co si o něm myslíte. Pro vás: není to součást žádného dokumentu.
pictures-note-label = Vaše poznámky k tomuto obrázku
pictures-file = Soubor
pictures-kind = Druh
pictures-kind-svg = SVG, kresba
pictures-dimensions-label = Šířka a výška
pictures-dimensions = { $width } × { $height } bodů
pictures-size = Velikost
# When the picture was taken into the store.
pictures-added = Přidán
pictures-used-in = Použit v
pictures-this-project = Tento projekt
# A map that has no name.
pictures-untitled = Bez názvu
pictures-unused = Žádný projekt obrázek nepoužívá.
pictures-remove = Odebrat z úložiště
