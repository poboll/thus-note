#!/bin/bash

# 如是(Thus-Note) 前后端集成测试脚本
# 用于测试所有API端点

BASE_URL="http://localhost:3000"
ACCESS_TOKEN=""
REFRESH_TOKEN=""
USER_ID=""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印测试结果
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# 打印测试开始
print_test_start() {
    echo -e "\n${YELLOW}========== $1 ==========${NC}"
}

# 测试1: 健康检查
test_health_check() {
    print_test_start "测试1: 健康检查"
    response=$(curl -s "$BASE_URL/health")
    echo "响应: $response"
    echo "$response" | grep -q "status.*ok"
    print_result $? "健康检查"
}

# 测试2: 用户注册
test_user_register() {
    print_test_start "测试2: 用户注册"
    username="testuser_$(date +%s)"
    email="${username}@test.com"
    password="Test123456"
    
    response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$password\"}")
    
    echo "响应: $response"
    
    # 提取access_token
    ACCESS_TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$response" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$ACCESS_TOKEN" ]; then
        print_result 0 "用户注册成功"
        echo "Access Token: $ACCESS_TOKEN"
    else
        print_result 1 "用户注册失败"
    fi
}

# 测试3: 获取当前用户信息
test_get_current_user() {
    print_test_start "测试3: 获取当前用户信息"
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}跳过: 未获取到access token${NC}"
        return
    fi
    
    response=$(curl -s "$BASE_URL/api/auth/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo "响应: $response"
    echo "$response" | grep -q '"code":"0000"'
    print_result $? "获取当前用户信息"
    
    # 提取user_id
    USER_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "User ID: $USER_ID"
}

# 测试4: 创建笔记
test_create_thread() {
    print_test_start "测试4: 创建笔记"
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}跳过: 未获取到access token${NC}"
        return
    fi
    
    response=$(curl -s -X POST "$BASE_URL/api/threads" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "title":"测试笔记",
            "type":"note",
            "content":"这是测试笔记的内容"
        }')
    
    echo "响应: $response"
    echo "$response" | grep -q '"code":"0000"'
    print_result $? "创建笔记"
}

# 测试5: 获取笔记列表
test_get_threads() {
    print_test_start "测试5: 获取笔记列表"
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}跳过: 未获取到access token${NC}"
        return
    fi
    
    response=$(curl -s "$BASE_URL/api/threads" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo "响应: $response"
    echo "$response" | grep -q '"code":"0000"'
    print_result $? "获取笔记列表"
}

# 测试6: 创建内容
test_create_content() {
    print_test_start "测试6: 创建内容"
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}跳过: 未获取到access token${NC}"
        return
    fi
    
    response=$(curl -s -X POST "$BASE_URL/api/contents" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "threadId":"test-thread-id",
            "blocks":[
                {"type":"text","content":"测试文本块"}
            ]
        }')
    
    echo "响应: $response"
    echo "$response" | grep -q '"code":"0000"'
    print_result $? "创建内容"
}

# 测试7: sync-get 获取数据
test_sync_get() {
    print_test_start "测试7: sync-get 获取数据"
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}跳过: 未获取到access token${NC}"
        return
    fi
    
    response=$(curl -s -X POST "$BASE_URL/api/sync/get" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "data_name":"thread_list"
        }')
    
    echo "响应: $response"
    echo "$response" | grep -q '"code":"0000"'
    print_result $? "sync-get 获取数据"
}

# 测试8: sync-set 创建数据
test_sync_set_create() {
    print_test_start "测试8: sync-set 创建数据"
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}跳过: 未获取到access token${NC}"
        return
    fi
    
    response=$(curl -s -X POST "$BASE_URL/api/sync/set" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "data_name":"thread-post",
            "data":{
                "title":"通过sync创建的笔记",
                "type":"note",
                "content":"sync测试内容"
            }
        }')
    
    echo "响应: $response"
    echo "$response" | grep -q '"code":"0000"'
    print_result $? "sync-set 创建数据"
}

# 测试9: 获取用户设置
test_get_settings() {
    print_test_start "测试9: 获取用户设置"
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}跳过: 未获取到access token${NC}"
        return
    fi
    
    response=$(curl -s "$BASE_URL/api/settings" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo "响应: $response"
    echo "$response" | grep -q '"code":"0000"'
    print_result $? "获取用户设置"
}

# 测试10: 更新用户设置
test_update_settings() {
    print_test_start "测试10: 更新用户设置"
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}跳过: 未获取到access token${NC}"
        return
    fi
    
    response=$(curl -s -X PUT "$BASE_URL/api/settings" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "language":"en",
            "theme":"dark"
        }')
    
    echo "响应: $response"
    echo "$response" | grep -q '"code":"0000"'
    print_result $? "更新用户设置"
}

# 测试11: 刷新令牌
test_refresh_token() {
    print_test_start "测试11: 刷新令牌"
    if [ -z "$REFRESH_TOKEN" ]; then
        echo -e "${RED}跳过: 未获取到refresh token${NC}"
        return
    fi
    
    response=$(curl -s -X POST "$BASE_URL/api/auth/refresh" \
        -H "Content-Type: application/json" \
        -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
    
    echo "响应: $response"
    
    # 提取新的access_token
    NEW_ACCESS_TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$NEW_ACCESS_TOKEN" ]; then
        print_result 0 "刷新令牌成功"
        ACCESS_TOKEN=$NEW_ACCESS_TOKEN
        echo "New Access Token: $ACCESS_TOKEN"
    else
        print_result 1 "刷新令牌失败"
    fi
}

# 测试12: 用户登出
test_logout() {
    print_test_start "测试12: 用户登出"
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}跳过: 未获取到access token${NC}"
        return
    fi
    
    response=$(curl -s -X POST "$BASE_URL/api/auth/logout" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo "响应: $response"
    echo "$response" | grep -q '"code":"0000"'
    print_result $? "用户登出"
}

# 主函数
main() {
    echo -e "${GREEN}"
    echo "=========================================="
    echo "  如是(Thus-Note) 集成测试"
    echo "=========================================="
    echo -e "${NC}"
    
    # 执行所有测试
    test_health_check
    test_user_register
    test_get_current_user
    test_create_thread
    test_get_threads
    test_create_content
    test_sync_get
    test_sync_set_create
    test_get_settings
    test_update_settings
    test_refresh_token
    test_logout
    
    echo -e "\n${GREEN}"
    echo "=========================================="
    echo "  测试完成"
    echo "=========================================="
    echo -e "${NC}"
}

# 运行主函数
main
