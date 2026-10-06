# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } 和 { $second }
core-library-three-names = { $first }、{ $second } 和 { $third }
core-library-et-al = { $first } 等
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
   *[other] { $names }（编）
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = 第 { $line } 行：{ $message }
core-library-line-sentence = 第 { $line } 行：{ $message }。
core-library-key-changed = 键“{ $from }”已改为“{ $to }”
core-library-no-entry = 这里没有条目。条目以 @ 加类型开头，例如 @book{"{"}key, …{"}"}。
core-library-many-entries = 这里有 { $count } 个条目；应当只有一个。

## Changing a reference.

core-library-bad-key = “{ $key }”不能用作引用键。
core-library-key-letters = 引用键只能包含字母、数字和 - _ : .。试试“{ $key }”。
core-library-key-taken = 引用键“{ $key }”已被使用。
core-library-no-type = 此文献没有出版类型。
core-library-not-a-type = “{ $kind }”不是出版类型。
core-library-merge-itself = 条目不能与自身合并。

## What was not found, shown after "not found: ".

core-library-the-reference = 文献
core-library-the-stored-file = 保存的文件 { $path }
core-library-the-file = 文件 { $path }
core-library-the-collection = 分类
core-library-the-collection-to-put-in = 要放入的分类
core-library-the-collection-to-move-to = 要移入的分类

## Collections.

core-library-collection-needs-name = 分类需要一个名称。
core-library-collection-exists = 这里已有一个名为“{ $name }”的分类。
core-library-collection-in-itself = 分类不能放在它自身之中。

## The files of references.

core-library-not-in-library = “{ $path }”不是文献库内的路径
core-library-not-a-file = { $path } 不是文件
