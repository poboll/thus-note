#!/bin/bash

# 微信登录功能测试脚本

BASE_URL="http://localhost:3000"

echo "=========================================="
echo "微信登录功能测试"
echo "=========================================="

# 1. 测试初始化
echo ""
echo "1. 测试初始化 (POST /user-login operateType=init)"
INIT_RESPONSE=$(curl -s -X POST "$BASE_URL/user-login" \
  -H "Content-Type: application/json" \
  -d '{"operateType":"init"}')
echo "$INIT_RESPONSE" | jq '.'

STATE=$(echo "$INIT_RESPONSE" | jq -r '.data.state')
echo "State: $STATE"

# 2. 测试生成二维码
echo ""
echo "2. 测试生成二维码 (POST /user-login operateType=wx_gzh_scan)"
SCAN_RESPONSE=$(curl -s -X POST "$BASE_URL/user-login" \
  -H "Content-Type: application/json" \
  -d "{\"operateType\":\"wx_gzh_scan\",\"state\":\"$STATE\"}")
echo "$SCAN_RESPONSE" | jq '.'

CREDENTIAL=$(echo "$SCAN_RESPONSE" | jq -r '.data.credential')
QR_CODE=$(echo "$SCAN_RESPONSE" | jq -r '.data.qr_code')
echo "Credential: $CREDENTIAL"
echo "QR Code: $QR_CODE"

# 3. 测试检查扫码状态
echo ""
echo "3. 测试检查扫码状态 (POST /user-login operateType=scan_check)"
CHECK_RESPONSE=$(curl -s -X POST "$BASE_URL/user-login" \
  -H "Content-Type: application/json" \
  -d "{\"operateType\":\"scan_check\",\"credential\":\"$CREDENTIAL\"}")
echo "$CHECK_RESPONSE" | jq '.'

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "注意: 完整的登录流程需要："
echo "1. 用户扫描二维码"
echo "2. 认证服务回调 /api/wechat/scan-callback"
echo "3. 前端轮询 scan_check 直到状态变为 plz_check"
echo "4. 前端调用 scan_login 完成登录"
echo ""
