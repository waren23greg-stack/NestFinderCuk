"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1))
    const access_token = params.get("access_token")
    const refresh_token = params.get("refresh_token")

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) setMessage("Session error: " + error.message)
          else setMessage("Session established. Enter your new password.")
        })
    } else {
      setMessage("Reset link invalid or expired. Request a new one.")
    }
  }, [])

  const handleReset = async () => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setMessage("Update error: " + error.message)
    else {
      setMessage("Password updated successfully. Please sign in with your new password.")
      await supabase.auth.signOut()
    }
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
