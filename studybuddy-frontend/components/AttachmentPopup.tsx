"use client"
import { Button } from "@/components/ui/button"
import { FileText, ImageIcon, Video } from "lucide-react"

// Props interface for AttachmentPopup component
interface AttachmentPopupProps {
  isOpen: boolean
  onClose: () => void
  onAttachmentSelect: (type: "document" | "photo" | "video") => void
}

export default function AttachmentPopup({ isOpen, onClose, onAttachmentSelect }: AttachmentPopupProps) {
  // Don't render if popup is not open
  if (!isOpen) return null

  // Handle attachment type selection
  const handleAttachmentClick = (type: "document" | "photo" | "video") => {
    console.log("[v0] Selected attachment type:", type)
    onAttachmentSelect(type)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-transparent z-40" onClick={onClose} />

      {/* Popup container */}
      <div className="fixed bottom-20 left-4 z-50 bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-2xl p-4 min-w-[200px]">
        <h3 className="text-white font-semibold text-sm mb-4">Add Attachment</h3>

        {/* Attachment options */}
        <div className="space-y-2">
          {/* Document option */}
          <Button
            variant="ghost"
            onClick={() => handleAttachmentClick("document")}
            className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all p-3 h-auto"
          >
            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-medium">Document</p>
              <p className="text-xs text-gray-500">PDF, DOC, TXT files</p>
            </div>
          </Button>

          {/* Photo option */}
          <Button
            variant="ghost"
            onClick={() => handleAttachmentClick("photo")}
            className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all p-3 h-auto"
          >
            <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-left">
              <p className="font-medium">Photo</p>
              <p className="text-xs text-gray-500">JPG, PNG, GIF images</p>
            </div>
          </Button>

          {/* Video option */}
          <Button
            variant="ghost"
            onClick={() => handleAttachmentClick("video")}
            className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all p-3 h-auto"
          >
            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Video className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="font-medium">Video</p>
              <p className="text-xs text-gray-500">MP4, MOV, AVI files</p>
            </div>
          </Button>
        </div>
      </div>
    </>
  )
}
