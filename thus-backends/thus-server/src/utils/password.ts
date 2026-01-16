import bcrypt from 'bcrypt';

/**
 * 密码工具类
 * 用于密码哈希、验证和强度检查
 */
export class PasswordUtil {
  private static readonly SALT_ROUNDS = 10;
  private static readonly MIN_PASSWORD_LENGTH = 8;
  private static readonly MAX_PASSWORD_LENGTH = 128;

  /**
   * 哈希密码
   * @param password 明文密码
   * @returns 哈希后的密码
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * 验证密码
   * @param password 明文密码
   * @param hash 哈希密码
   * @returns 是否匹配
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * 验证密码强度
   * @param password 密码
   * @returns 密码强度验证结果
   */
  static validatePasswordStrength(password: string): {
    valid: boolean;
    score: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let score = 0;

    // 检查长度
    if (password.length < this.MIN_PASSWORD_LENGTH) {
      errors.push(`密码长度不能少于${this.MIN_PASSWORD_LENGTH}位`);
    } else if (password.length >= this.MIN_PASSWORD_LENGTH) {
      score += 1;
    }

    if (password.length > this.MAX_PASSWORD_LENGTH) {
      errors.push(`密码长度不能超过${this.MAX_PASSWORD_LENGTH}位`);
    }

    // 检查是否包含小写字母
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      errors.push('密码必须包含小写字母');
    }

    // 检查是否包含大写字母
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      errors.push('密码必须包含大写字母');
    }

    // 检查是否包含数字
    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      errors.push('密码必须包含数字');
    }

    // 检查是否包含特殊字符
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      errors.push('密码必须包含特殊字符');
    }

    // 检查常见弱密码
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'monkey', 'master', 'dragon', '111111', 'baseball',
      'iloveyou', 'trustno1', 'sunshine', 'princess',
      'admin', 'welcome', 'shadow', 'ashley', 'football',
      'jesus', 'michael', 'ninja', 'mustang', 'password1'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('密码过于简单，请使用更复杂的密码');
      score = 0;
    }

    return {
      valid: errors.length === 0,
      score,
      errors,
    };
  }

  /**
   * 生成随机密码
   * @param length 密码长度
   * @returns 随机密码
   */
  static generateRandomPassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}
