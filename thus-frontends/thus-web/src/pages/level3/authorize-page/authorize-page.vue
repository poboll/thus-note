<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAuthorizePage } from './tools/useAuthorizePage';
import AuthorizeView from './authorize-view/authorize-view.vue';

const { t } = useI18n()
const { 
  apData,
  onTapAgree,
} = useAuthorizePage()

</script>
<template>
  <div class="thus-simple-page">

    <div class="thus-mc-container">

      <PlaceholderView :p-state="apData.pageState"></PlaceholderView>
      
      <AuthorizeView v-if="apData.appType"
        :app-type="apData.appType"
        :code="apData.code"
        @agree="onTapAgree"
      ></AuthorizeView>
      

      
    </div>


  </div>

</template>
<style scoped lang="scss"></style>