'use client';

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/firebaseConfig";
import { 
  getRequestsForGuide, 
  getRequestsForGuest,
  updateRequestStatus, 
  cancelMatchingRequest,
  getApplicationsForGuest,
  getApplicationsForGuide,
  updateApplicationStatus,
  cancelGuideApplication,
  getUserBasicInfo,
  MatchingRequest,
  GuideApplication,
  RequestStatus 
} from "@/firebase/firestore";

export default function RequestPage() {
  const [user, loading] = useAuthState(auth);
  
  // マッチングリクエスト（観光客→ガイド）
  const [sentMatchingRequests, setSentMatchingRequests] = useState<MatchingRequest[]>([]);
  const [receivedMatchingRequests, setReceivedMatchingRequests] = useState<MatchingRequest[]>([]);
  
  // ガイド応募（ガイド→観光客の募集）
  const [sentApplications, setSentApplications] = useState<GuideApplication[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<GuideApplication[]>([]);
  
  const [userRole, setUserRole] = useState<'guide' | 'guest' | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [updatingRequest, setUpdatingRequest] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('received');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setPageLoading(false);
        return;
      }

      try {
        // ユーザーの役割を取得
        const userInfo = await getUserBasicInfo(user.uid);
        if (!userInfo) {
          setPageLoading(false);
          return;
        }
        
        setUserRole(userInfo.role);

        if (userInfo.role === 'guide') {
          // ガイドの場合
          // 受信：観光客からのマッチングリクエスト
          const receivedMatchingData = await getRequestsForGuide(user.uid);
          setReceivedMatchingRequests(receivedMatchingData || []);
          
          // 送信：募集投稿への応募
          const sentApplicationsData = await getApplicationsForGuide(user.uid);
          setSentApplications(sentApplicationsData || []);
          
          setActiveTab('received');
        } else if (userInfo.role === 'guest') {
          // 観光客（ゲスト）の場合
          // 送信：ガイドへのマッチングリクエスト
          const sentMatchingData = await getRequestsForGuest(user.uid);
          setSentMatchingRequests(sentMatchingData || []);
          
          // 受信：募集投稿への応募
          const receivedApplicationsData = await getApplicationsForGuest(user.uid);
          setReceivedApplications(receivedApplicationsData || []);
          
          setActiveTab('sent');
        }
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
      } finally {
        setPageLoading(false);
      }
    };

    if (!loading) {
      fetchData();
    }
  }, [user, loading]);

  // マッチングリクエストのステータス更新
  const handleMatchingRequestStatusUpdate = async (requestId: string, status: RequestStatus) => {
    setUpdatingRequest(requestId);
    try {
      await updateRequestStatus(requestId, status);
      
      setReceivedMatchingRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status, updatedAt: new Date().toISOString() }
            : req
        )
      );
    } catch (error) {
      console.error("ステータスの更新に失敗しました:", error);
      alert("ステータスの更新に失敗しました。もう一度お試しください。");
    } finally {
      setUpdatingRequest(null);
    }
  };

  // マッチングリクエストの取り消し
  const handleCancelMatchingRequest = async (requestId: string) => {
    if (!confirm("リクエストを取り消しますか？")) {
      return;
    }

    setUpdatingRequest(requestId);
    try {
      await cancelMatchingRequest(requestId);
      setSentMatchingRequests(prev => prev.filter(req => req.id !== requestId));
      alert("リクエストを取り消しました。");
    } catch (error) {
      console.error("リクエストの取り消しに失敗しました:", error);
      alert("リクエストの取り消しに失敗しました。もう一度お試しください。");
    } finally {
      setUpdatingRequest(null);
    }
  };

  // ガイド応募のステータス更新
  const handleApplicationStatusUpdate = async (applicationId: string, status: RequestStatus) => {
    setUpdatingRequest(applicationId);
    try {
      await updateApplicationStatus(applicationId, status);
      
      setReceivedApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status, updatedAt: new Date().toISOString() }
            : app
        )
      );
    } catch (error) {
      console.error("ステータスの更新に失敗しました:", error);
      alert("ステータスの更新に失敗しました。もう一度お試しください。");
    } finally {
      setUpdatingRequest(null);
    }
  };

  // ガイド応募の取り消し
  const handleCancelApplication = async (applicationId: string) => {
    if (!confirm("応募を取り消しますか？")) {
      return;
    }

    setUpdatingRequest(applicationId);
    try {
      await cancelGuideApplication(applicationId);
      setSentApplications(prev => prev.filter(app => app.id !== applicationId));
      alert("応募を取り消しました。");
    } catch (error) {
      console.error("応募の取り消しに失敗しました:", error);
      alert("応募の取り消しに失敗しました。もう一度お試しください。");
    } finally {
      setUpdatingRequest(null);
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">待機中</span>;
      case 'accepted':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">承認済み</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">拒否済み</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">不明</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 送信した項目の総数を計算
  const getSentCount = () => {
    return sentMatchingRequests.length + sentApplications.length;
  };

  // 受信した項目の総数を計算
  const getReceivedCount = () => {
    return receivedMatchingRequests.length + receivedApplications.length;
  };

  if (loading || pageLoading) {
    return <div className="text-center py-10">読み込み中...</div>;
  }

  if (!user || !userRole) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">📩 申請管理</h1>
        <p>ログインしてください。</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📩 申請管理</h1>
      
      {/* タブ切り替え */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('sent')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'sent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              送信した申請 ({getSentCount()})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'received'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              受信した申請 ({getReceivedCount()})
            </button>
          </nav>
        </div>
      </div>

      {/* 送信した申請 */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">送信した申請</h2>
          
          {getSentCount() === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>送信した申請はありません</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* マッチングリクエスト（観光客→ガイド） */}
              {sentMatchingRequests.length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-3">ガイドへのリクエスト</h3>
                  <div className="space-y-4">
                    {sentMatchingRequests.map((request) => (
                      <div key={request.id} className="bg-white border rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold">{request.guideName}さんへのリクエスト</h4>
                            <p className="text-sm text-gray-500">{formatDate(request.createdAt)}</p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">送信したメッセージ:</h5>
                          <p className="text-gray-800 bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                            {request.message}
                          </p>
                        </div>

                        {request.status === 'pending' && (
                          <button
                            onClick={() => handleCancelMatchingRequest(request.id)}
                            disabled={updatingRequest === request.id}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                          >
                            {updatingRequest === request.id ? "処理中..." : "リクエストを取り消す"}
                          </button>
                        )}

                        {request.status !== 'pending' && (
                          <div className="text-sm text-gray-600">
                            {formatDate(request.updatedAt)} に{request.status === 'accepted' ? '承認' : '拒否'}されました
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ガイド応募（ガイド→観光客の募集） */}
              {sentApplications.length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-3">募集への応募</h3>
                  <div className="space-y-4">
                    {sentApplications.map((application) => (
                      <div key={application.id} className="bg-white border rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold">{application.guestName}さんの募集への応募</h4>
                            <p className="text-sm text-gray-500">{formatDate(application.createdAt)}</p>
                          </div>
                          {getStatusBadge(application.status)}
                        </div>

                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">送信したメッセージ:</h5>
                          <p className="text-gray-800 bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                            {application.message}
                          </p>
                        </div>

                        {application.status === 'pending' && (
                          <button
                            onClick={() => handleCancelApplication(application.id)}
                            disabled={updatingRequest === application.id}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                          >
                            {updatingRequest === application.id ? "処理中..." : "応募を取り消す"}
                          </button>
                        )}

                        {application.status !== 'pending' && (
                          <div className="text-sm text-gray-600">
                            {formatDate(application.updatedAt)} に{application.status === 'accepted' ? '承認' : '拒否'}されました
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 受信した申請 */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">受信した申請</h2>
          
          {getReceivedCount() === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>受信した申請はありません</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* マッチングリクエスト（観光客→ガイド） */}
              {receivedMatchingRequests.length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-3">観光客からのリクエスト</h3>
                  <div className="space-y-4">
                    {receivedMatchingRequests.map((request) => (
                      <div key={request.id} className="bg-white border rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold">{request.guestName}さんからのリクエスト</h4>
                            <p className="text-sm text-gray-500">{formatDate(request.createdAt)}</p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">メッセージ:</h5>
                          <p className="text-gray-800 bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                            {request.message}
                          </p>
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleMatchingRequestStatusUpdate(request.id, 'accepted')}
                              disabled={updatingRequest === request.id}
                              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                            >
                              {updatingRequest === request.id ? "処理中..." : "承認"}
                            </button>
                            <button
                              onClick={() => handleMatchingRequestStatusUpdate(request.id, 'rejected')}
                              disabled={updatingRequest === request.id}
                              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                            >
                              {updatingRequest === request.id ? "処理中..." : "拒否"}
                            </button>
                          </div>
                        )}

                        {request.status !== 'pending' && (
                          <div className="text-sm text-gray-600">
                            {formatDate(request.updatedAt)} に{request.status === 'accepted' ? '承認' : '拒否'}しました
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ガイド応募（ガイド→観光客の募集） */}
              {receivedApplications.length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-3">募集への応募</h3>
                  <div className="space-y-4">
                    {receivedApplications.map((application) => (
                      <div key={application.id} className="bg-white border rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold">{application.guideName}さんからの応募</h4>
                            <p className="text-sm text-gray-500">{formatDate(application.createdAt)}</p>
                          </div>
                          {getStatusBadge(application.status)}
                        </div>

                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">メッセージ:</h5>
                          <p className="text-gray-800 bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                            {application.message}
                          </p>
                        </div>

                        {application.status === 'pending' && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleApplicationStatusUpdate(application.id, 'accepted')}
                              disabled={updatingRequest === application.id}
                              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                            >
                              {updatingRequest === application.id ? "処理中..." : "承認"}
                            </button>
                            <button
                              onClick={() => handleApplicationStatusUpdate(application.id, 'rejected')}
                              disabled={updatingRequest === application.id}
                              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                            >
                              {updatingRequest === application.id ? "処理中..." : "拒否"}
                            </button>
                          </div>
                        )}

                        {application.status !== 'pending' && (
                          <div className="text-sm text-gray-600">
                            {formatDate(application.updatedAt)} に{application.status === 'accepted' ? '承認' : '拒否'}しました
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}