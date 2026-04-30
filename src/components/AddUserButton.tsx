"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TEAMS, type TeamCode } from "@/lib/teams"

const INITIAL_FORM = { name: "", email: "", password: "", role: "EDITOR", team: "ZAL" as TeamCode }

export default function AddUserButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const teamRequired = form.role !== "CEO"

  async function handleCreate() {
    if (!form.name || !form.email || !form.password) return
    setLoading(true)
    setError("")
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        team: teamRequired ? form.team : null,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to create user")
      setLoading(false)
      return
    }
    router.refresh()
    setForm(INITIAL_FORM)
    setOpen(false)
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-bloom text-white text-sm px-4 py-2 rounded-lg hover:bg-bloom-dark transition-colors"
      >
        Add Team Member
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold text-gray-900 mb-4">Add Team Member</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bloom"
                  placeholder="Full name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bloom"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bloom"
                  placeholder="Set a temporary password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bloom"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="STRATEGIST">Strategist</option>
                  <option value="CEO">CEO</option>
                </select>
              </div>
              {teamRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                  <select
                    value={form.team}
                    onChange={(e) => setForm((f) => ({ ...f, team: e.target.value as TeamCode }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bloom"
                  >
                    {Object.values(TEAMS).map((t) => (
                      <option key={t.code} value={t.code}>
                        {form.role === "STRATEGIST" ? t.strategistName : t.editorName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !form.name || !form.email || !form.password}
                className="bg-bloom text-white text-sm px-4 py-2 rounded-lg hover:bg-bloom-dark disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
