use std::env;
use std::path::PathBuf;
use std::process::Command;

fn main() {
    let out_dir = env::var("OUT_DIR").expect("OUT_DIR is not set");
    let out_path = PathBuf::from(&out_dir);
    let swift_sources = [
        "swift/capture.swift",
        "swift/preview.swift",
        "swift/recording.swift",
    ];

    for source in swift_sources {
        println!("cargo:rerun-if-changed={source}");
    }

    let status = Command::new("swiftc")
        .args([
            "-emit-library",
            "-static",
            "-parse-as-library",
            "-module-name",
            "ReelDockCapture",
            "-O",
            "-o",
        ])
        .arg(out_path.join("libreeldockcapture.a"))
        .args(swift_sources)
        .status()
        .expect("failed to run swiftc");

    if !status.success() {
        panic!("swiftc failed to build the capture module");
    }

    println!("cargo:rustc-link-search=native={out_dir}");
    println!("cargo:rustc-link-lib=static=reeldockcapture");
    println!("cargo:rustc-link-lib=framework=AVFoundation");
    println!("cargo:rustc-link-lib=framework=CoreMediaIO");
    println!("cargo:rustc-link-lib=framework=CoreMedia");
    println!("cargo:rustc-link-lib=framework=Foundation");
    println!("cargo:rustc-link-lib=framework=AppKit");
    println!("cargo:rustc-link-lib=framework=QuartzCore");

    tauri_build::build();
}
