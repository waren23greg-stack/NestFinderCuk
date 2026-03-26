"use client"
import { useEffect, useState } from "react"

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState("")
  const [msgType, setMsgType] = useState("") // "err" | "ok" | ""
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Hash is only available client-side — never on the server
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get("access_token")
    const refresh_token = params.get("refresh_token")
    const type = params.get("type")

    console.log("DEBUG reset-password params:", { type, has_access: !!access_token })

    // Must be a recovery link — anything else is invalid
    if (type !== "recovery") {
      setMsgType("err")
      setMessage("This link is not a valid password reset link. Please request a new one.")
      return
    }

    if (!access_token || !refresh_token) {
      setMsgType("err")
      setMessage("Reset link is missing tokens. Please request a new one.")
      return
    }

    // Use the same sb client that index.html uses (loaded via window.sb)
    // Supabase stores the session from the URL hash tokens
    const SUPABASE_URL = "https://mtycapgbtvpczvswpjpo.supabase.co"
    const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWNhcGdidHZwY3p2c3dwanBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjQxNDgsImV4cCI6MjA4OTYwMDE0OH0.owJeYO2kHs1F82kPQeML6uHUarchKT_ybe79OBBV6wM"

    // Store tokens so updateUser call is authenticated
    localStorage.setItem("sb-token", access_token)
    localStorage.setItem("sb-refresh", refresh_token)

    // Verify session works
    fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.id) {
          setMsgType("ok")
          setMessage("Session confirmed. Enter your new password below.")
          setReady(true)
        } else {
          setMsgType("err")
          setMessage("Session error: " + (d.message || "Token invalid or expired."))
        }
      })
      .catch(() => {
        setMsgType("err")
        setMessage("Could not verify session. Please request a new reset link.")
      })
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
    const SUPABASE_URL = "https://mtycapgbtvpczvswpjpo.supabase.co"
    const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWNhcGdidHZwY3p2c3dwanBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjQxNDgsImV4cCI6MjA4OTYwMDE0OH0.owJeYO2kHs1F82kPQeML6uHUarchKT_ybe79OBBV6wM"
    const token = localStorage.getItem("sb-token")

    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "PUT",
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: newPassword }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok || data.error) {
      setMsgType("err")
      setMessage("Update failed: " + (data.message || data.error || "Unknown error"))
      return
    }

    // Success — clear tokens and redirect to login
    localStorage.removeItem("sb-token")
    localStorage.removeItem("sb-refresh")
    setMsgType("ok")
    setMessage("Password updated! Redirecting to sign in…")
    setTimeout(() => {
      window.location.href = "/login.html"
    }, 1800)
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FDF9F4",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Jost', sans-serif",
      padding: "1.5rem",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet"/>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "#fff",
        border: "1px solid rgba(184,149,90,0.18)",
        padding: "2.5rem 2rem",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 44, height: 44,
            border: "1.5px solid #B8955A",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto .75rem",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8955A" strokeWidth="1.8">
              <path d="M3 9.5L12 3l9 6.5V21H3z"/>
              <path d="M9 21v-7h6v7"/>
            </svg>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#16130E" }}>
            Nest<span style={{ color: "#B8955A" }}>Finder</span> CUK
          </div>
        </div>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.6rem",
          fontWeight: 400,
          color: "#16130E",
          marginBottom: ".4rem",
          textAlign: "center",
        }}>Reset Password</h1>
        <p style={{ fontSize: ".78rem", color: "#8A8070", textAlign: "center", marginBottom: "1.75rem" }}>
          Enter a new password for your account
        </p>

        {/* Status message */}
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

        {/* Form — only shown once session is confirmed */}
        {ready && (
          <>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{
                display: "block", fontSize: ".62rem", letterSpacing: ".12em",
                textTransform: "uppercase", color: "#8A8070", marginBottom: ".4rem",
              }}>New Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: "100%", height: 46,
                  padding: "0 12px",
                  border: "1px solid rgba(184,149,90,0.38)",
                  fontFamily: "'Jost', sans-serif",
                  fontSize: ".9rem",
                  color: "#16130E",
                  outline: "none",
                  background: "#fff",
                }}
                onFocus={e => e.target.style.borderColor = "#B8955A"}
                onBlur={e => e.target.style.borderColor = "rgba(184,149,90,0.38)"}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "block", fontSize: ".62rem", letterSpacing: ".12em",
                textTransform: "uppercase", color: "#8A8070", marginBottom: ".4rem",
              }}>Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                style={{
                  width: "100%", height: 46,
                  padding: "0 12px",
                  border: "1px solid rgba(184,149,90,0.38)",
                  fontFamily: "'Jost', sans-serif",
                  fontSize: ".9rem",
                  color: "#16130E",
                  outline: "none",
                  background: "#fff",
                }}
                onFocus={e => e.target.style.borderColor = "#B8955A"}
                onBlur={e => e.target.style.borderColor = "rgba(184,149,90,0.38)"}
              />
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                width: "100%", height: 48,
                background: loading ? "#D4B483" : "#B8955A",
                color: "#fff", border: "none",
                fontFamily: "'Jost', sans-serif",
                fontSize: ".76rem", fontWeight: 500,
                letterSpacing: ".1em", textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background .26s",
              }}
            >
              {loading ? "Updating…" : "Update Password"}
            </button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <a href="/login.html" style={{
            fontSize: ".72rem", color: "#B8955A",
            textDecoration: "none", letterSpacing: ".04em",
          }}>← Back to Sign In</a>
        </div>
      </div>
    </div>
  )
}
