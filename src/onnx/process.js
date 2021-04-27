import ndarray from "ndarray";
import ops from "ndarray-ops";
import { Tensor } from "onnxjs";

/**
 * Preprocess raw image data to match Resnet50 requirement.
 */
export function preprocess(data, width, height) {
  const dataTensor = ndarray(new Float32Array(data), [width, height, 4]);
  const dataProcessedTensor = ndarray(new Float32Array(width * height * 3), [
    1,
    3,
    width,
    height
  ]);
  ops.assign(
    dataProcessedTensor.pick(0, 0, null, null),
    dataTensor.pick(null, null, 0)
  );
  ops.assign(
    dataProcessedTensor.pick(0, 1, null, null),
    dataTensor.pick(null, null, 1)
  );
  ops.assign(
    dataProcessedTensor.pick(0, 2, null, null),
    dataTensor.pick(null, null, 2)
  );
  ops.divseq(dataProcessedTensor, 255);
  ops.subseq(dataProcessedTensor.pick(0, 0, null, null), 0.5);
  ops.subseq(dataProcessedTensor.pick(0, 1, null, null), 0.5);
  ops.subseq(dataProcessedTensor.pick(0, 2, null, null), 0.5);
  ops.divseq(dataProcessedTensor.pick(0, 0, null, null), 0.5);
  ops.divseq(dataProcessedTensor.pick(0, 1, null, null), 0.5);
  ops.divseq(dataProcessedTensor.pick(0, 2, null, null), 0.5);
  const tensor = new Tensor(new Float32Array(3 * width * height), "float32", [
    1,
    3,
    width,
    height
  ]);
  tensor.data.set(dataProcessedTensor.data);
  return tensor;
}
