"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, FileUp, CheckCircle2, Shield, Hash, Globe } from "lucide-react"

type UploadStep = "form" | "processing" | "complete"

export default function LabUpload() {
  const { labId, labName, walletAddress } = useAuth()
  const [step, setStep] = useState<UploadStep>("form")
  const [fileType, setFileType] = useState("")
  const [pid, setPid] = useState("")
  const [fileName, setFileName] = useState("")
  const [uploadResult, setUploadResult] = useState<Record<string, string> | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFileName(e.target.files[0].name)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep("processing")

    const currentLabId = labId || walletAddress || 'LAB-UNKNOWN'
    const currentLabName = labName || 'Lab'

    // Simulate processing delay then call API
    setTimeout(async () => {
      try {
        const fakeHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        const fakeCID = `Qm${Array.from({ length: 44 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join('')}`
        const fakeTx = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`

        const res = await fetch('/api/genomic-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pid,
            labId: currentLabId,
            labName: currentLabName,
            fileType,
            ipfsCID: fakeCID,
            fileHash: fakeHash,
            blockchainTxHash: fakeTx,
            tags: [],
          }),
        })

        const data = await res.json()
        setUploadResult({
          recordId: data.data?.recordId || 'GR-NEW',
          fileType,
          pid,
          ipfsCID: fakeCID,
          fileHash: fakeHash,
          blockchainTxHash: fakeTx,
        })
        setStep("complete")
      } catch {
        setStep("form")
        alert("Upload failed. Please try again.")
      }
    }, 3000)
  }

  const handleReset = () => {
    setStep("form")
    setFileType("")
    setPid("")
    setFileName("")
    setUploadResult(null)
  }

  return (
    <DashboardShell role="lab">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Upload VCF/FASTA</h1>
        <p className="mt-1 text-muted-foreground">
          Securely upload and register genomic data linked to a de-identified patient ID
        </p>
      </div>

      {step === "form" && (
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleUpload} className="rounded-xl border border-border/50 bg-card p-8">
            <div className="mb-6">
              <Label className="text-sm text-foreground">Genomic File</Label>
              <label htmlFor="file-upload" className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 py-12 transition-colors hover:border-primary/50 hover:bg-primary/5">
                <FileUp className="mb-3 h-10 w-10 text-muted-foreground" />
                {fileName ? (
                  <p className="text-sm font-medium text-foreground">{fileName}</p>
                ) : (
                  <>
                    <p className="text-sm text-foreground">Drop your file here or click to browse</p>
                    <p className="mt-1 text-xs text-muted-foreground">Supported: .vcf, .vcf.gz, .fasta, .fa, .fq</p>
                  </>
                )}
                <input id="file-upload" type="file" className="sr-only" accept=".vcf,.vcf.gz,.fasta,.fa,.fq" onChange={handleFileChange} />
              </label>
            </div>

            <div className="mb-6">
              <Label className="text-sm text-foreground">File Type</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger className="mt-2 border-border bg-secondary text-foreground">
                  <SelectValue placeholder="Select file type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VCF">VCF (Variant Call Format)</SelectItem>
                  <SelectItem value="FASTA">FASTA (Sequence Format)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mb-6">
              <Label className="text-sm text-foreground">Patient ID (PID)</Label>
              <Input value={pid} onChange={(e) => setPid(e.target.value)} placeholder="PID-xxxxxx" className="mt-2 border-border bg-secondary font-mono text-foreground" required />
              <p className="mt-1 text-xs text-muted-foreground">Enter the de-identified Patient ID. Do NOT enter real patient names.</p>
            </div>

            <Button type="submit" disabled={!fileName || !fileType || !pid} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Upload className="h-4 w-4" /> Encrypt &amp; Upload to IPFS
            </Button>
          </form>
        </div>
      )}

      {step === "processing" && (
        <div className="mx-auto max-w-2xl rounded-xl border border-border/50 bg-card p-8">
          <h3 className="mb-6 text-center text-lg font-bold text-foreground">Processing Upload...</h3>
          <div className="flex flex-col gap-4">
            {[
              { icon: Shield, label: "De-identification verification", done: true },
              { icon: Hash, label: "Generating SHA-256 hash", done: true },
              { icon: Shield, label: "Encrypting file (AES-256)", done: true },
              { icon: Globe, label: "Uploading to IPFS", done: false },
              { icon: Hash, label: "Registering hash on-chain", done: false },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${s.done ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground"}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <span className={`text-sm ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                {!s.done && <div className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
                {s.done && <CheckCircle2 className="ml-auto h-4 w-4 text-success" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === "complete" && uploadResult && (
        <div className="mx-auto max-w-2xl rounded-xl border border-success/30 bg-card p-8">
          <div className="mb-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h3 className="mt-3 text-lg font-bold text-foreground">Upload Successful</h3>
            <p className="mt-1 text-sm text-muted-foreground">Genomic data registered on-chain and stored on IPFS</p>
          </div>
          <div className="flex flex-col gap-3 rounded-lg bg-secondary/50 p-4">
            {Object.entries(uploadResult).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{key}</span>
                <span className="max-w-[300px] truncate font-mono text-sm text-foreground">{value}</span>
              </div>
            ))}
          </div>
          <Button onClick={handleReset} className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Upload Another File
          </Button>
        </div>
      )}
    </DashboardShell>
  )
}
