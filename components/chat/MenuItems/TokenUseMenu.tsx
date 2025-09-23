"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coins, LoaderCircle, CornerDownRight, CornerDownLeft } from "lucide-react";
import { getMessagesByChatId } from "@/app/(authenticated)/langchain-chat/lib/actions";

type Totals = { prompt: number; completion: number; total: number; count: number };

type Props = {
  chatId?: string;
  onDropdownOpen: () => void;
  onTokenUpdate?: (totals: Totals) => void;
  loading?: boolean;
};

const TokenUseMenu = ({ chatId, onDropdownOpen, onTokenUpdate, loading = false }: Props) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals>({
    prompt: 0,
    completion: 0,
    total: 0,
    count: 0,
  });

  const loadTotals = async () => {
    if (!chatId) return;
    setBusy(true);
    setErr(null);
    try {
      const rows = await getMessagesByChatId(chatId);
      let prompt = 0, completion = 0, total = 0, count = 0;
      for (const r of rows ?? []) {
        if ((r.role || "").toLowerCase() !== "assistant") continue;
        const p = Number(r.prompt_tokens ?? r.prompttokens ?? r.promptTokens ?? 0);
        const c = Number(r.completion_tokens ?? r.completiontokens ?? r.completionTokens ?? 0);
        const t = Number(r.total_tokens ?? r.totaltokens ?? r.totalTokens ?? 0);
        prompt += Number.isFinite(p) ? p : 0;
        completion += Number.isFinite(c) ? c : 0;
        total += Number.isFinite(t) ? t : 0;
        count += 1;
      }
      const next = { prompt, completion, total, count };
      setTotals(next);
      onTokenUpdate?.(next);
    } catch (e: any) {
      setErr(e?.message || "Failed to load token usage");
    } finally {
      setBusy(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div>
      <DropdownMenu
        onOpenChange={(open) => {
          if (open) {
            onDropdownOpen();
            void loadTotals();
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span>Token Use</span>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-[300px]" side="bottom" align="end">
          <DropdownMenuGroup className="max-h-[400px] overflow-y-auto">
            {loading || busy ? (
              <div className="flex items-center justify-center p-4">
                <LoaderCircle className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading token usage…</span>
              </div>
            ) : err ? (
              <div className="p-4">
                <p className="text-sm text-red-500">{err}</p>
              </div>
            ) : !chatId ? (
              <div className="p-4">
                <p className="text-sm text-muted-foreground">No chat selected.</p>
              </div>
            ) : (
              <div className="p-3">
                <div className="text-sm font-medium mb-2">Token Usage</div>

                {/* Prompt row */}
                <div className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CornerDownRight className="w-4 h-4" />
                    <span>Prompt Tokens</span>
                  </div>
                  <div className="font-semibold tabular-nums">{fmt(totals.prompt)}</div>
                </div>
                <div className="border-t my-1"></div>

                {/* Completion row */}
                <div className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CornerDownLeft className="w-4 h-4" />
                    <span>Completion Tokens</span>
                  </div>
                  <div className="font-semibold tabular-nums">{fmt(totals.completion)}</div>
                </div>
                <div className="border-t my-1"></div>

                {/* Total row */}
                <div className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 text-center">∑</span>
                    <span className="font-medium">Total Tokens</span>
                  </div>
                  <div className="font-semibold tabular-nums">{fmt(totals.total)}</div>
                </div>
              </div>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TokenUseMenu;
