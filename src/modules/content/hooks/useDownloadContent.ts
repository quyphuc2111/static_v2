import { useMutation } from "@tanstack/react-query"
import { downloadContent } from "../content.service"

export function useDownloadContent(projectId: string, moduleId: string) {
  return useMutation({
    mutationFn: (contentId: string) => downloadContent(projectId, moduleId, contentId),
    onSuccess: (blob, contentId) => {
      try {
        console.log('Download successful, blob size:', blob.size)
        console.log('Blob type:', blob.type)
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        console.log('Created object URL:', url)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `content-${contentId}.zip`
        link.style.display = 'none'
        
        // Add to DOM, click, and remove
        document.body.appendChild(link)
        console.log('Triggering download...')
        link.click()
        document.body.removeChild(link)
        
        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
          console.log('Cleaned up object URL')
        }, 1000)
        
      } catch (error) {
        console.error('Error creating download link:', error)
        alert('Lỗi khi tạo link tải xuống')
      }
    },
    onError: (error: any) => {
      console.error('Download failed:', error)
      alert(`Tải xuống thất bại: ${error.message || 'Lỗi không xác định'}`)
    }
  })
}
