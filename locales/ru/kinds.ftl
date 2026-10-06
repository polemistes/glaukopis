# Kinds of elements: what the writer calls them (character, place, source…), each with a colour.

kinds-kind = Вид
kinds-title = Виды элементов
kinds-subtitle = Чем могут быть элементы этого проекта: столько видов, сколько нужно работе, каждый со своим цветом.
kinds-new = Новый вид
kinds-new-ellipsis = Новый вид…
kinds-change = Изменить вид
kinds-manage = Виды этого проекта…
kinds-none-of-them = Никакой
kinds-none = Видов пока нет. Вид — это название и цвет: персонаж, место, событие, источник, аргумент — что нужно работе.
kinds-name = Название
kinds-name-placeholder = Персонаж, место, событие…
kinds-name-taken = Вид с таким названием уже есть.
kinds-colour = Цвет
kinds-colour-teal = Бирюзовый
kinds-colour-amber = Янтарный
kinds-colour-violet = Фиолетовый
kinds-colour-rose = Розовый
kinds-colour-green = Зелёный
kinds-colour-blue = Синий
kinds-colour-rust = Ржавый
kinds-colour-olive = Оливковый
kinds-colour-slate = Грифельный
kinds-colour-plum = Сливовый
kinds-template = Текст для начала
kinds-template-placeholder = Внешность
    Желания
    Страхи
kinds-template-hint = Элемент без текста, которому дан этот вид, начинается с этих строк, по абзацу на каждую.
kinds-begins = Элемент этого вида пишется как
kinds-begins-hint = Текст начинается с абзаца этого вида там, где у элемента текста ещё нет
kinds-create = Создать
kinds-elements = { $count ->
    [one] { $count } элемент
    [few] { $count } элемента
    [many] { $count } элементов
   *[other] { $count } элемента
}
kinds-delete-title = Удалить вид «{ $name }»?
kinds-delete-message = { $count ->
    [0] Элементов этого вида нет.
    [one] { $count } элемент этого вида останется без вида.
    [few] { $count } элемента этого вида останутся без вида.
    [many] { $count } элементов этого вида останутся без вида.
   *[other] { $count } элемента этого вида останутся без вида.
}
