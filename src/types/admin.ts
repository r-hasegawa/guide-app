// src/types/admin.ts

// シンプルなお知らせの型定義（複雑な機能を削除）
export interface Announcement {
  id: string;
  titleJa: string;      // 日本語タイトル
  titleEn: string;      // 英語タイトル
  contentJa: string;    // 日本語本文
  contentEn: string;    // 英語本文
  createdAt: any;       // 公開日（自動）
}

// 新規お知らせ作成用の型
export interface CreateAnnouncementData {
  titleJa: string;
  titleEn: string;
  contentJa: string;
  contentEn: string;
}

// 基本的なユーザー統計情報（簡素化）
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalGuides: number;
  totalGuests: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  completedProfiles: number;
  incompleteProfiles: number;
}

// 基本的なお知らせ統計情報（簡素化）
export interface AnnouncementStats {
  totalAnnouncements: number;
  activeAnnouncements: number;
  totalViews: number;
  averageViewsPerAnnouncement: number;
  mostViewedAnnouncement?: {
    id: string;
    title: string;
    viewCount: number;
  };
}