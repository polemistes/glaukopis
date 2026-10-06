# What the core says to the one who uses the application, in English.
# See locales/README.md.

## Errors, as they are shown after what was being done.

error-parse = 无法读取 { $path }：{ $message }
error-not-found = 找不到：{ $what }
error-network = 网络：{ $message }

## The programs the application works with: Pandoc, Typst, Tesseract.

program-missing = { $program } 没有安装，或者找不到
# A program that is there, but older than what Glaukopis needs.
program-too-old = 已安装 { $program } { $version }。Glaukopis 需要 { $program } { $least } 或更新的版本。
program-failed = { $program } 出错：{ $message }
# What a program that failed without a word is said to have done: the status is "exit status: 1".
program-ended = 它以 { $status } 结束
program-stopped = { $program } 已被停止。

## What was being done when the system said no, shown before what it said:
## "reading /home/…/library.bib: Permission denied".

io-reading = 读取 { $path }
io-writing = 写入 { $path }
io-creating = 创建 { $path }
io-creating-directory-in = 在 { $path } 中创建文件夹
io-creating-temporary-in = 在 { $path } 中创建临时文件
io-creating-temporary = 创建临时文件夹
io-opening = 打开 { $path }
io-removing = 删除 { $path }
io-copying = 复制 { $path }
io-flushing = 写回 { $path }
io-replacing = 替换 { $path }
io-backing-up = 备份 { $path }
io-storing = 保存 { $path }
io-no-directory = { $path } 没有所在的文件夹

## The network. Shown after "network: ".

network-timeout = { $host } 没有及时响应
network-host-not-found = 找不到 { $host }；网络连接正常吗？
network-unreachable = 无法连接 { $host }
network-unreachable-because = 无法连接 { $host }：{ $error }
network-nothing-there = { $host } 在该地址上什么也没有
network-wait = { $host } 要求稍等后再请求
network-status = { $host } 返回了错误（{ $status }）
# A way of asking, GET or POST, that the application does not use.
network-method = 这里不使用 { $method } 这种请求方式

## When the application is opened a second time.

core-in-use-title = Glaukopis 已经打开
core-in-use = Glaukopis 已经打开，正在 { $path } 中工作。同一处一次只能由一个 Glaukopis 工作，以免彼此覆盖对方写下的内容。请继续使用已打开的那个。
