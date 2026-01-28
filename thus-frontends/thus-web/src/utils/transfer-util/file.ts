import type { ThusImageStore, ThusFileStore } from "~/types";
import type { Cloud_ImageStore, Cloud_FileStore } from "~/types/types-cloud"


export function imagesFromStoreToCloud(
  local_list?: ThusImageStore[]
) {
  if(!local_list) {
    console.log(`🔍 [imagesFromStoreToCloud] local_list is undefined`)
    return
  }

  console.log(`🔍 [imagesFromStoreToCloud] Processing ${local_list.length} images:`)
  local_list.forEach((img, idx) => {
    console.log(`  Image ${idx}: id=${img.id}, cloud_url=${img.cloud_url ? 'EXISTS' : 'MISSING'}`)
  })

  const cloud_list: Cloud_ImageStore[] = []
  for(let i=0; i<local_list.length; i++) {
    const v = local_list[i]
    if(!v.cloud_url) {
      console.warn(`⚠️ [imagesFromStoreToCloud] Skipping image ${v.id} - no cloud_url`)
      continue
    }
    const obj: Cloud_ImageStore = {
      id: v.id,
      name: v.name,
      lastModified: v.lastModified,
      mimeType: v.mimeType,
      width: v.width,
      height: v.height,
      h2w: v.h2w,
      url: v.cloud_url,
      url_2: v.cloud_url_2,
      blurhash: v.blurhash,
      someExif: v.someExif,
      size: v.size,
    }
    cloud_list.push(obj)
  }
  
  console.log(`✅ [imagesFromStoreToCloud] Converted ${cloud_list.length} images with cloud_url`)
  return cloud_list
}

export function filesFromStoreToCloud(
  local_list?: ThusFileStore[]
) {
  if(!local_list) return

  const cloud_list: Cloud_FileStore[] = []
  for(let i=0; i<local_list.length; i++) {
    const v = local_list[i]
    if(!v.cloud_url) continue
    const obj: Cloud_FileStore = {
      id: v.id,
      name: v.name,
      lastModified: v.lastModified,
      suffix: v.suffix,
      size: v.size,
      mimeType: v.mimeType,
      url: v.cloud_url,
    }
    cloud_list.push(obj)
  }
  return cloud_list
}