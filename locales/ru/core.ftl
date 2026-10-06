# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = не удалось прочитать { $path }: { $message }
error-not-found = не найдено: { $what }
error-network = сеть: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } не установлен или не найден
# A program that is there, but older than what Glaukopis needs.
program-too-old = Установлен { $program } { $version }. Glaukopis нужен { $program } { $least } или новее.
program-failed = { $program } завершился с ошибкой: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = завершился ({ $status })
program-stopped = { $program } был остановлен.

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = чтение { $path }
io-writing = запись { $path }
io-creating = создание { $path }
io-creating-directory-in = создание папки в { $path }
io-creating-temporary-in = создание временного файла в { $path }
io-creating-temporary = создание временной папки
io-opening = открытие { $path }
io-removing = удаление { $path }
io-copying = копирование { $path }
io-flushing = запись { $path } на диск
io-replacing = замена { $path }
io-backing-up = резервная копия { $path }
io-storing = сохранение { $path } в хранилище
io-no-directory = у { $path } нет папки

## The network. Shown after "network: ".

network-timeout = { $host } не ответил вовремя
network-host-not-found = { $host } не найден; есть ли подключение к сети?
network-unreachable = { $host } недоступен
network-unreachable-because = { $host } недоступен: { $error }
network-nothing-there = у { $host } по этому адресу ничего нет
network-wait = { $host } просит подождать, прежде чем спрашивать снова
network-status = { $host } ответил ошибкой ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } — не тот способ запроса, который здесь используется

## When the application is opened a second time.

core-in-use-title = Glaukopis уже открыт
core-in-use = Glaukopis уже открыт и работает в { $path }. Работать там может только один, иначе каждый будет писать поверх написанного другим. Продолжайте в том, который открыт.
