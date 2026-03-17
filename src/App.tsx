import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  PiggyBank, 
  HandCoins, 
  Calendar, 
  Settings, 
  LogOut, 
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Role = 'admin' | 'member';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: Role;
}

interface Saving {
  id: number;
  amount: number;
  type: 'deposit' | 'withdrawal';
  transaction_date: string;
}

interface Loan {
  id: number;
  amount: number;
  interest_rate: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  applied_at: string;
  full_name?: string; // For admin view
}

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-black text-white hover:bg-zinc-800",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    outline: "border border-zinc-200 text-zinc-600 hover:bg-zinc-50",
    danger: "bg-red-500 text-white hover:bg-red-600"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, title, subtitle, action }: any) => (
  <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
    {(title || action) && (
      <div className="px-6 py-4 border-bottom border-zinc-100 flex items-center justify-between">
        <div>
          {title && <h3 className="font-semibold text-zinc-900">{title}</h3>}
          {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Input = ({ label, type = "text", value, onChange, placeholder }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>}
    <input 
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
    />
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState('dashboard');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Auth State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Data State
  const [stats, setStats] = useState({ members: 0, savings: 0, loans: 0 });
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [adminLoans, setAdminLoans] = useState<Loan[]>([]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchSavings();
      fetchLoans();
      if (user.role === 'admin') fetchAdminLoans();
    }
  }, [user]);

  const fetchStats = async () => {
    const res = await fetch('/api/stats');
    const data = await res.json();
    setStats(data);
  };

  const fetchSavings = async () => {
    if (!user) return;
    const res = await fetch(`/api/savings/${user.id}`);
    const data = await res.json();
    setSavings(data);
  };

  const fetchLoans = async () => {
    if (!user) return;
    const res = await fetch(`/api/loans/${user.id}`);
    const data = await res.json();
    setLoans(data);
  };

  const fetchAdminLoans = async () => {
    const res = await fetch('/api/admin/loans');
    const data = await res.json();
    setAdminLoans(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const body = isLogin ? { username, password } : { username, password, fullName };
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        if (isLogin) {
          setUser(data.user);
        } else {
          setIsLogin(true);
          alert('Registration successful! Please login.');
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = prompt('Enter deposit amount:');
    if (!amount || isNaN(Number(amount))) return;
    
    await fetch('/api/savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, amount: Number(amount), type: 'deposit' })
    });
    fetchSavings();
    fetchStats();
  };

  const handleApplyLoan = async () => {
    const amount = prompt('Enter loan amount:');
    if (!amount || isNaN(Number(amount))) return;
    
    await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, amount: Number(amount), interestRate: 5.0 })
    });
    fetchLoans();
    fetchStats();
  };

  const handleApproveLoan = async (loanId: number) => {
    await fetch('/api/admin/loans/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loanId })
    });
    fetchAdminLoans();
    fetchStats();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">SHG Management</h1>
            <p className="text-zinc-500 text-sm">Empowering communities through collective growth</p>
          </div>

          <Card>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <Input 
                  label="Full Name" 
                  placeholder="John Doe" 
                  value={fullName} 
                  onChange={(e: any) => setFullName(e.target.value)} 
                />
              )}
              <Input 
                label="Username" 
                placeholder="johndoe" 
                value={username} 
                onChange={(e: any) => setUsername(e.target.value)} 
              />
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e: any) => setPassword(e.target.value)} 
              />
              <Button disabled={loading} className="w-full py-3 mt-2">
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-zinc-500 hover:text-black transition-colors"
              >
                {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'savings', label: 'Savings', icon: PiggyBank },
    { id: 'loans', label: 'Loans', icon: HandCoins },
    ...(user.role === 'admin' ? [
      { id: 'members', label: 'Members', icon: Users },
      { id: 'meetings', label: 'Meetings', icon: Calendar },
      { id: 'settings', label: 'Settings', icon: Settings },
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-100">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Users className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-zinc-900 tracking-tight">SHG Portal</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                view === item.id 
                  ? 'bg-zinc-100 text-black' 
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center text-xs font-bold">
              {user.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">{user.full_name}</p>
              <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={() => setUser(null)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-zinc-900 capitalize">{view}</h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-zinc-500">Current Date</p>
              <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium">Total Members</p>
                    <h4 className="text-3xl font-bold text-zinc-900 mt-1">{stats.members}</h4>
                  </Card>
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <PiggyBank className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+5.4%</span>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium">Total Savings</p>
                    <h4 className="text-3xl font-bold text-zinc-900 mt-1">${stats.savings.toLocaleString()}</h4>
                  </Card>
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <HandCoins className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium">Active Loans</p>
                    <h4 className="text-3xl font-bold text-zinc-900 mt-1">{stats.loans}</h4>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card title="Recent Activity" subtitle="Your latest transactions">
                    <div className="space-y-4">
                      {savings.slice(0, 5).map((s) => (
                        <div key={s.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${s.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {s.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-zinc-900 capitalize">{s.type}</p>
                              <p className="text-xs text-zinc-500">{new Date(s.transaction_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${s.type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {s.type === 'deposit' ? '+' : '-'}${s.amount}
                          </span>
                        </div>
                      ))}
                      {savings.length === 0 && <p className="text-center text-zinc-400 py-8 text-sm italic">No recent activity</p>}
                    </div>
                  </Card>

                  <Card title="Loan Status" subtitle="Overview of your applications">
                    <div className="space-y-4">
                      {loans.slice(0, 5).map((l) => (
                        <div key={l.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              l.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                              l.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {l.status === 'approved' ? <CheckCircle2 className="w-4 h-4" /> : 
                               l.status === 'pending' ? <Clock className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">Loan Request</p>
                              <p className="text-xs text-zinc-500">{new Date(l.applied_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-zinc-900">${l.amount}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${
                              l.status === 'approved' ? 'text-emerald-600' : 
                              l.status === 'pending' ? 'text-amber-600' : 'text-red-600'
                            }`}>{l.status}</p>
                          </div>
                        </div>
                      ))}
                      {loans.length === 0 && <p className="text-center text-zinc-400 py-8 text-sm italic">No loan applications</p>}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {view === 'savings' && (
              <motion.div 
                key="savings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-zinc-900">Savings Management</h3>
                    <p className="text-zinc-500">Track and manage your contributions</p>
                  </div>
                  <Button onClick={handleDeposit}>
                    <Plus className="w-4 h-4" />
                    New Deposit
                  </Button>
                </div>

                <Card>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savings.map((s) => (
                        <tr key={s.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors">
                          <td className="px-4 py-4 text-sm text-zinc-600">{new Date(s.transaction_date).toLocaleDateString()}</td>
                          <td className="px-4 py-4">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                              s.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {s.type}
                            </span>
                          </td>
                          <td className={`px-4 py-4 text-sm font-bold text-right ${s.type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {s.type === 'deposit' ? '+' : '-'}${s.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {savings.length === 0 && <p className="text-center text-zinc-400 py-12 italic">No savings records found</p>}
                </Card>
              </motion.div>
            )}

            {view === 'loans' && (
              <motion.div 
                key="loans"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-zinc-900">Loan Center</h3>
                    <p className="text-zinc-500">Apply for financial assistance</p>
                  </div>
                  <Button onClick={handleApplyLoan}>
                    <Plus className="w-4 h-4" />
                    Apply for Loan
                  </Button>
                </div>

                {user.role === 'admin' && adminLoans.length > 0 && (
                  <Card title="Pending Approvals" subtitle="Loans awaiting your review">
                    <div className="space-y-4">
                      {adminLoans.filter(l => l.status === 'pending').map((l) => (
                        <div key={l.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-zinc-200 font-bold">
                              {l.full_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-900">{l.full_name}</p>
                              <p className="text-xs text-zinc-500">Requested ${l.amount} @ {l.interest_rate}%</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="secondary" className="text-xs py-1.5">Reject</Button>
                            <Button onClick={() => handleApproveLoan(l.id)} className="text-xs py-1.5">Approve</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card title="Your Loan History">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Applied Date</th>
                        <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map((l) => (
                        <tr key={l.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors">
                          <td className="px-4 py-4 text-sm text-zinc-600">{new Date(l.applied_at).toLocaleDateString()}</td>
                          <td className="px-4 py-4 text-sm font-bold text-zinc-900">${l.amount}</td>
                          <td className="px-4 py-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                              l.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                              l.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loans.length === 0 && <p className="text-center text-zinc-400 py-12 italic">No loan history found</p>}
                </Card>
              </motion.div>
            )}

            {['members', 'meetings', 'settings'].includes(view) && (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                  <Settings className="w-10 h-10 text-zinc-300 animate-spin-slow" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Module Under Construction</h3>
                <p className="text-zinc-500 max-w-xs mt-2">We're working hard to bring you the {view} features soon.</p>
                <Button variant="secondary" className="mt-8" onClick={() => setView('dashboard')}>
                  Back to Dashboard
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
