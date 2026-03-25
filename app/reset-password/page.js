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
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Hash is only available client-side
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get("access_token")
    const refresh_token = params.get("refresh_token")
    const type = params.get("type")

    console.log("DEBUG: URL params", Object.fromEntries(params.entries()))

    // 🔴 FIX: Only proceed if this is actually a recovery link
    if (type !== "recovery") {
      setMessage("This link is not a valid password reset link.")
      return
    }

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token })
        .then(({ data, error }) => {
          console.log("DEBUG: setSession result", { data, error })
          if (error) {
            setMessage("Session error: " + error.message)
          } else {
            setMessage("Session established. Enter your new password.")
            setReady(true) // 🔴 FIX: Only show form when session is confirmed
          }
        })
    } else {
      setMessage("Reset link invalid or expired. Please request a new one.")
      console.log("DEBUG: No tokens found in URL")
    }
  }, [])

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.")
      return
    }

    console.log("DEBUG: Attempting password update")
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    console.log("DEBUG: updateUser result", { data, error })

    if (error) {
      setMessage("Update error: " + error.message)
    } else {
      setMessage("Password updated! Redirecting to sign in...")
      await supabase.auth.signOut()
      // 🔴 FIX: Explicit redirect after reset instead of letting middleware decide
      setTimeout(() => {
        window.location.href = "/sign-in"
      }, 1500)
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Reset Your Password</h1>
      <p>{message}</p>
      {/* 🔴 FIX: Only show form when session is ready */}
      {ready && (
        <>
          <input
            type="password"
            placeholder="New password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button onClick={handleReset}>Update Password</button>
        </>
      )}
    </div>
  )
}
