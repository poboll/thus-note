import Joi from 'joi';

/**
 * 笔记相关验证规则
 */

// 创建笔记验证
export const createThreadSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': '标题不能为空',
      'string.max': '标题最多200个字符',
      'any.required': '标题不能为空',
    }),
  type: Joi.string()
    .valid('note', 'task', 'calendar', 'kanban', 'drawing')
    .required()
    .messages({
      'any.only': '类型必须是note、task、calendar、kanban或drawing',
      'any.required': '类型不能为空',
    }),
  content: Joi.string()
    .allow('', null)
    .max(100000)
    .messages({
      'string.max': '内容最多100000个字符',
    }),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .messages({
      'array.max': '标签最多10个',
    }),
});

// 更新笔记验证
export const updateThreadSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .messages({
      'string.min': '标题不能为空',
      'string.max': '标题最多200个字符',
    }),
  content: Joi.string()
    .allow('', null)
    .max(100000)
    .messages({
      'string.max': '内容最多100000个字符',
    }),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .messages({
      'array.max': '标签最多10个',
    }),
  status: Joi.string()
    .valid('active', 'archived', 'deleted')
    .messages({
      'any.only': '状态必须是active、archived或deleted',
    }),
});

// 获取笔记列表验证
export const getThreadsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': '页码必须大于0',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': '每页数量必须大于0',
      'number.max': '每页数量不能超过100',
    }),
  type: Joi.string()
    .valid('note', 'task', 'calendar', 'kanban', 'drawing')
    .messages({
      'any.only': '类型必须是note、task、calendar、kanban或drawing',
    }),
  status: Joi.string()
    .valid('active', 'archived', 'deleted')
    .messages({
      'any.only': '状态必须是active、archived或deleted',
    }),
  tag: Joi.string()
    .max(50)
    .messages({
      'string.max': '标签最多50个字符',
    }),
  keyword: Joi.string()
    .max(100)
    .messages({
      'string.max': '关键词最多100个字符',
    }),
});
