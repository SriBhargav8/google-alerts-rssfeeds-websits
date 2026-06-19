import { prisma } from "@/lib/db/client";
import { User, Mail, Clock, Key } from "lucide-react";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export default async function ProfilePage() {
  const user = await prisma.user.findFirst();

  async function updatePassword(formData: FormData) {
    "use server";
    const current = formData.get("current") as string;
    const newPass = formData.get("new") as string;
    const confirm = formData.get("confirm") as string;

    if (!newPass || newPass !== confirm) return;
    
    const dbUser = await prisma.user.findFirst();
    if (!dbUser) return;
    
    const isValid = await bcrypt.compare(current, dbUser.passwordHash);
    if (!isValid) return;

    const hashed = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { passwordHash: hashed }
    });
    
    revalidatePath("/profile");
  }

  async function updateProfile(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    
    if (!name || !role) return;
    
    const dbUser = await prisma.user.findFirst();
    if (!dbUser) return;
    
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { name, role }
    });
    
    revalidatePath("/profile");
    revalidatePath("/dashboard", "layout");
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">User Profile</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage your personal account and security.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <form action={updateProfile} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 text-center">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg mb-4">
              <span className="text-3xl font-bold">{(user?.name || "Admin").substring(0, 2).toUpperCase()}</span>
            </div>
            
            <div className="space-y-3 mt-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-left mb-1">Name</label>
                <input type="text" name="name" required defaultValue={user?.name || "Admin User"} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-bold text-slate-900 transition-all text-center" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-left mb-1">Tag / Role</label>
                <input type="text" name="role" required defaultValue={user?.role || "Administrator"} className="w-full px-3 py-1.5 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-indigo-600 bg-indigo-50 transition-all text-center" />
              </div>
              <button type="submit" className="w-full mt-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-md text-xs font-bold transition-colors">
                Save Profile
              </button>
            </div>
          </form>
          
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="text-slate-400" size={18} />
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Email Address</p>
                <p className="font-medium text-slate-900 truncate">{user?.email || "admin@example.com"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Clock className="text-slate-400" size={18} />
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Last Login / Activity</p>
                <p className="font-medium text-slate-900">
                  {user?.updatedAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(user.updatedAt)) : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <form action={updatePassword} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><Key size={20} /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
                <p className="text-sm text-slate-500">Ensure your account is using a long, random password.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Current Password</label>
                <input type="password" name="current" required placeholder="••••••••" className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">New Password</label>
                  <input type="password" name="new" required placeholder="••••••••" className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                  <input type="password" name="confirm" required placeholder="••••••••" className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" />
                </div>
              </div>
              <div className="pt-4 flex justify-end items-center">
                <button type="submit" className="bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                  Update Password
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
