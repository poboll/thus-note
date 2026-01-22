import crypto from 'crypto';

/**
 * 加密工具类
 * 用于敏感数据加密和解密
 */
export class EncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 64;
  private static readonly TAG_LENGTH = 16;

  /**
   * 生成加密密钥
   */
  static generateKey(password: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, this.KEY_LENGTH, 'sha256');
  }

  /**
   * 生成随机盐值
   */
  static generateSalt(): string {
    return crypto.randomBytes(this.SALT_LENGTH).toString('hex');
  }

  /**
   * 加密数据
   */
  static encrypt(text: string, password: string): { encrypted: string; salt: string; iv: string; tag: string } {
    const salt = this.generateSalt();
    const key = this.generateKey(password, salt);
    const iv = crypto.randomBytes(this.IV_LENGTH);

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      salt,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  /**
   * 解密数据
   */
  static decrypt(
    encrypted: string,
    password: string,
    salt: string,
    iv: string,
    tag: string
  ): string {
    const key = this.generateKey(password, salt);
    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 哈希数据
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * 生成随机token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 使用 AES-GCM 解密前端加密的数据
   * 前端使用 Web Crypto API 的 AES-GCM 加密
   * @param cipherText base64 格式的密文（包含 authTag）
   * @param iv base64 格式的初始向量
   * @param key base64 格式的 AES 密钥（256 位）
   * @returns 解密后的明文字符串
   */
  static decryptAESGCM(cipherText: string, iv: string, key: string): string {
    // 1. 将 base64 转换为 Buffer
    const cipherBuffer = Buffer.from(cipherText, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const keyBuffer = Buffer.from(key, 'base64');

    // 2. Web Crypto API 的 AES-GCM 将 authTag 附加在密文末尾
    // authTag 长度为 16 字节（128 位）
    const authTagLength = 16;
    const actualCipherText = cipherBuffer.subarray(0, cipherBuffer.length - authTagLength);
    const authTag = cipherBuffer.subarray(cipherBuffer.length - authTagLength);

    // 3. 创建解密器
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
    decipher.setAuthTag(authTag);

    // 4. 解密
    let decrypted = decipher.update(actualCipherText, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 使用 AES-GCM 加密数据（兼容前端格式）
   * @param plainText 明文
   * @param key base64 格式的 AES 密钥
   * @returns { cipherText: base64, iv: base64 }
   */
  static encryptAESGCM(plainText: string, key: string): { cipherText: string; iv: string } {
    const keyBuffer = Buffer.from(key, 'base64');
    const ivBuffer = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, ivBuffer);

    let encrypted = cipher.update(plainText, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // 将 authTag 附加到密文末尾（与 Web Crypto API 兼容）
    const authTag = cipher.getAuthTag();
    const cipherWithTag = Buffer.concat([encrypted, authTag]);

    return {
      cipherText: cipherWithTag.toString('base64'),
      iv: ivBuffer.toString('base64'),
    };
  }
}
