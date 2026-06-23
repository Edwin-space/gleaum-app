package com.gleaum.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

/**
 * Lightweight in-app browser for legal documents during native signup.
 *
 * This keeps users inside the signup flow instead of sending them to an
 * external browser. Close returns to LoginActivity with form state preserved.
 */
class LegalWebViewActivity : AppCompatActivity() {

    private lateinit var progress: ProgressBar
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.statusBarColor = android.graphics.Color.parseColor("#0F172A")
        window.navigationBarColor = android.graphics.Color.parseColor("#0F172A")

        val title = intent.getStringExtra(EXTRA_TITLE) ?: "문서 보기"
        val url = intent.getStringExtra(EXTRA_URL) ?: "https://www.gleaum.com/legal/terms"
        val tablet = isTablet()

        progress = ProgressBar(this).apply {
            isIndeterminate = true
            indeterminateTintList = android.content.res.ColorStateList.valueOf(
                android.graphics.Color.parseColor("#0CC9B5")
            )
        }

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.loadWithOverviewMode = true
            settings.useWideViewPort = true
            settings.textZoom = if (tablet) 112 else 100
            settings.builtInZoomControls = false
            settings.displayZoomControls = false
            setBackgroundColor(android.graphics.Color.parseColor("#08080E"))
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    view.loadUrl(request.url.toString())
                    return true
                }

                override fun onPageFinished(view: WebView, url: String) {
                    this@LegalWebViewActivity.progress.visibility = android.view.View.GONE
                    applyInAppLegalStyles(view)
                }
            }
        }

        setContentView(buildLayout(title))
        webView.loadUrl(url)
    }

    override fun onDestroy() {
        webView.stopLoading()
        webView.destroy()
        super.onDestroy()
    }

    private fun buildLayout(title: String): LinearLayout {
        val tablet = isTablet()

        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(android.graphics.Color.parseColor("#0F172A"))

            addView(TextView(context).apply {
                text = title
                textSize = if (tablet) 18f else 17f
                setTextColor(android.graphics.Color.WHITE)
                gravity = Gravity.CENTER
                typeface = android.graphics.Typeface.DEFAULT_BOLD
                setPadding(dp(20), dp(if (tablet) 16 else 14), dp(20), dp(if (tablet) 16 else 14))
            }, LinearLayout.LayoutParams(match(), dp(if (tablet) 64 else 56)))

            addView(FrameLayout(context).apply {
                setBackgroundColor(android.graphics.Color.parseColor("#08080E"))
                addView(webView, FrameLayout.LayoutParams(match(), match()))
                addView(progress, FrameLayout.LayoutParams(dp(40), dp(40), Gravity.CENTER))
            }, LinearLayout.LayoutParams(match(), 0, 1f))

            addView(TextView(context).apply {
                text = "닫기"
                textSize = if (tablet) 17f else 16f
                setTextColor(android.graphics.Color.WHITE)
                gravity = Gravity.CENTER
                typeface = android.graphics.Typeface.DEFAULT_BOLD
                setBackgroundColor(android.graphics.Color.parseColor("#0084CC"))
                setOnClickListener { finish() }
            }, LinearLayout.LayoutParams(if (tablet) dp(420) else match(), dp(if (tablet) 60 else 58)).apply {
                gravity = Gravity.CENTER_HORIZONTAL
                setMargins(dp(20), dp(if (tablet) 16 else 12), dp(20), dp(if (tablet) 20 else 16))
            })
        }
    }

    /**
     * The public legal pages are designed as dark marketing web pages with their
     * own nav/footer and centered 760px content. In the Android signup flow we
     * need a document viewer instead, especially on tablets where the centered
     * mobile-width content exposes large side backgrounds.
     */
    private fun applyInAppLegalStyles(view: WebView) {
        val js = """
            (function () {
              try {
                document.documentElement.style.background = '#08080E';
                document.body.style.margin = '0';
                document.body.style.background = '#08080E';
                document.body.style.overflowX = 'hidden';

                var nav = document.querySelector('nav');
                if (nav) nav.style.display = 'none';
                var footer = document.querySelector('footer');
                if (footer) footer.style.display = 'none';

                document.querySelectorAll('[style*="position: fixed"]').forEach(function (el) {
                  el.style.display = 'none';
                });

                var main = document.querySelector('main');
                if (main) {
                  main.style.background = '#08080E';
                  main.style.minHeight = '100vh';
                  main.style.width = '100%';
                }

                var doc = main && main.firstElementChild;
                if (doc) {
                  var tablet = ${isTablet()};
                  doc.style.width = '100%';
                  doc.style.maxWidth = tablet ? '1120px' : 'none';
                  doc.style.margin = tablet ? '0 auto' : '0';
                  doc.style.boxSizing = 'border-box';
                  doc.style.padding = tablet ? '48px 72px 112px' : '28px 22px 88px';
                }

                document.querySelectorAll('section').forEach(function (section) {
                  section.style.maxWidth = ${if (isTablet()) "'1040px'" else "'none'"};
                  section.style.marginLeft = 'auto';
                  section.style.marginRight = 'auto';
                  section.style.marginBottom = ${if (isTablet()) "'36px'" else "'32px'"};
                });

                document.querySelectorAll('p, li, td').forEach(function (el) {
                  el.style.fontSize = ${if (isTablet()) "'15px'" else "'14px'"};
                  el.style.lineHeight = '1.9';
                });

                document.querySelectorAll('h2').forEach(function (el) {
                  el.style.fontSize = ${if (isTablet()) "'18px'" else "'16px'"};
                  el.style.lineHeight = '1.45';
                });

                document.querySelectorAll('table').forEach(function (table) {
                  table.style.minWidth = ${if (isTablet()) "'0'" else "'640px'"};
                });
              } catch (e) {}
            })();
        """.trimIndent()
        view.evaluateJavascript(js, null)
    }

    private fun isTablet(): Boolean =
        resources.configuration.smallestScreenWidthDp >= 600

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
    private fun match(): Int = ViewGroup.LayoutParams.MATCH_PARENT

    companion object {
        const val EXTRA_TITLE = "title"
        const val EXTRA_URL = "url"
    }
}
