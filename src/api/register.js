import request from '@/utils/request'

// 登录方法
export function register(username, password, code, uuid, roles, email, phone) {
  const data = {
    username,
    password,
    code,
    uuid,
    roles,
    email,
    phone
  }
  return request({
    url: '/idm/register',
    method: 'post',
    data: data
  })
}