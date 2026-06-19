"use client";

import { Users, UserPlus, Search, Shield, ShieldAlert, Trash2, X, Edit, Lock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UsersClient({ users, currentUserId }: { users: any[], currentUserId?: string | null }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Invite form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("VIEWER");

  const router = useRouter();

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setUserToDelete(null);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (e) {
      alert("Error deleting user");
    } finally {
      setDeleting(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      });
      if (res.ok) {
        setShowInviteModal(false);
        setEmail("");
        setPassword("");
        setName("");
        setRole("VIEWER");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create user");
      }
    } catch (e) {
      alert("Error creating user");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between md:items-start space-y-4 md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-2">
            <Users size={24} className="text-indigo-600" />
            <span>Manage Users</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Control who has access to your AutoFeed dashboard.</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
        >
          <UserPlus size={16} />
          <span>Invite User</span>
        </button>
      </header>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center">
        <div className="w-full flex items-center gap-3">
          <div className="relative flex-1 max-w-2xl">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-700 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-4 px-6 font-bold text-sm text-slate-500 uppercase tracking-wider">User</th>
              <th className="py-4 px-6 font-bold text-sm text-slate-500 uppercase tracking-wider">Role</th>
              <th className="py-4 px-6 font-bold text-sm text-slate-500 uppercase tracking-wider">Joined</th>
              <th className="py-4 px-6 font-bold text-sm text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{user.name || "Unknown"}</div>
                      <div className="text-sm text-slate-500 font-medium">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border
                    ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                      user.role === 'EDITOR' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-slate-100 text-slate-700 border-slate-200'}`}
                  >
                    {user.role === 'ADMIN' && <ShieldAlert size={12} className="mr-1" />}
                    {user.role === 'EDITOR' && <Edit size={12} className="mr-1" />}
                    {user.role === 'VIEWER' && <Lock size={12} className="mr-1" />}
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-slate-500 font-medium" suppressHydrationWarning>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 text-right">
                  {user.id !== currentUserId && (
                    <button 
                      onClick={() => setUserToDelete(user)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-500">
                  No users found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus size={20} className="text-indigo-600"/>
                Invite User
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Secure password..." />
                <p className="text-xs text-slate-500 mt-1">Make sure to share this password securely with the user.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white">
                  <option value="VIEWER">Viewer (Read-only)</option>
                  <option value="EDITOR">Editor (Can manage workflows)</option>
                  <option value="ADMIN">Admin (Full Access)</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowInviteModal(false)} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
                  {submitting ? "Inviting..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete User?</h3>
            <p className="text-slate-500 mb-6">Are you sure you want to delete <strong>{userToDelete.email}</strong>? They will immediately lose access to the dashboard.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setUserToDelete(null)} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg flex-1">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="px-5 py-2.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex-1 disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
