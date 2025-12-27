

function getEnv() {

  const extVersion = THUS_ENV.EXT_VERSION
  const apiDomain = THUS_ENV.API_DOMAIN
  const liuDomain = THUS_ENV.LIU_DOMAIN
  const customerService = THUS_ENV.CUSTOMER_SERVICE
  const developerEmail = THUS_ENV.DEVELOPER_EMAIL
  const mode = THUS_ENV.MODE
  const appName = THUS_ENV.APP_NAME
  const appPrefix = THUS_ENV.APP_PREFIX

  return {
    extVersion,
    apiDomain,
    liuDomain,
    customerService,
    developerEmail,
    mode,
    appName,
    appPrefix,
  }

}

export default {
  getEnv,
}