# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } і { $second }
core-library-three-names = { $first }, { $second } і { $third }
core-library-et-al = { $first } та ін.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (ред.)
    [few] { $names } (ред.)
    [many] { $names } (ред.)
   *[other] { $names } (ред.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = рядок { $line }: { $message }
core-library-line-sentence = Рядок { $line }: { $message }.
core-library-key-changed = ключ «{ $from }» змінено на «{ $to }»
core-library-no-entry = Тут немає запису. Запис починається з @ і свого типу, як-от @book{"{"}ключ, …{"}"}.
core-library-many-entries = { $count ->
    [one] Тут { $count } запис; очікується один.
    [few] Тут { $count } записи; очікується один.
    [many] Тут { $count } записів; очікується один.
   *[other] Тут { $count } запису; очікується один.
}

## Changing a reference.

core-library-bad-key = «{ $key }» не може бути ключем цитування.
core-library-key-letters = Ключ цитування може містити лише літери, цифри та - _ : . Спробуйте «{ $key }».
core-library-key-taken = Ключ цитування «{ $key }» уже використовується.
core-library-no-type = Джерело не має типу публікації.
core-library-not-a-type = «{ $kind }» — не тип публікації.
core-library-merge-itself = Запис не можна обʼєднати із самим собою.

## What was not found, shown after "not found: ".

core-library-the-reference = джерело
core-library-the-stored-file = збережений файл { $path }
core-library-the-file = файл { $path }
core-library-the-collection = колекція
core-library-the-collection-to-put-in = колекція, куди його покласти
core-library-the-collection-to-move-to = колекція, куди його перемістити

## Collections.

core-library-collection-needs-name = Колекції потрібна назва.
core-library-collection-exists = Тут уже є колекція з назвою «{ $name }».
core-library-collection-in-itself = Колекцію не можна вкласти в саму себе.

## The files of references.

core-library-not-in-library = «{ $path }» — не шлях усередині бібліотеки
core-library-not-a-file = { $path } — не файл
