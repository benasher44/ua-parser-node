//! Node shell — `#[napi]` exports over the parsing core.
//! Built by `napi build --platform` for each Node target.

use napi_derive::napi;

use crate::lib::ParsedUa;

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

impl From<ParsedUa> for UaResult {
    fn from(p: ParsedUa) -> Self {
        UaResult {
            browser: p.browser,
            browser_version: p.browser_version,
            os: p.os,
            os_version: p.os_version,
        }
    }
}

#[napi]
pub fn parse_user_agent(ua: String) -> UaResult {
    crate::lib::parse_ua(ua.as_str()).into()
}