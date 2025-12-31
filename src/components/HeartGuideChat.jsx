import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Plus, Trash2, Heart, Crown, Play, LogOut, Mail, Lock, Check, CreditCard, Smartphone, Wallet, ArrowLeft, AlertCircle } from 'lucide-react';

export default function HeartGuideChat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [userTier, setUserTier] = useState('free');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const FREE_MESSAGE_LIMIT = 15;
  const GUEST_MESSAGE_LIMIT = 3;

  const plans = {
    free: {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: ['15 messages', 'Basic advice', 'Core features']
    },
    pro: {
      name: 'Pro',
      price: '$6.99',
      period: 'per month',
      features: ['Unlimited messages', 'Priority responses', 'Advanced strategies', 'Ad-free'],
      popular: true
    },
    promax: {
      name: 'Pro Max',
      price: '$9.99',
      period: 'per month',
      features: ['Everything in Pro', 'Lightning responses', 'Extended memory', 'VIP support']
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = localStorage.getItem('current_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          const sessionAge = Date.now() - new Date(session.timestamp).getTime();
          if (sessionAge < 30 * 24 * 60 * 60 * 1000) {
            loginUser(session.email, session.password, true);
          } else {
            createInitialChat();
          }
        } else {
          createInitialChat();
        }
      } catch (e) {
        console.error('Session check error:', e);
        createInitialChat();
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (currentUser && conversations.length > 0) saveUserData();
  }, [conversations, messageCount, userTier]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, currentConvId]);

  const hashPassword = (pass) => {
    let hash = 0;
    for (let i = 0; i < pass.length; i++) {
      hash = ((hash << 5) - hash) + pass.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString(36);
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const signupUser = () => {
    setAuthError('');
    if (!validateEmail(email)) return setAuthError('Invalid email');
    if (password.length < 6) return setAuthError('Password must be 6+ characters');

    try {
      const userKey = `user_${email.toLowerCase()}`;
      const existing = localStorage.getItem(userKey);
      if (existing) return setAuthError('Email already registered');

      const userData = {
        email: email.toLowerCase(),
        password: hashPassword(password),
        createdAt: new Date().toISOString(),
        userTier: 'free',
        messageCount: 0
      };

      localStorage.setItem(userKey, JSON.stringify(userData));
      localStorage.setItem('current_session', JSON.stringify({
        email: email.toLowerCase(),
        password,
        timestamp: new Date().toISOString()
      }));

      setCurrentUser(userData);
      setMessageCount(0);
      setUserTier('free');
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthError('Signup failed');
    }
  };

  const loginUser = (loginEmail = email, loginPassword = password, isAuto = false) => {
    if (!isAuto) {
      setAuthError('');
      if (!validateEmail(loginEmail)) return setAuthError('Invalid email');
      if (!loginPassword) return setAuthError('Enter password');
    }

    try {
      const userKey = `user_${loginEmail.toLowerCase()}`;
      const userDataString = localStorage.getItem(userKey);
      if (!userDataString) return setAuthError('No account found');

      const userData = JSON.parse(userDataString);
      if (userData.password !== hashPassword(loginPassword)) return setAuthError('Wrong password');

      if (!isAuto) {
        localStorage.setItem('current_session', JSON.stringify({
          email: loginEmail.toLowerCase(),
          password: loginPassword,
          timestamp: new Date().toISOString()
        }));
      }

      setCurrentUser(userData);
      setMessageCount(userData.messageCount || 0);
      setUserTier(userData.userTier || 'free');
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
      loadUserConversations(loginEmail.toLowerCase());
    } catch (error) {
      setAuthError('Login failed');
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('current_session');
    setCurrentUser(null);
    setConversations([]);
    setEmail('');
    setPassword('');
    setGuestMessageCount(0);
    createInitialChat();
  };

  const loadUserConversations = (userEmail) => {
    try {
      const convKey = `conversations_${userEmail}`;
      const convsString = localStorage.getItem(convKey);
      if (convsString) {
        const convs = JSON.parse(convsString);
        setConversations(convs);
        if (convs.length > 0) setCurrentConvId(convs[0].id);
      } else {
        createInitialChat();
      }
    } catch (e) {
      createInitialChat();
    }
  };

  const saveUserData = () => {
    if (!currentUser) return;
    try {
      localStorage.setItem(`conversations_${currentUser.email}`, JSON.stringify(conversations));
      localStorage.setItem(`user_${currentUser.email}`, JSON.stringify({
        ...currentUser,
        messageCount,
        userTier
      }));
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const createInitialChat = () => {
    const chat = {
      id: 1,
      title: 'New Chat',
      messages: [{
        role: 'assistant',
        content: "Hey! I'm HeartGuide, and I'm here to help with any relationship questions you have. What's going on?"
      }],
      createdAt: new Date().toISOString()
    };
    setConversations([chat]);
    setCurrentConvId(1);
  };

  const createNewChat = () => {
    const newId = Math.max(0, ...conversations.map(c => c.id)) + 1;
    const chat = {
      id: newId,
      title: 'New Chat',
      messages: [{
        role: 'assistant',
        content: "Hey! I'm HeartGuide. What's on your mind?"
      }],
      createdAt: new Date().toISOString()
    };
    setConversations([...conversations, chat]);
    setCurrentConvId(newId);
  };

  const deleteChat = (id) => {
    if (conversations.length === 1) return;
    const filtered = conversations.filter(c => c.id !== id);
    setConversations(filtered);
    if (currentConvId === id) setCurrentConvId(filtered[0].id);
  };

  const updateChatTitle = (convId, msg) => {
    const title = msg.slice(0, 30) + (msg.length > 30 ? '...' : '');
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, title } : c));
  };

  const currentConv = conversations.find(c => c.id === currentConvId);

  const handleSend = () => {
    if (!input.trim() || loading) return;

    // Check if guest has exceeded limit
    if (!currentUser && guestMessageCount >= GUEST_MESSAGE_LIMIT) {
      setShowAuthModal(true);
      return;
    }

    // Check if logged-in free user has exceeded limit
    if (currentUser && userTier === 'free' && messageCount >= FREE_MESSAGE_LIMIT) {
      setShowPaywall(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');

    const updatedConv = {
      ...currentConv,
      messages: [...currentConv.messages, { role: 'user', content: userMessage }]
    };

    setConversations(prev => prev.map(c => c.id === currentConvId ? updatedConv : c));

    if (currentConv.title === 'New Chat' && currentConv.messages.length === 1) {
      updateChatTitle(currentConvId, userMessage);
    }

    // Increment appropriate message counter
    if (!currentUser) {
      setGuestMessageCount(prev => prev + 1);
    } else if (userTier === 'free') {
      setMessageCount(prev => prev + 1);
    }

    setLoading(true);

    setTimeout(() => {
      const aiResponse = "I hear you! Can you tell me more about what's been going on?";
      
      setConversations(prev =>
        prev.map(c => c.id === currentConvId ? {
          ...c,
          messages: [...c.messages, { role: 'assistant', content: aiResponse }]
        } : c)
      );
      setLoading(false);
    }, 1000);
  };

  const handlePlanSelect = (plan) => {
    if (plan === 'free') return;
    setSelectedPlan(plan);
    setShowPricingModal(false);
    setShowPaymentModal(true);
  };

  const completePurchase = () => {
    setUserTier(selectedPlan);
    setMessageCount(0);
    setShowPaymentModal(false);
    setShowPaywall(false);
    alert(`Welcome to ${selectedPlan === 'pro' ? 'Pro' : 'Pro Max'}!`);
  };

  const isNewChat = currentConv && currentConv.messages.length === 1;

  return (
    <div className="flex h-screen bg-gradient-to-br from-pink-100 to-purple-100">
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-pink-400 to-purple-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Continue Your Journey</h2>
              <p className="text-gray-600">Sign up to save your conversation history and get more messages</p>
            </div>

            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2 rounded-md font-medium ${authMode === 'login' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                Log In
              </button>
              <button
                onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                className={`flex-1 py-2 rounded-md font-medium ${authMode === 'signup' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                Sign Up
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {authError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && (authMode === 'login' ? loginUser() : signupUser())}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && (authMode === 'login' ? loginUser() : signupUser())}
                  />
                </div>
                {authMode === 'signup' && <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>}
              </div>

              <button
                onClick={() => authMode === 'login' ? loginUser() : signupUser()}
                className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white font-medium rounded-lg"
              >
                {authMode === 'login' ? 'Log In' : 'Create Account'}
              </button>

              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      )}

      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Choose Your Plan</h2>
                <p className="text-gray-600">Unlimited relationship guidance</p>
              </div>
              <button onClick={() => setShowPricingModal(false)} className="text-gray-500 text-2xl">×</button>
            </div>

            <div className="p-8 grid md:grid-cols-3 gap-6">
              {Object.entries(plans).map(([key, plan]) => (
                <div
                  key={key}
                  onClick={() => handlePlanSelect(key)}
                  className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all ${
                    plan.popular ? 'border-pink-400 shadow-lg' : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-400 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Popular
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div>
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-gray-600 text-sm ml-1">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-pink-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={key === 'free'}
                    className={`w-full py-2 rounded-lg font-medium ${
                      plan.popular
                        ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white'
                        : key === 'free'
                        ? 'bg-gray-200 text-gray-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {key === 'free' ? 'Current' : 'Select'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="border-b p-4 flex items-center gap-3">
              <button onClick={() => { setShowPaymentModal(false); setShowPricingModal(true); }}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold">Complete Purchase</h2>
                <p className="text-sm text-gray-600">{plans[selectedPlan]?.name}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{plans[selectedPlan]?.name}</span>
                  <span className="text-xl font-bold">{plans[selectedPlan]?.price}</span>
                </div>
                <p className="text-xs text-gray-600">Billed monthly</p>
              </div>

              <div className="space-y-3">
                <button onClick={completePurchase} className="w-full flex items-center justify-center gap-3 p-3 border-2 rounded-xl hover:border-pink-400">
                  <CreditCard className="w-5 h-5" />
                  <span>Credit Card</span>
                </button>
                <button onClick={completePurchase} className="w-full flex items-center justify-center gap-3 p-3 border-2 rounded-xl hover:border-pink-400">
                  <Wallet className="w-5 h-5" />
                  <span>PayPal</span>
                </button>
                <button onClick={completePurchase} className="w-full flex items-center justify-center gap-3 p-3 border-2 rounded-xl hover:border-pink-400">
                  <Smartphone className="w-5 h-5" />
                  <span>Apple Pay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaywall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md">
            <Heart className="w-16 h-16 text-pink-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-center mb-2">Out of messages</h2>
            <p className="text-gray-600 text-center mb-6">
              Used {messageCount}/{FREE_MESSAGE_LIMIT} messages
            </p>
            
            <button
              onClick={() => { setShowPaywall(false); setShowPricingModal(true); }}
              className="w-full mb-3 px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-xl font-medium"
            >
              View Plans
            </button>

            <button
              onClick={() => { setShowAdModal(true); setShowPaywall(false); }}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Watch Ad
            </button>
          </div>
        </div>
      )}

      {showAdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md">
            <Play className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-center mb-2">Advertisement</h2>
            <div className="bg-gray-100 rounded-xl p-8 mb-6 text-center">
              <p className="text-4xl">📺</p>
            </div>
            <button onClick={() => { setMessageCount(0); setShowAdModal(false); }} className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-pink-600 to-purple-700 text-white flex flex-col shadow-2xl">
        <div className="p-4 border-b border-pink-400 border-opacity-30">
          <button onClick={createNewChat} className="w-full flex items-center gap-3 px-4 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg backdrop-blur-sm transition-all">
            <Plus className="w-5 h-5" />
            <span>New Chat</span>
          </button>
          
          {!currentUser ? (
            <div className="mt-3 px-3 py-2 bg-white bg-opacity-20 rounded-lg text-sm backdrop-blur-sm">
              Guest: {guestMessageCount}/{GUEST_MESSAGE_LIMIT} messages
            </div>
          ) : userTier === 'free' && (
            <div className="mt-3 px-3 py-2 bg-white bg-opacity-20 rounded-lg text-sm backdrop-blur-sm">
              {messageCount}/{FREE_MESSAGE_LIMIT} messages
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map(conv => (
            <div key={conv.id} onClick={() => setCurrentConvId(conv.id)} className={`group flex items-center gap-2 px-3 py-3 mb-1 rounded-lg cursor-pointer transition-all ${currentConvId === conv.id ? 'bg-white bg-opacity-30 backdrop-blur-sm' : 'hover:bg-white hover:bg-opacity-20'}`}>
              <MessageSquare className="w-4 h-4" />
              <span className="flex-1 text-sm truncate">{conv.title}</span>
              {conversations.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); deleteChat(conv.id); }} className="opacity-0 group-hover:opacity-100 hover:bg-white hover:bg-opacity-20 p-1 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-pink-400 border-opacity-30">
          {!currentUser ? (
            <button 
              onClick={() => setShowAuthModal(true)} 
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg mb-3 transition-all backdrop-blur-sm"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm font-semibold">Sign Up / Log In</span>
            </button>
          ) : userTier !== 'free' ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-30 backdrop-blur-sm rounded-lg mb-3">
              <Crown className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-semibold">{userTier === 'pro' ? 'Pro' : 'Pro Max'}</span>
            </div>
          ) : (
            <button onClick={() => setShowPricingModal(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg mb-3 transition-all backdrop-blur-sm">
              <Crown className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-semibold">Upgrade</span>
            </button>
          )}
          {currentUser && (
            <button onClick={logoutUser} className="w-full text-white text-opacity-80 hover:text-opacity-100 text-sm flex items-center justify-center gap-2 transition-all">
              <LogOut className="w-4 h-4" />
              <span className="truncate">{currentUser.email}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-4 shadow-lg">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Heart className="w-6 h-6" />
            HeartGuide
          </h1>
          <p className="text-sm text-pink-100">Your personal love & relationship coach</p>
        </div>

        {/* Guest Warning Banner */}
        {!currentUser && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-800">
                  <strong>Guest Mode:</strong> Your conversation history won't be saved. 
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="ml-2 text-amber-900 underline hover:text-amber-950 font-medium"
                  >
                    Sign up to save your chats
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isNewChat ? (
            // Centered layout for new chat (ChatGPT style)
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-full max-w-3xl">
                <div className="text-center mb-8">
                  <div className="bg-gradient-to-br from-pink-400 to-purple-500 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-xl">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">How can I help you today?</h2>
                  <p className="text-gray-600">Ask me anything about relationships, dating, or love advice</p>
                </div>

                {/* Centered Input */}
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Message HeartGuide..."
                    rows={1}
                    className="w-full px-4 py-4 pr-14 border-2 border-pink-300 rounded-2xl resize-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none shadow-lg"
                    style={{minHeight:'56px', maxHeight: '200px'}}
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Standard chat layout
            <div className="max-w-3xl mx-auto px-4 py-8">
              {currentConv?.messages.map((msg, i) => (
                <div key={i} className={`mb-8 flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg flex-shrink-0">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-2xl ${msg.role === 'user' ? 'flex items-start gap-4' : ''}`}>
                    <div className={`px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' : 'bg-white border-2 border-pink-200 shadow-md'}`}>
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg flex-shrink-0">
                        <span className="text-white text-sm font-bold">U</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="mb-8 flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input (only shown when not new chat) */}
        {!isNewChat && (
          <div className="bg-white border-t-2 border-pink-300 px-4 py-4 shadow-lg">
            <div className="max-w-3xl mx-auto flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Share what's on your mind..."
                rows={1}
                className="flex-1 px-4 py-3 border-2 border-pink-300 rounded-xl resize-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none"
                style={{minHeight:'48px', maxHeight: '200px'}}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl disabled:opacity-50 shadow-lg transition-all flex-shrink-0"
                style={{width:'48px',height:'48px'}}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}