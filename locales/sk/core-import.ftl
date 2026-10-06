# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = prilepený text
core-import-files = { $count ->
    [one] { $count } súbor
    [few] { $count } súbory
   *[other] { $count } súborov
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Súbor „{ $name }“ sa nenašiel.
core-import-empty-entry = Riadok { $line }: záznam „{ $key }“ je prázdny a bol vynechaný.
# Where in a file a reference that has no key was found.
core-import-origin-line = riadok { $line }
core-import-origin-key-line = { $key }, riadok { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = „{ $title }“
core-import-merge-gone = { $reference }: záznam, s ktorým sa mal zlúčiť, už neexistuje

## PDF files.

core-import-not-a-pdf = { $name } nie je PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Údaje pochádzajú zo služby { $service }.
core-import-number-unknown = V súbore sa našlo číslo, no v databázach o ňom nie je nič známe; údaje sú zo samotného súboru a treba ich skontrolovať.
core-import-databases-failed = Databáz sa nepodarilo opýtať ({ $error }); údaje sú zo samotného súboru a treba ich skontrolovať.

## Zotero.

core-import-zotero-my-library = Moja knižnica
core-import-zotero-group = Skupina { $id }
core-import-zotero-the-library = knižnica { $id } v Zotere
core-import-zotero-own-library = vlastná knižnica používateľa v Zotere
core-import-zotero-the-collection = zbierka { $key } v Zotere
core-import-zotero-unknown-base = Súbor „{ $name }“ sa nenašiel. Zotero naň odkazuje z priečinka, ktorý si samo zvolilo a ktorý tu nie je známy.
core-import-zotero-empty-item = Položka { $key } v Zotere je prázdna a bola vynechaná.
core-import-zotero-alone = { $count ->
    [one] { $count } súbor alebo poznámka stojí v Zotere mimo akéhokoľvek záznamu a bol vynechaný.
    [few] { $count } súbory a poznámky stoja v Zotere mimo akéhokoľvek záznamu a boli vynechané.
   *[other] { $count } súborov a poznámok stojí v Zotere mimo akéhokoľvek záznamu a bolo vynechaných.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero označuje { $name } ako { $role }, na čo BibLaTeX nemá pole. Meno bolo vynechané.
core-import-zotero-left-out = Pole Zotera „{ $field }“ nemá v BibLaTeXe náprotivok a bolo vynechané: { $value }

## Zotero's database.

core-import-zotero-no-database = databáza Zotera ({ $file }) v { $path }
core-import-zotero-copying = kopírovanie { $path } do dočasného priečinka
core-import-zotero-empty = súbor je prázdny
core-import-zotero-disturbed = Zotero počas čítania zapisovalo do svojej databázy. Ak niečo chýba, zavrite Zotero a importujte znova.
core-import-zotero-backup-read = Databázu Zotera sa nepodarilo prečítať ({ $error }). Namiesto nej sa prečítala jej záloha, { $backup }: čo sa v Zotere zmenilo od vytvorenia zálohy, chýba.
core-import-zotero-not-a-database = { $path } nie je databáza Zotera.
core-import-zotero-unreadable = Databáza Zotera má podobu, ktorú tu nemožno prečítať: { $what }. Ak ju zapísala stará verzia Zotera, stačí ju raz otvoriť v súčasnej a bude aktuálna.
core-import-zotero-unreadable-version = Databáza Zotera má podobu, ktorú tu nemožno prečítať (verzia { $version } databázy Zotera): { $what }. Ak ju zapísala stará verzia Zotera, stačí ju raz otvoriť v súčasnej a bude aktuálna.
core-import-zotero-no-table = chýba tabuľka „{ $table }“
core-import-zotero-no-column = tabuľka „{ $table }“ nemá stĺpec „{ $column }“
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Databáza Zotera nemá tabuľku „{ $table }“ v podobe, ktorá je tu známa: { $consequence }.
core-import-zotero-no-bin = položky v koši Zotera nemožno odlíšiť od ostatných
core-import-zotero-no-collections = zbierky sa neprečítali
core-import-zotero-no-attachments = priložené súbory sa neprečítali
core-import-zotero-no-notes = poznámky sa neprečítali
core-import-zotero-no-keywords = kľúčové slová sa neprečítali
core-import-zotero-no-group-names = názvy skupinových knižníc nie sú známe

## PDF files, as they are read for a reference.

core-import-pdf-empty = Súbor „{ $name }“ je prázdny.
core-import-pdf-not-a-pdf = Súbor „{ $name }“ nie je PDF.
core-import-pdf-unreadable = Súbor sa nepodarilo prečítať: je poškodený, chránený heslom alebo príliš veľký.
core-import-pdf-scan = Súbor nemá textovú vrstvu: je to sken.
core-import-pdf-from-file = Údaje sú zo samotného súboru, nie z katalógu, a treba ich skontrolovať.
core-import-pdf-from-metadata = V súbore sa nenašlo DOI ani ISBN; údaje sú z vlastných metadát súboru a treba ich skontrolovať.
core-import-pdf-unknown = V súbore sa nenašlo DOI ani ISBN a jeho metadáta nehovoria, čo to je: údaje treba vyplniť.

## Tables, from files of text and of sheets.

core-import-table-too-large = Súbor má { $size } MB. Tabuľka sa číta zo súboru s najviac { $most } MB.
core-import-table-kinds = Tabuľky sa čítajú z CSV a iného textu s hodnotami oddelenými čiarkami, bodkočiarkami alebo tabulátormi a z hárkov LibreOffice (.ods) a Excelu (.xlsx, .xls).
core-import-table-empty = V súbore nič nie je.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = { $rows ->
    [one] Tabuľka má { $rows } riadok. Tabuľka v texte ich môže mať najviac { $most }: nie je to tabuľkový hárok.
    [few] Tabuľka má { $rows } riadky. Tabuľka v texte ich môže mať najviac { $most }: nie je to tabuľkový hárok.
   *[other] Tabuľka má { $rows } riadkov. Tabuľka v texte ich môže mať najviac { $most }: nie je to tabuľkový hárok.
}
core-import-table-columns = { $columns ->
    [one] Tabuľka má { $columns } stĺpec. Tabuľka v texte ich môže mať najviac { $most }: nie je to tabuľkový hárok.
    [few] Tabuľka má { $columns } stĺpce. Tabuľka v texte ich môže mať najviac { $most }: nie je to tabuľkový hárok.
   *[other] Tabuľka má { $columns } stĺpcov. Tabuľka v texte ich môže mať najviac { $most }: nie je to tabuľkový hárok.
}
core-import-table-more-than = viac ako { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Čítanie bolo zastavené.
core-import-pdfs-stopped = Zisťovanie, čo sú tie súbory, bolo zastavené. Nič sa nepridalo.
core-import-document-kind = „{ $file }“ nie je druh súboru, ktorý možno načítať ako dokument. Načítať možno Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst a čistý text.
core-import-document-too-large = „{ $file }“ je väčší ako 50 MB, čo je viac, než možno načítať ako dokument.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = „{ $file }“ sa nepodarilo prečítať ako { $kind }. Môže byť poškodený alebo iného druhu, než hovorí jeho názov. Pandoc, ktorý ho číta, povedal: { $message }
core-import-document-pandoc-unreadable = čo Pandoc urobil z „{ $file }“, sa nepodarilo prečítať: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Bez názvu
core-import-document-plain-text = čistý text
core-import-document-notebook = zošit Jupyter

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Našla sa { $count } citácia, ktorá ešte nie je spojená so záznamom vašej knižnice, vytvorená programom na správu záznamov. Stojí ako text, ktorým bola napísaná, a možno ju prejsť pri vytváraní mapy aj neskôr.
       *[none] Našla sa { $count } citácia, ktorá ešte nie je spojená so záznamom vašej knižnice. Stojí ako text, ktorým bola napísaná, a možno ju prejsť pri vytváraní mapy aj neskôr.
    }
    [few] { $made ->
        [all] Našli sa { $count } citácie, ktoré ešte nie sú spojené so záznamami vašej knižnice, všetky vytvorené programom na správu záznamov. Stoja ako text, ktorým boli napísané, a možno ich prejsť pri vytváraní mapy aj neskôr.
        [some] Našli sa { $count } citácie, ktoré ešte nie sú spojené so záznamami vašej knižnice, { $some } z nich vytvorené programom na správu záznamov. Stoja ako text, ktorým boli napísané, a možno ich prejsť pri vytváraní mapy aj neskôr.
       *[none] Našli sa { $count } citácie, ktoré ešte nie sú spojené so záznamami vašej knižnice. Stoja ako text, ktorým boli napísané, a možno ich prejsť pri vytváraní mapy aj neskôr.
    }
   *[other] { $made ->
        [all] Našlo sa { $count } citácií, ktoré ešte nie sú spojené so záznamami vašej knižnice, všetky vytvorené programom na správu záznamov. Stoja ako text, ktorým boli napísané, a možno ich prejsť pri vytváraní mapy aj neskôr.
        [some] Našlo sa { $count } citácií, ktoré ešte nie sú spojené so záznamami vašej knižnice, { $some } z nich vytvorených programom na správu záznamov. Stoja ako text, ktorým boli napísané, a možno ich prejsť pri vytváraní mapy aj neskôr.
       *[none] Našlo sa { $count } citácií, ktoré ešte nie sú spojené so záznamami vašej knižnice. Stoja ako text, ktorým boli napísané, a možno ich prejsť pri vytváraní mapy aj neskôr.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } citácia vytvorená EndNotom sa načíta ako text, ktorý zobrazuje, a nie je medzi nájdenými: čo EndNote o dielach hovorí, sa nepodarilo prečítať.
    [few] { $count } citácie vytvorené EndNotom sa načítajú ako text, ktorý zobrazujú, a nie sú medzi nájdenými: čo EndNote o dielach hovorí, sa nepodarilo prečítať.
   *[other] { $count } citácií vytvorených EndNotom sa načíta ako text, ktorý zobrazujú, a nie sú medzi nájdenými: čo EndNote o dielach hovorí, sa nepodarilo prečítať.
}
core-import-document-bookmarks = { $count ->
    [one] Dokument uchováva { $count } citáciu v záložke a čo cituje, sa nepodarilo prečítať: je to text, ako stojí. Zotero ich takto ukladá tam, kde to určujú jeho predvoľby dokumentu.
    [few] Dokument uchováva { $count } citácie v záložkách a čo citujú, sa nepodarilo prečítať: je to text, ako stojí. Zotero ich takto ukladá tam, kde to určujú jeho predvoľby dokumentu.
   *[other] Dokument uchováva { $count } citácií v záložkách a čo citujú, sa nepodarilo prečítať: je to text, ako stojí. Zotero ich takto ukladá tam, kde to určujú jeho predvoľby dokumentu.
}
core-import-document-bibliography = Dokument má zoznam toho, čo cituje, pod nadpisom „{ $heading }“. Načíta sa ako text, tak ako ostatné. Mapa si z toho, čo sa v nej cituje, vytvorí vlastnú bibliografiu.
core-import-document-bibliography-made = Dokument má zoznam toho, čo cituje, vytvorený programom, ktorý spravuje jeho záznamy. Načíta sa ako text, tak ako ostatné. Mapa si z toho, čo sa v nej cituje, vytvorí vlastnú bibliografiu.
core-import-document-tracked = Dokument má sledované zmeny. Text sa načíta tak, ako stojí po prijatí všetkých.
core-import-document-comments = Dokument má komentáre na okraji, ktoré sa vynechajú.
core-import-document-heading-notes = { $count ->
    [one] Poznámka k nadpisu stojí na začiatku textu pod ním: nadpis nemôže mať poznámku.
    [few] { $count } poznámky k nadpisom stoja na začiatku textu pod nimi: nadpis nemôže mať poznámku.
   *[other] { $count } poznámok k nadpisom stojí na začiatku textu pod nimi: nadpis nemôže mať poznámku.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } popiska sa začínala slovom a číslom, ako „{ $first }“. Vynecháva sa: mapa si svoje vyobrazenia a tabuľky čísluje sama. Kde ich text menuje číslom, je to text, ako bol napísaný, a nesleduje číslovanie mapy.
    [few] { $count } popisky sa začínali slovom a číslom, ako „{ $first }“. Vynechávajú sa: mapa si svoje vyobrazenia a tabuľky čísluje sama. Kde ich text menuje číslom, je to text, ako bol napísaný, a nesleduje číslovanie mapy.
   *[other] { $count } popisiek sa začínalo slovom a číslom, ako „{ $first }“. Vynechávajú sa: mapa si svoje vyobrazenia a tabuľky čísluje sama. Kde ich text menuje číslom, je to text, ako bol napísaný, a nesleduje číslovanie mapy.
}
core-import-document-label-example = Obrázok 1:
core-import-document-caption-notes = { $count ->
    [one] Poznámka v popiske vyobrazenia alebo tabuľky tam stojí v zátvorkách.
    [few] { $count } poznámky v popiskách vyobrazení alebo tabuliek tam stoja v zátvorkách.
   *[other] { $count } poznámok v popiskách vyobrazení alebo tabuliek tam stojí v zátvorkách.
}
core-import-document-headings = { $count ->
    [one] { $count } nadpis v citáte, zozname alebo tabuľke sa načíta ako odsek tučným písmom.
    [few] { $count } nadpisy v citáte, zozname alebo tabuľke sa načítajú ako odseky tučným písmom.
   *[other] { $count } nadpisov v citáte, zozname alebo tabuľke sa načíta ako odseky tučným písmom.
}
core-import-document-code = { $count ->
    [one] { $count } blok kódu sa načíta ako obyčajné odseky, každý riadok zvlášť.
    [few] { $count } bloky kódu sa načítajú ako obyčajné odseky, každý riadok zvlášť.
   *[other] { $count } blokov kódu sa načíta ako obyčajné odseky, každý riadok zvlášť.
}
core-import-document-definitions = { $count ->
    [one] { $count } zoznam termínov s ich významom sa načíta ako odseky, termíny tučným písmom.
    [few] { $count } zoznamy termínov s ich významom sa načítajú ako odseky, termíny tučným písmom.
   *[other] { $count } zoznamov termínov s ich významom sa načíta ako odseky, termíny tučným písmom.
}
core-import-document-rules = { $count ->
    [one] { $count } čiara cez stranu sa vynecháva.
    [few] { $count } čiary cez stranu sa vynechávajú.
   *[other] { $count } čiar cez stranu sa vynecháva.
}
core-import-document-raw = { $count ->
    [one] { $count } kus napísaný v HTML alebo TeXu len pre jeden druh dokumentu sa vynecháva.
    [few] { $count } kusy napísané v HTML alebo TeXu len pre jeden druh dokumentu sa vynechávajú.
   *[other] { $count } kusov napísaných v HTML alebo TeXu len pre jeden druh dokumentu sa vynecháva.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } obrázok, ktorý súbor obsahuje, nie je v prečítanom texte a vynecháva sa. Môže stáť v záhlaví alebo päte strán, alebo v kresbe.
    [few] { $count } obrázky, ktoré súbor obsahuje, nie sú v prečítanom texte a vynechávajú sa. Môžu stáť v záhlaví alebo päte strán, alebo v kresbe.
   *[other] { $count } obrázkov, ktoré súbor obsahuje, nie je v prečítanom texte a vynechávajú sa. Môžu stáť v záhlaví alebo päte strán, alebo v kresbe.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Obrázok „{ $name }“ sa vynecháva: { $why }.
core-import-document-picture-kind = je druhu, ktorý sa nečíta ({ $kind })
core-import-document-picture-not-read = nie je obrázok druhu, ktorý sa číta
core-import-document-picture-unreadable = nepodarilo sa ho prečítať
core-import-document-picture-network = je na sieti a odtiaľ sa nič nesťahuje
core-import-document-picture-not-taken-out = nepodarilo sa ho zo súboru vybrať
core-import-document-picture-outside = nie je v súbore, ale inde v tomto počítači, a odtiaľ sa neberie
core-import-document-picture-not-found = súbor sa nenašiel tam, kde dokument hovorí, že je
core-import-document-picture-too-large = je väčší ako 50 MB
core-import-document-picture-file-unreadable = súbor sa nepodarilo prečítať
