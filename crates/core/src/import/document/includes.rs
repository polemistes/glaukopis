//! What a document takes in from other files: what LaTeX inputs, what
//! reStructuredText, Org and AsciiDoc include, and what Typst includes,
//! imports and reads.
//!
//! A document brought in reads only the files in its own folder and below.
//! Pandoc is kept from reading anything but the file it is given
//! (`--sandbox`), since a document received from someone else may name any
//! file on this computer (`\input{/home/me/.ssh/id_rsa}`), whose text would
//! then stand in the project and go to those it is shared with. What the
//! document takes in from its own folder is read here instead and set in its
//! place, in a copy that Pandoc reads; what it names outside the folder, on
//! the network, or not there at all, is left out and named in the remarks.
//! What is not seen here (a name made by a macro, say) Pandoc cannot follow
//! either: it says that it could not load the file, or refuses the document.
//!
//! The names are worked out as Pandoc works them out, which is checked
//! against Pandoc itself: LaTeX names its parts from the folder of the
//! document, the others from the folder of the file that names them, and
//! Typst's names that begin with a slash from the document's folder.

use std::path::Component;

use super::*;

/// How many files deep one that takes in another is followed.
const DEEPEST: usize = 16;

/// The environments of LaTeX whose text is not read as LaTeX.
const VERBATIM: [&str; 8] =
    ["verbatim", "verbatim*", "Verbatim", "BVerbatim", "lstlisting", "minted", "comment", "spverbatim"];

/// What came of looking at what a document takes in.
#[derive(Debug, Default)]
pub(super) struct Taken {
    /// The copy for Pandoc, with what was taken in set in its place, when
    /// the document takes in anything.
    pub copy: Option<PathBuf>,
    /// What was left out, and why.
    pub remarks: Vec<String>,
}

/// Where a file that a document names is.
#[derive(Debug, PartialEq)]
pub(super) enum Place {
    /// In the document's folder or below, as it is on the disk.
    Within(PathBuf),
    Outside,
    Missing,
}

/// The folder of a document, by which what it names is judged.
pub(super) struct Folder {
    /// As it was named: what a file that is not there is judged by.
    named: PathBuf,
    /// As it is on the disk, links followed.
    real: Option<PathBuf>,
}

impl Folder {
    pub(super) fn new(folder: &Path) -> Folder {
        Folder { named: lexical(folder), real: folder.canonicalize().ok() }
    }

    /// Where a file is, by its absolute path: within the folder only when
    /// it is there and its real place, links followed, is in the folder's.
    /// One that is not there is outside when its name leads out.
    pub(super) fn place(&self, path: &Path) -> Place {
        if path.is_file() {
            return match (path.canonicalize(), &self.real) {
                (Ok(real), Some(folder)) if real.starts_with(folder) => Place::Within(real),
                _ => Place::Outside,
            };
        }
        if lexical(path).starts_with(&self.named) { Place::Missing } else { Place::Outside }
    }
}

/// A path with `.` and `..` worked out by its words alone.
fn lexical(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for part in path.components() {
        match part {
            Component::CurDir => {}
            Component::ParentDir => {
                out.pop();
            }
            other => out.push(other),
        }
    }
    out
}

/// Whether a name is an address on the network.
pub(super) fn on_network(named: &str) -> bool {
    let lower = named.trim().to_ascii_lowercase();
    ["http://", "https://", "ftp://", "//"].iter().any(|start| lower.starts_with(start))
}

/// Looks at what the document at `path` takes in, and when it takes in
/// anything, writes the copy for Pandoc under `work`.
pub(super) fn take_in(path: &Path, format: Format, work: &Path) -> Result<Taken> {
    if !matches!(format, Format::Latex | Format::Rst | Format::Org | Format::AsciiDoc | Format::Typst) {
        return Ok(Taken::default());
    }
    let bytes = fs::read(path).context(|| tr!("io-reading", path = path))?;
    // What is not UTF-8 Pandoc does not read either, and says so.
    let Ok(text) = String::from_utf8(bytes) else { return Ok(Taken::default()) };
    let root = path.parent().map(Path::to_owned).unwrap_or_default();
    let mut reader = Reader {
        folder: Folder::new(&root),
        root: root.clone(),
        remarks: Vec::new(),
        total: text.len() as u64,
        within: path.canonicalize().into_iter().collect(),
        changed: false,
    };
    let text = reader.text(format, &text, &root);
    let mut taken = Taken { copy: None, remarks: reader.remarks };
    if reader.changed {
        let dir = work.join("included");
        fs::create_dir_all(&dir).context(|| tr!("io-creating", path = &dir))?;
        let copy = dir.join(path.file_name().unwrap_or_default());
        fs::write(&copy, text).context(|| tr!("io-writing", path = &copy))?;
        taken.copy = Some(copy);
    }
    Ok(taken)
}

struct Reader {
    folder: Folder,
    /// The document's folder, as it was named.
    root: PathBuf,
    remarks: Vec<String>,
    /// How much has been read, the document with what it takes in.
    total: u64,
    /// The files that are being read, the document first.
    within: Vec<PathBuf>,
    /// Whether the document takes in anything, or names anything that was left out.
    changed: bool,
}

impl Reader {
    fn text(&mut self, format: Format, text: &str, here: &Path) -> String {
        match format {
            Format::Latex => self.latex(text, here),
            Format::Rst => self.rst(text, here),
            Format::Org => self.org(text, here),
            Format::AsciiDoc => self.asciidoc(text, here),
            Format::Typst => self.typst(text, here),
            _ => text.to_owned(),
        }
    }

    /// The first of the paths a name may mean that is in the folder; else
    /// whether one of them leads out.
    fn locate(&self, candidates: &[PathBuf]) -> Place {
        let mut place = Place::Missing;
        for candidate in candidates {
            match self.folder.place(candidate) {
                Place::Within(found) => return Place::Within(found),
                Place::Outside => place = Place::Outside,
                Place::Missing => {}
            }
        }
        place
    }

    /// The paths a name may mean, from the folder of the file that names
    /// it (or the document's, for LaTeX), with the endings to try.
    fn candidates(&self, named: &str, bases: &[&Path], endings: &[&str]) -> Vec<PathBuf> {
        let path = Path::new(named);
        let mut out = Vec::new();
        let bases: Vec<&Path> = if path.is_absolute() { vec![Path::new("")] } else { bases.to_vec() };
        for base in bases {
            for ending in endings {
                let file = base.join(format!("{named}{ending}"));
                if !out.contains(&file) {
                    out.push(file);
                }
            }
        }
        out
    }

    /// What a file that the document names holds, as text, when it may be
    /// read; else nothing, and a remark that says why it was left out.
    fn take(&mut self, named: &str, candidates: &[PathBuf]) -> Option<(PathBuf, String)> {
        self.changed = true;
        let named = named.trim();
        if on_network(named) {
            self.remarks.push(tr!("core-import-document-include-network", name = named));
            return None;
        }
        let found = match self.locate(candidates) {
            Place::Within(found) => found,
            Place::Outside => {
                tracing::warn!(name = named, "a document names a file outside its folder, which was left out");
                self.remarks.push(tr!("core-import-document-include-outside", name = named));
                return None;
            }
            Place::Missing => {
                self.remarks.push(tr!("core-import-document-include-not-found", name = named));
                return None;
            }
        };
        if self.within.contains(&found) {
            self.remarks.push(tr!("core-import-document-include-circle", name = named));
            return None;
        }
        if self.within.len() > DEEPEST {
            self.remarks.push(tr!("core-import-document-include-too-deep", name = named, count = DEEPEST));
            return None;
        }
        let size = fs::metadata(&found).map(|m| m.len()).unwrap_or(0);
        if self.total + size > MAX_BYTES {
            self.remarks.push(tr!("core-import-document-include-too-large", name = named));
            return None;
        }
        let text = fs::read(&found).ok().and_then(|bytes| String::from_utf8(bytes).ok());
        let Some(text) = text else {
            self.remarks.push(tr!("core-import-document-include-unreadable", name = named));
            return None;
        };
        self.total += size;
        let text = text.strip_prefix('\u{feff}').map(str::to_owned).unwrap_or(text);
        Some((found, text))
    }

    /// The text of a file taken in, with what it takes in itself.
    fn within(&mut self, format: Format, file: PathBuf, text: &str) -> String {
        let here = file.parent().map(Path::to_owned).unwrap_or_default();
        self.within.push(file);
        let text = self.text(format, text, &here);
        self.within.pop();
        text
    }

    // ---------------------------------------------------------------------
    // LaTeX
    // ---------------------------------------------------------------------

    fn latex(&mut self, text: &str, here: &Path) -> String {
        let mut out = String::with_capacity(text.len());
        let mut i = 0;
        while let Some(found) = text[i..].find(['\\', '%']) {
            out.push_str(&text[i..i + found]);
            i += found;
            if text[i..].starts_with('%') {
                let end = line_end(text, i);
                out.push_str(&text[i..end]);
                i = end;
                continue;
            }
            let name_end = i + 1 + text[i + 1..].bytes().take_while(u8::is_ascii_alphabetic).count();
            if name_end == i + 1 {
                // A sign after the backslash: \%, \\, \{.
                let next = text[i + 1..].chars().next().map_or(0, char::len_utf8);
                out.push_str(&text[i..i + 1 + next]);
                i += 1 + next;
                continue;
            }
            match self.latex_command(&text[i + 1..name_end], text, name_end, here, &mut out) {
                Some(end) => i = end,
                None => {
                    out.push_str(&text[i..name_end]);
                    i = name_end;
                }
            }
        }
        out.push_str(&text[i..]);
        out
    }

    /// A command that names a file, or whose text is not LaTeX, from `at`,
    /// just after its name. Where it ends, when it was one.
    fn latex_command(&mut self, name: &str, text: &str, at: usize, here: &Path, out: &mut String) -> Option<usize> {
        let root = self.root.clone();
        let bases = [root.as_path(), here];
        match name {
            "verb" => {
                let start = at + usize::from(text[at..].starts_with('*'));
                let delimiter = text[start..].chars().next().filter(|c| !c.is_alphabetic() && !c.is_whitespace())?;
                let from = start + delimiter.len_utf8();
                let close = text[from..line_end(text, from)].find(delimiter)?;
                let end = from + close + delimiter.len_utf8();
                out.push_str(&text[at - name.len() - 1..end]);
                Some(end)
            }
            "begin" => {
                let (environment, after) = group(text, skip_space(text, at), '{', '}')?;
                if !VERBATIM.contains(&environment) {
                    return None;
                }
                let closing = format!("\\end{{{environment}}}");
                let end = text[after..].find(&closing).map_or(text.len(), |e| after + e + closing.len());
                out.push_str(&text[at - name.len() - 1..end]);
                Some(end)
            }
            "input" | "include" | "subfile" => {
                let (named, end) = group(text, skip_space(text, at), '{', '}')?;
                let named = unquote(named.trim());
                let endings: &[&str] = if Path::new(named).extension().is_none() { &[".tex", ""] } else { &[""] };
                let candidates = self.candidates(named, &bases, endings);
                if let Some((file, content)) = self.take(named, &candidates) {
                    let content = self.within(Format::Latex, file, &content);
                    // \include begins and ends a page, and so a paragraph.
                    let apart = if name == "input" { "" } else { "\n\n" };
                    out.push_str(apart);
                    out.push_str(&content);
                    if !content.ends_with('\n') {
                        out.push('\n');
                    }
                    out.push_str(apart);
                }
                Some(end)
            }
            "usepackage" => {
                let start = skip_space(text, at);
                let (options, start) = match group(text, start, '[', ']') {
                    Some((options, after)) => (Some(options), skip_space(text, after)),
                    None => (None, start),
                };
                let (list, end) = group(text, start, '{', '}')?;
                // A package of the document's own lies beside it; any other
                // is LaTeX's, and stays as it is.
                let mut kept: Vec<&str> = Vec::new();
                let mut own = String::new();
                let mut touched = false;
                for package in list.split(',').map(str::trim).filter(|p| !p.is_empty()) {
                    let candidates = self.candidates(package, &bases, &[".sty"]);
                    match self.locate(&candidates) {
                        Place::Missing => kept.push(package),
                        _ => {
                            touched = true;
                            if let Some((file, content)) = self.take(&format!("{package}.sty"), &candidates) {
                                own.push_str(&self.within(Format::Latex, file, &content));
                                own.push('\n');
                            }
                        }
                    }
                }
                if !touched {
                    return None;
                }
                if !kept.is_empty() {
                    out.push_str("\\usepackage");
                    if let Some(options) = options {
                        out.push_str(&format!("[{options}]"));
                    }
                    out.push_str(&format!("{{{}}}", kept.join(",")));
                }
                out.push_str(&own);
                Some(end)
            }
            "lstinputlisting" => {
                let start = skip_space(text, at);
                let (options, start) = match group(text, start, '[', ']') {
                    Some((options, after)) => (options, skip_space(text, after)),
                    None => ("", start),
                };
                let (named, end) = group(text, start, '{', '}')?;
                let named = unquote(named.trim());
                let candidates = self.candidates(named, &bases, &[""]);
                if let Some((_, content)) = self.take(named, &candidates) {
                    // Pandoc takes the lines asked for of a file, not of a listing written out.
                    let (mut first, mut last, mut rest) = (1usize, usize::MAX, Vec::new());
                    for option in options.split(',').map(str::trim).filter(|o| !o.is_empty()) {
                        match option.split_once('=').map(|(k, v)| (k.trim(), v.trim().parse::<usize>())) {
                            Some(("firstline", Ok(n))) => first = n.max(1),
                            Some(("lastline", Ok(n))) => last = n,
                            _ => rest.push(option),
                        }
                    }
                    let lines: Vec<&str> = content.lines().collect();
                    let chosen = lines.iter().skip(first - 1).take(last.saturating_sub(first - 1));
                    out.push_str("\\begin{lstlisting}");
                    if !rest.is_empty() {
                        out.push_str(&format!("[{}]", rest.join(",")));
                    }
                    out.push('\n');
                    for line in chosen {
                        out.push_str(line);
                        out.push('\n');
                    }
                    out.push_str("\\end{lstlisting}");
                }
                Some(end)
            }
            "inputminted" => {
                let start = skip_space(text, at);
                let (options, start) = match group(text, start, '[', ']') {
                    Some((options, after)) => (Some(options), skip_space(text, after)),
                    None => (None, start),
                };
                let (language, start) = group(text, start, '{', '}')?;
                let (named, end) = group(text, skip_space(text, start), '{', '}')?;
                let named = unquote(named.trim());
                let candidates = self.candidates(named, &bases, &[""]);
                if let Some((_, content)) = self.take(named, &candidates) {
                    out.push_str("\\begin{minted}");
                    if let Some(options) = options {
                        out.push_str(&format!("[{options}]"));
                    }
                    out.push_str(&format!("{{{language}}}\n{content}"));
                    if !content.ends_with('\n') {
                        out.push('\n');
                    }
                    out.push_str("\\end{minted}");
                }
                Some(end)
            }
            _ => None,
        }
    }

    // ---------------------------------------------------------------------
    // reStructuredText
    // ---------------------------------------------------------------------

    fn rst(&mut self, text: &str, here: &Path) -> String {
        let lines: Vec<&str> = text.split_inclusive('\n').collect();
        let mut out = String::with_capacity(text.len());
        let mut i = 0;
        while i < lines.len() {
            let line = lines[i];
            let indent = indent_of(line);
            let trimmed = line.trim();
            let end = || block_end(&lines, i, indent.len());
            if let Some((name, argument)) = rst_directive(trimmed) {
                let end = end();
                let block = &lines[i + 1..end];
                let options = rst_options(block);
                let file = options.iter().find(|(k, _)| *k == "file").map(|(_, v)| *v);
                let url = options.iter().find(|(k, _)| *k == "url").map(|(_, v)| *v);
                match name.to_ascii_lowercase().as_str() {
                    "include" => {
                        self.rst_include(argument, &options, indent, here, &mut out);
                        i = end;
                        continue;
                    }
                    "csv-table" | "raw" if file.is_some() || url.is_some() => {
                        let content = match (url, file) {
                            (Some(url), _) => {
                                self.changed = true;
                                self.remarks.push(tr!("core-import-document-include-network", name = url));
                                None
                            }
                            (None, Some(file)) => {
                                let candidates = self.candidates(file, &[here], &[""]);
                                self.take(file, &candidates)
                            }
                            (None, None) => None,
                        };
                        // What the file holds becomes the directive's own content.
                        if let Some((_, content)) = content {
                            out.push_str(line);
                            for option in block.iter().filter(|l| !l.trim_start().starts_with(":file:")) {
                                out.push_str(option);
                            }
                            out.push('\n');
                            push_indented(&mut out, &content, &format!("{indent}   "));
                            out.push('\n');
                        }
                        i = end;
                        continue;
                    }
                    "code" | "code-block" | "sourcecode" | "parsed-literal" => {
                        lines[i..end].iter().for_each(|l| out.push_str(l));
                        i = end;
                        continue;
                    }
                    // Another directive's content is read line by line.
                    _ => {}
                }
            } else if rst_comment(trimmed) || (trimmed.ends_with("::") && !trimmed.starts_with("..")) {
                // A comment, and the literal block after "::", are not read as markup.
                let end = end();
                lines[i..end].iter().for_each(|l| out.push_str(l));
                i = end;
                continue;
            }
            out.push_str(line);
            i += 1;
        }
        out
    }

    fn rst_include(&mut self, argument: &str, options: &[(&str, &str)], indent: &str, here: &Path, out: &mut String) {
        let option = |name: &str| options.iter().find(|(k, _)| *k == name).map(|(_, v)| *v);
        // A name in angle brackets is one of Docutils' own files, which are not here.
        let candidates = if argument.starts_with('<') { Vec::new() } else { self.candidates(argument, &[here], &[""]) };
        let Some((file, content)) = self.take(argument, &candidates) else { return };
        // The lines asked for, as Docutils counts them: from 0, the end not with them.
        let lines: Vec<&str> = content.split_inclusive('\n').collect();
        let at = |n: Option<&str>, default: usize| match n.and_then(|n| n.trim().parse::<i64>().ok()) {
            Some(n) if n < 0 => lines.len().saturating_sub(n.unsigned_abs() as usize),
            Some(n) => (n as usize).min(lines.len()),
            None => default,
        };
        let (start, end) = (at(option("start-line"), 0), at(option("end-line"), lines.len()));
        let mut content: String = lines.get(start..end.max(start)).unwrap_or_default().concat();
        if let Some(after) = option("start-after").filter(|a| !a.is_empty())
            && let Some(at) = content.find(after)
        {
            content = content[at + after.len()..].to_owned();
        }
        if let Some(before) = option("end-before").filter(|b| !b.is_empty())
            && let Some(at) = content.find(before)
        {
            content.truncate(at);
        }
        let inner = format!("{indent}   ");
        if let Some(language) = option("code") {
            out.push_str(&format!("{indent}.. code:: {}\n", language.trim()));
            if let Some(numbers) = option("number-lines") {
                out.push_str(&format!("{inner}:number-lines: {numbers}\n"));
            }
            out.push('\n');
            push_indented(out, &content, &inner);
            out.push('\n');
        } else if option("literal").is_some() {
            out.push_str(&format!("{indent}::\n\n"));
            push_indented(out, &content, &inner);
            out.push('\n');
        } else {
            let content = self.within(Format::Rst, file, &content);
            push_indented(out, &content, indent);
        }
    }

    // ---------------------------------------------------------------------
    // Org
    // ---------------------------------------------------------------------

    fn org(&mut self, text: &str, here: &Path) -> String {
        let mut out = String::with_capacity(text.len());
        // The block whose lines are not read as Org, while within one.
        let mut verbatim: Option<String> = None;
        for line in text.split_inclusive('\n') {
            let lower = line.trim_start().to_ascii_lowercase();
            if let Some(name) = &verbatim {
                if lower.starts_with(&format!("#+end_{name}")) {
                    verbatim = None;
                }
                out.push_str(line);
                continue;
            }
            if let Some(name) = lower.strip_prefix("#+begin_").and_then(|r| r.split_whitespace().next())
                && ["src", "example", "export", "comment", "verse"].contains(&name)
            {
                verbatim = Some(name.to_owned());
            }
            if lower.starts_with("#+include:") {
                let arguments = &line.trim_start()["#+include:".len()..];
                if self.org_include(arguments, here, &mut out) {
                    continue;
                }
            }
            out.push_str(line);
        }
        out
    }

    /// Whether the line was an inclusion, as Pandoc reads one: of a file
    /// whose name is between quotation marks.
    fn org_include(&mut self, arguments: &str, here: &Path, out: &mut String) -> bool {
        let words = words_of(arguments);
        let Some((named, true)) = words.first().cloned() else { return false };
        let (mut kind, mut language, mut lines, mut minlevel) = (None, None, None, None);
        let mut rest = words[1..].iter();
        while let Some((word, _)) = rest.next() {
            match word.as_str() {
                ":lines" => lines = rest.next().map(|(w, _)| w.clone()),
                ":minlevel" => minlevel = rest.next().and_then(|(w, _)| w.parse::<usize>().ok()),
                w if w.starts_with(':') => {
                    rest.next();
                }
                _ if kind.is_none() => kind = Some(word.to_ascii_lowercase()),
                _ if language.is_none() => language = Some(word.clone()),
                _ => {}
            }
        }
        let candidates = self.candidates(&named, &[here], &[""]);
        let Some((file, content)) = self.take(&named, &candidates) else { return true };
        // Lines "5-10" are the fifth to the ninth, as Org has them.
        let content = match lines.as_deref().and_then(|l| l.split_once('-')) {
            Some((from, to)) => {
                let from = from.trim().parse::<usize>().unwrap_or(1).max(1);
                let to = to.trim().parse::<usize>().unwrap_or(usize::MAX);
                content.split_inclusive('\n').skip(from - 1).take(to.saturating_sub(from)).collect()
            }
            None => content,
        };
        let block = |out: &mut String, begin: &str, end: &str, escape: bool| {
            out.push_str(begin);
            for line in content.split_inclusive('\n') {
                // Org's own marks within such a block are escaped with a comma.
                let start = line.trim_start().trim_start_matches(',');
                if escape && (start.starts_with('*') || start.starts_with("#+")) {
                    out.push(',');
                }
                out.push_str(line);
            }
            if !content.ends_with('\n') {
                out.push('\n');
            }
            out.push_str(end);
        };
        match kind.as_deref() {
            Some("src") => block(out, &format!("#+BEGIN_SRC {}\n", language.unwrap_or_default()), "#+END_SRC\n", true),
            Some("example") => block(out, "#+BEGIN_EXAMPLE\n", "#+END_EXAMPLE\n", true),
            Some("export") => {
                block(out, &format!("#+BEGIN_EXPORT {}\n", language.unwrap_or_default()), "#+END_EXPORT\n", false)
            }
            // Of any other kind, Pandoc reads the text as Org.
            _ => {
                let content = self.within(Format::Org, file, &content);
                let content = match minlevel {
                    Some(level) => shift_headings(&content, '*', level),
                    None => content,
                };
                out.push_str(&content);
                if !content.ends_with('\n') {
                    out.push('\n');
                }
            }
        }
        true
    }

    // ---------------------------------------------------------------------
    // AsciiDoc
    // ---------------------------------------------------------------------

    fn asciidoc(&mut self, text: &str, here: &Path) -> String {
        let mut out = String::with_capacity(text.len());
        let mut comment = false;
        for line in text.split_inclusive('\n') {
            let bare = line.trim_end_matches(['\n', '\r']);
            if bare.len() >= 4 && bare.bytes().all(|b| b == b'/') {
                comment = !comment;
            }
            let directive =
                bare.strip_prefix("include::").and_then(|r| r.strip_suffix(']')).and_then(|r| r.split_once('['));
            match directive {
                Some((target, attributes)) if !comment => self.asciidoc_include(target, attributes, here, &mut out),
                _ => out.push_str(line),
            }
        }
        out
    }

    fn asciidoc_include(&mut self, target: &str, attributes: &str, here: &Path, out: &mut String) {
        let candidates = self.candidates(target, &[here], &[""]);
        let Some((file, content)) = self.take(target, &candidates) else { return };
        let attributes: Vec<(String, String)> = split_outside_quotes(attributes, ',')
            .into_iter()
            .filter_map(|a| a.split_once('=').map(|(k, v)| (k.trim().to_owned(), unquote(v.trim()).to_owned())))
            .collect();
        let attribute = |name: &str| attributes.iter().find(|(k, _)| k == name).map(|(_, v)| v.as_str());
        let lines: Vec<&str> = content.split_inclusive('\n').collect();
        let mut chosen: Vec<&str> = lines.clone();
        if let Some(ranges) = attribute("lines") {
            // Counted from 1, both ends with them; -1 is the last.
            let mut wanted = vec![false; lines.len()];
            for range in ranges.split([';', ',']).map(str::trim).filter(|r| !r.is_empty()) {
                let (from, to) = range.split_once("..").unwrap_or((range, range));
                let from = from.trim().parse::<usize>().unwrap_or(1).max(1);
                let to = match to.trim().parse::<i64>() {
                    Ok(n) if n >= 0 => n as usize,
                    _ => lines.len(),
                };
                for n in from..=to.min(lines.len()) {
                    wanted[n - 1] = true;
                }
            }
            chosen = lines.iter().zip(&wanted).filter(|(_, w)| **w).map(|(l, _)| *l).collect();
        } else if let Some(tags) = attribute("tags").or(attribute("tag")) {
            let names: Vec<&str> = tags.split([';', ',']).map(str::trim).filter(|t| !t.is_empty()).collect();
            let every = names.iter().any(|n| n.starts_with(['!', '*']));
            let mut open: Vec<String> = Vec::new();
            chosen = Vec::new();
            for line in &lines {
                if let Some(name) = tag_mark(line, "tag::") {
                    open.push(name);
                } else if let Some(name) = tag_mark(line, "end::") {
                    open.retain(|n| *n != name);
                } else if every || open.iter().any(|n| names.contains(&n.as_str())) {
                    chosen.push(line);
                }
            }
        }
        let content = self.within(Format::AsciiDoc, file, &chosen.concat());
        let content = match attribute("leveloffset").and_then(|o| o.trim_start_matches('+').parse::<i64>().ok()) {
            Some(offset) => shift_headings_by(&content, '=', offset),
            None => content,
        };
        out.push_str(&content);
        if !content.ends_with('\n') {
            out.push('\n');
        }
    }

    // ---------------------------------------------------------------------
    // Typst
    // ---------------------------------------------------------------------

    fn typst(&mut self, text: &str, here: &Path) -> String {
        let mut out = String::with_capacity(text.len());
        let bytes = text.as_bytes();
        let mut i = 0;
        let mut copied = 0;
        while i < bytes.len() {
            // Comments and raw text are passed over.
            if text[i..].starts_with("//") && (i == 0 || bytes[i - 1] != b':') {
                i = line_end(text, i);
                continue;
            }
            if text[i..].starts_with("/*") {
                i = text[i + 2..].find("*/").map_or(text.len(), |e| i + 2 + e + 2);
                continue;
            }
            if bytes[i] == b'`' {
                let run = text[i..].bytes().take_while(|b| *b == b'`').count();
                let fence = &text[i..i + run];
                i = text[i + run..].find(fence).map_or(text.len(), |e| i + run + e + run);
                continue;
            }
            let word = i == 0 || !(bytes[i - 1].is_ascii_alphanumeric() || matches!(bytes[i - 1], b'_' | b'-' | b'.'));
            let hash = i > 0 && bytes[i - 1] == b'#';
            let mut handled = None;
            if word {
                for keyword in ["include", "import", "read", "json"] {
                    if text[i..].starts_with(keyword)
                        && !text[i + keyword.len()..].starts_with(|c: char| c.is_alphanumeric() || c == '_' || c == '-')
                    {
                        handled = self.typst_word(keyword, hash, text, i, here);
                        break;
                    }
                }
            }
            match handled {
                Some((start, end, replacement)) => {
                    out.push_str(&text[copied..start]);
                    out.push_str(&replacement);
                    i = end;
                    copied = end;
                }
                None => i += text[i..].chars().next().map_or(1, char::len_utf8),
            }
        }
        out.push_str(&text[copied..]);
        out
    }

    /// What stands from the keyword at `at` to where the statement or call
    /// ends, and what replaces it, when it names a file.
    fn typst_word(
        &mut self,
        keyword: &str,
        hash: bool,
        text: &str,
        at: usize,
        here: &Path,
    ) -> Option<(usize, usize, String)> {
        let call = matches!(keyword, "read" | "json");
        // A call is code after `#`, or where a value stands in code; in
        // the words of a text, "read(" is words.
        let before = text[..at].trim_end_matches([' ', '\t']).chars().last();
        if call && !hash && !before.is_some_and(|c| "=(,:{;".contains(c)) {
            return None;
        }
        let after = at + keyword.len();
        let open = if call { after + usize::from(text[after..].starts_with('(')) } else { skip_blank(text, after) };
        if call && open == after {
            return None;
        }
        let (named, mut end) = typst_string(text, open)?;
        let start = if hash { at - 1 } else { at };
        let root = self.root.clone();
        let candidates = match named.strip_prefix('/') {
            Some(from_root) => vec![root.join(from_root)],
            None => self.candidates(&named, &[here], &[""]),
        };
        match keyword {
            "read" | "json" => {
                if !text[end..].starts_with(')') {
                    return None;
                }
                end += 1;
                let replacement = match self.take(&named, &candidates) {
                    Some((_, content)) if keyword == "read" => typst_literal(&content),
                    Some((_, content)) => format!("json(bytes({}))", typst_literal(&content)),
                    None if keyword == "read" => "\"\"".to_owned(),
                    None => "none".to_owned(),
                };
                Some((at, end, replacement))
            }
            "include" => {
                // In markup, as `#include`, or as a value in code.
                if !hash && !text[..at].trim_end().ends_with('=') {
                    return None;
                }
                let replacement = match self.take(&named, &candidates) {
                    Some((file, content)) => {
                        let content = self.within(Format::Typst, file, &content);
                        if hash { content } else { format!("[{content}]") }
                    }
                    None if hash => String::new(),
                    None => "[]".to_owned(),
                };
                Some((start, end, replacement))
            }
            _ => {
                if !hash {
                    return None;
                }
                let rest = skip_blank(text, end);
                // What is imported by name, or all of it, is what the file
                // defines, and stands where it is read; a module imported
                // whole, under its own name, cannot be made so.
                let named_items = text[rest..].starts_with(':');
                end = if named_items {
                    let items = skip_blank(text, rest + 1);
                    match group(text, items, '(', ')') {
                        Some((_, after)) => after,
                        None => statement_end(text, items),
                    }
                } else {
                    statement_end(text, rest)
                };
                if named.starts_with('@') {
                    self.changed = true;
                    self.remarks.push(tr!("core-import-document-include-outside", name = &named));
                    return Some((start, end, String::new()));
                }
                if !named_items {
                    self.changed = true;
                    self.remarks.push(tr!("core-import-document-include-module", name = &named));
                    return Some((start, end, String::new()));
                }
                let replacement = match self.take(&named, &candidates) {
                    Some((file, content)) => self.within(Format::Typst, file, &content),
                    None => String::new(),
                };
                Some((start, end, replacement))
            }
        }
    }
}

// =========================================================================
// Reading what the formats write
// =========================================================================

/// Where the line that `at` is in ends, its newline with it.
fn line_end(text: &str, at: usize) -> usize {
    text[at..].find('\n').map_or(text.len(), |e| at + e + 1)
}

/// Past spaces, tabs and newlines.
fn skip_space(text: &str, at: usize) -> usize {
    at + text[at..].len() - text[at..].trim_start().len()
}

/// Past spaces and tabs, on the same line.
fn skip_blank(text: &str, at: usize) -> usize {
    at + text[at..].len() - text[at..].trim_start_matches([' ', '\t']).len()
}

/// What stands between `open` at `at` and the `close` that matches it, and
/// where that ends; not a sign escaped with a backslash.
fn group(text: &str, at: usize, open: char, close: char) -> Option<(&str, usize)> {
    if !text[at..].starts_with(open) {
        return None;
    }
    let (mut depth, mut escaped) = (0usize, false);
    for (offset, c) in text[at..].char_indices() {
        match c {
            _ if escaped => escaped = false,
            '\\' => escaped = true,
            c if c == open => depth += 1,
            c if c == close => {
                depth -= 1;
                if depth == 0 {
                    return Some((&text[at + open.len_utf8()..at + offset], at + offset + close.len_utf8()));
                }
            }
            _ => {}
        }
    }
    None
}

/// Without the quotation marks around it.
fn unquote(text: &str) -> &str {
    text.strip_prefix('"').and_then(|t| t.strip_suffix('"')).unwrap_or(text)
}

fn indent_of(line: &str) -> &str {
    &line[..line.len() - line.trim_start_matches([' ', '\t']).len()]
}

/// Where the block that begins at line `at` ends: the lines after it that are
/// more indented, and the blank lines among them.
fn block_end(lines: &[&str], at: usize, indent: usize) -> usize {
    let mut last = at;
    for (j, line) in lines.iter().enumerate().skip(at + 1) {
        if line.trim().is_empty() {
            continue;
        }
        if indent_of(line).len() > indent {
            last = j;
        } else {
            break;
        }
    }
    last + 1
}

/// The name of a directive of reStructuredText, and what follows it on its line.
fn rst_directive(trimmed: &str) -> Option<(&str, &str)> {
    let rest = trimmed.strip_prefix(".. ")?;
    let (name, argument) = rest.split_once("::")?;
    let plain = !name.is_empty() && !name.contains(char::is_whitespace) && !name.starts_with(['|', '_', '[']);
    plain.then(|| (name, argument.trim()))
}

/// Whether a line begins a comment of reStructuredText: two dots, and then
/// no directive, target, footnote or substitution.
fn rst_comment(trimmed: &str) -> bool {
    if trimmed == ".." {
        return true;
    }
    let Some(rest) = trimmed.strip_prefix(".. ") else { return false };
    rst_directive(trimmed).is_none() && !rest.starts_with(['|', '_', '['])
}

/// The options at the head of a directive's block: `:name: value`.
fn rst_options<'a>(block: &[&'a str]) -> Vec<(&'a str, &'a str)> {
    block
        .iter()
        .map(|l| l.trim())
        .take_while(|l| l.starts_with(':'))
        .filter_map(|l| l[1..].split_once(':'))
        .map(|(k, v)| (k.trim(), v.trim()))
        .collect()
}

/// Each line of `content` after `indent`, the blank ones blank.
fn push_indented(out: &mut String, content: &str, indent: &str) {
    for line in content.split_inclusive('\n') {
        if !line.trim().is_empty() {
            out.push_str(indent);
        }
        out.push_str(line.trim_end_matches(['\n', '\r']));
        out.push('\n');
    }
}

/// The words of a line, each with whether it stood between quotation marks.
fn words_of(text: &str) -> Vec<(String, bool)> {
    let mut words = Vec::new();
    let mut chars = text.trim().chars().peekable();
    while let Some(&c) = chars.peek() {
        if c.is_whitespace() {
            chars.next();
        } else if c == '"' {
            chars.next();
            let mut word = String::new();
            for c in chars.by_ref() {
                if c == '"' {
                    break;
                }
                word.push(c);
            }
            words.push((word, true));
        } else {
            let mut word = String::new();
            while let Some(&c) = chars.peek() {
                if c.is_whitespace() {
                    break;
                }
                word.push(c);
                chars.next();
            }
            words.push((word, false));
        }
    }
    words
}

/// Split at `sign` where it does not stand between quotation marks.
fn split_outside_quotes(text: &str, sign: char) -> Vec<&str> {
    let (mut parts, mut start, mut quoted) = (Vec::new(), 0, false);
    for (at, c) in text.char_indices() {
        match c {
            '"' => quoted = !quoted,
            c if c == sign && !quoted => {
                parts.push(&text[start..at]);
                start = at + c.len_utf8();
            }
            _ => {}
        }
    }
    parts.push(&text[start..]);
    parts
}

/// The name of an AsciiDoc tag that a line opens or closes.
fn tag_mark(line: &str, mark: &str) -> Option<String> {
    let at = line.find(mark)?;
    let rest = &line[at + mark.len()..];
    let name = &rest[..rest.find("[]")?];
    (!name.is_empty() && !name.contains(char::is_whitespace)).then(|| name.to_owned())
}

/// Headings shifted so that the highest of them is at `level`.
fn shift_headings(text: &str, sign: char, level: usize) -> String {
    let highest = text.lines().filter_map(|l| heading_level(l, sign)).min();
    match highest {
        Some(highest) => shift_headings_by(text, sign, level as i64 - highest as i64),
        None => text.to_owned(),
    }
}

fn shift_headings_by(text: &str, sign: char, by: i64) -> String {
    let mut out = String::with_capacity(text.len());
    for line in text.split_inclusive('\n') {
        match heading_level(line, sign) {
            Some(level) => {
                let new = (level as i64 + by).max(1) as usize;
                out.extend(std::iter::repeat_n(sign, new));
                out.push_str(&line[level..]);
            }
            None => out.push_str(line),
        }
    }
    out
}

/// The level of a heading written with a run of `sign` and a space.
fn heading_level(line: &str, sign: char) -> Option<usize> {
    let level = line.chars().take_while(|c| *c == sign).count();
    (level > 0 && line[level..].starts_with([' ', '\t'])).then_some(level)
}

/// The string of Typst that begins at `at`, and where it ends.
fn typst_string(text: &str, at: usize) -> Option<(String, usize)> {
    let rest = text[at..].strip_prefix('"')?;
    let mut out = String::new();
    let mut escaped = false;
    for (offset, c) in rest.char_indices() {
        match c {
            _ if escaped => {
                out.push(c);
                escaped = false;
            }
            '\\' => escaped = true,
            '"' => return Some((out, at + 1 + offset + 1)),
            '\n' => return None,
            c => out.push(c),
        }
    }
    None
}

/// A text as a string of Typst.
fn typst_literal(text: &str) -> String {
    let mut out = String::with_capacity(text.len() + 2);
    out.push('"');
    for c in text.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '"' => out.push_str("\\\""),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// Where a statement of Typst ends: at a semicolon or the end of its line.
fn statement_end(text: &str, at: usize) -> usize {
    let line = line_end(text, at);
    text[at..line].find(';').map_or_else(|| line - usize::from(text[..line].ends_with('\n')), |e| at + e + 1)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A folder with a document of its own and a file outside it.
    struct Desk {
        tmp: tempfile::TempDir,
    }

    impl Desk {
        fn new() -> Desk {
            let tmp = tempfile::tempdir().unwrap();
            fs::create_dir_all(tmp.path().join("doc/sub")).unwrap();
            fs::write(tmp.path().join("secret.txt"), "SECRET\n").unwrap();
            Desk { tmp }
        }

        fn doc(&self) -> PathBuf {
            self.tmp.path().join("doc")
        }

        fn write(&self, name: &str, text: &str) -> PathBuf {
            let path = self.doc().join(name);
            fs::write(&path, text).unwrap();
            path
        }

        /// The copy for Pandoc, and the remarks.
        fn take(&self, name: &str, text: &str) -> (Option<String>, Vec<String>) {
            let path = self.write(name, text);
            let work = self.tmp.path().join("work");
            let taken = take_in(&path, Format::of(&path).unwrap(), &work).unwrap();
            (taken.copy.map(|c| fs::read_to_string(c).unwrap()), taken.remarks)
        }
    }

    fn outside(name: &str) -> String {
        tr!("core-import-document-include-outside", name = name)
    }

    #[test]
    fn latex_reads_its_own_folder_only() {
        let d = Desk::new();
        d.write("chap.tex", "Chapter one.\n");
        d.write("sub/inner.tex", "Inner \\input{sub/deep}\n");
        d.write("sub/deep.tex", "deep.\n");
        d.write("mine.sty", "\\newcommand{\\mine}{MINE}\n");
        d.write("code.py", "a\nb\nc\n");
        let secret = d.tmp.path().join("secret.txt").display().to_string();
        let (copy, remarks) = d.take(
            "main.tex",
            &format!(
                "\\usepackage{{amsmath,mine}}\n\\input{{chap}}\n\\include{{sub/inner}}\n\\input{{../secret.txt}}\n\
                 \\input{{{secret}}}\n\\lstinputlisting[firstline=2,language=Python]{{code.py}}\n\
                 \\lstinputlisting{{../secret.txt}}\n\\input{{gone}}\n% \\input{{../secret.txt}}\n\
                 \\begin{{verbatim}}\n\\input{{../secret.txt}}\n\\end{{verbatim}}\n\\verb|\\input{{x}}| \\includegraphics{{a.png}}\n"
            ),
        );
        let copy = copy.unwrap();
        assert!(!copy.contains("SECRET"), "{copy}");
        assert!(copy.starts_with("\\usepackage{amsmath}\\newcommand{\\mine}{MINE}\n"), "{copy}");
        assert!(copy.contains("Chapter one."), "{copy}");
        assert!(copy.contains("Inner deep."), "{copy}");
        assert!(copy.contains("\\begin{lstlisting}[language=Python]\nb\nc\n\\end{lstlisting}"), "{copy}");
        // What is commented out, or verbatim, stays as it is.
        assert!(copy.contains("% \\input{../secret.txt}\n"), "{copy}");
        assert!(copy.contains("\\begin{verbatim}\n\\input{../secret.txt}\n\\end{verbatim}"), "{copy}");
        assert!(copy.contains("\\verb|\\input{x}| \\includegraphics{a.png}"), "{copy}");
        assert_eq!(
            remarks,
            vec![
                outside("../secret.txt"),
                outside(&secret),
                outside("../secret.txt"),
                tr!("core-import-document-include-not-found", name = "gone"),
            ]
        );
    }

    #[test]
    fn a_document_that_takes_in_nothing_is_read_as_it_is() {
        let d = Desk::new();
        assert_eq!(d.take("plain.tex", "\\section{A}\n\\usepackage{amsmath}\nText.\n"), (None, vec![]));
        assert_eq!(d.take("plain.rst", "Title\n=====\n\n.. note:: x\n"), (None, vec![]));
    }

    #[test]
    fn a_link_out_of_the_folder_is_outside() {
        let d = Desk::new();
        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(d.tmp.path().join("secret.txt"), d.doc().join("link.tex")).unwrap();
            let (copy, remarks) = d.take("main.tex", "\\input{link}\n");
            assert!(!copy.unwrap().contains("SECRET"));
            assert_eq!(remarks, vec![outside("link")]);
        }
    }

    #[test]
    fn a_file_that_takes_itself_in_is_read_once() {
        let d = Desk::new();
        d.write("b.tex", "B \\input{a}\n");
        let (copy, remarks) = d.take("a.tex", "A \\input{b}\n");
        assert_eq!(copy.unwrap(), "A B \n\n");
        assert_eq!(remarks, vec![tr!("core-import-document-include-circle", name = "a")]);
    }

    #[test]
    fn rst_reads_its_own_folder_only() {
        let d = Desk::new();
        d.write("chap.rst", "Para from chap.\n");
        d.write("sub/inner.rst", "inner\n\n.. include:: deep.rst\n");
        d.write("sub/deep.rst", "deep in sub\n");
        d.write("lines.txt", "L1\nL2\nL3\n");
        d.write("t.csv", "1, 2\n");
        let (copy, remarks) = d.take(
            "main.rst",
            "Title\n=====\n\n.. include:: chap.rst\n\n.. include:: ../secret.txt\n   :literal:\n\n\
             .. note::\n\n   .. include:: sub/inner.rst\n\n.. include:: lines.txt\n   :code: python\n   :start-line: 1\n\n\
             .. csv-table:: T\n   :file: t.csv\n\n.. raw:: html\n   :file: ../secret.txt\n\n\
             .. csv-table:: U\n   :url: https://example.org/t.csv\n\nA literal::\n\n   .. include:: ../secret.txt\n\n\
             .. include:: <isonum.txt>\n",
        );
        let copy = copy.unwrap();
        assert!(copy.contains("\nPara from chap.\n"), "{copy}");
        assert!(copy.contains("   inner\n\n   deep in sub\n"), "{copy}");
        assert!(copy.contains(".. code:: python\n\n   L2\n   L3\n"), "{copy}");
        assert!(copy.contains(".. csv-table:: T\n\n   1, 2\n"), "{copy}");
        assert!(!copy.contains(".. raw::") && !copy.contains("example.org"), "{copy}");
        assert!(copy.contains("A literal::\n\n   .. include:: ../secret.txt\n"), "{copy}");
        assert_eq!(
            remarks,
            vec![
                outside("../secret.txt"),
                outside("../secret.txt"),
                tr!("core-import-document-include-network", name = "https://example.org/t.csv"),
                tr!("core-import-document-include-not-found", name = "<isonum.txt>"),
            ]
        );
    }

    #[test]
    fn org_reads_its_own_folder_only() {
        let d = Desk::new();
        d.write("chap.org", "* Chapter\nText.\n");
        d.write("lines.txt", "L1\n* L2\nL3\n");
        let (copy, remarks) = d.take(
            "main.org",
            "* Top\n#+INCLUDE: \"chap.org\" :minlevel 2\n#+include: \"lines.txt\" src text :lines \"2-4\"\n\
             #+INCLUDE: \"../secret.txt\"\n#+BEGIN_SRC org\n#+INCLUDE: \"../secret.txt\"\n#+END_SRC\n",
        );
        let copy = copy.unwrap();
        assert!(copy.contains("** Chapter\nText.\n"), "{copy}");
        assert!(copy.contains("#+BEGIN_SRC text\n,* L2\nL3\n#+END_SRC\n"), "{copy}");
        assert!(copy.contains("#+BEGIN_SRC org\n#+INCLUDE: \"../secret.txt\"\n#+END_SRC\n"), "{copy}");
        assert_eq!(remarks, vec![outside("../secret.txt")]);
    }

    #[test]
    fn asciidoc_reads_its_own_folder_only() {
        let d = Desk::new();
        d.write("chap.adoc", "== Chapter\nText.\n");
        d.write("tagged.adoc", "before\n// tag::part[]\nwithin\n// end::part[]\nafter\n");
        let (copy, remarks) = d.take(
            "main.adoc",
            "= Title\n\ninclude::chap.adoc[leveloffset=+1]\n\ninclude::tagged.adoc[tag=part]\n\n\
             include::../secret.txt[]\n\n////\ninclude::../secret.txt[]\n////\n",
        );
        let copy = copy.unwrap();
        assert!(copy.contains("\n=== Chapter\nText.\n"), "{copy}");
        assert!(copy.contains("\nwithin\n") && !copy.contains("before"), "{copy}");
        assert!(copy.contains("////\ninclude::../secret.txt[]\n////\n"), "{copy}");
        assert_eq!(remarks, vec![outside("../secret.txt")]);
    }

    #[test]
    fn typst_reads_its_own_folder_only() {
        let d = Desk::new();
        d.write("tpl.typ", "#let greet = [Hi]\n");
        d.write("chap.typ", "Chapter text.\n");
        d.write("data.json", "{\"a\": \"q\\\"uote\"}\n");
        let (copy, remarks) = d.take(
            "main.typ",
            "#import \"tpl.typ\": greet\n#greet\n#include \"chap.typ\"\n#read(\"../secret.txt\")\n\
             #let d = json(\"data.json\")\n#import \"whole.typ\"\n#import \"@preview/pkg:0.1.0\": *\n\
             // #include \"../secret.txt\"\nSee https://example.org/read(\"x\") and read(\"y\").\n",
        );
        let copy = copy.unwrap();
        assert!(copy.starts_with("#let greet = [Hi]\n\n#greet\nChapter text.\n\n#\"\"\n"), "{copy}");
        assert!(copy.contains("#let d = json(bytes(\"{\\\"a\\\": \\\"q\\\\\\\"uote\\\"}\\n\"))"), "{copy}");
        assert!(copy.contains("// #include \"../secret.txt\"\n"), "{copy}");
        assert!(copy.contains("read(\"x\") and read(\"y\")."), "{copy}");
        assert_eq!(
            remarks,
            vec![
                outside("../secret.txt"),
                tr!("core-import-document-include-module", name = "whole.typ"),
                outside("@preview/pkg:0.1.0"),
            ]
        );
    }
}
