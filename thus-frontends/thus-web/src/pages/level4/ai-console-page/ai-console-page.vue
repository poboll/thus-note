<script setup lang="ts">
import { useAiConsole } from "./tools/useAiConsole"
import AiConsoleView from "./ai-console-view.vue"

const { acData } = useAiConsole()

</script>
<template>

  <div class="thus-simple-page">

    <div class="thus-mc-container">

      <PlaceholderView :p-state="acData.pageState"></PlaceholderView>

      <div v-if="acData.pageState < 0" class="thus-mc-box">
        <AiConsoleView 
          v-model:voice-preference="acData.voicePreference"
        ></AiConsoleView>
      </div>

    </div>
  </div>
</template>
<style scoped>


</style>