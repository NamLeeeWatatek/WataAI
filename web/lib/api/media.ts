/**
 * Media API
 * Image and file uploads via multipart/form-data
 */
import axiosClient from '../axios-client'

export const mediaApi = {
    async uploadImage(file: File) {
        const formData = new FormData()
        formData.append('file', file)

        return axiosClient.post('/media/upload/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    async uploadFile(file: File) {
        const formData = new FormData()
        formData.append('file', file)

        return axiosClient.post('/media/upload/file', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }
}
