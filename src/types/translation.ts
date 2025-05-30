// src/types/translation.ts
export type Language = 'ja' | 'en';

export interface TranslationKeys {
  // 共通
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    previous: string;
    confirm: string;
    close: string;
    search: string;
    filter: string;
    clear: string;
    submit: string;
    apply: string;
    reject: string;
    accept: string;
    pending: string;
    approved: string;
    rejected: string;
    active: string;
    closed: string;
    name: string;
    email: string;
    password: string;
    language: string;
    introduction: string;
    created: string;
    updated: string;
    status: string;
    message: string;
    date: string;
    time: string;
    budget: string;
    duration: string;
    areas: string;
    languages: string;
    required: string;
    optional: string;
    processing: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };

  // ナビゲーション
  nav: {
    guideSearch: string;
    guideRecruitment: string;
    chat: string;
    requestManagement: string;
    myPage: string;
    profile: string;
    settings: string;
    help: string;
    notice: string;
    logout: string;
  };

  // ユーザーロール
  roles: {
    guide: string;
    guest: string;
    guideDescription: string;
    guestDescription: string;
  };

  // 認証関連
  auth: {
    login: string;
    signup: string;
    logout: string;
    loginWithEmail: string;
    loginWithGoogle: string;
    signupWithEmail: string;
    signupWithGoogle: string;
    emailVerification: string;
    emailVerificationSent: string;
    emailVerificationRequired: string;
    accountActivation: string;
    activationComplete: string;
    activationError: string;
    resendVerification: string;
    checkStatus: string;
    refreshPage: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    forgotPassword: string;
  };

  // プロフィール関連
  profile: {
    guideProfile: string;
    guestProfile: string;
    profileEdit: string;
    profileView: string;
    profileComplete: string;
    profileIncomplete: string;
    supportedLanguages: string;
    supportedAreas: string;
    selfIntroduction: string;
    spokenLanguages: string;
    onboarding: string;
    welcome: string;
    chooseRole: string;
    setupProfile: string;
  };

  // ガイド検索
  guides: {
    guideList: string;
    guideDetail: string;
    filterByLanguage: string;
    filterByArea: string;
    clearFilters: string;
    sendRequest: string;
    requestSent: string;
    requestMessage: string;
    noGuidesFound: string;
    guidesFound: string;
  };

  // 投稿関連
  posts: {
    postList: string;
    createPost: string;
    postDetail: string;
    myPosts: string;
    guideRecruitment: string;
    title: string;
    description: string;
    preferredLanguages: string;
    preferredAreas: string;
    preferredDate: string;
    preferredTime: string;
    noPosts: string;
    createFirstPost: string;
    deletePost: string;
    postCreated: string;
    postDeleted: string;
    applyToPost: string;
    applicationSent: string;
    applicationMessage: string;
  };

  // リクエスト管理
  requests: {
    requestManagement: string;
    sentRequests: string;
    receivedRequests: string;
    matchingRequests: string;
    guideApplications: string;
    requestsToGuides: string;
    applicationsToRecruitment: string;
    requestsFromGuests: string;
    applicationsFromGuides: string;
    cancelRequest: string;
    cancelApplication: string;
    noSentRequests: string;
    noReceivedRequests: string;
    waitingForResponse: string;
    sentMessage: string;
  };

  // 設定
  settings: {
    settings: string;
    notifications: string;
    emailNotifications: string;
    pushNotifications: string;
    languageSettings: string;
    supportInfo: string;
    companyInfo: string;
    termsOfService: string;
    privacyPolicy: string;
    saveSettings: string;
    emailNotificationDesc: string;
    pushNotificationDesc: string;
  };

  // ヘルプ
  help: {
    help: string;
    howToUse: string;
    faq: string;
    withdrawal: string;
    howToUseAsGuide: string;
    howToUseAsGuest: string;
    profileSetup: string;
    searchGuides: string;
    createRecruitment: string;
    manageRequests: string;
    chatCommunication: string;
    applyToRecruitment: string;
    manageApplications: string;
    withdrawalPrecautions: string;
    startWithdrawal: string;
    contactSupport: string;
  };

  // お知らせ
  notice: {
    notice: string;
    noticeList: string;
    unread: string;
    markAsRead: string;
    systemMaintenance: string;
    newFeature: string;
    policyUpdate: string;
  };

  // エラーメッセージ
  errors: {
    loginFailed: string;
    signupFailed: string;
    networkError: string;
    invalidEmail: string;
    weakPassword: string;
    emailAlreadyInUse: string;
    userNotFound: string;
    wrongPassword: string;
    invalidCredential: string;
    tooManyRequests: string;
    userDisabled: string;
    popupClosed: string;
    popupBlocked: string;
    accountExistsWithDifferentCredential: string;
    emailNotVerified: string;
    activationError: string;
    saveError: string;
    loadError: string;
    deleteError: string;
    updateError: string;
    sendError: string;
    validationError: string;
    requiredField: string;
    selectAtLeastOne: string;
  };

  // 成功メッセージ
  success: {
    loginSuccess: string;
    signupSuccess: string;
    profileSaved: string;
    settingsSaved: string;
    requestSent: string;
    applicationSent: string;
    statusUpdated: string;
    emailSent: string;
    postCreated: string;
    postDeleted: string;
    requestCanceled: string;
    applicationCanceled: string;
  };

  // チャット
  chat: {
    chat: string;
    chatList: string;
    newMessage: string;
    sendMessage: string;
    noChats: string;
    startChat: string;
    messageHistory: string;
    typing: string;
    online: string;
    offline: string;
  };
}

// 翻訳コンテキストで使用される拡張型
export interface TranslationContextType {
  language: Language;
  t: TranslationKeys;
  isJapanese: boolean;
  isEnglish: boolean;
}