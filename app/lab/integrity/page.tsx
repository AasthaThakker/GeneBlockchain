"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { CheckCircle2, AlertTriangle, Shield, Hash, Database, Link, Upload, RefreshCw } from "lucide-react"

interface EncryptedFile {
  fileId: string
  fileName: string
  fileType: string
  fileHash: string
  pid: string
  labId: string
  labName: string
  uploadDate: string
  blockchainTxHash?: string
  onChainRecordIndex?: number
  status: string
  tags: string[]
  fileSize: number
}

type VerifyResult = { 
  fileId: string; 
  fileName: string;
  status: "pass" | "fail" | "pending";
  localIntegrity?: boolean;
  blockchainIntegrity?: boolean | null;
  blockchainHash?: string;
  fileHash?: string;
  error?: string;
}

export default function LabIntegrity() {
  const { walletAddress, labId } = useAuth()
  const [records, setRecords] = useState<EncryptedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<VerifyResult[]>([])
  const [verifying, setVerifying] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [unregisteredCount, setUnregisteredCount] = useState(0)

  useEffect(() => {
    if (!walletAddress) return
    const queryLabId = labId || walletAddress
    
    // Fetch records and unregistered count
    Promise.all([
      fetch(`/api/files?labId=${queryLabId}`).then(r => r.json()),
      fetch(`/api/register-blockchain?labId=${queryLabId}`).then(r => r.json())
    ]).then(([filesData, unregisteredData]) => {
      setRecords(filesData.data || [])
      setUnregisteredCount(unregisteredData.count || 0)
    }).catch(error => {
      console.error('Failed to fetch data:', error)
    }).finally(() => setLoading(false))
  }, [walletAddress, labId])

  const registerOnBlockchain = async () => {
    setRegistering(true)
    
    try {
      // Get files that need to be registered
      const response = await fetch(`/api/register-blockchain?labId=${labId || walletAddress}`)
      const data = await response.json()
      
      if (!data.success || data.data.length === 0) {
        alert('No files need to be registered on blockchain.')
        return
      }
      
      // Register all unregistered files
      const registerResponse = await fetch('/api/register-blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: data.data.map((file: any) => file.fileId)
        })
      })
      
      const registerData = await registerResponse.json()
      
      if (registerData.success) {
        alert(`Successfully registered ${registerData.summary.successful} files on blockchain. ${registerData.summary.failed} files failed.`)
        
        // Refresh data
        const queryLabId = labId || walletAddress
        Promise.all([
          fetch(`/api/files?labId=${queryLabId}`).then(r => r.json()),
          fetch(`/api/register-blockchain?labId=${queryLabId}`).then(r => r.json())
        ]).then(([filesData, unregisteredData]) => {
          setRecords(filesData.data || [])
          setUnregisteredCount(unregisteredData.count || 0)
        })
      } else {
        alert('Failed to register files on blockchain: ' + (registerData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Blockchain registration failed:', error)
      alert('Failed to register files on blockchain. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  const runVerification = async () => {
    setVerifying(true)
    setResults([])
    
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: records.map(r => r.fileId)
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setResults(data.verificationResults)
      }
    } catch (error) {
      console.error('Verification failed:', error)
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <DashboardShell role="lab">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading records...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="lab">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Integrity Verification</h1>
        <p className="mt-1 text-muted-foreground">Verify that on-chain hashes match the original genomic file hashes. Detects any tampering.</p>
      </div>

      <div className="mb-8 rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Hash Verification Engine</h3>
            <p className="mt-1 text-sm text-muted-foreground">Compares SHA-256 hash stored on blockchain with the re-computed hash from IPFS file</p>
          </div>
          <div className="flex items-center gap-3">
            {unregisteredCount > 0 && (
              <Button 
                onClick={registerOnBlockchain} 
                disabled={registering} 
                variant="outline"
                className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 gap-2"
              >
                {registering ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Register {unregisteredCount} on Blockchain
                  </>
                )}
              </Button>
            )}
            <Button onClick={runVerification} disabled={verifying || records.length === 0} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Shield className="h-4 w-4" />
              {verifying ? "Verifying..." : "Run Verification"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {records.map((record) => {
          const result = results.find(r => r.fileId === record.fileId)
          const isPending = verifying && !result
          return (
            <div key={record.fileId} className={`rounded-xl border p-6 transition-all ${result?.status === "pass" ? "border-success/30 bg-success/5" : result?.status === "fail" ? "border-destructive/30 bg-destructive/5" : "border-border/50 bg-card"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${result?.status === "pass" ? "bg-success/15" : result?.status === "fail" ? "bg-destructive/15" : "bg-secondary"}`}>
                    {result?.status === "pass" ? <CheckCircle2 className="h-5 w-5 text-success" /> : result?.status === "fail" ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Hash className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-bold text-foreground">{record.fileId}</p>
                      <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">{record.fileType}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">PID: {record.pid}</p>
                  </div>
                </div>
                <div className="text-right">
                  {isPending ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-sm">Verifying...</span>
                    </div>
                  ) : result?.status === "pass" ? (
                    <span className="text-sm font-medium text-success">Integrity Verified</span>
                  ) : result?.status === "fail" ? (
                    <span className="text-sm font-medium text-destructive">Tamper Detected</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Awaiting verification</span>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    Local Storage Hash (SHA-256)
                  </p>
                  <p className="mt-0.5 max-w-full truncate font-mono text-xs text-foreground">{record.fileHash}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Link className="h-3 w-3" />
                    Blockchain TX
                  </p>
                  <p className="mt-0.5 max-w-full truncate font-mono text-xs text-primary">{record.blockchainTxHash}</p>
                </div>
              </div>
              {result && (
                <div className="mt-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Local Integrity</p>
                      <p className={`font-medium ${result.localIntegrity ? 'text-success' : 'text-destructive'}`}>
                        {result.localIntegrity ? 'Valid' : 'Invalid'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Blockchain Integrity</p>
                      <p className={`font-medium ${result.blockchainIntegrity === true ? 'text-success' : result.blockchainIntegrity === false ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {result.blockchainIntegrity === true ? 'Valid' : result.blockchainIntegrity === false ? 'Invalid' : '- Not Available'}
                      </p>
                    </div>
                  </div>
                  
                  {result.blockchainHash && (
                    <div className="border-t pt-4">
                      <p className="text-muted-foreground mb-2">Hash Comparison</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-muted-foreground">MongoDB Hash</p>
                          <p className="font-mono text-xs break-all text-foreground">{result.fileHash}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Blockchain Hash</p>
                          <p className={`font-mono text-xs break-all ${result.fileHash === result.blockchainHash ? 'text-success' : 'text-destructive'}`}>
                            {result.blockchainHash}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className={`font-medium ${result.fileHash === result.blockchainHash ? 'text-success' : 'text-destructive'}`}>
                          {result.fileHash === result.blockchainHash ? 'Hashes Match' : 'Hashes Mismatch'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </DashboardShell>
  )
}
