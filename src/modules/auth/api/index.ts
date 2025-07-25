// frontend/src/modules/auth/api/index.ts

import { request } from '@/utils/request'

export interface LoginRequest {
    username: string
    password: string
}

export interface LoginResponse {
    access_token: string
    token_type: string
    username: string
    email: string
    full_name: string
}

export interface RegisterRequest {
    username: string
    email: string
    password: string
    full_name?: string
}

export const authApi = {
    login(data: LoginRequest): Promise<LoginResponse> {
        return request.post('/auth/login', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            transformRequest: [(data) => {
                const params = new URLSearchParams()
                params.append('username', data.username)
                params.append('password', data.password)
                return params
            }]
        })
    },

    register(data: RegisterRequest) {
        return request.post('/auth/register', data)
    }
}