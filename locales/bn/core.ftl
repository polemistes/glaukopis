# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = { $path } পড়া গেল না: { $message }
error-not-found = পাওয়া যায়নি: { $what }
error-network = নেটওয়ার্ক: { $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } ইনস্টল করা নেই, বা খুঁজে পাওয়া গেল না
# A program that is there, but older than what Glaukopis needs.
program-too-old = { $program } { $version } ইনস্টল করা আছে। Glaukopis-এর দরকার { $program } { $least } বা তার নতুন।
program-failed = { $program } ব্যর্থ হয়েছে: { $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = এটি { $status } দিয়ে শেষ হয়েছে
program-stopped = { $program } থামিয়ে দেওয়া হয়েছে।

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = { $path } পড়া
io-writing = { $path } লেখা
io-creating = { $path } তৈরি করা
io-creating-directory-in = { $path }-এ একটি ফোল্ডার তৈরি করা
io-creating-temporary-in = { $path }-এ একটি অস্থায়ী ফাইল তৈরি করা
io-creating-temporary = একটি অস্থায়ী ফোল্ডার তৈরি করা
io-opening = { $path } খোলা
io-removing = { $path } সরানো
io-copying = { $path } অনুলিপি করা
io-flushing = { $path } ডিস্কে লেখা
io-replacing = { $path } বদলে দেওয়া
io-backing-up = { $path }-এর ব্যাকআপ নেওয়া
io-storing = { $path } রাখা
io-no-directory = { $path }-এর কোনো ফোল্ডার নেই

## The network. Shown after "network: ".

network-timeout = { $host } সময়মতো উত্তর দিল না
network-host-not-found = { $host } খুঁজে পাওয়া গেল না; নেটওয়ার্কের সংযোগ আছে কি?
network-unreachable = { $host }-এ পৌঁছানো গেল না
network-unreachable-because = { $host }-এ পৌঁছানো গেল না: { $error }
network-nothing-there = { $host }-এর ওই ঠিকানায় কিছু নেই
network-wait = { $host } আবার জিজ্ঞাসা করার আগে অপেক্ষা করতে বলছে
network-status = { $host } একটি ত্রুটি দিয়ে উত্তর দিয়েছে ({ $status })
# A way of asking, GET or POST, that the application does not use.
network-method = { $method } এমন কোনো জিজ্ঞাসার উপায় নয়, যা এখানে ব্যবহৃত হয়

## When the application is opened a second time.

core-in-use-title = Glaukopis আগে থেকেই খোলা
core-in-use = Glaukopis আগে থেকেই খোলা, এবং { $path }-এ কাজ করছে। সেখানে একসঙ্গে একটিই কাজ করতে পারে, নইলে একটি অন্যটির লেখার ওপর লিখে ফেলবে। যেটি খোলা আছে, তাতেই কাজ চালিয়ে যান।
