# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = „{ $doi }“ није DOI.
core-lookup-not-arxiv = „{ $id }“ није идентификатор са arXiv-а.
core-lookup-not-pubmed = „{ $id }“ није број из базе PubMed.
core-lookup-isbn-length = „{ $isbn }“ није ISBN: ISBN има 10 или 13 цифара, а овај их има { $count }.
core-lookup-isbn-check = „{ $isbn }“ није ISBN: последња цифра се рачуна из осталих, а с њима се не слаже. Да није нека цифра погрешно откуцана?
core-lookup-not-isbn = „{ $isbn }“ није ISBN.
core-lookup-address = Адреса се може потражити кад садржи DOI, идентификатор са arXiv-а или број из базе PubMed. Ова не садржи ништа од тога: потражите радије наслов.
core-lookup-nothing = Нема шта да се тражи.

## The services, and what they ask to have said of them.

core-lookup-sikt = Норвешке академске библиотеке (Sikt)
core-lookup-thanks-arxiv = Захваљујемо arXiv-у на коришћењу његовог интерфејса за отворени приступ.
core-lookup-thanks-sikt = Садржи записе из библиотечког каталога организације Sikt, доступне под Норвешком лиценцом за отворене податке јавне управе (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, за књигу

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } је одговорио нечим што није могло да се прочита
core-lookup-not-preprints = { $service } је одговорио нечим што није списак препринтова
core-lookup-not-articles = { $service } је одговорио нечим што није списак чланака
core-lookup-could-not-answer = { $service } није могао да одговори на питање: { $said }
core-lookup-catalogue-could-not-answer = каталог није могао да одговори на питање: { $said }
core-lookup-no-reason = разлог није наведен
core-lookup-catalogue-unreadable = одговор није могао да се прочита
core-lookup-not-a-catalogue = одговор није био одговор каталога
core-lookup-pubmed-book = { $service } ово води као књигу или њен део, што се оданде још не може прочитати
core-lookup-wrong-form = { $host } не даје запис у траженом облику
core-lookup-not-a-record = { $service }: одговор није био запис који може да се прочита.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Овај препринт је у међувремену објављен. Унети DOI је онај објављене верзије: потражите { $doi } да бисте радије њу цитирали.
core-lookup-arxiv-published = Овај препринт је у међувремену објављен: { $journal }.
core-lookup-arxiv-year-only = Овде је дата само година. Проналажење arXiv:{ $id } даје и дан кад је препринт послат.
core-lookup-crossref-in-book = Претрага не даје уреднике и ISBN књиге. Проналажење по DOI-ју даје.
core-lookup-book-unreadable = Оно што Crossref има о књизи није могло да се прочита: можда недостају њени уредници.
core-lookup-book-not-fetched = Оно што Crossref има о књизи није могло да се преузме: можда недостају њени уредници.
core-lookup-chapter-author = Crossref не наводи аутора поглавља. Као његов аутор унет је аутор књиге.
core-lookup-group-name = „{ $name }“ је дато као име особе, „{ $family }, { $given }“, а узето је као назив групе.
core-lookup-kind-none = Запис никако не назива врсту публикације. Унета је као „misc“: изаберите прави тип.
core-lookup-kind = Запис назива врсту публикације „{ $kind }“. Унета је као „misc“: изаберите прави тип.
core-lookup-publisher-capitals = Издавач је био написан великим словима, „{ $publisher }“, и записан је као „{ $mended }“.
core-lookup-no-creators = Запис не наводи ни аутора ни уредника.
core-lookup-title-capitals = Наслов је био написан великим словима и пребачен је у мала: проверите да ли имена имају своја велика слова.
core-lookup-name-capitals = Име „{ $family }“ било је написано великим словима и записано је као „{ $mended }“.
core-lookup-pubmed-translated = PubMed преводи наслов на енглески као „{ $title }“.
core-lookup-pubmed-translation = Наслов је превод базе PubMed на енглески. Наслов на језику чланка није дат.
core-lookup-parallel-title = Запис даје наслов и на другом језику, који није унет: „{ $title }“.
core-lookup-original-script = Наслов је унет онако како га каталог пише латиницом. На свом писму гласи „{ $title }“.
core-lookup-unplaced-name = Запис наводи { $name } не кажући у којој улози. Име није унето.
core-lookup-thesis = Књига је уједно и теза: { $said }.
core-lookup-ebook = Запис е-књиге: место, издавач и година су они електронског издања.
core-lookup-sound = Звучни запис.
core-lookup-audio-book = Запис аудио-књиге.
core-lookup-not-text = Запис није о тексту. Унет је како се могло: изаберите прави тип.
core-lookup-other-form = Тражени ISBN припада другом облику књиге. ISBN онога што овај запис описује: { $isbn }.
core-lookup-other-isbn = Запис нема тражени ISBN. ISBN онога што описује: { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = нема га
core-lookup-another-edition = Друго издање с истим ISBN-ом ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = издање { $edition }, { $year }
core-lookup-without-year = без године
