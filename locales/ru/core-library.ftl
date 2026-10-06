# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } и { $second }
core-library-three-names = { $first }, { $second } и { $third }
core-library-et-al = { $first } и др.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (ред.)
    [few] { $names } (ред.)
    [many] { $names } (ред.)
   *[other] { $names } (ред.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = строка { $line }: { $message }
core-library-line-sentence = Строка { $line }: { $message }.
core-library-key-changed = ключ «{ $from }» изменён на «{ $to }»
core-library-no-entry = Здесь нет записи. Запись начинается с @ и типа, например @book{"{"}key, …{"}"}.
core-library-many-entries = { $count ->
    [one] Здесь { $count } запись, а ожидается одна.
    [few] Здесь { $count } записи, а ожидается одна.
    [many] Здесь { $count } записей, а ожидается одна.
   *[other] Здесь { $count } записи, а ожидается одна.
}

## Changing a reference.

core-library-bad-key = «{ $key }» не годится как ключ цитирования.
core-library-key-letters = В ключе цитирования могут быть только буквы, цифры и знаки - _ : . Попробуйте «{ $key }».
core-library-key-taken = Ключ цитирования «{ $key }» уже занят.
core-library-no-type = У источника нет типа публикации.
core-library-not-a-type = «{ $kind }» — не тип публикации.
core-library-merge-itself = Запись нельзя объединить с ней самой.

## What was not found, shown after "not found: ".

core-library-the-reference = источник
core-library-the-stored-file = сохранённый файл { $path }
core-library-the-file = файл { $path }
core-library-the-collection = коллекция
core-library-the-collection-to-put-in = коллекция, в которую положить
core-library-the-collection-to-move-to = коллекция, в которую перенести

## Collections.

core-library-collection-needs-name = Коллекции нужно название.
core-library-collection-exists = Коллекция с названием «{ $name }» здесь уже есть.
core-library-collection-in-itself = Коллекцию нельзя поместить внутрь неё самой.

## The files of references.

core-library-not-in-library = «{ $path }» — не путь внутри библиотеки
core-library-not-a-file = { $path } — не файл
