import request from '@/utils/request'

const urlPrefix = '/dm365'

export function getDatasetCount() {
    return request({
        url: `${urlPrefix}/dataset/count`,
        method: 'get',
    })
}

export function getDatasets(offset, limit) {
    return request({
        url: `${urlPrefix}/dataset`,
        method: 'get',
        params: {
            offset: offset,
            limit: limit,
        },
    })
}

export function addDataset(data) {
    return request({
      url: `${urlPrefix}/dataset`,
      method: 'post',
      data: data
    })
}

export function deleteDataset(datasetid) {
    return request({
      url: `${urlPrefix}/dataset/${datasetid}`,
      method: 'delete',
    })
}

export function getDatasetImageCount(datasetid) {
    return request({
        url: `${urlPrefix}/dataset/${datasetid}/images/count`,
        method: 'get',
    })
}

export function getDatasetTagCount(datasetid) {
    return request({
        url: `${urlPrefix}/dataset/${datasetid}/tags/count`,
        method: 'get',
    })
}

export function getDatasetRelatedTags(datasetid) {
    return request({
        url: `${urlPrefix}/dataset/${datasetid}/tags`,
        method: 'get',
    })
}

export function addDatasetRelatedTag(datasetid, data) {
    return request({
        url: `${urlPrefix}/dataset/${datasetid}/tags`,
        method: 'post',
        data: data
    })
}

export function deleteDatasetRelatedTag(datasetid, tagid) {
    return request({
        url: `${urlPrefix}/dataset/${datasetid}/tags/${tagid}`,
        method: 'delete',
    })
}

export function getImagesByDataset(datasetid, offset, limit) {
    return request({
        url: `${urlPrefix}/dataset/${datasetid}/images`,
        method: 'get',
        params: {
            offset: offset,
            limit: limit,
        },
    })
}


