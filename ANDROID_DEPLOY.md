# RETINA-DX offline Android workflow

The mobile app can now run the APTOS screening model completely on-device. The backend is not required for image inference in offline mode.

## Architecture

```text
Phone camera / gallery
        ↓
Expo React Native app
        ↓
Local image resize + JPEG decode
        ↓
ONNX Runtime React Native
        ↓
APTOS EfficientNet-B0 (.onnx bundled in APK)
        ↓
Grade 0–4 screening result
```

No API call, MongoDB, cloud model, Emergent LLM, or internet connection is required for real-image inference.

## 1. Train the APTOS model

Install Python dependencies:

```bash
pip install -r backend/requirements.txt
pip install -r backend/ml/requirements-aptos.txt
```

Download the APTOS 2019 dataset and train:

```bash
python backend/ml/download_aptos.py --output data/aptos2019
python backend/ml/train_aptos.py --data-dir data/aptos2019 --epochs 10
```

The checkpoint is created at:

```text
backend/models/aptos_efficientnet_b0.pt
```

## 2. Convert the model for Android/iOS

Export the trained PyTorch model to ONNX:

```bash
python backend/ml/export_aptos_onnx.py \
  --checkpoint backend/models/aptos_efficientnet_b0.pt \
  --output frontend/assets/models/aptos_efficientnet_b0.onnx
```

The ONNX file is the model that gets packaged into the app.

## 3. Install frontend dependencies

```bash
cd frontend
npm install
```

The frontend uses `onnxruntime-react-native`, `expo-image-manipulator`, and `jpeg-js` for local inference and image preprocessing.

## 4. Test the offline app

Because ONNX Runtime is a native React Native module, use an Expo development build rather than relying on Expo Go for the final offline model workflow.

```bash
npx expo prebuild
npx expo run:android
```

Turn on airplane mode after the app has been installed. Select a retinal image from the phone gallery or camera and run the analysis. The real-image path should still work.

## 5. Build an installable APK

Install EAS CLI and sign in:

```bash
npm install -g eas-cli
eas login
```

From `frontend/`:

```bash
eas build --platform android --profile preview
```

The preview profile is configured to produce an APK. Download the resulting `.apk` and install it directly on an Android phone.

## 6. Build locally instead of EAS

If Android Studio and the Android SDK are installed:

```bash
cd frontend
npx expo prebuild
cd android
./gradlew assembleRelease
```

The release APK is normally under:

```text
frontend/android/app/build/outputs/apk/release/app-release.apk
```

## 7. Google Play publishing

For Google Play, create a production Android App Bundle:

```bash
cd frontend
eas build --platform android --profile production
```

Google Play uses `.aab` for new app releases; an APK is for direct installation/testing.

## Offline requirement checklist

- [ ] APTOS model trained
- [ ] PyTorch checkpoint converted to ONNX
- [ ] `frontend/assets/models/aptos_efficientnet_b0.onnx` exists
- [ ] `npm install` completed
- [ ] Native development/release build created
- [ ] APK installed
- [ ] Airplane mode test passes
- [ ] Gallery image can be analyzed with no internet
- [ ] Camera image can be analyzed with no internet

## Important medical limitation

This is an offline research/screening prototype. The APTOS EfficientNet-B0 model predicts diabetic-retinopathy severity classes; it is not a clinical diagnostic device and does not independently localize individual retinal lesions. Independent clinical validation and appropriate regulatory review are required before clinical use.
