# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = तस्वीर “{ $name }” इस कंप्यूटर पर नहीं है, और दस्तावेज़ से छूट गई है।
core-export-astray = { $count ->
    [one] पाठ का एक संकेत किसी ऐसी चीज़ की ओर है जो दस्तावेज़ में नहीं है। उसे [?] लिखा गया है।
   *[other] पाठ के { $count } संकेत ऐसी चीज़ों की ओर हैं जो दस्तावेज़ में नहीं हैं। उन्हें [?] लिखा गया है।
}
core-export-latex-font = { $font } स्थापित नहीं है। दस्तावेज़ Latin Modern में सजाया गया है, जो फ़ॉन्ट LaTeX का अपना है।
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = दस्तावेज़ के { $count } पाठ भेजे नहीं गए, और रखे हुए भी नहीं हैं।
# Shown after "not found: ".
core-export-preview-document = पूर्वावलोकन का दस्तावेज़
core-export-reading-pdf = बनाई गई पीडीएफ़ पढ़ते हुए
core-export-reading-made = बनाया गया दस्तावेज़ पढ़ते हुए

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = नमूना दस्तावेज़ पढ़ा नहीं जा सका: { $error }
core-export-pattern-lacks = नमूना दस्तावेज़ में { $name } नहीं है
core-export-pattern-reading = नमूना दस्तावेज़ पढ़ते हुए
core-export-pattern-writing = नमूना दस्तावेज़ लिखते हुए

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = सूत्र पूरा होने से पहले ही ख़त्म हो जाता है।
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } जाना-पहचाना नहीं है।
core-export-formula-unexpected = { $what } की अपेक्षा वहाँ नहीं थी जहाँ वह खड़ा है।
core-export-formula-unreadable = सूत्र पढ़ा नहीं जा सका।
core-export-formula-too-long = सूत्र बहुत लंबा है।

## Reference styles.

core-export-style-bad-id = “{ $id }” किसी शैली की पहचान नहीं हो सकती
core-export-not-a-style = यह शैली नहीं है: { $error }।
core-export-not-a-style-begin = यह शैली नहीं है: यह <style> से शुरू नहीं होती।
core-export-dependent-style = यह शैली केवल किसी और शैली का नाम लेती है, जिससे वह अपना रूप लेती है। उसे उसके नाम से लाएँ।
core-export-style-unreadable = शैली वापस पढ़ी नहीं जा सकी।
core-export-style-needs-name = शैली का एक नाम चाहिए।
core-export-style-own-only = केवल आपकी अपनी शैलियाँ मिटाई जा सकती हैं।
# Shown after "not found: ".
core-export-the-reference-style = संदर्भ शैली “{ $id }”
core-export-any-reference-style = कोई भी संदर्भ शैली
core-export-the-style = शैली “{ $id }”

## Document formats.

core-export-format-bad-id = “{ $id }” किसी प्रारूप की पहचान नहीं हो सकती
core-export-format-needs-name = प्रारूप का एक नाम चाहिए।
core-export-format-own-only = केवल आपके अपने प्रारूप मिटाए जा सकते हैं।
core-export-not-a-length = “{ $length }” कोई लंबाई नहीं है
# Shown after "not found: ".
core-export-the-format = प्रारूप “{ $id }”
