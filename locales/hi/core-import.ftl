# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = चिपकाया गया पाठ
core-import-files = { $count } फ़ाइलें

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = फ़ाइल “{ $name }” नहीं मिली।
core-import-empty-entry = पंक्ति { $line }: प्रविष्टि “{ $key }” खाली है और छोड़ दी गई।
# Where in a file a reference that has no key was found.
core-import-origin-line = पंक्ति { $line }
core-import-origin-key-line = { $key }, पंक्ति { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = “{ $title }”
core-import-merge-gone = { $reference }: जिस प्रविष्टि में मिलाना था, वह अब नहीं रही

## PDF files.

core-import-not-a-pdf = { $name } पीडीएफ़ नहीं है।
# The service is a name: Crossref, DataCite.
core-import-details-from = ब्योरा { $service } से है।
core-import-number-unknown = फ़ाइल में एक नंबर मिला, पर डेटाबेसों में उसके बारे में कुछ पता नहीं; ब्योरा फ़ाइल से ही लिया गया है और जाँच लेना चाहिए।
core-import-databases-failed = डेटाबेसों से पूछा नहीं जा सका ({ $error }); ब्योरा फ़ाइल से ही लिया गया है और जाँच लेना चाहिए।

## Zotero.

core-import-zotero-my-library = मेरा पुस्तकालय
core-import-zotero-group = समूह { $id }
core-import-zotero-the-library = Zotero में पुस्तकालय { $id }
core-import-zotero-own-library = Zotero में उपयोगकर्ता का अपना पुस्तकालय
core-import-zotero-the-collection = Zotero में संग्रह { $key }
core-import-zotero-unknown-base = फ़ाइल “{ $name }” नहीं मिली। Zotero उसे अपने चुने हुए किसी फ़ोल्डर से जोड़ता है, जो यहाँ ज्ञात नहीं है।
core-import-zotero-empty-item = Zotero की प्रविष्टि { $key } खाली है और छोड़ दी गई।
core-import-zotero-alone = { $count ->
    [one] Zotero में { $count } फ़ाइल या नोट किसी संदर्भ के नीचे नहीं है, और छोड़ दिया गया।
   *[other] Zotero में { $count } फ़ाइलें और नोट किसी संदर्भ के नीचे नहीं हैं, और छोड़ दिए गए।
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero { $name } को { $role } कहता है, जिसके लिए BibLaTeX में कोई फ़ील्ड नहीं है। यह नाम छोड़ दिया गया।
core-import-zotero-left-out = Zotero के फ़ील्ड “{ $field }” का BibLaTeX में कोई जोड़ नहीं है, और वह छोड़ दिया गया: { $value }

## Zotero's database.

core-import-zotero-no-database = { $path } में Zotero का डेटाबेस ({ $file })
core-import-zotero-copying = { $path } की नक़ल अस्थायी फ़ोल्डर में करते हुए
core-import-zotero-empty = फ़ाइल खाली है
core-import-zotero-disturbed = जब डेटाबेस पढ़ा जा रहा था, Zotero उसमें लिख रहा था। अगर कुछ छूट गया हो, तो Zotero बंद करके फिर आयात करें।
core-import-zotero-backup-read = Zotero का डेटाबेस पढ़ा नहीं जा सका ({ $error })। उसकी जगह उसकी सुरक्षित प्रति { $backup } पढ़ी गई: प्रति बनने के बाद Zotero में जो बदला, वह इसमें नहीं है।
core-import-zotero-not-a-database = { $path } Zotero का डेटाबेस नहीं है।
core-import-zotero-unreadable = Zotero के डेटाबेस का रूप ऐसा है जो यहाँ पढ़ा नहीं जा सकता: { $what }। अगर उसे Zotero के किसी पुराने संस्करण ने लिखा है, तो किसी नए संस्करण में एक बार खोलने से वह नया हो जाता है।
core-import-zotero-unreadable-version = Zotero के डेटाबेस का रूप ऐसा है जो यहाँ पढ़ा नहीं जा सकता (Zotero के डेटाबेस का संस्करण { $version }): { $what }। अगर उसे Zotero के किसी पुराने संस्करण ने लिखा है, तो किसी नए संस्करण में एक बार खोलने से वह नया हो जाता है।
core-import-zotero-no-table = तालिका “{ $table }” नहीं है
core-import-zotero-no-column = तालिका “{ $table }” में स्तंभ “{ $column }” नहीं है
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Zotero के डेटाबेस में यहाँ ज्ञात रूप की तालिका “{ $table }” नहीं है: { $consequence }।
core-import-zotero-no-bin = Zotero की रद्दी की प्रविष्टियाँ बाकी से अलग नहीं पहचानी जा सकतीं
core-import-zotero-no-collections = संग्रह नहीं पढ़े गए
core-import-zotero-no-attachments = संलग्न फ़ाइलें नहीं पढ़ी गईं
core-import-zotero-no-notes = नोट नहीं पढ़े गए
core-import-zotero-no-keywords = कुंजी-शब्द नहीं पढ़े गए
core-import-zotero-no-group-names = समूह पुस्तकालयों के नाम ज्ञात नहीं हैं

## PDF files, as they are read for a reference.

core-import-pdf-empty = फ़ाइल “{ $name }” खाली है।
core-import-pdf-not-a-pdf = फ़ाइल “{ $name }” पीडीएफ़ नहीं है।
core-import-pdf-unreadable = फ़ाइल पढ़ी नहीं जा सकी: वह ख़राब है, पासवर्ड से सुरक्षित है, या बहुत बड़ी है।
core-import-pdf-scan = फ़ाइल में पाठ की कोई परत नहीं है: यह स्कैन है।
core-import-pdf-from-file = ब्योरा फ़ाइल से ही लिया गया है, किसी सूची-पत्र से नहीं, और जाँच लेना चाहिए।
core-import-pdf-from-metadata = फ़ाइल में कोई DOI या ISBN नहीं मिला; ब्योरा फ़ाइल के अपने मेटाडेटा से है और जाँच लेना चाहिए।
core-import-pdf-unknown = फ़ाइल में कोई DOI या ISBN नहीं मिला, और उसका मेटाडेटा नहीं बताता कि वह क्या है: ब्योरा भरना होगा।

## Tables, from files of text and of sheets.

core-import-table-too-large = फ़ाइल { $size } MB की है। तालिका ज़्यादा से ज़्यादा { $most } MB की फ़ाइल से पढ़ी जाती है।
core-import-table-kinds = तालिकाएँ CSV और ऐसे दूसरे पाठ से पढ़ी जाती हैं जिसमें मान अल्पविराम, अर्धविराम या टैब से अलग हों, और LibreOffice (.ods) तथा Excel (.xlsx, .xls) की शीटों से।
core-import-table-empty = फ़ाइल में कुछ नहीं है।
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = तालिका में { $rows } पंक्तियाँ हैं। पाठ की तालिका में ज़्यादा से ज़्यादा { $most } हो सकती हैं: वह स्प्रेडशीट नहीं है।
core-import-table-columns = तालिका में { $columns } स्तंभ हैं। पाठ की तालिका में ज़्यादा से ज़्यादा { $most } हो सकते हैं: वह स्प्रेडशीट नहीं है।
core-import-table-more-than = { $count } से ज़्यादा

## Documents brought in, to become maps.

core-import-document-stopped = पढ़ना रोक दिया गया।
core-import-pdfs-stopped = फ़ाइलें क्या हैं, यह पता लगाना रोक दिया गया। कुछ नहीं जोड़ा गया।
core-import-document-kind = “{ $file }” ऐसे प्रकार की नहीं है जिसे दस्तावेज़ के रूप में लाया जा सके। जो लाई जा सकती हैं वे हैं Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst और सादा पाठ।
core-import-document-too-large = “{ $file }” 50 MB से बड़ी है, और इतनी बड़ी फ़ाइल दस्तावेज़ के रूप में नहीं लाई जा सकती।
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = “{ $file }” को { $kind } के रूप में पढ़ा नहीं जा सका। वह ख़राब हो सकती है, या अपने नाम से अलग प्रकार की। Pandoc ने, जो उसे पढ़ता है, कहा: { $message }
core-import-document-pandoc-unreadable = Pandoc ने “{ $file }” से जो बनाया, वह पढ़ा नहीं जा सका: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = बिना शीर्षक
core-import-document-plain-text = सादा पाठ
core-import-document-notebook = Jupyter नोटबुक

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] { $count } हवाला मिला जो अभी आपके पुस्तकालय के किसी संदर्भ से जुड़ा नहीं है, और जो संदर्भ रखने वाले किसी प्रोग्राम का बनाया है। वह उसी पाठ के रूप में खड़ा है जैसा लिखा गया था, और नक्शा बनते समय या बाद में देखा जा सकता है।
       *[none] { $count } हवाला मिला जो अभी आपके पुस्तकालय के किसी संदर्भ से जुड़ा नहीं है। वह उसी पाठ के रूप में खड़ा है जैसा लिखा गया था, और नक्शा बनते समय या बाद में देखा जा सकता है।
    }
   *[other] { $made ->
        [all] { $count } हवाले मिले जो अभी आपके पुस्तकालय के संदर्भों से जुड़े नहीं हैं, और जो सब संदर्भ रखने वाले किसी प्रोग्राम के बनाए हैं। वे उसी पाठ के रूप में खड़े हैं जैसा लिखा गया था, और नक्शा बनते समय या बाद में देखे जा सकते हैं।
        [some] { $count } हवाले मिले जो अभी आपके पुस्तकालय के संदर्भों से जुड़े नहीं हैं, जिनमें से { $some } संदर्भ रखने वाले किसी प्रोग्राम के बनाए हैं। वे उसी पाठ के रूप में खड़े हैं जैसा लिखा गया था, और नक्शा बनते समय या बाद में देखे जा सकते हैं।
       *[none] { $count } हवाले मिले जो अभी आपके पुस्तकालय के संदर्भों से जुड़े नहीं हैं। वे उसी पाठ के रूप में खड़े हैं जैसा लिखा गया था, और नक्शा बनते समय या बाद में देखे जा सकते हैं।
    }
}
core-import-document-endnote = { $count ->
    [one] EndNote का बनाया { $count } हवाला उसी पाठ के रूप में लाया गया है जो वह दिखाता है, और मिले हुए हवालों में नहीं है: EndNote कृतियों के बारे में जो कहता है, वह पढ़ा नहीं जा सका।
   *[other] EndNote के बनाए { $count } हवाले उसी पाठ के रूप में लाए गए हैं जो वे दिखाते हैं, और मिले हुए हवालों में नहीं हैं: EndNote कृतियों के बारे में जो कहता है, वह पढ़ा नहीं जा सका।
}
core-import-document-bookmarks = { $count ->
    [one] दस्तावेज़ { $count } हवाला बुकमार्क में रखता है, और वह किसका हवाला देता है, यह पढ़ा नहीं जा सका: वह जैसा खड़ा है वैसा पाठ है। Zotero उन्हें ऐसे तब रखता है जब उसकी दस्तावेज़ प्राथमिकताएँ ऐसा कहें।
   *[other] दस्तावेज़ { $count } हवाले बुकमार्कों में रखता है, और वे किसका हवाला देते हैं, यह पढ़ा नहीं जा सका: वे जैसे खड़े हैं वैसा पाठ हैं। Zotero उन्हें ऐसे तब रखता है जब उसकी दस्तावेज़ प्राथमिकताएँ ऐसा कहें।
}
core-import-document-bibliography = दस्तावेज़ में “{ $heading }” के नीचे उन कृतियों की सूची है जिनका वह हवाला देता है। वह बाकी की तरह पाठ के रूप में लाई गई है। नक्शा अपनी ग्रंथ-सूची उसमें दिए गए हवालों से खुद बनाता है।
core-import-document-bibliography-made = दस्तावेज़ में उन कृतियों की सूची है जिनका वह हवाला देता है, जो उसके संदर्भ रखने वाले प्रोग्राम की बनाई है। वह बाकी की तरह पाठ के रूप में लाई गई है। नक्शा अपनी ग्रंथ-सूची उसमें दिए गए हवालों से खुद बनाता है।
core-import-document-tracked = दस्तावेज़ में ट्रैक किए गए बदलाव हैं। पाठ वैसा लाया गया है जैसा वह सब बदलाव स्वीकारने पर होता है।
core-import-document-comments = दस्तावेज़ के हाशिये में टिप्पणियाँ हैं, जो छोड़ दी गई हैं।
core-import-document-heading-notes = { $count ->
    [one] किसी शीर्षक पर की गई टिप्पणी उसके नीचे के पाठ के शुरू में खड़ी है: शीर्षक पर टिप्पणी नहीं हो सकती।
   *[other] शीर्षकों पर की गई { $count } टिप्पणियाँ उनके नीचे के पाठ के शुरू में खड़ी हैं: शीर्षक पर टिप्पणी नहीं हो सकती।
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } कैप्शन एक शब्द और एक नंबर से शुरू होता था, जैसे “{ $first }”। वह छोड़ दिया गया है: नक्शा अपने चित्रों और तालिकाओं को खुद नंबर देता है। जहाँ पाठ उनमें से किसी को उसके नंबर से पुकारता है, वह जैसा लिखा गया था वैसा पाठ है, और नक्शे के नंबरों के साथ नहीं चलता।
   *[other] { $count } कैप्शन एक शब्द और एक नंबर से शुरू होते थे, जैसे “{ $first }”। वे छोड़ दिए गए हैं: नक्शा अपने चित्रों और तालिकाओं को खुद नंबर देता है। जहाँ पाठ उनमें से किसी को उसके नंबर से पुकारता है, वह जैसा लिखा गया था वैसा पाठ है, और नक्शे के नंबरों के साथ नहीं चलता।
}
core-import-document-label-example = चित्र 1:
core-import-document-caption-notes = { $count ->
    [one] किसी चित्र या तालिका के ब्योरे में की गई टिप्पणी वहीं कोष्ठक में खड़ी है।
   *[other] चित्रों या तालिकाओं के ब्योरे में की गई { $count } टिप्पणियाँ वहीं कोष्ठक में खड़ी हैं।
}
core-import-document-headings = { $count ->
    [one] उद्धरण, सूची या तालिका के भीतर का { $count } शीर्षक बोल्ड अनुच्छेद के रूप में लाया गया है।
   *[other] उद्धरण, सूची या तालिका के भीतर के { $count } शीर्षक बोल्ड अनुच्छेदों के रूप में लाए गए हैं।
}
core-import-document-code = { $count ->
    [one] कोड का { $count } खंड सादे अनुच्छेदों के रूप में लाया गया है, हर पंक्ति का एक।
   *[other] कोड के { $count } खंड सादे अनुच्छेदों के रूप में लाए गए हैं, हर पंक्ति का एक।
}
core-import-document-definitions = { $count ->
    [one] पारिभाषिक शब्दों और उनके अर्थों की { $count } सूची अनुच्छेदों के रूप में लाई गई है, शब्द बोल्ड में।
   *[other] पारिभाषिक शब्दों और उनके अर्थों की { $count } सूचियाँ अनुच्छेदों के रूप में लाई गई हैं, शब्द बोल्ड में।
}
core-import-document-rules = { $count ->
    [one] पृष्ठ के आर-पार की { $count } रेखा छोड़ दी गई है।
   *[other] पृष्ठ के आर-पार की { $count } रेखाएँ छोड़ दी गई हैं।
}
core-import-document-raw = { $count ->
    [one] केवल एक ही प्रकार के दस्तावेज़ के लिए HTML या TeX में लिखा { $count } टुकड़ा छोड़ दिया गया है।
   *[other] केवल एक ही प्रकार के दस्तावेज़ के लिए HTML या TeX में लिखे { $count } टुकड़े छोड़ दिए गए हैं।
}
core-import-document-pictures-wanting = { $count ->
    [one] फ़ाइल में रखी { $count } तस्वीर पढ़े गए पाठ में नहीं है, और छोड़ दी गई है। वह पृष्ठों के शीर्ष या पाद में, या किसी रेखाचित्र में हो सकती है।
   *[other] फ़ाइल में रखी { $count } तस्वीरें पढ़े गए पाठ में नहीं हैं, और छोड़ दी गई हैं। वे पृष्ठों के शीर्ष या पाद में, या किसी रेखाचित्र में हो सकती हैं।
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = तस्वीर “{ $name }” छोड़ दी गई है: { $why }।
core-import-document-picture-kind = वह ऐसे प्रकार की है जो पढ़ा नहीं जाता ({ $kind })
core-import-document-picture-not-read = वह ऐसे प्रकार की तस्वीर नहीं है जो पढ़ा जाता हो
core-import-document-picture-unreadable = वह पढ़ी नहीं जा सकी
core-import-document-picture-network = वह नेटवर्क पर है, और वहाँ से कुछ नहीं लाया जाता
core-import-document-picture-not-taken-out = वह फ़ाइल से निकाली नहीं जा सकी
core-import-document-picture-outside = वह फ़ाइल में नहीं, बल्कि इस कंप्यूटर पर कहीं और है, और वहाँ से नहीं ली जाती
core-import-document-picture-not-found = फ़ाइल वहाँ नहीं मिली जहाँ दस्तावेज़ कहता है
core-import-document-picture-too-large = वह 50 MB से बड़ी है
core-import-document-picture-file-unreadable = फ़ाइल पढ़ी नहीं जा सकी
