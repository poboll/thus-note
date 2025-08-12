import type { GetImagePath } from "../types/index";
import { LiuUtil } from "../utils/liu-util/index";
import { colorData } from "../config/default-data";
import type { SupportedTheme } from "../types/types-atom";
import { LiuApi } from "./LiuApi";

export function setNaviForNewTheme(theme?: SupportedTheme) {
  if(!theme) {
    theme = LiuUtil.getCurrentTheme()
  }
  let frontColor = theme === "light" ? "#000000" : "#ffffff"
  let backgroundColor = colorData[theme].primary_color
  LiuApi.setNavigationBarColor({ frontColor, backgroundColor })
}

export function getThemeBehavior(
  getImagePath: GetImagePath,
) {
  const theme = LiuUtil.getCurrentTheme()
  const imagePath = getImagePath()
  const colors = colorData[theme]

  const behavior = Behavior({
    data: {
      theme,
      imagePath,
      colors,
    },

    pageLifetimes: {
      show() {
        this.calculateTheme()
      }
    },

    lifetimes: {
      attached() {
        this.calculateTheme()
      }
    },


    methods: {
      calculateTheme() {
        const newTheme = LiuUtil.getCurrentTheme()
        if(newTheme === this.data.theme) return
        const newImagePath = getImagePath()
        const newColors = colorData[newTheme]
        this.setData({ 
          theme: newTheme, 
          imagePath: newImagePath,
          colors: newColors,
        })
        setNaviForNewTheme(newTheme)
      }
    },

  })

  return behavior
}