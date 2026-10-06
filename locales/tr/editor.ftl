# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Biçim
editor-writing = Yazma
editor-italic = İtalik
editor-bold = Kalın
editor-small-capitals = Küçük büyük harf
editor-superscript = Üst simge
editor-subscript = Alt simge
editor-struck = Üstü çizili
editor-quotation = Alıntı
editor-block-quotation = Blok alıntı
editor-list = Liste
editor-text = Metin
editor-text-hint = Bir paragraf
editor-quotation-hint = Metinden ayrık
editor-list-hint = Her maddenin önünde bir işaretle
editor-numbered-list = Numaralı liste
editor-numbered-list-hint = Her maddenin önünde bir numarayla
editor-verse = Dize
editor-verse-hint = Şiir ya da oyun satırları; her biri bir satır olarak korunur
editor-speaker = Konuşan
editor-speaker-hint = Kimin konuştuğu, kendi satırında
editor-direction = Sahne yönergesi
editor-direction-hint = Yapılan, italik olarak
editor-line-numbers = Satır numaraları
editor-line-numbers-hint = Bu dizelerin satırlarını numarala: hangi satırdan ve kaç satırda bir
editor-line-numbers-from = Satırları şundan başlayarak numarala
editor-line-numbers-none = Numara olmaması için boş bırakın
editor-line-numbers-every = Şu kadar satırda bir numara göster
editor-line-numbers-number = Bir tam sayı gerekiyor.
editor-kinds-text = Metin
editor-kinds-quotation = Alıntı
editor-kinds-verse = Dize
editor-kinds-script = Senaryo
editor-kinds-more = Diğer
editor-kinds-words = Sözler
editor-attribution = Söyleyen
editor-attribution-hint = Sözlerin kime ait olduğu; alıntının altında, sağda
editor-epigraph = Epigraf
editor-epigraph-hint = Bir bölümün başındaki alıntı
editor-headword = Madde başı
editor-headword-hint = Bir sözlükçenin açıkladığı sözcük
editor-gloss = Açıklama
editor-gloss-hint = Madde başının anlamı
editor-code = Kod
editor-code-hint = Harfi harfine korunur, eşit genişlikte harflerle
editor-break = Ara
editor-break-hint = Bölümler arasında bir duraklama; formatın verdiği işaretle
editor-draft = Taslak notu
editor-draft-hint = Yalnızca sizin için: hiçbir belgeye girmez
editor-foreign = Yabancı sözcükler
editor-foreign-hint = Başka bir dildeki sözcükler; yazım denetimi bunu izler
editor-title-of-work = Eser adı
editor-title-of-work-hint = Bir kitabın, oyunun, tablonun adı
editor-term = Terim
editor-term-hint = İlk kullanıldığı yerde bir terim
editor-mention = Anma
editor-mention-hint = Sözcük olarak anılan bir sözcük, tırnak içinde
editor-highlight = Vurgu
editor-highlight-hint = Ekranda göz için: hiçbir belgeye girmez
editor-underline = Altı çizili
editor-code-words = Satır içi kod
editor-code-words-hint = Satırın içinde, eşit genişlikte harfler
editor-scene = Sahne başlığı
editor-scene-hint = İÇ. EV – GECE
editor-action = Eylem
editor-action-hint = Görülen ve yapılan
editor-character = Karakter
editor-character-hint = Konuşan, diyaloğun üstünde
editor-dialogue = Diyalog
editor-dialogue-hint = Söylenen
editor-parenthetical = Parantez içi
editor-parenthetical-hint = Nasıl söylendiği, parantez içinde
editor-transition = Geçiş
editor-transition-hint = KESME:, sağda
editor-comment = Yorum
editor-comment-hint = Seçili olan üzerine bir yorum
editor-comment-element-hint = Bu öğe üzerine bir yorum; sözcükler üzerine yorum yapmak için onları seçin
editor-parallel = Yan yana iki metin
editor-parallel-hint = Bir asıl metin ve çevirisi, her biri ayrı bir metin
editor-paragraph-kind = Paragraf türü
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Paragraf türü: { $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = Diğer…
editor-kinds-in-hand = Eldeki türler
editor-kinds-own = Kendi türleriniz
editor-kinds-make = Tür oluştur…
editor-kinds-change-own = Kendi türünüzü değiştir…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = “{ $format }” formatına göre dizilir
editor-kinds-change-format = Formatı değiştir…
editor-kinds-change-format-hint = Her türün bu belgede nasıl dizildiği
editor-words = Sözler
editor-words-hint = Altı çizme, üst simge, kod; yabancı sözcükler, eser adı, terim
editor-words-make = Söz türü oluştur…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = Haritanın dili
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Düz sözler
editor-own-kind-new = Kendi türünüz
editor-own-kind-change = Türü değiştir
editor-own-kind-name = Ad
editor-own-kind-name-placeholder = Mektup, telgraf, dua…
editor-own-kind-words-placeholder = Gemi adı, Latince, anahtar sözcük…
editor-own-kind-name-taken = Bu adda bir tür zaten var.
editor-own-kind-based-on = Temeli
editor-own-kind-based-on-hint = Aşağıda belirtilmeyen, bu türdeki gibidir
editor-own-kind-look = Nasıl ayrılıyor
editor-own-kind-create = Oluştur
editor-own-kind-delete-title = “{ $name }” türü silinsin mi?
editor-own-kind-delete-message = { $count ->
    [0] Bu türde metin yok.
    [one] Bir öğede bu türde olanlar olduğu gibi kalır ve belgelerde metin olarak dizilir.
   *[other] { $count } öğede bu türde olanlar olduğu gibi kalır ve belgelerde metin olarak dizilir.
}

## Citing, notes, and what is put into the text.

editor-cite = Atıf yap
editor-cite-here = Buraya bir esere atıf ekle
editor-cite-at-cursor = İmlecin olduğu yere bir esere atıf ekle
editor-note = Not
editor-note-selection = Seçimi not yap
editor-note-hint = Sayfanın altında ya da sonda bir not
editor-insert = Ekle
editor-insert-hint = Bir resim, bir tablo, matematik, bir gönderme
editor-new-element = Yeni öğe
editor-new-element-hint = Bundan sonra ya da bunun altında yeni bir öğe
editor-new-after = Bundan sonra yeni öğe
editor-new-under = Bunun altında yeni öğe
editor-new-split = Buradan böl
editor-new-split-hint = İmleçten sonrası yeni bir öğe olur
editor-spelling-on = Yazım, yazdıkça denetleniyor · durdurmak için basın
editor-spelling-off = Yazım denetlenmiyor · denetlemek için basın
editor-picture-file = Dosyadan resim…
editor-picture-file-hint = Hakkında söylenenlerle birlikte bir şekil
editor-picture-store = Depodan resim…
editor-picture-store-hint = Elinizdekiler yanda gösterilir
editor-equation = Denklem
editor-equation-hint = Kendi satırında matematik
editor-table = Tablo…
editor-table-hint = Belli sayıda satır ve sütunla
editor-table-file = Dosyadan tablo…
editor-table-file-hint = CSV ya da bir LibreOffice veya Excel sayfası
editor-formula = Formül
editor-formula-hint = Satır içinde matematik
editor-pointer = Gönderme…
editor-pointer-hint = Bir şekle, tabloya, denkleme ya da bölüme: “bkz. şekil 2”
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = resim

## More.

editor-found = Bulunan atıflar…
editor-found-count = Gözden geçirilip atıfa dönüştürülecek { $count } adet
editor-found-none = Ve bu haritada atıfa benzeyen metin

## Choosing a work to cite.

editor-picker = Bir kaynak seçin
editor-picker-placeholder = Atıf: yazar, ad, yıl
editor-picker-search = Kaynaklarda ara
editor-picker-results = Kaynaklar
editor-picker-in-project = Bu projede
editor-picker-recent = Son eklenenler
editor-picker-empty = Kitaplığınız boş.
editor-picker-no-match = Kitaplığınızda bu sözcükleri içeren bir şey yok.
editor-picker-type = Kitaplığınızda aramak için yazın.
editor-picker-new = Yeni kaynak…
editor-picker-import = İçe aktar…

## A citation, and each work in it.

editor-citation = Atıf
editor-citation-add = Eser ekle
editor-citation-add-purpose = Atıfa bir eser ekle
editor-citation-in-text = Yazar metinde: Nagy (1979)
editor-citation-remove = Atıfı kaldır
editor-citation-split = Sözleri atıftan ayır
editor-citation-split-hint = Önceki ve sonraki sözler satırın metni olur; her eser de yalnızca sayfasıyla kendi başına bir atıf olur
editor-citation-not-in-library = Bu kaynak kitaplığınızda yok.
editor-citation-edit-reference = Kaynağı düzenle
editor-citation-before = Önce
editor-citation-before-placeholder = bkz., krş.
editor-citation-after = Sonra
editor-citation-after-placeholder = ve passim
editor-citation-locator-kind = Yer türü
editor-citation-suppress-author = Yazar cümlemde anılıyor: yalnızca yılı ver
editor-citation-remove-work = Bu eseri kaldır
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [kaynak bulunamadı]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (atıf)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Sayfa
editor-locator-chapter = Bölüm
editor-locator-section = Kesim
editor-locator-paragraph = Paragraf
editor-locator-line = Satır
editor-locator-verse = Dize
editor-locator-book = Kitap
editor-locator-volume = Cilt
editor-locator-part = Kısım
editor-locator-column = Sütun
editor-locator-folio = Varak
editor-locator-figure = Şekil
editor-locator-note = Not
editor-locator-number = Sayı
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Not { $number }
editor-note-place = Notun yeri
editor-note-place-format = Formatın notları koyduğu yer
editor-note-place-foot = Sayfanın altında
editor-note-place-end = Metnin sonunda
editor-note-placeholder = Notun metni
