import crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * Encryption service for secure credential storage
 * Handles AES-256-GCM encryption for API tokens and secrets
 */
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private encryptionKey: Buffer;

  constructor(masterKey?: string) {
    // Master key should come from env (ENCRYPTION_KEY)
    const key = masterKey || process.env.ENCRYPTION_KEY;
    if (!key) {
      logger.warn('⚠️ ENCRYPTION_KEY not set, using default (NOT SECURE FOR PRODUCTION)');
    }
    // Create a 32-byte key from the master key
    this.encryptionKey = crypto
      .createHash('sha256')
      .update(key || 'default-insecure-key')
      .digest();
  }

  /**
   * Encrypt sensitive data (tokens, API keys)
   */
  encrypt(plaintext: string): { encrypted: string; iv: string; authTag: string } {
    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      logger.debug('🔐 Data encrypted successfully');

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encrypted: string, iv: string, authTag: string): string {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      logger.debug('🔓 Data decrypted successfully');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Hash sensitive data (one-way, for verification)
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export default EncryptionService;
