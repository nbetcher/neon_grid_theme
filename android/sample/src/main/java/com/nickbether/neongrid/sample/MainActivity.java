package com.nickbether.neongrid.sample;

import android.graphics.Outline;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewOutlineProvider;
import android.widget.EditText;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.textfield.TextInputLayout;

/** Demo host: applies Theme.NeonGrid and shows the widget showcase from the theme library. */
public class MainActivity extends AppCompatActivity {

    private static final int GLOW_RED = 0xFFFF3355;
    private static final int GLOW_CYAN = 0xFF00D4FF;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(com.nickbether.neongrid.R.layout.ng_showcase);
        final float d = getResources().getDisplayMetrics().density;

        // A required field that gained then lost focus → persistent red error with a neon glow.
        TextInputLayout person = findViewById(com.nickbether.neongrid.R.id.ng_field_person);
        if (person != null) {
            person.setError("Required field");
            applyGlow(person, GLOW_RED, d);
        }

        // A field that currently holds focus → cyan neon glow. Focus it without popping the
        // soft keyboard so the static showcase reads cleanly.
        TextInputLayout tag = findViewById(com.nickbether.neongrid.R.id.ng_field_tag);
        if (tag != null && tag.getEditText() != null) {
            final EditText et = tag.getEditText();
            et.setShowSoftInputOnFocus(false);
            et.post(new Runnable() {
                @Override public void run() {
                    et.requestFocus();
                    applyGlow(tag, GLOW_CYAN, d);
                }
            });
        }
    }

    /** Soft colored halo around a view via a colored elevation shadow (API 28+ tints the shadow). */
    private void applyGlow(final View v, final int color, final float d) {
        final int corner = Math.round(8 * d);
        v.setOutlineProvider(new ViewOutlineProvider() {
            @Override public void getOutline(View view, Outline outline) {
                outline.setRoundRect(0, 0, view.getWidth(), view.getHeight(), corner);
            }
        });
        v.setElevation(13 * d);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            v.setOutlineSpotShadowColor(color);
            v.setOutlineAmbientShadowColor(color);
        }
    }
}
