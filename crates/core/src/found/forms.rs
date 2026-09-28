//! What looks like a citation, in text that has none that are known.
//!
//! Two kinds are looked for. In the line, what stands in brackets with a
//! year in it, as styles of author and year write: "(Nagy 1979, 73)", and
//! "Nagy (1979)". In notes, the works of the library, by the names of their
//! authors and the title or the year that follows, as styles of notes
//! write: "Nagy, Best of the Achaeans, 73".
//!
//! The rules are strict. What is proposed wrongly costs the writer more
//! than what is not proposed: "(in 1979)", "(born 1950)" and "Rome (1957)"
//! are no citations, and where it cannot be told, nothing is proposed.
//!
//! A text is looked through letter by letter, not byte by byte; the places
//! that are given are in units of UTF-16, as the interface counts.

use std::cmp::Reverse;
use std::collections::{BTreeMap, HashMap, HashSet};
use std::sync::OnceLock;

use super::matching::{PARTICLES, Said, Shelf, Words, shelf};
use super::{Options, Passage, Proposal, ProposedItem, Suggestion, Sure};
use crate::bib::latex::fold;
use crate::document::CiteMode;
use crate::library::Library;

const TERMS_JSON: &str = include_str!("../../../../resources/csl/locator-terms.json");

/// What stands in a text for what is no text.
const NOTHING: char = '\u{fffc}';

/// How far apart brackets may stand, in letters.
const FAR: usize = 400;

/// The kinds of locator the application knows, as CSL names them.
const LABELS: [&str; 15] = [
    "page",
    "chapter",
    "section",
    "paragraph",
    "line",
    "verse",
    "book",
    "volume",
    "part",
    "column",
    "folio",
    "figure",
    "note",
    "number",
    "sub-verbo",
];

/// The languages whose words for locators come first, where a word counts
/// one thing in one language and another in another.
const FIRST: [&str; 13] =
    ["en-US", "en-GB", "nb-NO", "nn-NO", "da-DK", "sv-SE", "de-DE", "fr-FR", "it-IT", "es-ES", "pt-PT", "nl-NL", "la"];

/// What is said before a work that is cited, as it is compared: in small
/// letters and without full stops.
const BEFORE: &str = "see;see also;see esp;see especially;see eg;see for example;see for instance;see further;\
see now;see most recently;see in particular;see above all;see generally;see too;see already;see however;\
see rather;see again;see among others;but see;but see also;but cf;but compare;but note;and see;and see also;\
also;and;or;cf;cf also;cf eg;cf esp;cf however;cp;compare;compare also;confer;contra;pace;eg;ie;esp;\
especially;notably;so;so also;so too;so already;thus;thus also;thus already;following;after;as in;as per;\
quoted in;quoted from;quoted by;quoted after;cited in;cited by;cited from;cited after;qtd in;reprinted in;\
apud;for example;for instance;in particular;most recently;recently;already;originally;similarly;likewise;\
further;discussed in;discussed by;among others;inter alia;inter alios;from;adapted from;based on;\
according to;source;\
vgl;vgl auch;vgl etwa;vgl zb;vgl z b;vgl dazu;vgl hierzu;vgl aber;vgl jedoch;vgl nur;vgl bes;\
vgl insbesondere;siehe;siehe auch;siehe etwa;siehe dazu;siehe aber;siehe zb;s;s auch;s a;so auch;so etwa;\
so schon;so bereits;zb;z b;etwa;ua;u a;dazu;hierzu;zit nach;zit n;zitiert nach;nach;bei;anders;auch;ebenso;\
ähnlich;grundlegend;zuletzt;bes;insbesondere;insb;dagegen;\
se;se også;se og;se feks;se f eks;se bla;se bl a;se særlig;se spesielt;se især;se videre;se for eksempel;\
se blant andre;se blant annet;jf;jf også;jf feks;jfr;jfr også;sml;sammenlign;feks;f eks;bla;bl a;\
blant andre;blant annet;også;slik;slik også;etter;sitert i;sitert etter;sitert fra;gjengitt i;hos;ifølge;\
i følge;se även;se också;se tex;se t ex;jfr även;tex;t ex;enligt;citerat i;fx;se fx;\
voir;voir aussi;voir par exemple;voir notamment;voir surtout;voir également;v;par exemple;p ex;ainsi;selon;\
d'après;cité dans;cité par;chez;notamment;\
vedi;vedi anche;si veda;si vedano;cfr;véase;véase también;ver;ver también;p ej;por ejemplo;vide;zie;zie ook;\
vgl ook;bijv;bv";

/// Words that begin with a capital and are no names, folded: months and
/// seasons, what is said of a year, what is counted, and places where books
/// come out. One of them is a name only where the library has an author of
/// that name.
const NO_NAMES: &str = "january february march april may june july august september october november december \
jan feb mar apr jun jul aug sep sept oct nov dec \
januar februar marz mai juni juli oktober dezember desember janvier fevrier mars avril juin juillet aout \
septembre octobre novembre decembre gennaio febbraio marzo aprile maggio giugno luglio agosto settembre \
ottobre dicembre enero febrero abril mayo junio julio septiembre octubre noviembre diciembre \
monday tuesday wednesday thursday friday saturday sunday spring summer autumn fall winter easter christmas \
in on at by from since until till after before during around about circa ca between born died founded \
published written revised reprinted reprint translated edited established approximately early late mid \
the a an this that these those it he she they we as but and or for with without when while although though \
if then thus so also see compare note figure fig table tab chapter section part volume vol book page line \
act scene appendix equation eq no nr number plate map version edition ed eds copyright isbn issn doi ad bc \
bce ce anno year olympics census \
im am um seit bis nach vor ab geboren gestorben gegrundet abbildung abb tabelle kapitel band seite jahr stand \
i pa fra siden til etter for rundt fodt dod utgitt figur tabell kapittel bind side ar \
en de depuis avant apres vers ne nee mort tableau chapitre \
new london oxford cambridge paris berlin leipzig york princeton baltimore chicago boston leiden amsterdam \
oslo stockholm copenhagen kobenhavn rome roma milan milano munich munchen stuttgart frankfurt gottingen \
tubingen heidelberg vienna wien zurich basel berkeley ithaca bloomington toronto edinburgh harmondsworth \
bergen trondheim uppsala lund helsinki athens madrid geneva geneve brussels hamburg koln cologne darmstadt \
hildesheim wiesbaden mainz bonn florence firenze torino turin napoli bologna philadelphia washington";

/// What stands for a year where there is none.
const NO_YEAR: [&str; 22] = [
    "n.d.",
    "n. d.",
    "o.j.",
    "o. j.",
    "u.å.",
    "u. å.",
    "s.d.",
    "s.a.",
    "forthcoming",
    "in press",
    "in preparation",
    "im druck",
    "im erscheinen",
    "in vorbereitung",
    "i trykk",
    "i trykken",
    "under utgivelse",
    "under utgivning",
    "à paraître",
    "sous presse",
    "in corso di stampa",
    "en prensa",
];

/// What stands for the work that was cited before, the longest first.
const AS_BEFORE: [&str; 22] = [
    "sammesteds",
    "samme sted",
    "a. a. o",
    "loc. cit",
    "loc.cit",
    "loc cit",
    "op. cit",
    "op.cit",
    "op cit",
    "ibidem",
    "ebenda",
    "a.a.o",
    "eadem",
    "ibid",
    "idem",
    "ebda",
    "smst",
    "ebd",
    "ead",
    "sst",
    "ib",
    "id",
];

/// What joins names: "Nagy and Lord".
const JOINS: [&str; 10] = ["and", "und", "og", "et", "y", "e", "och", "en", "ed", "i"];

/// "et al.", the longest first.
const OTHERS: [&str; 16] = [
    "and others",
    "und andere",
    "et autres",
    "og andre",
    "et alii",
    "et. al.",
    "et coll.",
    "et al.",
    "m. fl.",
    "et al",
    "u. a.",
    "m.fl.",
    "u.a.",
    "mfl.",
    "e.a.",
    "m.fl",
];

/// Those who edit, as it is said after their names: "(eds.)".
const EDITING: [&str; 12] = ["eds", "ed", "hrsg", "hgg", "hg", "red", "dir", "org", "coord", "utg", "cur", "edd"];

/// Words that are written short with a full stop, after which a sentence
/// does not end.
const SHORT: &str = "cf cp vgl etc ibid ib op cit loc id ead al ed eds hg hgg hrsg red trans tr transl ubers overs \
repr rev vol vols bd bde ch chs chap chaps p pp s n nn no nos nr fig figs col cols fol fols l ll v vv esp bes sc \
viz ca c fl ff f sq sqq jf jfr sml st dr prof mr mrs ms mss jr sr univ diss ser suppl pl pt pts sec secs art \
app abb anm kap aufl ebd ebda par para paras cod frg fr frag schol ad sp abs bk bks";

fn set_of(words: &'static str, parted_by: char) -> HashSet<&'static str> {
    words.split(parted_by).map(str::trim).filter(|w| !w.is_empty()).collect()
}

fn said_before() -> &'static HashSet<&'static str> {
    static SET: OnceLock<HashSet<&'static str>> = OnceLock::new();
    SET.get_or_init(|| set_of(BEFORE, ';'))
}

fn no_names() -> &'static HashSet<&'static str> {
    static SET: OnceLock<HashSet<&'static str>> = OnceLock::new();
    SET.get_or_init(|| set_of(NO_NAMES, ' '))
}

fn written_short() -> &'static HashSet<&'static str> {
    static SET: OnceLock<HashSet<&'static str>> = OnceLock::new();
    SET.get_or_init(|| set_of(SHORT, ' '))
}

/// For every language, the words for every kind of locator, in their forms.
type Terms = BTreeMap<String, BTreeMap<String, BTreeMap<String, Vec<String>>>>;

/// Words in small letters, by the letter they begin with; each with what it
/// counts.
type Counted = HashMap<char, Vec<(Vec<char>, &'static str)>>;

/// The words that say what a locator counts, the longest first.
fn labels() -> &'static Counted {
    static WORDS: OnceLock<Counted> = OnceLock::new();
    WORDS.get_or_init(|| {
        let all: Terms = serde_json::from_str(TERMS_JSON).unwrap_or_default();
        let mut seen: HashSet<String> = HashSet::new();
        let mut words: Counted = HashMap::new();
        let mut add = |word: &str, label: &'static str| {
            let word = word.trim().to_lowercase();
            if let Some(first) = word.chars().next()
                && seen.insert(word.clone())
            {
                words.entry(first).or_default().push((word.chars().collect(), label));
            }
        };
        let others = all.keys().map(String::as_str).filter(|locale| !FIRST.contains(locale));
        for locale in FIRST.iter().copied().chain(others) {
            let Some(of_locale) = all.get(locale) else { continue };
            for label in LABELS {
                for word in of_locale.get(label).into_iter().flat_map(|forms| forms.values()).flatten() {
                    add(word, label);
                }
            }
        }
        // What is written and the styles do not have.
        for (word, label) in [
            ("ch.", "chapter"),
            ("chs.", "chapter"),
            ("chap.", "chapter"),
            ("chaps.", "chapter"),
            ("sect.", "section"),
            ("§§", "section"),
            ("§", "section"),
            ("¶", "paragraph"),
        ] {
            add(word, label);
        }
        for list in words.values_mut() {
            list.sort_by_key(|(word, _)| Reverse(word.len()));
        }
        words
    })
}

fn is_dash(c: char) -> bool {
    matches!(c, '-' | '–' | '—' | '‒' | '−' | '‐' | '‑')
}

/// What joins the letters of one word.
fn is_joint(c: char) -> bool {
    matches!(c, '-' | '‐' | '‑' | '\'' | '’')
}

fn small(c: char) -> char {
    c.to_lowercase().next().unwrap_or(c)
}

/// The value of a number written in the letters of the Romans.
fn roman_value(letters: &[char]) -> Option<u32> {
    let value = |c: char| match c.to_ascii_lowercase() {
        'i' => 1,
        'v' => 5,
        'x' => 10,
        'l' => 50,
        'c' => 100,
        'd' => 500,
        'm' => 1000,
        _ => 0,
    };
    let mut total: i64 = 0;
    for (i, c) in letters.iter().enumerate() {
        let here = value(*c);
        if here == 0 {
            return None;
        }
        let next = letters.get(i + 1).map_or(0, |n| value(*n));
        total += if here < next { -here } else { here };
    }
    u32::try_from(total).ok().filter(|n| *n > 0)
}

fn roman_of(mut number: u32) -> String {
    let mut out = String::new();
    for (value, letters) in [
        (1000, "m"),
        (900, "cm"),
        (500, "d"),
        (400, "cd"),
        (100, "c"),
        (90, "xc"),
        (50, "l"),
        (40, "xl"),
        (10, "x"),
        (9, "ix"),
        (5, "v"),
        (4, "iv"),
        (1, "i"),
    ] {
        while number >= value {
            out.push_str(letters);
            number -= value;
        }
    }
    out
}

/// Whether what stands here is a number in the letters of the Romans, or
/// two with a dash between them: "xii", "xii–xv". Where nothing says that
/// something is counted, only small numbers in small letters are taken for
/// numbers: "mix" and "civil" are words.
fn is_roman(token: &[char], labelled: bool) -> bool {
    let mut pieces = token.split(|c| is_dash(*c)).filter(|piece| !piece.is_empty()).peekable();
    if pieces.peek().is_none() {
        return false;
    }
    pieces.all(|piece| {
        let written: String = piece.iter().map(|c| c.to_ascii_lowercase()).collect();
        let small_letters = piece.iter().all(|c| matches!(c, 'i' | 'v' | 'x' | 'l'));
        (labelled || small_letters) && roman_value(piece).is_some_and(|value| roman_of(value) == written)
    })
}

/// Whether what stands here counts something: "73", "73–75", "73f",
/// "12r", "327a–c", "2:73", "1.1–7".
fn counts(token: &[char]) -> bool {
    if !token.first().is_some_and(char::is_ascii_digit) {
        return false;
    }
    let mut i = 0;
    while i < token.len() {
        let c = token[i];
        if c.is_ascii_digit() || is_dash(c) || matches!(c, '.' | ':' | ',') {
            i += 1;
        } else if c.is_alphabetic() {
            let from = i;
            while i < token.len() && token[i].is_alphabetic() {
                i += 1;
            }
            let run: String = token[from..i].iter().collect();
            if !matches!(run.as_str(), "f" | "ff" | "sq" | "sqq" | "n" | "nn" | "r" | "v" | "a" | "b" | "c" | "d" | "e")
            {
                return false;
            }
        } else {
            return false;
        }
    }
    true
}

/// A locator as it is kept: the dashes between numbers are one kind.
fn tidy(locator: &[char]) -> String {
    let mut out = String::new();
    let mut i = 0;
    while i < locator.len() {
        let c = locator[i];
        if is_dash(c) || c.is_whitespace() {
            let mut next = i;
            let mut dashes = false;
            while next < locator.len() && (is_dash(locator[next]) || locator[next].is_whitespace()) {
                dashes |= is_dash(locator[next]);
                next += 1;
            }
            let between = out.chars().last().is_some_and(char::is_alphanumeric)
                && locator.get(next).is_some_and(|c| c.is_alphanumeric());
            out.push(if dashes && between {
                '–'
            } else if dashes {
                c
            } else {
                ' '
            });
            i = if dashes && !between { i + 1 } else { next };
        } else {
            out.push(c);
            i += 1;
        }
    }
    out.trim().to_owned()
}

/// The text of a passage, letter by letter.
struct Text {
    chars: Vec<char>,
    /// The place of each letter in units of UTF-16, and that of the end.
    places: Vec<usize>,
}

/// A name in a text.
#[derive(Debug, Clone, Default)]
struct Name {
    end: usize,
    /// The family name, folded, as it is looked up.
    key: String,
    /// Whether the library has an author of the name.
    known: bool,
}

/// The names of those who wrote a work, in a text.
#[derive(Debug, Clone, Default)]
struct Names {
    start: usize,
    end: usize,
    keys: Vec<String>,
    /// Whether the library has an author of one of the names.
    known: bool,
    /// "et al."
    others: bool,
}

#[derive(Debug, Clone, Default)]
struct Year {
    start: usize,
    end: usize,
    /// The year, and the year it first came out where that is said. None,
    /// of "n.d." and its like.
    years: Vec<i32>,
    /// "1979a"
    letter: bool,
    /// "1985–1993"
    span: bool,
}

struct Locator {
    end: usize,
    text: String,
    /// What it counts. None for pages.
    label: Option<String>,
    /// Whether it is said what it counts.
    labelled: bool,
}

/// A work as it was found in a text.
#[derive(Debug, Clone, Default)]
struct Work {
    /// Where what belongs to it begins and ends.
    from: usize,
    to: usize,
    /// Where the words that name it begin.
    named: usize,
    /// Where what is said after it and its locator begins.
    rest: usize,
    words: String,
    keys: Vec<String>,
    locator: Option<String>,
    label: Option<String>,
    suppress: bool,
    suggestions: Vec<Suggestion>,
    /// What was found for the work itself, where the suggestions are those
    /// of the work before it.
    found: Vec<Suggestion>,
    /// A year and nothing else: no letter after it, no locator.
    letter: bool,
    span: bool,
    /// A name and a page and no year.
    no_year: bool,
    /// The part of a note it stands in.
    part: usize,
}

/// The works that were cited before, for "ibid." and "op. cit.".
#[derive(Debug, Clone, Default)]
struct Last {
    /// What was found for the work that was cited last, where one was.
    work: Option<Vec<Suggestion>>,
    /// And for the last work of each author.
    of: HashMap<String, Vec<Suggestion>>,
}

impl Last {
    fn keep(&mut self, work: &Work) {
        self.work = Some(work.found.clone());
        for key in &work.keys {
            self.of.insert(key.clone(), work.found.clone());
        }
    }

    /// The references of the work before, for a work that is said to be
    /// the same.
    fn again(found: &[Suggestion]) -> Vec<Suggestion> {
        found
            .iter()
            .map(|s| Suggestion {
                reference: s.reference.clone(),
                sure: s.sure.min(Sure::Likely),
                why: format!("the work cited before this: {}", s.why),
            })
            .collect()
    }
}

impl Text {
    fn new(passage: &Passage) -> Self {
        let mut chars = Vec::with_capacity(passage.text.len());
        let mut places = Vec::with_capacity(passage.text.len() + 1);
        let mut place = 0;
        for c in passage.text.chars() {
            let width = c.len_utf16();
            let taken = passage.taken.iter().any(|(from, to)| place < *to && place + width > *from);
            chars.push(if taken { NOTHING } else { c });
            places.push(place);
            place += width;
        }
        places.push(place);
        Text { chars, places }
    }

    /// What stands between two places. The end of a line within it is a
    /// blank as others are.
    fn said(&self, from: usize, to: usize) -> String {
        self.chars[from..to].iter().map(|c| if c.is_whitespace() { ' ' } else { *c }).collect()
    }

    fn lower(&self, from: usize, to: usize) -> String {
        self.chars[from..to].iter().map(|c| small(*c)).collect()
    }

    /// Where what is no blank begins.
    fn blank(&self, mut at: usize, to: usize) -> usize {
        while at < to && self.chars[at].is_whitespace() {
            at += 1;
        }
        at
    }

    fn trimmed(&self, mut from: usize, mut to: usize) -> (usize, usize) {
        from = self.blank(from, to);
        while to > from && self.chars[to - 1].is_whitespace() {
            to -= 1;
        }
        (from, to)
    }

    /// Where the word that begins here ends. Letters, and what joins them:
    /// a hyphen, an apostrophe, and the full stops within what is written
    /// short, "e.g" and "M.L".
    fn word(&self, at: usize, to: usize) -> usize {
        let mut i = at;
        let mut piece = at;
        while i < to {
            let c = self.chars[i];
            if c.is_alphabetic() {
                i += 1;
                continue;
            }
            let within = i > piece && i + 1 < to && self.chars[i + 1].is_alphabetic();
            if within && is_joint(c) {
                i += 1;
                piece = i;
                continue;
            }
            if within && c == '.' && i - piece <= 3 {
                let mut next = i + 1;
                while next < to && self.chars[next].is_alphabetic() {
                    next += 1;
                }
                if next - (i + 1) <= 3 {
                    i += 1;
                    piece = i;
                    continue;
                }
            }
            break;
        }
        i
    }

    /// Whether a word begins here.
    fn begins(&self, at: usize, floor: usize) -> bool {
        self.chars[at].is_alphabetic()
            && (at == floor || !(self.chars[at - 1].is_alphabetic() || is_joint(self.chars[at - 1])))
    }

    /// Whether the word is letters that stand for given names: "G", "M.L".
    fn initials(&self, from: usize, to: usize) -> bool {
        to > from && self.chars[from..to].split(|c| *c == '.').all(|piece| piece.len() == 1 && piece[0].is_uppercase())
    }

    /// How many words stand here.
    fn count(&self, from: usize, to: usize) -> usize {
        self.chars[from..to]
            .split(|c| c.is_whitespace())
            .filter(|token| token.iter().any(|c| c.is_alphanumeric()))
            .count()
    }

    /// The bracket that closes the one that opens here.
    fn closing(&self, open: usize) -> Option<usize> {
        let (opens, closes) = if self.chars[open] == '(' { ('(', ')') } else { ('[', ']') };
        let mut depth = 0;
        let end = self.chars.len().min(open + FAR);
        for at in open + 1..end {
            let c = self.chars[at];
            if c == NOTHING {
                return None;
            }
            if c == opens {
                depth += 1;
            } else if c == closes {
                if depth == 0 {
                    return Some(at);
                }
                depth -= 1;
            }
        }
        None
    }

    /// The parts between semicolons, outside of brackets within.
    fn parted(&self, from: usize, to: usize) -> Vec<(usize, usize)> {
        let mut parts = Vec::new();
        let mut begun = from;
        let mut depth = 0usize;
        for at in from..to {
            match self.chars[at] {
                '(' | '[' => depth += 1,
                ')' | ']' => depth = depth.saturating_sub(1),
                ';' if depth == 0 => {
                    parts.push((begun, at));
                    begun = at + 1;
                }
                _ => {}
            }
        }
        parts.push((begun, to));
        parts
    }

    /// Where what is said before a work ends, where it is of the words
    /// that are said before works: "see", "cf.", "vgl. auch".
    fn prefixed(&self, from: usize, to: usize) -> usize {
        let mut at = from;
        for _ in 0..3 {
            let mut words: Vec<String> = Vec::new();
            let mut ends: Vec<usize> = Vec::new();
            let mut i = at;
            while words.len() < 4 {
                let end = self.word(i, to);
                if end == i {
                    break;
                }
                words.push(self.lower(i, end).replace('.', "").replace('’', "'"));
                let closed = if end < to && self.chars[end] == '.' { end + 1 } else { end };
                ends.push(closed);
                let next = self.blank(closed, to);
                if next == closed {
                    break;
                }
                i = next;
            }
            let found = (1..=words.len()).rev().find(|n| said_before().contains(words[..*n].join(" ").as_str()));
            let Some(n) = found else { break };
            let mut end = ends[n - 1];
            if end < to && matches!(self.chars[end], ',' | ':') {
                end += 1;
            }
            // Something must follow it that it is said before.
            let next = self.blank(end, to);
            if next >= to {
                break;
            }
            at = next;
        }
        at
    }

    /// Where "ibid." and its like end, where they stand here.
    fn as_before(&self, at: usize, to: usize) -> Option<usize> {
        if at >= to || !self.chars[at].is_alphabetic() {
            return None;
        }
        for word in AS_BEFORE {
            let end = at + word.chars().count();
            if end <= to && (end == to || !self.chars[end].is_alphabetic()) && self.lower(at, end) == word {
                return Some(if end < to && self.chars[end] == '.' { end + 1 } else { end });
            }
        }
        None
    }

    /// Where "et al." and its like end, where they stand here.
    fn others(&self, at: usize, to: usize) -> Option<usize> {
        if at >= to || !self.chars[at].is_alphabetic() {
            return None;
        }
        for word in OTHERS {
            let end = at + word.chars().count();
            if end <= to && (end == to || !self.chars[end].is_alphabetic()) && self.lower(at, end) == word {
                return Some(end);
            }
        }
        None
    }

    /// Where the name begins that is joined to the one before: after "and".
    fn joined(&self, at: usize, to: usize) -> Option<usize> {
        if at >= to {
            return None;
        }
        let end = if self.chars[at] == '&' { at + 1 } else { self.word(at, to) };
        let joins = self.chars[at] == '&' || JOINS.contains(&self.said(at, end).as_str());
        let next = self.blank(end, to);
        (joins && next > end && next < to).then_some(next)
    }

    /// Where what says that they edit ends: "(eds.)", "ed.,".
    fn editing(&self, at: usize, to: usize) -> usize {
        let mut i = at;
        let bracket = i < to && self.chars[i] == '(';
        if bracket {
            i += 1;
        }
        let end = self.word(i, to);
        if end == i || !EDITING.contains(&self.lower(i, end).as_str()) {
            return at;
        }
        i = end;
        if i < to && self.chars[i] == '.' {
            i += 1;
        }
        if bracket {
            if i < to && self.chars[i] == ')' {
                i += 1;
            } else {
                return at;
            }
        }
        if i < to && self.chars[i] == ',' {
            i += 1;
        }
        self.blank(i, to)
    }

    /// A year of four numbers, from 1000 to 2099, with a letter after it or
    /// not: its value, where it ends, and whether it has the letter.
    fn one_year(&self, at: usize, to: usize) -> Option<(i32, usize, bool)> {
        if at + 4 > to || !self.chars[at..at + 4].iter().all(char::is_ascii_digit) {
            return None;
        }
        if at > 0 && self.chars[at - 1].is_alphanumeric() {
            return None;
        }
        let year: i32 = self.said(at, at + 4).parse().ok()?;
        if !(1000..=2099).contains(&year) {
            return None;
        }
        let end = at + 4;
        match self.chars.get(end).filter(|_| end < to) {
            Some(c) if c.is_ascii_digit() => None,
            Some(c) if c.is_alphabetic() => {
                let alone = c.is_ascii_lowercase() && !self.chars.get(end + 1).is_some_and(|n| n.is_alphanumeric());
                alone.then_some((year, end + 1, true))
            }
            _ => Some((year, end, false)),
        }
    }

    /// The year of a work: "1979", "1979a", "[1979] 1999", "1999 [1979]",
    /// "1985–1993", "n.d.", "forthcoming".
    fn year(&self, at: usize, to: usize) -> Option<Year> {
        if at >= to {
            return None;
        }
        if self.chars[at] == '[' {
            // The year it first came out, and then the year of what is cited.
            let (first, end, letter) = self.one_year(at + 1, to)?;
            if end >= to || self.chars[end] != ']' {
                return None;
            }
            let next = self.blank(end + 1, to);
            return Some(match self.one_year(next, to) {
                Some((year, end, letter)) => Year { start: at, end, years: vec![year, first], letter, span: false },
                None => Year { start: at, end: end + 1, years: vec![first], letter, span: false },
            });
        }
        if let Some((year, mut end, letter)) = self.one_year(at, to) {
            let mut found = Year { start: at, end, years: vec![year], letter, span: false };
            // "1985–1993", "1985–93", "1979/1980"
            if end < to && (is_dash(self.chars[end]) || self.chars[end] == '/') {
                let mut stop = end + 1;
                while stop < to && self.chars[stop].is_ascii_digit() {
                    stop += 1;
                }
                let closed = !self.chars.get(stop).is_some_and(|c| stop < to && c.is_alphanumeric());
                if matches!(stop - end - 1, 2 | 4) && closed {
                    found.span = is_dash(self.chars[end]);
                    if stop - end - 1 == 4
                        && let Ok(second) = self.said(end + 1, stop).parse::<i32>()
                        && self.chars[end] == '/'
                    {
                        found.years.push(second);
                    }
                    end = stop;
                }
            }
            // "1999 [1979]"
            let next = self.blank(end, to);
            if next < to
                && self.chars[next] == '['
                && let Some((first, stop, _)) = self.one_year(next + 1, to)
                && stop < to
                && self.chars[stop] == ']'
            {
                found.years.push(first);
                end = stop + 1;
            }
            found.end = end;
            return Some(found);
        }
        if !self.chars[at].is_alphabetic() {
            return None;
        }
        NO_YEAR.iter().find_map(|word| {
            let end = at + word.chars().count();
            let whole = end <= to && (end == to || !self.chars[end].is_alphanumeric());
            (whole && self.lower(at, end) == *word).then(|| Year { start: at, end, ..Default::default() })
        })
    }

    /// The last year that stands between two places.
    fn year_within(&self, from: usize, to: usize) -> Option<Year> {
        (from..to).rev().filter(|at| self.chars[*at].is_ascii_digit()).find_map(|at| {
            let (year, end, letter) = self.one_year(at, to)?;
            Some(Year { start: at, end, years: vec![year], letter, span: false })
        })
    }

    /// What says what a locator counts, where it stands here, and where it
    /// ends.
    fn label(&self, at: usize, to: usize) -> Option<(&'static str, usize)> {
        if at >= to {
            return None;
        }
        for (word, label) in labels().get(&small(self.chars[at]))? {
            let end = at + word.len();
            if end > to || !word.iter().zip(&self.chars[at..end]).all(|(w, c)| *w == small(*c)) {
                continue;
            }
            let whole =
                !word.last().is_some_and(|c| c.is_alphabetic()) || end == to || !self.chars[end].is_alphabetic();
            let counted = self.blank(end, to);
            if whole && counted < to && self.chars[counted].is_alphanumeric() {
                return Some((label, end));
            }
        }
        None
    }

    /// The locator that begins here: "73", "pp. 73–75", "73f.", "ch. 3",
    /// "73, 75 n. 4".
    fn locator(&self, at: usize, to: usize) -> Option<Locator> {
        if at >= to {
            return None;
        }
        let (label, begun) = match self.label(at, to) {
            Some((label, end)) => (Some(label), self.blank(end, to)),
            None => (None, at),
        };
        let mut end = begun;
        let mut at = begun;
        let mut count = 0;
        // Whether a number may follow: at the beginning, after a comma,
        // after a dash, after what says what is counted.
        let mut open = true;
        while at < to {
            let from = self.blank(at, to);
            let mut stop = from;
            while stop < to && !self.chars[stop].is_whitespace() {
                stop += 1;
            }
            let mut bare = stop;
            while bare > from && matches!(self.chars[bare - 1], ',' | ';' | '.' | ':' | ')' | ']' | '”' | '"') {
                bare -= 1;
            }
            let token = &self.chars[from..bare];
            if token.is_empty() {
                break;
            }
            let written: String = token.iter().collect();
            let goes_on = matches!(written.as_str(), "f" | "ff" | "sq" | "sqq");
            let dash = token.len() == 1 && is_dash(token[0]);
            if count > 0
                && !goes_on
                && !dash
                && let Some((_, after)) = self.label(from, to)
            {
                // "73 n. 4": what is counted within what is counted.
                at = after;
                open = true;
                continue;
            }
            let fits = if count == 0 {
                match label {
                    Some("sub-verbo") => true,
                    Some(_) => counts(token) || is_roman(token, true),
                    None => counts(token) || is_roman(token, false),
                }
            } else if goes_on {
                true
            } else if dash {
                let next = self.blank(stop, to);
                next < to && self.chars[next].is_ascii_digit()
            } else {
                open && counts(token)
            };
            if !fits {
                break;
            }
            count += 1;
            at = stop;
            if dash {
                open = true;
                continue;
            }
            // "f." and "ff." keep their stop; a number does not.
            let keeps = bare < stop
                && self.chars[bare] == '.'
                && token.last().is_some_and(|c| c.is_alphabetic())
                && !is_roman(token, true);
            end = if keeps { bare + 1 } else { bare };
            let closed: String = self.chars[end..stop].iter().collect();
            match closed.as_str() {
                "" => open = false,
                "," => open = true,
                _ => break,
            }
        }
        if count == 0 || end <= begun {
            return None;
        }
        Some(Locator {
            end,
            text: tidy(&self.chars[begun..end]),
            label: label.filter(|l| *l != "page").map(str::to_owned),
            labelled: label.is_some(),
        })
    }

    /// The name that begins here. Where `loose`, as within brackets, the
    /// letters of given names may stand before it, and a name the library
    /// does not have may be of several words.
    fn name(&self, at: usize, to: usize, shelf: &Shelf, loose: bool) -> Option<Name> {
        let mut first = at;
        if loose {
            for _ in 0..4 {
                let end = self.word(first, to);
                if end > first && end < to && self.chars[end] == '.' && self.initials(first, end) {
                    first = self.blank(end + 1, to);
                } else {
                    break;
                }
            }
        }
        // "van der Valk"
        let mut begun = first;
        for _ in 0..3 {
            let end = self.word(begun, to);
            let next = self.blank(end, to);
            if end > begun && next > end && next < to && PARTICLES.contains(&self.said(begun, end).as_str()) {
                begun = next;
            } else {
                break;
            }
        }
        if begun >= to || !self.chars[begun].is_uppercase() {
            return None;
        }
        // The words that may be of the name, each with where it ends.
        let most = shelf.longest_name().max(3);
        let mut words: Vec<(usize, usize)> = Vec::new();
        let mut i = begun;
        while words.len() < most {
            let end = self.word(i, to);
            if end == i {
                break;
            }
            words.push((i, end));
            if end + 1 < to && self.chars[end].is_whitespace() && self.chars[end + 1].is_alphabetic() {
                i = end + 1;
            } else {
                break;
            }
        }
        // The longest that the library has.
        for &(_, end) in words.iter().rev() {
            for from in [first, begun] {
                let key = fold(&self.said(from, end));
                if !shelf.named(&key).is_empty() {
                    return Some(Name { end, key, known: true });
                }
            }
        }
        if loose {
            // "Gregory Nagy": a family name the library has, after given names.
            for (n, &(from, _)) in words.iter().enumerate().skip(1) {
                if !words[..n].iter().all(|(start, _)| self.chars[*start].is_uppercase()) {
                    break;
                }
                for &(_, end) in words[n..].iter().rev() {
                    let key = fold(&self.said(from, end));
                    if !shelf.named(&key).is_empty() {
                        return Some(Name { end, key, known: true });
                    }
                }
            }
        }
        // One the library does not have: words that begin with a capital,
        // and are no words of the language.
        let mut end = begun;
        for &(from, stop) in words.iter().take(if loose { 3 } else { 1 }) {
            if !self.chars[from].is_uppercase() {
                break;
            }
            let letters = self.chars[from..stop].iter().filter(|c| c.is_alphabetic()).count();
            if letters < 2 || fold(&self.said(from, stop)).split(' ').any(|piece| no_names().contains(piece)) {
                return None;
            }
            end = stop;
        }
        (end > begun).then(|| Name { end, key: fold(&self.said(first, end)), known: false })
    }

    /// The names that are joined to the first: "and Lord", ", Lord and
    /// Parry", "et al.".
    fn more_names(&self, mut names: Names, to: usize, shelf: &Shelf, loose: bool) -> Names {
        loop {
            let here = self.blank(names.end, to);
            let comma = here < to && self.chars[here] == ',';
            let after = if comma { self.blank(here + 1, to) } else { here };
            if after > names.end
                && let Some(end) = self.others(after, to)
            {
                names.others = true;
                names.end = end;
                break;
            }
            if let Some(next) = self.joined(after, to)
                && let Some(name) = self.name(next, to, shelf, loose)
            {
                names.known |= name.known;
                names.end = name.end;
                names.keys.push(name.key);
                continue;
            }
            if comma {
                // "Nagy, Lord and Parry": names in a row, if the row ends as one.
                let mut row: Vec<Name> = Vec::new();
                let mut at = here;
                while at < to
                    && self.chars[at] == ','
                    && let Some(name) = self.name(self.blank(at + 1, to), to, shelf, loose)
                {
                    at = self.blank(name.end, to);
                    row.push(name);
                }
                let last = if at < to && self.chars[at] == ',' { self.blank(at + 1, to) } else { at };
                let ends = self.others(last, to).is_some()
                    || self.joined(last, to).is_some_and(|next| self.name(next, to, shelf, loose).is_some());
                if !row.is_empty() && ends {
                    for name in row {
                        names.known |= name.known;
                        names.end = name.end;
                        names.keys.push(name.key);
                    }
                    continue;
                }
            }
            break;
        }
        names
    }

    fn names(&self, at: usize, to: usize, shelf: &Shelf, loose: bool) -> Option<Names> {
        let first = self.name(at, to, shelf, loose)?;
        let names = Names { start: at, end: first.end, known: first.known, keys: vec![first.key], others: false };
        Some(self.more_names(names, to, shelf, loose))
    }

    /// The names that stand before a bracket, and whether what is in the
    /// bracket is said to be theirs: "Nagy (1979)", "Nagy's (1979)".
    fn names_before(&self, open: usize, floor: usize, shelf: &Shelf) -> Option<(Names, bool)> {
        let mut end = open;
        while end > floor && open - end < 2 && self.chars[end - 1].is_whitespace() {
            end -= 1;
        }
        let mut theirs = false;
        if end >= floor + 3 && matches!(self.chars[end - 2], '\'' | '’') && self.chars[end - 1] == 's' {
            end -= 2;
            theirs = true;
        } else if end >= floor + 2 && matches!(self.chars[end - 1], '\'' | '’') {
            end -= 1;
            theirs = true;
        }
        if end <= floor || !(self.chars[end - 1].is_alphabetic() || self.chars[end - 1] == '.') {
            return None;
        }
        // The beginnings of the words before it.
        let mut starts: Vec<usize> = Vec::new();
        let mut at = end;
        while at > floor && end - at < 80 && starts.len() < 8 {
            at -= 1;
            let c = self.chars[at];
            if c == NOTHING || matches!(c, '(' | ')' | '[' | ']' | ';' | ':' | '!' | '?' | '“' | '”' | '"') {
                break;
            }
            if self.begins(at, floor) {
                starts.push(at);
            }
        }
        // The farthest from which names go on until the bracket.
        starts
            .iter()
            .rev()
            .find_map(|&start| self.names(start, end, shelf, false).filter(|names| names.end == end))
            .map(|names| (names, theirs))
    }

    fn looked_up(shelf: &Shelf, keys: &[String], years: &[i32], titled: &[(usize, usize)]) -> Vec<Suggestion> {
        shelf.by_words(&Words { names: keys, years, titled })
    }

    /// What stands after a work within brackets: its locator, and what is
    /// said after that. False, where what stands there is neither.
    fn tail(&self, work: &mut Work, at: usize, to: usize) -> bool {
        work.rest = at;
        work.to = to;
        let here = self.blank(at, to);
        if here >= to {
            return true;
        }
        let parted = matches!(self.chars[here], ',' | ':');
        let begun = if parted { self.blank(here + 1, to) } else { here };
        match self.locator(begun, to) {
            Some(found) if parted || found.labelled || work.no_year => {
                work.locator = Some(found.text);
                work.label = found.label;
                work.rest = found.end;
            }
            _ if self.chars[here] == ':' || work.no_year => return false,
            _ => {}
        }
        let here = self.blank(work.rest, to);
        if here >= to {
            return true;
        }
        // What is said after it is set apart from it, and is short.
        if !matches!(self.chars[here], ',' | '(' | '[' | '–' | '—') {
            return false;
        }
        let known = work.suggestions.iter().any(|s| s.sure >= Sure::Likely);
        self.count(here, to) <= if known { 12 } else { 6 }
    }

    /// The names and the year that begin here.
    fn lead(&self, at: usize, to: usize, shelf: &Shelf, alone: bool) -> Option<(Names, Option<Year>)> {
        let names = self.names(at, to, shelf, true)?;
        let mut here = self.blank(names.end, to);
        if here < to && self.chars[here] == ',' {
            here = self.blank(here + 1, to);
        }
        here = self.editing(here, to);
        if let Some(year) = self.year(here, to) {
            // A time that is no year of a work: "(Napoleon 1769–1821)".
            return (!year.span || names.known).then_some((names, Some(year)));
        }
        // A name and a page and no year: only where the library has an
        // author of the name, and the name is the only word before the
        // number.
        let next = self.blank(names.end, to);
        let one =
            names.keys.len() == 1 && !names.others && !self.chars[at..names.end].iter().any(|c| c.is_whitespace());
        let numbers = self.chars[next.min(to)..to].iter().take_while(|c| c.is_ascii_digit()).count();
        let paged = next > names.end && (1..=4).contains(&numbers);
        (alone && one && paged && names.known).then_some((names, None))
    }

    /// As `lead`, after a few words that are said before a work and are
    /// not of those that are known: only where the library has the work.
    fn lead_known(&self, from: usize, to: usize, shelf: &Shelf) -> Option<(Names, Option<Year>)> {
        if shelf.is_empty() {
            return None;
        }
        let mut at = from;
        for _ in 0..5 {
            let end = self.word(at, to);
            if end == at {
                return None;
            }
            let mut closed = end;
            while closed < to && matches!(self.chars[closed], '.' | ',' | ':') {
                closed += 1;
            }
            let next = self.blank(closed, to);
            if next == closed || next >= to {
                return None;
            }
            at = next;
            if self.chars[at].is_uppercase()
                && let Some((names, Some(year))) = self.lead(at, to, shelf, false)
                && names.keys.iter().any(|key| shelf.has(key, &year.years))
            {
                return Some((names, Some(year)));
            }
        }
        None
    }

    /// What one part of what stands in brackets cites: a work, or several
    /// of the same authors; and the authors. Nothing, where it is no
    /// citation.
    fn part(
        &self,
        from: usize,
        to: usize,
        carried: Option<&Names>,
        shelf: &Shelf,
        last: &Last,
    ) -> Option<(Vec<Work>, Option<Names>)> {
        let (from, to) = self.trimmed(from, to);
        if from >= to {
            return None;
        }
        // A year and nothing before it: of the authors that were named before.
        let theirs = carried.filter(|_| self.year(from, to).is_some());
        let (names, year) = match theirs {
            Some(names) => (names.clone(), self.year(from, to)),
            None => {
                let begun = self.prefixed(from, to);
                if let Some(end) = self.as_before(begun, to) {
                    let before = last.work.as_ref()?;
                    let mut work = Work {
                        from,
                        named: begun,
                        words: self.said(begun, end),
                        suggestions: Last::again(before),
                        found: before.clone(),
                        ..Default::default()
                    };
                    return self.tail(&mut work, end, to).then(|| (vec![work], None));
                }
                self.lead(begun, to, shelf, begun == from).or_else(|| self.lead_known(from, to, shelf))?
            }
        };
        let own = theirs.is_none();
        let who = self.said(names.start, names.end);
        let work_of = |year: Option<&Year>, written: String, named: usize| -> Work {
            let years = year.map(|y| y.years.clone()).unwrap_or_default();
            let found = Self::looked_up(shelf, &names.keys, &years, &[]);
            Work {
                from: named,
                named,
                words: written,
                keys: names.keys.clone(),
                suggestions: found.clone(),
                found,
                letter: year.is_some_and(|y| y.letter),
                span: year.is_some_and(|y| y.span),
                no_year: year.is_none(),
                ..Default::default()
            }
        };

        let Some(year) = year else {
            let mut work = work_of(None, who, names.start);
            work.from = from;
            return self.tail(&mut work, names.end, to).then(|| (vec![work], Some(names)));
        };
        let written =
            if own { self.said(names.start, year.end) } else { format!("{who} {}", self.said(year.start, year.end)) };
        let mut work = work_of(Some(&year), written, if own { names.start } else { year.start });
        work.from = from;

        // Other works of theirs: "1979, 1990", "1979a, b".
        let mut works = Vec::new();
        let mut at = year.end;
        let mut lettered = year.letter;
        loop {
            let here = self.blank(at, to);
            if here >= to || self.chars[here] != ',' {
                break;
            }
            let next = self.blank(here + 1, to);
            let (more, written) = match self.year(next, to).filter(|more| !more.years.is_empty()) {
                Some(more) => {
                    let written = format!("{who} {}", self.said(more.start, more.end));
                    (more, written)
                }
                None => {
                    let letter = lettered
                        && next < to
                        && self.chars[next].is_ascii_lowercase()
                        && !self.chars.get(next + 1).is_some_and(|c| next + 1 < to && c.is_alphanumeric());
                    if !letter {
                        break;
                    }
                    let years: Vec<i32> = year.years.iter().take(1).copied().collect();
                    let written = format!("{who} {}{}", years.first().copied().unwrap_or_default(), self.chars[next]);
                    (Year { start: next, end: next + 1, years, letter: true, span: false }, written)
                }
            };
            work.to = at;
            work.rest = at;
            works.push(work);
            work = work_of(Some(&more), written, more.start);
            lettered = more.letter;
            at = more.end;
        }
        if !self.tail(&mut work, at, to) {
            return None;
        }
        works.push(work);
        Some((works, Some(names)))
    }

    /// What stands in brackets, if it cites: where the citation begins, how
    /// the authors stand, and the works.
    fn cited(
        &self,
        open: usize,
        close: usize,
        floor: usize,
        shelf: &Shelf,
        last: &Last,
    ) -> Option<(usize, CiteMode, Vec<Work>)> {
        let (from, to) = self.trimmed(open + 1, close);
        if from >= to {
            return None;
        }
        let within = &self.chars[from..to];
        if !within.iter().any(char::is_ascii_digit) {
            // Without a number it cites only where it says that there is
            // no year, or that the work is the one before.
            let said = self.lower(from, to);
            let cites = NO_YEAR.iter().chain(AS_BEFORE.iter()).any(|word| said.contains(word));
            if !cites {
                return None;
            }
        }

        // A year first: the names stand before the bracket.
        let mut start = open;
        let mut mode = CiteMode::Normal;
        let mut carried: Option<Names> = None;
        let mut theirs = false;
        let leads = self.year(from, to).is_some();
        if leads {
            let (names, owned) = self.names_before(open, floor, shelf)?;
            theirs = owned;
            if !owned {
                mode = CiteMode::Intext;
                start = names.start;
            }
            carried = Some(names);
        }

        let parts = self.parted(from, to);
        let mut works: Vec<Work> = Vec::new();
        for (n, (part_from, part_to)) in parts.iter().copied().enumerate() {
            match self.part(part_from, part_to, carried.as_ref(), shelf, last) {
                Some((mut found, names)) => {
                    if n == 0 && leads {
                        for work in &mut found {
                            work.suppress = theirs;
                        }
                        if let (Some(first), Some(names), false) = (found.first_mut(), &carried, theirs) {
                            first.from = names.start;
                            first.named = names.start;
                        }
                    }
                    if names.is_some() {
                        carried = names;
                    }
                    works.extend(found);
                }
                // A few words after the last work, which say something of
                // it: "emphasis added".
                None if n > 0 && n + 1 == parts.len() && self.count(part_from, part_to) <= 4 => {
                    let (_, end) = self.trimmed(part_from, part_to);
                    works.last_mut()?.to = end;
                }
                None => return None,
            }
        }
        if leads {
            // A name before a year in brackets is what much else looks
            // like: "Rome (1957)", "Napoleon (1769–1821)". It cites where
            // the library has the name, or something says that it does.
            let names = carried.as_ref()?;
            let first = works.first()?;
            let says = first.locator.is_some() || first.letter || names.others || works.len() > 1;
            if !(names.known || says) || (first.span && first.locator.is_none()) {
                return None;
            }
        }
        Some((start, mode, works))
    }

    fn item(&self, work: &Work) -> ProposedItem {
        ProposedItem {
            start: self.places[work.from],
            end: self.places[work.to],
            words: work.words.clone(),
            locator: work.locator.clone(),
            label: work.label.clone(),
            prefix: self.before(work.from, work.named),
            suffix: self.after(work.rest, work.to),
            suppress_author: work.suppress,
            suggestions: work.suggestions.clone(),
        }
    }

    /// What is said before a work, as it is kept.
    fn before(&self, from: usize, to: usize) -> Option<String> {
        if to <= from {
            return None;
        }
        let said = self.said(from, to);
        let said = said.trim().trim_start_matches([';', ',', '.']).trim();
        said.chars().any(char::is_alphanumeric).then(|| said.to_owned())
    }

    /// What is said after a work, as it is kept: with what sets it apart
    /// from the work, and without what ends it.
    fn after(&self, from: usize, to: usize) -> Option<String> {
        if to <= from {
            return None;
        }
        let said = self.said(from, to);
        let mut said = said.trim().trim_end_matches([';', ',']).trim_end();
        if let Some(without) = said.strip_suffix('.') {
            let word: String =
                without.chars().rev().take_while(|c| c.is_alphabetic()).collect::<Vec<_>>().into_iter().rev().collect();
            let short = word.chars().count() == 1 || written_short().contains(fold(&word).as_str());
            if !short {
                said = without.trim_end();
            }
        }
        said.chars().any(char::is_alphanumeric).then(|| said.to_owned())
    }

    /// What looks like citations in the line.
    fn in_line(&self, passage: &Passage, shelf: &Shelf, last: &mut Last, out: &mut Vec<Proposal>) {
        let mut at = 0;
        let mut floor = 0;
        while at < self.chars.len() {
            if matches!(self.chars[at], '(' | '[')
                && let Some(close) = self.closing(at)
                && let Some((start, mode, works)) = self.cited(at, close, floor, shelf, last)
            {
                for work in &works {
                    last.keep(work);
                }
                out.push(Proposal {
                    passage: passage.id.clone(),
                    start: self.places[start],
                    end: self.places[close + 1],
                    mode,
                    items: works.iter().map(|work| self.item(work)).collect(),
                });
                at = close + 1;
                floor = at;
            } else {
                at += 1;
            }
        }
    }

    /// The parts of a note: between its semicolons, and its sentences.
    fn sentences(&self, from: usize, to: usize) -> Vec<(usize, usize)> {
        let mut parts = Vec::new();
        let mut begun = from;
        let mut depth = 0usize;
        let mut at = from;
        while at < to {
            let c = self.chars[at];
            match c {
                '(' | '[' => depth += 1,
                ')' | ']' => depth = depth.saturating_sub(1),
                ';' if depth == 0 => {
                    parts.push((begun, at));
                    begun = at + 1;
                }
                '.' if depth == 0 && self.ends_a_sentence(at, from, to) => {
                    // The stop of what is written short is of the word.
                    let of_the_word = at > from && self.chars[at - 1].is_alphabetic() && self.is_short(at, from);
                    parts.push((begun, if of_the_word { at + 1 } else { at }));
                    begun = at + 1;
                }
                _ => {}
            }
            at += 1;
        }
        parts.push((begun, to));
        parts.into_iter().map(|(from, to)| self.trimmed(from, to)).filter(|(from, to)| to > from).collect()
    }

    /// Whether the word before the full stop here is written short: "cf.",
    /// "ibid.", the letter of a given name.
    fn is_short(&self, at: usize, from: usize) -> bool {
        let mut start = at;
        while start > from && (self.chars[start - 1].is_alphabetic() || self.chars[start - 1] == '.') {
            start -= 1;
        }
        let word = self.lower(start, at);
        word.chars().count() == 1 || word.contains('.') || written_short().contains(fold(&word).as_str())
    }

    /// Whether the full stop here ends a sentence: a capital follows, and
    /// what stands before it is not written short.
    fn ends_a_sentence(&self, at: usize, from: usize, to: usize) -> bool {
        let next = self.blank(at + 1, to);
        if next == at + 1 || next >= to {
            return false;
        }
        let mut begins = next;
        while begins < to && matches!(self.chars[begins], '“' | '‘' | '"' | '«' | '„') {
            begins += 1;
        }
        if begins >= to || !self.chars[begins].is_uppercase() {
            return false;
        }
        let mut start = at;
        while start > from && (self.chars[start - 1].is_alphabetic() || self.chars[start - 1] == '.') {
            start -= 1;
        }
        if start == at {
            // A number, or a bracket that closes.
            return true;
        }
        let word = self.lower(start, at);
        let short = word.chars().count() == 1 || word.contains('.') || written_short().contains(fold(&word).as_str());
        if !short {
            return true;
        }
        // After "ibid." and "et al." a sentence may end all the same, if
        // what follows is said before a work: "Ibid. See also …".
        let closes =
            matches!(word.as_str(), "ibid" | "ibidem" | "cit" | "id" | "idem" | "al" | "f" | "ff" | "sq" | "sqq");
        closes && self.prefixed(begins, to) > begins
    }

    /// A name that the library has, where one begins here.
    fn known(&self, at: usize, to: usize, shelf: &Shelf) -> Option<Name> {
        let own = |from: usize, end: usize| -> usize {
            // "Nagy's": the name without what says that something is theirs.
            if end >= from + 3 && matches!(self.chars[end - 2], '\'' | '’') && self.chars[end - 1] == 's' {
                end - 2
            } else {
                end
            }
        };
        let end = self.word(at, to);
        let first = fold(&self.said(at, own(at, end)));
        if !shelf.begins_a_name(first.split(' ').next()?) {
            return None;
        }
        let mut ends = vec![end];
        let mut i = end;
        while ends.len() < shelf.longest_name() && i + 1 < to && self.chars[i].is_whitespace() {
            let end = self.word(i + 1, to);
            if end == i + 1 {
                break;
            }
            ends.push(end);
            i = end;
        }
        ends.iter().rev().find_map(|&end| {
            let end = own(at, end);
            let key = fold(&self.said(at, end));
            (!shelf.named(&key).is_empty()).then_some(Name { end, key, known: true })
        })
    }

    /// The words that follow a name, as far as they may be a title, each
    /// with where it ends.
    fn following(&self, at: usize, to: usize) -> (Vec<Said>, Vec<usize>) {
        let mut said = Vec::new();
        let mut ends = Vec::new();
        let mut i = at;
        while i < to && matches!(self.chars[i], '“' | '‘' | '"' | '\'' | '«' | '„') {
            i += 1;
        }
        while i < to && said.len() < 24 {
            let end = self.word(i, to);
            if end == i {
                break;
            }
            // A colon or a dash within a title does not end it.
            let mut next = self.blank(end, to);
            if next < to && (self.chars[next] == ':' || (is_dash(self.chars[next]) && next > end)) {
                next = self.blank(next + 1, to);
            }
            let goes_on = next < to && next > end && self.chars[next].is_alphabetic();
            let folded = fold(&self.said(i, end));
            let pieces: Vec<&str> = folded.split(' ').filter(|piece| !piece.is_empty()).collect();
            for (n, piece) in pieces.iter().enumerate() {
                said.push(Said { word: (*piece).to_owned(), ends: !goes_on && n + 1 == pieces.len() });
                ends.push(end);
            }
            if !goes_on {
                break;
            }
            i = next;
        }
        (said, ends)
    }

    /// Where the names begin with what stands before them and is of them:
    /// "G. Nagy", "Gregory Nagy", "van der Valk".
    fn with_given(&self, mut named: usize, floor: usize, works: &[usize], shelf: &Shelf) -> usize {
        while named > floor + 1 && self.chars[named - 1].is_whitespace() {
            let mut stop = named - 1;
            let stopped = self.chars[stop - 1] == '.';
            if stopped {
                stop -= 1;
            }
            let mut begin = stop;
            while begin > floor
                && (self.chars[begin - 1].is_alphabetic()
                    || (self.chars[begin - 1] == '.' && begin - 1 > floor && self.chars[begin - 2].is_alphabetic()))
            {
                begin -= 1;
            }
            if begin == stop {
                break;
            }
            let word = self.said(begin, stop);
            let is_of_it = if stopped {
                self.initials(begin, stop)
            } else {
                PARTICLES.contains(&word.as_str())
                    || (self.chars[begin].is_uppercase() && shelf.is_given(works, &fold(&word)))
            };
            if !is_of_it {
                break;
            }
            named = begin;
        }
        named
    }

    /// The work that is named by a name of the library, with the title or
    /// the year that follows it.
    fn work_at(&self, at: usize, name: Name, floor: usize, to: usize, shelf: &Shelf, last: &Last) -> Option<Work> {
        let works: Vec<usize> = shelf.named(&name.key).to_vec();
        let first = Names { start: at, end: name.end, known: true, keys: vec![name.key.clone()], others: false };
        let theirs = name.end < to && matches!(self.chars[name.end], '\'' | '’');
        let names = if theirs { first } else { self.more_names(first, to, shelf, false) };
        let named = self.with_given(at, floor, &works, shelf);
        let who = self.said(named, names.end);

        let mut here = names.end;
        if theirs {
            here = self.word(here + 1, to);
        }
        here = self.editing(self.blank(here, to), to);
        if here < to && matches!(self.chars[here], ',' | ':') {
            here = self.blank(here + 1, to);
        }
        let mut work = Work { from: floor, named, keys: names.keys.clone(), ..Default::default() };

        // "Nagy, op. cit., 75": the work of theirs that was cited before.
        if let Some(end) = self.as_before(here, to) {
            let before = last.of.get(&name.key)?;
            work.words = self.said(named, end);
            work.suggestions = Last::again(before);
            work.found = before.clone();
            self.rest_of(&mut work, end, to);
            return Some(work);
        }

        let (following, ends) = self.following(here, to);
        let titled: Vec<(usize, usize)> = works
            .iter()
            .map(|&entry| (entry, shelf.title_run(entry, &following)))
            .filter(|(_, run)| *run > 0)
            .collect();
        let most = titled.iter().map(|(_, run)| *run).max().unwrap_or(0);
        let mut years: Vec<i32> = Vec::new();
        let end;
        if most > 0 {
            let mut stop = ends[most - 1];
            // The marks that close the title, and the comma that some set
            // within them: “Singer of Tales,” 12.
            let closes = |at: usize| at < to && matches!(self.chars[at], '”' | '’' | '"' | '\'' | '»' | '“');
            let mut closed =
                if stop < to && matches!(self.chars[stop], ',' | '.') && closes(stop + 1) { stop + 1 } else { stop };
            while closes(closed) {
                closed += 1;
                stop = closed;
            }
            work.words = self.said(named, stop);
            // The year after it: in brackets, with where it came out or
            // without, or after a comma.
            let next = self.blank(stop, to);
            if next < to
                && matches!(self.chars[next], '(' | '[')
                && let Some(close) = self.closing(next).filter(|close| *close < to)
                && let Some(year) = self.year_within(next + 1, close)
            {
                years = year.years;
                stop = close + 1;
                work.words = self.said(named, stop);
            } else if next < to
                && self.chars[next] == ','
                && let Some(year) = self.year(self.blank(next + 1, to), to).filter(|year| !year.years.is_empty())
                && {
                    let then = self.blank(year.end, to);
                    then >= to || matches!(self.chars[then], ',' | ')' | '.' | ';')
                }
            {
                years = year.years.clone();
                stop = year.end;
                work.words = self.said(named, stop);
            }
            end = stop;
        } else {
            // A year after the names, and nothing between them.
            let open = (here < to && matches!(self.chars[here], '(' | '[')).then_some(here);
            let begun = if open.is_some() { self.blank(here + 1, to) } else { here };
            let year = self.year(begun, to).filter(|year| !year.years.is_empty())?;
            years = year.years.clone();
            work.letter = year.letter;
            match open {
                None => {
                    work.words = self.said(named, year.end);
                    end = year.end;
                }
                Some(open) => {
                    let close = self.closing(open).filter(|close| *close < to)?;
                    let inside = self.blank(year.end, close);
                    let parted = inside < close && matches!(self.chars[inside], ',' | ':');
                    let begun = if parted { self.blank(inside + 1, close) } else { inside };
                    let within =
                        self.locator(begun, close).filter(|found| parted && self.blank(found.end, close) == close);
                    match within {
                        // "Nagy (1979, 73)"
                        Some(found) => {
                            work.words = format!("{who} {}", self.said(year.start, year.end));
                            work.locator = Some(found.text);
                            work.label = found.label;
                            work.rest = close + 1;
                            work.to = close + 1;
                            work.suggestions = Self::looked_up(shelf, &names.keys, &years, &titled);
                            work.found = work.suggestions.clone();
                            return Some(work);
                        }
                        None if inside == close => {
                            work.words = format!("{who} {}", self.said(year.start, year.end));
                            end = close + 1;
                        }
                        None => return None,
                    }
                }
            }
        }
        work.suggestions = Self::looked_up(shelf, &names.keys, &years, &titled);
        work.found = work.suggestions.clone();
        self.rest_of(&mut work, end, to);
        Some(work)
    }

    /// The locator after a work in a note, and where what is left begins.
    fn rest_of(&self, work: &mut Work, at: usize, to: usize) {
        work.rest = at;
        work.to = at;
        let here = self.blank(at, to);
        let parted = here < to && matches!(self.chars[here], ',' | ':');
        let begun = if parted { self.blank(here + 1, to) } else { here };
        if let Some(found) = self.locator(begun, to) {
            work.locator = Some(found.text);
            work.label = found.label;
            work.rest = found.end;
            work.to = found.end;
        }
    }

    /// The works of the library that are named in a part of a note.
    fn known_works(&self, from: usize, to: usize, shelf: &Shelf, last: &mut Last) -> Vec<Work> {
        let mut works = Vec::new();
        if shelf.is_empty() {
            return works;
        }
        let mut at = from;
        let mut floor = from;
        while at < to {
            if !(self.chars[at].is_uppercase() && self.begins(at, from)) {
                at += 1;
                continue;
            }
            let end = self.word(at, to).max(at + 1);
            let found = self.known(at, to, shelf).and_then(|name| self.work_at(at, name, floor, to, shelf, last));
            match found {
                Some(work) => {
                    at = work.rest.max(end);
                    floor = work.rest;
                    last.keep(&work);
                    works.push(work);
                }
                None => at = end,
            }
        }
        works
    }

    /// A note, if it cites: as a whole.
    fn note(&self, passage: &Passage, shelf: &Shelf, options: &Options, last: &mut Last) -> Option<Proposal> {
        if self.chars.contains(&NOTHING) {
            return None;
        }
        let (from, to) = self.trimmed(0, self.chars.len());
        if from >= to {
            return None;
        }
        let parts = self.sentences(from, to);
        let mut works: Vec<Work> = Vec::new();
        for (n, (part_from, part_to)) in parts.iter().copied().enumerate() {
            let mut found = self.known_works(part_from, part_to, shelf, last);
            if found.is_empty() {
                // The work before, or a work by its form alone.
                let (_, mut end) = self.trimmed(part_from, part_to);
                if n + 1 == parts.len() && end > part_from && self.chars[end - 1] == '.' {
                    let word = self.lower(part_from, end - 1);
                    let short = word.rsplit(|c: char| !c.is_alphabetic()).next().is_some_and(|w| {
                        matches!(w, "f" | "ff" | "sq" | "sqq")
                            || AS_BEFORE.iter().any(|b| b.ends_with(w) && !w.is_empty())
                    });
                    if !short {
                        end -= 1;
                    }
                }
                found = self.part(part_from, end, None, shelf, last).map(|(found, _)| found).unwrap_or_default();
                for work in &mut found {
                    work.to = work.rest;
                    last.keep(work);
                }
            }
            for mut work in found {
                work.part = n;
                works.push(work);
            }
        }

        let likely = works.iter().any(|work| work.suggestions.iter().any(|s| s.sure >= Sure::Likely));
        if !(likely || options.notes) {
            return None;
        }
        let whole = |items: Vec<ProposedItem>| Proposal {
            passage: passage.id.clone(),
            start: 0,
            end: self.places[self.chars.len()],
            mode: CiteMode::Normal,
            items,
        };
        if works.is_empty() {
            let item = ProposedItem {
                start: self.places[from],
                end: self.places[to],
                words: self.said(from, to),
                ..Default::default()
            };
            return Some(whole(vec![item]));
        }

        // Each work has what stands between it and its neighbours: what
        // stands before the first is said before it, and what stands after
        // a work, up to the part the next is in, is said after it.
        let count = works.len();
        for n in 0..count {
            let begins = if n == 0 {
                from
            } else if works[n - 1].part == works[n].part {
                works[n - 1].rest
            } else {
                parts[works[n].part].0
            };
            let ends = if n + 1 == count {
                to
            } else if works[n + 1].part == works[n].part {
                works[n].rest
            } else {
                parts[works[n + 1].part].0
            };
            let (begins, mut ends) = self.trimmed(begins, ends.max(begins));
            while ends > begins && (self.chars[ends - 1] == ';' || self.chars[ends - 1].is_whitespace()) {
                ends -= 1;
            }
            works[n].from = begins.min(works[n].named);
            works[n].to = ends.max(works[n].rest);
        }
        Some(whole(works.iter().map(|work| self.item(work)).collect()))
    }
}

pub(super) fn propose(library: &Library, passages: &[Passage], options: &Options) -> Vec<Proposal> {
    let shelf = shelf(library);
    let mut last = Last::default();
    let mut out = Vec::new();
    for passage in passages {
        let text = Text::new(passage);
        if passage.note
            && let Some(proposal) = text.note(passage, &shelf, options, &mut last)
        {
            out.push(proposal);
            continue;
        }
        if options.years {
            text.in_line(passage, &shelf, &mut last, &mut out);
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::library::draft_from_source;

    /// A small library, such as a classicist may have.
    fn library() -> (tempfile::TempDir, Library) {
        let tmp = tempfile::tempdir().unwrap();
        let mut library = Library::open_at(&tmp.path().join("library")).unwrap();
        let drafts: Vec<_> = [
            "@book{nagy1979, author={Nagy, Gregory}, title={The Best of the Achaeans}, subtitle={Concepts of the Hero in Archaic Greek Poetry}, date={1979}}",
            "@book{nagy1990, author={Nagy, Gregory}, title={Pindar's Homer}, subtitle={The Lyric Possession of an Epic Past}, date={1990}}",
            "@book{lord1960, author={Lord, Albert B.}, title={The Singer of Tales}, date={1960}}",
            "@book{lord2000, author={Lord, Albert B.}, title={The Singer of Tales}, edition={2}, date={2000}, origdate={1960}}",
            "@book{nagylord1991, author={Nagy, Gregory and Lord, Albert B.}, title={Epic Singers and Oral Tradition}, date={1991}}",
            "@article{west1988, author={West, M. L.}, title={The Rise of the Greek Epic}, journaltitle={JHS}, volume={108}, date={1988}, pages={151--172}}",
            "@book{valk1963, author={van der Valk, Marchinus}, title={Researches on the Text and Scholia of the Iliad}, date={1963}}",
            "@article{march1991, author={March, James G.}, title={Exploration and Exploitation in Organizational Learning}, date={1991}}",
            "@collection{morris1997, editor={Morris, Ian and Powell, Barry}, title={A New Companion to Homer}, date={1997}}",
            "@book{bm1893, author={{British Museum}}, title={A Catalogue of the Greek Vases}, date={1893}}",
            "@thesis{bjornson2004, author={Bjørnson, Åse}, title={Sangeren og sangen}, date={2004}}",
            "@book{levi1962, author={Lévi-Strauss, Claude}, title={La pensée sauvage}, date={1962}}",
        ]
        .iter()
        .map(|source| draft_from_source(source).unwrap())
        .collect();
        library.add_many(&drafts).unwrap();
        (tmp, library)
    }

    const YEARS: Options = Options { years: true, notes: false };
    const NOTES: Options = Options { years: true, notes: true };

    fn line(text: &str) -> Passage {
        Passage { id: "p".into(), text: text.into(), ..Default::default() }
    }

    fn note(text: &str) -> Passage {
        Passage { id: "n".into(), text: text.into(), note: true, ..Default::default() }
    }

    /// What stands between two places of a text, in units of UTF-16.
    fn between(text: &str, start: usize, end: usize) -> String {
        let units: Vec<u16> = text.encode_utf16().collect();
        String::from_utf16(&units[start..end]).unwrap()
    }

    /// The texts of what is proposed in a line.
    fn proposed(library: &Library, text: &str) -> Vec<String> {
        propose(library, &[line(text)], &YEARS).iter().map(|p| between(text, p.start, p.end)).collect()
    }

    /// The one citation that is proposed in a line.
    fn one(library: &Library, text: &str) -> Proposal {
        let mut found = propose(library, &[line(text)], &YEARS);
        assert_eq!(found.len(), 1, "in “{text}”: {found:#?}");
        found.remove(0)
    }

    /// An item in its parts: the words, the locator, what it counts, what
    /// is said before and after.
    fn parts(item: &ProposedItem) -> (&str, Option<&str>, Option<&str>, Option<&str>, Option<&str>) {
        (
            item.words.as_str(),
            item.locator.as_deref(),
            item.label.as_deref(),
            item.prefix.as_deref(),
            item.suffix.as_deref(),
        )
    }

    /// The references that are given for an item, by their keys.
    fn keys(library: &Library, item: &ProposedItem) -> Vec<(String, Sure)> {
        item.suggestions.iter().map(|s| (library.get(&s.reference).unwrap().key.clone(), s.sure)).collect()
    }

    fn likely(key: &str) -> (String, Sure) {
        (key.to_owned(), Sure::Likely)
    }

    fn possible(key: &str) -> (String, Sure) {
        (key.to_owned(), Sure::Possible)
    }

    #[test]
    fn brackets_with_a_name_and_a_year() {
        let (_tmp, library) = library();
        let text = "The hero is the best (Nagy 1979, 73) of them.";
        let found = one(&library, text);
        assert_eq!(between(text, found.start, found.end), "(Nagy 1979, 73)");
        assert_eq!(found.passage, "p");
        assert_eq!(found.mode, CiteMode::Normal);
        assert_eq!(found.items.len(), 1);
        let item = &found.items[0];
        assert_eq!(parts(item), ("Nagy 1979", Some("73"), None, None, None));
        assert_eq!(between(text, item.start, item.end), "Nagy 1979, 73");
        assert!(!item.suppress_author);
        assert_eq!(keys(&library, item), vec![likely("nagy1979")]);
        assert_eq!(item.suggestions[0].why, "Nagy, 1979");

        assert_eq!(parts(&one(&library, "(Nagy 1979)").items[0]), ("Nagy 1979", None, None, None, None));
        assert_eq!(parts(&one(&library, "[Nagy 1979, 73]").items[0]), ("Nagy 1979", Some("73"), None, None, None));
        // As the APA writes.
        assert_eq!(parts(&one(&library, "(Nagy, 1979, p. 73)").items[0]), ("Nagy, 1979", Some("73"), None, None, None));
        assert_eq!(
            parts(&one(&library, "(cf. Nagy, 1979, pp. 73-75)").items[0]),
            ("Nagy, 1979", Some("73–75"), None, Some("cf."), None)
        );
        // As Harvard writes.
        assert_eq!(parts(&one(&library, "(Nagy 1979: 73)").items[0]), ("Nagy 1979", Some("73"), None, None, None));
        assert_eq!(parts(&one(&library, "(Nagy 1979:73f.)").items[0]), ("Nagy 1979", Some("73f."), None, None, None));
    }

    #[test]
    fn several_works_in_one_pair_of_brackets() {
        let (_tmp, library) = library();
        let text = "So it is said (see Nagy 1979, 73–75; Lord 1960: 12), and often.";
        let found = one(&library, text);
        assert_eq!(between(text, found.start, found.end), "(see Nagy 1979, 73–75; Lord 1960: 12)");
        assert_eq!(found.items.len(), 2);
        assert_eq!(parts(&found.items[0]), ("Nagy 1979", Some("73–75"), None, Some("see"), None));
        assert_eq!(parts(&found.items[1]), ("Lord 1960", Some("12"), None, None, None));
        assert_eq!(between(text, found.items[0].start, found.items[0].end), "see Nagy 1979, 73–75");
        assert_eq!(between(text, found.items[1].start, found.items[1].end), "Lord 1960: 12");
        assert_eq!(keys(&library, &found.items[0]), vec![likely("nagy1979")]);
        // Two have the name and the year: the one whose year it is comes first.
        assert_eq!(keys(&library, &found.items[1]), vec![likely("lord1960"), likely("lord2000")]);

        // Two works of the same author.
        let found = one(&library, "(Nagy 1979, 1990)");
        assert_eq!(found.items.len(), 2);
        assert_eq!(parts(&found.items[0]), ("Nagy 1979", None, None, None, None));
        assert_eq!(parts(&found.items[1]), ("Nagy 1990", None, None, None, None));
        assert_eq!(keys(&library, &found.items[1]), vec![likely("nagy1990")]);
        let found = one(&library, "(Nagy 1979, 73; 1990, 12)");
        assert_eq!(parts(&found.items[0]), ("Nagy 1979", Some("73"), None, None, None));
        assert_eq!(parts(&found.items[1]), ("Nagy 1990", Some("12"), None, None, None));
        let found = one(&library, "(Nagy 1979a, b)");
        assert_eq!(parts(&found.items[0]), ("Nagy 1979a", None, None, None, None));
        assert_eq!(parts(&found.items[1]), ("Nagy 1979b", None, None, None, None));

        // A few words at the end say something of the last work.
        let found = one(&library, "(Nagy 1979, 73; emphasis added)");
        assert_eq!(found.items.len(), 1);
        assert_eq!(parts(&found.items[0]), ("Nagy 1979", Some("73"), None, None, Some("; emphasis added")));
    }

    #[test]
    fn several_authors() {
        let (_tmp, library) = library();
        let found = one(&library, "(Nagy and Lord 1991)");
        assert_eq!(parts(&found.items[0]), ("Nagy and Lord 1991", None, None, None, None));
        assert_eq!(keys(&library, &found.items[0]), vec![likely("nagylord1991")]);
        assert_eq!(found.items[0].suggestions[0].why, "Nagy and Lord, 1991");
        assert_eq!(parts(&one(&library, "(Nagy & Lord, 1991, p. 5)").items[0]).0, "Nagy & Lord, 1991");
        assert_eq!(parts(&one(&library, "(Morris, Powell and Nagy 1997)").items[0]).0, "Morris, Powell and Nagy 1997");

        let found = one(&library, "(Nagy et al. 1979a)");
        assert_eq!(parts(&found.items[0]), ("Nagy et al. 1979a", None, None, None, None));
        // The letter after the year is not looked at.
        assert_eq!(keys(&library, &found.items[0]), vec![likely("nagy1979")]);
        assert_eq!(parts(&one(&library, "(Nagy et al., 1979)").items[0]).0, "Nagy et al., 1979");

        // The editors of a work that has no authors.
        let found = one(&library, "(Morris and Powell, eds., 1997, 101)");
        assert_eq!(parts(&found.items[0]), ("Morris and Powell, eds., 1997", Some("101"), None, None, None));
        assert_eq!(keys(&library, &found.items[0]), vec![likely("morris1997")]);

        // Names of several words, and with what stands before them.
        assert_eq!(keys(&library, &one(&library, "(van der Valk 1963, 12)").items[0]), vec![likely("valk1963")]);
        assert_eq!(keys(&library, &one(&library, "(Valk 1963)").items[0]), vec![likely("valk1963")]);
        assert_eq!(keys(&library, &one(&library, "(British Museum 1893)").items[0]), vec![likely("bm1893")]);
        assert_eq!(keys(&library, &one(&library, "(M. L. West 1988, 151)").items[0]), vec![likely("west1988")]);
        assert_eq!(keys(&library, &one(&library, "(Gregory Nagy 1990)").items[0]), vec![likely("nagy1990")]);
        // Without regard to capitals and accents.
        assert_eq!(keys(&library, &one(&library, "(Levi-Strauss 1962)").items[0]), vec![likely("levi1962")]);
        assert_eq!(keys(&library, &one(&library, "(LÉVI-STRAUSS 1962)").items[0]), vec![likely("levi1962")]);
        assert_eq!(keys(&library, &one(&library, "(Bjornson 2004)").items[0]), vec![likely("bjornson2004")]);
    }

    #[test]
    fn years_of_other_kinds() {
        let (_tmp, library) = library();
        let found = one(&library, "(Lord [1960] 2000, 14)");
        assert_eq!(parts(&found.items[0]), ("Lord [1960] 2000", Some("14"), None, None, None));
        assert_eq!(keys(&library, &found.items[0]), vec![likely("lord2000"), likely("lord1960")]);
        assert_eq!(parts(&one(&library, "(Lord 2000 [1960])").items[0]).0, "Lord 2000 [1960]");

        // No year: the name alone is what is known.
        let found = one(&library, "(West n.d.)");
        assert_eq!(parts(&found.items[0]), ("West n.d.", None, None, None, None));
        assert_eq!(keys(&library, &found.items[0]), vec![possible("west1988")]);
        assert_eq!(parts(&one(&library, "(West forthcoming)").items[0]).0, "West forthcoming");
        assert_eq!(parts(&one(&library, "(West, in press)").items[0]).0, "West, in press");

        // Another year than the library has.
        let found = one(&library, "(West 1997, 3)");
        assert_eq!(keys(&library, &found.items[0]), vec![possible("west1988")]);
        assert_eq!(found.items[0].suggestions[0].why, "West, another year");

        // The year, and a name that is a little otherwise.
        let found = one(&library, "(Nagi 1990)");
        assert_eq!(keys(&library, &found.items[0]), vec![possible("nagy1990")]);

        // A work the library does not have is for the writer to find.
        let found = one(&library, "(Finkelberg 1998, 20)");
        assert_eq!(parts(&found.items[0]), ("Finkelberg 1998", Some("20"), None, None, None));
        assert!(found.items[0].suggestions.is_empty());
    }

    #[test]
    fn the_author_in_the_sentence() {
        let (_tmp, library) = library();
        let text = "As Nagy (1979, 73) has shown, the hero is the best.";
        let found = one(&library, text);
        assert_eq!(found.mode, CiteMode::Intext);
        assert_eq!(between(text, found.start, found.end), "Nagy (1979, 73)");
        let item = &found.items[0];
        assert_eq!(parts(item), ("Nagy 1979", Some("73"), None, None, None));
        assert!(!item.suppress_author);
        assert_eq!(between(text, item.start, item.end), "Nagy (1979, 73");
        assert_eq!(keys(&library, item), vec![likely("nagy1979")]);

        let text = "Both Nagy and Lord (1991) say so.";
        let found = one(&library, text);
        assert_eq!(between(text, found.start, found.end), "Nagy and Lord (1991)");
        assert_eq!(found.items[0].words, "Nagy and Lord 1991");
        assert_eq!(keys(&library, &found.items[0]), vec![likely("nagylord1991")]);

        assert_eq!(proposed(&library, "Thus van der Valk (1963: 12)."), vec!["van der Valk (1963: 12)"]);
        assert_eq!(proposed(&library, "The British Museum (1893) has it."), vec!["British Museum (1893)"]);
        assert_eq!(proposed(&library, "Gregory Nagy (1990) says."), vec!["Nagy (1990)"]);
        assert_eq!(proposed(&library, "Nagy et al. (1979) say."), vec!["Nagy et al. (1979)"]);
        assert_eq!(proposed(&library, "Nagy (1979; 1990) says."), vec!["Nagy (1979; 1990)"]);

        // More works within the brackets, of others.
        let found = one(&library, "Nagy (1979, 73; see also Lord 1960)");
        assert_eq!(found.mode, CiteMode::Intext);
        assert_eq!(parts(&found.items[0]), ("Nagy 1979", Some("73"), None, None, None));
        assert_eq!(parts(&found.items[1]), ("Lord 1960", None, None, Some("see also"), None));

        // One the library does not have, where something says that it is cited.
        assert_eq!(proposed(&library, "Finkelberg (1998, 20) says."), vec!["Finkelberg (1998, 20)"]);
        assert_eq!(proposed(&library, "Finkelberg (1998a) says."), vec!["Finkelberg (1998a)"]);
        assert_eq!(proposed(&library, "Finkelberg et al. (1998) say."), vec!["Finkelberg et al. (1998)"]);

        // What is theirs: the brackets are the citation, and the name stays.
        let text = "Nagy’s (1979, 73) reading of it.";
        let found = one(&library, text);
        assert_eq!(found.mode, CiteMode::Normal);
        assert_eq!(between(text, found.start, found.end), "(1979, 73)");
        assert_eq!(parts(&found.items[0]), ("Nagy 1979", Some("73"), None, None, None));
        assert!(found.items[0].suppress_author);
        assert_eq!(keys(&library, &found.items[0]), vec![likely("nagy1979")]);
    }

    #[test]
    fn what_is_no_citation() {
        let (_tmp, library) = library();
        for text in [
            "It came out late (1979).",
            "It came out (in 1979) and was read.",
            "The poet (born 1950) wrote it.",
            "The work (3 vols., 1979) is long.",
            "The battle (ca. 450 BC) was lost.",
            "The treaty (Rome 1957) was signed.",
            "The treaty of Rome (1957) was signed.",
            "Napoleon (1769–1821) was there.",
            "Romeo and Juliet (1597) is a play.",
            "It was then (May 1979) that it began.",
            "In January (1979) it began.",
            "Then (In 1979) it began.",
            "He came (Oxford, 1979) and went.",
            "It was shown (this was in the long summer of 1979, when all was well) to many.",
            "As was said (Nagy 1979 was a good year for the study of Homer) by some.",
            "See the table (Table 1979).",
            "He wrote [sic] and [12] and (12) and (a) and ().",
            "A year alone 1979 and a name alone Nagy.",
            "Finkelberg (1998) says.",
            "(see 1979)",
            "(Finkelberg 979)",
            "(Finkelberg 2179)",
            "(Nagy 19790)",
            "(nagy 1979)",
        ] {
            assert_eq!(proposed(&library, text), Vec::<String>::new(), "in “{text}”");
        }
        // Without the years, nothing in the line is looked for.
        let none = Options { years: false, notes: true };
        assert!(propose(&library, &[line("(Nagy 1979, 73)")], &none).is_empty());
    }

    #[test]
    fn a_word_that_is_no_name_is_one_where_the_library_has_the_author() {
        let (_tmp, library) = library();
        let found = one(&library, "(March 1991, 71)");
        assert_eq!(keys(&library, &found.items[0]), vec![likely("march1991")]);
        assert_eq!(proposed(&library, "March (1991) says."), vec!["March (1991)"]);
        assert_eq!(proposed(&library, "(June 1991)"), Vec::<String>::new());
    }

    #[test]
    fn what_is_said_before_and_after() {
        let (_tmp, library) = library();
        for (text, before) in [
            ("(see Nagy 1979)", "see"),
            ("(See also Nagy 1979)", "See also"),
            ("(cf. Nagy 1979)", "cf."),
            ("(e.g. Nagy 1979)", "e.g."),
            ("(e.g., Nagy 1979)", "e.g.,"),
            ("(see e.g. Nagy 1979)", "see e.g."),
            ("(but see Nagy 1979)", "but see"),
            ("(contra Nagy 1979)", "contra"),
            ("(quoted in Nagy 1979)", "quoted in"),
            // What is not of the words that are said before works, where
            // the library has the work.
            ("(as argued by Nagy 1979)", "as argued by"),
        ] {
            assert_eq!(
                parts(&one(&library, text).items[0]),
                ("Nagy 1979", None, None, Some(before), None),
                "in “{text}”"
            );
        }
        // And not where it does not have it.
        assert_eq!(proposed(&library, "(as argued by Finkelberg 1998)"), Vec::<String>::new());

        let found = one(&library, "(Nagy 1979, 73, with further references)");
        assert_eq!(parts(&found.items[0]), ("Nagy 1979", Some("73"), None, None, Some(", with further references")));
        let found = one(&library, "(Nagy 1979, passim)");
        assert_eq!(parts(&found.items[0]), ("Nagy 1979", None, None, None, Some(", passim")));
        let found = one(&library, "(Nagy 1979, 2nd ed.)");
        assert_eq!(parts(&found.items[0]), ("Nagy 1979", None, None, None, Some(", 2nd ed.")));
    }

    #[test]
    fn locators_and_what_they_count() {
        let (_tmp, library) = library();
        for (text, locator, label) in [
            ("(Nagy 1979, p. 73)", "73", None),
            ("(Nagy 1979, pp. 73–75)", "73–75", None),
            ("(Nagy 1979, pp. 73--75)", "73–75", None),
            ("(Nagy 1979, 73 – 75)", "73–75", None),
            ("(Nagy 1979, 73—75)", "73–75", None),
            ("(Nagy 1979, 73, 75, 80–82)", "73, 75, 80–82", None),
            ("(Nagy 1979, 73ff.)", "73ff.", None),
            ("(Nagy 1979, 73 f.)", "73 f.", None),
            ("(Nagy 1979, 73 n. 4)", "73 n. 4", None),
            ("(Nagy 1979, xii–xv)", "xii–xv", None),
            ("(Nagy 1979, 327a–c)", "327a–c", None),
            ("(Nagy 1979 p. 73)", "73", None),
            ("(Nagy 1979, ch. 3)", "3", Some("chapter")),
            ("(Nagy 1979, chap. 3)", "3", Some("chapter")),
            ("(Nagy 1979, chapter 3)", "3", Some("chapter")),
            ("(Nagy 1979, §4)", "4", Some("section")),
            ("(Nagy 1979, § 4)", "4", Some("section")),
            ("(Nagy 1979, vol. 2)", "2", Some("volume")),
            ("(Nagy 1979, n. 12)", "12", Some("note")),
            ("(Nagy 1979, l. 5)", "5", Some("line")),
            ("(Nagy 1979, v. 10)", "10", Some("verse")),
            ("(Nagy 1979, fig. 2)", "2", Some("figure")),
            ("(Nagy 1979, ch. IV)", "IV", Some("chapter")),
        ] {
            let found = one(&library, text);
            assert_eq!(parts(&found.items[0]), ("Nagy 1979", Some(locator), label, None, None), "in “{text}”");
        }
    }

    #[test]
    fn a_name_and_a_page_and_no_year() {
        let (_tmp, library) = library();
        // As the MLA writes.
        let found = one(&library, "The hero is the best (West 73).");
        assert_eq!(parts(&found.items[0]), ("West", Some("73"), None, None, None));
        assert_eq!(keys(&library, &found.items[0]), vec![possible("west1988")]);
        assert_eq!(found.items[0].suggestions[0].why, "West");
        assert_eq!(parts(&one(&library, "(West 151–52)").items[0]), ("West", Some("151–52"), None, None, None));
        // All the works of the author may be meant.
        let found = one(&library, "(Lord 12)");
        assert_eq!(keys(&library, &found.items[0]), vec![possible("lord1960"), possible("lord2000")]);

        for text in ["(Finkelberg 73)", "(see West 73)", "(West and Nagy 73)", "(Chapter 73)", "(West 73 times)"] {
            assert_eq!(proposed(&library, text), Vec::<String>::new(), "in “{text}”");
        }
    }

    #[test]
    fn in_german_and_in_norwegian() {
        let (_tmp, library) = library();
        let found = one(&library, "So ist es (vgl. Nagy 1979, S. 73).");
        assert_eq!(parts(&found.items[0]), ("Nagy 1979", Some("73"), None, Some("vgl."), None));
        let found = one(&library, "(siehe auch Nagy 1979, S. 73f.; Lord 1960, Kap. 2)");
        assert_eq!(parts(&found.items[0]), ("Nagy 1979", Some("73f."), None, Some("siehe auch"), None));
        assert_eq!(parts(&found.items[1]), ("Lord 1960", Some("2"), Some("chapter"), None, None));
        assert_eq!(parts(&one(&library, "(z.B. Nagy 1979)").items[0]).3, Some("z.B."));
        assert_eq!(parts(&one(&library, "(Nagy und Lord 1991, S. 5)").items[0]).0, "Nagy und Lord 1991");
        assert_eq!(parts(&one(&library, "(Nagy u.a. 1979)").items[0]).0, "Nagy u.a. 1979");
        assert_eq!(parts(&one(&library, "(West o.J.)").items[0]).0, "West o.J.");

        let found = one(&library, "Slik er det (se Bjørnson 2004, s. 73).");
        assert_eq!(parts(&found.items[0]), ("Bjørnson 2004", Some("73"), None, Some("se"), None));
        assert_eq!(keys(&library, &found.items[0]), vec![likely("bjornson2004")]);
        assert_eq!(parts(&one(&library, "(jf. Nagy 1979, s. 73)").items[0]).3, Some("jf."));
        assert_eq!(parts(&one(&library, "(se også Nagy 1979, kap. 3)").items[0]).2, Some("chapter"));
        assert_eq!(parts(&one(&library, "(Nagy og Lord 1991)").items[0]).0, "Nagy og Lord 1991");
        assert_eq!(parts(&one(&library, "(Nagy m.fl. 1979)").items[0]).0, "Nagy m.fl. 1979");
        assert_eq!(proposed(&library, "Bjørnson (2004, s. 12) sier det."), vec!["Bjørnson (2004, s. 12)"]);
    }

    #[test]
    fn places_are_in_units_of_utf16() {
        let (_tmp, library) = library();
        // Letters outside ASCII, and outside the BMP, which are two units each.
        let text = "Μῆνιν ἄειδε 𝔄𝔅 😀 (se Bjørnson 2004, s. 73–75; Lévi-Strauss 1962) 𝔄 og Bjørnson (2004).";
        let found = propose(&library, &[line(text)], &YEARS);
        assert_eq!(found.len(), 2);
        let first = &found[0];
        assert_eq!(first.start, text.encode_utf16().position(|unit| unit == u16::from(b'(')).unwrap());
        assert_eq!(between(text, first.start, first.end), "(se Bjørnson 2004, s. 73–75; Lévi-Strauss 1962)");
        assert_eq!(between(text, first.items[0].start, first.items[0].end), "se Bjørnson 2004, s. 73–75");
        assert_eq!(between(text, first.items[1].start, first.items[1].end), "Lévi-Strauss 1962");
        assert_eq!(between(text, found[1].start, found[1].end), "Bjørnson (2004)");
        assert_eq!(found[1].end, text.encode_utf16().count() - 1);
    }

    #[test]
    fn what_is_taken_and_what_is_no_text_is_not_looked_at() {
        let (_tmp, library) = library();
        let text = "One (Nagy 1979, 73) and two (Lord 1960) and three (West 1988).";
        let at = |said: &str| {
            let start = text[..text.find(said).unwrap()].encode_utf16().count();
            (start, start + said.encode_utf16().count())
        };
        let taken = |taken: Vec<(usize, usize)>| -> Vec<String> {
            let passage = Passage { taken, ..line(text) };
            propose(&library, &[passage], &YEARS).iter().map(|p| between(text, p.start, p.end)).collect()
        };
        assert_eq!(taken(vec![at("(Lord 1960)")]), vec!["(Nagy 1979, 73)", "(West 1988)"]);
        // What is taken in part is not proposed in part.
        assert_eq!(taken(vec![at("Nagy"), at("1988")]), vec!["(Lord 1960)"]);
        assert_eq!(taken(vec![at("One"), at(" and two ")]), vec!["(Nagy 1979, 73)", "(Lord 1960)", "(West 1988)"]);

        // A citation, a formula, a note: one U+FFFC each.
        assert_eq!(
            proposed(&library, "One (Nagy 1979\u{fffc}) and (see \u{fffc} and Lord 1960)."),
            Vec::<String>::new()
        );
        assert_eq!(proposed(&library, "Nagy\u{fffc} (1979) and Nagy \u{fffc}(1979)."), Vec::<String>::new());
        let text = "One\u{fffc} (Nagy 1979, 73)\u{fffc} and Lord\u{fffc} and Nagy (1990).";
        let found = propose(&library, &[line(text)], &YEARS);
        assert_eq!(found.len(), 2);
        assert_eq!(between(text, found[0].start, found[0].end), "(Nagy 1979, 73)");
        assert_eq!(between(text, found[1].start, found[1].end), "Nagy (1990)");
    }

    #[test]
    fn the_end_of_a_line_is_a_blank() {
        let (_tmp, library) = library();
        let text =
            "One\n(see Nagy\n1979,\np. 73;\nLord 1960)\nand Nagy and\nLord\n(1991) \u{fffc}\nand 𝔄 (West\n1988).";
        let found = propose(&library, &[line(text)], &YEARS);
        assert_eq!(found.len(), 3, "{found:#?}");
        assert_eq!(between(text, found[0].start, found[0].end), "(see Nagy\n1979,\np. 73;\nLord 1960)");
        assert_eq!(parts(&found[0].items[0]), ("Nagy 1979", Some("73"), None, Some("see"), None));
        assert_eq!(parts(&found[0].items[1]), ("Lord 1960", None, None, None, None));
        assert_eq!(between(text, found[0].items[0].start, found[0].items[0].end), "see Nagy\n1979,\np. 73");
        assert_eq!(between(text, found[1].start, found[1].end), "Nagy and\nLord\n(1991)");
        assert_eq!(found[1].mode, CiteMode::Intext);
        assert_eq!(found[1].items[0].words, "Nagy and Lord 1991");
        assert_eq!(keys(&library, &found[1].items[0]), vec![likely("nagylord1991")]);
        assert_eq!(between(text, found[2].start, found[2].end), "(West\n1988)");
        assert_eq!(found[2].items[0].words, "West 1988");
    }

    #[test]
    fn a_note_that_names_works_of_the_library() {
        let (_tmp, library) = library();
        // As Chicago writes its notes.
        let text = "See Nagy, Best of the Achaeans, 73; but cf. Lord, Singer of Tales, 12, who argues otherwise.";
        let found = propose(&library, &[note(text)], &YEARS);
        assert_eq!(found.len(), 1);
        let found = &found[0];
        assert_eq!((found.passage.as_str(), found.start, found.end), ("n", 0, text.encode_utf16().count()));
        assert_eq!(found.mode, CiteMode::Normal);
        assert_eq!(found.items.len(), 2);
        assert_eq!(parts(&found.items[0]), ("Nagy, Best of the Achaeans", Some("73"), None, Some("See"), None));
        assert_eq!(
            parts(&found.items[1]),
            ("Lord, Singer of Tales", Some("12"), None, Some("but cf."), Some(", who argues otherwise"))
        );
        assert_eq!(between(text, found.items[0].start, found.items[0].end), "See Nagy, Best of the Achaeans, 73");
        assert_eq!(
            between(text, found.items[1].start, found.items[1].end),
            "but cf. Lord, Singer of Tales, 12, who argues otherwise."
        );
        assert_eq!(keys(&library, &found.items[0]), vec![likely("nagy1979")]);
        assert_eq!(found.items[0].suggestions[0].why, "Nagy, The Best of the Achaeans");
        assert_eq!(keys(&library, &found.items[1]), vec![likely("lord1960"), likely("lord2000")]);
    }

    #[test]
    fn the_forms_of_a_work_in_a_note() {
        let (_tmp, library) = library();
        let first = |text: &str| -> ProposedItem {
            let mut found = propose(&library, &[note(text)], &YEARS);
            assert_eq!(found.len(), 1, "in “{text}”");
            found.remove(0).items.remove(0)
        };
        // In full, the first time.
        let item = first(
            "Gregory Nagy, The Best of the Achaeans: Concepts of the Hero in Archaic Greek Poetry (Baltimore: Johns Hopkins University Press, 1979), 73–75.",
        );
        assert_eq!(
            parts(&item),
            (
                "Gregory Nagy, The Best of the Achaeans: Concepts of the Hero in Archaic Greek Poetry (Baltimore: Johns Hopkins University Press, 1979)",
                Some("73–75"),
                None,
                None,
                None
            )
        );
        assert_eq!(keys(&library, &item), vec![likely("nagy1979")]);
        assert_eq!(item.suggestions[0].why, "Nagy, 1979");

        assert_eq!(
            parts(&first("G. Nagy, Pindar’s Homer, 12.")),
            ("G. Nagy, Pindar’s Homer", Some("12"), None, None, None)
        );
        assert_eq!(parts(&first("Lord, Singer, 12.")), ("Lord, Singer", Some("12"), None, None, None));
        assert_eq!(parts(&first("Lord, “Singer of Tales,” 12.")).1, Some("12"));
        assert_eq!(parts(&first("Cf. Nagy 1979, 73.")), ("Nagy 1979", Some("73"), None, Some("Cf."), None));
        assert_eq!(parts(&first("Nagy (1979), 73.")), ("Nagy 1979", Some("73"), None, None, None));
        assert_eq!(parts(&first("Nagy (1979, 73) says so.")), ("Nagy 1979", Some("73"), None, None, Some("says so")));
        assert_eq!(
            parts(&first("Nagy’s Best of the Achaeans, ch. 2, is the place.")),
            ("Nagy’s Best of the Achaeans", Some("2"), Some("chapter"), None, Some(", is the place"))
        );
        let item = first("Morris and Powell (eds.), A New Companion to Homer, 101.");
        assert_eq!(parts(&item), ("Morris and Powell (eds.), A New Companion to Homer", Some("101"), None, None, None));
        assert_eq!(keys(&library, &item), vec![likely("morris1997")]);
        let item = first("Vgl. van der Valk, Researches, S. 12.");
        assert_eq!(parts(&item), ("van der Valk, Researches", Some("12"), None, Some("Vgl."), None));

        // Two works in one sentence.
        let found = propose(&library, &[note("Nagy, Best, 73 and Lord, Singer, 12.")], &YEARS);
        assert_eq!(found[0].items.len(), 2);
        assert_eq!(parts(&found[0].items[0]), ("Nagy, Best", Some("73"), None, None, None));
        assert_eq!(parts(&found[0].items[1]), ("Lord, Singer", Some("12"), None, Some("and"), None));
    }

    #[test]
    fn what_a_note_says_beside_its_works() {
        let (_tmp, library) = library();
        let text = "This is contested. See Nagy, Best of the Achaeans, 73. The matter is not closed; cf. Lord, Singer of Tales, 12. More will be said.";
        let found = propose(&library, &[note(text)], &YEARS);
        let items = &found[0].items;
        assert_eq!(items.len(), 2);
        assert_eq!(
            parts(&items[0]),
            (
                "Nagy, Best of the Achaeans",
                Some("73"),
                None,
                Some("This is contested. See"),
                Some(". The matter is not closed")
            )
        );
        assert_eq!(
            parts(&items[1]),
            ("Lord, Singer of Tales", Some("12"), None, Some("cf."), Some(". More will be said"))
        );
        assert_eq!(
            between(text, items[0].start, items[0].end),
            "This is contested. See Nagy, Best of the Achaeans, 73. The matter is not closed"
        );
        assert_eq!(between(text, items[1].start, items[1].end), "cf. Lord, Singer of Tales, 12. More will be said.");
    }

    #[test]
    fn a_note_in_which_nothing_of_the_library_is_found() {
        let (_tmp, library) = library();
        for text in [
            "This is a remark and nothing else.",
            "Nagy was born in Budapest.",
            "Finkelberg, The Birth of Literary Fiction, 20.",
            "See Finkelberg 1998, 20.",
            "West 1997, 3.",
            "",
            "  ",
        ] {
            assert!(propose(&library, &[note(text)], &YEARS).is_empty(), "in “{text}”");
        }
        // Where every note cites, it is proposed all the same: as one work
        // for the writer to find, or in its parts where it has the form.
        let found = propose(&library, &[note(" Finkelberg, The Birth of Literary Fiction, 20. ")], &NOTES);
        assert_eq!(found.len(), 1);
        assert_eq!(found[0].items.len(), 1);
        assert_eq!(
            parts(&found[0].items[0]),
            ("Finkelberg, The Birth of Literary Fiction, 20.", None, None, None, None)
        );
        assert!(found[0].items[0].suggestions.is_empty());
        assert_eq!((found[0].start, found[0].end), (0, 48));
        assert_eq!((found[0].items[0].start, found[0].items[0].end), (1, 47));

        let found = propose(&library, &[note("See Finkelberg 1998, 20.")], &NOTES);
        assert_eq!(parts(&found[0].items[0]), ("Finkelberg 1998", Some("20"), None, Some("See"), None));
        assert!(propose(&library, &[note("")], &NOTES).is_empty());

        // The brackets in a note that is not proposed as a whole.
        let text = "This is a remark (see Nagy 1979, 73), and \u{fffc} is no text.";
        let found = propose(&library, &[note(text)], &YEARS);
        assert_eq!(found.len(), 1);
        assert_eq!(between(text, found[0].start, found[0].end), "(see Nagy 1979, 73)");
    }

    #[test]
    fn the_work_that_was_cited_before() {
        let (_tmp, library) = library();
        let notes = [
            note("Nagy, Best of the Achaeans, 73."),
            note("Ibid., 75."),
            note("Lord, Singer of Tales, 12; ibid., 14."),
            note("Nagy, op. cit., 80."),
            note("Ibid. See also West, “The Rise of the Greek Epic,” 151."),
        ];
        let found = propose(&library, &notes, &YEARS);
        assert_eq!(found.len(), 5);
        let ibid = &found[1].items[0];
        assert_eq!(parts(ibid), ("Ibid.", Some("75"), None, None, None));
        assert_eq!(keys(&library, ibid), vec![likely("nagy1979")]);
        assert_eq!(ibid.suggestions[0].why, "the work cited before this: Nagy, The Best of the Achaeans");

        assert_eq!(found[2].items.len(), 2);
        assert_eq!(parts(&found[2].items[1]), ("ibid.", Some("14"), None, None, None));
        assert_eq!(keys(&library, &found[2].items[1]), vec![likely("lord1960"), likely("lord2000")]);

        // The work of the author that was cited last, not the last work.
        let again = &found[3].items[0];
        assert_eq!(parts(again), ("Nagy, op. cit.", Some("80"), None, None, None));
        assert_eq!(keys(&library, again), vec![likely("nagy1979")]);

        assert_eq!(found[4].items.len(), 2);
        assert_eq!(parts(&found[4].items[0]), ("Ibid.", None, None, None, None));
        assert_eq!(keys(&library, &found[4].items[0]), vec![likely("nagy1979")]);
        assert_eq!(parts(&found[4].items[1]).3, Some("See also"));
        assert_eq!(keys(&library, &found[4].items[1]), vec![likely("west1988")]);

        // In the line, within brackets.
        let text = "It is so (Nagy 1979, 73), and so again (ibid., 75).";
        let found = propose(&library, &[line(text)], &YEARS);
        assert_eq!(found.len(), 2);
        assert_eq!(parts(&found[1].items[0]), ("ibid.", Some("75"), None, None, None));
        assert_eq!(keys(&library, &found[1].items[0]), vec![likely("nagy1979")]);
        // Nothing was cited before it.
        assert!(propose(&library, &[line("It is so (ibid., 75).")], &YEARS).is_empty());
        assert!(propose(&library, &[note("Ibid., 75.")], &YEARS).is_empty());
    }

    #[test]
    fn a_library_that_has_nothing() {
        let tmp = tempfile::tempdir().unwrap();
        let library = Library::open_at(&tmp.path().join("library")).unwrap();
        let found = one(&library, "It is so (see Nagy 1979, 73).");
        assert_eq!(parts(&found.items[0]), ("Nagy 1979", Some("73"), None, Some("see"), None));
        assert!(found.items[0].suggestions.is_empty());
        assert!(propose(&library, &[note("Nagy, Best of the Achaeans, 73.")], &YEARS).is_empty());
        assert_eq!(propose(&library, &[note("Nagy, Best of the Achaeans, 73.")], &NOTES).len(), 1);
    }

    /// Numbers that look thrown, and are the same every time.
    struct Dice(u64);

    impl Dice {
        fn roll(&mut self, sides: usize) -> usize {
            self.0 = self.0.wrapping_mul(6_364_136_223_846_793_005).wrapping_add(1_442_695_040_888_963_407);
            ((self.0 >> 33) as usize) % sides.max(1)
        }
    }

    /// What holds of all that is proposed, whatever the text.
    fn is_sound(passage: &Passage, found: &[Proposal]) {
        let text = passage.text.as_str();
        let units = text.encode_utf16().count();
        let mut floor = 0;
        for proposal in found {
            assert!(floor <= proposal.start && proposal.start < proposal.end && proposal.end <= units, "in “{text}”");
            floor = proposal.end;
            // Places that part a letter in two would make this fail.
            let said = between(text, proposal.start, proposal.end);
            assert!(!said.contains(NOTHING), "“{said}” in “{text}”");
            assert!(
                passage.taken.iter().all(|(from, to)| proposal.end <= *from || proposal.start >= *to),
                "in “{text}”"
            );
            assert!(!proposal.items.is_empty(), "in “{text}”");
            let mut within = proposal.start;
            for item in &proposal.items {
                assert!(within <= item.start && item.start <= item.end && item.end <= proposal.end, "in “{text}”");
                within = item.start;
                between(text, item.start, item.end);
                assert!(!item.words.trim().is_empty(), "in “{text}”");
                assert!(item.suggestions.iter().all(|s| s.sure < Sure::Certain), "in “{text}”");
                assert!(item.suggestions.len() <= 8, "in “{text}”");
                for said in [&item.locator, &item.prefix, &item.suffix, &item.label].into_iter().flatten() {
                    assert!(!said.trim().is_empty() && !said.contains(NOTHING), "in “{text}”");
                }
            }
        }
    }

    #[test]
    fn text_of_any_kind_is_looked_through_without_fault() {
        let (_tmp, library) = library();
        let pieces = [
            "Nagy",
            "Lord",
            "West",
            "van der Valk",
            "Finkelberg",
            "March",
            "In",
            "1979",
            "1979a",
            "1960",
            "[1960]",
            "2000",
            "(",
            "(",
            ")",
            ")",
            "[",
            "]",
            ";",
            ",",
            ",",
            ".",
            ":",
            " ",
            " ",
            " ",
            "\n",
            "\u{a0}",
            "\u{fffc}",
            "see",
            "See",
            "cf.",
            "vgl.",
            "et al.",
            "and",
            "&",
            "ibid.",
            "Ibid.",
            "op. cit.",
            "p.",
            "pp.",
            "S.",
            "ch.",
            "73",
            "73–75",
            "12-14",
            "f.",
            "ff.",
            "n.",
            "§",
            "’s",
            "'",
            "“",
            "”",
            "𝔄",
            "😀",
            "é",
            "ß",
            "İ",
            "ǅ",
            "Best of the Achaeans",
            "Singer",
            "The",
            "G.",
            "M. L.",
            "n.d.",
            "forthcoming",
            "-",
            "–",
            "xii",
            "e.g.",
            "(eds.)",
            "ed.",
            "b",
            "a",
        ];
        let mut dice = Dice(7);
        for round in 0..4000 {
            let text: String = (0..dice.roll(28)).map(|_| pieces[dice.roll(pieces.len())]).collect();
            let units = text.encode_utf16().count();
            let mut taken = Vec::new();
            if round % 3 == 0 && units > 0 {
                let from = dice.roll(units);
                taken.push((from, (from + 1 + dice.roll(4)).min(units)));
            }
            for is_note in [false, true] {
                let passage = Passage { id: "p".into(), text: text.clone(), note: is_note, taken: taken.clone() };
                for options in [YEARS, NOTES, Options { years: false, notes: false }] {
                    is_sound(&passage, &propose(&library, std::slice::from_ref(&passage), &options));
                }
            }
        }
    }

    /// Text of 200 000 words in 3 000 passages, against a library of 2 000
    /// entries. It says how long it took:
    ///
    ///     cargo test -p glaukopis-core --release much_text -- --ignored --nocapture
    #[test]
    #[ignore = "measures time; to be run in a release build"]
    fn much_text_against_a_large_library() {
        use std::time::{Duration, Instant};

        use crate::bib::names::Person;
        use crate::found::{FoundItem, suggest};
        use crate::library::entry::Draft;

        let first = ["Na", "Lor", "Wes", "Par", "Kir", "Bur", "Ver", "Det", "Fol", "Mar", "Jan", "Gri", "Hai", "Mue"];
        let second =
            ["gy", "d", "t", "ry", "k", "kert", "nant", "ienne", "ey", "tin", "ko", "ffin", "nsworth", "llner"];
        let third = ["", "son", "sen", "berg", "stein", "er", "mann", "ini", "ova", "ez"];
        let sounds = ["ka", "lo", "mi", "ne", "ru", "sa", "te", "vo", "phi", "the", "xe", "ly"];
        let words = [
            "the",
            "of",
            "and",
            "hero",
            "song",
            "is",
            "in",
            "epic",
            "poetry",
            "that",
            "singer",
            "tradition",
            "was",
            "it",
            "oral",
            "tale",
            "as",
            "formula",
            "to",
            "wrath",
            "glory",
            "with",
            "theme",
            "verse",
            "by",
            "cult",
        ];

        let mut dice = Dice(1);
        let mut drafts = Vec::new();
        let mut authors: Vec<(String, i32, String)> = Vec::new();
        for _ in 0..2000 {
            let family = format!("{}{}{}", first[dice.roll(14)], second[dice.roll(14)], third[dice.roll(10)]);
            let year = 1900 + dice.roll(120) as i32;
            // Words that many titles have, and words that few have.
            let mut title: Vec<String> =
                (0..2 + dice.roll(3)).map(|_| words[dice.roll(words.len())].to_owned()).collect();
            for _ in 0..2 + dice.roll(3) {
                let at = dice.roll(title.len() + 1);
                title
                    .insert(at, format!("{}{}{}", sounds[dice.roll(12)], sounds[dice.roll(12)], sounds[dice.roll(12)]));
            }
            let title = format!("On {}", title.join(" "));
            let mut draft = Draft { entry_type: "book".into(), ..Default::default() };
            draft.fields.insert("title".into(), title.clone());
            draft.fields.insert("date".into(), year.to_string());
            draft.names.insert("author".into(), vec![Person::new(family.clone(), "Anna Maria")]);
            authors.push((family, year, title));
            drafts.push(draft);
        }
        let tmp = tempfile::tempdir().unwrap();
        let mut library = Library::open_at(&tmp.path().join("library")).unwrap();
        library.add_many(&drafts).unwrap();

        let mut passages = Vec::new();
        let mut count = 0;
        for n in 0..3000 {
            let mut text = String::new();
            let mut said = 0;
            while said < 67 {
                match dice.roll(30) {
                    0 => {
                        let (family, year, _) = &authors[dice.roll(authors.len())];
                        text.push_str(&format!(
                            "(see {family} {year}, {}–{}) ",
                            10 + dice.roll(80),
                            100 + dice.roll(80)
                        ));
                        said += 4;
                    }
                    1 => {
                        let (family, year, _) = &authors[dice.roll(authors.len())];
                        text.push_str(&format!("{family} ({year}) "));
                        said += 2;
                    }
                    2 => {
                        let (family, _, title) = &authors[dice.roll(authors.len())];
                        text.push_str(&format!("{family}, {title}, {}; ", 1 + dice.roll(300)));
                        said += 3 + title.split(' ').count();
                    }
                    3 => {
                        text.push_str(&format!("(in {}) It ", 1000 + dice.roll(1000)));
                        said += 3;
                    }
                    _ => {
                        text.push_str(words[dice.roll(words.len())]);
                        text.push(' ');
                        said += 1;
                    }
                }
            }
            count += said;
            passages.push(Passage { id: n.to_string(), text, note: n % 5 == 0, ..Default::default() });
        }
        assert!(count >= 200_000, "{count} words");

        // The first time what the library has is laid out; after that it is kept.
        let begun = Instant::now();
        let found = propose(&library, &passages, &NOTES);
        let laid_out = begun.elapsed();
        let begun = Instant::now();
        let again = propose(&library, &passages, &NOTES);
        let kept = begun.elapsed();
        assert_eq!(found, again);
        for passage in &passages {
            let of_it: Vec<Proposal> = found.iter().filter(|p| p.passage == passage.id).cloned().collect();
            is_sound(passage, &of_it);
        }
        let works: usize = found.iter().map(|p| p.items.len()).sum();
        let known: usize = found.iter().flat_map(|p| &p.items).filter(|item| !item.suggestions.is_empty()).count();

        let items: Vec<FoundItem> = authors
            .iter()
            .take(300)
            .map(|(family, year, title)| FoundItem {
                data: Some(serde_json::json!({
                    "type": "book", "title": title, "author": [{"family": family, "given": "Anna Maria"}],
                    "issued": {"date-parts": [[year]]}
                })),
                ..Default::default()
            })
            .collect();
        let begun = Instant::now();
        let suggested: usize = items.iter().map(|item| suggest(&library, item).len()).sum();
        let looked_up = begun.elapsed();

        println!(
            "{count} words in {} passages against {} entries: {} citations of {works} works ({known} with \
             references) in {laid_out:?} the first time, {kept:?} after that; {} works looked up in {looked_up:?} \
             ({suggested} references)",
            passages.len(),
            library.len(),
            found.len(),
            items.len(),
        );
        assert!(found.len() > 3000);
        if !cfg!(debug_assertions) {
            assert!(laid_out < Duration::from_millis(1000), "{laid_out:?}");
            assert!(looked_up < Duration::from_millis(1000), "{looked_up:?}");
        }
    }
}
