/* Sample data for the GigResource dashboard demo. Everything here is fictional. */
window.GR = (function () {
  const people = [
    ['Amara Osei', 'amara', 'Brand Designer', 'Accra, GH'],
    ['Daniel Kim', 'daniel', 'Full Stack Developer', 'Seattle, US'],
    ['Sofia Reyes', 'sofia', 'Founder, Brightpath', 'Austin, US'],
    ['Marcus Bell', 'marcus', 'Video Editor', 'London, UK'],
    ['Leila Haddad', 'leila', 'UX Researcher', 'Toronto, CA'],
    ['James Carter', 'james', 'Growth Marketer', 'Denver, US'],
    ['Nina Park', 'nina', 'Illustrator', 'Seoul, KR'],
    ['Oliver Grant', 'oliver', 'Copywriter', 'Dublin, IE'],
    ['Grace Liu', 'grace', 'Partner Manager', 'Singapore, SG'],
    ['Henry Walsh', 'henry', 'Operations Lead', 'Chicago, US'],
    ['Elena Rossi', 'elena', 'Product Designer', 'Milan, IT'],
    ['Ryan Brooks', 'ryan', 'Data Analyst', 'Boston, US'],
    ['Zoe Adams', 'zoe', 'Lifestyle Creator', 'Miami, US'],
    ['Maya Chen', 'maya', 'Tech and Travel Creator', 'San Francisco, US'],
    ['Isabel Cruz', 'isabel', 'Motion Designer', 'Madrid, ES'],
  ].map(([name, id, title, loc]) => ({ name, id, av: `assets/img/av-${id}.jpg`, title, loc }));
  const P = id => people.find(p => p.id === id);

  const brands = ['Northwind', 'Lumen Labs', 'Brightpath', 'Kova Studio', 'Atlas Foods', 'Pine and Co', 'Helio Fitness', 'Orbit Coffee', 'Vela Skin', 'Nomad Gear', 'Ferro Bikes', 'Juniper Health'];
  const jobs = ['Landing page redesign', 'Brand video edit', 'Shopify store fixes', 'Mobile app onboarding UX', 'Pitch deck design', 'SEO blog articles (x8)', 'React dashboard build', 'Logo and brand kit', 'Product photo retouch', 'Email automation setup', 'Explainer animation 60s', 'Webflow migration', 'Data cleanup in Airtable', 'Customer research interviews'];
  const skills = ['Figma', 'React', 'Webflow', 'Shopify', 'After Effects', 'Copywriting', 'SEO', 'Node', 'Branding', 'UX Research', 'Premiere', 'Tailwind', 'Motion', 'Illustration'];
  const campaigns = ['Summer Glow Launch', 'Morning Ritual', 'Ride the City', 'Fuel Your Day', 'Trail Ready', 'Desk Setup Week', 'Clean Start', 'Weekend Escape'];
  const media = {
    video: ['phone-cafe', 'phone-scroll', 'studio', 'glasses', 'desk', 'typing', 'laptop-dash', 'meeting'],
    img: ['camera', 'portrait-blue', 'abstract-wave', 'abstract-glow', 'two-desk', 'code-desk', 'office-2', 'dash-laptop', 'blocks', 'circuit']
  };

  // shared pages
  const help = { id: 'help', icon: 'play-circle', label: 'Help and Demo', tpl: 'explainer' };
  const policies = { id: 'policies', icon: 'scale', label: 'Policies', tpl: 'policy' };

  const roles = {
    client: {
      name: 'Client', short: 'C', color: '#2dd4bf', cls: 'teal', desc: 'Hire and manage talent',
      user: { ...P('sofia'), sub: 'Client account' },
      video: 'desk',
      welcome: { kick: 'Client workspace', text: '3 new proposals on "Landing page redesign" and one contract waiting for your review.', cta: ['Post a job', 'Review proposals'], go: 'proposals', ring: [{ v: 82, l: 'Profile done', c: '#2dd4bf' }, { v: 64, l: 'Budget used', c: '#8b5cf6' }] },
      kpis: [
        { label: 'Active jobs', v: 8, d: '+2', icon: 'briefcase', c: 'teal' },
        { label: 'New proposals', v: 34, d: '+11', icon: 'inbox', c: 'purple' },
        { label: 'Total spent', v: 12480, pre: '$', d: '+8%', icon: 'wallet', c: 'orange' },
        { label: 'Avg. time to hire', v: 2.4, suf: ' days', dec: 1, d: '-18%', icon: 'timer', c: 'green', good: true }
      ],
      chart: { title: 'Spending', sub: 'Paid to freelancers', pre: '$', base: 900 },
      donut: { title: 'Spend by category', labels: ['Design', 'Development', 'Video', 'Writing'], data: [38, 32, 18, 12] },
      recent: { title: 'Your open jobs', kind: 'jobs' },
      primary: { label: 'Post a job', icon: 'plus', modal: 'job' },
      promo: ['Invite and earn', 'Get $50 for every client you bring.', 'Copy invite link', 'Invite link copied'],
      money: { title: 'Payments', bal: 'Escrow balance', amount: 4860, out: 'Released this month', outAmt: 7620 },
      nav: [
        { label: 'Main', items: [
          { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard', tpl: 'dashboard' },
          { id: 'jobs', icon: 'briefcase', label: 'My Jobs', tpl: 'table', kind: 'jobs', badge: 3 },
          { id: 'proposals', icon: 'inbox', label: 'Proposals', tpl: 'cards', kind: 'proposals', badge: 12 },
          { id: 'messages', icon: 'message-square', label: 'Messages', tpl: 'messages', badge: 5 }
        ] },
        { label: 'Work and money', items: [
          { id: 'contracts', icon: 'file-signature', label: 'Contracts', tpl: 'table', kind: 'contracts' },
          { id: 'payments', icon: 'wallet', label: 'Payments', tpl: 'money' }
        ] },
        { label: 'Account', items: [
          { id: 'settings', icon: 'settings', label: 'Settings', tpl: 'settings' }, help, policies
        ] }
      ]
    },

    professional: {
      name: 'Professional', short: 'P', color: '#8b5cf6', cls: 'purple', desc: 'Find work and get paid',
      user: { ...P('daniel'), sub: 'Professional' },
      video: 'typing',
      welcome: { kick: 'Professional workspace', text: 'You have 4 bids waiting on clients and a milestone due Friday on "React dashboard build".', cta: ['Find work', 'View bids'], go: 'bids', ring: [{ v: 31, l: 'Win rate', c: '#8b5cf6' }, { v: 92, l: 'Job success', c: '#22c55e' }] },
      kpis: [
        { label: 'Active projects', v: 5, d: '+1', icon: 'folder-kanban', c: 'purple' },
        { label: 'Bids sent', v: 23, d: '+6', icon: 'send', c: 'teal' },
        { label: 'Earned this month', v: 8940, pre: '$', d: '+14%', icon: 'banknote', c: 'green' },
        { label: 'Win rate', v: 31, suf: '%', d: '+4 pts', icon: 'trophy', c: 'orange' }
      ],
      chart: { title: 'Earnings', sub: 'Paid to you', pre: '$', base: 700 },
      donut: { title: 'Bids by outcome', labels: ['Won', 'Pending', 'Lost'], data: [31, 44, 25] },
      recent: { title: 'Active projects', kind: 'projects' },
      primary: { label: 'Find work', icon: 'search', route: 'find-work' },
      promo: ['Boost your profile', 'Featured profiles get 3x more invites.', 'Boost now', 'Profile boost options opened'],
      money: { title: 'Earnings', bal: 'Available balance', amount: 3215, out: 'In review', outAmt: 1840 },
      nav: [
        { label: 'Main', items: [
          { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard', tpl: 'dashboard' },
          { id: 'find-work', icon: 'search', label: 'Find Work', tpl: 'cards', kind: 'work' },
          { id: 'bids', icon: 'send', label: 'My Bids', tpl: 'table', kind: 'bids', badge: 4 },
          { id: 'projects', icon: 'folder-kanban', label: 'Active Projects', tpl: 'table', kind: 'projects' },
          { id: 'messages', icon: 'message-square', label: 'Messages', tpl: 'messages', badge: 2 }
        ] },
        { label: 'Money', items: [
          { id: 'earnings', icon: 'banknote', label: 'Earnings', tpl: 'money' }
        ] },
        { label: 'Account', items: [
          { id: 'profile', icon: 'user-round', label: 'Profile', tpl: 'settings' }, help, policies
        ] }
      ]
    },

    influencer: {
      name: 'Influencer', short: 'I', color: '#fb923c', cls: 'orange', desc: 'Campaigns and brand deals',
      user: { ...P('maya'), sub: 'Influencer' },
      video: 'phone-cafe',
      welcome: { kick: 'Creator studio', text: '"Summer Glow Launch" goes live tomorrow. 6 brand offers are waiting for your answer.', cta: ['Upload content', 'See offers'], go: 'offers', ring: [{ v: 76, l: 'Deliverables', c: '#fb923c' }, { v: 64, l: 'Engagement', c: '#2dd4bf' }] },
      kpis: [
        { label: 'Live campaigns', v: 4, d: '+1', icon: 'megaphone', c: 'orange' },
        { label: 'Total reach', v: 1.28, suf: 'M', dec: 2, d: '+22%', icon: 'radio-tower', c: 'purple' },
        { label: 'Engagement', v: 6.4, suf: '%', dec: 1, d: '+0.8', icon: 'heart', c: 'teal' },
        { label: 'Earned', v: 14200, pre: '$', d: '+31%', icon: 'banknote', c: 'green' }
      ],
      chart: { title: 'Reach', sub: 'Views across your content', pre: '', base: 40000 },
      donut: { title: 'Audience by region', labels: ['North America', 'Europe', 'Asia', 'Other'], data: [46, 28, 18, 8] },
      recent: { title: 'Brand offers', kind: 'offers' },
      primary: { label: 'New content', icon: 'upload', modal: 'content' },
      promo: ['Media kit', 'Share a clean one-page kit with brands.', 'Copy kit link', 'Media kit link copied'],
      money: { title: 'Earnings', bal: 'Available balance', amount: 5480, out: 'Pending from brands', outAmt: 3900 },
      nav: [
        { label: 'Main', items: [
          { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard', tpl: 'dashboard' },
          { id: 'campaigns', icon: 'megaphone', label: 'Campaigns', tpl: 'cards', kind: 'campaigns', badge: 2 },
          { id: 'offers', icon: 'gift', label: 'Offers', tpl: 'table', kind: 'offers', badge: 6 },
          { id: 'content', icon: 'clapperboard', label: 'Content', tpl: 'cards', kind: 'content' },
          { id: 'messages', icon: 'message-square', label: 'Messages', tpl: 'messages', badge: 3 }
        ] },
        { label: 'Money', items: [
          { id: 'earnings', icon: 'banknote', label: 'Earnings', tpl: 'money' }
        ] },
        { label: 'Account', items: [
          { id: 'profile', icon: 'user-round', label: 'Profile', tpl: 'settings' }, help, policies
        ] }
      ]
    },

    admin: {
      name: 'Admin', short: 'A', color: '#6d8bff', cls: 'navy', desc: 'Run the platform',
      user: { ...P('henry'), sub: 'Administrator' },
      video: 'server',
      welcome: { kick: 'Admin console', text: 'All systems normal. 7 disputes need a decision and $86.4k in payouts are queued for Friday.', cta: ['Export report', 'Review disputes'], go: 'disputes', ring: [{ v: 99, l: 'Uptime', c: '#22c55e' }, { v: 71, l: 'Queue cleared', c: '#6d8bff' }] },
      kpis: [
        { label: 'Total users', v: 48210, d: '+3.2%', icon: 'users', c: 'navy' },
        { label: 'Volume this month', v: 1.24, pre: '$', suf: 'M', dec: 2, d: '+12%', icon: 'activity', c: 'teal' },
        { label: 'Open disputes', v: 7, d: '-2', icon: 'shield-alert', c: 'orange', good: true },
        { label: 'Payouts queued', v: 86400, pre: '$', d: '+5%', icon: 'landmark', c: 'purple' }
      ],
      chart: { title: 'Platform volume', sub: 'Money moved through GigResource', pre: '$', base: 30000 },
      globe: true,
      recent: { title: 'Latest disputes', kind: 'disputes' },
      primary: { label: 'Export report', icon: 'download', toast: 'Report export started' },
      promo: ['System status', 'All services are running normally.', 'View status', 'All 14 services operational'],
      money: { title: 'Payouts', bal: 'Queued payouts', amount: 86400, out: 'Paid this month', outAmt: 412900 },
      nav: [
        { label: 'Main', items: [
          { id: 'dashboard', icon: 'gauge', label: 'Overview', tpl: 'dashboard' },
          { id: 'users', icon: 'users', label: 'Users', tpl: 'table', kind: 'users' },
          { id: 'reports', icon: 'bar-chart-3', label: 'Reports', tpl: 'table', kind: 'reports' },
          { id: 'disputes', icon: 'shield-alert', label: 'Disputes', tpl: 'table', kind: 'disputes', badge: 7 },
          { id: 'messages', icon: 'message-square', label: 'Messages', tpl: 'messages', badge: 1 }
        ] },
        { label: 'Money', items: [
          { id: 'payouts', icon: 'landmark', label: 'Payouts', tpl: 'money' }
        ] },
        { label: 'System', items: [
          { id: 'settings', icon: 'settings', label: 'Settings', tpl: 'settings' }, policies
        ] }
      ]
    },

    affiliate: {
      name: 'Affiliate', short: 'A', color: '#22c55e', cls: 'green', desc: 'Refer and earn commission',
      user: { ...P('grace'), sub: 'Affiliate partner' },
      video: 'team',
      welcome: { kick: 'Partner hub', text: 'Your "Spring Newsletter" link is your best performer this week with 412 clicks.', cta: ['Create link', 'View referrals'], go: 'referrals', ring: [{ v: 35, l: 'Conversion x10', c: '#22c55e' }, { v: 58, l: 'To next tier', c: '#fb923c' }] },
      kpis: [
        { label: 'Clicks', v: 18420, d: '+9%', icon: 'mouse-pointer-click', c: 'green' },
        { label: 'Sign-ups', v: 642, d: '+48', icon: 'user-plus', c: 'teal' },
        { label: 'Conversion', v: 3.5, suf: '%', dec: 1, d: '+0.4', icon: 'percent', c: 'purple' },
        { label: 'Commission', v: 6380, pre: '$', d: '+17%', icon: 'banknote', c: 'orange' }
      ],
      chart: { title: 'Commission', sub: 'Earned from referrals', pre: '$', base: 300 },
      donut: { title: 'Clicks by source', labels: ['Blog', 'Newsletter', 'Partners', 'Direct'], data: [41, 27, 20, 12] },
      recent: { title: 'Recent referrals', kind: 'referrals' },
      primary: { label: 'Create link', icon: 'link', modal: 'link' },
      promo: ['Gold tier', '58% of the way. Gold pays 25%.', 'See tiers', 'Tier details opened'],
      money: { title: 'Commissions', bal: 'Unpaid commission', amount: 1920, out: 'Paid this year', outAmt: 22140 },
      nav: [
        { label: 'Main', items: [
          { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard', tpl: 'dashboard' },
          { id: 'links', icon: 'link', label: 'Referral Links', tpl: 'cards', kind: 'links' },
          { id: 'referrals', icon: 'users-round', label: 'Referrals', tpl: 'table', kind: 'referrals', badge: 9 },
          { id: 'messages', icon: 'message-square', label: 'Messages', tpl: 'messages' }
        ] },
        { label: 'Money', items: [
          { id: 'commissions', icon: 'percent', label: 'Commissions', tpl: 'money' }
        ] },
        { label: 'Account', items: [
          { id: 'settings', icon: 'settings', label: 'Settings', tpl: 'settings' }, help, policies
        ] }
      ]
    }
  };

  const notifications = [
    { p: 'daniel', t: '<b>Daniel Kim</b> sent a proposal for <b>React dashboard build</b>', s: '4 min ago', u: true },
    { p: 'amara', t: '<b>Amara Osei</b> submitted milestone 2 for review', s: '1 hour ago', u: true },
    { p: 'marcus', t: '<b>Marcus Bell</b> replied to your message', s: '3 hours ago' },
    { p: 'grace', t: 'Payment of <b>$1,200</b> was released', s: 'Yesterday' },
  ];

  return { people, P, brands, jobs, skills, campaigns, media, roles, notifications };
})();
