//! The phone's package is built for Android alone. For anything else, as
//! when the whole workspace is tested on a computer, it is told to be
//! empty (`phone_elsewhere`, read by the first line of the library), and
//! nothing of Tauri is made for it.
fn main() {
    println!("cargo::rustc-check-cfg=cfg(phone_elsewhere)");
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() != Ok("android") {
        println!("cargo::rustc-cfg=phone_elsewhere");
        return;
    }
    tauri_build::build()
}
