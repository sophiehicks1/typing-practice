package live.hicks.typingpractice;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

/**
 * The entire app: a single full-screen WebView that loads the typing test from
 * the bundled asset. The web build is a single self-contained index.html (all
 * JS and CSS inlined) copied into src/main/assets at build time, so this runs
 * fully offline with no network access.
 */
public class MainActivity extends Activity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        // The game keeps no persistent state today, but enabling DOM storage
        // keeps a future high-scores feature working without app changes.
        settings.setDomStorageEnabled(true);

        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
