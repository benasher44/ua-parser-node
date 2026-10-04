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
    Extractor::try_from(regexes).expect("failed to compile uap-core regexes")
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

#[napi]
pub fn parse_user_agent(ua: String) -> UaResult {
    let (ua, os, _device) = EXTRACTOR.extract(ua.as_str());

    UaResult {
        browser: ua.as_ref().map(|v| v.family.to_string()),
        browser_version: ua.as_ref().and_then(|v| v.major.map(String::from)),
        os: os.as_ref().map(|v| v.os.to_string()),
        os_version: os.as_ref().and_then(|v| v.major.as_deref().map(String::from)),
    }
}
