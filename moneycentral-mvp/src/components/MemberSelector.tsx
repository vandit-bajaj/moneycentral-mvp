import React, { useState } from 'react';
import type { FamilyMember } from '@/types/portfolio';
import { useAddMember } from '@/hooks/useMembers';
import { toast } from 'react-hot-toast';

interface MemberSelectorProps {
  familyMembers: FamilyMember[];
  selectedFamilyMemberId: string;
  setSelectedFamilyMemberId: (id: string) => void;
  userId: string;
}

export function MemberSelector({
  familyMembers,
  selectedFamilyMemberId,
  setSelectedFamilyMemberId,
  userId,
}: MemberSelectorProps) {
  const [newMemberName, setNewMemberName] = useState('');
  const addMemberMutation = useAddMember();

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMemberName.trim();
    if (!name) return;

    try {
      await addMemberMutation.mutateAsync({ name, userId });
      setNewMemberName('');
      toast.success(`${name} added to family office successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add family member');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Family Members Office */}
      <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 backdrop-blur-md shadow-xl transition-all duration-200 hover:border-zinc-800">
        <h2 className="mb-4 text-base font-semibold text-white flex items-center gap-2">
          <span>👨‍👩‍👧‍👦</span> Family Members Office
        </h2>
        <form onSubmit={handleAddMember} className="flex gap-3">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Enter member's name (e.g. Mom, Dad)"
            className="flex-1 rounded-xl border border-zinc-750 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            required
          />
          <button
            type="submit"
            disabled={addMemberMutation.isPending}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {addMemberMutation.isPending ? "Adding..." : "Add"}
          </button>
        </form>
      </div>

      {/* Filter Dropdown */}
      <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 backdrop-blur-md shadow-xl flex flex-col justify-center transition-all duration-200 hover:border-zinc-800">
        <label className="mb-2 block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Filter Portfolio view
        </label>
        <select
          value={selectedFamilyMemberId}
          onChange={(e) => setSelectedFamilyMemberId(e.target.value)}
          className="w-full rounded-xl border border-zinc-750 bg-zinc-900/60 px-4 py-3.5 text-sm text-white outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
        >
          <option value="ALL">All Family (Combined Portfolio)</option>
          {familyMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}'s Portfolio
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
