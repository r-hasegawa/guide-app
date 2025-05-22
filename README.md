This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## ページ構成
```bash
src/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                  // トップページ（未ログイン用）
│   ├── login/                    // ログインページ
│   │   └── page.tsx
│   ├── signup/                   // サインアップ（ロールで分岐）
│   │   └── page.tsx
│   ├── guides/                   // ガイド一覧（観光客が見る）
│   │   └── page.tsx
│   ├── posts/                    // 観光客の募集投稿関連
│   │   ├── new/                  // 募集作成
│   │   │   └── page.tsx
│   │   └── page.tsx              // 募集一覧（学生が見る）
│   ├── chat/                     // マッチ後のチャット機能
│   │   ├── [chatId]/             // 個別チャット画面
│   │   │   └── page.tsx
│   │   └── page.tsx              // チャット一覧
│   ├── request/                  // マッチング申請一覧（承認 or 拒否）
│   │   └── page.tsx
│   ├── mypage/                   // マイページ（共通）
│   │   ├── page.tsx              // マイページトップ（リンク集など）
│   │   ├── profile/              // プロフィール表示・編集
│   │   │   ├── page.tsx
│   │   │   └── edit/             // プロフィール編集
│   │   │       └── page.tsx
│   │   └── setting/              // アカウント設定（言語など）
│   │       └── page.tsx

```

## Database構成
```bash
├── users（全ユーザーの認証関連情報）
│   └─ {uid}
│       ├─ role: "student" or "guest"
│       ├─ email: string
│       └─ createdAt: timestamp

├── profiles（各ユーザーのプロフィール）
│   └─ {uid}
│       ├─ name: string
│       ├─ bio: string
│       ├─ photoURL: string
│       ├─ languages: [string]         // 学生向け（話せる言語）
│       ├─ area: [string]              // 学生向け（対応エリア）
│       └─ rating: number              // 学生向け（評価、今後追加）

├── posts（観光客による募集）
│   └─ {postId}
│       ├─ guestId: string             // uid
│       ├─ title: string
│       ├─ description: string
│       ├─ location: string
│       ├─ date: timestamp
│       ├─ duration: number            // 拘束時間（時間単位）
│       ├─ reward: number              // 想定報酬（円）
│       ├─ language: [string]          // 希望言語
│       ├─ createdAt: timestamp
│       └─ status: "open" | "matched" | "closed"

├── matches（マッチング情報）
│   └─ {matchId}
│       ├─ postId: string
│       ├─ guestId: string
│       ├─ studentId: string
│       ├─ status: "pending" | "accepted" | "rejected" | "completed"
│       ├─ createdAt: timestamp
│       └─ updatedAt: timestamp

├── messages（チャット履歴）
│   └─ {matchId}
│       └─ {messageId}
│           ├─ senderId: string
│           ├─ text: string
│           ├─ timestamp: timestamp
│           └─ read: boolean
```

