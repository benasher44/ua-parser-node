//! Parsing core — plain Rust, no binding macros (crate root).
//!
//! Binding shells: `napi.rs` (feature `napi`, default) for Node,
//! `wasm.rs` (feature `wasm`, wasm32 only) for the browser via
//! wasm-bindgen. The uap-core regex spec is vendored and compiled into
//! the extractor once at first use.

#[cfg(feature = "napi")]
pub mod napi;
#[cfg(all(feature = "wasm", target_arch = "wasm32"))]
pub mod wasm;

pub mod lib;

use once_cell::sync::Lazy;
use ua_parser::{Extractor, Regexes};

static EXTRACTOR: Lazy<Extractor> = Lazy::new(|| {
    let yaml = include_str!("../vendor/regexes.yaml");
    let regexes: Regexes = serde_yaml::from_str(yaml).expect("invalid uap-core regexes.yaml");
    Extractor::from(regexes)
});

/// Parsed user-agent: browser and OS names with major versions.
pub struct ParsedUa {
    /// e.g. "Chrome", "Mobile Safari", "Firefox"
    pub browser: Option<String>,
    /// major version only, e.g. "138"
    pub browser_version: Option<String>,
    /// e.g. "Mac OS X", "Windows", "iOS", "Android"
    pub os: Option<String>,
    /// major version only, e.g. "10", "18"
    pub os_version: Option<String>,
}

/// Major-version truncation: uap-core hands back the full dotted version;
/// consumers group on majors, so truncate here where it is cheap.
fn major(v: Option<&str>) -> Option<String> {
    v.and_then(|s| s.split('.').next().map(|head| head.to_string()))
}

pub fn parse_ua(ua: &str) -> ParsedUa {
    let (ua_ref, os_ref, _device) = EXTRACTOR.extract(ua);

    ParsedUa {
        browser: ua_ref.family.map(|s| s.into_owned()),
        browser_version: major(ua_ref.major.as_deref()),
        os: os_ref.os.map(|s| s.into_owned()),
        os_version: major(os_ref.major.as_deref()),
    }
}