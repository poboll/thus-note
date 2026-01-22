/**
 * 调试登录响应格式
 * 
 * 这个脚本用于检查后端返回的登录响应是否符合前端期望的格式
 */

const http = require('http');

const API_DOMAIN = 'http://localhost:3000';

// 测试登录
async function testLogin() {
  const postData = JSON.stringify({
    email: 'test@example.com',
    password: 'Test123456!'  // 修改为符合强度要求的密码
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/email',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 检查响应格式
function checkResponseFormat(response) {
  console.log('\n========== 登录响应格式检查 ==========\n');

  console.log('完整响应:');
  console.log(JSON.stringify(response, null, 2));
  console.log('\n');

  // 检查顶层结构
  console.log('1. 检查顶层结构:');
  if (response.code === '0000') {
    console.log('   ✅ response.code = "0000"');
  } else {
    console.log('   ❌ response.code 不是 "0000"，而是:', response.code);
  }

  if (response.data && typeof response.data === 'object') {
    console.log('   ✅ response.data 存在且是对象');
  } else {
    console.log('   ❌ response.data 不存在或不是对象');
    return false;
  }

  const data = response.data;

  // 检查必需字段
  console.log('\n2. 检查必需字段:');
  const requiredFields = [
    'userId',
    'email',
    'token',
    'serial_id',
    'theme',
    'language',
    'spaceMemberList'
  ];

  const missingFields = [];
  const extraFields = [];

  requiredFields.forEach(field => {
    if (data[field] !== undefined) {
      console.log(`   ✅ ${field}:`, typeof data[field] === 'object' ? `[${data[field].constructor.name}]` : data[field]);
    } else {
      console.log(`   ❌ ${field}: 缺失`);
      missingFields.push(field);
    }
  });

  // 检查可选字段
  console.log('\n3. 检查可选字段:');
  const optionalFields = ['open_id', 'github_id'];
  optionalFields.forEach(field => {
    if (data[field] !== undefined) {
      console.log(`   ✅ ${field}:`, data[field]);
    } else {
      console.log(`   ⚠️  ${field}: 不存在（可选）`);
    }
  });

  // 检查 spaceMemberList 格式
  console.log('\n4. 检查 spaceMemberList 格式:');
  if (Array.isArray(data.spaceMemberList)) {
    console.log(`   ✅ spaceMemberList 是数组，包含 ${data.spaceMemberList.length} 个元素`);

    if (data.spaceMemberList.length > 0) {
      const firstSpace = data.spaceMemberList[0];
      console.log('\n   第一个空间的字段:');
      const spaceFields = [
        'memberId',
        'member_name',
        'member_avatar',
        'member_oState',
        'member_config',
        'member_notification',
        'spaceId',
        'spaceType',
        'space_oState',
        'space_owner',
        'space_name',
        'space_avatar',
        'space_stateConfig',
        'space_tagList',
        'space_config'
      ];

      spaceFields.forEach(field => {
        if (firstSpace[field] !== undefined) {
          console.log(`     ✅ ${field}`);
        } else {
          console.log(`     ❌ ${field}: 缺失`);
        }
      });
    } else {
      console.log('   ⚠️  spaceMemberList 为空数组');
    }
  } else {
    console.log('   ❌ spaceMemberList 不是数组');
    missingFields.push('spaceMemberList (格式错误)');
  }

  // 总结
  console.log('\n========== 检查结果 ==========\n');

  if (missingFields.length === 0) {
    console.log('✅ 所有必需字段都存在，响应格式正确！');
    return true;
  } else {
    console.log('❌ 缺少以下必需字段:');
    missingFields.forEach(field => console.log(`   - ${field}`));
    return false;
  }
}

// 主函数
async function main() {
  try {
    console.log('正在测试登录...\n');
    const response = await testLogin();
    const isValid = checkResponseFormat(response);

    if (isValid) {
      console.log('\n✅ 登录响应格式验证通过！');
      console.log('如果前端仍然转圈，请检查浏览器控制台的错误信息。');
    } else {
      console.log('\n❌ 登录响应格式验证失败！');
      console.log('后端需要修复返回的数据格式。');
    }
  } catch (error) {
    console.error('测试失败:', error.message);
    console.log('\n请确保后端服务正在运行: http://localhost:3000');
    console.log('并且测试用户存在: test@example.com / Test123456!');
  }
}

main();
