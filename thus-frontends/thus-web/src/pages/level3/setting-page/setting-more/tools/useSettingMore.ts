import { usePrefix } from "~/hooks/useCommon";
import liuEnv from "~/utils/thus-env";

export function useSettingMore() {
  const { prefix } = usePrefix()

  const _env = liuEnv.getEnv()
  const serviceTermsLink = "/terms"
  const privacyPolicyLink = "/privacy"

  return {
    prefix,
    serviceTermsLink,
    privacyPolicyLink,
  }
}