"use client";

import { useState, useEffect } from "react";

export default function ProfilePage() {
  // 仮の初期プロフィール情報
  const [profile, setProfile] = useState({
    name: "",
    language: "",
    introduction: "",
  });

  // 変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  // 保存ボタン押下（仮）
  const handleSave = () => {
    alert("プロフィールを保存しました（まだ実装されていません）");
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">プロフィール編集</h1>

      <label className="block mb-4">
        <span className="block font-semibold mb-1">名前</span>
        <input
          type="text"
          name="name"
          value={profile.name}
          onChange={handleChange}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 山田 太郎"
        />
      </label>

      <label className="block mb-4">
        <span className="block font-semibold mb-1">話せる言語</span>
        <input
          type="text"
          name="language"
          value={profile.language}
          onChange={handleChange}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 日本語, 英語"
        />
      </label>

      <label className="block mb-6">
        <span className="block font-semibold mb-1">自己紹介</span>
        <textarea
          name="introduction"
          value={profile.introduction}
          onChange={handleChange}
          rows={4}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="自己紹介を入力してください"
        />
      </label>

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
      >
        保存する
      </button>
    </main>
  );
}
