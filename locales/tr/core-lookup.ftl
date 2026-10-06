# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = “{ $doi }” bir DOI değil.
core-lookup-not-arxiv = “{ $id }” bir arXiv tanımlayıcısı değil.
core-lookup-not-pubmed = “{ $id }” bir PubMed numarası değil.
core-lookup-isbn-length = “{ $isbn }” bir ISBN değil: ISBN 10 ya da 13 basamaklıdır, bunun basamak sayısı { $count }.
core-lookup-isbn-check = “{ $isbn }” bir ISBN değil: son basamağı ötekilerden hesaplanır ve onlarla uyuşmuyor. Bir basamak yanlış mı yazıldı?
core-lookup-not-isbn = “{ $isbn }” bir ISBN değil.
core-lookup-address = Bir adres, içinde bir DOI, bir arXiv tanımlayıcısı ya da bir PubMed numarası varsa sorgulanabilir. Bunda yok: onun yerine adı arayın.
core-lookup-nothing = Aranacak bir şey yok.

## The services, and what they ask to have said of them.

core-lookup-sikt = Norveç akademik kütüphaneleri (Sikt)
core-lookup-thanks-arxiv = Açık erişim birlikte çalışabilirliğini kullanmamıza olanak verdiği için arXiv’e teşekkür ederiz.
core-lookup-thanks-sikt = Sikt kütüphane kataloğundan, Norveç Açık Kamu Verisi Lisansı (NLOD) altında sunulan kayıtlar içerir.
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, kitap için

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } okunamayan bir yanıt verdi
core-lookup-not-preprints = { $service } ön baskı listesi olmayan bir yanıt verdi
core-lookup-not-articles = { $service } makale listesi olmayan bir yanıt verdi
core-lookup-could-not-answer = { $service } soruyu yanıtlayamadı: { $said }
core-lookup-catalogue-could-not-answer = katalog soruyu yanıtlayamadı: { $said }
core-lookup-no-reason = gerekçe verilmedi
core-lookup-catalogue-unreadable = yanıt okunamadı
core-lookup-not-a-catalogue = yanıt bir kataloğun yanıtı değildi
core-lookup-pubmed-book = { $service } bunu bir kitap ya da kitap bölümü olarak tutuyor; bu henüz oradan okunamıyor
core-lookup-wrong-form = { $host } kaydı istenen biçimde vermiyor
core-lookup-not-a-record = { $service }: yanıt okunabilecek bir kayıt değildi.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Bu ön baskı o zamandan beri yayımlandı. Girilen DOI, yayımlanmış sürümün DOI’si: onun yerine ona atıf yapmak için { $doi } sorgulayın.
core-lookup-arxiv-published = Bu ön baskı o zamandan beri yayımlandı: { $journal }.
core-lookup-arxiv-year-only = Burada yalnızca yıl veriliyor. arXiv:{ $id } sorgulanırsa ön baskının gönderildiği gün de gelir.
core-lookup-crossref-in-book = Arama, kitabın editörlerini ve ISBN’ini vermiyor. DOI’yi sorgulamak veriyor.
core-lookup-book-unreadable = Crossref’in kitap hakkındaki bilgileri okunamadı: editörleri eksik olabilir.
core-lookup-book-not-fetched = Crossref’in kitap hakkındaki bilgileri getirilemedi: editörleri eksik olabilir.
core-lookup-chapter-author = Crossref bölüm için yazar vermiyor. Kitabın yazarı bölümün yazarı olarak girildi.
core-lookup-group-name = “{ $name }” bir kişinin adı olarak verilmişti (“{ $family }, { $given }”) ve bir grubun adı olarak alındı.
core-lookup-kind-none = Kayıt yayın türüne bir ad vermiyor. “misc” olarak girildi: doğru türü seçin.
core-lookup-kind = Kayıt yayın türünü “{ $kind }” olarak adlandırıyor. “misc” olarak girildi: doğru türü seçin.
core-lookup-publisher-capitals = Yayınevi büyük harflerle yazılmıştı (“{ $publisher }”) ve “{ $mended }” olarak yazıldı.
core-lookup-no-creators = Kayıt yazar ya da editör vermiyor.
core-lookup-title-capitals = Ad büyük harflerle yazılmıştı ve küçük harfe çevrildi: özel adların büyük harfle başladığını denetleyin.
core-lookup-name-capitals = “{ $family }” adı büyük harflerle yazılmıştı ve “{ $mended }” olarak yazıldı.
core-lookup-pubmed-translated = PubMed adı İngilizceye şöyle çeviriyor: “{ $title }”.
core-lookup-pubmed-translation = Ad, PubMed’in İngilizce çevirisi. Makalenin kendi dilindeki adı verilmiyor.
core-lookup-parallel-title = Kayıt adı başka bir dilde de veriyor; bu girilmedi: “{ $title }”.
core-lookup-original-script = Ad, kataloğun Latin harfleriyle yazdığı gibi girildi. Kendi yazısında şöyle: “{ $title }”.
core-lookup-unplaced-name = Kayıt { $name } adını ne sıfatla olduğunu söylemeden veriyor. Ad girilmedi.
core-lookup-thesis = Kitap aynı zamanda bir tez: { $said }.
core-lookup-ebook = Bir e-kitap kaydı: yer, yayınevi ve yıl elektronik baskıya ait.
core-lookup-sound = Bir ses kaydı.
core-lookup-audio-book = Bir sesli kitap kaydı.
core-lookup-not-text = Kayıt bir metne ait değil. Olabildiğince girildi: doğru türü seçin.
core-lookup-other-form = İstenen ISBN, kitabın başka bir biçimine ait. Bu kaydın tanımladığının ISBN’i: { $isbn }.
core-lookup-other-isbn = Kayıtta istenen ISBN yok. Tanımladığının ISBN’i: { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = yok
core-lookup-another-edition = Aynı ISBN’li başka bir baskı ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = { $edition }. baskı, { $year }
core-lookup-without-year = yılsız
