# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Изображения
pictures-all = Все изображения
pictures-picture = Изображение
pictures-search-placeholder = Поиск изображений
pictures-clear-search = Очистить поиск
pictures-count = { $count ->
    [one] { $count } изображение
    [few] { $count } изображения
    [many] { $count } изображений
   *[other] { $count } изображения
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } из { $count ->
    [one] { $count } изображения
    [few] { $count } изображений
    [many] { $count } изображений
   *[other] { $count } изображения
}
pictures-add = Добавить изображения…
pictures-empty = Хранилище пусто
pictures-empty-text = Изображения, добавленные сюда, можно использовать во всех ваших проектах, а изображение, вставленное в текст, хранится здесь. Добавьте несколько или перетащите их в это окно.
pictures-nothing-found = Ничего не найдено
pictures-nothing-found-text = Ни одно изображение не содержит всех этих слов.
# What a picture that has no name is called.
pictures-unnamed = Изображение
pictures-with-notes = С заметками

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Добавить изображения
pictures-files = Изображения
pictures-taken-in = { $count ->
    [1] «{ $name }» в хранилище
    [one] { $count } изображение в хранилище
    [few] { $count } изображения в хранилище
    [many] { $count } изображений в хранилище
   *[other] { $count } изображения в хранилище
}
pictures-remove-title = Убрать «{ $name }» из хранилища?
pictures-remove-unused = Ни один проект не использует изображение. Сказанное о нём здесь и ваши заметки о нём удаляются вместе с ним.
pictures-remove-used = { $count ->
    [one] { $count } проект использует изображение. Его рисунки останутся без изображения. Сказанное о нём здесь и ваши заметки о нём удаляются вместе с ним.
    [few] { $count } проекта используют изображение. Их рисунки останутся без изображения. Сказанное о нём здесь и ваши заметки о нём удаляются вместе с ним.
    [many] { $count } проектов используют изображение. Их рисунки останутся без изображения. Сказанное о нём здесь и ваши заметки о нём удаляются вместе с ним.
   *[other] { $count } проекта используют изображение. Их рисунки останутся без изображения. Сказанное о нём здесь и ваши заметки о нём удаляются вместе с ним.
}
pictures-no-backend = Ядро приложения недоступно.

## One picture

pictures-name = Название
pictures-name-placeholder = Как называется изображение
pictures-caption = Подпись
pictures-caption-placeholder = Что сказано об изображении
pictures-caption-hint = Рисунки с этим изображением начинаются с этих слов. Сказанное о рисунке можно изменить там, не меняя этого.
pictures-italic = Курсив
pictures-small-caps = Капитель
# What the picture shows, in words, for those who do not see it.
pictures-alt = Показывает
pictures-alt-placeholder = Словами, для тех, кто не может его увидеть
pictures-absent = Изображения нет на этом компьютере. Оно используется в проекте и будет показано, когда придёт от того, кто его поместил.
pictures-notes = Заметки
pictures-note-project = В этом проекте
pictures-note-project-placeholder = Что вы об этом думаете, для этой работы
pictures-note-project-hint = Написанное здесь есть у всех, у кого есть проект.
pictures-note-for-all = Хранить для всех проектов
pictures-note-write-for-all = Написать для всех проектов
pictures-note-all = Во всех проектах
pictures-note-all-placeholder = Что вы об этом думаете, где бы вы его ни использовали
pictures-note-all-hint = Хранится с изображением в хранилище, на этом компьютере.
pictures-note-placeholder = Что вы об этом думаете. Для себя: это не входит ни в один документ.
pictures-note-label = Ваши заметки об этом изображении
pictures-file = Файл
pictures-kind = Вид
pictures-kind-svg = SVG, векторная графика
pictures-dimensions-label = Ширина и высота
pictures-dimensions = { $width } × { $height } точек
pictures-size = Размер
# When the picture was taken into the store.
pictures-added = Добавлено
pictures-used-in = Используется в
pictures-this-project = Этот проект
# A map that has no name.
pictures-untitled = Без названия
pictures-unused = Ни один проект не использует изображение.
pictures-remove = Убрать из хранилища
