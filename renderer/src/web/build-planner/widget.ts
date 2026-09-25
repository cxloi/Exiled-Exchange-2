import type { Widget, Anchor } from "../overlay/widgets.js";

export interface BuildItem {
  id: number;
  name: string;
  url: string;
  note?: string
}


export interface BuildStage {
  id: number;
  levelStart: number;
  levelEnd: number;
  file: string | null; // stored name in /builds, beside config
  fileName: string; // original .build file name
  tech?: string; // mechanic explanation
  items?: BuildItem[]; // core item trade links
}

export interface BuildEntry {
  id: number;
  name: string;
  stages: BuildStage[];
}

export interface BuildPlannerWidget extends Widget {
  anchor: Anchor;
  targetDir: string;
  autoLoad: boolean;
  activeBuildId: number | null;
  builds: BuildEntry[];
}

export function nextId(items: Array<{ id: number }>): number {
  return Math.max(0, ...items.map((_) => _.id)) + 1;
}

async function post(action: string, body: BodyInit, headers: HeadersInit) {
  const res = await fetch(`/build-planner/${action}`, {
    method: "POST",
    headers,
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? res.statusText);
  return json;
}

const jsonPost = (action: string, data: unknown) =>
  post(action, JSON.stringify(data), { "Content-Type": "application/json" });

export async function uploadBuild(file: File): Promise<string> {
  const { name } = await post("upload", file, {
    "Content-Type": "application/octet-stream",
    "X-File-Name": encodeURIComponent(file.name),
  });
  return name as string;
}

export const loadBuild = (targetDir: string, stage: BuildStage) =>
  jsonPost("load", { targetDir, file: stage.file });

export const resetBuilds = (targetDir: string) =>
  jsonPost("reset", { targetDir });

export const deleteStoredBuild = (file: string) =>
  jsonPost("delete", { targetDir: "/", file }).catch(() => {});
