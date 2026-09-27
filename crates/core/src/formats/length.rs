//! Lengths as people write them: `2.5cm`, `1in`, `12pt`, `25mm`.

use std::fmt;

use serde::{Deserialize, Deserializer, Serialize, Serializer};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Unit {
    Pt,
    Mm,
    Cm,
    In,
}

/// A length, kept in the unit it was given in.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Length {
    pub value: f32,
    pub unit: Unit,
}

impl Length {
    pub const fn pt(value: f32) -> Self {
        Length { value, unit: Unit::Pt }
    }

    pub const fn mm(value: f32) -> Self {
        Length { value, unit: Unit::Mm }
    }

    pub const fn cm(value: f32) -> Self {
        Length { value, unit: Unit::Cm }
    }

    pub const fn inch(value: f32) -> Self {
        Length { value, unit: Unit::In }
    }

    /// In points, of which there are 72 to the inch.
    pub fn points(&self) -> f32 {
        match self.unit {
            Unit::Pt => self.value,
            Unit::Mm => self.value * 72.0 / 25.4,
            Unit::Cm => self.value * 72.0 / 2.54,
            Unit::In => self.value * 72.0,
        }
    }

    /// In twentieths of a point, as Word counts.
    pub fn twips(&self) -> i32 {
        (self.points() * 20.0).round() as i32
    }

    pub fn is_zero(&self) -> bool {
        self.value.abs() < 1e-4
    }

    pub fn parse(text: &str) -> Option<Self> {
        let t = text.trim().to_ascii_lowercase().replace(',', ".");
        if t.is_empty() {
            return None;
        }
        let split = t.find(|c: char| c.is_ascii_alphabetic() || c == '"' || c == '″').unwrap_or(t.len());
        let (number, unit) = t.split_at(split);
        let value: f32 = number.trim().parse().ok()?;
        if !value.is_finite() {
            return None;
        }
        let unit = match unit.trim() {
            "" | "pt" | "pts" | "point" | "points" => Unit::Pt,
            "mm" => Unit::Mm,
            "cm" => Unit::Cm,
            "in" | "inch" | "inches" | "\"" | "″" => Unit::In,
            _ => return None,
        };
        Some(Length { value, unit })
    }
}

impl Default for Length {
    fn default() -> Self {
        Length::pt(0.0)
    }
}

impl fmt::Display for Length {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let unit = match self.unit {
            Unit::Pt => "pt",
            Unit::Mm => "mm",
            Unit::Cm => "cm",
            Unit::In => "in",
        };
        // Without the noise of floating point: 2.5cm, not 2.4999998cm.
        let rounded = (self.value * 1000.0).round() / 1000.0;
        write!(f, "{rounded}{unit}")
    }
}

impl Serialize for Length {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

impl<'de> Deserialize<'de> for Length {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        #[derive(Deserialize)]
        #[serde(untagged)]
        enum Either {
            Text(String),
            Number(f32),
        }
        match Either::deserialize(deserializer)? {
            Either::Text(s) => {
                Length::parse(&s).ok_or_else(|| serde::de::Error::custom(format!("“{s}” is not a length")))
            }
            Either::Number(n) => Ok(Length::pt(n)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reading_and_writing() {
        assert_eq!(Length::parse("2.5cm"), Some(Length::cm(2.5)));
        assert_eq!(Length::parse(" 2,54 CM "), Some(Length::cm(2.54)));
        assert_eq!(Length::parse("1in"), Some(Length::inch(1.0)));
        assert_eq!(Length::parse("1\""), Some(Length::inch(1.0)));
        assert_eq!(Length::parse("12"), Some(Length::pt(12.0)));
        assert_eq!(Length::parse("25 mm"), Some(Length::mm(25.0)));
        assert_eq!(Length::parse("wide"), None);
        assert_eq!(Length::parse("3em"), None);
        assert_eq!(Length::cm(2.5).to_string(), "2.5cm");
        assert_eq!(Length::inch(0.5).to_string(), "0.5in");
        assert_eq!(Length::pt(0.1 + 0.2).to_string(), "0.3pt");
    }

    #[test]
    fn measures() {
        assert_eq!(Length::inch(1.0).points(), 72.0);
        assert!((Length::cm(2.54).points() - 72.0).abs() < 0.001);
        assert_eq!(Length::inch(1.0).twips(), 1440);
        assert_eq!(Length::mm(25.4).twips(), 1440);
    }

    #[test]
    fn in_json() {
        let l: Length = serde_json::from_str("\"1.27cm\"").unwrap();
        assert_eq!(l, Length::cm(1.27));
        let n: Length = serde_json::from_str("12").unwrap();
        assert_eq!(n, Length::pt(12.0));
        assert_eq!(serde_json::to_string(&l).unwrap(), "\"1.27cm\"");
        assert!(serde_json::from_str::<Length>("\"x\"").is_err());
    }
}
