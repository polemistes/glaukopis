# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = налепљени текст
core-import-files = { $count ->
    [one] { $count } датотека
    [few] { $count } датотеке
   *[other] { $count } датотека
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Датотека „{ $name }“ није пронађена.
core-import-empty-entry = Ред { $line }: унос „{ $key }“ је празан и изостављен је.
# Where in a file a reference that has no key was found.
core-import-origin-line = ред { $line }
core-import-origin-key-line = { $key }, ред { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = „{ $title }“
core-import-merge-gone = { $reference }: уноса с којим би се спојио више нема

## PDF files.

core-import-not-a-pdf = { $name } није PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Подаци су из сервиса { $service }.
core-import-number-unknown = У датотеци је нађен број, али базе о њему ништа не знају; подаци су из саме датотеке и треба их проверити.
core-import-databases-failed = Базе није било могуће упитати ({ $error }); подаци су из саме датотеке и треба их проверити.

## Zotero.

core-import-zotero-my-library = Моја библиотека
core-import-zotero-group = Група { $id }
core-import-zotero-the-library = библиотека { $id } у програму Zotero
core-import-zotero-own-library = корисникова сопствена библиотека у програму Zotero
core-import-zotero-the-collection = збирка { $key } у програму Zotero
core-import-zotero-unknown-base = Датотека „{ $name }“ није пронађена. Zotero на њу упућује из фасцикле коју је сам изабрао, а која овде није позната.
core-import-zotero-empty-item = Ставка { $key } у програму Zotero је празна и изостављена је.
core-import-zotero-alone = { $count ->
    [one] { $count } датотека или белешка стоји у програму Zotero без референце и изостављена је.
    [few] { $count } датотеке и белешке стоје у програму Zotero без референце и изостављене су.
   *[other] { $count } датотека и бележака стоји у програму Zotero без референце и изостављено је.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero наводи { $name } као { $role }, за шта BibLaTeX нема поље. Име је изостављено.
core-import-zotero-left-out = Поље „{ $field }“ из програма Zotero нема одговарајућег поља у формату BibLaTeX и изостављено је: { $value }

## Zotero's database.

core-import-zotero-no-database = база програма Zotero ({ $file }) у { $path }
core-import-zotero-copying = копирање { $path } у привремену фасциклу
core-import-zotero-empty = датотека је празна
core-import-zotero-disturbed = Zotero је уписивао у своју базу док је она читана. Ако нешто недостаје, затворите Zotero и увезите поново.
core-import-zotero-backup-read = База програма Zotero није могла да се прочита ({ $error }). Уместо ње прочитана је њена резервна копија, { $backup }: недостаје оно што је у програму Zotero измењено откако је копија направљена.
core-import-zotero-not-a-database = { $path } није база програма Zotero.
core-import-zotero-unreadable = База програма Zotero има облик који се овде не може прочитати: { $what }. Ако ју је уписала стара верзија програма Zotero, довољно је једном је отворити у новој да се осавремени.
core-import-zotero-unreadable-version = База програма Zotero има облик који се овде не може прочитати (верзија { $version } базе): { $what }. Ако ју је уписала стара верзија програма Zotero, довољно је једном је отворити у новој да се осавремени.
core-import-zotero-no-table = нема табеле „{ $table }“
core-import-zotero-no-column = табела „{ $table }“ нема колону „{ $column }“
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = База програма Zotero нема табелу „{ $table }“ у облику који је овде познат: { $consequence }.
core-import-zotero-no-bin = ставке у корпи програма Zotero не могу се разликовати од осталих
core-import-zotero-no-collections = збирке нису прочитане
core-import-zotero-no-attachments = приложене датотеке нису прочитане
core-import-zotero-no-notes = белешке нису прочитане
core-import-zotero-no-keywords = кључне речи нису прочитане
core-import-zotero-no-group-names = називи групних библиотека нису познати

## PDF files, as they are read for a reference.

core-import-pdf-empty = Датотека „{ $name }“ је празна.
core-import-pdf-not-a-pdf = Датотека „{ $name }“ није PDF.
core-import-pdf-unreadable = Датотека није могла да се прочита: оштећена је, заштићена лозинком или превелика.
core-import-pdf-scan = Датотека нема текстуални слој: то је скен.
core-import-pdf-from-file = Подаци су из саме датотеке, не из каталога, и треба их проверити.
core-import-pdf-from-metadata = У датотеци није нађен ни DOI ни ISBN; подаци су из метаподатака саме датотеке и треба их проверити.
core-import-pdf-unknown = У датотеци није нађен ни DOI ни ISBN, а њени метаподаци не кажу шта је она: податке треба унети.

## Tables, from files of text and of sheets.

core-import-table-too-large = Датотека има { $size } MB. Табела се чита из датотеке од највише { $most } MB.
core-import-table-kinds = Табеле се читају из CSV-а и другог текста с вредностима раздвојеним зарезима, тачка-зарезима или табулаторима, и из табеларних докумената програма LibreOffice (.ods) и Excel (.xlsx, .xls).
core-import-table-empty = У датотеци нема ничега.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Табела има { $rows } редова. Табела у тексту може имати највише { $most }: она није табеларни прорачун.
core-import-table-columns = Табела има { $columns } колона. Табела у тексту може имати највише { $most }: она није табеларни прорачун.
core-import-table-more-than = више од { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Читање је заустављено.
core-import-pdfs-stopped = Утврђивање шта су датотеке је заустављено. Ништа није додато.
core-import-document-kind = „{ $file }“ није врсте која се може учитати као документ. Могу се учитати Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst и обичан текст.
core-import-document-too-large = „{ $file }“ је већа од 50 MB, што је више него што се може учитати као документ.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = „{ $file }“ није могла да се прочита као { $kind }. Можда је оштећена, или друге врсте него што јој име каже. Pandoc, који је чита, рекао је: { $message }
core-import-document-pandoc-unreadable = оно што је Pandoc направио од „{ $file }“ није могло да се прочита: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Без наслова
core-import-document-plain-text = обичан текст
core-import-document-notebook = Jupyter бележница

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Пронађен је { $count } цитат који још није везан за референцу ваше библиотеке, а направио га је програм за вођење референци. Стоји као текст којим је написан, а може се прегледати кад се мапа направи, и касније.
       *[none] Пронађен је { $count } цитат који још није везан за референцу ваше библиотеке. Стоји као текст којим је написан, а може се прегледати кад се мапа направи, и касније.
    }
    [few] { $made ->
        [all] Пронађена су { $count } цитата која још нису везана за референце ваше библиотеке, а све их је направио програм за вођење референци. Стоје као текст којим су написани, а могу се прегледати кад се мапа направи, и касније.
        [some] Пронађена су { $count } цитата која још нису везана за референце ваше библиотеке; { $some } од њих направио је програм за вођење референци. Стоје као текст којим су написани, а могу се прегледати кад се мапа направи, и касније.
       *[none] Пронађена су { $count } цитата која још нису везана за референце ваше библиотеке. Стоје као текст којим су написани, а могу се прегледати кад се мапа направи, и касније.
    }
   *[other] { $made ->
        [all] Пронађено је { $count } цитата који још нису везани за референце ваше библиотеке, а све их је направио програм за вођење референци. Стоје као текст којим су написани, а могу се прегледати кад се мапа направи, и касније.
        [some] Пронађено је { $count } цитата који још нису везани за референце ваше библиотеке; { $some } од њих направио је програм за вођење референци. Стоје као текст којим су написани, а могу се прегледати кад се мапа направи, и касније.
       *[none] Пронађено је { $count } цитата који још нису везани за референце ваше библиотеке. Стоје као текст којим су написани, а могу се прегледати кад се мапа направи, и касније.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } цитат који је направио EndNote учитава се као текст који приказује и није међу пронађенима: оно што EndNote каже о делима није могло да се прочита.
    [few] { $count } цитата која је направио EndNote учитавају се као текст који приказују и нису међу пронађенима: оно што EndNote каже о делима није могло да се прочита.
   *[other] { $count } цитата које је направио EndNote учитава се као текст који приказују и није међу пронађенима: оно што EndNote каже о делима није могло да се прочита.
}
core-import-document-bookmarks = { $count ->
    [one] Документ чува { $count } цитат у обележивачу, а шта он цитира није могло да се прочита: то је текст какав јесте. Zotero их тако чува кад подешавања његовог документа тако кажу.
    [few] Документ чува { $count } цитата у обележивачима, а шта они цитирају није могло да се прочита: то је текст какав јесте. Zotero их тако чува кад подешавања његовог документа тако кажу.
   *[other] Документ чува { $count } цитата у обележивачима, а шта они цитирају није могло да се прочита: то је текст какав јесте. Zotero их тако чува кад подешавања његовог документа тако кажу.
}
core-import-document-bibliography = Документ има списак онога што цитира, под насловом „{ $heading }“. Учитава се као текст, као и остало. Мапа сама прави библиографију од онога што се у њој цитира.
core-import-document-bibliography-made = Документ има списак онога што цитира, који је направио програм за вођење његових референци. Учитава се као текст, као и остало. Мапа сама прави библиографију од онога што се у њој цитира.
core-import-document-tracked = Документ има праћене измене. Текст се учитава онакав какав је кад се све оне прихвате.
core-import-document-comments = Документ има коментаре на маргини, који се изостављају.
core-import-document-heading-notes = { $count ->
    [one] { $count } напомена уз наслов стоји на почетку текста под њим: наслов не може имати напомену.
    [few] { $count } напомене уз наслове стоје на почетку текста под њима: наслов не може имати напомену.
   *[other] { $count } напомена уз наслове стоји на почетку текста под њима: наслов не може имати напомену.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } натпис почињао је речју и бројем, као „{ $first }“. Изостављен је: мапа сама нумерише своје илустрације и табеле. Где их текст помиње по броју, то је текст какав је написан и не прати бројеве мапе.
    [few] { $count } натписа почињала су речју и бројем, као „{ $first }“. Изостављени су: мапа сама нумерише своје илустрације и табеле. Где их текст помиње по броју, то је текст какав је написан и не прати бројеве мапе.
   *[other] { $count } натписа почињало је речју и бројем, као „{ $first }“. Изостављени су: мапа сама нумерише своје илустрације и табеле. Где их текст помиње по броју, то је текст какав је написан и не прати бројеве мапе.
}
core-import-document-label-example = Слика 1:
core-import-document-caption-notes = { $count ->
    [one] { $count } напомена у ономе што се каже уз илустрацију или табелу стоји тамо у заградама.
    [few] { $count } напомене у ономе што се каже уз илустрације или табеле стоје тамо у заградама.
   *[other] { $count } напомена у ономе што се каже уз илустрације или табеле стоји тамо у заградама.
}
core-import-document-headings = { $count ->
    [one] { $count } наслов у наводу, списку или табели учитава се као пасус полуцрним словима.
    [few] { $count } наслова у наводу, списку или табели учитавају се као пасуси полуцрним словима.
   *[other] { $count } наслова у наводу, списку или табели учитава се као пасуси полуцрним словима.
}
core-import-document-code = { $count ->
    [one] { $count } блок кода учитава се као обични пасуси, по пасус за сваки ред.
    [few] { $count } блока кода учитавају се као обични пасуси, по пасус за сваки ред.
   *[other] { $count } блокова кода учитава се као обични пасуси, по пасус за сваки ред.
}
core-import-document-definitions = { $count ->
    [one] { $count } списак термина с објашњењима учитава се као пасуси, с терминима полуцрним словима.
    [few] { $count } списка термина с објашњењима учитавају се као пасуси, с терминима полуцрним словима.
   *[other] { $count } спискова термина с објашњењима учитава се као пасуси, с терминима полуцрним словима.
}
core-import-document-rules = { $count ->
    [one] { $count } линија преко странице је изостављена.
    [few] { $count } линије преко странице су изостављене.
   *[other] { $count } линија преко странице је изостављено.
}
core-import-document-raw = { $count ->
    [one] { $count } део написан у HTML-у или TeX-у само за једну врсту документа је изостављен.
    [few] { $count } дела написана у HTML-у или TeX-у само за једну врсту документа су изостављена.
   *[other] { $count } делова написаних у HTML-у или TeX-у само за једну врсту документа је изостављено.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } слика коју датотека садржи није у прочитаном тексту и изостављена је. Можда стоји у заглављу или подножју страница, или у цртежу.
    [few] { $count } слике које датотека садржи нису у прочитаном тексту и изостављене су. Можда стоје у заглављу или подножју страница, или у цртежу.
   *[other] { $count } слика које датотека садржи није у прочитаном тексту и изостављено је. Можда стоје у заглављу или подножју страница, или у цртежу.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Слика „{ $name }“ је изостављена: { $why }.
core-import-document-picture-kind = врсте је која се не чита ({ $kind })
core-import-document-picture-not-read = није слика врсте која се чита
core-import-document-picture-unreadable = није могла да се прочита
core-import-document-picture-network = на мрежи је, а оданде се ништа не преузима
core-import-document-picture-not-taken-out = није могла да се извади из датотеке
core-import-document-picture-outside = није у датотеци, него другде на овом рачунару, а оданде се не узима
core-import-document-picture-not-found = датотека није нађена тамо где документ каже да је
core-import-document-picture-too-large = већа је од 50 MB
core-import-document-picture-file-unreadable = датотека није могла да се прочита
