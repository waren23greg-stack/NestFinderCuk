"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

// ✅ Use your Supabase project URL + anon key
const supabase = createClient(
  "https://mtycapgbtvpczvswpjpo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // replace with your anon key
)

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState("")
  const [msgType, setMsgType] = useState("") // "err" | "ok"
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1))
    const access_token = params.get("access_token")
    const refresh_token = params.get("refresh_token")
    const type = params.get("type")

    console.log("DEBUG reset-password params:", { type, access_token })

    if (type !== "recovery") {
      setMsgType("err")
      setMessage("This link is not a valid password reset link.")
      return
    }

    if (!access_token || !refresh_token) {
      setMsgType("err")
      setMessage("Reset link is missing tokens.")
      return
    }

    // ✅ Establish Supabase session
    (async () => {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token })
      if (error) {
        setMsgType("err")
        setMessage("Session error: " + error.message)
      } else {
        setMsgType("ok")
        setMessage("Session confirmed. Enter your new password below.")
        setReady(true)
      }
    })()
  }, [])

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMsgType("err")
      setMessage("Password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirm) {
      setMsgType("err")
      setMessage("Passwords do not match.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (error) {
      setMsgType("err")
      setMessage("Update failed: " + error.message)
      return
    }

    setMsgType("ok")
    setMessage("Password updated! Redirecting to sign in…")
    await supabase.auth.signOut()
    setTimeout(() => {
      window.location.href = "/login.html" // adjust if your login route differs
    }, 1500)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FDF9F4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost', sans-serif", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "#fff", border: "1px solid rgba(184,149,90,0.18)", padding: "2.5rem 2rem" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", fontWeight: 400, color: "#16130E", marginBottom: ".4rem", textAlign: "center" }}>Reset Password</h1>
        <p style={{ fontSize: ".78rem", color: "#8A8070", textAlign: "center", marginBottom: "1.75rem" }}>Enter a new password for your account</p>

        {message && (
          <div style={{
            padding: ".75rem 1rem",
            marginBottom: "1.25rem",
            fontSize: ".78rem",
            borderLeft: `3px solid ${msgType === "err" ? "#e57373" : "#B8955A"}`,
            background: msgType === "err" ? "#fff5f5" : "#fdf9f4",
            color: msgType === "err" ? "#c0392b" : "#4A4438",
          }}>
            {message}
          </div>
        )}

        {ready && (
          <>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", border: "1px solid #ccc" }}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={{ width: "100%", marginBottom: "1.5rem", padding: "0.75rem", border: "1px solid #ccc" }}
            />
            <button onClick={handleReset} disabled={loading} style={{ width: "100%", height: 48, background: "#B8955A", color: "#fff", border: "none" }}>
              {loading ? "Updating…" : "Update Password"}
            </button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <a href="/login.html" style={{ fontSize: ".72rem", color: "#B8955A", textDecoration: "none" }}>← Back to Sign In</a>
        </div>
      </div>
    </div>
  )
}
