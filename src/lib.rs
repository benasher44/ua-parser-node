//! Node bindings for ua-parser (uap-rust).
//!
//! Parses a user-agent string into browser name + major version and
//! OS name + major version, using the browser+OS slice of the uap-core
//! regex spec vendored at build time (see vendor/regexes.yaml).

use napi_derive::napi;
use once_cell::sync::Lazy;
use ua_parser::{Extractor, Regexes};

static EXTRACTOR: Lazy<Extractor> = Lazy::new(|| {
    let yaml = include_str!("../vendor/regexes.yaml");
    let regexes: Regexes = serde_yaml::from_str(yaml).expect("invalid uap-core regexes.yaml");
    Extractor::from(regexes)
});

#[napi(object)]
pub struct UaResult {
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

#[napi]
pub fn parse_user_agent(ua: String) -> UaResult {
    let (ua_ref, os_ref, _device) = EXTRACTOR.extract(ua.as_str());

    UaResult {
        browser: ua_ref.family.map(|s| s.into_owned()),
        browser_version: major(ua_ref.major.as_deref()),
        os: os_ref.os.map(|s| s.into_owned()),
        os_version: major(os_ref.major.as_deref()),
    }
}