plugins {
    id("com.android.library")
}

android {
    namespace = "com.nickbether.neongrid"
    compileSdk = 36

    defaultConfig {
        minSdk = 24
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    // Exposed to consumers so Material widget parents/attrs resolve transitively.
    api("com.google.android.material:material:1.12.0")
}
