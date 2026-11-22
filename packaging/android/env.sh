# What a build for Android needs of this machine: sourced, never run.
#   . packaging/android/env.sh
#
# Rust's own toolchain (rustup, in ~/.rustup, beside the system's Rust and
# not on the PATH otherwise), since a distribution's Rust has no targets for
# Android; the Android SDK and NDK; and the Java that Android Studio brings,
# which is the one Gradle is tried with. Each may be set before this is
# sourced.
: "${RUSTUP_HOME:=$HOME/.rustup}"
: "${RUSTUP_TOOLCHAIN:=1.100.0}"
: "${ANDROID_HOME:=$HOME/Android/Sdk}"
: "${NDK_HOME:=$ANDROID_HOME/ndk/29.0.14206865}"
: "${JAVA_HOME:=/opt/android-studio/jbr}"
export RUSTUP_HOME RUSTUP_TOOLCHAIN ANDROID_HOME NDK_HOME JAVA_HOME
export ANDROID_NDK_HOME="$NDK_HOME"
export PATH="$RUSTUP_HOME/shims/bin:$ANDROID_HOME/platform-tools:$PATH"

# The C compilers of the NDK, for what is compiled from C (SQLite, ring),
# and the linkers, where cargo is run without Tauri, which sets them itself.
# 24 is Android 7.0, the least the app is built for.
ndk_bin="$NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin"
export CC_aarch64_linux_android="$ndk_bin/aarch64-linux-android24-clang"
export CC_armv7_linux_androideabi="$ndk_bin/armv7a-linux-androideabi24-clang"
export CC_x86_64_linux_android="$ndk_bin/x86_64-linux-android24-clang"
export CC_i686_linux_android="$ndk_bin/i686-linux-android24-clang"
export AR_aarch64_linux_android="$ndk_bin/llvm-ar"
export AR_armv7_linux_androideabi="$ndk_bin/llvm-ar"
export AR_x86_64_linux_android="$ndk_bin/llvm-ar"
export AR_i686_linux_android="$ndk_bin/llvm-ar"
export CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER="$CC_aarch64_linux_android"
export CARGO_TARGET_ARMV7_LINUX_ANDROIDEABI_LINKER="$CC_armv7_linux_androideabi"
export CARGO_TARGET_X86_64_LINUX_ANDROID_LINKER="$CC_x86_64_linux_android"
export CARGO_TARGET_I686_LINUX_ANDROID_LINKER="$CC_i686_linux_android"
unset ndk_bin
