package com.limbo;

import com.airbnb.lottie.ImageAssetDelegate;
import com.airbnb.lottie.LottieAnimationView;
import com.airbnb.lottie.LottieComposition;
import com.airbnb.lottie.LottieCompositionFactory;
import com.airbnb.lottie.LottieDrawable;
import com.airbnb.lottie.LottieImageAsset;
import com.airbnb.lottie.LottieResult;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.util.DisplayMetrics;
import android.widget.Toast;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

public class MyLottieModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private static final String DURATION_SHORT_KEY = "SHORT";
    private static final String DURATION_LONG_KEY = "LONG";

    //constructor
    public MyLottieModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
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

    @ReactMethod
    public void getLottieFrame(String json, int width, int height, Promise promise) {
//        LottieDrawable lottieDrawable = new LottieDrawable();
        LottieAnimationView view = new LottieAnimationView(reactContext);
        view.setImageAssetsFolder("lottie/placeholder");

//        LottieResult<LottieComposition> lottieResult = LottieCompositionFactory.fromUrlSync(reactContext, "https://assets1.lottiefiles.com/packages/lf20_HvFfKv.json");
        LottieResult<LottieComposition> lottieResult = LottieCompositionFactory.fromJsonStringSync(json, null);
        LottieComposition lottieComposition = lottieResult.getValue();

        view.setComposition(lottieComposition);
//        lottieDrawable.setComposition(lottieComposition);
//        lottieDrawable.setFrame(7);
        view.setFrame(7);
//        view.setProgress(7 / 25f);
        LottieDrawable lottieDrawable = (LottieDrawable) view.getDrawable();
        float scale = (float) width / lottieDrawable.getIntrinsicWidth();
        view.setScale(scale);

        System.out.println("======================" + scale);

//        lottieDrawable.setImageAssetDelegate(new ImageAssetDelegate() {
//            @Override
//            public Bitmap fetchBitmap(LottieImageAsset asset) {
//                System.out.println("+++++++++++++++++++++++++++++" + asset.getFileName());
//                Bitmap bitmap = Utility.bitmapFromUriString("/images/" + asset.getFileName(), promise, reactContext);
//                if (bitmap == null) {
//                    System.out.println("-------------------------------------" + asset.getFileName());
//                }
//                return bitmap;
//            }
//        });

        Bitmap bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        view.draw(canvas);

        System.out.println("======================" + bmp);

        File file = Utility.createRandomPNGFile(reactContext);
        Utility.writeBMPToPNGFile(bmp, file, promise);

        final WritableMap map = Utility.buildImageReactMap(file, bmp);
        promise.resolve(map);
    }

    @ReactMethod
    public void alphaMask(String uriString, String maskUriString, ReadableMap options, Promise promise) {

        final boolean trimTransparency = options.getBoolean("trimTransparency");

        Bitmap bmp = Utility.bitmapFromUriString(uriString, promise, reactContext);
        if (bmp == null) {
            return;
        }

        Bitmap maskBmp = Utility.bitmapFromUriString(maskUriString, promise, reactContext);
        if (maskBmp == null) {
            return;
        }

        Bitmap mutableMaskBitmap = maskBmp.copy(Bitmap.Config.ARGB_8888, true);

        int[] pixels = new int[mutableMaskBitmap.getHeight()*mutableMaskBitmap.getWidth()];
        mutableMaskBitmap.getPixels(pixels, 0, mutableMaskBitmap.getWidth(), 0, 0, mutableMaskBitmap.getWidth(), mutableMaskBitmap.getHeight());
        for( int i = 0; i < pixels.length; i++ ) {
            pixels[i] = pixels[i] << 8;
        }
        mutableMaskBitmap.setPixels(pixels, 0, mutableMaskBitmap.getWidth(), 0, 0, mutableMaskBitmap.getWidth(), mutableMaskBitmap.getHeight());

        Bitmap editBmp = Bitmap.createBitmap(bmp.getWidth(), bmp.getHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(editBmp);

        Paint maskPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        maskPaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.DST_OUT));

        canvas.drawBitmap(bmp, 0, 0, null);
        canvas.drawBitmap(mutableMaskBitmap, 0, 0, maskPaint);

        if (trimTransparency) {
            editBmp = Utility.trimTransparency(editBmp);
        }

        File file = Utility.createRandomPNGFile(reactContext);
        Utility.writeBMPToPNGFile(editBmp, file, promise);

        final WritableMap map = Utility.buildImageReactMap(file, editBmp);
        promise.resolve(map);
    }
}