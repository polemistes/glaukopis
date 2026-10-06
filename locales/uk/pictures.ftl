# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Зображення
pictures-all = Усі зображення
pictures-picture = Зображення
pictures-search-placeholder = Шукати серед зображень
pictures-clear-search = Очистити пошук
pictures-count = { $count ->
    [one] { $count } зображення
    [few] { $count } зображення
    [many] { $count } зображень
   *[other] { $count } зображення
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } з { $count ->
    [one] { $count } зображення
    [few] { $count } зображень
    [many] { $count } зображень
   *[other] { $count } зображення
}
pictures-add = Додати зображення…
pictures-empty = Сховище порожнє
pictures-empty-text = Зображення, які ви додаєте сюди, можна вживати в усіх ваших проєктах, а зображення, вставлене в текст, зберігається тут. Додайте якісь або перетягніть їх у це вікно.
pictures-nothing-found = Нічого не знайдено
pictures-nothing-found-text = Жодне зображення не містить усіх цих слів.
# What a picture that has no name is called.
pictures-unnamed = Зображення
pictures-with-notes = З нотатками

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Додати зображення
pictures-files = Зображення
pictures-taken-in = { $count ->
    [1] «{ $name }» у сховищі
    [one] { $count } зображення у сховищі
    [few] { $count } зображення у сховищі
    [many] { $count } зображень у сховищі
   *[other] { $count } зображення у сховищі
}
pictures-remove-title = Вилучити «{ $name }» зі сховища?
pictures-remove-unused = Жоден проєкт не вживає цього зображення. Сказане про нього тут і ваші нотатки про нього вилучаються разом із ним.
pictures-remove-used = { $count ->
    [one] { $count } проєкт уживає це зображення. Його рисунки залишаться без зображення. Сказане про нього тут і ваші нотатки про нього вилучаються разом із ним.
    [few] { $count } проєкти вживають це зображення. Їхні рисунки залишаться без зображення. Сказане про нього тут і ваші нотатки про нього вилучаються разом із ним.
    [many] { $count } проєктів уживають це зображення. Їхні рисунки залишаться без зображення. Сказане про нього тут і ваші нотатки про нього вилучаються разом із ним.
   *[other] { $count } проєкту вживають це зображення. Їхні рисунки залишаться без зображення. Сказане про нього тут і ваші нотатки про нього вилучаються разом із ним.
}
pictures-no-backend = Немає ядра програми.

## One picture

pictures-name = Назва
pictures-name-placeholder = Як називається зображення
pictures-caption = Підпис
pictures-caption-placeholder = Що сказано про зображення
pictures-caption-hint = Рисунки, зроблені із цим зображенням, починаються з цих слів. Сказане про рисунок можна змінити там, не змінюючи цього.
pictures-italic = Курсив
pictures-small-caps = Капітель
# What the picture shows, in words, for those who do not see it.
pictures-alt = Показує
pictures-alt-placeholder = Словами, для тих, хто не може його бачити
pictures-absent = Зображення немає на цьому компʼютері. Воно вживається в проєкті й зʼявиться, коли надійде від того, хто його поставив.
pictures-notes = Нотатки
pictures-note-project = У цьому проєкті
pictures-note-project-placeholder = Що ви про нього думаєте, для цієї праці
pictures-note-project-hint = Написане тут бачать усі, хто має проєкт.
pictures-note-for-all = Зберегти для всіх проєктів
pictures-note-write-for-all = Писати для всіх проєктів
pictures-note-all = В усіх проєктах
pictures-note-all-placeholder = Що ви про нього думаєте, де б ви його не вживали
pictures-note-all-hint = Зберігається із зображенням у сховищі, на цьому компʼютері.
pictures-note-placeholder = Що ви про нього думаєте. Для себе: це не частина жодного документа.
pictures-note-label = Ваші нотатки про це зображення
pictures-file = Файл
pictures-kind = Вид
pictures-kind-svg = SVG, креслення
pictures-dimensions-label = Ширина й висота
pictures-dimensions = { $width } × { $height } точок
pictures-size = Розмір
# When the picture was taken into the store.
pictures-added = Додано
pictures-used-in = Уживається в
pictures-this-project = Цей проєкт
# A map that has no name.
pictures-untitled = Без назви
pictures-unused = Жоден проєкт не вживає цього зображення.
pictures-remove = Вилучити зі сховища
