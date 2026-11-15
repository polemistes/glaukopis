//! What a file says of itself, read where it lies before it is copied into
//! the store: the copy loses the file's own time, and a photograph made
//! upright to be shown loses what its Exif says. Nothing is ever an error:
//! where a file says nothing, nothing is known.

use std::fs;
use std::io::BufReader;
use std::path::Path;

use exif::{In, Reader, Tag, Value};
use serde::Serialize;

/// What a file says of itself.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Facts {
    /// When it was last changed, as the library writes times (RFC 3339, in seconds).
    pub time: Option<String>,
    /// Of a photograph, when it was taken, as the camera says it, of no
    /// time zone: `2026-11-15T14:03:22`.
    pub taken: Option<String>,
    /// Of a photograph, where it was taken.
    pub place: Option<Place>,
}

/// Where on the earth, in degrees: north and east are positive.
#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
pub struct Place {
    pub lat: f64,
    pub lon: f64,
}

/// The endings of the files whose Exif is read: photographs, as cameras and
/// telephones write them.
const WITH_EXIF: [&str; 10] = ["jpg", "jpeg", "jpe", "tif", "tiff", "png", "webp", "heic", "heif", "avif"];

/// A TIFF is read whole to find its Exif; one larger than this is not read.
const LARGEST_READ: u64 = 256 * 1024 * 1024;

/// What the file at `path` says of itself.
pub fn facts(path: &Path) -> Facts {
    let Ok(meta) = fs::metadata(path) else { return Facts::default() };
    let time = meta.modified().ok().and_then(|t| {
        let t: time::OffsetDateTime = t.into();
        t.replace_nanosecond(0).unwrap_or(t).format(&time::format_description::well_known::Rfc3339).ok()
    });
    let ending = path.extension().map(|e| e.to_string_lossy().to_ascii_lowercase()).unwrap_or_default();
    let (taken, place) = if meta.is_file() && meta.len() <= LARGEST_READ && WITH_EXIF.contains(&ending.as_str()) {
        photograph(path)
    } else {
        (None, None)
    };
    Facts { time, taken, place }
}

/// When and where a photograph was taken, as its Exif says.
fn photograph(path: &Path) -> (Option<String>, Option<Place>) {
    let Ok(file) = fs::File::open(path) else { return (None, None) };
    let Ok(exif) = Reader::new().read_from_container(&mut BufReader::new(file)) else { return (None, None) };
    let taken = [Tag::DateTimeOriginal, Tag::DateTimeDigitized, Tag::DateTime].into_iter().find_map(|tag| {
        let Value::Ascii(ref parts) = exif.get_field(tag, In::PRIMARY)?.value else { return None };
        let t = exif::DateTime::from_ascii(parts.first()?).ok()?;
        let valid = (1..=12).contains(&t.month) && (1..=31).contains(&t.day) && t.hour < 24 && t.minute < 60;
        valid.then(|| {
            format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}", t.year, t.month, t.day, t.hour, t.minute, t.second.min(59))
        })
    });
    let degrees = |tag: Tag, reference: Tag, negative: u8| -> Option<f64> {
        let Value::Rational(ref parts) = exif.get_field(tag, In::PRIMARY)?.value else { return None };
        let part = |i: usize| parts.get(i).filter(|r| r.denom != 0).map(|r| r.to_f64());
        let value = part(0)? + part(1).unwrap_or(0.0) / 60.0 + part(2).unwrap_or(0.0) / 3600.0;
        let side = match exif.get_field(reference, In::PRIMARY).map(|f| &f.value) {
            Some(Value::Ascii(said)) => said.first().and_then(|s| s.first()).map(u8::to_ascii_uppercase),
            _ => None,
        };
        Some(if side == Some(negative) { -value } else { value })
    };
    let place = match (
        degrees(Tag::GPSLatitude, Tag::GPSLatitudeRef, b'S'),
        degrees(Tag::GPSLongitude, Tag::GPSLongitudeRef, b'W'),
    ) {
        (Some(lat), Some(lon)) if lat.abs() <= 90.0 && lon.abs() <= 180.0 => Some(Place { lat, lon }),
        _ => None,
    };
    (taken, place)
}

#[cfg(test)]
mod tests {
    use super::*;
    use exif::experimental::Writer;
    use exif::{Field, Rational};

    /// A JPEG of nothing but its start, an Exif segment and its end: enough
    /// for what reads the Exif, which looks at nothing else.
    fn jpeg_with(fields: &[Field]) -> Vec<u8> {
        let mut writer = Writer::new();
        for field in fields {
            writer.push_field(field);
        }
        let mut tiff = std::io::Cursor::new(Vec::new());
        writer.write(&mut tiff, false).unwrap();
        let tiff = tiff.into_inner();
        let mut out = vec![0xff, 0xd8, 0xff, 0xe1];
        out.extend_from_slice(&((tiff.len() + 8) as u16).to_be_bytes());
        out.extend_from_slice(b"Exif\0\0");
        out.extend_from_slice(&tiff);
        out.extend_from_slice(&[0xff, 0xd9]);
        out
    }

    fn ascii(tag: Tag, text: &str) -> Field {
        Field { tag, ifd_num: In::PRIMARY, value: Value::Ascii(vec![text.as_bytes().to_vec()]) }
    }

    fn rationals(tag: Tag, parts: &[(u32, u32)]) -> Field {
        let value = Value::Rational(parts.iter().map(|&(num, denom)| Rational { num, denom }).collect());
        Field { tag, ifd_num: In::PRIMARY, value }
    }

    #[test]
    fn a_photograph_says_when_and_where_it_was_taken() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("IMG_0001.JPG");
        let fields = [
            ascii(Tag::DateTime, "2026:11:16 09:00:00"),
            ascii(Tag::DateTimeOriginal, "2026:11:15 14:03:22"),
            ascii(Tag::GPSLatitudeRef, "N"),
            rationals(Tag::GPSLatitude, &[(59, 1), (54, 1), (3600, 100)]),
            ascii(Tag::GPSLongitudeRef, "W"),
            rationals(Tag::GPSLongitude, &[(10, 1), (45, 1), (0, 1)]),
        ];
        fs::write(&path, jpeg_with(&fields)).unwrap();
        let facts = facts(&path);
        assert_eq!(facts.taken.as_deref(), Some("2026-11-15T14:03:22"), "the original time before the others");
        let place = facts.place.unwrap();
        assert!((place.lat - (59.0 + 54.0 / 60.0 + 36.0 / 3600.0)).abs() < 1e-9, "{place:?}");
        assert!((place.lon + 10.75).abs() < 1e-9, "west is negative: {place:?}");
        let time = facts.time.unwrap();
        assert!(time.starts_with("20") && time.ends_with('Z') && !time.contains('.'), "{time}");
    }

    #[test]
    fn the_time_of_a_photograph_is_the_next_that_it_says_where_the_first_is_not_there() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("scan.jpeg");
        fs::write(&path, jpeg_with(&[ascii(Tag::DateTime, "2001:02:03 04:05:06")])).unwrap();
        let facts = facts(&path);
        assert_eq!(facts.taken.as_deref(), Some("2001-02-03T04:05:06"));
        assert_eq!(facts.place, None);
    }

    #[test]
    fn a_file_that_says_nothing_has_its_time_alone() {
        let tmp = tempfile::tempdir().unwrap();
        let text = tmp.path().join("notes.txt");
        fs::write(&text, "nothing").unwrap();
        let facts_of_text = facts(&text);
        assert!(facts_of_text.time.is_some());
        assert_eq!((facts_of_text.taken, facts_of_text.place), (None, None));

        // A picture without Exif, and one that is no picture at all though its name says so.
        let bare = tmp.path().join("bare.jpg");
        fs::write(&bare, [0xff, 0xd8, 0xff, 0xd9]).unwrap();
        assert_eq!(facts(&bare).taken, None);
        let false_name = tmp.path().join("false.jpg");
        fs::write(&false_name, "not a picture").unwrap();
        assert_eq!(facts(&false_name).taken, None);
        assert_eq!(facts(&tmp.path().join("not there.jpg")), Facts::default());
    }
}
