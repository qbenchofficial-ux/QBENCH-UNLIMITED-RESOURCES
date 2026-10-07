package in.qbench.app

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.nfc.tech.MifareClassic
import android.nfc.tech.MifareUltralight
import android.nfc.tech.Ndef
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONArray
import org.json.JSONObject

/**
 * Native Android NFC Scanner Activity & WebView Bridge (`NfcScannerActivity.kt`)
 *
 * Implements the exact Android NFC hardware state machine:
 * 1. `NfcAdapter.getDefaultAdapter(context)` -> checks hardware availability
 *    - If `null` -> State 3: "NFC NOT SUPPORTED"
 * 2. `nfcAdapter.isEnabled` -> checks if NFC is currently enabled
 *    - If `false` -> State 2: "NFC IS OFF" (shows "Enable NFC" button)
 *    - If `true`  -> State 1: "NFC READY" (prepares scanner & allows scanning)
 * 3. `openNfcSettings()` -> launches `Settings.ACTION_NFC_SETTINGS` without
 *    ever attempting to silently enable NFC.
 * 4. `onResume()` -> automatically re-checks `nfcAdapter.isEnabled` when the user
 *    returns from Android Settings, transitioning to "NFC READY ✓" if enabled
 *    or keeping "NFC IS OFF" if still disabled.
 * 5. `onPause()` -> cleanly disables reader mode when the app goes to background.
 */
class NfcScannerActivity : Activity(), NfcAdapter.ReaderCallback {

    private var nfcAdapter: NfcAdapter? = null
    private var webView: WebView? = null
    private var isReaderModeActive: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 1. Check whether the device supports NFC hardware
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
    }

    /**
     * Lifecycle callback invoked when the user opens the screen or returns from
     * the Android system NFC settings screen (`Settings.ACTION_NFC_SETTINGS`).
     * Re-evaluates `NfcAdapter.getDefaultAdapter(this)` and `nfcAdapter.isEnabled`
     * without assuming NFC was enabled.
     */
    override fun onResume() {
        super.onResume()
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
        notifyWebViewNfcResumeState()
    }

    /**
     * Lifecycle callback invoked when the app goes to the background or when
     * Android NFC Settings is opened. Safely stops active NFC reader sessions.
     */
    override fun onPause() {
        super.onPause()
        stopNfcReaderSession()
    }

    /**
     * Opens the official Android system NFC settings page so the user can manually
     * enable NFC. Never attempts to silently toggle NFC state.
     */
    fun openAndroidSystemNfcSettings() {
        val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            Intent(Settings.ACTION_NFC_SETTINGS)
        } else {
            Intent(Settings.ACTION_WIRELESS_SETTINGS)
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            startActivity(intent)
        } catch (_: Exception) {
            startActivity(Intent(Settings.ACTION_SETTINGS))
        }
    }

    /**
     * Starts Android NFC ReaderMode when `nfcAdapter != null && nfcAdapter.isEnabled`.
     */
    fun startNfcReaderSession() {
        val adapter = nfcAdapter ?: return
        if (!adapter.isEnabled) return

        val flags = (
            NfcAdapter.FLAG_READER_NFC_A or
            NfcAdapter.FLAG_READER_NFC_B or
            NfcAdapter.FLAG_READER_NFC_F or
            NfcAdapter.FLAG_READER_NFC_V
        )
        adapter.enableReaderMode(this, this, flags, null)
        isReaderModeActive = true
    }

    /**
     * Stops Android NFC ReaderMode safely.
     */
    fun stopNfcReaderSession() {
        val adapter = nfcAdapter ?: return
        if (isReaderModeActive) {
            try {
                adapter.disableReaderMode(this)
            } catch (_: Exception) {
                // Ignore if activity is already paused/destroyed
            }
            isReaderModeActive = false
        }
    }

    /**
     * Callback invoked by Android NFC framework when a tag/card enters the RF field.
     * Reads only public metadata legally exposed by Android NFC APIs and masks the UID.
     * Never attempts to bypass encryption, extract keys, or clone protected credentials.
     */
    override fun onTagDiscovered(tag: Tag?) {
        if (tag == null) return

        triggerSubtleHapticFeedback()

        val maskedId = maskTagId(tag.id)
        val techList = tag.techList.map { it.substringAfterLast('.') }
        val techSummary = techList.joinToString(" · ")

        val ndef = Ndef.get(tag)
        val isoDep = IsoDep.get(tag)
        val mifareClassic = MifareClassic.get(tag)
        val mifareUltralight = MifareUltralight.get(tag)

        // Check if the card uses protected/encrypted access-control technology (e.g., DESFire / IsoDep without public NDEF)
        val isProtectedAccessCard =
            (isoDep != null && ndef == null) || (mifareClassic != null && ndef == null)

        val payload = JSONObject().apply {
            put("maskedCardId", maskedId)
            put("technologies", JSONArray(techList))
            put("cardType", techSummary.ifEmpty { "Standard NFC Tag" })
            put("isProtected", isProtectedAccessCard)
            put("isReadOnly", ndef != null && !ndef.isWritable)
            put("isUltralight", mifareUltralight != null)
        }

        runOnUiThread {
            webView?.evaluateJavascript(
                "window.onAndroidNfcTagDiscovered && window.onAndroidNfcTagDiscovered(${JSONObject.quote(payload.toString())});",
                null
            )
        }
    }

    private fun maskTagId(rawId: ByteArray?): String {
        if (rawId == null || rawId.isEmpty()) return "••••••••"
        val hex = rawId.joinToString("") { "%02X".format(it) }
        return if (hex.length <= 4) {
            "••••••••"
        } else {
            "••••••••${hex.takeLast(4)}"
        }
    }

    private fun triggerSubtleHapticFeedback() {
        try {
            val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator ?: return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(45, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(45)
            }
        } catch (_: Exception) {
            // Ignore if vibration is unavailable
        }
    }

    private fun notifyWebViewNfcResumeState() {
        runOnUiThread {
            webView?.evaluateJavascript(
                "window.onAndroidNfcResume && window.onAndroidNfcResume();",
                null
            )
        }
    }

    inner class AndroidNfcJsBridge {
        @JavascriptInterface
        fun isNfcSupported(): Boolean {
            val adapter = NfcAdapter.getDefaultAdapter(this@NfcScannerActivity)
            nfcAdapter = adapter
            return adapter != null
        }

        @JavascriptInterface
        fun isNfcEnabled(): Boolean {
            val adapter = NfcAdapter.getDefaultAdapter(this@NfcScannerActivity)
            nfcAdapter = adapter
            return adapter != null && adapter.isEnabled
        }

        @JavascriptInterface
        fun openNfcSettings() {
            openAndroidSystemNfcSettings()
        }

        @JavascriptInterface
        fun startReaderMode() {
            startNfcReaderSession()
        }

        @JavascriptInterface
        fun stopReaderMode() {
            stopNfcReaderSession()
        }
    }
}
