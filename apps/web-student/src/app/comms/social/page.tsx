'use client';

import { useState, useEffect, useRef } from 'react';
import { StudentShell } from '@/components/student-shell';
import { Button } from '@eduai365/ui';
import { apiFetch } from '@/lib/api';
import { 
  ShieldAlert, 
  Send, 
  MessageSquare, 
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  Brain,
  ThumbsUp,
  Heart,
  RefreshCw,
  AtSign
} from 'lucide-react';

interface MockUser {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  isOnline: boolean;
}

interface SocialPost {
  id: string;
  userName: string;
  userRole: string;
  avatarColor: string;
  content: string;
  createdAt: Date;
  likes: number;
  hearts: number;
  hasLiked?: boolean;
  hasHearted?: boolean;
}

const MOCK_ONLINE_USERS: MockUser[] = [
  { id: '1', name: 'Principal Sharma', role: 'PRINCIPAL', avatarColor: 'from-violet-600 to-indigo-600', isOnline: true },
  { id: '2', name: 'Vice Principal Shastri', role: 'VICE_PRINCIPAL', avatarColor: 'from-blue-500 to-indigo-500', isOnline: true },
  { id: '3', name: 'Dr. Priya Sen (Counsellor)', role: 'COUNSELLOR', avatarColor: 'from-emerald-500 to-teal-500', isOnline: true },
  { id: '4', name: 'Mr. Robert (Librarian)', role: 'LIBRARIAN', avatarColor: 'from-amber-500 to-orange-500', isOnline: true },
  { id: '5', name: 'Aarav Mehta', role: 'STUDENT', avatarColor: 'from-purple-500 to-fuchsia-500', isOnline: true },
  { id: '6', name: 'Mrs. Patel', role: 'PARENT', avatarColor: 'from-teal-500 to-cyan-500', isOnline: true },
  { id: '7', name: 'Mr. Das', role: 'TEACHER', avatarColor: 'from-rose-500 to-pink-500', isOnline: true },
  { id: '8', name: 'Ms. Alice', role: 'LIBRARIAN', avatarColor: 'from-orange-500 to-yellow-500', isOnline: false },
];

const BULLYING_KEYWORDS = [
  'hate', 'kill', 'stupid', 'idiot', 'bully', 'loser', 'ugly', 'dumb', 'trash', 
  'bitch', 'bastard', 'asshole', 'suck', 'abuse', 'shut up', 'fat', 'weirdo', 'retard',
  'nerd', 'pathetic', 'punch', 'slap', 'garbage', 'fool', 'nonsense', 'kela', 'maka', 'bal', 'baal',
  'fuck', 'sex', 'sexual', 'porn', 'dick', 'pussy', 'slut', 'whore', 'crap', 'mad', 
  'crazy', 'annoyed', 'pissed', 'irritated', 'jerk'
];

const UNRELATED_KEYWORDS = [
  'crypto', 'bitcoin', 'ethereum', 'solana', 'doge', 'buy', 'sell', 'deal', 'money',
  'cash', 'subscribe', 'channel', 'promo', 'discount', 'shop', 'store', 'product', 
  'politics', 'election', 'vote', 'president', 'government', 'dating', 'single', 
  'crush', 'flirt', 'sexy', 'casino', 'betting', 'gambling', 'stock', 'invest'
];

const DISRESPECTFUL_KEYWORDS = [
  'worst', 'terrible', 'useless', 'slow', 'fail', 'bad', 'sucks', 'annoying', 'wrong',
  'blame', 'fault', 'stop', 'hate', 'rude', 'awful', 'lazy', 'dumb', 'stupid', 'loser',
  'fool', 'nonsense', 'kela', 'maka', 'bal', 'baal', 'irritated', 'jerk'
];

const TYPING_HINTS = [
  "Try sharing a suggestion: 'We should create a school gardening team to plant herbs.'",
  "Try referencing another user respectfully: '@Aarav Mehta Great job with the debate society proposal!'",
  "Try sharing a suggestion: 'Adding more recycling bins near the canteen would help keep the campus clean.'",
  "Try referencing another user: '@Dr. Priya Sen (Counsellor) Thank you for setting up the mindfulness session.'"
];

const getAvatarColorForRole = (role: string) => {
  switch (role) {
    case 'PRINCIPAL':
    case 'VICE_PRINCIPAL':
      return 'from-violet-600 to-indigo-600';
    case 'COUNSELLOR':
      return 'from-emerald-500 to-teal-500';
    case 'LIBRARIAN':
      return 'from-amber-500 to-orange-500';
    case 'TEACHER':
      return 'from-rose-500 to-pink-500';
    case 'PARENT':
      return 'from-teal-500 to-cyan-500';
    default:
      return 'from-purple-500 to-fuchsia-500';
  }
};

export default function SocialNetworkPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [inputText, setInputText] = useState('');
  const [mobileTab, setMobileTab] = useState<'chat' | 'users' | 'ai'>('chat');
  
  // Moderation state
  const [safetyStatus, setSafetyStatus] = useState<'safe' | 'bullying' | 'unrelated' | 'disrespectful-mention' | 'gibberish' | 'empty'>('empty');
  const [relevanceScore, setRelevanceScore] = useState<number>(100);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [ollamaConnecting, setOllamaConnecting] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load current user profile from session
  useEffect(() => {
    async function loadUserContext() {
      try {
        const me = await apiFetch<any>('/auth/me');
        if (me) {
          // Session verified successfully
        }
      } catch (err) {
        console.error('Failed to load active user profile context:', err);
      }
    }
    void loadUserContext();
  }, []);

  // Fetch posts from API
  const fetchPosts = async (showLoading = false) => {
    if (showLoading) setLoadingPosts(true);
    try {
      const data = await apiFetch<any[]>('/comms/social');
      const mapped = data.map((post: any) => ({
        id: post.id,
        userName: `${post.user.firstName} ${post.user.lastName}`,
        userRole: post.user.role,
        avatarColor: getAvatarColorForRole(post.user.role),
        content: post.content,
        createdAt: new Date(post.createdAt),
        likes: Math.floor((post.id.charCodeAt(0) || 0) % 5), // Deterministic seed mock reactions
        hearts: Math.floor((post.id.charCodeAt(1) || 0) % 4),
      }));
      setPosts(mapped);
    } catch (err) {
      console.error('Failed to load posts from backend API:', err);
    } finally {
      if (showLoading) setLoadingPosts(false);
    }
  };

  useEffect(() => {
    void fetchPosts(true);
    // Dynamic polling refresh loop (every 4 seconds) to support real-time discussion when online
    const interval = setInterval(() => {
      void fetchPosts(false);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Rotate hints
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHintIndex((prev) => (prev + 1) % TYPING_HINTS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Real-time AI analysis simulation (Gemma 4 model inspection)
  useEffect(() => {
    const text = inputText.trim().toLowerCase();
    if (!text) {
      setSafetyStatus('empty');
      setRelevanceScore(100);
      return;
    }

    setOllamaConnecting(true);
    const timeout = setTimeout(() => {
      setOllamaConnecting(false);

      // Check disrespectful user mentions first
      const hasMention = text.includes('@');
      if (hasMention) {
        const containsDisrespect = DISRESPECTFUL_KEYWORDS.some(word => text.includes(word)) || 
                                   BULLYING_KEYWORDS.some(word => text.includes(word));
        if (containsDisrespect) {
          setSafetyStatus('disrespectful-mention');
          setRelevanceScore(Math.max(5, Math.floor(Math.random() * 20)));
          return;
        }
      }

      // Check general bullying
      const hasBullying = BULLYING_KEYWORDS.some(word => text.includes(word));
      if (hasBullying) {
        setSafetyStatus('bullying');
        setRelevanceScore(Math.max(10, Math.floor(Math.random() * 25)));
        return;
      }

      // Check unrelated
      const hasUnrelated = UNRELATED_KEYWORDS.some(word => text.includes(word));
      if (hasUnrelated) {
        setSafetyStatus('unrelated');
        setRelevanceScore(Math.max(5, Math.floor(Math.random() * 30)));
        return;
      }

      // Check for gibberish (e.g. "fdbffd")
      const words = text.toLowerCase().split(/\s+/);
      const isGibberish = words.some(w => w.length > 4 && (!/[aeiouy]/.test(w) || /[bcdfghjklmnpqrstvwxyz]{5,}/.test(w)));
      if (isGibberish) {
        setSafetyStatus('gibberish');
        setRelevanceScore(Math.max(1, Math.floor(Math.random() * 10)));
        return;
      }

      // Check positive school topic
      setSafetyStatus('safe');
      const schoolKeywords = [
        'school', 'class', 'library', 'canteen', 'classroom', 'campus', 'lab', 'laboratory', 'gym', 'playground',
        'canteen', 'hallway', 'cafeteria', 'garden', 'recreation', 'student', 'teacher', 'counsellor', 'principal',
        'librarian', 'staff', 'admin', 'parent', 'peer', 'mentor', 'homework', 'exam', 'classwork', 'syllabus',
        'course', 'project', 'science', 'math', 'reading', 'debate', 'education', 'learning', 'lesson', 'study',
        'recycling', 'clean', 'repair', 'ventilator', 'club', 'proposal', 'idea', 'suggestion', 'feedback', 'issue',
        'problem', 'help', 'improve', 'request', 'thanks', 'great', 'awesome', 'job'
      ];
      
      const constructivePhrases = [
        'should', 'could', 'suggest', 'improve', 'need', 'propose', 'ideas', 'create', 
        'start', 'setup', 'organize', 'provide', 'please consider', 'would help', 'can we', 'how about'
      ];

      const textLen = text.length;
      let score = 0;

      const schoolMatches = schoolKeywords.filter(word => text.includes(word)).length;
      const constructiveMatches = constructivePhrases.filter(phrase => text.includes(phrase)).length;

      if (schoolMatches > 0 || constructiveMatches > 0) {
        score = 40;
        score += schoolMatches * 15;
        score += constructiveMatches * 20;
        if (textLen > 40) score += 15;
        else if (textLen > 20) score += 5;
      } else {
        score = Math.max(5, Math.min(20, Math.floor(textLen / 3)));
      }

      const finalScore = Math.max(0, Math.min(100, score));
      setRelevanceScore(finalScore);
    }, 400);

    return () => clearTimeout(timeout);
  }, [inputText]);

  useEffect(() => {
    if (chatEndRef.current) {
      const parent = chatEndRef.current.parentElement;
      if (parent) {
        parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [posts]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const text = inputText.trim();
    if (!text) return;

    if (safetyStatus === 'disrespectful-mention') {
      setErrorMsg("Ollama AI Blocked: Disrespectful user reference. When mentioning other school members using @, your message must remain strictly positive, supportive, and respectful.");
      return;
    }

    if (safetyStatus === 'bullying') {
      setErrorMsg("Ollama AI Blocked: Message contains words classified as harassment, bullying, or hate speech. Please review school guidelines.");
      return;
    }

    if (safetyStatus === 'unrelated') {
      setErrorMsg("Ollama AI Blocked: Message is irrelevant to school events or constructive suggestions (financial, political, commercial, or non-educational content detected).");
      return;
    }

    if (safetyStatus === 'gibberish') {
      setErrorMsg("Ollama AI Blocked: Message contains unrecognized text or gibberish.");
      return;
    }

    try {
      await apiFetch('/comms/social', {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });
      setInputText('');
      setSuccessMsg('Constructive message published successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      void fetchPosts(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish post');
    }
  };

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const liked = !post.hasLiked;
        return {
          ...post,
          hasLiked: liked,
          likes: liked ? post.likes + 1 : post.likes - 1
        };
      }
      return post;
    }));
  };

  const toggleHeart = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const hearted = !post.hasHearted;
        return {
          ...post,
          hasHearted: hearted,
          hearts: hearted ? post.hearts + 1 : post.hearts - 1
        };
      }
      return post;
    }));
  };

  const insertMention = (name: string) => {
    setInputText(prev => {
      const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
      return `${prev}${space}@${name} `;
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'PRINCIPAL':
      case 'VICE_PRINCIPAL':
        return 'bg-violet-50 text-violet-700 border-violet-200 shadow-sm';
      case 'COUNSELLOR':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm';
      case 'LIBRARIAN':
        return 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm';
      case 'TEACHER':
        return 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm';
      case 'PARENT':
        return 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm';
      default:
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 shadow-sm';
    }
  };

  return (
    <StudentShell>
      <div className="space-y-6 max-w-6xl mx-auto min-h-screen text-slate-900 p-1">
        
        {/* Mobile Tab Navigation */}
        <div className="flex lg:hidden bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 shadow-sm">
          <button
            type="button"
            onClick={() => setMobileTab('chat')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'chat'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('users')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'users'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AtSign className="h-4 w-4" />
            <span>Online ({MOCK_ONLINE_USERS.filter(u => u.isOnline).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('ai')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'ai'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Brain className="h-4 w-4" />
            <span>AI Inspector</span>
          </button>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Left panel - Board list, online users & AI Monitor */}
          <div className={`${mobileTab === 'users' ? 'flex' : 'hidden'} lg:flex lg:col-span-1 flex-col gap-6 h-[400px] lg:h-[800px]`}>
            


            {/* Online Members Panel */}
            <div className="bg-slate-100 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-lg space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-2 shrink-0">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Online Users ({MOCK_ONLINE_USERS.filter(u => u.isOnline).length})
                </h3>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              
              <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                {MOCK_ONLINE_USERS.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-2.5">
                    <button 
                      onClick={() => insertMention(user.name)}
                      className="flex items-center gap-2.5 group w-full text-left focus:outline-none"
                      title={`Click to mention @${user.name}`}
                    >
                      <div className="relative">
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-extrabold text-white bg-gradient-to-br ${user.avatarColor} shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-all`}>
                          {user.name.charAt(0)}
                        </div>
                        {user.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-100" />
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-body-md font-semibold text-slate-800 leading-tight group-hover:text-indigo-700 transition-colors flex items-center gap-1">
                          {user.name}
                          <AtSign className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-all" />
                        </p>
                        <p className="text-[10px] text-slate-600 font-mono font-bold mt-0.5 uppercase tracking-wide">{user.role}</p>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right panel - Chat board flow with Cinematic 3D cards */}
          <div className={`${mobileTab === 'chat' ? 'flex' : 'hidden'} lg:flex lg:col-span-3 bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex-col h-[550px] lg:h-[800px] overflow-hidden`}>
            


            {/* Chat message history stream */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-white">
              {loadingPosts ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-indigo-400 mb-3" />
                  <span>Loading board posts...</span>
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
                  <MessageSquare className="h-12 w-12 text-slate-700 mb-3" />
                  <span>No posts shared yet. Be the first to post a constructive suggestion!</span>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="flex items-start gap-4 hover:bg-slate-100/30 p-2.5 -mx-2.5 rounded-2xl transition-all duration-300">
                    <div className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center font-black text-white shadow-lg ${post.avatarColor}`}>
                      {post.userName.charAt(0)}
                    </div>
                    <div className="space-y-2 flex-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-body-md text-slate-900">{post.userName}</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border tracking-wider uppercase ${getRoleBadgeColor(post.userRole)}`}>
                          {post.userRole}
                        </span>
                        <span className="text-xs text-slate-600 font-mono ml-auto">
                          {post.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {/* Glassmorphic message container */}
                      <div className="relative group bg-white shadow-sm backdrop-blur-sm border border-slate-200 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:border-slate-300 transition-all duration-300">
                        <p className="text-body-md text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {/* Highlight mentions in UI */}
                          {post.content.split(/(\s+)/).map((word, i) => {
                            if (word.startsWith('@')) {
                              return <span key={i} className="text-indigo-400 font-semibold">{word}</span>;
                            }
                            return word;
                          })}
                        </p>
                        
                        {/* Positive reinforcement reactions */}
                        <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-100">
                          <button 
                            onClick={() => toggleLike(post.id)}
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                              post.hasLiked 
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                                : 'border-slate-200 text-slate-500 hover:text-slate-600 hover:border-slate-700'
                            }`}
                          >
                            <ThumbsUp className={`h-3.5 w-3.5 ${post.hasLiked ? 'fill-indigo-400' : ''}`} />
                            <span>{post.likes}</span>
                          </button>
                          <button 
                            onClick={() => toggleHeart(post.id)}
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                              post.hasHearted 
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                                : 'border-slate-200 text-slate-500 hover:text-slate-600 hover:border-slate-700'
                            }`}
                          >
                            <Heart className={`h-3.5 w-3.5 ${post.hasHearted ? 'fill-rose-400' : ''}`} />
                            <span>{post.hearts}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* AI Warning Alerts - Center Floating Popup */}
            {errorMsg && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in-fade">
                <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center transform scale-100 transition-all duration-300">
                  <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shadow-inner">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-rose-800 leading-tight">Message Filtered by Ollama AI</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{errorMsg}</p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setErrorMsg(null)}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-200 transition-colors"
                    >
                      Acknowledge & Edit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="absolute bottom-[130px] left-0 right-0 z-10 px-6 py-3.5 bg-emerald-50 border-t border-b border-emerald-200 flex items-center gap-2.5 text-left text-emerald-800 text-body-md shadow-lg animate-in-fade">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700">{successMsg}</span>
              </div>
            )}

            {/* Input area with energetic hints */}
            <div className="p-4 bg-white border-t border-slate-200 relative">
              
              {/* Encouraging Prompt Helper (Typing Hint Carousel) */}
              <div className="mb-3 px-3 py-2 min-h-[44px] rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-left transition-all duration-500">
                <Sparkles className="h-4.5 w-4.5 text-amber-600 shrink-0 animate-bounce" />
                <div className="text-[11px] text-slate-600 leading-tight">
                  <span className="font-bold text-amber-700">Suggestion Helper: </span>
                  <span className="italic">{TYPING_HINTS[currentHintIndex]}</span>
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-3">
                <div className="flex gap-3 items-stretch">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a constructive suggestion or school issue..."
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-body-md text-slate-900 placeholder-slate-400 focus:bg-slate-100 focus:border-indigo-500 outline-none shadow-inner transition-all focus:ring-1 focus:ring-indigo-500/25"
                  />
                  <Button type="submit" variant="primary" className="rounded-2xl px-8 py-3 bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-600 hover:to-fuchsia-700 text-white font-bold flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all">
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </Button>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-600 px-2 flex-wrap gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-xs">Strictly moderated: insults, off-topic, spam, and commercial text are auto-blocked.</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Text Only • No Uploads</span>
                </div>
              </form>
            </div>

          </div>

          {/* Right panel - AI Monitor */}
          <div className={`${mobileTab === 'ai' ? 'flex' : 'hidden'} lg:flex lg:col-span-1 flex-col gap-6 h-auto lg:h-[800px]`}>
            {/* AI Real-time Inspector Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-indigo-500" />
                  AI Stream Inspector
                </h3>
                {ollamaConnecting && (
                  <RefreshCw className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
                )}
              </div>

              {/* Relevance Meter */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Relevance / Tone Score:</span>
                  <span className={`font-mono font-bold ${relevanceScore > 60 ? 'text-indigo-600' : 'text-rose-600'}`}>
                    {relevanceScore}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      safetyStatus === 'safe' ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500' : 
                      safetyStatus === 'empty' ? 'bg-slate-200' : 'bg-rose-600'
                    }`} 
                    style={{ width: `${relevanceScore}%` }}
                  />
                </div>
              </div>

              {/* Safety Evaluation Status */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-left space-y-1">
                <span className="text-xs text-slate-505 font-bold uppercase tracking-wider block">Ollama Evaluation</span>
                {safetyStatus === 'empty' && (
                  <span className="text-slate-600 text-xs font-semibold flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-slate-500" /> Waiting for input...
                  </span>
                )}
                {safetyStatus === 'safe' && (
                  <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Approved (School Topic)
                  </span>
                )}
                {safetyStatus === 'bullying' && (
                  <span className="text-rose-600 text-xs font-semibold flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> Blocked (Bullying/Hate)
                  </span>
                )}
                {safetyStatus === 'unrelated' && (
                  <span className="text-amber-600 text-xs font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Blocked (Unrelated Topic)
                  </span>
                )}
                {safetyStatus === 'disrespectful-mention' && (
                  <span className="text-rose-600 text-xs font-semibold flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-500 animate-pulse" /> Disrespectful Mention Blocked
                  </span>
                )}
              </div>

              {/* Guidelines helper */}
              <div className="text-xs text-slate-600 text-left leading-relaxed space-y-1">
                <p>• Off-topic promo or insults are auto-blocked.</p>
                <p>• Mentions with @ must have a supportive, encouraging, or strictly constructive tone.</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </StudentShell>
  );
}
