//! The publication types and fields the application knows, read from
//! `resources/biblatex/schema.json`, which the interface reads as well.

use std::collections::HashMap;
use std::sync::OnceLock;

use serde::Deserialize;

const SCHEMA_JSON: &str = include_str!("../../../../resources/biblatex/schema.json");

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Schema {
    pub fields: HashMap<String, FieldDef>,
    pub types: Vec<TypeDef>,
    pub type_aliases: HashMap<String, TypeAlias>,
    pub field_aliases: HashMap<String, String>,
}

#[derive(Debug, Deserialize)]
pub struct FieldDef {
    pub label: String,
    pub kind: String,
    pub group: String,
}

#[derive(Debug, Deserialize)]
pub struct TypeDef {
    pub id: String,
    pub label: String,
    pub group: String,
    pub primary: Vec<String>,
    pub secondary: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct TypeAlias {
    #[serde(rename = "type")]
    pub entry_type: String,
    #[serde(default)]
    pub set: HashMap<String, String>,
}

pub fn schema() -> &'static Schema {
    static SCHEMA: OnceLock<Schema> = OnceLock::new();
    SCHEMA.get_or_init(|| serde_json::from_str(SCHEMA_JSON).expect("the bundled schema is valid"))
}

impl Schema {
    pub fn type_def(&self, id: &str) -> Option<&TypeDef> {
        self.types.iter().find(|t| t.id == id)
    }

    pub fn type_label(&self, id: &str) -> String {
        self.type_def(id).map(|t| t.label.clone()).unwrap_or_else(|| id.to_owned())
    }
}

/// Types that are whole publications with an ISBN of their own, as against
/// parts of one, which carry the ISBN of the book they are in.
pub fn is_whole_book(entry_type: &str) -> bool {
    matches!(
        entry_type,
        "book"
            | "mvbook"
            | "collection"
            | "mvcollection"
            | "reference"
            | "mvreference"
            | "proceedings"
            | "mvproceedings"
            | "commentary"
            | "booklet"
            | "manual"
            | "thesis"
            | "report"
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_schema_is_consistent() {
        let s = schema();
        assert!(s.types.len() > 30);
        for t in &s.types {
            for f in t.primary.iter().chain(&t.secondary) {
                assert!(s.fields.contains_key(f), "{}: unknown field {f}", t.id);
            }
            let mut seen = std::collections::HashSet::new();
            for f in t.primary.iter().chain(&t.secondary) {
                assert!(seen.insert(f), "{}: {f} is listed twice", t.id);
            }
        }
        for (alias, target) in &s.type_aliases {
            assert!(s.type_def(&target.entry_type).is_some(), "{alias}");
        }
        for target in s.field_aliases.values() {
            assert!(s.fields.contains_key(target) || target == "file", "{target}");
        }
    }
}
