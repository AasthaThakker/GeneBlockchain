"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type UserRole = "patient" | "lab" | "researcher" | null

interface AuthState {
  role: UserRole
  walletAddress: string | null
  isConnected: boolean
  email: string | null
  isAdmin: boolean
  pid: string | null
  labId: string | null
  labName: string | null
  researcherId: string | null
  displayName: string | null
  institution: string | null
}

interface AuthContextType extends AuthState {
  connectWallet: (role?: "patient" | "lab" | "researcher") => Promise<void>
  loginWithEmail: (email: string, password: string, role: "lab" | "researcher") => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const initialState: AuthState = {
  role: null,
  walletAddress: null,
  isConnected: false,
  email: null,
  isAdmin: false,
  pid: null,
  labId: null,
  labName: null,
  researcherId: null,
  displayName: null,
  institution: null,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(initialState)

  const connectWallet = useCallback(async (role: "patient" | "lab" | "researcher" = "patient") => {
    if (typeof window === "undefined" || !(window as unknown as Record<string, unknown>).ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
    }

    try {
      const ethereum = (window as unknown as Record<string, unknown>).ethereum as {
        request: (args: { method: string }) => Promise<string[]>
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" })
      if (!accounts[0]) {
        throw new Error("No accounts found in MetaMask.")
      }

      const response = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: accounts[0], role: role.toUpperCase() }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to authenticate with server.")
      }

      const data = await response.json()
      setAuth({
        role: data.user.role.toLowerCase() as UserRole,
        walletAddress: data.user.walletAddress,
        isConnected: true,
        email: data.user.email || null,
        isAdmin: data.user.isAdmin || false,
        pid: data.user.pid || null,
        labId: data.user.labId || null,
        labName: data.user.lab?.name || null,
        researcherId: data.user.researcherId || null,
        displayName: data.user.displayName || null,
        institution: data.user.researcher?.institution || null,
      })
    } catch (error) {
      console.error("Wallet connection failed:", error)
      throw error
    }
  }, [])

  const loginWithEmail = useCallback(
    async (email: string, password: string, role: "lab" | "researcher") => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: role.toUpperCase() }),
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || 'Invalid credentials')
        }

        const data = await response.json()
        setAuth({
          role: data.user.role.toLowerCase() as UserRole,
          walletAddress: data.user.walletAddress,
          isConnected: true,
          email: data.user.email || null,
          isAdmin: data.user.isAdmin || false,
          pid: data.user.pid || null,
          labId: data.user.labId || null,
          labName: data.user.lab?.name || null,
          researcherId: data.user.researcherId || null,
          displayName: data.user.displayName || null,
          institution: data.user.researcher?.institution || null,
        })
      } catch (error) {
        console.error("Email login failed:", error)
        throw error
      }
    },
    []
  )

  const logout = useCallback(() => {
    setAuth(initialState)
  }, [])

  return (
    <AuthContext.Provider value={{ ...auth, connectWallet, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
