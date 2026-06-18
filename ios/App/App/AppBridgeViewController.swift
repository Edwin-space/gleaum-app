import Capacitor

/**
 * AppBridgeViewController
 *
 * Capacitor CLI가 생성하는 packageClassList는 npm 플러그인만 자동 수집한다.
 * 앱 타깃 내부의 커스텀 Swift 플러그인은 cap sync 이후 누락될 수 있으므로
 * bridge 로드 직후 명시적으로 등록한다.
 */
class AppBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()

        bridge?.registerPluginInstance(NativeSessionPlugin())
        bridge?.registerPluginInstance(NativeBiometricPlugin())
        bridge?.registerPluginInstance(NativeCalendarPlugin())
    }
}
