#!/usr/bin/env bash
# Wait for the emulator to boot, install the Neon Grid demo, launch it, screenshot it.
set -uo pipefail
source "$HOME/.pebble-build-env"
APK=/mnt/d/Documents/Projects/NeonGrid/android/sample/build/outputs/apk/debug/sample-debug.apk
OUT=/mnt/d/Documents/Projects/NeonGrid/android/screenshots
mkdir -p "$OUT"

echo ">> wait-for-device"
adb wait-for-device

echo ">> waiting for boot_completed"
for i in $(seq 1 140); do
  bc=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
  if [ "$bc" = "1" ]; then echo "   booted (~$((i*3))s)"; break; fi
  sleep 3
done

adb shell wm dismiss-keyguard >/dev/null 2>&1 || true
adb shell input keyevent 82 >/dev/null 2>&1 || true
sleep 2

echo ">> install"
adb install -r -g "$APK" 2>&1 | tail -2

echo ">> launch"
adb shell am force-stop com.nickbether.neongrid.sample >/dev/null 2>&1 || true
adb shell am start -n com.nickbether.neongrid.sample/.MainActivity 2>&1 | tail -2
sleep 5

echo ">> screencap top"   # title, stat cards, action buttons
adb exec-out screencap -p > "$OUT/showcase_top.png"
ls -l "$OUT/showcase_top.png"

# Mid: the Provision panel — switch, checkbox, radio, slider.
adb shell input swipe 540 1900 540 600 400; sleep 1
echo ">> screencap mid"
adb exec-out screencap -p > "$OUT/showcase_mid.png"
ls -l "$OUT/showcase_mid.png"

# Scrolled: Filters (chips, tabs, progress) + Controls (segmented, dropdown, seek, rating).
adb shell input swipe 540 1900 540 500 350; sleep 2
echo ">> screencap scrolled"
adb exec-out screencap -p > "$OUT/showcase_scrolled.png"
ls -l "$OUT/showcase_scrolled.png"
echo "SHOT_DONE"
