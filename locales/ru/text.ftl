# A map as text: the elements one after another, each a heading and its text.

text-title = Заглавие
text-name = Название элемента
text-grip = Переместить или изменить этот элемент
text-split = Разделить здесь
text-join = Присоединить к элементу выше

## Folding away what is under an element, and its text

# What is folded away, in its place: whether the element's own text is (text is
# "yes" or "no"), how many elements under it, and how many words in all, which
# may be none.
text-folded = { $text ->
    [yes] { $parts ->
        [0] Его текст свёрнут
        [one] Свёрнуты его текст и { $parts } элемент
        [few] Свёрнуты его текст и { $parts } элемента
        [many] Свёрнуты его текст и { $parts } элементов
       *[other] Свёрнуты его текст и { $parts } элемента
    }
   *[no] { $parts ->
        [one] Свёрнут { $parts } элемент
        [few] Свёрнуты { $parts } элемента
        [many] Свёрнуто { $parts } элементов
       *[other] Свёрнуты { $parts } элемента
    }
}{ $words ->
    [0] {""}
    [one] , { $words } слово
    [few] , { $words } слова
    [many] , { $words } слов
   *[other] , { $words } слова
}

## Associations, in the margin

text-associations = Связи
text-outline = Структура
text-outline-between = Между структурой и текстом
text-go-to = Перейти к «{ $name }»
text-add-label = Добавить подпись…
text-change-label = Изменить подпись…
text-remove-association = Убрать связь
text-hint-linking = Щёлкните название элемента, с которым связать · { $esc } — выйти

## Under the text

text-notes = { $count ->
    [one] { $count } сноска
    [few] { $count } сноски
    [many] { $count } сносок
   *[other] { $count } сноски
}
# The keys are shown as keys, where the variables stand.
