import { MeiliSearch } from 'meilisearch';
import { Types } from 'mongoose';
import Thread from '../models/Thread';
import Content from '../models/Content';
import Comment from '../models/Comment';

/**
 * 全文搜索服务类（MeiliSearch）
 */
export class SearchService {
  private client: MeiliSearch | null = null;

  /**
   * 初始化MeiliSearch客户端
   */
  async init(): Promise<void> {
    if (!process.env.MEILISEARCH_HOST || !process.env.MEILISEARCH_API_KEY) {
      console.warn('⚠️  MeiliSearch未配置，搜索功能将不可用');
      return;
    }

    try {
      this.client = new MeiliSearch({
        host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
        apiKey: process.env.MEILISEARCH_API_KEY || '',
      });

      // 创建索引
      await this.createIndexes();
      console.log('✅ MeiliSearch初始化成功');
    } catch (error) {
      console.error('❌ MeiliSearch初始化失败:', error);
    }
  }

  /**
   * 创建索引
   */
  private async createIndexes(): Promise<void> {
    if (!this.client) return;

    // 创建笔记索引
    await this.client.createIndex('threads', {
      primaryKey: '_id',
      displayedAttributes: ['title', 'type', 'status', 'tags', 'createdAt', 'updatedAt'],
      searchableAttributes: ['title', 'content', 'tags'],
      filterableAttributes: ['type', 'status', 'userId', 'tags'],
      sortableAttributes: ['createdAt', 'updatedAt'],
    });

    // 创建内容索引
    await this.client.createIndex('contents', {
      primaryKey: '_id',
      displayedAttributes: ['threadId', 'version', 'createdAt'],
      searchableAttributes: ['content'],
      filterableAttributes: ['threadId', 'userId'],
      sortableAttributes: ['createdAt'],
    });

    // 创建评论索引
    await this.client.createIndex('comments', {
      primaryKey: '_id',
      displayedAttributes: ['threadId', 'contentId', 'content', 'createdAt'],
      searchableAttributes: ['content'],
      filterableAttributes: ['threadId', 'userId'],
      sortableAttributes: ['createdAt'],
    });
  }

  /**
   * 索引笔记
   */
  async indexThread(thread: any): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.index('threads').addDocuments([{
        _id: thread._id.toString(),
        userId: thread.userId.toString(),
        title: thread.title,
        type: thread.type,
        status: thread.status,
        tags: thread.tags,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
      }]);
    } catch (error) {
      console.error('索引笔记失败:', error);
    }
  }

  /**
   * 索引内容
   */
  async indexContent(content: any): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.index('contents').addDocuments([{
        _id: content._id.toString(),
        userId: content.userId.toString(),
        threadId: content.threadId.toString(),
        blocks: content.blocks,
        version: content.version,
        createdAt: content.createdAt.toISOString(),
      }]);
    } catch (error) {
      console.error('索引内容失败:', error);
    }
  }

  /**
   * 索引评论
   */
  async indexComment(comment: any): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.index('comments').addDocuments([{
        _id: comment._id.toString(),
        userId: comment.userId.toString(),
        threadId: comment.threadId.toString(),
        contentId: comment.contentId?.toString(),
        content: comment.content,
        parentId: comment.parentId?.toString(),
        mentions: comment.mentions,
        createdAt: comment.createdAt.toISOString(),
      }]);
    } catch (error) {
      console.error('索引评论失败:', error);
    }
  }

  /**
   * 删除索引
   */
  async deleteThread(threadId: Types.ObjectId): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.index('threads').deleteDocument(threadId.toString());
    } catch (error) {
      console.error('删除笔记索引失败:', error);
    }
  }

  /**
   * 搜索笔记
   */
  async searchThreads(
    userId: Types.ObjectId,
    query: string,
    filters?: string[],
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    if (!this.client) return [];

    try {
      const searchFilters = [`userId = ${userId.toString()}`];
      if (filters && filters.length > 0) {
        searchFilters.push(...filters);
      }

      const results = await this.client.index('threads').search(query, {
        filter: searchFilters.join(' AND '),
        limit,
        offset,
      });

      return results.hits.map((hit: any) => ({
        id: hit._id,
        ...hit,
      }));
    } catch (error) {
      console.error('搜索笔记失败:', error);
      return [];
    }
  }

  /**
   * 搜索内容
   */
  async searchContents(
    userId: Types.ObjectId,
    query: string,
    threadId?: Types.ObjectId,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    if (!this.client) return [];

    try {
      const searchFilters = [`userId = ${userId.toString()}`];
      if (threadId) {
        searchFilters.push(`threadId = ${threadId.toString()}`);
      }

      const results = await this.client.index('contents').search(query, {
        filter: searchFilters.join(' AND '),
        limit,
        offset,
      });

      return results.hits.map((hit: any) => ({
        id: hit._id,
        ...hit,
      }));
    } catch (error) {
      console.error('搜索内容失败:', error);
      return [];
    }
  }

  /**
   * 搜索评论
   */
  async searchComments(
    userId: Types.ObjectId,
    query: string,
    threadId?: Types.ObjectId,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    if (!this.client) return [];

    try {
      const searchFilters = [`userId = ${userId.toString()}`];
      if (threadId) {
        searchFilters.push(`threadId = ${threadId.toString()}`);
      }

      const results = await this.client.index('comments').search(query, {
        filter: searchFilters.join(' AND '),
        limit,
        offset,
      });

      return results.hits.map((hit: any) => ({
        id: hit._id,
        ...hit,
      }));
    } catch (error) {
      console.error('搜索评论失败:', error);
      return [];
    }
  }

  /**
   * 全文搜索
   */
  async search(
    userId: Types.ObjectId,
    query: string,
    type?: 'threads' | 'contents' | 'comments' | 'all',
    filters?: string[],
    limit: number = 20,
    offset: number = 0
  ): Promise<{ threads: any[]; contents: any[]; comments: any[] }> {
    const results = {
      threads: [] as any[],
      contents: [] as any[],
      comments: [] as any[],
    };

    if (!this.client) return results;

    switch (type) {
      case 'threads':
        results.threads = await this.searchThreads(userId, query, filters, limit, offset);
        break;
      case 'contents':
        results.contents = await this.searchContents(userId, query, undefined, limit, offset);
        break;
      case 'comments':
        results.comments = await this.searchComments(userId, query, undefined, limit, offset);
        break;
      case 'all':
        results.threads = await this.searchThreads(userId, query, filters, limit, offset);
        results.contents = await this.searchContents(userId, query, undefined, limit, offset);
        results.comments = await this.searchComments(userId, query, undefined, limit, offset);
        break;
    }

    return results;
  }

  /**
   * 获取搜索建议
   */
  async getSuggestions(
    userId: Types.ObjectId,
    query: string,
    limit: number = 5
  ): Promise<string[]> {
    if (!this.client) return [];

    try {
      const results = await this.client.index('threads').search(query, {
        filter: `userId = ${userId.toString()}`,
        limit,
        attributesToRetrieve: ['title'],
      });

      return results.hits.map((hit: any) => hit.title);
    } catch (error) {
      console.error('获取搜索建议失败:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();
