import { registerWebModule, NativeModule } from 'expo';

// PageScanModule is not available on the web platform.
class PageScanModule extends NativeModule<{}> {}

export default registerWebModule(PageScanModule, 'PageScanModule');
