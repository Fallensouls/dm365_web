import request from '@/utils/request'

const urlPrefix = '/analyze'

export function importDataset(data) {
    return request({
        url: `${urlPrefix}/dataset/import`,
        method: 'post',
        data: data,
    })
}

export function exportDataset(datasetid, datasetName, testSize, exportFormat) {
    return request({
        url: `${urlPrefix}/dataset/export`,
        method: 'get',
        params: {
            datasetid: datasetid,
            dataset_name: datasetName,
            test_size: testSize,
            export_format: exportFormat,
        },
    })
}

export function downloadDataset(filename) {
    return request({
        url: `${urlPrefix}/download`,
        method: 'get',
        params: {
            filename: filename,
        },
        responseType: "blob",
        timeout: 0,
    })
}