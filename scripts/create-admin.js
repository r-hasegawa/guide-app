// scripts/create-admin.js
const admin = require('firebase-admin');
const path = require('path');

// 環境変数を読み込み（.envファイルから）
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

console.log('🚀 Firebase Admin User Creation Script');
console.log('=====================================');

// 必須環境変数の検証
function validateEnvironmentVariables() {
  const requiredVars = {
    'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
    'FIREBASE_PRIVATE_KEY_ID': process.env.FIREBASE_PRIVATE_KEY_ID,
    'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY,
    'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
    'FIREBASE_CLIENT_ID': process.env.FIREBASE_CLIENT_ID
  };

  console.log('🔍 Checking environment variables...');
  
  const missing = [];
  const present = [];

  for (const [varName, value] of Object.entries(requiredVars)) {
    if (!value) {
      missing.push(varName);
    } else {
      present.push(varName);
      // PRIVATE_KEYは内容を表示しない
      if (varName === 'FIREBASE_PRIVATE_KEY') {
        console.log(`✅ ${varName}: [PRESENT - ${value.length} characters]`);
      } else {
        console.log(`✅ ${varName}: ${value}`);
      }
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    
    console.error('\n💡 Solution:');
    console.error('1. Create .env.local file in your project root');
    console.error('2. Add the following variables to .env.local:');
    console.error('');
    console.error('# Firebase Admin SDK Configuration');
    console.error('FIREBASE_PROJECT_ID=your-project-id');
    console.error('FIREBASE_PRIVATE_KEY_ID=your-private-key-id');
    console.error('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n"');
    console.error('FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com');
    console.error('FIREBASE_CLIENT_ID=123456789012345678901');
    console.error('');
    console.error('📋 How to get these values:');
    console.error('1. Go to Firebase Console → Project Settings → Service Accounts');
    console.error('2. Click "Generate new private key"');
    console.error('3. Download the JSON file');
    console.error('4. Copy values from the JSON to your .env.local file');
    console.error('');
    
    process.exit(1);
  }

  console.log('✅ All environment variables are present');
  return requiredVars;
}

// Firebase Admin SDK を初期化
function initializeFirebase(config) {
  try {
    console.log('\n🔧 Initializing Firebase Admin SDK...');
    
    // 既に初期化されている場合はスキップ
    if (admin.apps.length > 0) {
      console.log('ℹ️  Firebase Admin SDK already initialized');
      return;
    }

    const serviceAccount = {
      type: "service_account",
      project_id: config.FIREBASE_PROJECT_ID,
      private_key_id: config.FIREBASE_PRIVATE_KEY_ID,
      private_key: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: config.FIREBASE_CLIENT_EMAIL,
      client_id: config.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${config.FIREBASE_CLIENT_EMAIL}`
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${config.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    console.error('\n💡 Common issues:');
    console.error('- Check if FIREBASE_PRIVATE_KEY contains valid key format');
    console.error('- Ensure all environment variables are correctly set');
    console.error('- Verify Firebase project ID is correct');
    throw error;
  }
}

// 管理者ユーザーを作成
async function createAdminUser(email, password, permissions = []) {
  try {
    console.log('\n👤 Creating admin user...');
    console.log(`📧 Email: ${email}`);

    // 入力値の検証
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }

    // Firebase Auth でユーザー作成
    console.log('1️⃣ Creating Firebase Auth user...');
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: true
    });

    console.log(`✅ Firebase Auth user created: ${userRecord.uid}`);

    // デフォルト権限の設定
    const defaultPermissions = permissions.length > 0 ? permissions : [
      'announcements:create',
      'announcements:read',
      'announcements:update',
      'announcements:delete',
      'analytics:read',
      'users:read'
    ];

    // カスタムクレームで管理者権限を設定
    console.log('2️⃣ Setting admin permissions...');
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true,
      permissions: defaultPermissions,
      role: 'admin',
      createdAt: new Date().toISOString()
    });

    console.log('✅ Admin permissions set');
    console.log(`🔑 Permissions: ${defaultPermissions.join(', ')}`);

    // Firestore にプロフィール作成
    console.log('3️⃣ Creating Firestore profile...');
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      activated: true,
      profileCompleted: true,
      language: 'ja',
      notifications: {
        email: true,
        push: true
      },
      adminMetadata: {
        permissions: defaultPermissions,
        createdBy: 'system',
        isActive: true
      }
    });

    console.log('✅ Firestore profile created');

    // 管理者アクションログを記録
    console.log('4️⃣ Recording admin action log...');
    await admin.firestore().collection('admin_audit_logs').add({
      adminId: userRecord.uid,
      adminEmail: email,
      action: 'admin_user_created',
      metadata: {
        permissions: defaultPermissions,
        createdBy: 'system'
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: null
    });

    console.log('✅ Admin action logged');

    // 成功メッセージ
    console.log('\n🎉 Admin user created successfully!');
    console.log('=====================================');
    console.log(`👤 UID: ${userRecord.uid}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Password: ${password}`);
    console.log(`🔑 Permissions: ${defaultPermissions.join(', ')}`);
    console.log('=====================================');
    console.log('\n📋 Next steps:');
    console.log('1. Start your application: npm run dev');
    console.log('2. Access admin panel: http://localhost:3000/admin');
    console.log('3. Login with the credentials above');
    console.log('4. Deploy Security Rules: firebase deploy --only firestore:rules');
    console.log('\n⚠️  Store credentials securely!');

    return userRecord;

  } catch (error) {
    console.error('\n❌ Admin user creation failed:', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      console.error('\n💡 Solution:');
      console.error('- Use a different email address');
      console.error('- Or update existing user with: npm run create-admin update <uid>');
    } else if (error.code === 'auth/invalid-email') {
      console.error('\n💡 Solution:');
      console.error('- Use a valid email address format');
    } else if (error.code === 'auth/weak-password') {
      console.error('\n💡 Solution:');
      console.error('- Use a password with at least 6 characters');
    }

    throw error;
  }
}

// 既存ユーザーに管理者権限を付与
async function updateAdminUser(uid, permissions = []) {
  try {
    console.log(`\n🔄 Updating user ${uid} with admin permissions...`);

    // ユーザーの存在確認
    const userRecord = await admin.auth().getUser(uid);
    console.log(`✅ User found: ${userRecord.email}`);

    const defaultPermissions = permissions.length > 0 ? permissions : [
      'announcements:create',
      'announcements:read',
      'announcements:update',
      'announcements:delete',
      'analytics:read',
      'users:read'
    ];

    // カスタムクレーム更新
    console.log('1️⃣ Updating custom claims...');
    await admin.auth().setCustomUserClaims(uid, {
      admin: true,
      permissions: defaultPermissions,
      role: 'admin',
      updatedAt: new Date().toISOString()
    });

    // Firestore プロフィール更新
    console.log('2️⃣ Updating Firestore profile...');
    await admin.firestore().collection('users').doc(uid).update({
      role: 'admin',
      adminMetadata: {
        permissions: defaultPermissions,
        updatedBy: 'system',
        isActive: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });

    console.log('✅ Admin permissions granted successfully');
    console.log(`🔑 Permissions: ${defaultPermissions.join(', ')}`);

  } catch (error) {
    console.error('❌ Failed to update admin permissions:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.error('\n💡 Solution:');
      console.error('- Check if the UID is correct');
      console.error('- Ensure the user exists in Firebase Auth');
    }
    
    throw error;
  }
}

// 管理者権限を削除
async function removeAdminUser(uid) {
  try {
    console.log(`\n🗑️  Removing admin permissions from user ${uid}...`);

    // ユーザーの存在確認
    const userRecord = await admin.auth().getUser(uid);
    console.log(`✅ User found: ${userRecord.email}`);

    // カスタムクレーム削除
    console.log('1️⃣ Removing custom claims...');
    await admin.auth().setCustomUserClaims(uid, {
      admin: false,
      permissions: [],
      role: 'user',
      removedAt: new Date().toISOString()
    });

    // Firestore プロフィール更新
    console.log('2️⃣ Updating Firestore profile...');
    await admin.firestore().collection('users').doc(uid).update({
      role: 'guest', // デフォルトロールに戻す
      adminMetadata: {
        isActive: false,
        removedBy: 'system',
        removedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });

    console.log('✅ Admin permissions removed successfully');

  } catch (error) {
    console.error('❌ Failed to remove admin permissions:', error.message);
    throw error;
  }
}

// メイン実行関数
async function main() {
  try {
    // 環境変数の検証
    const config = validateEnvironmentVariables();
    
    // Firebase初期化
    initializeFirebase(config);

    // コマンドライン引数の処理
    const command = process.argv[2];
    const arg1 = process.argv[3];
    const arg2 = process.argv[4];

    switch (command) {
      case 'create':
        if (!arg1 || !arg2) {
          console.error('❌ Usage: npm run create-admin create <email> <password>');
          console.error('   Example: npm run create-admin create admin@example.com password123');
          process.exit(1);
        }
        await createAdminUser(arg1, arg2);
        break;

      case 'update':
        if (!arg1) {
          console.error('❌ Usage: npm run create-admin update <uid>');
          console.error('   Example: npm run create-admin update abc123def456');
          process.exit(1);
        }
        await updateAdminUser(arg1);
        break;

      case 'remove':
        if (!arg1) {
          console.error('❌ Usage: npm run create-admin remove <uid>');
          console.error('   Example: npm run create-admin remove abc123def456');
          process.exit(1);
        }
        await removeAdminUser(arg1);
        break;

      default:
        console.log('\n📋 Firebase Admin User Management');
        console.log('Usage:');
        console.log('  Create admin:  npm run create-admin create <email> <password>');
        console.log('  Update admin:  npm run create-admin update <uid>');
        console.log('  Remove admin:  npm run create-admin remove <uid>');
        console.log('');
        console.log('Examples:');
        console.log('  npm run create-admin create admin@company.com strongPassword123');
        console.log('  npm run create-admin update abc123def456');
        console.log('  npm run create-admin remove abc123def456');
        process.exit(1);
    }

    console.log('\n✅ Operation completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('\n💥 Operation failed:', error.message);
    console.error('\n🔍 Debug info:');
    console.error('- Check your .env.local file');
    console.error('- Verify Firebase project settings');
    console.error('- Ensure you have admin permissions');
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain関数を実行
if (require.main === module) {
  main();
}

module.exports = {
  createAdminUser,
  updateAdminUser,
  removeAdminUser,
  validateEnvironmentVariables,
  initializeFirebase
};