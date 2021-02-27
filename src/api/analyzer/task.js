import request from '@/utils/request'

export function queryTask(url) {
    return request({
        url: url,
        method: 'get',
    })
}