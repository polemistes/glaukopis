fn main() {
    // The same sources are a package of their own for the phone
    // (`../src-phone`), which is empty where it is not built for Android.
    println!("cargo::rustc-check-cfg=cfg(phone_elsewhere)");
    tauri_build::build()
}
