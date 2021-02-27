import request from '@/utils/request'

const urlPrefix = '/analyze'

export function getModels() {
    return request({
        url: `${urlPrefix}/models`,
        method: 'get',
    })
}

export function getModelInfo(url) {
    return request({
        url: url,
        method: 'get',
    })
}
