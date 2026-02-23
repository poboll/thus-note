<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import ShinyButton from '~/components/custom-ui/shiny-button/shiny-button.vue';
import liuReq from '~/requests/thus-req';
import APIs from '~/requests/APIs';
import cui from '~/components/custom-ui';
import { showErrMsg } from '~/pages/level1/tools/show-msg';

const { t } = useI18n();

interface CreditPackage {
  id: string;
  amount: number;
  price: string;
  currency: string;
  symbol: string;
}

interface UserStatus {
  credits: number;
  subscribed: boolean;
}

const packages = ref<CreditPackage[]>([]);
const userStatus = ref<UserStatus>({ credits: 0, subscribed: false });
const loading = ref(false);

onMounted(async () => {
  await Promise.all([
    fetchCreditPackages(),
    fetchUserStatus()
  ]);
});

async function fetchCreditPackages() {
  try {
    const res = await liuReq.request<{ packages: CreditPackage[] }>(
      APIs.SUBSCRIBE_PLAN,
      { operateType: 'credit_packages' }
    );
    if (res.code === '0000' && res.data) {
      packages.value = res.data.packages;
    }
  } catch (err) {
    console.error('Failed to fetch credit packages:', err);
  }
}

async function fetchUserStatus() {
  try {
    const res = await liuReq.request<UserStatus>(
      APIs.SUBSCRIBE_PLAN,
      { operateType: 'status' }
    );
    if (res.code === '0000' && res.data) {
      userStatus.value = res.data;
    }
  } catch (err) {
    console.error('Failed to fetch user status:', err);
  }
}

async function buyCredits(pkg: CreditPackage) {
  if (loading.value) return;
  
  const confirmed = await cui.showModal({
    title_key: 'payment.buy_credits',
    content: `购买 ${pkg.amount} 点数，需支付 ${pkg.symbol}${pkg.price}`,
    confirm_key: 'payment.buy',
    cancel_key: 'common.cancel'
  });
  
  if (!confirmed.confirm) return;
  
  loading.value = true;
  cui.showLoading({ title_key: 'tip.hold_on' });
  
  try {
    const res = await liuReq.request<{ credits: number; added: number }>(
      APIs.SUBSCRIBE_PLAN,
      { 
        operateType: 'buy_credits',
        packageId: pkg.id
      }
    );
    
    cui.hideLoading();
    
    if (res.code === '0000' && res.data) {
      userStatus.value.credits = res.data.credits;
      await cui.showModal({
        iconName: 'emojis-party_popper_color',
        title_key: 'payment.purchase_success',
        content: `成功购买 ${res.data.added} 点数！当前余额：${res.data.credits} 点`,
        showCancel: false,
        confirm_key: 'tip.got_it'
      });
    } else {
      showErrMsg('other', res);
    }
  } catch (err) {
    cui.hideLoading();
    console.error('Failed to buy credits:', err);
    cui.showModal({
      iconName: 'emojis-crying_face_color',
      title_key: 'common.error',
      content: '购买失败，请稍后重试',
      showCancel: false,
      confirm_key: 'tip.got_it'
    });
  } finally {
    loading.value = false;
  }
}

async function buyMembershipWithCredits() {
  if (loading.value) return;
  
  const requiredCredits = 100;
  
  if (userStatus.value.credits < requiredCredits) {
    await cui.showModal({
      iconName: 'emojis-crying_face_color',
      title_key: 'payment.insufficient_credits',
      content: `点数不足！需要 ${requiredCredits} 点，当前仅有 ${userStatus.value.credits} 点`,
      showCancel: false,
      confirm_key: 'tip.got_it'
    });
    return;
  }
  
  const confirmed = await cui.showModal({
    title_key: 'payment.buy_membership_with_credits',
    content: `使用 ${requiredCredits} 点数购买年度会员？`,
    confirm_key: 'payment.buy',
    cancel_key: 'common.cancel'
  });
  
  if (!confirmed.confirm) return;
  
  loading.value = true;
  cui.showLoading({ title_key: 'tip.hold_on' });
  
  try {
    const res = await liuReq.request<{ 
      subscription: any; 
      credits: number; 
      deducted: number 
    }>(
      APIs.SUBSCRIBE_PLAN,
      { 
        operateType: 'buy_membership_with_credits',
        planId: 'plan_premium_yearly'
      }
    );
    
    cui.hideLoading();
    
    if (res.code === '0000' && res.data) {
      userStatus.value.credits = res.data.credits;
      userStatus.value.subscribed = true;
      
      await cui.showModal({
        iconName: 'emojis-party_popper_color',
        title_key: 'payment.purchase_success',
        content: `成功开通年度会员！扣除 ${res.data.deducted} 点，剩余 ${res.data.credits} 点`,
        showCancel: false,
        confirm_key: 'tip.got_it'
      });
      
      // 刷新页面以更新会员状态
      location.reload();
    } else {
      showErrMsg('other', res);
    }
  } catch (err) {
    cui.hideLoading();
    console.error('Failed to buy membership:', err);
    cui.showModal({
      iconName: 'emojis-crying_face_color',
      title_key: 'common.error',
      content: '购买失败，请稍后重试',
      showCancel: false,
      confirm_key: 'tip.got_it'
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="thus-mc-container">
    <div class="liu-tc-virtual"></div>
    
    <!-- 点数余额卡片 -->
    <div class="thus-mc-box credits-balance-box">
      <div class="thus-no-user-select cb-title">
        <span>当前点数余额</span>
      </div>
      <div class="cb-amount">
        <span class="cba-number">{{ userStatus.credits }}</span>
        <span class="cba-unit">点</span>
      </div>
      <div class="cb-desc thus-selection">
        点数可用于购买会员服务或其他增值功能
      </div>
    </div>

    <!-- 点数包列表 -->
    <div class="thus-mc-box credits-packages-box">
      <div class="thus-no-user-select cp-title">
        <span>购买点数包</span>
      </div>
      
      <div class="cp-list">
        <div 
          v-for="pkg in packages" 
          :key="pkg.id"
          class="thus-no-user-select thus-hover cp-item"
          @click="buyCredits(pkg)"
        >
          <div class="cpi-badge">
            <span>{{ pkg.amount }} 点</span>
          </div>
          <div class="cpi-price">
            <span class="cpip-symbol">{{ pkg.symbol }}</span>
            <span class="cpip-amount">{{ pkg.price }}</span>
          </div>
          <div class="cpi-action">
            <span>立即购买</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 用点数购买会员 -->
    <div class="thus-mc-box credits-membership-box" v-if="!userStatus.subscribed">
      <div class="thus-no-user-select cm-title">
        <span>使用点数购买会员</span>
      </div>
      
      <div class="cm-badge">
        <span>年度高级会员</span>
      </div>
      
      <div class="cm-price">
        <span class="cmp-amount">100</span>
        <span class="cmp-unit">点</span>
      </div>
      
      <div class="cm-desc thus-selection">
        无限笔记存储空间 · AI 智能标签 · 多端实时同步 · 优先技术支持
      </div>
      
      <div class="cm-btns">
        <ShinyButton 
          class="cm-btn"
          @click="buyMembershipWithCredits"
          :disabled="loading || userStatus.credits < 100"
        >
          <span v-if="userStatus.credits >= 100">使用 100 点购买会员</span>
          <span v-else>点数不足（需要 100 点）</span>
        </ShinyButton>
        
        <div v-if="userStatus.credits < 100" 
          class="thus-no-user-select cm-tip"
        >
          <span>还需 {{ 100 - userStatus.credits }} 点</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

/* 点数余额卡片 */
.credits-balance-box {
  margin-block-end: 30px;
}

.cb-title {
  font-size: var(--big-word-style);
  color: var(--main-text);
  line-height: 1.5;
  font-weight: 700;
  margin-block-end: 15px;
}

.cb-amount {
  font-size: var(--big-word-style);
  margin-block-end: 10px;
  color: rgb(225, 81, 65);
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.cba-number {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -1px;
}

.cba-unit {
  font-size: var(--inline-code-font);
  font-weight: 700;
  color: var(--main-text);
}

.cb-desc {
  font-size: var(--mini-font);
  color: var(--main-note);
  line-height: 1.6;
}

/* 点数包列表 */
.credits-packages-box {
  margin-block-end: 30px;
}

.cp-title {
  font-size: var(--big-word-style);
  color: var(--main-text);
  line-height: 1.5;
  font-weight: 700;
  margin-block-end: 20px;
}

.cp-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 15px;
}

.cp-item {
  position: relative;
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  border: 2px solid var(--line-default);
  box-shadow: var(--card-shadow-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  &:hover {
    border-color: var(--primary-color);
    box-shadow: var(--card-shadow2-hover);
    transform: translateY(-3px);
  }

  &:active {
    transform: translateY(-1px);
  }
}

.cpi-badge {
  position: relative;
  font-size: var(--title-font);
  color: var(--primary-color);
  border-radius: 20px;
  padding: 6px 18px;
  overflow: hidden;
  display: inline-flex;
  font-weight: 700;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--cool-bg);
    opacity: .24;
  }
}

.cpi-price {
  font-size: var(--desc-font);
  color: rgb(225, 81, 65);
  font-weight: 700;
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.cpip-symbol {
  font-size: var(--inline-code-font);
}

.cpip-amount {
  font-size: var(--title-font);
}

.cpi-action {
  font-size: var(--mini-font);
  color: var(--primary-color);
  font-weight: 600;
  margin-block-start: 4px;
}

/* 用点数购买会员 */
.credits-membership-box {
  margin-block-end: 50px;
}

.cm-title {
  font-size: var(--big-word-style);
  color: var(--main-text);
  line-height: 1.5;
  font-weight: 700;
  margin-block-end: 10px;
}

.cm-badge {
  position: relative;
  font-size: var(--mini-font);
  color: var(--primary-color);
  border-radius: 20px;
  padding: 4px 16px;
  overflow: hidden;
  display: inline-flex;
  font-weight: 200;
  font-style: italic;
  margin-block-end: 15px;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--cool-bg);
    opacity: .24;
  }
}

.cm-price {
  font-size: var(--big-word-style);
  margin-block-end: 15px;
  color: rgb(225, 81, 65);
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.cmp-amount {
  font-size: 42px;
  font-weight: 700;
  letter-spacing: -1px;
}

.cmp-unit {
  font-size: var(--inline-code-font);
  font-weight: 700;
  color: var(--main-text);
}

.cm-desc {
  margin-block-start: 15px;
  width: 100%;
  font-size: var(--desc-font);
  color: var(--main-code);
  line-height: 1.75;
}

.cm-btns {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-block-start: 40px;
  position: relative;

  .cm-btn {
    width: 60%;
    max-width: var(--btn-max);
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.cm-tip {
  font-size: var(--mini-font);
  color: var(--main-note);
  margin-block-start: 12px;
  line-height: 2;
  text-align: center;
}

@media screen and (max-width: 460px) {
  .cp-list {
    grid-template-columns: 1fr;
  }
  
  .cm-btns .cm-btn {
    width: 80%;
  }
}

</style>
