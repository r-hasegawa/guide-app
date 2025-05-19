"use client";

import { useState } from "react";

export default function MatchPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // マッチ申請送信（仮）
  const sendMatchRequest = () => {
    if (!selectedUserId) {
      alert("ユーザーを選択してください");
      return;
    }
    alert(`ユーザーID: ${selectedUserId} にマッチ申請を送りました（まだ実装されていません）`);
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">マッチ申請</h1>

      <label className="block mb-4">
        <span className="block font-semibold mb-1">マッチ申請するユーザーIDを入力</span>
        <input
          type="text"
          value={selectedUserId ?? ""}
          onChange={(e) => setSelectedUserId(e.target.value)}
          placeholder="ユーザーIDを入力"
          className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </label>

      <label className="block mb-6">
        <span className="block font-semibold mb-1">メッセージ（任意）</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="挨拶や希望を入力してください"
        />
      </label>

      <button
        onClick={sendMatchRequest}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
      >
        マッチ申請を送る
      </button>
    </main>
  );
}
