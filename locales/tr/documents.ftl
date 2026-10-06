# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = İçeri alınacak belge
documents-filter = Belgeler
documents-filter-all = Tüm dosyalar
documents-title-map = Bir belgeden harita
documents-title-project = Bir belgeden proje
documents-reading = { $file } okunuyor…
documents-reading-hint = Uzun bir belge biraz zaman alır.
documents-no-pandoc = Bu türdeki belgeleri Pandoc okur; Pandoc kurulu değil ya da bulunamadı. Nerede olduğu ayarlarda belirtilebilir.
documents-unread = Dosya okunamadı.
documents-title = Ad
documents-title-hint-map = Haritanın ve merkezindeki öğenin adı.
documents-title-hint-project = Projenin, haritasının ve haritanın merkezindeki öğenin adı.
# What a project made of a document is called when the document has no title.
documents-untitled = Adsız

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Bölüm
   *[other] Bölüm
}
documents-words = { $count ->
    [one] Sözcük
   *[other] Sözcük
}
documents-notes = { $count ->
    [one] Not
   *[other] Not
}
documents-figures = { $count ->
    [one] Şekil
   *[other] Şekil
}
documents-tables = { $count ->
    [one] Tablo
   *[other] Tablo
}
documents-equations = { $count ->
    [one] Denklem
   *[other] Denklem
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Kitaplığınızdaki eserlere { $cited ->
        [1] bir kez
        [2] iki kez
       *[other] { $cited } kez
    } atıf yapılıyor.
documents-cited-not-in-library = Kitaplığınızda olmayan eserlere { $missing ->
        [1] bir kez
        [2] iki kez
       *[other] { $missing } kez
    } atıf yapılıyor.
documents-cited-both = Kitaplığınızdaki eserlere { $cited ->
        [1] bir kez
        [2] iki kez
       *[other] { $cited } kez
    }, kitaplıkta olmayanlara { $missing ->
        [1] bir kez
        [2] iki kez
       *[other] { $missing } kez
    } atıf yapılıyor.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] Bir atıf bulundu.
   *[other] { $count } atıf bulundu.
}
documents-found-made = { $count ->
    [one] Kaynak yöneten bir programla yapılmış bir atıf bulundu.
   *[other] Hepsi kaynak yöneten bir programla yapılmış { $count } atıf bulundu.
}
documents-found-some-made = { $count } atıf bulundu; bunların { $made } adedi kaynak yöneten bir programla yapılmış.
documents-at-once = Kitaplığınızda bulunan eserlere Zotero ile yapılmış atıfları hemen atıfa dönüştür
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = Yalnızca bir atıftan oluşan not, satır içi bir atıfa dönüşür; atıf stili onu notta ya da satırda dizer. Daha fazlasını söyleyen not, atıfını korur. Bulunan atıflar panelinde sonraki bütün notlar için seçtiğiniz burada da geçerlidir.
documents-go-through-map = Harita yapılırken atıfları gözden geçir
documents-go-through-project = Proje yapılırken atıfları gözden geçir

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = Bilinmesi gerekenler
documents-making = Harita yapılıyor…
documents-make-map = Haritayı yap
documents-make-project = Projeyi yap
documents-map-failed = Harita yapılamadı.
