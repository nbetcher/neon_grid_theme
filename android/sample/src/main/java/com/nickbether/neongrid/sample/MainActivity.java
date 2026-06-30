package com.nickbether.neongrid.sample;

import android.graphics.Outline;
import android.os.Build;
import android.os.Bundle;
import android.transition.AutoTransition;
import android.transition.TransitionManager;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewOutlineProvider;
import android.widget.EditText;
import android.widget.ImageView;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.textfield.TextInputLayout;

/** Demo host: applies Theme.NeonGrid and shows the widget showcase from the theme library. */
public class MainActivity extends AppCompatActivity {

    private static final int GLOW_RED = 0xFFFF3B5C;
    private static final int GLOW_CYAN = 0xFF00E0FF;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(com.nickbether.neongrid.R.layout.ng_showcase);
        final float d = getResources().getDisplayMetrics().density;

        // Roadmap accordions: tap a header to expand/collapse its body (caret rotates with it).
        wireAccordion(com.nickbether.neongrid.R.id.ng_acc1_header,
                com.nickbether.neongrid.R.id.ng_acc1_body,
                com.nickbether.neongrid.R.id.ng_acc1_caret);
        wireAccordion(com.nickbether.neongrid.R.id.ng_acc2_header,
                com.nickbether.neongrid.R.id.ng_acc2_body,
                com.nickbether.neongrid.R.id.ng_acc2_caret);
        wireAccordion(com.nickbether.neongrid.R.id.ng_acc3_header,
                com.nickbether.neongrid.R.id.ng_acc3_body,
                com.nickbether.neongrid.R.id.ng_acc3_caret);

        // Bottom nav: default to Dashboard, with a neon count badge on Roadmap.
        BottomNavigationView bottomNav = findViewById(com.nickbether.neongrid.R.id.ng_bottomnav);
        if (bottomNav != null) {
            bottomNav.setSelectedItemId(com.nickbether.neongrid.R.id.ng_nav_dashboard);
            bottomNav.getOrCreateBadge(com.nickbether.neongrid.R.id.ng_nav_roadmap).setNumber(4);
        }

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

    /**
     * Accordion toggle: flip the body between VISIBLE/GONE and rotate the caret (down ⇄ right),
     * animating both with a delayed AutoTransition so the panel grows/shrinks smoothly. The theme
     * supplies the look; this ~10 lines is all the behaviour an accordion needs.
     */
    private void wireAccordion(int headerId, int bodyId, int caretId) {
        final View header = findViewById(headerId);
        final View body = findViewById(bodyId);
        final ImageView caret = findViewById(caretId);
        if (header == null || body == null || caret == null) return;
        header.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                final boolean expand = body.getVisibility() != View.VISIBLE;
                ViewGroup root = (ViewGroup) header.getRootView();
                TransitionManager.beginDelayedTransition(root, new AutoTransition().setDuration(220));
                body.setVisibility(expand ? View.VISIBLE : View.GONE);
                caret.animate().rotation(expand ? 0f : -90f).setDuration(220).start();
            }
        });
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
