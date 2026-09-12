import { Asset } from "expo-asset";
import * as ImageManipulator from "expo-image-manipulator";
import * as ort from "onnxruntime-react-native";
import jpeg from "jpeg-js";

const IMAGE_SIZE = 224;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const CLASS_NAMES = [
  "No Diabetic Retinopathy",
  "Mild Non-Proliferative Diabetic Retinopathy",
  "Moderate Non-Proliferative Diabetic Retinopathy",
  "Severe Non-Proliferative Diabetic Retinopathy",
  "Proliferative Diabetic Retinopathy",
];

let sessionPromise: Promise<ort.InferenceSession> | null = null;

async function getSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      // This asset must be generated from the trained APTOS checkpoint and copied to
      // frontend/assets/models/aptos_efficientnet_b0.onnx before building the APK.
      const asset = Asset.fromModule(
        require("../../assets/models/aptos_efficientnet_b0.onnx")
      );
      await asset.downloadAsync();
      const modelPath = asset.localUri || asset.uri;
      if (!modelPath) throw new Error("Bundled APTOS ONNX model could not be loaded.");
      return ort.InferenceSession.create(modelPath);
    })();
  }
  return sessionPromise;
}

function softmax(logits: number[]) {
  const max = Math.max(...logits);
  const exps = logits.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / sum);
}

async function imageToTensor(uri: string) {
  const rendered = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: IMAGE_SIZE, height: IMAGE_SIZE } }],
    { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  if (!rendered.base64) throw new Error("Could not prepare the retinal image locally.");
  const binary = Uint8Array.from(atob(rendered.base64), (c) => c.charCodeAt(0));
  const decoded = jpeg.decode(binary, { useTArray: true });
  const pixels = decoded.data;
  const input = new Float32Array(1 * 3 * IMAGE_SIZE * IMAGE_SIZE);

  for (let y = 0; y < IMAGE_SIZE; y++) {
    for (let x = 0; x < IMAGE_SIZE; x++) {
      const pixelIndex = (y * IMAGE_SIZE + x) * 4;
      const tensorIndex = y * IMAGE_SIZE + x;
      input[tensorIndex] = (pixels[pixelIndex] / 255 - MEAN[0]) / STD[0];
      input[IMAGE_SIZE * IMAGE_SIZE + tensorIndex] =
        (pixels[pixelIndex + 1] / 255 - MEAN[1]) / STD[1];
      input[2 * IMAGE_SIZE * IMAGE_SIZE + tensorIndex] =
        (pixels[pixelIndex + 2] / 255 - MEAN[2]) / STD[2];
    }
  }

  return new ort.Tensor("float32", input, [1, 3, IMAGE_SIZE, IMAGE_SIZE]);
}

export async function runOfflineAptosScreening(imageUri: string) {
  const session = await getSession();
  const tensor = await imageToTensor(imageUri);
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  const outputs = await session.run({ [inputName]: tensor });
  const raw = outputs[outputName]?.data;

  if (!raw || raw.length < 5) {
    throw new Error("APTOS ONNX model returned an invalid output.");
  }

  const logits = Array.from(raw as Float32Array).slice(0, 5) as number[];
  const probabilities = softmax(logits);
  let grade = 0;
  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[grade]) grade = i;
  }

  const confidence = probabilities[grade];
  return {
    grade,
    class_name: CLASS_NAMES[grade],
    confidence,
    probabilities: Object.fromEntries(
      CLASS_NAMES.map((name, index) => [name, Number(probabilities[index].toFixed(6))])
    ),
    risk_level: grade === 0 ? "low_risk" : "possible_signs_detected",
    risk_label: grade === 0 ? "LOW RISK" : "POSSIBLE SIGNS DETECTED",
  };
}
