package com.limbo;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.widget.Toast;

import java.util.HashMap;
import java.util.Map;

public class MyLottieModule extends ReactContextBaseJavaModule {
    private static final String DURATION_SHORT_KEY = "SHORT";
    private static final String DURATION_LONG_KEY = "LONG";

    //constructor
    public MyLottieModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    //Mandatory function getName that specifies the module name
    @Override
    public String getName() {
        return "MyLottieModule";
    }
    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put(DURATION_SHORT_KEY, Toast.LENGTH_SHORT);
        constants.put(DURATION_LONG_KEY, Toast.LENGTH_LONG);
        return constants;
    }
    @ReactMethod
    public void doPromiseTask(int num, Promise promise) {
        if (num == 1) {
            promise.resolve("Sent 1");
        } else {
            promise.resolve("Sent other than 1: " + num);
        }
    }
    //Custom function that we are going to export to JS
    @ReactMethod
    public void showToast(String message, int duration) {
        Toast.makeText(getReactApplicationContext(), message, duration).show();
    }

//    @ReactMethod
//    public void generateFrame(String message) {
//        LottieDrawable varia = new LottieDrawable();
//    }
}