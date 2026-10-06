# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = Resim

## When text cannot be read.

ocr-stopped = Okuma durduruldu.
ocr-no-language = Tesseract’te “{ $language }” dili için veri yok.
ocr-no-languages = Tesseract’te hiçbir dil için veri yok. Bir dilin verisini kurun; örneğin Arch’ta tesseract-data-eng.
ocr-not-pdf = “{ $file }” bir PDF değil.
ocr-no-pages = “{ $file }” içinde sayfa yok.
ocr-locked = “{ $file }” parolayla kilitli; sayfaları çizilemiyor.
ocr-unreadable = “{ $file }” PDF olarak okunamadı. Bozuk olabilir.
ocr-page-not-drawn = Sayfa { $page } çizilemedi.
ocr-picture-unreadable = Resim okunamadı: { $message }
ocr-drawing = Bir çizimde (SVG) metin okunacak bir resim yok.

## Making a PDF searchable.

ocr-searchable-locked = PDF kilitli; aranabilir yapılamıyor. Metni yine de bir projeye harita olarak alınabilir.
ocr-searchable-unreadable = PDF aranabilir yapılamadı: { $message }
ocr-not-whole = oluşturulan dosya bütün olarak geri okunamadı ve saklanmadı.

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
    [one] Bir sayfa, resminden okundu.
   *[other] { $count } sayfa, resimlerinden okundu.
}
ocr-remark-text = { $count ->
    [one] Bir sayfada metin vardı; dosyadaki gibi alındı.
   *[other] { $count } sayfada metin vardı; dosyadaki gibi alındı.
}
ocr-remark-no-tesseract = { $count ->
    [one] Bir sayfada metin yok ve boş bırakıldı: resimlerdeki metni okuyan Tesseract kurulu değil.
   *[other] { $count } sayfada metin yok ve boş bırakıldı: resimlerdeki metni okuyan Tesseract kurulu değil.
}
ocr-remark-not-read = Metni olmayan sayfalar okunamadı: { $message }
ocr-remark-failed = Sayfa { $page } okunamadı: { $message }
ocr-remark-more-failed = { $count ->
    [one] Bir sayfa daha okunamadı.
   *[other] { $count } sayfa daha okunamadı.
}
ocr-remark-empty = Metin bulunamadı.
