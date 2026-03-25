"use client"
import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleReset = async () => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setMessage(error.message)
    else setMessage("Password updated successfully. You can now sign in.")
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Reset Your Password</h1>
      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button onClick={handleReset}>Update Password</button>
      <p>{message}</p>
    </div>
  )
}

