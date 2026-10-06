package expo.modules.pagescanmodule

import android.app.Activity
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import androidx.core.net.toUri
import com.google.mlkit.vision.text.Text

class PageScanModule : Module() {
    private var scanPromise: Promise? = null

    companion object {
        private const val SCAN_REQUEST = 4721
    }

    override fun definition() = ModuleDefinition {
        Name("PageScanModule")

        AsyncFunction("scanPage") { promise: Promise ->
            val activity = appContext.currentActivity
            if (activity == null) {
                promise.reject(CodedException("E_NO_ACTIVITY", "No current activity", null))
                return@AsyncFunction
            }
            if (scanPromise != null) {
                promise.reject(CodedException("E_BUSY", "A scan is already in progress", null))
                return@AsyncFunction
            }

            val options = GmsDocumentScannerOptions.Builder()
                .setResultFormats(
                    GmsDocumentScannerOptions.RESULT_FORMAT_JPEG,
                    GmsDocumentScannerOptions.RESULT_FORMAT_JPEG
                )
                .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
                .build()

            scanPromise = promise
            GmsDocumentScanning.getClient(options)
                .getStartScanIntent(activity)
                .addOnSuccessListener { sender ->
                    try {
                        activity.startIntentSenderForResult(sender, SCAN_REQUEST, null, 0, 0, 0)
                    } catch (e: Exception) {
                        scanPromise = null
                        promise.reject(CodedException("E_SCAN_START", e.message ?: "Could not start scanner", e))
                    }
                }
                .addOnFailureListener {
                    scanPromise = null
                    promise.reject(CodedException("E_SCAN_START", it.message ?: "Scanner unavailable", it))
                }
        }

        AsyncFunction(name="extractText") { uri: String, promise: Promise ->
            try {
                val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
                val image = InputImage.fromFilePath(context, uri.toUri())
                TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS).process(image)
                    .addOnSuccessListener { promise.resolve(toMap(it)) }
                    .addOnFailureListener {
                        promise.reject(CodedException("E_MLKIT", it.message ?: "Recognition failed", it))
                    }
            } catch (e: Exception) {
                promise.reject(CodedException("E_IMAGE", e.message ?: "Could not load image", e))
            }
        }

        OnActivityResult { _, payload ->
            if (payload.requestCode != SCAN_REQUEST) return@OnActivityResult
            val promise = scanPromise ?: return@OnActivityResult
            scanPromise = null

            if (payload.resultCode != Activity.RESULT_OK) {
                promise.resolve(null) // user cancelled
                return@OnActivityResult
            }
            val result = GmsDocumentScanningResult.fromActivityResultIntent(payload.data)
            promise.resolve(
                mapOf(
                    "pages" to (result?.pages?.map { it.imageUri.toString() } ?: emptyList<String>()),
                    "pageCount" to (result?.pdf?.pageCount ?: result?.pages?.size ?: 0)
                )
            )
        }

    }

    private fun toMap(result: Text): Map<String, Any> = mapOf(
        "text" to result.text,
        "blocks" to result.textBlocks.map { block ->
            mapOf(
                "text" to block.text,
                "frame" to block.boundingBox?.let {
                    mapOf("x" to it.left, "y" to it.top, "width" to it.width(), "height" to it.height())
                },
                "lines" to block.lines.map { line ->
                    mapOf("text" to line.text, "frame" to line.boundingBox?.let {
                        mapOf("x" to it.left, "y" to it.top, "width" to it.width(), "height" to it.height())
                    })
                }
            )
        }
    )
}
