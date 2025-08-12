// app.ts
import { useApp, useForwardMaterials } from "./utils/useApp"

App({
  
  globalData: {
    appName: "thus",
  },

  onLaunch() {
    useApp()
  },

  onShow(opt) {
    if(opt.scene === 1173 && opt.forwardMaterials?.length) {
      useForwardMaterials(opt.forwardMaterials)
    }

  },

})