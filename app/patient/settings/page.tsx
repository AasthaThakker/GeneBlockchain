"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/auth-context"
import { Shield, Wallet, Bell, User, Heart, Activity } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PatientSettings() {
  const { walletAddress, pid } = useAuth()
  const patientPid = pid || (walletAddress ? `PID-${walletAddress.slice(2, 8)}` : '')
  const [registrationDate, setRegistrationDate] = useState<string>("Loading...")
  // Demographic information state
  const [age, setAge] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [geographicRegion, setGeographicRegion] = useState<string>('')
  const [chronicDiseases, setChronicDiseases] = useState<string>('')
  const [medications, setMedications] = useState<string>('')
  const [familyHistory, setFamilyHistory] = useState<string>('')

  const handleSaveSettings = async () => {
    try {
      const response = await fetch(`/api/users/me?walletAddress=${walletAddress}&role=PATIENT`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: parseInt(age) || undefined,
          gender: gender || undefined,
          geographicRegion: geographicRegion || undefined,
          chronicDiseases: chronicDiseases || undefined,
          medications: medications || undefined,
          familyHistory: familyHistory || undefined,
        }),
      })

      if (response.ok) {
        alert('Settings saved successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to save settings: ${error.error}`)
      }
    } catch (error) {
      alert(`Error saving settings: ${(error as Error).message}`)
    }
  }

  useEffect(() => {
    if (!walletAddress) return
    fetch(`/api/users/me?walletAddress=${walletAddress}&role=PATIENT`)
      .then(r => r.json())
      .then(data => {
        if (data.user?.createdAt) {
          setRegistrationDate(new Date(data.user.createdAt).toLocaleDateString())
        } else {
          setRegistrationDate("N/A")
        }
        // Set demographic data if available
        if (data.user?.age) setAge(data.user.age.toString())
        if (data.user?.gender) setGender(data.user.gender)
        if (data.user?.geographicRegion) setGeographicRegion(data.user.geographicRegion)
        if (data.user?.chronicDiseases) setChronicDiseases(data.user.chronicDiseases)
        if (data.user?.medications) setMedications(data.user.medications)
        if (data.user?.familyHistory) setFamilyHistory(data.user.familyHistory)
      })
      .catch(() => setRegistrationDate("N/A"))
  }, [walletAddress])

  return (
    <DashboardShell role="patient">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and privacy preferences</p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Identity Card */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">De-Identified Identity</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Patient ID (PID)</Label>
              <Input value={patientPid} readOnly className="mt-1 border-border bg-secondary font-mono text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Registration Date</Label>
              <Input value={registrationDate} readOnly className="mt-1 border-border bg-secondary text-foreground" />
            </div>
          </div>
        </div>

        {/* Demographic Information Card */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Demographic Information</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Age</Label>
              <Input 
                value={age} 
                onChange={(e) => setAge(e.target.value)} 
                placeholder="Enter your age" 
                type="number" 
                min="0" 
                max="150"
                className="mt-1 border-border bg-card text-foreground" 
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="mt-1 border-border bg-card text-foreground">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Geographic Region</Label>
              <Input 
                value={geographicRegion} 
                onChange={(e) => setGeographicRegion(e.target.value)} 
                placeholder="e.g., South Asia" 
                className="mt-1 border-border bg-card text-foreground" 
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Chronic Diseases</Label>
              <Input 
                value={chronicDiseases} 
                onChange={(e) => setChronicDiseases(e.target.value)} 
                placeholder="e.g., Diabetes, Hypertension" 
                className="mt-1 border-border bg-card text-foreground" 
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Medications</Label>
              <Input 
                value={medications} 
                onChange={(e) => setMedications(e.target.value)} 
                placeholder="e.g., Insulin, Metformin" 
                className="mt-1 border-border bg-card text-foreground" 
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Family History</Label>
              <Input 
                value={familyHistory} 
                onChange={(e) => setFamilyHistory(e.target.value)} 
                placeholder="e.g., Heart disease, Cancer" 
                className="mt-1 border-border bg-card text-foreground" 
              />
            </div>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Wallet Connection</h2>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Connected Wallet Address</Label>
            <Input value={walletAddress || ''} readOnly className="mt-1 border-border bg-secondary font-mono text-foreground" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Network: Hardhat Local Network (Chain ID: 31337)
          </p>
        </div>

        {/* Notification Preferences */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Notification Preferences</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">New access requests</p>
                <p className="text-xs text-muted-foreground">Get notified when a researcher requests your data</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Consent expiry reminders</p>
                <p className="text-xs text-muted-foreground">Reminder 7 days before a consent expires</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Data access alerts</p>
                <p className="text-xs text-muted-foreground">Notified each time someone accesses your data</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSaveSettings} 
          className="w-fit bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Save Settings
        </Button>
      </div>
    </DashboardShell>
  )
}

