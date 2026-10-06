# Kinds of elements: what the writer calls them (character, place, source…), each with a colour.

kinds-kind = Вид
kinds-title = Види елементів
kinds-subtitle = Чим можуть бути елементи цього проєкту: стільки видів, скільки потребує робота, кожен зі своїм кольором.
kinds-new = Новий вид
kinds-new-ellipsis = Новий вид…
kinds-change = Змінити вид
kinds-manage = Види цього проєкту…
kinds-none-of-them = Жодного
kinds-none = Видів ще немає. Вид — це назва й колір: персонаж, місце, подія, джерело, аргумент — що лише потребує робота.
kinds-name = Назва
kinds-name-placeholder = Персонаж, місце, подія…
kinds-name-taken = Вид із такою назвою вже є.
kinds-colour = Колір
kinds-colour-teal = Бірюзовий
kinds-colour-amber = Бурштиновий
kinds-colour-violet = Фіолетовий
kinds-colour-rose = Рожевий
kinds-colour-green = Зелений
kinds-colour-blue = Синій
kinds-colour-rust = Іржавий
kinds-colour-olive = Оливковий
kinds-colour-slate = Сизий
kinds-colour-plum = Сливовий
kinds-template = Текст для початку
kinds-template-placeholder = Зовнішність
    Прагне
    Боїться
kinds-template-hint = Елемент без тексту, якому дано цей вид, починається з цих рядків, кожен окремим абзацом.
kinds-begins = Елемент цього виду пише в
kinds-begins-hint = Текст починається з абзацу цього виду там, де елемент ще не має тексту
kinds-create = Створити
kinds-elements = { $count ->
    [one] { $count } елемент
    [few] { $count } елементи
    [many] { $count } елементів
   *[other] { $count } елемента
}
kinds-delete-title = Видалити вид «{ $name }»?
kinds-delete-message = { $count ->
    [0] Жодного елемента цього виду немає.
    [one] { $count } елемент цього виду буде без виду.
    [few] { $count } елементи цього виду будуть без виду.
    [many] { $count } елементів цього виду будуть без виду.
   *[other] { $count } елемента цього виду будуть без виду.
}
