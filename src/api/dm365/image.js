import request from '@/utils/request'

const urlPrefix = '/dm365'

export function uploadImage(image) {
    return request({
        url: `/ndb/file`,
        method: 'post',
        data: image,
    })
}

export function getImage(imageid) {
    return request({
        url: `${urlPrefix}/imagestore/image/${imageid}`,
        method: 'get',
    })
}

export function getSubImages(imageid) {
    return request({
        url: `${urlPrefix}/imagestore/image/${imageid}/children`,
        method: 'get',
    })
}

export function addImage(image) {
    return request({
        url: `${urlPrefix}/imagestore/image`,
        method: 'post',
        data: image,
    })
}

export function updateImage(imageid, image) {
    return request({
        url: `${urlPrefix}/imagestore/image/${imageid}`,
        method: 'put',
        data: image,
    })
}

export function deleteImage(imageid) {
    return request({
        url: `${urlPrefix}/imagestore/image/${imageid}`,
        method: 'delete',
    })
}

// 批量标注图片
export function batchTag(data) {
    return request({
        url: `${urlPrefix}/imagestore/image/batchtag`,
        method: 'post',
        data: data,
    })
}

export function addSingleTagToImage(imageid, tag) {
    return request({
        url: `${urlPrefix}/imagestore/image/${imageid}/tag`,
        method: 'post',
        data: tag,
    })
}

export function addTagsToImage(imageid, tags) {
    return request({
        url: `${urlPrefix}/imagestore/image/${imageid}/tags`,
        method: 'post',
        data: tags,
    })
}

export function deleteTagInImage(imageid, tagid) {
    return request({
        url: `${urlPrefix}/imagestore/image/${imageid}/tag/${tagid}`,
        method: 'delete',
    })
}

// 添加标注历史
export function addAnnotation(annotation) {
    return request({
        url: `${urlPrefix}/imagestore/annotation`,
        method: 'post',
        data: annotation,
    })
}