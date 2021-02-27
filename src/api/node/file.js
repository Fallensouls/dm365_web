import request from '@/utils/request'


export function getFile(storageobjectid) {
    return request({
        url: `/ndb/file/${storageobjectid}`,
        method: 'get',
        responseType: "blob",
    })
}