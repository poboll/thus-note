import { Types } from 'mongoose';
import Thread from '../models/Thread';
import Content from '../models/Content';
import Comment from '../models/Comment';

/**
 * 数据导入服务类
 */
export class ImportService {
  /**
   * 从JSON导入
   */
  static async importFromJSON(userId: Types.ObjectId, data: any): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    try {
      // 导入笔记
      if (data.threads && Array.isArray(data.threads)) {
        for (const threadData of data.threads) {
          try {
            const thread = new Thread({
              userId,
              title: threadData.title,
              type: threadData.type || 'note',
              status: threadData.status || 'active',
              tags: threadData.tags || [],
              createdAt: threadData.createdAt ? new Date(threadData.createdAt) : new Date(),
              updatedAt: threadData.updatedAt ? new Date(threadData.updatedAt) : new Date(),
            });
            await thread.save();
            results.success++;
          } catch (error: any) {
            results.failed++;
            results.errors.push(`导入笔记失败: ${threadData.title} - ${error.message}`);
          }
        }
      }

      // 导入内容
      if (data.contents && Array.isArray(data.contents)) {
        for (const contentData of data.contents) {
          try {
            const content = new Content({
              userId,
              threadId: contentData.threadId,
              blocks: contentData.blocks || [],
              version: contentData.version || 1,
              createdAt: contentData.createdAt ? new Date(contentData.createdAt) : new Date(),
            });
            await content.save();
            results.success++;
          } catch (error: any) {
            results.failed++;
            results.errors.push(`导入内容失败: ${contentData.threadId} - ${error.message}`);
          }
        }
      }

      // 导入评论
      if (data.comments && Array.isArray(data.comments)) {
        for (const commentData of data.comments) {
          try {
            const comment = new Comment({
              userId,
              threadId: commentData.threadId,
              contentId: commentData.contentId,
              content: commentData.content,
              parentId: commentData.parentId,
              mentions: commentData.mentions || [],
              createdAt: commentData.createdAt ? new Date(commentData.createdAt) : new Date(),
            });
            await comment.save();
            results.success++;
          } catch (error: any) {
            results.failed++;
            results.errors.push(`导入评论失败: ${commentData.content} - ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      results.errors.push(`导入失败: ${error.message}`);
    }

    return results;
  }

  /**
   * 预览导入数据
   */
  static previewImportData(data: any): { threads: number; contents: number; comments: number } {
    return {
      threads: data.threads?.length || 0,
      contents: data.contents?.length || 0,
      comments: data.comments?.length || 0,
    };
  }
}

export const importService = ImportService;
