import { getRawList } from "./vue-util"
import valTool from "../basic/val-tool";
import type { ImageShow, ThusFileStore, ThusImageStore } from "~/types";

interface CopyData {
  images?: Array<ThusImageStore | ImageShow>
  files?: ThusFileStore[]
  [key: string]: any
}

function newData<T extends CopyData>(oldOne: T) {
  const newOne = valTool.copyObject(oldOne)
  if(oldOne.images) {
    newOne.images = getRawList(oldOne.images)
  }
  if(oldOne.files) {
    newOne.files = getRawList(oldOne.files)
  }
  return newOne
}

export default {
  newData,
}