import request from '@/utils/request'

const urlPrefix = '/dm365'

export function getTagCount() {
    return request({
        url: `${urlPrefix}/imagestore/tag/count`,
        method: 'get',
    })
}

export function getTags() {
    return request({
        url: `${urlPrefix}/imagestore/tag`,
        method: 'get',
    })
}

export function addTag(data) {
    return request({
      url: `${urlPrefix}/imagestore/tag`,
      method: 'post',
      data: data
    })
}

export function deleteTag(tagid) {
    return request({
      url: `${urlPrefix}/imagestore/tag/${tagid}`,
      method: 'delete',
    })
}