package com.limbo;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.widget.Toast;

public class MyLottieModule extends ReactContextBaseJavaModule {
    //constructor
    public MyLottieModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    //Mandatory function getName that specifies the module name
    @Override
    public String getName() {
        return "MyLottieModule";
    }
    //Custom function that we are going to export to JS
    @ReactMethod
    public void showToast(String message) {
        Toast.makeText(getReactApplicationContext(), message, Toast.LENGTH_SHORT).show();
    }

    @ReactMethod
    public void generateFrame(String message) {
        LottieDrawable varia = new LottieDrawable();
    }
}