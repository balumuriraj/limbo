import { NativeModules, requireNativeComponent } from 'react-native';
export const { MyLottieModule } = NativeModules;
export const MyLottie = requireNativeComponent("MyLottie")