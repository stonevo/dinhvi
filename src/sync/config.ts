import type { FirebaseOptions } from 'firebase/app';

/**
 * Cấu hình web của dự án Firebase (Project settings → Your apps → Web app → firebaseConfig).
 * Đây là mã công khai, đặt trong code được; quyền truy cập dữ liệu do luật Firestore
 * (firestore.rules) quyết định. Để null thì app ẩn phần đồng bộ, chạy offline như cũ.
 */
export const FIREBASE_CONFIG: FirebaseOptions | null = {
  apiKey: 'AIzaSyA1kCpUn8n8TyG1GYmKNGlYAabKqhIyaWY',
  authDomain: 'dinh-vi-e4f65.firebaseapp.com',
  projectId: 'dinh-vi-e4f65',
  storageBucket: 'dinh-vi-e4f65.firebasestorage.app',
  messagingSenderId: '630928871264',
  appId: '1:630928871264:web:4d8e3b09c7775501881805',
};
