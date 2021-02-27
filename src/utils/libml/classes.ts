import _ from 'lodash';

/**
 * Find top k imagenet classes
 */
export function getClassesTopK(classProbabilities: any, classes: { [id: number]: string[] }, k = 5) {
    const probs = _.isTypedArray(classProbabilities) ?
        Array.prototype.slice.call(classProbabilities) : classProbabilities;

    const sorted = _.reverse(_.sortBy(probs.map((prob: any, index: number) => [prob, index]), probIndex => probIndex[0]));

    const topK = _.take(sorted, k).map(probIndex => {
        const iClass = classes[probIndex[1]];
        return {
            id: iClass[0],
            index: parseInt(probIndex[1], 10),
            // name: iClass[1].replace(/_/g, ' '),
            name: iClass[0],
            probability: probIndex[0]
        };
    });
    return topK;
}
