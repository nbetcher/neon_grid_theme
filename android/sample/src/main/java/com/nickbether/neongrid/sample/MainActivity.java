package com.nickbether.neongrid.sample;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.textfield.TextInputLayout;

/** Demo host: applies Theme.NeonGrid and shows the widget showcase from the theme library. */
public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(com.nickbether.neongrid.R.layout.ng_showcase);

        // Show the error state so the red error styling is visible in the demo.
        TextInputLayout person = findViewById(com.nickbether.neongrid.R.id.ng_field_person);
        if (person != null) {
            person.setError("Required field");
        }
    }
}
