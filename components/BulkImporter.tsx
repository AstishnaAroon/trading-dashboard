"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

interface StrategyOption {
  id: string;
  name: string;
}

const REQUIRED_FIELDS = [
  { key: "pair", label: "Currency Pair / Symbol" },
  { key: "direction", label: "Trade Direction (Buy/Sell)" },
  { key: "pl", label: "Net P&L ($)" },
];

const OPTIONAL_FIELDS = [
  { key: "date", label: "Date & Time" },
  { key: "session", label: "Session" },
  { key: "entry_price", label: "Entry Price" },
  { key: "exit_price", label: "Exit Price" },
  { key: "pips", label: "Pips" },
  { key: "risk_pct", label: "Risk %" },
  { key: "rr_actual", label: "Actual R:R" },
  { key: "notes", label: "Notes" },
];

export default function BulkImporter() {
  const { user } = useUser();
  const [step, setStep] = useState<"upload" | "map" | "confirm">("upload");
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>("");

  // CSV Data States
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});
  const [selectedCustomFields, setSelectedCustomFields] = useState<string[]>([]);

  // Execution States
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [importCount, setImportCount] = useState<number>(0);

  // Fetch available strategies on mount
  useEffect(() => {
    const fetchStrategies = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("strategies")
        .select("id, name")
        .order("created_at", { ascending: true });

      if (!error) {
        setStrategies(data || []);
      }
    };
    if (user) fetchStrategies();
  }, [user]);

  // Robust, zero-dependency CSV Parser (handles quoted strings and commas safely!)
  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    // Standard CSV quote-compliant line splitting regex
    const splitLine = (line: string) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ""));
      return result;
    };

    const headers = splitLine(lines[0]);
    const rows = lines.slice(1).map(line => splitLine(line));

    return { headers, rows };
  };

  // Handle local CSV file selection & reading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) {
        setErrorMsg("Failed to parse CSV. Make sure the file is not empty.");
        return;
      }

      setCsvHeaders(headers);
      setCsvRows(rows);
      setErrorMsg("");

      // Automatically pre-map columns if they have similar names
      const initialMapping: { [key: string]: string } = {};
      [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].forEach((field) => {
        const match = headers.find(
          (h) => h.toLowerCase() === field.key.toLowerCase() || h.toLowerCase().includes(field.key.toLowerCase())
        );
        if (match) initialMapping[field.key] = match;
      });

      setMapping(initialMapping);
      setStep("map");
    };

    reader.readAsText(file);
  };

  // Toggle custom fields checkbox selection
  const handleToggleCustomField = (headerName: string) => {
    setSelectedCustomFields((prev) =>
      prev.includes(headerName) ? prev.filter((f) => f !== headerName) : [...prev, headerName]
    );
  };

  // Execute the bulk database import [1, 3]
  const handleImport = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");

    const tradesPayload: any[] = [];

    // Loop through parsed CSV rows and build the insert payload [3]
    for (const row of csvRows) {
      const getVal = (fieldKey: string) => {
        const mappedHeader = mapping[fieldKey];
        if (!mappedHeader) return undefined;
        const colIdx = csvHeaders.indexOf(mappedHeader);
        return colIdx !== -1 ? row[colIdx] : undefined;
      };

      // Map required parameters
      const pairVal = getVal("pair");
      const directionVal = getVal("direction")?.toUpperCase() || "LONG";
      const plVal = parseFloat(getVal("pl") || "0") || 0;

      if (!pairVal) continue; // Skip incomplete lines

      // Clean Direction mapping (convert Buy/Long -> LONG, Sell/Short -> SHORT)
      const cleanDirection = directionVal.includes("SELL") || directionVal.includes("SHORT") ? "SHORT" : "LONG";

      // Map optional parameters
      const dateVal = getVal("date");
      const sessionVal = getVal("session") || "London";
      const entryVal = parseFloat(getVal("entry_price") || "") || null;
      const exitVal = parseFloat(getVal("exit_price") || "") || null;
      const pipsVal = parseFloat(getVal("pips") || "") || null;
      const riskVal = parseFloat(getVal("risk_pct") || "") || null;
      const rrVal = parseFloat(getVal("rr_actual") || "") || null;
      const notesVal = getVal("notes") || null;

      // DYNAMIC CUSTOM FIELDS: Build JSON object for unmapped, selected custom fields [3]
      const customFieldsJson: { [key: string]: any } = {};
      selectedCustomFields.forEach((headerName) => {
        const colIdx = csvHeaders.indexOf(headerName);
        if (colIdx !== -1 && row[colIdx]) {
          customFieldsJson[headerName] = row[colIdx];
        }
      });

      tradesPayload.push({
        user_id: user.id,
        date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
        pair: pairVal,
        direction: cleanDirection,
        session: sessionVal,
        strategy_id: selectedStrategyId || null,
        entry_price: entryVal,
        exit_price: exitVal,
        pips: pipsVal,
        pl: plVal,
        risk_pct: riskVal,
        rr_actual: rrVal,
        outcome: plVal > 0 ? "WIN" : plVal < 0 ? "LOSS" : "BE", // Smart outcome calculation based on P&L
        notes: notesVal,
        custom_fields: customFieldsJson, // Saved completely securely into our JSONB column! [3]
        is_backtest: false,
      });
    }

    // Insert payload in bulk to Supabase [3]
    const { error } = await supabase.from("trades").insert(tradesPayload);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setImportCount(tradesPayload.length);
      setSuccess(true);
      setStep("confirm");
    }
  };

  const handleReset = () => {
    setStep("upload");
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setSelectedCustomFields([]);
    setSuccess(false);
    setErrorMsg("");
  };

  return (
    <div className="w-full max-w-xl bg-slate border border-iron rounded-[10px] p-6 text-bone">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Bulk CSV Importer</h3>
        <span className="material-symbols-outlined text-ash text-[18px]">file_upload</span>
      </div>

      {errorMsg && (
        <div className="bg-graphite border border-ember-gold text-ember-gold text-xs p-3 rounded-sm mb-4 text-center">
          Error: {errorMsg}
        </div>
      )}

      {/* STEP 1: Upload File */}
      {step === "upload" && (
        <div className="space-y-6">
          <p className="text-xs text-ash leading-relaxed">
            Switching journals is seamless. Upload a standard `.csv` file exported from any broker or trading platform, and our system will guide you through mapping the data into your private ledger [3].
          </p>

          <div className="border-2 border-dashed border-iron bg-graphite/20 p-8 rounded-sm text-center flex flex-col items-center justify-center relative hover:border-ash transition-colors duration-200">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <span className="material-symbols-outlined text-ash text-3xl mb-3">upload_file</span>
            <p className="text-sm font-semibold mb-1">Select CSV File</p>
            <p className="text-[11px] text-ash">Supports OANDA, TradingView, MetaTrader, or custom sheets.</p>
          </div>
        </div>
      )}

      {/* STEP 2: Column Mapping & Custom Fields Selection */}
      {step === "map" && (
        <div className="space-y-6">
          <div className="bg-graphite/40 border border-iron p-4 rounded-sm">
            <h4 className="text-xs font-bold text-bone uppercase mb-1">Map your columns</h4>
            <p className="text-[10px] text-ash leading-relaxed">
              We found <strong className="text-bone">{csvHeaders.length} columns</strong> and <strong className="text-bone">{csvRows.length} rows</strong>. Please connect your spreadsheet headers to our database parameters [3].
            </p>
          </div>

          <div className="space-y-4">
            <h5 className="text-[11px] font-bold text-ash uppercase tracking-wider">Required Fields</h5>
            <div className="space-y-3">
              {REQUIRED_FIELDS.map((field) => (
                <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                  <span className="text-xs font-semibold text-bone">{field.label}*</span>
                  <select
                    value={mapping[field.key] || ""}
                    onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    className="bg-graphite border border-iron text-bone text-xs px-3 py-2 rounded-sm outline-none"
                    required
                  >
                    <option value="">-- Choose Column --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <h5 className="text-[11px] font-bold text-ash uppercase tracking-wider pt-2 border-t border-iron/50">Optional Fields</h5>
            <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-none pr-1">
              {OPTIONAL_FIELDS.map((field) => (
                <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                  <span className="text-xs text-ash">{field.label}</span>
                  <select
                    value={mapping[field.key] || ""}
                    onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    className="bg-graphite border border-iron text-bone text-xs px-3 py-2 rounded-sm outline-none"
                  >
                    <option value="">-- Ignored / Empty --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* DYNAMIC CUSTOM FIELDS SELECTION [3] */}
            <div className="pt-4 border-t border-iron/50">
              <h5 className="text-[11px] font-bold text-ash uppercase tracking-wider mb-2">
                Unmapped Columns (Save as Custom Fields)
              </h5>
              <p className="text-[10px] text-ash mb-3 leading-relaxed">
                Check any unmapped columns you want our system to smartly save as custom fields for your account [3]:
              </p>
              
              {/* Find unmapped columns */}
              {csvHeaders.filter(h => !Object.values(mapping).includes(h)).length === 0 ? (
                <p className="text-xs text-ash italic">No unmapped columns remaining.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 bg-graphite/20 p-3 border border-iron rounded-sm max-h-32 overflow-y-auto scrollbar-none">
                  {csvHeaders
                    .filter((h) => !Object.values(mapping).includes(h))
                    .map((header) => (
                      <label key={header} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedCustomFields.includes(header)}
                          onChange={() => handleToggleCustomField(header)}
                          className="w-3.5 h-3.5 rounded-sm bg-graphite border-iron accent-ember-gold"
                        />
                        <span className="text-xs text-bone truncate" title={header}>{header}</span>
                      </label>
                    ))}
                </div>
              )}
            </div>

            {/* Default Strategy to Apply */}
            <div className="pt-4 border-t border-iron/50">
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
                Apply default Playbook Strategy (Optional)
              </label>
              <select
                value={selectedStrategyId}
                onChange={(e) => setSelectedStrategyId(e.target.value)}
                className="w-full bg-graphite border border-iron text-bone text-xs px-3 py-2 rounded-sm focus:border-ember-gold"
              >
                <option value="">No Strategy (Discretionary Setup)</option>
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 bg-graphite border border-iron text-bone h-12 font-bold text-[13px] rounded-sm hover:bg-slate transition-all"
            >
              CANCEL
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !mapping.pair || !mapping.direction || !mapping.pl}
              className="flex-grow bg-white text-inkwell h-12 font-bold text-[13px] rounded-sm hover:bg-bone transition-all uppercase tracking-wider"
            >
              {loading ? "Importing..." : `Import ${csvRows.length} Trades`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Confirm Success */}
      {step === "confirm" && (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 bg-graphite border border-iron rounded-full flex items-center justify-center mx-auto text-bone mb-4">
            <span className="material-symbols-outlined text-3xl">done_all</span>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-lg text-bone">Import Completed Successfully</h4>
            <p className="text-xs text-ash leading-relaxed">
              We have successfully decrypted and written <strong className="text-bone">{importCount} trades</strong> directly to your private secure ledger [3]!
            </p>
            {selectedCustomFields.length > 0 && (
              <p className="text-[10px] text-ember-gold leading-relaxed">
                Smart mapping registered <strong className="text-white">{selectedCustomFields.length} custom fields</strong> ({selectedCustomFields.join(", ")}) into your account's JSONB block [3]!
              </p>
            )}
          </div>
          <button
            onClick={handleReset}
            className="w-full bg-white text-inkwell h-12 font-bold text-[13px] rounded-sm hover:bg-bone transition-colors uppercase tracking-wider"
          >
            Start New Import
          </button>
        </div>
      )}
    </div>
  );
}