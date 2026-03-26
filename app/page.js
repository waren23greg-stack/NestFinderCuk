// app/page.js
// Your real app lives in index.html (plain HTML).
// This Next.js route just redirects / to index.html so they don't conflict.
import { redirect } from "next/navigation"

export default function Home() {
  redirect("/index.html")
}
