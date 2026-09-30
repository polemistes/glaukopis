//! Mathematics as it is shown where it is written.
//!
//! What is written in the notation of TeX is read by Pandoc, as it is when a
//! document is made, and given back as MathML, which the window shows by
//! itself. So what is seen while writing is what Pandoc made of the formula,
//! and a formula it cannot read is known before a document is made.

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use super::tools::{self, Tools};
use crate::error::Result;
use crate::tr;

/// The most formulas read in one run.
const AT_ONCE: usize = 400;
/// The most one formula may hold.
const LONGEST: usize = 20_000;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Formula {
    pub tex: String,
    /// On a line of its own, and not in the line.
    #[serde(default)]
    pub display: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Rendered {
    /// The formula as MathML, when it was read.
    pub mathml: Option<String>,
    /// What kept it from being read.
    pub problem: Option<String>,
}

/// What Pandoc says of a formula it could not read, in words for the one who wrote it.
fn said(warning: &str) -> String {
    let unexpected = warning.lines().map(str::trim).find_map(|l| l.strip_prefix("unexpected "));
    match unexpected {
        Some("eof") | Some("end of input") => tr!("core-export-formula-incomplete"),
        Some(what) => match what.strip_prefix("control sequence ") {
            Some(command) => tr!("core-export-formula-unknown", command = command),
            None => tr!("core-export-formula-unexpected", what = what.trim_matches('"')),
        },
        None => tr!("core-export-formula-unreadable"),
    }
}

/// The formulas as MathML, in their order.
pub fn render(tools: &Tools, formulas: &[Formula]) -> Result<Vec<Rendered>> {
    let mut out = Vec::with_capacity(formulas.len());
    for some in formulas.chunks(AT_ONCE) {
        out.extend(render_some(tools, some)?);
    }
    Ok(out)
}

fn render_some(tools: &Tools, formulas: &[Formula]) -> Result<Vec<Rendered>> {
    let mut results = vec![Rendered::default(); formulas.len()];
    let mut blocks: Vec<Value> = Vec::new();
    for (i, f) in formulas.iter().enumerate() {
        let tex = f.tex.trim();
        if tex.is_empty() {
            continue;
        }
        if tex.len() > LONGEST {
            results[i].problem = Some(tr!("core-export-formula-too-long"));
            continue;
        }
        let kind = if f.display { "DisplayMath" } else { "InlineMath" };
        blocks.push(json!({
            "t": "Div",
            "c": [[format!("m-{i}"), [], []], [{"t": "Para", "c": [{"t": "Math", "c": [{"t": kind}, tex]}]}]],
        }));
    }
    if blocks.is_empty() {
        return Ok(results);
    }
    let pandoc = tools.pandoc()?;
    let document = json!({ "pandoc-api-version": tools.pandoc_api, "meta": {}, "blocks": blocks });
    let ran = tools::run(
        &pandoc.path,
        "Pandoc",
        ["-f", "json", "-t", "html", "--mathml", "--wrap=none"],
        Some(&serde_json::to_vec(&document)?),
        None,
    )?;

    // What could not be read is said in the order it stands in.
    let mut problems = ran
        .messages
        .split("[WARNING] ")
        .filter(|w| w.starts_with("Could not convert TeX math"))
        .map(said)
        .collect::<Vec<_>>()
        .into_iter();

    let html = String::from_utf8_lossy(&ran.stdout);
    for part in html.split("<div id=\"m-").skip(1) {
        let Some((number, rest)) = part.split_once('"') else { continue };
        let Ok(i) = number.parse::<usize>() else { continue };
        let Some(result) = results.get_mut(i) else { continue };
        match (rest.find("<math"), rest.rfind("</math>")) {
            (Some(a), Some(b)) if a < b => result.mathml = Some(rest[a..b + "</math>".len()].to_owned()),
            _ => {
                result.problem = Some(problems.next().unwrap_or_else(|| tr!("core-export-formula-unreadable")));
            }
        }
    }
    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn what_is_said_of_a_formula() {
        let w = "Could not convert TeX math \\frac{1}{, rendering as TeX:\n  \\frac{1}{\n           ^\n  unexpected eof\n  expecting white space";
        assert_eq!(said(w), "The formula ends before it is complete.");
        let w = "Could not convert TeX math \\foo{x}, rendering as TeX:\n  \\foo{x}\n      ^\n  unexpected control sequence \\foo\n  expecting";
        assert_eq!(said(w), "\\foo is not known.");
        let w = "Could not convert TeX math x }, rendering as TeX:\n  x }\n    ^\n  unexpected \"}\"\n  expecting";
        assert_eq!(said(w), "} was not expected where it stands.");
        assert_eq!(said("Could not convert"), "The formula could not be read.");
    }

    #[test]
    fn formulas_as_they_are_shown() {
        let tools = tools::discover(&tools::Configured::default());
        if tools.pandoc.is_none() {
            crate::testing::passed_over("Pandoc is not installed");
            return;
        }
        let f = |tex: &str, display: bool| Formula { tex: tex.into(), display };
        let out = render(
            &tools,
            &[
                f("a^2 + b^2 = c^2", true),
                f("\\frac{1}{", false),
                f("  ", false),
                f("\\text{<b>x</b>} \\leq \\alpha", false),
                f("\\foo{x}", true),
            ],
        )
        .unwrap();
        assert_eq!(out.len(), 5);
        let first = out[0].mathml.as_deref().unwrap();
        assert!(first.starts_with("<math display=\"block\""), "{first}");
        assert!(first.ends_with("</math>"));
        assert!(first.contains("<msup><mi>a</mi><mn>2</mn></msup>"));
        assert_eq!(out[1].mathml, None);
        assert_eq!(out[1].problem.as_deref(), Some("The formula ends before it is complete."));
        assert_eq!(out[2], Rendered::default());
        let text = out[3].mathml.as_deref().unwrap();
        assert!(text.contains("&lt;b&gt;x&lt;/b&gt;") && !text.contains("<b>"), "{text}");
        assert!(text.starts_with("<math display=\"inline\""));
        assert_eq!(out[4].problem.as_deref(), Some("\\foo is not known."));
    }
}
