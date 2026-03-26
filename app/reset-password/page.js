"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://mtycapgbtvpczvswpjpo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // your anon key
)

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState("")
  const [msgType, setMsgType] = useState("")
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1))
    const access_token = params.get("access_token")
    const refresh_token = params.get("refresh_token")
    const type = params.get("type")

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

    // ✅ Use Supabase SDK to set session
    supabase.auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) {
          setMsgType("err")
          setMessage("Session error: " + error.message)
        } else {
          setMsgType("ok")
          setMessage("Session confirmed. Enter your new password below.")
          setReady(true)
        }
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
      window.location.href = "/login.html" // or /sign-in if that’s your route
    }, 1800)
  }

  // … keep your JSX form exactly as you pasted …
}
