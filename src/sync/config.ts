import type { FirebaseOptions } from 'firebase/app';

/**
 * Cấu hình web của dự án Firebase (Project settings → Your apps → Web app → firebaseConfig).
 * Đây là mã công khai, đặt trong code được; quyền truy cập dữ liệu do luật Firestore
 * (firestore.rules) quyết định. Để null thì app ẩn phần đồng bộ, chạy offline như cũ.
 */
export const FIREBASE_CONFIG: FirebaseOptions | null = null;
