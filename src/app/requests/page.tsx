// src/app/requests/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { useTranslation } from "@/contexts/TranslationContext";
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
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const { t, isJapanese } = useTranslation();
  
  // マッチングリクエスト（観光客→ガイド）
  const [sentMatchingRequests, setSentMatchingRequests] = useState<MatchingRequest[]>([]);
  const [receivedMatchingRequests, setReceivedMatchingRequests] = useState<MatchingRequest[]>([]);
  
  // ガイド応募（ガイド→観光客の募集）
  const [sentApplications, setSentApplications] = useState<GuideApplication[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<GuideApplication[]>([]);
  
  const [userRole, setUserRole] = useState<'guide' | 'guest' | 'admin' | null>(null); // admin追加
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

        // 管理者は投稿機能にアクセスできない
        if (userInfo.role === 'admin') {
          router.replace('/admin');
          return;
        }

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
      alert(t.errors.updateError);
    } finally {
      setUpdatingRequest(null);
    }
  };

  // マッチングリクエストの取り消し
  const handleCancelMatchingRequest = async (requestId: string) => {
    const confirmMessage = isJapanese ? 'リクエストを取り消しますか？' : 'Are you sure you want to cancel this request?';
    if (!confirm(confirmMessage)) {
      return;
    }

    setUpdatingRequest(requestId);
    try {
      await cancelMatchingRequest(requestId);
      setSentMatchingRequests(prev => prev.filter(req => req.id !== requestId));
      alert(t.success.requestCanceled);
    } catch (error) {
      console.error("リクエストの取り消しに失敗しました:", error);
      alert(t.errors.updateError);
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
      alert(t.errors.updateError);
    } finally {
      setUpdatingRequest(null);
    }
  };

  // ガイド応募の取り消し
  const handleCancelApplication = async (applicationId: string) => {
    const confirmMessage = isJapanese ? '応募を取り消しますか？' : 'Are you sure you want to cancel this application?';
    if (!confirm(confirmMessage)) {
      return;
    }

    setUpdatingRequest(applicationId);
    try {
      await cancelGuideApplication(applicationId);
      setSentApplications(prev => prev.filter(app => app.id !== applicationId));
      alert(t.success.applicationCanceled);
    } catch (error) {
      console.error("応募の取り消しに失敗しました:", error);
      alert(t.errors.updateError);
    } finally {
      setUpdatingRequest(null);
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">{t.common.pending}</span>;
      case 'accepted':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{t.common.approved}</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">{t.common.rejected}</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
          {isJapanese ? '不明' : 'Unknown'}
        </span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US', {
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
    return <div className="text-center py-10">{t.common.loading}</div>;
  }

  if (!user || !userRole) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">📩 {t.requests.requestManagement}</h1>
        <p>{isJapanese ? 'ログインしてください。' : 'Please log in.'}</p>
      </div>
    );
  }

  // 管理者の場合は何も表示しない（既にリダイレクト済み）
  if (userRole === 'admin') {
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📩 {t.requests.requestManagement}</h1>
      
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
              {t.requests.sentRequests} ({getSentCount()})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'received'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              {t.requests.receivedRequests} ({getReceivedCount()})
            </button>
          </nav>
        </div>
      </div>

      {/* 送信した申請 */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t.requests.sentRequests}</h2>
          
          {getSentCount() === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>{t.requests.noSentRequests}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* マッチングリクエスト（観光客→ガイド） */}
              {sentMatchingRequests.length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-3">{t.requests.requestsToGuides}</h3>
                  <div className="space-y-4">
                    {sentMatchingRequests.map((request) => (
                      <div key={request.id} className="bg-white border rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold">
                              {isJapanese ? `${request.guideName}さんへのリクエスト` : `Request to ${request.guideName}`}
                            </h4>
                            <p className="text-sm text-gray-500">{formatDate(request.createdAt)}</p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">{t.requests.sentMessage}:</h5>
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
                            {updatingRequest === request.id ? t.common.processing : t.requests.cancelRequest}
                          </button>
                        )}

                        {request.status !== 'pending' && (
                          <div className="text-sm text-gray-600">
                            {formatDate(request.updatedAt)} {isJapanese ? 'に' : ''}{request.status === 'accepted' ? t.common.approved : t.common.rejected}{isJapanese ? 'されました' : ''}
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
                  <h3 className="text-md font-medium mb-3">{t.requests.applicationsToRecruitment}</h3>
                  <div className="space-y-4">
                    {sentApplications.map((application) => (
                      <div key={application.id} className="bg-white border rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold">
                              {isJapanese ? `${application.guestName}さんの募集への応募` : `Application to ${application.guestName}'s job`}
                            </h4>
                            <p className="text-sm text-gray-500">{formatDate(application.createdAt)}</p>
                          </div>
                          {getStatusBadge(application.status)}
                        </div>

                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">{t.requests.sentMessage}:</h5>
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
                            {updatingRequest === application.id ? t.common.processing : t.requests.cancelApplication}
                          </button>
                        )}

                        {application.status !== 'pending' && (
                          <div className="text-sm text-gray-600">
                            {formatDate(application.updatedAt)} {isJapanese ? 'に' : ''}{application.status === 'accepted' ? t.common.approved : t.common.rejected}{isJapanese ? 'されました' : ''}
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
          <h2 className="text-lg font-semibold">{t.requests.receivedRequests}</h2>
          
          {getReceivedCount() === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>{t.requests.noReceivedRequests}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* マッチングリクエスト（観光客→ガイド） */}
              {receivedMatchingRequests.length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-3">{t.requests.requestsFromGuests}</h3>
                  <div className="space-y-4">
                    {receivedMatchingRequests.map((request) => (
                      <div key={request.id} className="bg-white border rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold">
                              {isJapanese ? `${request.guestName}さんからのリクエスト` : `Request from ${request.guestName}`}
                            </h4>
                            <p className="text-sm text-gray-500">{formatDate(request.createdAt)}</p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">{t.common.message}:</h5>
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
                              {updatingRequest === request.id ? t.common.processing : t.common.accept}
                            </button>
                            <button
                              onClick={() => handleMatchingRequestStatusUpdate(request.id, 'rejected')}
                              disabled={updatingRequest === request.id}
                              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                            >
                              {updatingRequest === request.id ? t.common.processing : t.common.reject}
                            </button>
                          </div>
                        )}

                        {request.status !== 'pending' && (
                          <div className="text-sm text-gray-600">
                            {formatDate(request.updatedAt)} {isJapanese ? 'に' : ''}{request.status === 'accepted' ? t.common.approved : t.common.rejected}{isJapanese ? 'しました' : ''}
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
                  <h3 className="text-md font-medium mb-3">{t.requests.applicationsFromGuides}</h3>
                  <div className="space-y-4">
                    {receivedApplications.map((application) => (
                      <div key={application.id} className="bg-white border rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold">
                              {isJapanese ? `${application.guideName}さんからの応募` : `Application from ${application.guideName}`}
                            </h4>
                            <p className="text-sm text-gray-500">{formatDate(application.createdAt)}</p>
                          </div>
                          {getStatusBadge(application.status)}
                        </div>

                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">{t.common.message}:</h5>
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
                              {updatingRequest === application.id ? t.common.processing : t.common.accept}
                            </button>
                            <button
                              onClick={() => handleApplicationStatusUpdate(application.id, 'rejected')}
                              disabled={updatingRequest === application.id}
                              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                            >
                              {updatingRequest === application.id ? t.common.processing : t.common.reject}
                            </button>
                          </div>
                        )}

                        {application.status !== 'pending' && (
                          <div className="text-sm text-gray-600">
                            {formatDate(application.updatedAt)} {isJapanese ? 'に' : ''}{application.status === 'accepted' ? t.common.approved : t.common.rejected}{isJapanese ? 'しました' : ''}
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