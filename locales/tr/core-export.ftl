# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = “{ $name }” adlı resim bu bilgisayarda yok; belgeye konmadı.
core-export-astray = { $count ->
    [one] Metindeki bir gönderme belgede olmayan bir şeyi gösteriyor. [?] olarak dizildi.
   *[other] Metindeki { $count } gönderme belgede olmayan şeyleri gösteriyor. [?] olarak dizildiler.
}
core-export-latex-font = { $font } kurulu değil. Belge, LaTeX’in kendi yazı tipi olan Latin Modern ile dizildi.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = Belgenin { $count } metni gönderilmedi ve saklanmıyor.
# Shown after "not found: ".
core-export-preview-document = önizlemenin belgesi
core-export-reading-pdf = oluşturulan PDF okunurken
core-export-reading-made = oluşturulan belge okunurken

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = örnek belge okunamadı: { $error }
core-export-pattern-lacks = örnek belgede şu yok: { $name }
core-export-pattern-reading = örnek belge okunurken
core-export-pattern-writing = örnek belge yazılırken

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Formül tamamlanmadan bitiyor.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } bilinmiyor.
core-export-formula-unexpected = { $what } durduğu yerde beklenmiyordu.
core-export-formula-unreadable = Formül okunamadı.
core-export-formula-too-long = Formül çok uzun.

## Reference styles.

core-export-style-bad-id = “{ $id }” bir stilin kimliği olamaz
core-export-not-a-style = Bu bir stil değil: { $error }.
core-export-not-a-style-begin = Bu bir stil değil: <style> ile başlamıyor.
core-export-dependent-style = Bu stil yalnızca biçimini aldığı başka bir stili adlandırıyor. Onun yerine o stili adıyla getirin.
core-export-style-unreadable = Stil geri okunamadı.
core-export-style-needs-name = Bir stilin adı olmalı.
core-export-style-own-only = Yalnızca kendi stilleriniz silinebilir.
# Shown after "not found: ".
core-export-the-reference-style = “{ $id }” atıf stili
core-export-any-reference-style = herhangi bir atıf stili
core-export-the-style = “{ $id }” stili

## Document formats.

core-export-format-bad-id = “{ $id }” bir formatın kimliği olamaz
core-export-format-needs-name = Bir formatın adı olmalı.
core-export-format-own-only = Yalnızca kendi formatlarınız silinebilir.
core-export-not-a-length = “{ $length }” bir uzunluk değil
# Shown after "not found: ".
core-export-the-format = “{ $id }” formatı
