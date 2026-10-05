//! Node bindings for ua-parser (uap-rust).
//!
//! General-purpose binding: exposes the full extraction API of uap-rust —
//! browser, OS and device families with complete dotted versions — plus
//! major-only convenience fields for analytics. The full uap-core regex
//! spec is vendored at build time (see vendor/regexes.json, produced by
//! scripts/refresh-vendor.py).

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

/// Join uap-core's four version segments into one dotted string, skipping
/// empties: Some("138")/Some("0")/Some("0")/Some("0") -> "138.0.0.0".
fn version_full(parts: [Option<&str>; 4]) -> Option<String> {
    let joined: Vec<&str> = parts.iter().flatten().copied().collect();
    if joined.is_empty() {
        None
    } else {
        Some(joined.join("."))
    }
}

#[napi(object)]
pub struct UaResult {
    /// e.g. "Chrome", "Mobile Safari", "Firefox"
    pub browser: Option<String>,
    /// major version only, e.g. "138"
    pub browser_version: Option<String>,
    /// full dotted version, e.g. "138.0.0.0"
    pub browser_version_full: Option<String>,
    /// e.g. "Mac OS X", "Windows", "iOS", "Android"
    pub os: Option<String>,
    /// major version only, e.g. "10"
    pub os_version: Option<String>,
    /// full dotted version, e.g. "10.15.7"
    pub os_version_full: Option<String>,
    /// device family from uap-core, e.g. "iPhone", "Pixel 9"
    pub device: Option<String>,
    /// e.g. "Apple", "Samsung"
    pub brand: Option<String>,
    /// e.g. "iPhone", "Pixel 9"
    pub model: Option<String>,
}

#[napi]
pub fn parse_user_agent(ua: String) -> UaResult {
    let (ua, os, dev) = EXTRACTOR.extract(ua.as_str());

    UaResult {
        browser: ua.as_ref().map(|v| v.family.to_string()),
        browser_version: ua.as_ref().and_then(|v| v.major.map(String::from)),
        browser_version_full: ua.as_ref().and_then(|v| version_full([v.major, v.minor, v.patch, v.patch_minor])),
        os: os.as_ref().map(|v| v.os.to_string()),
        os_version: os.as_ref().and_then(|v| v.major.as_deref().map(String::from)),
        os_version_full: os.as_ref().and_then(|v| {
            version_full([
                v.major.as_deref(),
                v.minor.as_deref(),
                v.patch.as_deref(),
                v.patch_minor.as_deref(),
            ])
        }),
        device: dev.as_ref().map(|v| v.device.to_string()),
        brand: dev.as_ref().and_then(|v| v.brand.as_deref().map(String::from)),
        model: dev.as_ref().and_then(|v| v.model.as_deref().map(String::from)),
    }
}
