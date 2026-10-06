# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = { $path } okunamadı: { $message }
error-not-found = bulunamadı: { $what }
error-network = ağ: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } kurulu değil ya da bulunamadı
# A program that is there, but older than what Glaukopis needs.
program-too-old = { $program } { $version } kurulu. Glaukopis için { $program } { $least } ya da daha yenisi gerekiyor.
program-failed = { $program } başarısız oldu: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = şu durumla sona erdi: { $status }
program-stopped = { $program } durduruldu.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = { $path } okunurken
io-writing = { $path } yazılırken
io-creating = { $path } oluşturulurken
io-creating-directory-in = { $path } içinde klasör oluşturulurken
io-creating-temporary-in = { $path } içinde geçici dosya oluşturulurken
io-creating-temporary = geçici klasör oluşturulurken
io-opening = { $path } açılırken
io-removing = { $path } kaldırılırken
io-copying = { $path } kopyalanırken
io-flushing = { $path } diske yazılırken
io-replacing = { $path } değiştirilirken
io-backing-up = { $path } yedeklenirken
io-storing = { $path } saklanırken
io-no-directory = { $path } için bir klasör yok

## The network. Shown after "network: ".

network-timeout = { $host } zamanında yanıt vermedi
network-host-not-found = { $host } bulunamadı; ağ bağlantısı var mı?
network-unreachable = { $host } erişilemiyor
network-unreachable-because = { $host } erişilemiyor: { $error }
network-nothing-there = { $host } üzerinde o adreste bir şey yok
network-wait = { $host } yeniden sormadan önce beklememizi istiyor
network-status = { $host } bir hatayla yanıt verdi ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } burada kullanılan bir istek yolu değil

## When the application is opened a second time.

core-in-use-title = Glaukopis zaten açık
core-in-use = Glaukopis zaten açık ve { $path } içinde çalışıyor. Birbirinin yazdığının üzerine yazmamaları için orada aynı anda yalnızca biri çalışabilir. Açık olanda devam edin.
