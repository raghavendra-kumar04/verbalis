import fs from 'fs';
import path from 'path';
import { SessionTempContext } from '../types/index.js';

const TEMP_DIR = process.env.TEMP_SESSION_DIR || path.join(process.cwd(), 'temp_sessions');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export class SessionContextService {
  private static getFilePath(sessionId: string): string {
    return path.join(TEMP_DIR, `${sessionId}.json`);
  }

  public static saveContext(context: SessionTempContext): void {
    const filePath = this.getFilePath(context.sessionId);
    fs.writeFileSync(filePath, JSON.stringify(context, null, 2), 'utf-8');
  }

  public static getContext(sessionId: string): SessionTempContext | null {
    const filePath = this.getFilePath(sessionId);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const context = JSON.parse(data) as SessionTempContext;
      // Check expiration (4 hours TTL)
      if (context.expiresAt && Date.now() > context.expiresAt) {
        this.deleteContext(sessionId);
        return null;
      }
      return context;
    } catch {
      return null;
    }
  }

  public static deleteContext(sessionId: string): void {
    const filePath = this.getFilePath(sessionId);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn(`Failed to delete temp session file: ${filePath}`, err);
      }
    }
  }

  public static cleanupExpiredSessions(): void {
    try {
      const files = fs.readdirSync(TEMP_DIR);
      const now = Date.now();
      for (const file of files) {
        if (file.endsWith('.json')) {
          const fullPath = path.join(TEMP_DIR, file);
          try {
            const data = fs.readFileSync(fullPath, 'utf-8');
            const context = JSON.parse(data) as SessionTempContext;
            if (context.expiresAt && now > context.expiresAt) {
              fs.unlinkSync(fullPath);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Error during session cleanup', err);
    }
  }
}
