//! What the tests share.

/// Says that a test is passed over, because a program it needs is not
/// installed. Where `GLAUKOPIS_TESTS_NEED_ALL` is set, as the tests on
/// GitHub have it, nothing may be passed over: the test fails, so that a
/// program that is missing does not let the tests pass unseen.
pub fn passed_over(why: &str) {
    if std::env::var_os("GLAUKOPIS_TESTS_NEED_ALL").is_some_and(|v| !v.is_empty() && v != "0") {
        panic!("{why}, and GLAUKOPIS_TESTS_NEED_ALL says every test must be run");
    }
    eprintln!("{why}; the test is passed over");
}
