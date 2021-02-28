import request from '@/utils/request'

export function register(userName, password, code, uuid, roleIds, email, phonenumber) {
  const data = {
    userName,
    password,
    code,
    uuid,
    roleIds,
    email,
    phonenumber
  }
  return request({
    url: '/idm/register',
    method: 'post',
    data: data
  })
}