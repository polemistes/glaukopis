# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = Şekil
figures-width = Genişlik
figures-width-third = Üçte bir
figures-width-half = Yarım
figures-width-three-quarters = Dörtte üç
figures-width-whole = Tam
figures-width-of-row = Sırada kendisine düşen yerin.
figures-width-of-text = Belgede metnin genişliğinin.
figures-shows = Gösterdiği
figures-shows-placeholder = Göremeyenler için sözle
figures-numbered = “Şekil 1” gibi numaralı
figures-keep-caption = Başlığı resimle birlikte sakla
figures-keep-caption-hint = Bu resimle yapılan şekiller bundan sonra burada söylenenle başlar
figures-take-caption = Resmin kendi başlığını kullan
figures-take-caption-hint = Resimle birlikte saklanan, şimdi söylenenin yerine buraya gelir
figures-another-picture = Başka bir resim…
figures-remove = Şekli kaldır
figures-caption-kept = Resimle birlikte saklandı
figures-caption-kept-detail = Onunla yapılan şekiller bu sözlerle başlar.
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = Bir resim
# What the files that can be chosen there are called.
figures-picture-files = Resimler

## The store of pictures, as the text reads it.

figures-pictures-unread = Resimler okunamadı
figures-picture-not-taken = Resim eklenemedi
figures-picture-not-kept = Resim hakkında söylenenler saklanamadı
figures-picture-not-removed = Resim kaldırılamadı

## Where a figure, a table or an equation stands.

figures-stands = Yeri
figures-stands-in-row = başkalarının yanında, bir sırada
figures-stands-alone = Yeniden tek başına
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = { $kind ->
        [figure] Şeklin
        [table] Tablonun
       *[equation] Denklemin
    } yeri
figures-side-format = Formattaki gibi
figures-side-left = Sol
figures-side-middle = Orta
figures-side-right = Sağ
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = Format { $kind ->
        [figure] şekilleri
        [table] tabloları
       *[equation] denklemleri
    } { $side ->
        [left] sola
        [right] sağa
       *[center] ortaya
    }{ $flow ->
        [around] , metin çevrelerinden akacak biçimde
        [apart] , metinden ayrı olarak
       *[none] {""}
    } koyar.
figures-text = Metin
figures-flows-where = Metnin { $kind ->
        [figure] şeklin
        [table] tablonun
       *[equation] denklemin
    } çevresinden akıp akmadığı
figures-flow-format = Formattaki gibi
figures-flow-around = Çevresinden akar
figures-flow-apart = Ayrı durur
figures-flow-at-side = Metin, bir yanda duranın çevresinden akar.
figures-beside = Öncekinin yanına koy

## A formula in the line, and an equation on a line of its own.

figures-formula = Formül
figures-equation = Denklem
figures-equation-numbered = Numaralı
figures-formula-field = Formül, TeX gösterimiyle
figures-formula-empty = Yazılan, duracağı gibi burada gösterilir.
figures-formula-hint = TeX’teki gibi yazılır. Bitince Enter, olduğu gibi bırakmak için Esc.
figures-equation-hint = TeX’teki gibi yazılır. Bitince Enter, yeni satır için Shift+Enter, olduğu gibi bırakmak için Esc.
figures-formula-unread = Formül okunamadı.
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = formül
figures-equation-blank = Bir denklem

## What can be put into a formula by pressing.

figures-sign-raised = Üstte
figures-sign-lowered = Altta
figures-sign-fraction = Kesir
figures-sign-root = Kök
figures-sign-sum = Toplam
figures-sign-integral = İntegral
figures-sign-brackets = Büyüyen parantezler
figures-sign-alpha = alfa
figures-sign-beta = beta
figures-sign-gamma = gama
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = Küçük ya da eşit
figures-sign-greater-or-equal = Büyük ya da eşit
figures-sign-not-equal = Eşit değil
figures-sign-nearly-equal = Yaklaşık eşit
figures-sign-times = Çarpı
figures-sign-plus-or-minus = Artı eksi
figures-sign-arrow = Ok
figures-sign-infinity = Sonsuz
figures-sign-words = Formül içinde sözcükler

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = Gösterimi
figures-form-full = Sözcük ve numara
figures-form-number = Yalnızca numara
figures-form-equation = Denklemin yanında durduğu gibi numara
figures-form-its-number = Numarası
figures-form-its-name = Adı
figures-go-to = Gösterdiği yere git
figures-pointed-gone = Bunun gösterdiği artık belgede yok
figures-point-elsewhere = Başka bir şeyi göster…

## Choosing what a cross-reference refers to.

figures-targets = Neye gönderme yapılacağını seçin
figures-targets-placeholder = Bir şekle, tabloya, denkleme, bölüme gönderme yapın
figures-targets-search = Gönderme yapılabilecekleri ara
figures-targets-results = Gönderme yapılabilecekler
figures-targets-figures = Şekiller
figures-targets-tables = Tablolar
figures-targets-equations = Denklemler
figures-targets-parts = Belgenin bölümleri
figures-targets-figure-unsaid = Hakkında hiçbir şey söylenmemiş bir şekil
figures-targets-table-unsaid = Hakkında hiçbir şey söylenmemiş bir tablo
figures-targets-no-match = Belgede bu sözcüklere uyan bir şey yok.
figures-targets-none = Henüz gönderme yapılacak bir şey yok: şekil yok, tablo yok, numaralı denklem yok, adı olan bölüm yok.
figures-targets-hint = Gönderme, gösterdiği şeyi izler: numarasını ve formatın ona verdiği adı.

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = Resim bu bilgisayarda yok
figures-caption-placeholder = Resim hakkında söylenen
