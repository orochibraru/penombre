import Shared
import SwiftUI

@main
struct PenombreApp: App {
    init() {
        // Before launch finishes, or iOS refuses the background refresh handler.
        MainViewControllerKt.registerNoticeChecks()
    }

    var body: some Scene {
        WindowGroup {
            ComposeView().ignoresSafeArea()
                // The pairing QR code, read by the system camera.
                .onOpenURL { url in MainViewControllerKt.openLink(url: url.absoluteString) }
        }
    }
}

struct ComposeView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        MainViewControllerKt.MainViewController()
    }

    func updateUIViewController(_ controller: UIViewController, context: Context) {}
}
