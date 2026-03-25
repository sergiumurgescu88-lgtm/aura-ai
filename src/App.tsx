import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Image as ImageIcon, 
  Video, 
  Settings, 
  Plus, 
  ShoppingBag,
  BarChart3,
  Send,
  User,
  History,
  Zap,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Loader2,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Character, ContentItem } from './types';
import { geminiService } from './services/geminiService';

const data = [
  { name: 'Mon', reach: 4000, engagement: 2400 },
  { name: 'Tue', reach: 3000, engagement: 1398 },
  { name: 'Wed', reach: 2000, engagement: 9800 },
  { name: 'Thu', reach: 2780, engagement: 3908 },
  { name: 'Fri', reach: 1890, engagement: 4800 },
  { name: 'Sat', reach: 2390, engagement: 3800 },
  { name: 'Sun', reach: 3490, engagement: 4300 },
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-white/10 text-white shadow-sm' 
        : 'text-zinc-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const CharacterCard = ({ character, onSelect, active }: any) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onSelect}
    className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ${
      active ? 'ring-2 ring-emerald-500 ring-offset-4 ring-offset-zinc-950' : ''
    }`}
  >
    <div className="aspect-[4/5] bg-zinc-900 overflow-hidden">
      <img 
        src={character.avatar_url || `https://picsum.photos/seed/${character.id}/400/500`} 
        alt={character.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-bold text-white">{character.name}</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-bold">
          {character.niche}
        </span>
      </div>
      <p className="text-xs text-zinc-400 line-clamp-2">{character.personality}</p>
    </div>
  </motion.div>
);

const StatCard = ({ label, value, trend, icon: Icon }: any) => (
  <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl">
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 bg-white/5 rounded-lg">
        <Icon size={18} className="text-zinc-400" />
      </div>
      <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
        {trend}
      </span>
    </div>
    <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
    <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{label}</div>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newChar, setNewChar] = useState({ name: '', niche: 'Lifestyle' });
  const [content, setContent] = useState<ContentItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, message: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    if (selectedCharacter) {
      fetchContent(selectedCharacter.id);
      fetchChat(selectedCharacter.id);
    }
  }, [selectedCharacter]);

  const fetchChat = async (id: number) => {
    const res = await fetch(`/api/chat/${id}`);
    const data = await res.json();
    setMessages(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedCharacter || chatLoading) return;

    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', message: userMsg }]);
    setChatLoading(true);

    try {
      // Save user message
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character_id: selectedCharacter.id, role: 'user', message: userMsg })
      });

      // Generate AI response
      const response = await geminiService.generatePostContent(
        selectedCharacter.name, 
        selectedCharacter.personality, 
        `User says: ${userMsg}. Respond in character.`
      );

      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', message: response }]);
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character_id: selectedCharacter.id, role: 'assistant', message: response })
        });
      }
    } finally {
      setChatLoading(false);
    }
  };

  const fetchCharacters = async () => {
    const res = await fetch('/api/characters');
    const data = await res.json();
    setCharacters(data);
    if (data.length > 0 && !selectedCharacter) setSelectedCharacter(data[0]);
  };

  const fetchContent = async (id: number) => {
    const res = await fetch(`/api/content/${id}`);
    const data = await res.json();
    setContent(data);
  };

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bio = await geminiService.generateCharacterBio(newChar.name, newChar.niche);
      const avatar = `https://picsum.photos/seed/${newChar.name}/800/1000`;
      
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChar.name,
          niche: newChar.niche,
          personality: bio,
          avatar_url: avatar
        })
      });
      
      if (res.ok) {
        await fetchCharacters();
        setIsCreating(false);
        setNewChar({ name: '', niche: 'Lifestyle' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!selectedCharacter) return;
    setGenerating(true);
    try {
      const prompt = `High quality professional photo of ${selectedCharacter.name}, an AI influencer in the ${selectedCharacter.niche} niche. Style: Cinematic, editorial, sharp focus.`;
      const imageUrl = await geminiService.generateImage(prompt);
      
      if (imageUrl) {
        await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character_id: selectedCharacter.id,
            type: 'image',
            url: imageUrl,
            prompt: prompt
          })
        });
        await fetchContent(selectedCharacter.id);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Zap size={20} className="text-black fill-black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Aura AI</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Users} 
            label="Characters" 
            active={activeTab === 'characters'} 
            onClick={() => setActiveTab('characters')} 
          />
          <SidebarItem 
            icon={ImageIcon} 
            label="Media Library" 
            active={activeTab === 'media'} 
            onClick={() => setActiveTab('media')} 
          />
          <SidebarItem 
            icon={ShoppingBag} 
            label="Marketplace" 
            active={activeTab === 'marketplace'} 
            onClick={() => setActiveTab('marketplace')} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label="Analytics" 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <SidebarItem icon={Settings} label="Settings" onClick={() => {}} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 border-bottom border-white/5 flex items-center justify-between px-8 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              {activeTab === 'dashboard' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Plus size={18} />
              New Persona
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Reach" value="2.4M" trend="+12.5%" icon={Users} />
                <StatCard label="Engagement" value="4.8%" trend="+0.4%" icon={MessageSquare} />
                <StatCard label="Generations" value="142" trend="+24" icon={Sparkles} />
                <StatCard label="Revenue" value="$12,450" trend="+8.2%" icon={Zap} />
              </div>

              {/* Characters Grid */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Active Personas</h3>
                  <button className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
                    View all <ChevronRight size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {characters.map(char => (
                    <CharacterCard 
                      key={char.id} 
                      character={char} 
                      onSelect={() => setSelectedCharacter(char)}
                      active={selectedCharacter?.id === char.id}
                    />
                  ))}
                  <button 
                    onClick={() => setIsCreating(true)}
                    className="aspect-[4/5] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-zinc-500 hover:text-zinc-300 hover:border-white/20 transition-all group"
                  >
                    <div className="p-3 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                      <Plus size={24} />
                    </div>
                    <span className="font-medium">Add New</span>
                  </button>
                </div>
              </section>

              {/* Selected Character Detail / Generation */}
              {selectedCharacter && (
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-white/5">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Recent Content</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleGenerateImage}
                          disabled={generating}
                          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                        >
                          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-emerald-400" />}
                          Generate Image
                        </button>
                        <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                          <Video size={16} className="text-blue-400" />
                          Generate Video
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <AnimatePresence mode="popLayout">
                        {content.map(item => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/5 relative group"
                          >
                            <img 
                              src={item.url} 
                              alt="Generated" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                              <p className="text-[10px] text-zinc-300 line-clamp-2 italic">"{item.prompt}"</p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {content.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                          <ImageIcon size={32} className="mb-2 opacity-20" />
                          <p>No content generated yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold">Persona Details</h3>
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={selectedCharacter.avatar_url} 
                          className="w-16 h-16 rounded-xl object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-bold text-lg">{selectedCharacter.name}</h4>
                          <p className="text-sm text-emerald-400 font-medium">{selectedCharacter.niche}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Personality Profile</label>
                        <p className="text-sm text-zinc-300 leading-relaxed italic">
                          "{selectedCharacter.personality}"
                        </p>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex gap-2">
                        <button 
                          onClick={() => setChatOpen(true)}
                          className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <MessageSquare size={14} />
                          Live Chat
                        </button>
                        <button className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg text-xs font-bold transition-all">
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl">
                  <h3 className="text-lg font-bold mb-6">Reach Overview</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data}>
                        <defs>
                          <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Area type="monotone" dataKey="reach" stroke="#10b981" fillOpacity={1} fill="url(#colorReach)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl">
                  <h3 className="text-lg font-bold mb-6">Engagement Rate</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                          itemStyle={{ color: '#60a5fa' }}
                        />
                        <Line type="monotone" dataKey="engagement" stroke="#60a5fa" strokeWidth={3} dot={{ fill: '#60a5fa', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden group">
                  <div className="aspect-video bg-zinc-800 relative">
                    <img 
                      src={`https://picsum.photos/seed/asset${i}/600/400`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
                      $49.00
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold mb-2">Premium Asset Pack #{i}</h4>
                    <p className="text-sm text-zinc-400 mb-4">High-quality 3D assets and textures for virtual influencer content.</p>
                    <button className="w-full bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-all">
                      Purchase License
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'media' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {content.map(item => (
                <div key={item.id} className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 group relative">
                  <img src={item.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                      <History size={16} />
                    </button>
                    <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Chat Drawer */}
      <AnimatePresence>
        {chatOpen && selectedCharacter && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-900 border-l border-white/10 z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={selectedCharacter.avatar_url} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h3 className="font-bold">{selectedCharacter.name}</h3>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Online</p>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-emerald-500 text-black font-medium rounded-tr-none' 
                        : 'bg-white/5 text-zinc-200 rounded-tl-none border border-white/5'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                      <Loader2 size={16} className="animate-spin text-zinc-500" />
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-6 border-t border-white/5 flex gap-2">
                <input 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={`Message ${selectedCharacter.name}...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="p-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Create New Persona</h2>
              
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-white/10 transition-all">
                    <img 
                      src={newChar.name ? `https://picsum.photos/seed/${newChar.name}/200/200` : `https://ui-avatars.com/api/?name=?&background=27272a&color=71717a&size=200`}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 p-1.5 bg-emerald-500 rounded-lg text-black shadow-lg">
                    <ImageIcon size={14} />
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateCharacter} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Persona Name</label>
                  <input 
                    required
                    value={newChar.name}
                    onChange={e => setNewChar({...newChar, name: e.target.value})}
                    placeholder="e.g. Luna Star"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Niche</label>
                  <select 
                    value={newChar.niche}
                    onChange={e => setNewChar({...newChar, niche: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                  >
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Tech">Tech & Gadgets</option>
                    <option value="Fitness">Fitness & Health</option>
                    <option value="Fashion">Fashion & Beauty</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Business">Business & Finance</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                    {loading ? 'Crafting Persona...' : 'Initialize Persona'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
