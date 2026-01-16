import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';
import { Types } from 'mongoose';
import Thread from '../models/Thread';
import Content from '../models/Content';
import Comment from '../models/Comment';

/**
 * 数据导出服务类
 */
export class ExportService {
  /**
   * 导出为JSON
   */
  static async exportToJSON(userId: Types.ObjectId): Promise<Buffer> {
    const threads = await Thread.find({ userId, status: 'active' });
    const contents = await Content.find({ userId });
    const comments = await Comment.find({ userId });

    const data = {
      threads,
      contents,
      comments,
      exportedAt: new Date().toISOString(),
    };

    return Buffer.from(JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * 导出为CSV
   */
  static async exportToCSV(userId: Types.ObjectId): Promise<Buffer> {
    const threads = await Thread.find({ userId, status: 'active' });

    const data = threads.map(thread => ({
      id: thread._id.toString(),
      title: thread.title,
      type: thread.type,
      status: thread.status,
      tags: thread.tags.join(', '),
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    }));

    const parser = new Parser({ unwind: ['tags'] });
    const csv = parser.parse(data);

    return Buffer.from(csv, 'utf8');
  }

  /**
   * 导出为Excel
   */
  static async exportToExcel(userId: Types.ObjectId): Promise<Buffer> {
    const threads = await Thread.find({ userId, status: 'active' });

    const data = threads.map(thread => ({
      ID: thread._id.toString(),
      标题: thread.title,
      类型: thread.type,
      状态: thread.status,
      标签: thread.tags.join(', '),
      创建时间: thread.createdAt.toISOString(),
      更新时间: thread.updatedAt.toISOString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '笔记');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  /**
   * 导出为Markdown
   */
  static async exportToMarkdown(userId: Types.ObjectId): Promise<Buffer> {
    const threads = await Thread.find({ userId, status: 'active' });

    let markdown = '# 如是笔记导出\n\n';
    markdown += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

    for (const thread of threads) {
      markdown += `## ${thread.title}\n\n`;
      markdown += `**类型**: ${thread.type} | `;
      markdown += `**状态**: ${thread.status} | `;
      markdown += `**标签**: ${thread.tags.join(', ')}\n\n`;

      // 获取最新的内容
      const latestContent = await Content.findOne({ threadId: thread._id }).sort({ version: -1 });
      if (latestContent && latestContent.blocks && latestContent.blocks.length > 0) {
        // 将内容块转换为Markdown格式
        for (const block of latestContent.blocks) {
          switch (block.type) {
            case 'heading':
              markdown += `${'#'.repeat(block.properties?.level || 1)} ${block.content}\n\n`;
              break;
            case 'text':
              markdown += `${block.content}\n\n`;
              break;
            case 'list':
              markdown += `- ${block.content}\n`;
              break;
            case 'checklist':
              markdown += `- [${block.properties?.checked ? 'x' : ' '}] ${block.content}\n`;
              break;
            case 'code':
              markdown += `\`\`\`${block.properties?.language || ''}\n${block.content}\n\`\`\`\n\n`;
              break;
            case 'quote':
              markdown += `> ${block.content}\n\n`;
              break;
            case 'divider':
              markdown += '---\n\n';
              break;
            default:
              markdown += `${block.content}\n\n`;
          }
        }
      }

      markdown += '\n---\n\n';
    }

    return Buffer.from(markdown, 'utf8');
  }

  /**
   * 导出所有数据
   */
  static async exportAllData(userId: Types.ObjectId, format: 'json' | 'csv' | 'excel' | 'markdown'): Promise<{ data: Buffer; filename: string; contentType: string }> {
    let data: Buffer;
    let filename: string;
    let contentType: string;

    switch (format) {
      case 'json':
        data = await this.exportToJSON(userId);
        filename = `thus-note-export-${Date.now()}.json`;
        contentType = 'application/json';
        break;
      case 'csv':
        data = await this.exportToCSV(userId);
        filename = `thus-note-export-${Date.now()}.csv`;
        contentType = 'text/csv';
        break;
      case 'excel':
        data = await this.exportToExcel(userId);
        filename = `thus-note-export-${Date.now()}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'markdown':
        data = await this.exportToMarkdown(userId);
        filename = `thus-note-export-${Date.now()}.md`;
        contentType = 'text/markdown';
        break;
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }

    return { data, filename, contentType };
  }
}

export const exportService = ExportService;
