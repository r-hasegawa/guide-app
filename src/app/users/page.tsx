"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  languages: string[];
  rating: number; // レーティング（仮）
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  // 仮のユーザーデータフェッチ
  useEffect(() => {
    // ここはFirebaseなどから取る想定
    const fetchedUsers: User[] = [
      { id: "1", name: "Yamada Taro", languages: ["日本語", "英語"], rating: 4.5 },
      { id: "2", name: "John Smith", languages: ["英語"], rating: 4.0 },
      { id: "3", name: "Kim Minseo", languages: ["韓国語", "英語"], rating: 4.7 },
    ];
    setUsers(fetchedUsers);
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">ユーザー一覧</h1>
      <ul className="space-y-4">
        {users.map((user) => (
          <li key={user.id} className="p-4 border rounded shadow-sm hover:shadow-md transition cursor-pointer">
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p>話せる言語: {user.languages.join(", ")}</p>
            <p>評価: {user.rating} / 5.0</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
