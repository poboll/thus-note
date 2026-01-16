import Joi from 'joi';

/**
 * 认证相关验证规则
 */

// 用户注册验证
export const registerSchema = Joi.object({
  username: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': '用户名至少2个字符',
      'string.max': '用户名最多50个字符',
      'any.required': '用户名不能为空',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱不能为空',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)
    .required()
    .messages({
      'string.min': '密码至少8个字符',
      'string.max': '密码最多128个字符',
      'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
      'any.required': '密码不能为空',
    }),
});

// 用户登录验证
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱不能为空',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': '密码不能为空',
    }),
});

// 邮箱验证码验证
export const emailCodeSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱不能为空',
    }),
  code: Joi.string()
    .length(6)
    .required()
    .messages({
      'string.length': '验证码必须是6位',
      'any.required': '验证码不能为空',
    }),
});

// 短信验证码验证
export const smsCodeSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^1[3-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': '手机号格式不正确',
      'any.required': '手机号不能为空',
    }),
  code: Joi.string()
    .length(6)
    .required()
    .messages({
      'string.length': '验证码必须是6位',
      'any.required': '验证码不能为空',
    }),
});

// 刷新令牌验证
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': '刷新令牌不能为空',
    }),
});
