import { supabase } from "./supabase"

export async function uploadAvatar(file: File, userId: string, type: "user" | "buddy"): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}/${type}-avatar.${fileExt}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage.from("avatars").upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      console.error("Upload error:", error)
      return null
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error("Storage error:", error)
    return null
  }
}

export async function deleteAvatar(userId: string, type: "user" | "buddy"): Promise<boolean> {
  try {
    const fileName = `${userId}/${type}-avatar`

    // List files with this prefix to find the actual file
    const { data: files } = await supabase.storage.from("avatars").list(`${userId}/`, {
      search: `${type}-avatar`,
    })

    if (files && files.length > 0) {
      const filePath = `${userId}/${files[0].name}`
      const { error } = await supabase.storage.from("avatars").remove([filePath])

      if (error) {
        console.error("Delete error:", error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Delete error:", error)
    return false
  }
}
