package com.limbo;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Color;
import android.util.AttributeSet;
import android.widget.Button;

@SuppressLint("AppCompatCustomView")
public class MyLottieView extends Button {
    public MyLottieView(Context context) {
        super(context);
        this.setTextColor(Color.BLUE);
        this.setText("This button is created from JAVA code");
        this.setBackgroundColor(Color.YELLOW);
    }

    public MyLottieView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public MyLottieView(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
    }
}
