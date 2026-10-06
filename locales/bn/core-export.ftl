# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = “{ $name }” ছবিটি এই কম্পিউটারে নেই, তাই নথি থেকে বাদ পড়েছে।
core-export-astray = { $count ->
    [one] পাঠের একটি নির্দেশ এমন কিছুর দিকে, যা নথিতে নেই। সেটি [?] হিসেবে বসানো হয়েছে।
   *[other] পাঠের { $count }টি নির্দেশ এমন কিছুর দিকে, যা নথিতে নেই। সেগুলো [?] হিসেবে বসানো হয়েছে।
}
core-export-latex-font = { $font } ইনস্টল করা নেই। নথিটি Latin Modern-এ সাজানো হয়েছে, LaTeX-এর নিজের ফন্টে।
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = নথির { $count }টি লেখা পাঠানো হয়নি, এবং সেগুলো রাখা নেই।
# Shown after "not found: ".
core-export-preview-document = পূর্বরূপের নথি
core-export-reading-pdf = তৈরি করা পিডিএফটি পড়া
core-export-reading-made = তৈরি করা নথিটি পড়া

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = ছাঁচ-নথিটি পড়া গেল না: { $error }
core-export-pattern-lacks = ছাঁচ-নথিতে কোনো { $name } নেই
core-export-pattern-reading = ছাঁচ-নথিটি পড়া
core-export-pattern-writing = ছাঁচ-নথিটি লেখা

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = সূত্রটি সম্পূর্ণ হওয়ার আগেই শেষ হয়ে গেছে।
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } অজানা।
core-export-formula-unexpected = { $what } যেখানে আছে, সেখানে তা প্রত্যাশিত ছিল না।
core-export-formula-unreadable = সূত্রটি পড়া গেল না।
core-export-formula-too-long = সূত্রটি বড্ড লম্বা।

## Reference styles.

core-export-style-bad-id = “{ $id }” কোনো শৈলীর আইডি হতে পারে না
core-export-not-a-style = এটি কোনো শৈলী নয়: { $error }।
core-export-not-a-style-begin = এটি কোনো শৈলী নয়: এটি <style> দিয়ে শুরু হয় না।
core-export-dependent-style = এই শৈলীটি শুধু অন্য একটি শৈলীর নাম করে, যার থেকে এটি তার রূপ নেয়। বরং সেটিকে তার নামে আনুন।
core-export-style-unreadable = শৈলীটি ফিরে পড়া গেল না।
core-export-style-needs-name = একটি শৈলীর একটি নাম দরকার।
core-export-style-own-only = শুধু আপনার নিজের শৈলী মোছা যায়।
# Shown after "not found: ".
core-export-the-reference-style = “{ $id }” তথ্যসূত্র শৈলীটি
core-export-any-reference-style = কোনো তথ্যসূত্র শৈলীই
core-export-the-style = “{ $id }” শৈলীটি

## Document formats.

core-export-format-bad-id = “{ $id }” কোনো বিন্যাসের আইডি হতে পারে না
core-export-format-needs-name = একটি বিন্যাসের একটি নাম দরকার।
core-export-format-own-only = শুধু আপনার নিজের বিন্যাস মোছা যায়।
core-export-not-a-length = “{ $length }” কোনো দৈর্ঘ্য নয়
# Shown after "not found: ".
core-export-the-format = “{ $id }” বিন্যাসটি
