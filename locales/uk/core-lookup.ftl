# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = «{ $doi }» — не DOI.
core-lookup-not-arxiv = «{ $id }» — не ідентифікатор arXiv.
core-lookup-not-pubmed = «{ $id }» — не номер PubMed.
core-lookup-isbn-length = «{ $isbn }» — не ISBN: ISBN має 10 або 13 цифр, а тут їх { $count }.
core-lookup-isbn-check = «{ $isbn }» — не ISBN: його остання цифра обчислюється з решти і не узгоджується з ними. Чи немає помилки в якійсь цифрі?
core-lookup-not-isbn = «{ $isbn }» — не ISBN.
core-lookup-address = За адресою можна знайти відомості, коли вона містить DOI, ідентифікатор arXiv або номер PubMed. Ця не містить: пошукайте натомість назву.
core-lookup-nothing = Нема чого шукати.

## The services, and what they ask to have said of them.

core-lookup-sikt = Норвезькі академічні бібліотеки (Sikt)
core-lookup-thanks-arxiv = Дякуємо arXiv за можливість користуватися його відкритим інтерфейсом.
core-lookup-thanks-sikt = Містить записи з бібліотечного каталогу Sikt, надані за Норвезькою ліцензією на відкриті державні дані (NLOD).
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref, щодо книжки

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } відповів чимось, чого не вдалося прочитати
core-lookup-not-preprints = { $service } відповів чимось, що не є списком препринтів
core-lookup-not-articles = { $service } відповів чимось, що не є списком статей
core-lookup-could-not-answer = { $service } не зміг відповісти на запит: { $said }
core-lookup-catalogue-could-not-answer = каталог не зміг відповісти на запит: { $said }
core-lookup-no-reason = причини не названо
core-lookup-catalogue-unreadable = відповідь не вдалося прочитати
core-lookup-not-a-catalogue = відповідь не була відповіддю каталогу
core-lookup-pubmed-book = { $service } має це як книжку або її частину, а таке звідти поки що не читається
core-lookup-wrong-form = { $host } не дає запису в тій формі, якої просили
core-lookup-not-a-record = { $service }: відповідь не була записом, який можна прочитати.

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = Цей препринт відтоді опубліковано. Введений DOI належить опублікованій версії: знайдіть { $doi }, щоб цитувати її.
core-lookup-arxiv-published = Цей препринт відтоді опубліковано: { $journal }.
core-lookup-arxiv-year-only = Тут подано лише рік. Пошук arXiv:{ $id } дає день, коли препринт надіслано.
core-lookup-crossref-in-book = Пошук не дає редакторів та ISBN книжки. Пошук за DOI дає.
core-lookup-book-unreadable = Те, що Crossref має про книжку, не вдалося прочитати: може бракувати її редакторів.
core-lookup-book-not-fetched = Те, що Crossref має про книжку, не вдалося отримати: може бракувати її редакторів.
core-lookup-chapter-author = Crossref не називає автора розділу. Автором записано автора книжки.
core-lookup-group-name = «{ $name }» було подано як імʼя особи, «{ $family }, { $given }», і взято як назву організації.
core-lookup-kind-none = Запис ніяк не називає виду публікації. Його записано як «misc»: виберіть правильний тип.
core-lookup-kind = Запис називає вид публікації «{ $kind }». Його записано як «misc»: виберіть правильний тип.
core-lookup-publisher-capitals = Видавця було подано великими літерами, «{ $publisher }», і записано як «{ $mended }».
core-lookup-no-creators = Запис не називає ні автора, ні редактора.
core-lookup-title-capitals = Назву було подано великими літерами, і її переведено в малі: перевірте, чи імена мають великі літери.
core-lookup-name-capitals = Прізвище «{ $family }» було подано великими літерами, і його записано як «{ $mended }».
core-lookup-pubmed-translated = PubMed перекладає назву англійською як «{ $title }».
core-lookup-pubmed-translation = Назва — переклад PubMed англійською. Назви мовою статті не подано.
core-lookup-parallel-title = Запис подає назву й іншою мовою, яку не внесено: «{ $title }».
core-lookup-original-script = Назву записано так, як каталог пише її латиницею. Її власним письмом вона така: «{ $title }».
core-lookup-unplaced-name = Запис називає { $name }, не кажучи, ким. Імʼя не внесено.
core-lookup-thesis = Книжка є також дисертацією: { $said }.
core-lookup-ebook = Запис електронної книжки: місце, видавець і рік — електронного видання.
core-lookup-sound = Звукозапис.
core-lookup-audio-book = Запис аудіокнижки.
core-lookup-not-text = Запис не про текст. Його внесено, як вдалося: виберіть правильний тип.
core-lookup-other-form = Запитаний ISBN належить іншій формі книжки. ISBN того, що описує цей запис, — { $isbn }.
core-lookup-other-isbn = Запис не має запитаного ISBN. ISBN того, що він описує, — { $isbn }.
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = відсутній
core-lookup-another-edition = Інше видання з тим самим ISBN ({ $which }).
# Which edition, in the brackets of the message above.
core-lookup-edition-year = видання { $edition }, { $year }
core-lookup-without-year = без року
