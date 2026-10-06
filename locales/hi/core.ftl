# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = { $path } पढ़ा नहीं जा सका: { $message }
error-not-found = नहीं मिला: { $what }
error-network = नेटवर्क: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } स्थापित नहीं है या मिल नहीं सका
# A program that is there, but older than what Glaukopis needs.
program-too-old = { $program } { $version } स्थापित है। Glaukopis को { $program } { $least } या उससे नया चाहिए।
program-failed = { $program } विफल रहा: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = वह { $status } के साथ समाप्त हुआ
program-stopped = { $program } रोक दिया गया।

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = { $path } पढ़ते हुए
io-writing = { $path } लिखते हुए
io-creating = { $path } बनाते हुए
io-creating-directory-in = { $path } में फ़ोल्डर बनाते हुए
io-creating-temporary-in = { $path } में अस्थायी फ़ाइल बनाते हुए
io-creating-temporary = अस्थायी फ़ोल्डर बनाते हुए
io-opening = { $path } खोलते हुए
io-removing = { $path } हटाते हुए
io-copying = { $path } की नक़ल करते हुए
io-flushing = { $path } को डिस्क पर उतारते हुए
io-replacing = { $path } की जगह नई रखते हुए
io-backing-up = { $path } की प्रति सुरक्षित करते हुए
io-storing = { $path } सहेजते हुए
io-no-directory = { $path } का कोई फ़ोल्डर नहीं है

## The network. Shown after "network: ".

network-timeout = { $host } ने समय रहते उत्तर नहीं दिया
network-host-not-found = { $host } मिल नहीं सका; क्या नेटवर्क से जुड़ाव है?
network-unreachable = { $host } तक पहुँचा नहीं जा सका
network-unreachable-because = { $host } तक पहुँचा नहीं जा सका: { $error }
network-nothing-there = { $host } पर उस पते पर कुछ नहीं है
network-wait = { $host } कहता है कि फिर पूछने से पहले रुकें
network-status = { $host } ने त्रुटि के साथ उत्तर दिया ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } पूछने का ऐसा तरीक़ा नहीं है जो यहाँ बरता जाता हो

## When the application is opened a second time.

core-in-use-title = Glaukopis पहले से खुला है
core-in-use = Glaukopis पहले से खुला है, और { $path } में काम कर रहा है। वहाँ एक समय में एक ही काम कर सकता है, नहीं तो एक दूसरे का लिखा मिटा देगा। जो खुला है उसी में आगे बढ़ें।
