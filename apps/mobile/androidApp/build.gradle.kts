plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.composeCompiler)
}

// A release build stamps these (`.github/workflows/mobile.yaml`); a local one
// keeps the placeholders.
val releaseName = providers.gradleProperty("penombre.version").orNull ?: "0.1.0"
val releaseCode = providers.gradleProperty("penombre.code").orNull?.toInt() ?: 1
// The signing key, when the environment names one.
val keystore = System.getenv("ANDROID_KEYSTORE_FILE")?.takeIf { it.isNotEmpty() }

android {
    namespace = "dev.penombre.app"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.orochibraru.penombre"
        minSdk = 29
        targetSdk = 36
        versionCode = releaseCode
        versionName = releaseName
    }

    signingConfigs {
        if (keystore != null) {
            create("release") {
                storeFile = file(keystore)
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ANDROID_KEY_ALIAS")
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            // Unsigned without a key: it builds, and installs nowhere.
            signingConfig = signingConfigs.findByName("release")
            // ponytail: not shrunk, so the APK carries every Material icon
            // (54 MB). Turn R8 on once a release build has run on a device.
        }
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(project(":shared"))
    implementation(libs.androidx.activity.compose)
}
