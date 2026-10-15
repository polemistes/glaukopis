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
/// it, and makes a σ at the end of a word ς: over a line already translated.
pub fn mend_greek(line: &str) -> String {
    let chars: Vec<char> = line.chars().collect();
    let mut out = String::with_capacity(line.len());
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if let (Some(marks), Some(&next)) = (greek_names::marks_of_spacing(c), chars.get(i + 1))
            && is_capital_for_marks(next)
        {
            let composed: String =
                std::iter::once(next).chain(marks.iter().copied()).collect::<String>().nfc().collect();
            out.push_str(&composed);
            i += 2;
            continue;
        }
        out.push(c);
        i += 1;
    }
    mend_sigmas(&out)
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
    greek_names::says_greek(name) && mapped.chars().any(|c| !is_greek(c) && !is_combining(c))
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

/// What a sigma before this character is left as it was given: a sign that
/// may end a word or carry it on, the apostrophe or closing quote (elision
/// or quotation) and the hyphen (a word broken at the end of a line).
fn leaves_sigma(c: char) -> bool {
    matches!(c, '\'' | '’' | '-' | '‐' | '\u{ad}')
}

/// Elision marks proper, before which a sigma stands as within a word (μή σ᾽).
fn is_elision(c: char) -> bool {
    matches!(c, '\u{1fbd}' | '\u{1fbf}' | '\u{02bc}')
}

/// The sigmas as words have them: a σ at the end of a word becomes ς, and
/// a ς within a word σ. A word ends at anything that is not a Greek letter
/// or a combining mark. Before an elision mark (᾽ ʼ) a sigma is σ, as the
/// elided word is written (σ᾽ for σε); before an apostrophe or a closing
/// quote (' ’), which may mark elision or end a quotation, and before a
/// hyphen, it is left as it was given.
pub fn mend_sigmas(text: &str) -> String {
    let chars: Vec<char> = text.chars().collect();
    let mut out = String::with_capacity(text.len());
    for (i, &c) in chars.iter().enumerate() {
        if c != 'σ' && c != 'ς' {
            out.push(c);
            continue;
        }
        let next = chars[i + 1..].iter().copied().find(|&n| !is_combining(n));
        let mended = match next {
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
        for name in ["a", "one", "comma", "Osmall", "Psmall", "Esmall", "alphax", "etaasperbold", "uni1F00", ""] {
            assert!(!matches!(by_name(name), Some((Scheme::GreekNames, _))), "{name}");
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
