use objc2_app_kit::{NSApplication, NSApplicationActivationPolicy};
use objc2::MainThreadMarker;

pub fn set_dock_visible(visible: bool) {
    let policy = if visible {
        NSApplicationActivationPolicy::Regular
    } else {
        NSApplicationActivationPolicy::Accessory
    };
    unsafe {
        let mtm = MainThreadMarker::new_unchecked();
        let app = NSApplication::sharedApplication(mtm);
        app.setActivationPolicy(policy);
    }
}
