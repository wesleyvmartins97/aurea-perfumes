#!/usr/bin/env bash
set -euo pipefail
# Usage: ANDROID_TOOLS=/path/to/tools SIGNING_DIR=/private/directory ./android/build.sh
cd "$(dirname "$0")/.."
: "${ANDROID_TOOLS:?Android platform/build tools directory required}"
: "${SIGNING_DIR:?Existing private signing directory required}"
JAVA_BIN="${JAVA_BIN:-/usr/lib/jvm/java-21-openjdk-amd64/bin/java}"
mkdir -p android/build/classes android/build/dex
"$ANDROID_TOOLS/aapt2-maven/aapt2" compile --dir android/res -o android/build/resources.zip
"$ANDROID_TOOLS/aapt2-maven/aapt2" link -o android/build/resources.apk --manifest android/AndroidManifest.xml -I "$ANDROID_TOOLS/android-35/android.jar" --java android/build/generated android/build/resources.zip
"$JAVA_BIN" -jar "$ANDROID_TOOLS/ecj.jar" -source 8 -target 8 -nowarn -bootclasspath "$ANDROID_TOOLS/android-35/android.jar" -classpath "$ANDROID_TOOLS/android-15/core-lambda-stubs.jar" -d android/build/classes android/build/generated/br/com/valenzaparfums/app/R.java android/src/br/com/valenzaparfums/app/MainActivity.java
"$JAVA_BIN" -cp "$ANDROID_TOOLS/android-15/lib/d8.jar" com.android.tools.r8.D8 --lib "$ANDROID_TOOLS/android-35/android.jar" --min-api 26 --output android/build/dex android/build/classes/br/com/valenzaparfums/app/*.class
python3 - <<'PY'
from zipfile import ZipFile,ZIP_DEFLATED
import shutil
shutil.copyfile('android/build/resources.apk','android/build/unsigned.apk')
with ZipFile('android/build/unsigned.apk','a',ZIP_DEFLATED) as z:z.write('android/build/dex/classes.dex','classes.dex')
PY
"$ANDROID_TOOLS/android-15/zipalign" -f -p 4 android/build/unsigned.apk android/build/aligned.apk
"$JAVA_BIN" -jar "$ANDROID_TOOLS/android-15/lib/apksigner.jar" sign --key "$SIGNING_DIR/release.pk8" --cert "$SIGNING_DIR/release.crt" --out android/build/Valenza-Parfums-1.0.0-Teste.apk android/build/aligned.apk
"$JAVA_BIN" -jar "$ANDROID_TOOLS/android-15/lib/apksigner.jar" verify --verbose android/build/Valenza-Parfums-1.0.0-Teste.apk
python3 - <<'PY'
from pathlib import Path
import base64,hashlib,json
b=Path('android/build/Valenza-Parfums-1.0.0-Teste.apk').read_bytes()
Path('src/android-apk.mjs').write_text('export const APK_SHA256='+json.dumps(hashlib.sha256(b).hexdigest())+';\nexport const APK_BASE64='+json.dumps(base64.b64encode(b).decode())+';\n')
PY
