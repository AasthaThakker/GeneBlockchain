"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
    Shield,
    Lock,
    FileSearch,
    Activity,
    Dna,
    ArrowLeft,
} from "lucide-react"

export default function FeaturesPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-3 transition-opacity hover:opacity-80"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
                            <Dna className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xl font-bold text-foreground">GenShare</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/")}
                            className="gap-2 border-border text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Button>
                    </div>
                </div>
            </header>

            {/* Core Platform Features */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-foreground">Core Platform Features</h1>
                        <p className="mt-3 text-lg text-muted-foreground">
                            Built on Ethereum with IPFS storage and smart contract governance
                        </p>
                    </div>

                    <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                icon: Lock,
                                title: "Genomic Hash Registry",
                                desc: "SHA-256 hashes stored immutably on-chain. 100% tamper detection for every genomic file.",
                            },
                            {
                                icon: Shield,
                                title: "Dynamic Consent Engine",
                                desc: "Programmable, revocable, time-bound consent managed entirely through smart contracts.",
                            },
                            {
                                icon: FileSearch,
                                title: "Role-Based Access",
                                desc: "Decentralized identity with strict role separation. Researchers see only de-identified data.",
                            },
                            {
                                icon: Activity,
                                title: "Immutable Audit Trail",
                                desc: "Every access event recorded as a blockchain event. Full chronological traceability.",
                            },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <feature.icon className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="border-t border-border/50 bg-card/50 py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
                        <p className="mt-3 text-muted-foreground">
                            Three-layer architecture: Presentation, Blockchain, and Off-chain Storage
                        </p>
                    </div>

                    <div className="mt-16 grid gap-8 md:grid-cols-3">
                        {[
                            {
                                step: "01",
                                title: "Lab Uploads Encrypted Data",
                                desc: "VCF/FASTA files are encrypted with AES-256, stored on IPFS, and their SHA-256 hash is registered on-chain linked to a de-identified Patient ID.",
                            },
                            {
                                step: "02",
                                title: "Patient Controls Consent",
                                desc: "Patients grant or revoke time-bound access through smart contracts. No personal identity is ever exposed to researchers.",
                            },
                            {
                                step: "03",
                                title: "Researcher Accesses Data",
                                desc: "After consent validation on-chain, researchers access encrypted datasets. Every access event is logged immutably.",
                            },
                        ].map((item) => (
                            <div key={item.step} className="relative">
                                <div className="mb-4 font-mono text-4xl font-bold text-primary/20">{item.step}</div>
                                <h3 className="mb-3 text-lg font-semibold text-foreground">{item.title}</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Privacy Architecture */}
            <section className="border-t border-border/50 py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-foreground">Privacy Architecture</h2>
                        <p className="mt-3 text-muted-foreground">
                            Identity segregation ensures zero direct exposure of PII to researchers
                        </p>
                    </div>

                    <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-xl border border-border/50 bg-card">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/50 bg-secondary/50">
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Actor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Can Access
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                <tr>
                                    <td className="px-6 py-4 text-sm font-medium text-foreground">Patient</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        Own identity + genomic data + consent management
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 text-sm font-medium text-foreground">Lab / Pharmacy</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        Real identity + PID + DNA database key (uploader only)
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 text-sm font-medium text-foreground">Researcher</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        Only PID + de-identified genomic metadata
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 text-sm font-medium text-foreground">Blockchain</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        Only PID + hash + consent logic (no PII)
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/50 bg-card/50 py-12">
                <div className="mx-auto max-w-7xl px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-bold text-foreground">GenShare</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                        A Blockchain-Based Genomic Data Sharing Platform
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Ethereum Sepolia Testnet | IPFS Off-Chain Storage | HIPAA/GDPR Aligned
                    </p>
                </div>
            </footer>
        </div>
    )
}
