# テンプレート：ある種類の文書が何から成るか（ADR 0038）。そのグループ、
# 文書を作る部分、ファイルの種類、テンプレートのエディター。

## テンプレートのグループ。選択画面に並ぶとおり。

template-group-own = 独自のテンプレート
template-group-plain = 基本
template-group-article = 論文とレポート
template-group-book = 書籍と学位論文
template-group-fiction = 小説
template-group-stage = 舞台・映像
template-group-poetry = 詩
template-group-other = その他のテキスト
template-group-journal = 学術誌
template-group-publisher = 出版社
template-group-style-guide = スタイルガイド

## 要素の種類が文書のどこに置かれるか。


## アプリケーションが自動で作る文書の部分。

template-generated-half-title = 前扉
template-generated-title-page = タイトルページ
template-generated-keywords = キーワード
template-generated-contents = 目次
template-generated-list-of-figures = 図一覧
template-generated-list-of-tables = 表一覧
template-generated-body = 本文
template-generated-notes = 注
template-generated-bibliography = 参考文献

## テンプレートが作るファイルの種類。

template-target-pdf = PDF
template-target-pdf-latex = PDF（LaTeXで組版）
template-target-docx = Word
template-target-odt = LibreOffice Writer
template-target-latex = LaTeX
template-target-typst = Typst
template-target-markdown = Markdown
template-target-html = ウェブページ
template-target-epub = 電子書籍

## テンプレートのエディター。

template-editor = テンプレート
template-name = テンプレートの名前
# 独自のテンプレートに最初に付く名前。もとにしたテンプレートの名前から作る。
template-name-changed = { $name }（変更）
# ほかのテンプレートから作った書き手の独自のテンプレート。名前を付ける前は、もとの名前で。
template-name-own = { $name }（独自）
template-sections = テンプレートの各部
template-bundled = Glaukopisに付属のテンプレートは変わりません。変更は独自のテンプレートとして保存されます。
template-delete = このテンプレートを削除
template-save-own = 独自のテンプレートとして保存
template-saved = 「{ $name }」を独自のテンプレートに保存しました
template-read-failed = テンプレートを読み込めませんでした。
template-save-failed = テンプレートを保存できませんでした。
template-delete-failed = テンプレートを削除できませんでした。
template-keep-failed = テンプレートをプロジェクトに保存できませんでした。ほかのコンピューターやプロジェクトのファイルでは、文書は代わりに既定のテンプレートを使います。
template-delete-title = テンプレート「{ $name }」を削除しますか？
template-delete-message = このテンプレートを使っている要素は、代わりにもとにしたテンプレートを使います。
template-delete-confirm = テンプレートを削除
template-leave-title = 保存せずに閉じますか？
template-leave-message = テンプレートに加えた変更は失われます。
template-leave-confirm = 閉じる
template-leave-cancel = 編集を続ける

## エディターの各部。左で選ぶ。

template-section-about = このテンプレートについて
template-section-looks = レイアウトと引用スタイル
template-section-contents = 構成
template-section-kinds = 要素の種類
template-section-passage-kinds = 段落と語句の種類
template-section-requirements = 要件
template-section-outputs = ファイル

## テンプレートについて。

template-description = 説明
template-group = グループ
template-based-on = もとにするもの
template-based-on-none = 特になし
template-source-changed = このテンプレートは変更されています。出典が述べているのは、もとにしたテンプレートのことです。
template-source-none = このテンプレートは、特定の出版社の要件には従っていません。

## テンプレートがもたらすレイアウトと引用スタイル。

template-layout = レイアウト
template-layout-hint = このテンプレートのすべての文書で、ページがどう見えるか
template-style = 引用スタイル
template-style-hint = 引用と参考文献の書き方。空のときはレイアウト自身のものを使う
# 書き手が設定で選んだレイアウトやスタイル。
template-usual = 既定（設定で選んだもの）

## 構成：文書の順序。

template-contents-hint = 文書の順序です。アプリケーションが自動で作る部分と、ある種類のすべての要素を、ツリーの順に並べます。本文より前にある種類は前付け、後にある種類は後付けになります。
# 構成の項目のうち、ある種類のすべての要素を置くもの。
template-contents-kind = すべての{ $name }
template-contents-add-part = 部分…
template-contents-add-kind = 要素の種類…
template-contents-up = 上へ
template-contents-down = 下へ

## 手元に出す種類。

template-kinds-hint = テンプレートが手元に出す要素の種類です。種類のメニューに出ます。構成にある種類は、ここで選ばなくても手元に出ます。
template-kinds-in-contents = 構成にある
template-passage-kinds-hint = テンプレートが手元に出す段落と語句の種類です。執筆ツールの最初に出ます。

## 要件。

template-requirements-hint = このテンプレートの文書が満たすべきことです。チェックリストとプレビューはこれに照らして数えます。何も削られません。
template-requirement-words = 本文の語数
template-requirement-abstract-words = 要旨の語数
template-requirement-keywords = キーワードの数
template-requirement-note = 上限の数え方
template-requirement-note-placeholder = 注は含む、参考文献は含まない
# 数が 0 のとき、単位の位置に出る。
template-no-limit = 上限なし

## テンプレートが作るファイル。

template-outputs-hint = 文書を書き出すときに選べるファイル形式です。
template-output-document = 文書
template-output-cover = 表紙
template-output-cover-note = 独自の表紙は今後のバージョンで作れるようになります。テンプレートが表紙について定めていることは、そのまま保たれます。

## Glaukopisに付属のテキストの種類の名前。何を書くかの選択画面とプレビューの上の
## ボタンに出る。学術誌、出版社、スタイルガイドは自分の名前のまま。

template-called-plain = シンプルな文書
template-called-paper = 小論文
template-called-article = 学術誌論文
template-called-report = 報告書
template-called-book = 学術書
template-called-thesis = 学位論文
template-called-novel = 長編小説
template-called-novel-manuscript = 小説の原稿
template-called-short-story = 短編小説
template-called-story-collection = 短編集
template-called-poems = 詩集
template-called-play = 戯曲
template-called-screenplay = 脚本
template-called-letter = 手紙
template-called-blog-post = ブログ記事
template-called-news-article = ニュース記事

## 言葉を減らす、第3段階：匿名の要件。見た目と文書種別のエディターで。

template-requirement-anonymity = 匿名

## 設定、ズーム、種類のキー、第4段階：Ctrl+Alt と数字で選べる種類。
template-kind-keys = キー
