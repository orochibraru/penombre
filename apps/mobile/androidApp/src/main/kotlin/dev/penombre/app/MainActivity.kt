package dev.penombre.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        AndroidHost.activity = this
        AndroidHost.context = applicationContext
        enableEdgeToEdge()
        deliver(intent)
        setContent { App() }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        deliver(intent)
    }

    private fun deliver(intent: Intent?) {
        intent?.data?.takeIf { it.scheme == "penombre" }?.let { Auth.callbacks.value = it.toString() }
    }
}
