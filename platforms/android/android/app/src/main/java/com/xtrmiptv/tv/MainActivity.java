package com.xtrmiptv.tv;

import android.graphics.Color;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

/**
 * The only activity: Capacitor's WebView with the app (built in dist/, see capacitor.config.json), and on top of what Capacitor does:
 * - the page adapts to device-width with overview mode enabled and respects the 5% TV safe zone;
 * - WindowInsetsCompat / systemBars / displayCutout insets and TV safe zone margins (5%) are applied to the root layout;
 * - the WebView is transparent, so ExoPlayer's video (ExoPlayerPlugin, behind it) shows where the page is transparent;
 * - requests to the provider are made natively (ProviderWebViewClient: no CORS, plain http allowed);
 * - Back, the media keys and the channel keys go to the page (RemoteKeys) instead of closing the activity.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ExoPlayerPlugin.class);
        registerPlugin(TvHostPlugin.class);
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        settings.setUseWideViewPort(true); // honours viewport meta tag
        settings.setLoadWithOverviewMode(true); // scales content to screen density and width
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        webView.setBackgroundColor(Color.TRANSPARENT);
        webView.setFocusable(true);
        webView.requestFocus();
        getBridge().setWebViewClient(new ProviderWebViewClient(getBridge()));

        setupTvSafeZoneAndInsets();
    }

    /**
     * Ensures root layout respects TV Safezone (5% on all sides) and system insets (displayCutout, systemBars),
     * preventing overscan and clipping on Android TV and Fire TV devices.
     */
    private void setupTvSafeZoneAndInsets() {
        View rootLayout = findViewById(R.id.root_layout);
        if (rootLayout == null) {
            rootLayout = findViewById(android.R.id.content);
        }
        if (rootLayout != null) {
            final View targetView = rootLayout;
            ViewCompat.setOnApplyWindowInsetsListener(targetView, (v, windowInsets) -> {
                Insets insets = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                );

                int width = v.getWidth();
                int height = v.getHeight();
                if (width == 0 || height == 0) {
                    DisplayMetrics dm = getResources().getDisplayMetrics();
                    width = dm.widthPixels;
                    height = dm.heightPixels;
                }

                // TV safe zone: 5% margin on all sides to avoid overscan clipping on physical TVs
                int safeMarginX = (int) (width * 0.05f);
                int safeMarginY = (int) (height * 0.05f);

                int paddingLeft = Math.max(safeMarginX, insets.left);
                int paddingTop = Math.max(safeMarginY, insets.top);
                int paddingRight = Math.max(safeMarginX, insets.right);
                int paddingBottom = Math.max(safeMarginY, insets.bottom);

                v.setPadding(paddingLeft, paddingTop, paddingRight, paddingBottom);
                return WindowInsetsCompat.CONSUMED;
            });

            targetView.addOnLayoutChangeListener((v, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) -> {
                int w = right - left;
                int h = bottom - top;
                int oldW = oldRight - oldLeft;
                int oldH = oldBottom - oldTop;
                if (w > 0 && h > 0 && (w != oldW || h != oldH)) {
                    ViewCompat.requestApplyInsets(v);
                }
            });

            ViewCompat.requestApplyInsets(targetView);
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null && RemoteKeys.isForwarded(event.getKeyCode())) {
            if (event.getAction() == KeyEvent.ACTION_DOWN) RemoteKeys.send(webView, event.getKeyCode());
            return true; // the page decides (Back on the home page asks before leaving)
        }
        return super.dispatchKeyEvent(event);
    }
}
