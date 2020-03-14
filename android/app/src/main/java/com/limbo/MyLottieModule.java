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
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.util.DisplayMetrics;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
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

    private Bitmap cropImg(String uriString, int x, int y, int width, int height, final Promise promise) {
        Bitmap bmp = Utility.bitmapFromUriString(uriString, promise, reactContext);

        if (bmp == null) {
            return null;
        }

        int updatedWidth = x + width > bmp.getWidth() ? bmp.getWidth() : width;

        return Bitmap.createBitmap(bmp, x, y, updatedWidth, height);
    }

    private Bitmap applyMask(Bitmap bmp, Bitmap maskBmp) {
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

        return editBmp;
    }

    private Bitmap getLottieBitmap(LottieAnimationView view, int frameIndex, int width, int height) {
        view.setFrame(frameIndex);

        Bitmap bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        view.draw(canvas);

        return bmp;
    }

    private Bitmap mergeBitmaps(Bitmap bmp1, Bitmap bmp2) {
        Bitmap editBmp = Bitmap.createBitmap(bmp1.getWidth(), bmp1.getHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(editBmp);
        canvas.drawBitmap(bmp1, new Matrix(), null);

        Rect srcRect = new Rect(0, 0, bmp2.getWidth(), bmp2.getHeight());
        Rect dstRect = new Rect(0, 0, canvas.getWidth(), canvas.getHeight());
        canvas.drawBitmap(bmp2, srcRect, dstRect, null);

        return editBmp;
    }

    @ReactMethod
    public void processFrames(String path, String facesPath, String animationUrl, int framesCount, int width, int height, Promise promise) {
        LottieAnimationView view = new LottieAnimationView(reactContext);
//        view.setImageAssetsFolder("lottie/placeholder");

        LottieResult<LottieComposition> lottieResult = LottieCompositionFactory.fromUrlSync(reactContext, animationUrl);
        LottieComposition lottieComposition = lottieResult.getValue();
        view.setComposition(lottieComposition);

        LottieDrawable lottieDrawable = (LottieDrawable) view.getDrawable();
        float scale = (float) width / lottieDrawable.getIntrinsicWidth();
        view.setScale(scale);

        lottieDrawable.setImageAssetDelegate(new ImageAssetDelegate() {
            @Override
            public Bitmap fetchBitmap(LottieImageAsset asset) {
                Bitmap bitmap = Utility.bitmapFromUriString(facesPath + "/" + asset.getFileName(), promise, reactContext);
                if (bitmap == null) {
                    return null;
                }
                return bitmap;
            }
        });

        for (int i = 1; i <= framesCount; i++) {
            String filePath = path + "/frame-" + String.format("%04d", i) + ".jpg";
            String imgPath = "file://" + filePath;
            Bitmap mainBmp = cropImg(imgPath, 0,0, width, height, promise);
            Bitmap maskBmp = cropImg(imgPath, 0, height, width, height, promise);
            Bitmap resultBmp = applyMask(mainBmp, maskBmp);
            Bitmap lottieBmp = getLottieBitmap(view, i - 1, width, height);
            Bitmap finalBmp = mergeBitmaps(lottieBmp, resultBmp);

            try {
                File file = new File(filePath);
                FileOutputStream out = new FileOutputStream(file);
                finalBmp.compress(Bitmap.CompressFormat.JPEG, 100, out);
                out.close();
            } catch (IOException e) {
                promise.reject(e);
            }
        }

        promise.resolve(null);
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

    @ReactMethod
    public void createMaskFromShape(ReadableMap options, Promise promise) {
        final ReadableArray points = options.getArray("points");
        final int width = options.getInt("width");
        final int height = options.getInt("height");
        final boolean inverted = options.getBoolean("inverted");

        final Paint bgPaint = new Paint();
        final Paint shapePaint = new Paint();

        if (inverted) {
            bgPaint.setColor(Color.BLACK);
            bgPaint.setAlpha(0);
            shapePaint.setColor(Color.WHITE);
        } else {
            bgPaint.setColor(Color.WHITE);
            shapePaint.setColor(Color.BLACK);
            shapePaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.CLEAR));
        }

        Bitmap bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);

        final Rect bgRect = new Rect(0, 0, width, height);

        canvas.drawRect(bgRect, bgPaint);

        final Path shapePath = new Path();

        for (int i = 0; i < points.size(); i++) {
            final ReadableMap pointsItem = points.getMap(i);
            final int x = pointsItem.getInt("x");
            final int y = pointsItem.getInt("y");
            if (i == 0) {
                shapePath.moveTo(x, y);
            } else {
                shapePath.lineTo(x, y);
            }
            if (i == points.size() - 1) {
                shapePath.close();
            }
        }

        canvas.drawPath(shapePath, shapePaint);

        File file = Utility.createRandomPNGFile(reactContext);
        Utility.writeBMPToPNGFile(bmp, file, promise);

        final WritableMap map = Utility.buildImageReactMap(file, bmp);
        promise.resolve(map);
    }

    @ReactMethod
    public void mask(String uriString, String maskUriString, ReadableMap options, Promise promise) {

        final boolean trimTransparency = options.getBoolean("trimTransparency");

        Bitmap bmp = Utility.bitmapFromUriString(uriString, promise, reactContext);
        if (bmp == null) {
            return;
        }

        Bitmap maskBmp = Utility.bitmapFromUriString(maskUriString, promise, reactContext);
        if (maskBmp == null) {
            return;
        }

        final HashMap containedRectMap = Utility.calcRectForContainedRect(
                maskBmp.getWidth(), maskBmp.getHeight(),
                bmp.getWidth(), bmp.getHeight()
        );
        int editWidth = (int) containedRectMap.get("width");
        int editHeight = (int) containedRectMap.get("height");
        int editX = (int) containedRectMap.get("x");
        int editY = (int) containedRectMap.get("y");

        Bitmap editBmp = Bitmap.createBitmap(editWidth, editHeight, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(editBmp);

        Paint maskPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        maskPaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.DST_IN));

        canvas.drawBitmap(bmp, -editX, editY, null);

        Rect maskSrcRect = new Rect(0, 0, maskBmp.getWidth(), maskBmp.getHeight());
        Rect maskDstRect = new Rect(0, 0, canvas.getWidth(), canvas.getHeight());

        canvas.drawBitmap(maskBmp, maskSrcRect, maskDstRect, maskPaint);

        maskPaint.setXfermode(null);

        canvas.drawBitmap(editBmp, 0, 0, new Paint());

        if (trimTransparency) {
            editBmp = Utility.trimTransparency(editBmp);
        }

        File file = Utility.createRandomPNGFile(reactContext);
        Utility.writeBMPToPNGFile(editBmp, file, promise);

        final WritableMap map = Utility.buildImageReactMap(file, editBmp);
        promise.resolve(map);
    }

    @ReactMethod
    public void resize(String uriString, int width, int height, final Promise promise) {
        Bitmap bmp = Utility.bitmapFromUriString(uriString, promise, reactContext);
        if (bmp == null) {
            return;
        }

        final HashMap containedRectMap = Utility.calcRectForContainedRect(
                bmp.getWidth(), bmp.getHeight(),
                width, height
        );
        int rectWidth = (int) containedRectMap.get("width");
        int rectHeight = (int) containedRectMap.get("height");
        int rectX = (int) containedRectMap.get("x");
        int rectY = (int) containedRectMap.get("y");

        Bitmap editBmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(editBmp);

        Rect srcRect = new Rect(0, 0, bmp.getWidth(), bmp.getHeight());
        Rect dstRect = new Rect(rectX, rectY, rectWidth + rectX, rectHeight + rectY);

        canvas.drawBitmap(bmp, srcRect, dstRect, null);

        File file = Utility.createRandomPNGFile(reactContext);
        Utility.writeBMPToPNGFile(editBmp, file, promise);

        final WritableMap map = Utility.buildImageReactMap(file, editBmp);
        promise.resolve(map);
    }

    @ReactMethod
    public void crop(String uriString, int x, int y, int width, int height, final Promise promise) {
        Bitmap bmp = Utility.bitmapFromUriString(uriString, promise, reactContext);
        if (bmp == null) {
            return;
        }
        Bitmap croppedBmp = Bitmap.createBitmap(bmp, x, y, width, height);

        File file = Utility.createRandomPNGFile(reactContext);
        Utility.writeBMPToPNGFile(croppedBmp, file, promise);

        final WritableMap map = Utility.buildImageReactMap(file, croppedBmp);
        promise.resolve(map);
    }

    @ReactMethod
    public void merge(ReadableArray uriStrings, Promise promise) {
        Bitmap firstBmp = Utility.bitmapFromUriString(uriStrings.getString(0), promise, reactContext);
        if (firstBmp == null) {
            return;
        }
        Bitmap editBmp = Bitmap.createBitmap(firstBmp.getWidth(), firstBmp.getHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(editBmp);
        canvas.drawBitmap(firstBmp, new Matrix(), null);

        for (int i = 1; i < uriStrings.size(); i++) {
            Bitmap bmp = Utility.bitmapFromUriString(uriStrings.getString(i), promise, reactContext);
            if (bmp == null) {
                return;
            }
            Rect srcRect = new Rect(0, 0, bmp.getWidth(), bmp.getHeight());
            Rect dstRect = new Rect(0, 0, canvas.getWidth(), canvas.getHeight());
            canvas.drawBitmap(bmp, srcRect, dstRect, null);
        }

        File file = Utility.createRandomPNGFile(reactContext);
        Utility.writeBMPToPNGFile(editBmp, file, promise);

        final WritableMap map = Utility.buildImageReactMap(file, editBmp);
        promise.resolve(map);
    }
}