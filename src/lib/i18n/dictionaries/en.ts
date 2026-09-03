// English is the SHAPE of every dictionary: `Dictionary = typeof en`, so a missing
// key in any other language is a TypeScript error rather than a blank space that
// only a speaker of that language would ever notice.
//
// Life shipped with TWO languages while the rest of the fleet carried twelve — on
// the most personal app on the platform, where people write their own goals in
// their own words. All twelve are generated from one table so they cannot drift.
export const en = {
  common: {
    appName:  'TEC',
    tagline:  'The Elite Consortium',
    login:    'Sign in with Pi',
    logout:   'Logout',
    loading:  'Loading...',
    comingSoon: 'Coming Soon',
    live:     'Live',
  },
  dashboard: {
    greeting:   'Welcome,',
    welcomeNew: '🎉 Welcome to TEC — Your account is ready',
    stats: {
      piBalance:     'Pi Balance',
      tecWallet:     'TEC Wallet',
      availableApps: 'Available Apps',
      activeApp:     'Active',
      subscription:  'Subscription',
      upgradePro:    'Upgrade to Pro',
    },
    appsTitle: 'TEC Ecosystem',
    appsCount: '24 Apps',
  },
  life: {
    brand:       'TEC Life · Your personal space',
    pro:         'PRO',
    welcome:     'Welcome',
    welcomeName: 'Welcome, {name}',
    subtitle:    'Your personal context in the TEC ecosystem. Your data is yours — self-declared, private, and never used without your consent.',
    nav: { home: 'Home', goals: 'Goals', activity: 'Activity', settings: 'Settings' },
    cards: {
      goals:    { title: 'Goals',    hint: 'Set targets and track your progress' },
      activity: { title: 'Activity', hint: 'Your recent activity across TEC' },
      prefs:    { title: 'Preferences',    hint: 'Tailor your experience' },
    },
    goals: {
      title: 'Goals', hint: 'set a target · track your progress',
      active: 'Active', completed: 'Completed', tracked: 'π tracked',
      insights: 'Goal insights',
      addPlaceholder: 'Add a goal', targetPlaceholder: 'π target (opt)', add: 'Add',
      logPlaceholder: '+ π amount', log: 'Log',
      empty: 'No goals yet — add your first above.',
    },
    prefs: {
      title: 'Preferences', hint: 'how TEC tailors your experience',
      primaryFocus: 'Primary focus', language: 'Language',
      focus: { earning: 'Earning', learning: 'Learning', building: 'Building', saving: 'Saving', general: 'General' },
    },
    activity: {
      title: 'Activity', hint: 'your recent economic activity',
      empty: 'No activity yet — it appears here as you use TEC.',
    },
    settings: {
      profile: 'Profile', planFree: 'Free', planPro: 'Pro', connectedPi: 'Connected to Pi', notSignedIn: 'Not signed in', member: 'TEC Member',
      appearance: 'Appearance',
      theme: 'Theme', themeDesc: 'Light, dark, or follow your phone',
      themeSystem: 'System', themeLight: 'Light', themeDark: 'Dark',
      languageDesc: 'Display language',
      about: 'About', version: 'Version', domain: 'Domain', ecosystem: 'Ecosystem', builtOn: 'Built on', builtOnPi: 'Pi Network',
      logout: 'Logout',
    },
  },
};
