# RETINA-DX Android build & deployment

## 1. Backend

Run MongoDB and the FastAPI backend. Put `MONGO_URL`, `DB_NAME`, and `EMERGENT_LLM_KEY` in `backend/.env`.

Train the APTOS 2019 model once:

```bash
pip install -r backend/ml/requirements-aptos.txt
python backend/ml/download_aptos.py --output data/aptos2019
python backend/ml/train_aptos.py --data-dir data/aptos2019 --epochs 10
```

The trained checkpoint is created at `backend/models/aptos_efficientnet_b0.pt`. Do not commit the checkpoint to GitHub; keep it on the server or model storage.

Start the API:

```bash
uvicorn backend.server:app --host 0.0.0.0 --port 8000
```

The `/api/predict` flow now uses the APTOS-trained EfficientNet-B0 model first when a checkpoint exists. If that model fails, the app falls back to the existing Emergent Vision integration. Demo/sample mode remains available.

## 2. Connect the Expo app

Create `frontend/.env`:

```env
EXPO_PUBLIC_BACKEND_URL=https://YOUR-BACKEND-DOMAIN
```

For local Android development, use the computer's LAN IP instead of `localhost`, for example:

```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.10:8000
```

Restart Expo after changing environment variables.

## 3. Test on Android

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with Expo Go, or use an Android emulator/device.

## 4. Build an installable APK

Install EAS CLI and sign in:

```bash
npm install -g eas-cli
eas login
```

From `frontend/`, configure the project if this is the first build:

```bash
eas build:configure
```

Then build the preview APK:

```bash
eas build --platform android --profile preview
```

EAS provides an APK build URL. Install that APK on an Android phone for testing.

## 5. Publish to Google Play

Create a production AAB:

```bash
eas build --platform android --profile production
```

Create a Google Play Console developer account, create an Android app, complete the store listing/content declarations, and upload the generated `.aab` under the appropriate release track. Google may require testing before production release depending on the developer account and current Play policies.

## Important

The Android app is a client. The APTOS PyTorch model should run on the backend server, not inside the APK. The server must therefore be deployed on a public HTTPS endpoint before a published app can analyze images outside your local network.

RETINA-DX is a research/screening prototype and must not be presented as a medical diagnostic device without appropriate clinical validation and regulatory review.
