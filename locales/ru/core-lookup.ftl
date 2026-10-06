# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = «{ $doi }» — не DOI.
core-lookup-not-arxiv = «{ $id }» — не идентификатор arXiv.
core-lookup-not-pubmed = «{ $id }» — не номер PubMed.
core-lookup-isbn-length = «{ $isbn }» — не ISBN: в ISBN 10 или 13 цифр, а здесь { $count }.
core-lookup-isbn-check = «{ $isbn }» — не ISBN: его последняя цифра вычисляется из остальных и с ними не сходится. Нет ли опечатки?
core-lookup-not-isbn = «{ $isbn }» — не ISBN.
core-lookup-address = По адресу можно искать, когда в нём есть DOI, идентификатор arXiv или номер PubMed. В этом их нет: поищите по названию.
core-lookup-nothing = Искать нечего.

## The services, and what they ask to have said of them.

core-lookup-sikt = Норвежские академические библиотеки (Sikt)
core-lookup-thanks-arxiv = Благодарим arXiv за возможность пользоваться его открытым интерфейсом.
core-lookup-thanks-sikt = Содержит записи из библиотечного каталога Sikt, открытые по Норвежской лицензии на открытые государственные данные (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, о книге

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } ответил чем-то, что не удалось прочитать
core-lookup-not-preprints = { $service } ответил чем-то, что не является списком препринтов
core-lookup-not-articles = { $service } ответил чем-то, что не является списком статей
core-lookup-could-not-answer = { $service } не смог ответить на запрос: { $said }
core-lookup-catalogue-could-not-answer = каталог не смог ответить на запрос: { $said }
core-lookup-no-reason = причина не названа
core-lookup-catalogue-unreadable = ответ не удалось прочитать
core-lookup-not-a-catalogue = ответ был не от каталога
core-lookup-pubmed-book = у { $service } это книга или часть книги, а их оттуда пока читать нельзя
core-lookup-wrong-form = { $host } не даёт запись в запрошенной форме
core-lookup-not-a-record = { $service }: в ответе не было записи, которую можно прочитать.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Этот препринт с тех пор опубликован. Введённый DOI принадлежит опубликованной версии: найдите { $doi }, чтобы ссылаться на неё.
core-lookup-arxiv-published = Этот препринт с тех пор опубликован: { $journal }.
core-lookup-arxiv-year-only = Здесь указан только год. Поиск arXiv:{ $id } даст день, когда препринт был отправлен.
core-lookup-crossref-in-book = Поиск не даёт редакторов и ISBN книги. Поиск по DOI даёт.
core-lookup-book-unreadable = Не удалось прочитать то, что Crossref знает о книге: редакторы могут отсутствовать.
core-lookup-book-not-fetched = Не удалось получить то, что Crossref знает о книге: редакторы могут отсутствовать.
core-lookup-chapter-author = Crossref не называет автора главы. Автором главы записан автор книги.
core-lookup-group-name = «{ $name }» было дано как имя человека, «{ $family }, { $given }», и принято за название организации.
core-lookup-kind-none = Запись никак не называет вид публикации. Она внесена как «misc»: выберите верный тип.
core-lookup-kind = Запись называет вид публикации «{ $kind }». Она внесена как «misc»: выберите верный тип.
core-lookup-publisher-capitals = Издательство было набрано заглавными, «{ $publisher }», и записано как «{ $mended }».
core-lookup-no-creators = Запись не называет ни автора, ни редактора.
core-lookup-title-capitals = Название было набрано заглавными и переведено в строчные: проверьте, что имена начинаются с заглавной.
core-lookup-name-capitals = Фамилия «{ $family }» была набрана заглавными и записана как «{ $mended }».
core-lookup-pubmed-translated = PubMed переводит название на английский как «{ $title }».
core-lookup-pubmed-translation = Название — перевод PubMed на английский. Название на языке статьи не дано.
core-lookup-parallel-title = Запись даёт название и на другом языке, и оно не внесено: «{ $title }».
core-lookup-original-script = Название внесено так, как каталог пишет его латиницей. В собственном письме оно таково: «{ $title }».
core-lookup-unplaced-name = Запись называет { $name }, не говоря, в каком качестве. Имя не внесено.
core-lookup-thesis = Книга является также диссертацией: { $said }.
core-lookup-ebook = Запись об электронной книге: место, издательство и год — у электронного издания.
core-lookup-sound = Звукозапись.
core-lookup-audio-book = Запись об аудиокниге.
core-lookup-not-text = Запись не о тексте. Она внесена, как получилось: выберите верный тип.
core-lookup-other-form = Запрошенный ISBN принадлежит другой форме книги. ISBN того, что описывает эта запись, — { $isbn }.
core-lookup-other-isbn = У записи нет запрошенного ISBN. ISBN того, что она описывает, — { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = отсутствует
core-lookup-another-edition = Другое издание с тем же ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = издание { $edition }, { $year }
core-lookup-without-year = без года
