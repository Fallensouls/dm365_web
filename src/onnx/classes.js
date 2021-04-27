/**
 * Utility function to post-process model output. Find top k classes with highest probability.
 */
export function predictClassesTopK(classProbabilities, classes, k) {
  if (!k) {
    k = 5;
  }
  const probs = Array.from(classProbabilities);
  const probsIndices = probs.map(function(prob, index) {
    return [prob, index];
  });
  const sorted = probsIndices
    .sort(function(a, b) {
      if (a[0] < b[0]) {
        return -1;
      }
      if (a[0] > b[0]) {
        return 1;
      }
      return 0;
    })
    .reverse();
  const topK = sorted.slice(0, k).map(function(probIndex) {
    const iClass = classes[probIndex[1]];
    return {
      id: iClass[0],
      index: parseInt(probIndex[1], 10),
      name: iClass[0],
      probability: probIndex[0]
    };
  });
  return topK;
}
