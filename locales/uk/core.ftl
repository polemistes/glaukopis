# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = не вдалося прочитати { $path }: { $message }
error-not-found = не знайдено: { $what }
error-network = мережа: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } не встановлено або не вдалося знайти
# A program that is there, but older than what Glaukopis needs.
program-too-old = Встановлено { $program } { $version }. Glaukopis потребує { $program } { $least } або новішої версії.
program-failed = { $program } завершився з помилкою: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = він завершився з { $status }
program-stopped = { $program } зупинено.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = читання { $path }
io-writing = запис { $path }
io-creating = створення { $path }
io-creating-directory-in = створення теки в { $path }
io-creating-temporary-in = створення тимчасового файлу в { $path }
io-creating-temporary = створення тимчасової теки
io-opening = відкриття { $path }
io-removing = вилучення { $path }
io-copying = копіювання { $path }
io-flushing = скидання { $path } на диск
io-replacing = заміна { $path }
io-backing-up = резервне копіювання { $path }
io-storing = збереження { $path }
io-no-directory = { $path } не має теки

## The network. Shown after "network: ".

network-timeout = { $host } не відповів вчасно
network-host-not-found = { $host } не знайдено; чи є звʼязок із мережею?
network-unreachable = { $host } недосяжний
network-unreachable-because = { $host } недосяжний: { $error }
network-nothing-there = на { $host } за цією адресою нічого немає
network-wait = { $host } просить зачекати, перш ніж питати знову
network-status = { $host } відповів помилкою ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } — не той спосіб запиту, що тут уживається

## When the application is opened a second time.

core-in-use-title = Glaukopis уже відкрито
core-in-use = Glaukopis уже відкрито, і він працює в { $path }. Працювати там може лише один, щоб не перезаписувати написане іншим. Продовжуйте в тому, що вже відкритий.
