# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = ve vloženém textu
core-import-files = { $count ->
    [one] v { $count } souboru
    [few] ve { $count } souborech
   *[other] v { $count } souborech
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Soubor „{ $name }“ nebyl nalezen.
core-import-empty-entry = Řádek { $line }: záznam „{ $key }“ je prázdný a byl vynechán.
# Where in a file a reference that has no key was found.
core-import-origin-line = řádek { $line }
core-import-origin-key-line = { $key }, řádek { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = „{ $title }“
core-import-merge-gone = { $reference }: záznam, s nímž se měl sloučit, už tu není

## PDF files.

core-import-not-a-pdf = { $name } není PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Údaje pocházejí ze služby { $service }.
core-import-number-unknown = V souboru bylo nalezeno číslo, ale databáze o něm nic nevědí; údaje jsou ze souboru samého a je třeba je zkontrolovat.
core-import-databases-failed = Databází se nepodařilo zeptat ({ $error }); údaje jsou ze souboru samého a je třeba je zkontrolovat.

## Zotero.

core-import-zotero-my-library = Moje knihovna
core-import-zotero-group = Skupina { $id }
core-import-zotero-the-library = knihovna { $id } v Zoteru
core-import-zotero-own-library = vlastní knihovna uživatele v Zoteru
core-import-zotero-the-collection = sbírka { $key } v Zoteru
core-import-zotero-unknown-base = Soubor „{ $name }“ nebyl nalezen. Zotero na něj odkazuje ze složky, kterou si samo zvolilo a která zde není známa.
core-import-zotero-empty-item = Položka { $key } v Zoteru je prázdná a byla vynechána.
core-import-zotero-alone = { $count ->
    [one] { $count } soubor či poznámka nepatří v Zoteru k žádnému záznamu a byl vynechán.
    [few] { $count } soubory či poznámky nepatří v Zoteru k žádnému záznamu a byly vynechány.
   *[other] { $count } souborů či poznámek nepatří v Zoteru k žádnému záznamu a bylo vynecháno.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero uvádí { $name } jako { $role }, pro což BibLaTeX nemá pole. Jméno bylo vynecháno.
core-import-zotero-left-out = Pole Zotera „{ $field }“ nemá v BibLaTeXu protějšek a bylo vynecháno: { $value }

## Zotero's database.

core-import-zotero-no-database = databáze Zotera ({ $file }) v { $path }
core-import-zotero-copying = kopírování { $path } do dočasné složky
core-import-zotero-empty = soubor je prázdný
core-import-zotero-disturbed = Zotero do své databáze zapisovalo, zatímco byla čtena. Pokud něco chybí, zavřete Zotero a importujte znovu.
core-import-zotero-backup-read = Databázi Zotera nelze přečíst ({ $error }). Místo ní byla přečtena její záloha { $backup }: co se v Zoteru změnilo od pořízení zálohy, chybí.
core-import-zotero-not-a-database = { $path } není databáze Zotera.
core-import-zotero-unreadable = Databáze Zotera má podobu, kterou zde nelze přečíst: { $what }. Pokud ji zapsala stará verze Zotera, stačí ji jednou otevřít v aktuální verzi a bude převedena.
core-import-zotero-unreadable-version = Databáze Zotera má podobu, kterou zde nelze přečíst (verze { $version } databáze Zotera): { $what }. Pokud ji zapsala stará verze Zotera, stačí ji jednou otevřít v aktuální verzi a bude převedena.
core-import-zotero-no-table = chybí tabulka „{ $table }“
core-import-zotero-no-column = tabulka „{ $table }“ nemá sloupec „{ $column }“
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Databáze Zotera nemá tabulku „{ $table }“ v podobě, která je zde známa: { $consequence }.
core-import-zotero-no-bin = položky v koši Zotera nelze odlišit od ostatních
core-import-zotero-no-collections = sbírky nebyly přečteny
core-import-zotero-no-attachments = přiložené soubory nebyly přečteny
core-import-zotero-no-notes = poznámky nebyly přečteny
core-import-zotero-no-keywords = klíčová slova nebyla přečtena
core-import-zotero-no-group-names = názvy skupinových knihoven nejsou známy

## PDF files, as they are read for a reference.

core-import-pdf-empty = Soubor „{ $name }“ je prázdný.
core-import-pdf-not-a-pdf = Soubor „{ $name }“ není PDF.
core-import-pdf-unreadable = Soubor nelze přečíst: je poškozený, chráněný heslem nebo příliš velký.
core-import-pdf-scan = Soubor nemá textovou vrstvu: je to sken.
core-import-pdf-from-file = Údaje jsou ze souboru samého, ne z katalogu, a je třeba je zkontrolovat.
core-import-pdf-from-metadata = V souboru nebylo nalezeno DOI ani ISBN; údaje jsou z metadat souboru a je třeba je zkontrolovat.
core-import-pdf-unknown = V souboru nebylo nalezeno DOI ani ISBN a jeho metadata neříkají, co to je: údaje je třeba vyplnit.

## Tables, from files of text and of sheets.

core-import-table-too-large = Soubor má { $size } MB. Tabulka se čte ze souboru nejvýše o { $most } MB.
core-import-table-kinds = Tabulky se čtou z CSV a jiného textu s hodnotami oddělenými čárkami, středníky nebo tabulátory a ze sešitů LibreOffice (.ods) a Excelu (.xlsx, .xls).
core-import-table-empty = V souboru nic není.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Tabulka má { $rows } řádků. Tabulka v textu jich může mít nejvýše { $most }: není to tabulkový procesor.
core-import-table-columns = Tabulka má { $columns } sloupců. Tabulka v textu jich může mít nejvýše { $most }: není to tabulkový procesor.
core-import-table-more-than = více než { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Čtení bylo zastaveno.
core-import-pdfs-stopped = Zjišťování, co soubory jsou, bylo zastaveno. Nic nebylo přidáno.
core-import-document-kind = „{ $file }“ není druhu, který lze načíst jako dokument. Načíst lze Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst a prostý text.
core-import-document-too-large = „{ $file }“ je větší než 50 MB, což je víc, než lze načíst jako dokument.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = „{ $file }“ nelze přečíst jako { $kind }. Může být poškozený, nebo jiného druhu, než říká jeho název. Pandoc, který jej čte, řekl: { $message }
core-import-document-pandoc-unreadable = co Pandoc udělal z „{ $file }“, nelze přečíst: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Bez názvu
core-import-document-plain-text = prostý text
core-import-document-notebook = sešit Jupyter

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Byla nalezena { $count } citace, která ještě není spojena se záznamem vaší knihovny; vytvořil ji program na správu záznamů. Stojí v textu tak, jak byla napsána, a lze ji projít, až bude mapa vytvořena, i později.
       *[none] Byla nalezena { $count } citace, která ještě není spojena se záznamem vaší knihovny. Stojí v textu tak, jak byla napsána, a lze ji projít, až bude mapa vytvořena, i později.
    }
    [few] { $made ->
        [all] Byly nalezeny { $count } citace, které ještě nejsou spojeny se záznamy vaší knihovny; všechny vytvořil program na správu záznamů. Stojí v textu tak, jak byly napsány, a lze je projít, až bude mapa vytvořena, i později.
        [some] Byly nalezeny { $count } citace, které ještě nejsou spojeny se záznamy vaší knihovny; { $some } z nich vytvořil program na správu záznamů. Stojí v textu tak, jak byly napsány, a lze je projít, až bude mapa vytvořena, i později.
       *[none] Byly nalezeny { $count } citace, které ještě nejsou spojeny se záznamy vaší knihovny. Stojí v textu tak, jak byly napsány, a lze je projít, až bude mapa vytvořena, i později.
    }
   *[other] { $made ->
        [all] Bylo nalezeno { $count } citací, které ještě nejsou spojeny se záznamy vaší knihovny; všechny vytvořil program na správu záznamů. Stojí v textu tak, jak byly napsány, a lze je projít, až bude mapa vytvořena, i později.
        [some] Bylo nalezeno { $count } citací, které ještě nejsou spojeny se záznamy vaší knihovny; { $some } z nich vytvořil program na správu záznamů. Stojí v textu tak, jak byly napsány, a lze je projít, až bude mapa vytvořena, i později.
       *[none] Bylo nalezeno { $count } citací, které ještě nejsou spojeny se záznamy vaší knihovny. Stojí v textu tak, jak byly napsány, a lze je projít, až bude mapa vytvořena, i později.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } citace vytvořená EndNotem je načtena jako text, který zobrazuje, a není mezi nalezenými: co EndNote o dílech říká, nelze přečíst.
    [few] { $count } citace vytvořené EndNotem jsou načteny jako text, který zobrazují, a nejsou mezi nalezenými: co EndNote o dílech říká, nelze přečíst.
   *[other] { $count } citací vytvořených EndNotem je načteno jako text, který zobrazují, a nejsou mezi nalezenými: co EndNote o dílech říká, nelze přečíst.
}
core-import-document-bookmarks = { $count ->
    [one] Dokument má { $count } citaci v záložce a co cituje, nelze přečíst: je to text, jak stojí. Zotero je tak ukládá, pokud to má v nastavení dokumentu.
    [few] Dokument má { $count } citace v záložkách a co citují, nelze přečíst: je to text, jak stojí. Zotero je tak ukládá, pokud to má v nastavení dokumentu.
   *[other] Dokument má { $count } citací v záložkách a co citují, nelze přečíst: je to text, jak stojí. Zotero je tak ukládá, pokud to má v nastavení dokumentu.
}
core-import-document-bibliography = Dokument má seznam toho, co cituje, pod nadpisem „{ $heading }“. Je načten jako text, jako vše ostatní. Mapa si bibliografii vytvoří sama z toho, co se v ní cituje.
core-import-document-bibliography-made = Dokument má seznam toho, co cituje, vytvořený programem na správu záznamů. Je načten jako text, jako vše ostatní. Mapa si bibliografii vytvoří sama z toho, co se v ní cituje.
core-import-document-tracked = Dokument má sledované změny. Text je načten tak, jak stojí po přijetí všech.
core-import-document-comments = Dokument má komentáře na okraji, které jsou vynechány.
core-import-document-heading-notes = { $count ->
    [one] Poznámka k nadpisu stojí na začátku textu pod ním: nadpis poznámku mít nemůže.
    [few] { $count } poznámky k nadpisům stojí na začátku textu pod nimi: nadpis poznámku mít nemůže.
   *[other] { $count } poznámek k nadpisům stojí na začátku textu pod nimi: nadpis poznámku mít nemůže.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } popisek začínal slovem a číslem, například „{ $first }“. Je vynecháno: mapa si vyobrazení a tabulky čísluje sama. Kde text některé z nich jmenuje číslem, je to text, jak byl napsán, a čísla mapy nesleduje.
    [few] { $count } popisky začínaly slovem a číslem, například „{ $first }“. Jsou vynechány: mapa si vyobrazení a tabulky čísluje sama. Kde text některé z nich jmenuje číslem, je to text, jak byl napsán, a čísla mapy nesleduje.
   *[other] { $count } popisků začínalo slovem a číslem, například „{ $first }“. Jsou vynechány: mapa si vyobrazení a tabulky čísluje sama. Kde text některé z nich jmenuje číslem, je to text, jak byl napsán, a čísla mapy nesleduje.
}
core-import-document-label-example = Obrázek 1:
core-import-document-caption-notes = { $count ->
    [one] Poznámka v popisku vyobrazení či tabulky tam stojí v závorkách.
    [few] { $count } poznámky v popiscích vyobrazení či tabulek tam stojí v závorkách.
   *[other] { $count } poznámek v popiscích vyobrazení či tabulek tam stojí v závorkách.
}
core-import-document-headings = { $count ->
    [one] { $count } nadpis v citátu, seznamu nebo tabulce je načten jako odstavec tučně.
    [few] { $count } nadpisy v citátu, seznamu nebo tabulce jsou načteny jako odstavce tučně.
   *[other] { $count } nadpisů v citátu, seznamu nebo tabulce je načteno jako odstavce tučně.
}
core-import-document-code = { $count ->
    [one] { $count } blok kódu je načten jako prosté odstavce, řádek po řádku.
    [few] { $count } bloky kódu jsou načteny jako prosté odstavce, řádek po řádku.
   *[other] { $count } bloků kódu je načteno jako prosté odstavce, řádek po řádku.
}
core-import-document-definitions = { $count ->
    [one] { $count } seznam termínů s jejich významy je načten jako odstavce, termíny tučně.
    [few] { $count } seznamy termínů s jejich významy jsou načteny jako odstavce, termíny tučně.
   *[other] { $count } seznamů termínů s jejich významy je načteno jako odstavce, termíny tučně.
}
core-import-document-rules = { $count ->
    [one] { $count } čára přes stránku je vynechána.
    [few] { $count } čáry přes stránku jsou vynechány.
   *[other] { $count } čar přes stránku je vynecháno.
}
core-import-document-raw = { $count ->
    [one] { $count } úsek napsaný v HTML nebo TeXu jen pro jeden druh dokumentu je vynechán.
    [few] { $count } úseky napsané v HTML nebo TeXu jen pro jeden druh dokumentu jsou vynechány.
   *[other] { $count } úseků napsaných v HTML nebo TeXu jen pro jeden druh dokumentu je vynecháno.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } obrázek, který soubor obsahuje, není v přečteném textu a je vynechán. Může stát v záhlaví či zápatí stránek, nebo v kresbě.
    [few] { $count } obrázky, které soubor obsahuje, nejsou v přečteném textu a jsou vynechány. Mohou stát v záhlaví či zápatí stránek, nebo v kresbě.
   *[other] { $count } obrázků, které soubor obsahuje, není v přečteném textu a je vynecháno. Mohou stát v záhlaví či zápatí stránek, nebo v kresbě.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Obrázek „{ $name }“ je vynechán: { $why }.
core-import-document-picture-kind = je druhu, který se nečte ({ $kind })
core-import-document-picture-not-read = není obrázek druhu, který se čte
core-import-document-picture-unreadable = nelze jej přečíst
core-import-document-picture-network = je na síti a odtud se nic nestahuje
core-import-document-picture-not-taken-out = nelze jej ze souboru vyjmout
core-import-document-picture-outside = není v souboru, ale jinde v tomto počítači, a odtud se nebere
core-import-document-picture-not-found = soubor nebyl nalezen tam, kde dokument říká, že je
core-import-document-picture-too-large = je větší než 50 MB
core-import-document-picture-file-unreadable = soubor nelze přečíst
