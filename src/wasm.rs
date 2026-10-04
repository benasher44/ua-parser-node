//! Browser shell — `#[wasm_bindgen]` exports over the parsing core.
//! Built by `wasm-pack build --target bundler` for the wasm package.

use wasm_bindgen::prelude::wasm_bindgen;

/// Browser and OS names with major versions, for the wasm binding.
#[wasm_bindgen(getter_with_clone)]
pub struct UaResult {
    pub browser: Option<String>,
    pub browser_version: Option<String>,
    pub os: Option<String>,
    pub os_version: Option<String>,
}

#[wasm_bindgen]
pub fn parse_user_agent(ua: String) -> UaResult {
    let p = crate::lib::parse_ua(ua.as_str());
    UaResult {
        browser: p.browser,
        browser_version: p.browser_version,
        os: p.os,
        os_version: p.os_version,
    }
}