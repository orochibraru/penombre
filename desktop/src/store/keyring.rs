const KEYRING_SERVICE: &str = "penombre-sync";

pub fn init_keyring() {
    #[cfg(target_os = "macos")]
    let store = apple_native_keyring_store::keychain::Store::new();
    #[cfg(windows)]
    let store = windows_native_keyring_store::Store::new();
    #[cfg(target_os = "linux")]
    let store = zbus_secret_service_keyring_store::Store::new();
    #[cfg(any(target_os = "macos", windows, target_os = "linux"))]
    match store {
        Ok(store) => keyring_core::set_default_store(store),
        Err(error) => log::error!("no credential store: {error}"),
    }
}

fn entry(server: &str) -> Result<keyring_core::Entry, String> {
    keyring_core::Entry::new(KEYRING_SERVICE, server).map_err(|e| e.to_string())
}

pub fn read_key(server: &str) -> Option<String> {
    if server.is_empty() {
        return None;
    }
    match entry(server).map(|e| e.get_password()) {
        Ok(Ok(key)) => Some(key),
        Ok(Err(keyring_core::Error::NoEntry)) => None,
        Ok(Err(error)) => {
            log::warn!("could not read the API key: {error}");
            None
        }
        Err(error) => {
            log::warn!("could not open the credential store: {error}");
            None
        }
    }
}

pub fn write_key(server: &str, key: &str) -> Result<(), String> {
    entry(server)?
        .set_password(key)
        .map_err(|e| format!("could not store the API key: {e}"))
}

pub fn delete_key(server: &str) {
    match entry(server).map(|e| e.delete_credential()) {
        Ok(Ok(()) | Err(keyring_core::Error::NoEntry)) => {}
        Ok(Err(error)) => log::warn!("could not delete the API key: {error}"),
        Err(error) => log::warn!("could not open the credential store: {error}"),
    }
}
