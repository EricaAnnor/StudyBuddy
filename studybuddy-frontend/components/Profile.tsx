// "use client"

// import type React from "react"
// import { useState, useRef } from "react"
// import { Button } from "@/components/ui/button"
// import { ArrowLeft, Camera, Phone, AtSign, Info } from "lucide-react"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import { editThunk } from "@/store/edit"
// import { uploadFileThunk } from "@/store/fileUpload"


// // Interface matching the UserUpdate model
// interface UserUpdate {
//     username?: string | null;
//     email?: string | null;
//     major?: string | null;
//     bio?: string | null;
//     profile_pic?: string | null;
// }

// interface EditProfileProps {
//     isOpen: boolean
//     onClose: () => void

// }

// export default function EditProfile({
//     isOpen,
//     onClose,
// }: EditProfileProps) {

//     const currentProfile = useAppSelector((state) => state.loginUser.user)
//     const [formData, setFormData] = useState<UserUpdate>({
//         username: currentProfile?.username,
//         email: currentProfile?.email,
//         major: currentProfile?.major,
//         bio: currentProfile?.bio,
//         profile_pic: currentProfile?.profile_pic,
//     })
//     const [isEditing, setIsEditing] = useState<boolean>(false)
//     const dispatch = useAppDispatch()
//     const InputRef = useRef<HTMLInputElement | null>(null)
//     const [image, setImage] = useState<string>("")



//     //   onSave={handleProfileSave}
//     // isEditing={isEditingProfile}
//     // setIsEditing={setIsEditingProfile}


//     const handleInputChange = (field: keyof UserUpdate, value: string) => {
//         setFormData((prev) => ({ ...prev, [field]: value }))
//     }

//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault()

//         const payload: UserUpdate = {
//             ...formData,
//             email: formData.email === "" ? null : formData.email,
//             username: formData.username === "" ? null : formData.username,
//             bio: formData.bio === "" ? null : formData.bio,
//             major: formData.major === "" ? null : formData.major,
//             profile_pic: image === "" ? null : image,


//         }

//         dispatch(editThunk(payload))



//         setIsEditing?.(false)
//     }

//     const handleOnImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         const files = e.target.files
//         if (files) {
//             try {
//                 const fileArray = Array.from(files)

//                 // Wait for the upload to complete and get the result
//                 const result = await dispatch(uploadFileThunk({ images: fileArray })).unwrap()

//                 const attachmentUrls = result.uploaded_files.map((file) => file.url)
//                 setImage(attachmentUrls[0])
//                 setFormData(prev =>({
//                     ...prev,
//                     profile_pic: attachmentUrls[0]
//                 }))
//             }
//             catch (error) {
//                 console.log("Upload failed:", error)
//             }
//         }

//         if (e.target) {
//             e.target.value = ''
//         }
//     }

//     const handleAttachmentSelect = () => {
//         InputRef.current?.click()

//     }

//     if (!isOpen) return null

//     return (
//         <div className="h-full w-80 bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-800/50 flex flex-col">
//             {/* Header */}
//             <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-t-xl">
//                 <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => {
//                         if (isEditing) {
//                             setIsEditing?.(false)
//                         } else {
//                             onClose()
//                         }
//                     }}
//                     className="text-gray-300 hover:text-white hover:bg-gray-700/50 p-2"
//                 >
//                     <ArrowLeft className="w-5 h-5" />
//                 </Button>
//                 <h1 className="text-xl font-medium text-white">{isEditing ? "Edit Profile" : "Profile"}</h1>
//                 {!isEditing && (
//                     <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => setIsEditing?.(true)}
//                         className="ml-auto text-gray-300 hover:text-white hover:bg-gray-700/50 p-2"
//                     >
//                         Edit
//                     </Button>
//                 )}
//             </div>

//             {/* Content */}
//             <div className="flex-1 overflow-y-auto">
//                 {/* Profile Picture Section */}
//                 <div className="flex flex-col items-center py-6 px-4">
//                     <div className="relative">
//                         <img
//                             src={`http://localhost:8000${image}`  || `http://localhost:8000${currentProfile?.profile_pic}`   || "/placeholder.svg"}
//                             alt="Profile"
//                             className="w-24 h-24 rounded-full object-cover border-4 border-gray-700"
//                         />
//                         {isEditing && (
//                             <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center" onClick={handleAttachmentSelect}>
//                                 <Camera className="w-6 h-6 text-white" />
//                             </div>
//                         )}
//                     </div>

//                     {!isEditing && (
//                         <>
//                             <h2 className="text-lg font-medium text-white mt-3">{formData.username}</h2>
//                             <p className="text-gray-400 text-xs mt-1">last seen just now</p>
//                         </>
//                     )}
//                 </div>

//                 {/* Profile Information */}
//                 <div className="px-4 space-y-4">
//                     {isEditing ? (
//                         /* Edit mode with form inputs */
//                         <form onSubmit={handleSubmit} className="space-y-4">
//                             {/* Name Field */}
//                             <div>
//                                 <label className="text-xs text-gray-400 mb-1 block">Fullname</label>
//                                 <input
//                                     type="text"
//                                     value={formData.username ?? ""}
//                                     onChange={(e) => handleInputChange("username", e.target.value)}
//                                     className="w-full bg-transparent border-b border-gray-600 text-white py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
//                                     placeholder="Enter your name"
//                                 />
//                             </div>

//                             {/* Email Field */}
//                             <div>
//                                 <label className="text-xs text-gray-400 mb-1 block">Email</label>
//                                 <input
//                                     type="email"
//                                     value={formData.email ?? ""}
//                                     onChange={(e) => handleInputChange("email", e.target.value)}
//                                     className="w-full bg-transparent border-b border-gray-600 text-white py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
//                                     placeholder="Enter your email"
//                                 />
//                             </div>

//                             {/* Bio Field */}
//                             <div>
//                                 <label className="text-xs text-gray-400 mb-1 block">Bio (optional)</label>
//                                 <textarea
//                                     value={formData.bio ?? ""}
//                                     onChange={(e) => handleInputChange("bio", e.target.value)}
//                                     rows={2}
//                                     className="w-full bg-transparent border-b border-gray-600 text-white py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
//                                     placeholder="Any details such as age, occupation or city"
//                                 />
//                             </div>

//                             {/* Username Field */}
//                             <div>
//                                 <label className="text-xs text-purple-400 mb-1 block">Major</label>
//                                 <input
//                                     type="text"
//                                     value={formData.major ?? ""}
//                                     onChange={(e) => handleInputChange("major", e.target.value)}
//                                     className="w-full bg-transparent border-b border-gray-600 text-white py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
//                                     placeholder="Username (optional)"
//                                 />
//                             </div>

//                             {/* Save Button */}
//                             <div className="pt-4">
//                                 <Button
//                                     type="submit"
//                                     className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 text-sm rounded-lg transition-colors"

//                                 >
//                                     Save Changes
//                                 </Button>
//                             </div>
//                         </form>
//                     ) : (
//                         /* View mode with profile information display */
//                         <div className="space-y-4">
//                             {/* Phone Section */}
//                             <div className="flex items-center gap-3">
//                                 <Phone className="w-4 h-4 text-gray-400" />
//                                 <div>
//                                     <p className="text-white text-sm">{currentProfile?.email}</p>
//                                     <p className="text-xs text-gray-400">Email</p>
//                                 </div>
//                             </div>

//                             {/* Username Section */}
//                             <div className="flex items-center gap-3">
//                                 <AtSign className="w-4 h-4 text-gray-400" />
//                                 <div>
//                                     <p className="text-white text-sm">{currentProfile?.username}</p>
//                                     <p className="text-xs text-gray-400">Username</p>
//                                 </div>
//                             </div>

//                             {/* Bio Section */}
//                             <div className="flex items-start gap-3">
//                                 <Info className="w-4 h-4 text-gray-400 mt-1" />
//                                 <div>
//                                     <p className="text-white text-sm">{currentProfile?.bio || "Hello there"}</p>
//                                     <p className="text-xs text-gray-400">Bio</p>
//                                 </div>
//                             </div>

//                             {/* Major Section */}
//                             <div className="flex items-start gap-3">
//                                 <Info className="w-4 h-4 text-gray-400 mt-1" />
//                                 <div>
//                                     <p className="text-white text-sm">{currentProfile?.major || "Not specified"}</p>
//                                     <p className="text-xs text-gray-400">Major</p>
//                                 </div>
//                             </div>

//                         </div>
//                     )}
//                 </div>
//             </div>
//             <input
//                 ref={InputRef}
//                 onChange={(e) => handleOnImageChange(e)}
//                 type="file"
//                 accept="image/*"
//                 multiple
//                 className="hidden"
//             />
//         </div>
//     )
// }




"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, Phone, AtSign, Info } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { editThunk,userThunk } from "@/store/profile"
import { uploadFileThunk } from "@/store/fileUpload"

// Interface matching the UserUpdate model
interface UserUpdate {
    username?: string | null;
    email?: string | null;
    major?: string | null;
    bio?: string | null;
    profile_pic?: string | null;
}

interface EditProfileProps {
    isOpen: boolean
    onClose: () => void
}

export default function EditProfile({
    isOpen,
    onClose,
}: EditProfileProps) {
    const currentProfile = useAppSelector((state) => state.profileReducer.user)
    const [formData, setFormData] = useState<UserUpdate>({
        username: currentProfile?.username,
        email: currentProfile?.email,
        major: currentProfile?.major,
        bio: currentProfile?.bio,
        profile_pic: currentProfile?.profile_pic,
    })
    const [isEditing, setIsEditing] = useState<boolean>(false)
    const dispatch = useAppDispatch()
    const InputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        if (currentProfile) {
            setFormData({
                username: currentProfile.username,
                email: currentProfile.email,
                major: currentProfile.major,
                bio: currentProfile.bio,
                profile_pic: currentProfile.profile_pic,
            })
        }
    }, [currentProfile])

    useEffect(()=>{
        dispatch(userThunk())
    },[dispatch])

    const handleInputChange = (field: keyof UserUpdate, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const payload: UserUpdate = {
            ...formData,
            email: formData.email === "" ? null : formData.email,
            username: formData.username === "" ? null : formData.username,
            bio: formData.bio === "" ? null : formData.bio,
            major: formData.major === "" ? null : formData.major,
            profile_pic: formData.profile_pic === "" ? null : formData.profile_pic,
        }

        try {
            await dispatch(editThunk(payload)).unwrap()
            setIsEditing(false)
        } catch (error) {
            console.error("Failed to update profile:", error)
        }
    }

    const handleOnImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) {
            try {
                const fileArray = Array.from(files)
                const result = await dispatch(uploadFileThunk({ images: fileArray })).unwrap()
                const attachmentUrls = result.uploaded_files.map((file) => file.url)
                
                // Update formData.profile_pic directly
                setFormData(prev => ({ 
                    ...prev, 
                    profile_pic: attachmentUrls[0] 
                }))
            } catch (error) {
                console.log("Upload failed:", error)
            }
        }

        if (e.target) {
            e.target.value = ''
        }
    }

    const handleAttachmentSelect = () => {
        InputRef.current?.click()
    }

    // Helper function to get the correct image URL
    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return "/placeholder.svg"
        // If it already starts with http, return as is
        if (imagePath.startsWith('http')) return imagePath
        // Otherwise, prepend the base URL
        return `http://localhost:8000${imagePath}`
    }

    if (!isOpen) return null

    return (
        <div className="h-full w-80 bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-800/50 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-t-xl">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        if (isEditing) {
                            // Reset formData to current profile when canceling
                            setFormData({
                                username: currentProfile?.username,
                                email: currentProfile?.email,
                                major: currentProfile?.major,
                                bio: currentProfile?.bio,
                                profile_pic: currentProfile?.profile_pic,
                            })
                            setIsEditing(false)
                        } else {
                            onClose()
                        }
                    }}
                    className="text-gray-300 hover:text-white hover:bg-gray-700/50 p-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-medium text-white">{isEditing ? "Edit Profile" : "Profile"}</h1>
                {!isEditing && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="ml-auto text-gray-300 hover:text-white hover:bg-gray-700/50 p-2"
                    >
                        Edit
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Profile Picture Section */}
                <div className="flex flex-col items-center py-6 px-4">
                    <div className="relative">
                        <img
                            src={getImageUrl(formData.profile_pic)}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-700"
                        />
                        {isEditing && (
                            <div 
                                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer" 
                                onClick={handleAttachmentSelect}
                            >
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        )}
                    </div>

                    {!isEditing && (
                        <>
                            <h2 className="text-lg font-medium text-white mt-3">{formData.username}</h2>
                            <p className="text-gray-400 text-xs mt-1">last seen just now</p>
                        </>
                    )}
                </div>

                {/* Profile Information */}
                <div className="px-4 space-y-4">
                    {isEditing ? (
                        /* Edit mode with form inputs */
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name Field */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Fullname</label>
                                <input
                                    type="text"
                                    value={formData.username ?? ""}
                                    onChange={(e) => handleInputChange("username", e.target.value)}
                                    className="w-full bg-transparent border-b border-gray-600 text-white py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="Enter your name"
                                />
                            </div>

                            {/* Email Field */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                                <input
                                    type="email"
                                    value={formData.email ?? ""}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    className="w-full bg-transparent border-b border-gray-600 text-white py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="Enter your email"
                                />
                            </div>

                            {/* Bio Field */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Bio (optional)</label>
                                <textarea
                                    value={formData.bio ?? ""}
                                    onChange={(e) => handleInputChange("bio", e.target.value)}
                                    rows={2}
                                    className="w-full bg-transparent border-b border-gray-600 text-white py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                    placeholder="Any details such as age, occupation or city"
                                />
                            </div>

                            {/* Major Field */}
                            <div>
                                <label className="text-xs text-purple-400 mb-1 block">Major</label>
                                <input
                                    type="text"
                                    value={formData.major ?? ""}
                                    onChange={(e) => handleInputChange("major", e.target.value)}
                                    className="w-full bg-transparent border-b border-gray-600 text-white py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="Major (optional)"
                                />
                            </div>

                            {/* Save Button */}
                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 text-sm rounded-lg transition-colors"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    ) : (
                        /* View mode with profile information display */
                        <div className="space-y-4">
                            {/* Email Section */}
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-white text-sm">{formData.email}</p>
                                    <p className="text-xs text-gray-400">Email</p>
                                </div>
                            </div>

                            {/* Username Section */}
                            <div className="flex items-center gap-3">
                                <AtSign className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-white text-sm">{formData.username}</p>
                                    <p className="text-xs text-gray-400">Username</p>
                                </div>
                            </div>

                            {/* Bio Section */}
                            <div className="flex items-start gap-3">
                                <Info className="w-4 h-4 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-white text-sm">{formData.bio || "Hello there"}</p>
                                    <p className="text-xs text-gray-400">Bio</p>
                                </div>
                            </div>

                            {/* Major Section */}
                            <div className="flex items-start gap-3">
                                <Info className="w-4 h-4 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-white text-sm">{formData.major || "Not specified"}</p>
                                    <p className="text-xs text-gray-400">Major</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <input
                ref={InputRef}
                onChange={(e) => handleOnImageChange(e)}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
            />
        </div>
    )
}