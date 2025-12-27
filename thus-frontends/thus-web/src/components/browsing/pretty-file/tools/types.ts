import type { ThusFileStore } from "~/types";
import type { PropType } from 'vue';

export type PrettyFileIcon = "word" | "excel" | "ppt" | "pdf" 
  | "text" | "photo" | "video" | "psd" | "attachment" | ""

export interface PrettyFileProps {
  file?: ThusFileStore
}

export const prettyFileProps = {
  file: {
    type: Object as PropType<ThusFileStore>
  }
}

export interface PrettyFileEmit {
  (evt: "aftertapfile"): void
}