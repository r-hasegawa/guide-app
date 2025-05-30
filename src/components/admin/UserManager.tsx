// src/components/admin/UserManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  getAllUsers,
  updateUserActivatedStatus,
  updateUserRole,
  UserBasicInfo 
} from '@/firebase/firestore';

export default function UserManager() {
  const { user } = useAuthContext();
  const [users, setUsers] = useState<(UserBasicInfo & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // ユーザー一覧を取得
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers();
      setUsers(result);
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ユーザーのactivated状態を変更
  const handleToggleUserActivated = async (userId: string, currentStatus: boolean) => {
    if (!user) return;
    
    const newStatus = !currentStatus;
    const confirmMessage = `ユーザーのactivated状態を${newStatus ? 'true' : 'false'}に変更しますか？`;
    if (!confirm(confirmMessage)) return;

    setUpdatingUser(userId);
    try {
      await updateUserActivatedStatus(userId, newStatus);
      
      // ユーザーリストを更新
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, activated: newStatus } : u
      ));
      
      alert('ユーザーのactivated状態を更新しました');
    } catch (error) {
      console.error('activated状態更新エラー:', error);
      alert('activated状態の更新に失敗しました');
    } finally {
      setUpdatingUser(null);
    }
  };

  // ユーザーのロールを変更
  const handleChangeUserRole = async (userId: string, newRole: 'guide' | 'guest' | 'admin') => {
    if (!user) return;
    
    const confirmMessage = `ユーザーのロールを${newRole}に変更しますか？`;
    if (!confirm(confirmMessage)) return;

    setUpdatingUser(userId);
    try {
      await updateUserRole(userId, newRole);
      
      // ユーザーリストを更新
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      alert('ユーザーのロールを更新しました');
    } catch (error) {
      console.error('ロール更新エラー:', error);
      alert('ロールの更新に失敗しました');
    } finally {
      setUpdatingUser(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'guide': return 'bg-blue-100 text-blue-800';
      case 'guest': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">👥 ユーザー管理</h2>
        <button
          onClick={fetchUsers}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          リフレッシュ
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">読み込み中...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <div className="text-6xl mb-4">👤</div>
          <p>ユーザーがいません</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ロール
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    言語・通知(Mail/Push)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {userData.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {userData.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={userData.role || ''}
                        onChange={(e) => handleChangeUserRole(userData.id, e.target.value as any)}
                        disabled={updatingUser === userData.id}
                        className={`text-sm px-2 py-1 rounded-full border ${getRoleBadgeColor(userData.role)} ${
                          updatingUser === userData.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <option value="">未設定</option>
                        <option value="guide">ガイド</option>
                        <option value="guest">観光客</option>
                        <option value="admin">管理者</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userData.profileCompleted 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {userData.profileCompleted ? '✅ 完了' : '📝 未完了'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleUserActivated(userData.id, userData.activated)}
                            disabled={updatingUser === userData.id}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition ${
                              userData.activated 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            } ${updatingUser === userData.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {updatingUser === userData.id ? '🔄' : (userData.activated ? '🟢' : '🔴')} 
                            {userData.activated ? ' Activated' : ' Deactivated'}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userData.createdAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          userData.language === 'ja' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {userData.language === 'ja' ? '🇯🇵' : '🇺🇸'}
                        </span>
                        {userData.notifications && (
                          <span className={`px-2 py-1 text-xs rounded ${
                            userData.notifications.email
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {userData.notifications.email ? '✉️' : '❌'}
                          </span>         
                        )}
                        {userData.notifications && (
                          <span className={`px-2 py-1 text-xs rounded ${
                            userData.notifications.push
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {userData.notifications.push ? '🔔' : '🔕'}
                          </span>         
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}