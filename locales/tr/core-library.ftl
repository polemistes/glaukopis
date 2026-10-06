# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } ve { $second }
core-library-three-names = { $first }, { $second } ve { $third }
core-library-et-al = { $first } vd.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (ed.)
   *[other] { $names } (ed.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = satır { $line }: { $message }
core-library-line-sentence = Satır { $line }: { $message }.
core-library-key-changed = “{ $from }” anahtarı “{ $to }” olarak değiştirildi
core-library-no-entry = Burada girdi yok. Bir girdi @ ve türüyle başlar, örneğin @book{"{"}anahtar, …{"}"}.
core-library-many-entries = Burada { $count } girdi var; bir tane bekleniyor.

## Changing a reference.

core-library-bad-key = “{ $key }” atıf anahtarı olarak kullanılamaz.
core-library-key-letters = Bir atıf anahtarında yalnızca harfler, rakamlar ve - _ : . bulunabilir. Şunu deneyin: “{ $key }”.
core-library-key-taken = “{ $key }” atıf anahtarı zaten kullanılıyor.
core-library-no-type = Kaynağın yayın türü yok.
core-library-not-a-type = “{ $kind }” bir yayın türü değil.
core-library-merge-itself = Bir girdi kendisiyle birleştirilemez.

## What was not found, shown after "not found: ".

core-library-the-reference = kaynak
core-library-the-stored-file = saklanan dosya { $path }
core-library-the-file = dosya { $path }
core-library-the-collection = koleksiyon
core-library-the-collection-to-put-in = konulacağı koleksiyon
core-library-the-collection-to-move-to = taşınacağı koleksiyon

## Collections.

core-library-collection-needs-name = Bir koleksiyonun adı olmalı.
core-library-collection-exists = Burada “{ $name }” adlı bir koleksiyon zaten var.
core-library-collection-in-itself = Bir koleksiyon kendi içine konamaz.

## The files of references.

core-library-not-in-library = “{ $path }” kitaplığın içinde bir yol değil
core-library-not-a-file = { $path } bir dosya değil
