# The settings.

settings-title = Настройки
settings-error-system = Не удалось прочитать кое-что о приложении
settings-error-read = Не удалось прочитать настройки
settings-error-save = Не удалось сохранить настройки

## Appearance

settings-appearance = Внешний вид
settings-theme = Цвета
settings-theme-system = Как в системе
settings-theme-light = Светлая
settings-theme-dark = Тёмная
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Мягкая
settings-theme-own = Своя
settings-own = Свои цвета
settings-own-hint = Четыре цвета, из которых следуют остальные: бумага, чернила, акцент, которым отмечается выбранное и нажатое, и второй голос, которым отмечаются связи и комментарии. Светлая схема или тёмная — следует из бумаги.
settings-own-paper = Бумага
settings-own-ink = Чернила
settings-own-accent = Акцент
settings-own-gold = Второй голос
settings-own-begin = Начать с
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Трудно читать: контраст чернил на бумаге { $ink } к 1, акцента — { $accent } к 1; хорошо читаются 4,5 и 3 или больше.
settings-text-size = Размер вашего текста
settings-text-size-hint = В картах и в режиме текста. Экспортируемое следует формату документа.
settings-interface-size = Размер интерфейса
settings-interface-size-hint = Всё в окне, включая написанное. Для одного вашего текста — размер ниже.
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
settings-sample = Гнев, богиня, воспой Ахиллеса, Пелеева сына

## New documents

settings-new-documents = Новые документы
settings-new-documents-hint = С чего начинается карта. Каждой карте можно задать другое в предпросмотре.
settings-reference-style = Стиль цитирования
settings-document-format = Формат документа

## You

settings-you = Вы
settings-name = Имя
settings-name-hint = Показывается тем, с кем вы делитесь проектами. Больше нигде не используется.
settings-contact = Адрес для библиографических служб
settings-contact-hint = Службы вроде Crossref охотнее отвечают тем, кто говорит, как с ним связаться. Если ввести адрес, он отправляется им с каждым поиском — и больше никому. Оставьте пустым, чтобы не отправлять.
settings-contact-problem = Это не похоже на адрес.

## Programs: Pandoc and Typst

settings-programs = Программы
settings-programs-about = Glaukopis создаёт документы с помощью Pandoc, который находится сам, если установлен обычным образом. Страницы предпросмотра и PDF набирает Typst, который входит в Glaukopis.
settings-pandoc-need = Нужен для предпросмотра и для любого экспорта.
settings-looking = Поиск…
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = Не найден. { $need } Установите его менеджером пакетов вашей системы или укажите ниже, где он.
settings-program-old = Старее, чем нужно Glaukopis: нужен { $least } или новее.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Где { $program }
settings-program-found-by-itself = Найден сам
settings-no-latex = LaTeX не найден. Он не нужен: исходный текст LaTeX экспортируется и без него, а PDF создаётся с помощью Typst.
settings-look-again = Поискать снова
settings-error-programs = Не удалось поискать программы

## About

settings-about = О программе
settings-licence = Свободная программа под лицензией GNU General Public License версии 3 или новее. Поставляется без гарантий.
settings-owl = Сову нарисовал Роберт Эмиль Берге по фотографии афинской тетрадрахмы, сделанной Classical Numismatic Group, Inc. (http://www.cngcoins.com). Рисунок распространяется под лицензией Creative Commons Attribution-Share Alike 3.0 Unported.
settings-data = Где всё хранится
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Ваши источники — в { $file }, который может прочитать любая программа для BibLaTeX. Чтобы сохранить копию своей работы, скопируйте эту папку.
settings-lookup = Где ищутся источники
settings-lookup-about = DOI — на doi.org, в Crossref и DataCite; книги — в каталогах K10plus, норвежских академических библиотек, Немецкой национальной библиотеки и Библиотеки Конгресса; препринты — в arXiv; медицинская литература — в PubMed. Им отправляется только то, что вы вводите в поиск.

## Language

settings-language = Язык
settings-language-interface = Интерфейс
settings-language-interface-hint = Слова приложения. Ваши тексты — на языке их карт.
settings-language-system = Как в системе ({ $language })
settings-language-texts = Язык новых текстов
settings-language-texts-hint = На каком языке пишется новая карта; от этого зависят слова, которые печатает её документ, и словарь, по которому проверяется орфография. Каждой карте можно задать другой под «Языки…» в её меню, а проекту — свой язык для его новых карт.
