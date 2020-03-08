package com.limbo;

import androidx.annotation.NonNull;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

public class MyLottieManager extends SimpleViewManager<MyLottieView> {
    @NonNull
    @Override
    public String getName() {
        return "MyLottie";
    }

    @NonNull
    @Override
    protected MyLottieView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new MyLottieView(reactContext);
    }
}
