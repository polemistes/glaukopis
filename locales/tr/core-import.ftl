# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = yapıştırılan metin
core-import-files = { $count } dosya

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = “{ $name }” adlı dosya bulunamadı.
core-import-empty-entry = Satır { $line }: “{ $key }” girdisi boş; dışarıda bırakıldı.
# Where in a file a reference that has no key was found.
core-import-origin-line = satır { $line }
core-import-origin-key-line = { $key }, satır { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = “{ $title }”
core-import-merge-gone = { $reference }: birleştirilecek girdi artık yok

## PDF files.

core-import-not-a-pdf = { $name } bir PDF değil.
# The service is a name: Crossref, DataCite.
core-import-details-from = Bilgiler şuradan alındı: { $service }.
core-import-number-unknown = Dosyada bir numara bulundu, ama veritabanlarında onunla ilgili bir şey bilinmiyor; bilgiler dosyanın kendisinden alındı ve denetlenmeli.
core-import-databases-failed = Veritabanlarına sorulamadı ({ $error }); bilgiler dosyanın kendisinden alındı ve denetlenmeli.

## Zotero.

core-import-zotero-my-library = Kitaplığım
core-import-zotero-group = Grup { $id }
core-import-zotero-the-library = Zotero’daki { $id } kitaplığı
core-import-zotero-own-library = kullanıcının Zotero’daki kendi kitaplığı
core-import-zotero-the-collection = Zotero’daki { $key } koleksiyonu
core-import-zotero-unknown-base = “{ $name }” adlı dosya bulunamadı. Zotero ona kendi seçtiği bir klasörden bağlantı veriyor ve o klasör burada bilinmiyor.
core-import-zotero-empty-item = Zotero’daki { $key } öğesi boş; dışarıda bırakıldı.
core-import-zotero-alone = { $count ->
    [one] Zotero’da { $count } dosya ya da not hiçbir kaynağa bağlı değil; dışarıda bırakıldı.
   *[other] Zotero’da { $count } dosya ve not hiçbir kaynağa bağlı değil; dışarıda bırakıldılar.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero, { $name } adını { $role } olarak gösteriyor; BibLaTeX’te bunun için bir alan yok. Ad dışarıda bırakıldı.
core-import-zotero-left-out = Zotero’nun “{ $field }” alanının BibLaTeX’te karşılığı yok; dışarıda bırakıldı: { $value }

## Zotero's database.

core-import-zotero-no-database = { $path } içinde bir Zotero veritabanı ({ $file })
core-import-zotero-copying = { $path } geçici bir klasöre kopyalanırken
core-import-zotero-empty = dosya boş
core-import-zotero-disturbed = Zotero, veritabanı okunurken ona yazıyordu. Bir şey eksikse Zotero’yu kapatıp yeniden içe aktarın.
core-import-zotero-backup-read = Zotero’nun veritabanı okunamadı ({ $error }). Onun yerine yedeği okundu: { $backup }. Yedek alındıktan sonra Zotero’da değiştirilenler eksik.
core-import-zotero-not-a-database = { $path } bir Zotero veritabanı değil.
core-import-zotero-unreadable = Zotero veritabanı burada okunamayan bir biçimde: { $what }. Zotero’nun eski bir sürümüyle yazıldıysa, güncel bir sürümde bir kez açmak onu günceller.
core-import-zotero-unreadable-version = Zotero veritabanı burada okunamayan bir biçimde (Zotero veritabanının { $version } sürümü): { $what }. Zotero’nun eski bir sürümüyle yazıldıysa, güncel bir sürümde bir kez açmak onu günceller.
core-import-zotero-no-table = “{ $table }” tablosu eksik
core-import-zotero-no-column = “{ $table }” tablosunda “{ $column }” sütunu yok
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Zotero veritabanında burada bilinen biçimde bir “{ $table }” tablosu yok: { $consequence }.
core-import-zotero-no-bin = Zotero’nun çöp kutusundaki öğeler ötekilerden ayırt edilemiyor
core-import-zotero-no-collections = koleksiyonlar okunmadı
core-import-zotero-no-attachments = ekli dosyalar okunmadı
core-import-zotero-no-notes = notlar okunmadı
core-import-zotero-no-keywords = anahtar sözcükler okunmadı
core-import-zotero-no-group-names = grup kitaplıklarının adları bilinmiyor

## PDF files, as they are read for a reference.

core-import-pdf-empty = “{ $name }” adlı dosya boş.
core-import-pdf-not-a-pdf = “{ $name }” adlı dosya bir PDF değil.
core-import-pdf-unreadable = Dosya okunamadı: bozuk, parolayla korunuyor ya da çok büyük.
core-import-pdf-scan = Dosyanın metin katmanı yok: bir tarama.
core-import-pdf-from-file = Bilgiler bir katalogdan değil, dosyanın kendisinden alındı ve denetlenmeli.
core-import-pdf-from-metadata = Dosyada DOI ya da ISBN bulunamadı; bilgiler dosyanın kendi üst verisinden alındı ve denetlenmeli.
core-import-pdf-unknown = Dosyada DOI ya da ISBN bulunamadı ve üst verisi ne olduğunu söylemiyor: bilgilerin doldurulması gerekiyor.

## Tables, from files of text and of sheets.

core-import-table-too-large = Dosya { $size } MB. Tablo en çok { $most } MB’lık bir dosyadan okunur.
core-import-table-kinds = Tablolar CSV’den ve değerleri virgül, noktalı virgül ya da sekmeyle ayrılmış başka metinlerden, LibreOffice (.ods) ve Excel (.xlsx, .xls) sayfalarından okunur.
core-import-table-empty = Dosyada hiçbir şey yok.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Tablonun satır sayısı: { $rows }. Bir metindeki tablo en çok { $most } satır olabilir: bir hesap tablosu değildir.
core-import-table-columns = Tablonun sütun sayısı: { $columns }. Bir metindeki tablo en çok { $most } sütun olabilir: bir hesap tablosu değildir.
core-import-table-more-than = { $count } adetten fazla

## Documents brought in, to become maps.

core-import-document-stopped = Okuma durduruldu.
core-import-pdfs-stopped = Dosyaların ne olduğunun bulunması durduruldu. Hiçbir şey eklenmedi.
core-import-document-kind = “{ $file }” belge olarak içeri alınabilecek türden değil. Alınabilenler: Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst ve düz metin.
core-import-document-too-large = “{ $file }” 50 MB’tan büyük; bu, belge olarak içeri alınabilecek olandan fazla.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = “{ $file }” şu türde okunamadı: { $kind }. Bozuk olabilir ya da adının söylediğinden başka türde olabilir. Onu okuyan Pandoc şunu söyledi: { $message }
core-import-document-pandoc-unreadable = Pandoc’un “{ $file }” dosyasından çıkardığı okunamadı: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Adsız
core-import-document-plain-text = düz metin
core-import-document-notebook = Jupyter defteri

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] Kitaplığınızdaki bir kaynağa henüz bağlanmamış { $count } atıf bulundu; kaynak yöneten bir programla yapılmış. Yazıldığı metin olarak duruyor; harita yapılırken ve daha sonra gözden geçirilebilir.
       *[none] Kitaplığınızdaki bir kaynağa henüz bağlanmamış { $count } atıf bulundu. Yazıldığı metin olarak duruyor; harita yapılırken ve daha sonra gözden geçirilebilir.
    }
   *[other] { $made ->
        [all] Kitaplığınızdaki kaynaklara henüz bağlanmamış { $count } atıf bulundu; hepsi kaynak yöneten bir programla yapılmış. Yazıldıkları metin olarak duruyorlar; harita yapılırken ve daha sonra gözden geçirilebilirler.
        [some] Kitaplığınızdaki kaynaklara henüz bağlanmamış { $count } atıf bulundu; bunların { $some } adedi kaynak yöneten bir programla yapılmış. Yazıldıkları metin olarak duruyorlar; harita yapılırken ve daha sonra gözden geçirilebilirler.
       *[none] Kitaplığınızdaki kaynaklara henüz bağlanmamış { $count } atıf bulundu. Yazıldıkları metin olarak duruyorlar; harita yapılırken ve daha sonra gözden geçirilebilirler.
    }
}
core-import-document-endnote = { $count ->
    [one] EndNote ile yapılmış { $count } atıf, gösterdiği metin olarak içeri alındı ve bulunanlar arasında değil: EndNote’un eserler hakkında söyledikleri okunamadı.
   *[other] EndNote ile yapılmış { $count } atıf, gösterdikleri metin olarak içeri alındı ve bulunanlar arasında değil: EndNote’un eserler hakkında söyledikleri okunamadı.
}
core-import-document-bookmarks = { $count ->
    [one] Belge { $count } atıfı bir yer iminde tutuyor ve neye atıf yaptığı okunamadı: olduğu gibi metin. Zotero, belge tercihleri öyle dediğinde atıfları başka türlü saklar.
   *[other] Belge { $count } atıfı yer imlerinde tutuyor ve neye atıf yaptıkları okunamadı: olduğu gibi metin. Zotero, belge tercihleri öyle dediğinde atıfları başka türlü saklar.
}
core-import-document-bibliography = Belgede, “{ $heading }” başlığı altında atıf yaptıklarının bir listesi var. Geri kalanı gibi metin olarak içeri alındı. Harita, kendisinde atıf yapılanlardan kendi kaynakçasını yapar.
core-import-document-bibliography-made = Belgede, kaynaklarını yöneten programın yaptığı, atıf yaptıklarının bir listesi var. Geri kalanı gibi metin olarak içeri alındı. Harita, kendisinde atıf yapılanlardan kendi kaynakçasını yapar.
core-import-document-tracked = Belgede izlenen değişiklikler var. Metin, hepsi kabul edildiğindeki hâliyle içeri alındı.
core-import-document-comments = Belgenin kenarında yorumlar var; bunlar dışarıda bırakıldı.
core-import-document-heading-notes = { $count ->
    [one] Bir başlıktaki not, altındaki metnin başında duruyor: bir başlığın notu olamaz.
   *[other] Başlıklardaki { $count } not, altlarındaki metnin başında duruyor: bir başlığın notu olamaz.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } başlık, “{ $first }” gibi bir sözcük ve bir sayıyla başlıyordu. Bunlar dışarıda bırakıldı: harita şekillerini ve tablolarını kendisi numaralar. Metnin bunlardan birini numarasıyla andığı yerde, bu yazıldığı gibi metindir ve haritanın numaralarını izlemez.
   *[other] { $count } başlık, “{ $first }” gibi bir sözcük ve bir sayıyla başlıyordu. Bunlar dışarıda bırakıldı: harita şekillerini ve tablolarını kendisi numaralar. Metnin bunlardan birini numarasıyla andığı yerde, bu yazıldığı gibi metindir ve haritanın numaralarını izlemez.
}
core-import-document-label-example = Şekil 1:
core-import-document-caption-notes = { $count ->
    [one] Bir şekil ya da tablo hakkında söylenenler içindeki bir not, orada köşeli parantez içinde duruyor.
   *[other] Şekiller ya da tablolar hakkında söylenenler içindeki { $count } not, orada köşeli parantez içinde duruyor.
}
core-import-document-headings = { $count ->
    [one] Bir alıntı, liste ya da tablo içindeki { $count } başlık, kalın bir paragraf olarak içeri alındı.
   *[other] Bir alıntı, liste ya da tablo içindeki { $count } başlık, kalın paragraflar olarak içeri alındı.
}
core-import-document-code = { $count ->
    [one] { $count } kod bloğu, her satır bir paragraf olmak üzere düz paragraflar olarak içeri alındı.
   *[other] { $count } kod bloğu, her satır bir paragraf olmak üzere düz paragraflar olarak içeri alındı.
}
core-import-document-definitions = { $count ->
    [one] Terimleri ve anlamlarını veren { $count } liste, terimler kalın olmak üzere paragraflar olarak içeri alındı.
   *[other] Terimleri ve anlamlarını veren { $count } liste, terimler kalın olmak üzere paragraflar olarak içeri alındı.
}
core-import-document-rules = { $count ->
    [one] Sayfayı boydan boya geçen { $count } çizgi dışarıda bırakıldı.
   *[other] Sayfayı boydan boya geçen { $count } çizgi dışarıda bırakıldı.
}
core-import-document-raw = { $count ->
    [one] Yalnızca tek bir belge türü için HTML ya da TeX ile yazılmış { $count } parça dışarıda bırakıldı.
   *[other] Yalnızca tek bir belge türü için HTML ya da TeX ile yazılmış { $count } parça dışarıda bırakıldı.
}
core-import-document-pictures-wanting = { $count ->
    [one] Dosyadaki { $count } resim okunan metinde yok; dışarıda bırakıldı. Sayfaların üst ya da alt bilgisinde ya da bir çizimin içinde duruyor olabilir.
   *[other] Dosyadaki { $count } resim okunan metinde yok; dışarıda bırakıldı. Sayfaların üst ya da alt bilgisinde ya da bir çizimin içinde duruyor olabilirler.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = “{ $name }” adlı resim dışarıda bırakıldı: { $why }.
core-import-document-picture-kind = okunmayan bir türde ({ $kind })
core-import-document-picture-not-read = okunan türde bir resim değil
core-import-document-picture-unreadable = okunamadı
core-import-document-picture-network = ağda duruyor ve oradan hiçbir şey getirilmiyor
core-import-document-picture-not-taken-out = dosyadan çıkarılamadı
core-import-document-picture-outside = dosyanın içinde değil, bu bilgisayarda başka bir yerde ve oradan alınmıyor
core-import-document-picture-not-found = dosya, belgenin söylediği yerde bulunamadı
core-import-document-picture-too-large = 50 MB’tan büyük
core-import-document-picture-file-unreadable = dosya okunamadı
