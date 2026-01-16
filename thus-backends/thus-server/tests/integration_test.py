#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
如是(Thus-Note) 前后端集成测试脚本
用于测试所有API端点
"""

import requests
import json
import time
from typing import Dict, Optional

class ThusNoteIntegrationTest:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.user_id: Optional[str] = None
        self.thread_id: Optional[str] = None
        self.content_id: Optional[str] = None
        
    def print_test_start(self, test_name: str):
        """打印测试开始"""
        print(f"\n{'='*50}")
        print(f"  {test_name}")
        print(f"{'='*50}")
        
    def print_result(self, success: bool, message: str):
        """打印测试结果"""
        if success:
            print(f"✓ {message}")
        else:
            print(f"✗ {message}")
            
    def print_response(self, response: requests.Response):
        """打印响应"""
        try:
            print(f"状态码: {response.status_code}")
            print(f"响应: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
        except:
            print(f"响应: {response.text}")
    
    def get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        headers = {
            "Content-Type": "application/json"
        }
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers
    
    def test_01_health_check(self):
        """测试1: 健康检查"""
        self.print_test_start("测试1: 健康检查")
        
        try:
            response = requests.get(f"{self.base_url}/health")
            self.print_response(response)
            success = response.status_code == 200
            self.print_result(success, "健康检查")
            return success
        except Exception as e:
            print(f"错误: {e}")
            self.print_result(False, "健康检查")
            return False
    
    def test_02_user_register(self):
        """测试2: 用户注册"""
        self.print_test_start("测试2: 用户注册")
        
        username = f"testuser_{int(time.time())}"
        email = f"{username}@test.com"
        password = "Test123456"
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/register",
                headers=self.get_headers(),
                json={
                    "username": username,
                    "email": email,
                    "password": password
                }
            )
            self.print_response(response)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == "0000":
                    self.access_token = data.get("data", {}).get("accessToken")
                    self.refresh_token = data.get("data", {}).get("refreshToken")
                    self.user_id = data.get("data", {}).get("user", {}).get("_id")
                    print(f"\nAccess Token: {self.access_token}")
                    print(f"Refresh Token: {self.refresh_token}")
                    print(f"User ID: {self.user_id}")
                    self.print_result(True, "用户注册成功")
                    return True
            
            self.print_result(False, "用户注册失败")
            return False
        except Exception as e:
            print(f"错误: {e}")
            self.print_result(False, "用户注册失败")
            return False
    
    def test_03_get_current_user(self):
        """测试3: 获取当前用户信息"""
        self.print_test_start("测试3: 获取当前用户信息")
        
        if not self.access_token:
            print("跳过: 未获取到access token")
            return False
        
        try:
            response = requests.get(
                f"{self.base_url}/api/auth/me",
                headers=self.get_headers()
            )
            self.print_response(response)
            
            success = response.status_code == 200 and response.json().get("code") == "0000"
            self.print_result(success, "获取当前用户信息")
            return success
        except Exception as e:
            print(f"错误: {e}")
            self.print_result(False, "获取当前用户信息")
            return False
    
    def test_04_create_thread(self):
        """测试4: 创建笔记"""
        self.print_test_start("测试4: 创建笔记")
        
        if not self.access_token:
            print("跳过: 未获取到access token")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/api/threads",
                headers=self.get_headers(),
                json={
                    "title": "测试笔记",
                    "type": "note",
                    "content": "这是测试笔记的内容"
                }
            )
            self.print_response(response)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == "0000":
                    self.thread_id = data.get("data", {}).get("_id")
                    print(f"\nThread ID: {self.thread_id}")
                    self.print_result(True, "创建笔记成功")
                    return True
            
            self.print_result(False, "创建笔记失败")
            return False
        except Exception as e:
            print(f"错误: {e}")
            self.print_result(False, "创建笔记失败")
            return False
    
    def test_05_get_threads(self):
        """测试5: 获取笔记列表"""
        self.print_test_start("测试5: 获取笔记列表")
        
        if not self.access_token:
            print("跳过: 未获取到access token")
            return False
        
        try:
            response = requests.get(
                f"{self.base_url}/api/threads",
                headers=self.get_headers()
            )
            self.print_response(response)
            
            success = response.status_code == 200 and response.json().get("code") == "0000"
            self.print_result(success, "获取笔记列表")
            return success
        except Exception as e:
            print(f"错误: {e}")
            self.print_result(False, "获取笔记列表")
            return False
    
    def test_06_create_content(self):
        """测试6: 创建内容"""
        self.print_test_start("测试6: 创建内容")
        
        if not self.access_token:
            print("跳过: 未获取到access token")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/api/contents",
                headers=self.get_headers(),
                json={
                    "threadId": self.thread_id or "test-thread-id",
                    "blocks": [
                        {"type": "text", "content": "测试文本块"},
                        {"type": "heading", "content": "测试标题"}
                    ]
                }
            )
            self.print_response(response)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == "0000":
                    self.content_id = data.get("data", {}).get("_id")
                    print(f"\nContent ID: {self.content_id}")
                    self.print_result(True, "创建内容成功")
                    return True
            
            self.print_result(False, "创建内容失败")
            return False
        except Exception as e:
            print(f"错误: {e}")
            self.print_result(False, "创建内容失败")
            return False
    
    def test_07_sync_get(self):
        """测试7: sync-get 获取数据"""
        self.print_test_start("测试7: sync-get 获取数据")
        
        if not self.access_token:
            print("跳过: 未获取到access token")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/api/sync/get",
                headers=self.get_headers(),
                json={
                    "data_name": "thread_list"
                }
            )
            self.print_response(response)
            
            success = response.status_code == 200 and response.json().get("code") == "0000"
            self.print_result(success, "sync-get 获取数据")
            return success
        except Exception as e:
            print(f"错误: {e}")
            self.print_result(False, "sync-get 获取数据")
            return False
    
    def test_08_sync_set_create(self):
        """测试8: sync-set 创建数据"""
        self.print_test_start("测试8: sync-set 创建数据")
        
        if not self.access_token:
            print("跳过: 未获取到access token")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/api/sync/set",
                headers=self.get_headers(),
                json={
                    "data_name": "thread-post",
                    "data": {
                        "title": "通过sync创建的笔记",
                        "type": "note",
                        "content": "sync测试内容"
                    }
                }
            )
            self.print_response(response)
            
            success = response.status_code == 200 and response.json().get("code") == "0000"
            self.print_result(success, "sync-set 创建数据")
            return success
        except Exception as e:
            print(f"错误: {e}")
            self.print_result(False, "sync-set 创建数据")
            return False
    
    def test_09_get_settings(self):
        """测试9: 获取用户设置"""
        self.print_test_start("测试9: 获取用户设置")
        
        if not self.access_token:
            print("跳过: 未获取到access token")
            return False
        
        try:
            response = requests.get(
                f"{self.base_url}/api/settings",
                headers=self.get_headers()
            )
            self.print_response(response)
            
            success = response.status_code == 200 and response.json().get("code") == "0000"
            self.print_result(success, "获取用户设置")
            return success
        except Exception as e:
            print(f"错误: {e}")
            self.print_result(False, "获取用户设置")
            return False
    
    def test_10_update_settings(self):
        """测试10: 更新用户设置"""
        self.print_test_start("测试10: 更新用户设置")
        
        if not self.access_token:
            print("跳过: 未获取到access token")
            return False
        
        try:
            response = requests.put(
                f"{self.base_url}/api/settings",
                headers=self.get_headers(),
                json={
                    "language": "en",
                    "theme": "dark"
                }
            )
            self.print_response(response)
            
            success = response.status_code == 200 and response.json().get("code") == "0000"
            self.print_result(success, "更新用户设置")
            return success
        except Exception as e:
            print(f"错误: {e}")
            self.print_result(False, "更新用户设置")
            return False
    
    def test_11_refresh_token(self):
        """测试11: 刷新令牌"""
        self.print_test_start("测试11: 刷新令牌")
        
        if not self.refresh_token:
            print("跳过: 未获取到refresh token")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/refresh",
                headers={"Content-Type": "application/json"},
                json={
                    "refreshToken": self.refresh_token
                }
            )
            self.print_response(response)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == "0000":
                    self.access_token = data.get("data", {}).get("accessToken")
                    print(f"\nNew Access Token: {self.access_token}")
                    self.print_result(True, "刷新令牌成功")
                    return True
            
            self.print_result(False, "刷新令牌失败")
            return False
        except Exception as e:
            print(f"错误: {e}")
            self.print_result(False, "刷新令牌失败")
            return False
    
    def test_12_logout(self):
        """测试12: 用户登出"""
        self.print_test_start("测试12: 用户登出")
        
        if not self.access_token:
            print("跳过: 未获取到access token")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/logout",
                headers=self.get_headers()
            )
            self.print_response(response)
            
            success = response.status_code == 200 and response.json().get("code") == "0000"
            self.print_result(success, "用户登出")
            return success
        except Exception as e:
            print(f"错误: {e}")
            self.print_result(False, "用户登出")
            return False
    
    def run_all_tests(self):
        """运行所有测试"""
        print("\n" + "="*50)
        print("  如是(Thus-Note) 集成测试")
        print("="*50)
        
        results = []
        
        # 执行所有测试
        results.append(("健康检查", self.test_01_health_check()))
        results.append(("用户注册", self.test_02_user_register()))
        results.append(("获取当前用户信息", self.test_03_get_current_user()))
        results.append(("创建笔记", self.test_04_create_thread()))
        results.append(("获取笔记列表", self.test_05_get_threads()))
        results.append(("创建内容", self.test_06_create_content()))
        results.append(("sync-get 获取数据", self.test_07_sync_get()))
        results.append(("sync-set 创建数据", self.test_08_sync_set_create()))
        results.append(("获取用户设置", self.test_09_get_settings()))
        results.append(("更新用户设置", self.test_10_update_settings()))
        results.append(("刷新令牌", self.test_11_refresh_token()))
        results.append(("用户登出", self.test_12_logout()))
        
        # 打印测试总结
        print("\n" + "="*50)
        print("  测试总结")
        print("="*50)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✓" if result else "✗"
            print(f"{status} {test_name}")
        
        print(f"\n通过: {passed}/{total}")
        print("="*50)
        
        return passed == total

if __name__ == "__main__":
    tester = ThusNoteIntegrationTest()
    success = tester.run_all_tests()
    exit(0 if success else 1)
