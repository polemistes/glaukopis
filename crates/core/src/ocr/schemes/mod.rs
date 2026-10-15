//! Schemes: how a font or a text keeps its letters, recognised and translated.
//!
//! A PDF's own map from glyph to Unicode is sometimes wrong where the font
//! itself says rightly what each glyph is. Scholarly Greek fonts such as
//! Porson name their glyphs by what they are (`etaasper`,
//! `alphatildelenisiota`); the expert sets of Adobe's fonts name old-style
//! figures and small capitals (`twooldstyle`, `Osmall`); and some texts keep
//! Greek as Beta Code in Latin letters (`mh=nin a)/eide`). A scheme turns
//! each of them into the letters they stand for.
//!
//! The sigmas are stored as σ and ς whatever shape the font prints, since
//! what is stored is what is searched: a σ at the end of a word becomes ς.

mod beta;
mod expert;
mod greek_names;

use serde::{Deserialize, Serialize};
use unicode_normalization::UnicodeNormalization;

/// How a font or a text keeps its letters, recognised and translated.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Scheme {
    /// Composed Greek glyph names, as Porson and other scholarly fonts name them.
    GreekNames,
    /// Adobe's expert names: old-style figures, small capitals, ligatures.
    ExpertNames,
    /// Beta Code in the text itself.
    BetaCode,
}

/// What a scheme makes of one glyph, by its name: the text it stands for.
/// A suffix after a full stop (`alpha.alt`, `Osmall.001`) is left aside.
pub fn by_name(name: &str) -> Option<(Scheme, String)> {
    let name = name.split('.').next().unwrap_or(name);
    if name.is_empty() {
        return None;
    }
    if let Some(text) = greek_names::by_name(name) {
        return Some((Scheme::GreekNames, text));
    }
    expert::by_name(name).map(|text| (Scheme::ExpertNames, text))
}

/// Composes a standalone breathing or accent with the capital that follows
/// it, or with the small vowel before it (as a font draws a mark as a glyph
/// of its own over the letter it follows, the spaces between taken away),
/// and makes a σ at the end of a word ς: over a line already translated.
pub fn mend_greek(line: &str) -> String {
    let chars: Vec<char> = line.chars().collect();
    let mut out: Vec<char> = Vec::with_capacity(chars.len());
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if let (Some(marks), Some(&next)) = (greek_names::marks_of_spacing(c), chars.get(i + 1))
            && is_capital_for_marks(next)
        {
            out.extend(with_marks(next, marks));
            i += 2;
            continue;
        }
        if let Some(marks) = greek_names::marks_after(c) {
            // The letter before it, over at most two spaces.
            let spaces = out.iter().rev().take_while(|&&p| p == ' ').count();
            if spaces <= 2
                && let Some(&before) = out.get(out.len().wrapping_sub(spaces + 1))
                && takes_marks(before, &marks)
            {
                out.truncate(out.len() - spaces - 1);
                out.extend(with_marks(before, &marks));
                i += 1;
                continue;
            }
        }
        out.push(c);
        i += 1;
    }
    mend_sigmas(&out.into_iter().collect::<String>())
}

/// A letter with marks added to those it has, in the order Unicode composes
/// them: breathing, diaeresis, accent, then the iota below.
fn with_marks(letter: char, marks: &[char]) -> Vec<char> {
    let mut parts: Vec<char> = letter.to_string().nfd().collect();
    let base = parts.remove(0);
    parts.extend(marks.iter().copied());
    let rank = |m: &char| match m {
        '\u{0313}' | '\u{0314}' => 0,
        '\u{0308}' => 1,
        '\u{0345}' => 3,
        _ => 2,
    };
    parts.sort_by_key(rank);
    parts.dedup();
    std::iter::once(base).chain(parts).collect::<String>().nfc().collect()
}

/// Whether a small Greek letter takes marks drawn after it: a vowel, or ρ for the rough breathing alone.
fn takes_marks(letter: char, marks: &[char]) -> bool {
    let base = letter.to_string().nfd().next().unwrap_or(letter);
    matches!(base, 'α' | 'ε' | 'η' | 'ι' | 'ο' | 'υ' | 'ω') || (base == 'ρ' && marks == ['\u{0314}'])
}

/// A capital that takes its breathing and accent before it in print: a vowel or Ρ.
fn is_capital_for_marks(c: char) -> bool {
    matches!(c, 'Α' | 'Ε' | 'Η' | 'Ι' | 'Ο' | 'Υ' | 'Ω' | 'Ρ')
}

/// Beta Code in a line, where it is that: the line in Greek.
pub fn beta_code(line: &str) -> Option<String> {
    beta::beta_code(line)
}

/// Whether a character the PDF's map gives is to be trusted over the name:
/// not for nothing, a private-use character, a control character, or a
/// Latin letter or sign where the name says Greek.
pub fn map_is_wrong(mapped: &str, name: &str) -> bool {
    if mapped.is_empty() {
        return true;
    }
    if mapped.chars().any(|c| is_private_use(c) || c.is_control() || c == '\u{fffd}') {
        return true;
    }
    let name = name.split('.').next().unwrap_or(name);
    // A name that says a Greek letter or sign is the truth of the glyph: a
    // map that gives anything else is wrong, a Greek letter as much as a
    // Latin sign (the Oxford Aristophanes maps ἐ to ν and ή to ξ).
    if greek_names::says_greek(name) {
        let mapped: String = mapped.nfc().collect();
        return greek_names::by_name(name).is_some_and(|text| text != mapped);
    }
    false
}

/// What a glyph of marks alone stands for in a font's map: its combining
/// marks, which a reader puts onto the letter before (ἀ, not α᾽).
pub fn combining_of(name: &str) -> Option<String> {
    greek_names::combining_of(name.split('.').next().unwrap_or(name))
}

/// Whether a glyph's name is that of marks alone, which stand over the letter before them.
pub fn is_mark_name(name: &str) -> bool {
    greek_names::is_marks_name(name.split('.').next().unwrap_or(name))
}

fn is_private_use(c: char) -> bool {
    matches!(c, '\u{e000}'..='\u{f8ff}' | '\u{f0000}'..='\u{ffffd}' | '\u{100000}'..='\u{10fffd}')
}

/// A character of the Greek blocks, letter or sign.
fn is_greek(c: char) -> bool {
    matches!(c, '\u{0370}'..='\u{03ff}' | '\u{1f00}'..='\u{1fff}')
}

/// A combining mark of the block of combining diacritics.
fn is_combining(c: char) -> bool {
    matches!(c, '\u{0300}'..='\u{036f}')
}

/// A Greek letter, as opposed to a sign of the Greek blocks: what a word is made of.
fn is_greek_letter(c: char) -> bool {
    is_greek(c) && c.is_alphabetic() && !matches!(c, '\u{0345}' | '\u{037a}')
}

/// What a sigma before this character is left as it was given: the hyphen
/// (a word broken at the end of a line).
fn leaves_sigma(c: char) -> bool {
    matches!(c, '-' | '‐' | '\u{ad}')
}

/// Elision marks, before which a sigma stands as within a word (μή σ᾽,
/// ὅσ᾽): the Greek ones, and the apostrophe and right quotation mark, which
/// editions set for elision far more often than a Greek word ending in ς
/// stands before a closing quote.
fn is_elision(c: char) -> bool {
    matches!(c, '\u{1fbd}' | '\u{1fbf}' | '\u{02bc}' | '\'' | '’')
}

/// The sigmas as words have them: a σ at the end of a word becomes ς, and
/// a ς within a word σ. A word ends at anything that is not a Greek letter
/// or a combining mark. Before an elision mark (᾽ ʼ ' ’) a sigma is σ, as
/// the elided word is written (σ᾽ for σε), unless the ’ closes a quotation a
/// ‘ opened before it; before a hyphen it is left as it was given.
pub fn mend_sigmas(text: &str) -> String {
    let chars: Vec<char> = text.chars().collect();
    let mut out = String::with_capacity(text.len());
    for (i, &c) in chars.iter().enumerate() {
        if c != 'σ' && c != 'ς' {
            out.push(c);
            continue;
        }
        let next = chars[i + 1..].iter().copied().find(|&n| !is_combining(n));
        // A right quotation mark closes a quotation where a left one stands open before it.
        let quoted = |n: char| {
            n == '’' && {
                let before = &chars[..i];
                before.iter().filter(|&&b| b == '‘').count() > before.iter().filter(|&&b| b == '’').count()
            }
        };
        let mended = match next {
            Some(n) if quoted(n) => 'ς',
            Some(n) if is_greek_letter(n) || is_elision(n) => 'σ',
            Some(n) if leaves_sigma(n) => c,
            _ => 'ς',
        };
        out.push(mended);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    /// As the Oxford Aristophanes keeps its Greek: the map gives other Greek
    /// letters for accented ones, and draws some marks as glyphs of their own
    /// after the letter they stand over.
    #[test]
    fn a_map_that_lies_in_greek_and_marks_drawn_after_their_letter() {
        assert!(map_is_wrong("ν", "epsilonlenis"));
        assert!(map_is_wrong("ξ", "etaacute"));
        assert!(!map_is_wrong("ἐ", "epsilonlenis"));
        assert!(!map_is_wrong("α", "alpha"));
        assert!(!map_is_wrong("`", "grave"), "an accent alone may be a Latin font's");
        assert!(is_mark_name("lenisgrave") && is_mark_name("grave") && !is_mark_name("alphagrave"));
        assert_eq!(mend_greek("μα ` τὴν"), "μὰ τὴν", "the space before the mark goes");
        assert_eq!(mend_greek("κα῍ν"), "κἂν");
        assert_eq!(mend_greek("α᾽πειλαῖς"), "ἀπειλαῖς");
        assert_eq!(mend_greek("ά῾"), "ἅ", "a breathing goes before the accent the letter has");
        assert_eq!(mend_greek("δ᾽ ἐκείνου"), "δ᾽ ἐκείνου", "after a consonant it is elision");
        assert_eq!(mend_greek("μή ς’ ἐκφάγω"), "μή σ’ ἐκφάγω");
        assert_eq!(mend_sigmas("‘λόγος’ ὅσ’"), "‘λόγος’ ὅσ’");
    }

    fn greek(name: &str) -> String {
        match by_name(name) {
            Some((Scheme::GreekNames, text)) => text,
            other => panic!("{name} gave {other:?}"),
        }
    }

    #[test]
    fn the_greek_names_of_the_book() {
        let names = [
            ("alpha", "α"),
            ("Theta", "Θ"),
            ("Gamma", "Γ"),
            ("chi", "χ"),
            ("epsilonacute", "έ"),
            ("zeta", "ζ"),
            ("omega", "ω"),
            ("Omicron", "Ο"),
            ("asperacute", "\u{1fde}"),
            ("eta", "η"),
            ("rho", "ρ"),
            ("omicron", "ο"),
            ("nu", "ν"),
            ("epsilonlenis", "ἐ"),
            ("xi", "ξ"),
            ("asper", "\u{1ffe}"),
            ("etaacute", "ή"),
            ("upsilon", "υ"),
            ("sigmafinalt", "ς"),
            ("phi", "φ"),
            ("iotaacute", "ί"),
            ("epsilon", "ε"),
            ("iota", "ι"),
            ("Alpha", "Α"),
            ("Chi", "Χ"),
            ("Rho", "Ρ"),
            ("Nu", "Ν"),
            ("Eta", "Η"),
            ("Sigmafinalt", "Σ"),
            ("Phi", "Φ"),
            ("Delta", "Δ"),
            ("Upsilon", "Υ"),
            ("Pi", "Π"),
            ("Epsilon", "Ε"),
            ("Iota", "Ι"),
            ("lenis", "\u{1fbd}"),
            ("kappa", "κ"),
            ("lambda", "λ"),
            ("upsilonasper", "ὑ"),
            ("tau", "τ"),
            ("Alphalenis", "Ἀ"),
            ("theta", "θ"),
            ("omegatildeiota", "ῷ"),
            ("etaaspergrave", "ἣ"),
            ("pi", "π"),
            ("upsilontilde", "ῦ"),
            ("upsilongrave", "ὺ"),
            ("rhoasper", "ῥ"),
            ("iotagrave", "ὶ"),
            ("omegatilde", "ῶ"),
            ("omicrongrave", "ὸ"),
            ("delta", "δ"),
            ("etatilde", "ῆ"),
            ("omicronacute", "ό"),
            ("upsilonlenis", "ὐ"),
            ("gamma", "γ"),
            ("upsilonacute", "ύ"),
            ("etaasper", "ἡ"),
            ("alphaiota", "ᾳ"),
            ("omicronlenisacute", "ὄ"),
            ("upsilonasperacute", "ὕ"),
            ("alphatildeiota", "ᾷ"),
            ("omegalenisgrave", "ὢ"),
            ("alphatildelenisiota", "ᾆ"),
            ("omicronaspergrave", "ὃ"),
            ("etalenisacuteiota", "ᾔ"),
            ("etalenis", "ἠ"),
            ("tildelenis", "\u{1fcf}"),
            ("omegalenisacuteiota", "ᾤ"),
            ("etatildeasper", "ἧ"),
            ("iotaasperacute", "ἵ"),
            ("upsilontildeasper", "ὗ"),
            ("alphaacuteiota", "ᾴ"),
            ("upsilonacutedieresis", "ΰ"),
            ("iotaacutedieresis", "ΐ"),
            ("etatildelenisiota", "ᾖ"),
            ("etatildeasperiota", "ᾗ"),
            ("Alphalenisacute", "Ἄ"),
            ("epsilonaspergrave", "ἓ"),
            ("alphatildeasperiota", "ᾇ"),
            ("iotagravedieresis", "ῒ"),
            ("tildeasper", "\u{1fdf}"),
        ];
        assert!(names.len() >= 30);
        for (name, want) in names {
            // What is compared is the text in its composed form.
            let want: String = want.nfc().collect();
            assert_eq!(greek(name), want, "{name}");
        }
        // Others, and the spacing signs of marks alone.
        assert_eq!(greek("sigma"), "σ");
        assert_eq!(greek("sigmalunate"), "σ");
        assert_eq!(greek("Omegaasperacuteiota"), "ᾭ");
        assert_eq!(greek("Rhoasper"), "Ῥ");
        assert_eq!(greek("alpha.alt"), "α");
        assert_eq!(greek("lenisacute"), "\u{1fce}");
        assert_eq!(greek("aspergrave"), "\u{1fdd}");
        assert_eq!(greek("lenisgrave"), "\u{1fcd}");
        assert_eq!(greek("acute"), "\u{0384}");
        assert_eq!(greek("grave"), "\u{1fef}");
        assert_eq!(greek("tilde"), "\u{1fc0}");
        assert_eq!(greek("dieresis"), "\u{a8}");
        assert_eq!(greek("dieresisacute"), "\u{0385}");
        // What is not a Greek name is not taken for one.
        for name in [
            "a",
            "one",
            "comma",
            "Osmall",
            "Psmall",
            "Esmall",
            "alphax",
            "etaasperbold",
            "uni1F00",
            "circumflex",
            "numbersign",
            "",
        ] {
            assert!(!matches!(by_name(name), Some((Scheme::GreekNames, _))), "{name}");
        }
    }

    #[test]
    fn every_name_of_the_fonts_of_the_book() {
        // The names of PorsonGreekSF and BemboExpert in Wilson's Aristophanes, all but the plain punctuation.
        let names = "Alpha Alphalenis Alphalenisacute Asmall Beta Bsmall Chi Csmall Delta Dsmall Epsilon Eta Fsmall Gamma Iota \
            Kappa Lambda Mu Nu Omega Omicron Osmall Phi Pi Psi Psmall Rho Sigma Sigmafinalt Tau Theta Upsilon Xi Xsmall \
            Zeta acute alpha alphaacuteiota alphaiota alphatilde alphatildeasperiota alphatildeiota alphatildelenisiota \
            asper asperacute aspergrave beta chi delta eightoldstyle epsilon epsilonacute epsilonasper epsilonasperacute \
            epsilonaspergrave epsilongrave epsilonlenis epsilonlenisacute epsilonlenisgrave eta etaacute etaacuteiota \
            etaasper etaasperacute etaaspergrave etaasperiota etagrave etagraveiota etaiota etalenis etalenisacute \
            etalenisacuteiota etalenisgrave etalenisiota etatilde etatildeasper etatildeasperiota etatildeiota \
            etatildelenis etatildelenisiota ff ffi fi fiveoldstyle fl fouroldstyle gamma grave iota iotaacute \
            iotaacutedieresis iotaasper iotaasperacute iotaaspergrave iotadieresis iotagrave iotagravedieresis iotalenis \
            iotalenisacute iotatilde iotatildeasper iotatildelenis kappa lambda lenis lenisacute lenisgrave mu \
            nineoldstyle nu omega omegaacute omegaacuteiota omegaasper omegaasperacute omegaaspergrave omegagrave \
            omegagraveiota omegaiota omegalenis omegalenisacute omegalenisacuteiota omegalenisgrave omegalenisiota \
            omegatilde omegatildeasper omegatildeasperiota omegatildeiota omegatildelenis omegatildelenisiota omicron \
            omicronacute omicronasper omicronasperacute omicronaspergrave omicrongrave omicronlenis omicronlenisacute \
            omicronlenisgrave oneoldstyle onesuperior phi pi psi rho rhoasper sevenoldstyle sigma sigmafinalt sixoldstyle \
            tau theta threeoldstyle threesuperior tilde tildeasper tildelenis twooldstyle twosuperior upsilon \
            upsilonacute upsilonacutedieresis upsilonasper upsilonasperacute upsilonaspergrave upsilondieresis \
            upsilongrave upsilonlenis upsilonlenisacute upsilontilde upsilontildeasper upsilontildelenis xi zerooldstyle \
            zeta";
        for name in names.split_whitespace() {
            match by_name(name) {
                // Every Greek glyph of the book is one character, its marks composed with its letter.
                Some((Scheme::GreekNames, text)) => assert_eq!(text.chars().count(), 1, "{name} gave {text}"),
                Some((Scheme::ExpertNames, text)) => {
                    assert!((!text.is_empty() && text.is_ascii()) || text.chars().count() == 1, "{name} gave {text}")
                }
                other => panic!("{name} gave {other:?}"),
            }
        }
    }

    #[test]
    fn the_expert_names() {
        let expert = |name: &str| match by_name(name) {
            Some((Scheme::ExpertNames, text)) => text,
            other => panic!("{name} gave {other:?}"),
        };
        assert_eq!(expert("Osmall"), "o");
        assert_eq!(expert("Xsmall"), "x");
        assert_eq!(expert("twooldstyle"), "2");
        assert_eq!(expert("sixoldstyle"), "6");
        assert_eq!(expert("Dsmall"), "d");
        assert_eq!(expert("Psmall"), "p");
        assert_eq!(expert("zerooldstyle"), "0");
        assert_eq!(expert("nineoldstyle.001"), "9");
        assert_eq!(expert("Agravesmall"), "à");
        assert_eq!(expert("AEsmall"), "æ");
        assert_eq!(expert("Oslashsmall"), "ø");
        assert_eq!(expert("Dieresissmall"), "¨");
        assert_eq!(expert("ff"), "ff");
        assert_eq!(expert("ffi"), "ffi");
        assert_eq!(expert("f_f_l"), "ffl");
        assert_eq!(expert("s_t"), "st");
        assert_eq!(expert("commasuperior"), ",");
        assert_eq!(expert("periodsuperior"), ".");
        assert_eq!(expert("threesuperior"), "³");
        assert_eq!(expert("oneinferior"), "₁");
        assert_eq!(expert("dollaroldstyle"), "$");
        assert_eq!(expert("questionsmall"), "?");
        for name in ["a", "two", "Asmallish", "small", "oldstyle", "f_xx"] {
            assert_eq!(by_name(name), None, "{name}");
        }
    }

    #[test]
    fn a_map_is_wrong_where_it_gives_nothing_or_latin_for_greek() {
        assert!(map_is_wrong("", "sigmafinalt"));
        assert!(map_is_wrong("V", "etaasper"));
        assert!(map_is_wrong("%", "alphaacute"));
        assert!(map_is_wrong("\u{f730}", "zerooldstyle"));
        assert!(map_is_wrong("\u{1}", "a"));
        assert!(!map_is_wrong("ἡ", "etaasper"));
        assert!(!map_is_wrong("α", "alpha"));
        assert!(!map_is_wrong("a", "a"));
        assert!(!map_is_wrong("0", "zerooldstyle"));
        // A spacing accent of a Latin font is trusted: its name is no more Greek than Latin.
        assert!(!map_is_wrong("´", "acute"));
        assert!(map_is_wrong("´", "lenisacute"));
    }

    #[test]
    fn signs_composed_with_the_capital_after_them() {
        assert_eq!(mend_greek("῞Α"), "Ἅ");
        assert_eq!(mend_greek("\u{1fbd}Αλλά"), "Ἀλλά");
        assert_eq!(mend_greek("῾Ρόδος"), "Ῥόδος");
        assert_eq!(mend_greek("῎Ω"), "\u{1f6c}");
        // Before a consonant or a small letter, or with a space between, the sign stays.
        assert_eq!(mend_greek("γ᾽ εἰ"), "γ᾽ εἰ");
        assert_eq!(mend_greek("᾽Μ"), "᾽Μ");
        assert_eq!(mend_greek("῞ Α"), "῞ Α");
    }

    #[test]
    fn sigmas_at_the_end_of_a_word_and_within_it() {
        assert_eq!(mend_greek("ἐγέλασα σοφός σ."), "ἐγέλασα σοφός ς.");
        assert_eq!(mend_sigmas("σοφοσ ἀπειλαῖσ, ψολοκομπίαισ"), "σοφος ἀπειλαῖς, ψολοκομπίαις");
        assert_eq!(mend_sigmas("ἐγέλαςα ςοφός"), "ἐγέλασα σοφός");
        assert_eq!(mend_sigmas("λόγοσ\u{301}·"), "λόγος\u{301}·");
        assert_eq!(mend_sigmas("ΣΟΦΟΣ"), "ΣΟΦΟΣ");
        assert_eq!(mend_sigmas("σ"), "ς");
        // A Latin letter ends a Greek word.
        assert_eq!(mend_sigmas("λόγοσc"), "λόγοςc");
        // Before an elision mark, the sigma of the elided word.
        assert_eq!(mend_sigmas("εἰ μή ς᾽ ἐκφάγω"), "εἰ μή σ᾽ ἐκφάγω");
        assert_eq!(mend_sigmas("ὅσ᾽ ἂν"), "ὅσ᾽ ἂν");
        // Before an apostrophe or a quote, and before a hyphen, as it was given.
        assert_eq!(mend_sigmas("‘λόγος’ μή σ’"), "‘λόγος’ μή σ’");
        assert_eq!(mend_sigmas("ἐγέλασ-"), "ἐγέλασ-");
    }

    #[test]
    fn beta_code_in_a_line() {
        assert_eq!(
            beta_code("mh=nin a)/eide qea\\ *phlhi+a/dew *)axilh=os").as_deref(),
            Some("μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος")
        );
        assert_eq!(beta_code("MH=NIN A)/EIDE QEA\\").as_deref(), Some("μῆνιν ἄειδε θεὰ"));
        assert_eq!(
            beta_code("*a)/xilleu, ou)lome/nhn, h(\\ muri/' *)axaioi=s a)/lge' e)/qhke:").as_deref(),
            Some("Ἄχιλλευ, οὐλομένην, ἣ μυρί᾽ Ἀχαιοῖς ἄλγε᾽ ἔθηκε·")
        );
        assert_eq!(beta_code("*a)/xilleu").as_deref(), beta_code("*)/axilleu").as_deref());
        // The sigmas by their place in the word, whatever number they were given.
        assert_eq!(beta_code("lo/gos1 lo/gos2 lo/gos3 s1o/s3").as_deref(), Some("λόγος λόγος λόγος σός"));
        // English with a parenthesis, and Norwegian: not Beta Code.
        assert_eq!(beta_code("The wrath (of Achilles) and the ships"), None);
        // One mark in a line of Latin is not enough.
        assert_eq!(beta_code("km/h (approx.)"), None);
        assert_eq!(beta_code("Det er ikke (som) med det"), None);
        assert_eq!(beta_code("Homer, Iliad 1.1"), None);
        assert_eq!(beta_code(""), None);
    }
}
