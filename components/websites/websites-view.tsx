"use client";

import * as React from "react";
import { Code2, Eye, FileCheck2, Layers3, Pencil, Send, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { websiteProjects } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";

const statusTone = {
  Intake: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  "In Progress": "border-amber-300/30 bg-amber-300/10 text-amber-100",
  "QA Review": "border-amber-300/30 bg-amber-300/10 text-amber-100",
  "Compliance Review": "border-rose-300/30 bg-rose-500/15 text-rose-100",
  "Client Preview Ready": "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  "Revision Requested": "border-amber-300/30 bg-amber-300/10 text-amber-100",
  Delivered: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
};

export function WebsitesView() {
  const [projectId, setProjectId] = React.useState(websiteProjects[0].id);
  const project = websiteProjects.find((item) => item.id === projectId) ?? websiteProjects[0];
  const activePage = project.pages[0];
  const exportSnippet = `export default function ${project.leadName.replace(/[^a-zA-Z0-9]/g, "")}HomePage() {
  return (
    <main>
      <section>
        <h1>${activePage.sections[0]?.title ?? project.primaryGoal}</h1>
        <p>${activePage.sections[0]?.copy ?? project.brandStyle}</p>
      </section>
    </main>
  );
}`;

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
                <Layers3 className="h-3.5 w-3.5" />
                Website team workspace
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-normal text-zinc-50">Generate full website layout JSON, preview, edit, QA, and export.</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                The MVP generates structured pages for Home, About, Services, Contact, FAQ, and a local landing page, then blocks delivery until QA and compliance pass.
              </p>
            </div>
            <Button onClick={() => toast.success("Website agents queued", { description: "Intake, Builder 1, Builder 2, QA, and Compliance will run in order." })}>
              <Sparkles className="h-4 w-4" />
              Generate Website Draft
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Website Projects</CardTitle>
              <CardDescription>Four active project seeds with generation state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {websiteProjects.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setProjectId(item.id)}
                  className={cn(
                    "w-full rounded-[8px] border p-4 text-left transition",
                    project.id === item.id ? "border-emerald-300/35 bg-emerald-300/10" : "border-white/10 bg-white/5 hover:bg-white/8",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">{item.leadName}</p>
                      <p className="mt-1 truncate text-xs text-zinc-500">{item.packageName}</p>
                    </div>
                    <Badge className={statusTone[item.status]}>{item.status}</Badge>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                      <span>Progress</span>
                      <span>{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generator Actions</CardTitle>
              <CardDescription>Move drafts through QA, compliance, and client preview.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="secondary" onClick={() => toast.success("Marked ready for QA")}>
                <FileCheck2 className="h-4 w-4" />
                Mark Ready for QA
              </Button>
              <Button variant="secondary" onClick={() => toast.info("Compliance review queued")}>
                <ShieldCheck className="h-4 w-4" />
                Run Compliance Review
              </Button>
              <Button onClick={() => toast.success("Client preview marked ready")}>
                <Send className="h-4 w-4" />
                Mark Client Preview Ready
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{project.leadName}</CardTitle>
                <CardDescription>
                  {project.industry} - {project.packageName} - {formatCurrency(project.estimatedRevenue)}
                </CardDescription>
              </div>
              <Badge className={statusTone[project.status]}>{project.status}</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 xl:grid-cols-[1fr_0.82fr]">
                <div className="rounded-[8px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">Live Website Preview</p>
                      <p className="mt-1 text-xs text-zinc-500">{project.previewUrl}</p>
                    </div>
                    <Button size="sm" variant="secondary">
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-[8px] border border-white/10 bg-[#111310]">
                    <div className="flex items-center gap-2 border-b border-white/10 bg-black/25 px-4 py-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                      <span className="ml-2 truncate text-xs text-zinc-500">{activePage.slug}</span>
                    </div>
                    <div className="space-y-5 p-5">
                      <div className="rounded-[8px] border border-emerald-300/20 bg-emerald-300/10 p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">{project.industry}</p>
                        <h3 className="mt-3 text-2xl font-semibold tracking-normal text-zinc-50">{activePage.sections[0]?.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-zinc-300">{activePage.sections[0]?.copy}</p>
                        <Button size="sm" className="mt-4">
                          {activePage.sections[0]?.cta ?? "Request a quote"}
                        </Button>
                      </div>
                      {activePage.sections.slice(1).map((section) => (
                        <div key={section.id} className="rounded-[8px] border border-white/10 bg-white/6 p-4">
                          <p className="text-sm font-medium text-zinc-100">{section.title}</p>
                          <p className="mt-2 text-xs leading-5 text-zinc-400">{section.copy}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[8px] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-medium text-zinc-100">Website Intake Summary</p>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div>
                        <dt className="text-xs text-zinc-500">Goal</dt>
                        <dd className="mt-1 text-zinc-300">{project.primaryGoal}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-zinc-500">Brand style</dt>
                        <dd className="mt-1 text-zinc-300">{project.brandStyle}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-[8px] border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Pencil className="h-4 w-4 text-emerald-200" />
                      <p className="text-sm font-medium text-zinc-100">Edit Sections</p>
                    </div>
                    <div className="space-y-3">
                      {activePage.sections.map((section) => (
                        <div key={section.id}>
                          <label className="mb-1 block text-xs text-zinc-500">{section.title}</label>
                          <Textarea defaultValue={section.copy} className="min-h-24" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Generated Pages</CardTitle>
                <CardDescription>Home, About, Services, Contact, FAQ, and local landing pages are supported.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {["Home", "About", "Services", "Contact", "FAQ", "Local landing page"].map((page) => {
                  const generated = project.pages.some((item) => item.pageName === page);
                  return (
                    <div key={page} className="flex items-center justify-between rounded-[8px] border border-white/10 bg-white/5 px-3 py-3">
                      <span className="text-sm text-zinc-300">{page}</span>
                      <Badge className={generated ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-zinc-400/20 bg-zinc-400/10 text-zinc-300"}>
                        {generated ? "Generated" : "Queued"}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export as Next.js</CardTitle>
                <CardDescription>Mock export uses generated layout JSON as component input.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-[8px] border border-white/10 bg-black/30 p-4 text-xs leading-5 text-zinc-400">
                  {exportSnippet}
                </pre>
                <Button variant="secondary" className="mt-3 w-full" onClick={() => toast.success("Component export prepared")}>
                  <Code2 className="h-4 w-4" />
                  Export Components
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </section>
    </div>
  );
}
