// src/types/admin.ts

// お知らせの型定義
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent' | 'maintenance';
  targetAudience: 'all' | 'guides' | 'guests';
  priority: number; // 1-5 (5が最高優先度)
  isUrgent: boolean;
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
  createdBy: string;
  createdByEmail: string;
  updatedAt?: any;
  updatedBy?: string;
  expiresAt?: any;
  viewCount: number;
  readCount: number;
}

// 新規お知らせ作成用の型
export interface CreateAnnouncementData {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent' | 'maintenance';
  targetAudience: 'all' | 'guides' | 'guests';
  priority: number;
  isUrgent: boolean;
  expiresAt?: Date;
}

// ユーザー統計情報
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

// お知らせ統計情報
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

// 分析用データ
export interface AnalyticsData {
  userStats: UserStats;
  announcementStats: AnnouncementStats;
  period: '7d' | '30d' | '90d';
  lastUpdated: Date;
}

// 管理者アクション履歴
export interface AdminAction {
  id: string;
  adminId: string;
  adminEmail: string;
  action: 'create_announcement' | 'update_announcement' | 'delete_announcement' | 'user_action';
  targetId?: string;
  metadata?: Record<string, any>;
  timestamp: any;
  ipAddress?: string;
}