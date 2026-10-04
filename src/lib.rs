//! Node bindings for ua-parser (uap-rust).
//!
//! Parses a user-agent string into browser name + major version and
//! OS name + major version, using the browser+OS slice of the uap-core
//! regex spec vendored at build time (see vendor/regexes.json, produced
//! by scripts/refresh-vendor.py).

use napi_derive::napi;
use std::sync::LazyLock;
use ua_parser::{Extractor, Regexes};

#[cfg(feature = "allocator-mimalloc")]
#[global_allocator]
static ALLOCATOR: mimalloc::MiMalloc = mimalloc::MiMalloc;

#[cfg(all(feature = "allocator-jemalloc", not(feature = "allocator-mimalloc")))]
#[global_allocator]
static ALLOCATOR: jemallocator::Jemalloc = jemallocator::Jemalloc;

static EXTRACTOR: LazyLock<Extractor> = LazyLock::new(|| {
    let json = include_str!("../vendor/regexes.json");
    let regexes: Regexes = serde_json::from_str(json).expect("invalid vendored uap-core regexes");
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
