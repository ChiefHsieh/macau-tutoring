package com.astarmarketplace.app;

import android.animation.ObjectAnimator;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.annotation.Nullable;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

/**
 * Shows the brand splash overlay until the remote WebView finishes its first main-frame load,
 * so users do not stare at a blank WebView between splash and the platform.
 */
public class MainActivity extends BridgeActivity {

    private static final long MIN_SPLASH_MS = 900L;
    private static final long DISMISS_TIMEOUT_MS = 25_000L;

    private View splashOverlay;
    private boolean splashDismissed;
    private long splashShownAt;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Bridge bridge = getBridge();
        if (bridge == null) {
            return;
        }

        splashShownAt = System.currentTimeMillis();
        attachSplashOverlay();

        bridge.setWebViewClient(
                new BridgeWebViewClient(bridge) {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        scheduleDismissWhenReady(view);
                    }
                });

        // Safety: never block forever if load hangs
        mainHandler.postDelayed(this::dismissSplashIfStillShowing, DISMISS_TIMEOUT_MS);
    }

    private void attachSplashOverlay() {
        FrameLayout decor = (FrameLayout) getWindow().getDecorView();
        splashOverlay =
                LayoutInflater.from(this).inflate(R.layout.activity_brand_splash, decor, false);
        decor.addView(
                splashOverlay,
                new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        TextView en = splashOverlay.findViewById(R.id.splash_tagline_en);
        TextView zh = splashOverlay.findViewById(R.id.splash_tagline_zh);
        startBreathing(en, 0L);
        startBreathing(zh, 200L);
    }

    private void startBreathing(@Nullable TextView view, long delayMs) {
        if (view == null) {
            return;
        }
        view.setAlpha(0.55f);
        view.postDelayed(
                () -> {
                    ObjectAnimator a = ObjectAnimator.ofFloat(view, "alpha", 0.45f, 1f);
                    a.setDuration(1200L);
                    a.setRepeatCount(ObjectAnimator.INFINITE);
                    a.setRepeatMode(ObjectAnimator.REVERSE);
                    a.setInterpolator(new AccelerateDecelerateInterpolator());
                    a.start();
                },
                delayMs);
    }

    private void scheduleDismissWhenReady(WebView view) {
        if (splashDismissed || splashOverlay == null) {
            return;
        }
        view.post(
                () -> {
                    if (splashDismissed) {
                        return;
                    }
                    if (view.getProgress() < 100) {
                        return;
                    }
                    long elapsed = System.currentTimeMillis() - splashShownAt;
                    long wait = Math.max(0, MIN_SPLASH_MS - elapsed);
                    mainHandler.postDelayed(this::dismissSplashIfStillShowing, wait);
                });
    }

    private void dismissSplashIfStillShowing() {
        if (splashDismissed || splashOverlay == null) {
            return;
        }
        splashDismissed = true;
        View overlay = splashOverlay;
        splashOverlay = null;
        overlay.animate()
                .alpha(0f)
                .setDuration(380)
                .withEndAction(
                        () -> {
                            ViewGroup parent = (ViewGroup) overlay.getParent();
                            if (parent != null) {
                                parent.removeView(overlay);
                            }
                        })
                .start();
    }

    @Override
    public void onDestroy() {
        mainHandler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }
}
