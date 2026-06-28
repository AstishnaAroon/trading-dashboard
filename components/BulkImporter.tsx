"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

interface StrategyOption {
  id: string;
  name: string;
}

interface AppField {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

// All standard fields supported by our Glide Private Ledger [DESIGN (5).md]
const APP_FIELDS: AppField[] = [
  { key: "pair", label: "Currency Pair / Symbol", required: true, description: "e.g. EUR/USD, GBP/USD, XAU/USD" },
  { key: "direction", label: "Direction (Buy/Sell)", required: true, description: "LONG (Buy) or SHORT (Sell)" },
  { key: "pl", label: "Net P&L ($)", required: true, description: "Monetary trade outcome" },
  { key: "date", label: "Entry Date & Time", required: false, description: "Timestamp of entry" },
  { key: "session", label: "Trading Session", required: false, description: "London, New York, Asian, etc." },
  { key: "entry_price", label: "Entry Price", required: false, description: "Exact entry quote price" },
  { key: "exit_price", label: "Exit Price", required: false, description: "Exact exit quote price" },
  { key: "pips", label: "Pips Gained/Lost", required: false, description: "Fractional pips calculation" },
  { key: "risk_pct", label: "Risk Percentage (%)", required: false, description: "Percent of balance at risk" },
  { key: "rr_actual", label: "Actual R:R", required: false, description: "Risk-to-Reward ratio achieved" },
  { key: "outcome", label: "Outcome", required: false, description: "WIN, LOSS, or BE" },
  { key: "emotion", label: "Trading Emotion", required: false, description: "Disciplined, Greedy, FOMO, etc." },
  { key: "notes", label: "Review Notes", required: false, description: "Detailed contextual logs" },
  { key: "strategy_name", label: "Strategy Name", required: false, description: "Links trade to a Playbook Strategy" },
];

export default function BulkImporter() {
  const { user } = useUser();
  const [step, setStep] = useState<"upload" | "map" | "confirm">("upload");
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);

  // CSV Parsing States
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});
  
  // Custom Fields Configuration States [3]
  const [customFields, setCustomFields] = useState<{ [key: string]: { active: boolean; type: "text" | "number" | "date" | "select" } }>({});

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

  // Safe, CSV-compliant parser (respects quotes containing commas!)
  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) {
        setErrorMsg("Failed to parse CSV. Make sure the file has headers.");
        return;
      }

      setCsvHeaders(headers);
      setCsvRows(rows);
      setErrorMsg("");

      // Auto pre-map headers with identical names
      const initialMapping: { [key: string]: string } = {};
      APP_FIELDS.forEach((field) => {
        const match = headers.find(
          (h) => h.toLowerCase() === field.key.toLowerCase() || h.toLowerCase().includes(field.key.toLowerCase())
        );
        if (match) initialMapping[field.key] = match;
      });

      // Initialize all unmapped columns as inactive text custom fields [3]
      const initialCustomFields: any = {};
      headers.forEach((h) => {
        const isMapped = Object.values(initialMapping).includes(h);
        if (!isMapped) {
          initialCustomFields[h] = { active: false, type: "text" };
        }
      });

      setMapping(initialMapping);
      setCustomFields(initialCustomFields);
      setStep("map");
    };

    reader.readAsText(file);
  };

  // Toggle custom field active state
  const handleToggleCustomField = (headerName: string) => {
    setCustomFields((prev) => ({
      ...prev,
      [headerName]: {
        ...prev[headerName],
        active: !prev[headerName]?.active,
      },
    }));
  };

  // Change custom field type (text, number, date, select) [3]
  const handleCustomFieldTypeChange = (headerName: string, type: "text" | "number" | "date" | "select") => {
    setCustomFields((prev) => ({
      ...prev,
      [headerName]: {
        ...prev[headerName],
        type,
      },
    }));
  };

  // Defensive Numeric Sanitizer (Strips out raw currency formatting like $2,500.00 to prevent db type crashes)
  const parseNumericSafe = (value: string | undefined): number | null => {
    if (!value) return null;
    // Remove dollar signs, commas, or spaces
    const cleaned = value.replace(/[$,\s]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  };

  // Execute the secure bulk database import [1, 3]
  const handleImport = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");

    const tradesPayload: any[] = [];

    // Loop through CSV rows and map data safely
    for (const row of csvRows) {
      const getRawValue = (fieldKey: string) => {
        const mappedHeader = mapping[fieldKey];
        if (!mappedHeader) return undefined;
        const colIdx = csvHeaders.indexOf(mappedHeader);
        return colIdx !== -1 ? row[colIdx] : undefined;
      };

      const pairVal = getRawValue("pair");
      const directionVal = getRawValue("direction")?.toUpperCase() || "LONG";
      const plVal = parseNumericSafe(getRawValue("pl")) || 0;

      if (!pairVal) continue; // Skip empty rows

      // Map direction safely
      const cleanDirection = directionVal.includes("SELL") || directionVal.includes("SHORT") ? "SHORT" : "LONG";

      // Map optional fields safely
      const dateVal = getRawValue("date");
      const sessionVal = getRawValue("session") || "London";
      const entryVal = parseNumericSafe(getRawValue("entry_price"));
      const exitVal = parseNumericSafe(getRawValue("exit_price"));
      const pipsVal = parseNumericSafe(getRawValue("pips"));
      const riskVal = parseNumericSafe(getRawValue("risk_pct"));
      const rrVal = parseNumericSafe(getRawValue("rr_actual"));
      const notesVal = getRawValue("notes") || null;
      const strategyNameVal = getRawValue("strategy_name");

      // DYNAMIC STRATEGY LOOKUP: Link the trade to a database strategy if the name matches! [3]
      let matchedStrategyId: string | null = null;
      if (strategyNameVal) {
        const match = strategies.find(
          (s) => s.name.toLowerCase() === strategyNameVal.toLowerCase() || s.name.toLowerCase().includes(strategyNameVal.toLowerCase())
        );
        if (match) matchedStrategyId = match.id;
      }

      // DYNAMIC TYPED CUSTOM FIELDS: Pack checked unmapped columns into a typed JSON object [3]
      const customFieldsJson: { [key: string]: { value: any; type: string } } = {};
      Object.keys(customFields).forEach((headerName) => {
        const fieldConfig = customFields[headerName];
        if (fieldConfig?.active) {
          const colIdx = csvHeaders.indexOf(headerName);
          if (colIdx !== -1 && row[colIdx]) {
            const rawVal = row[colIdx];
            let typedVal: any = rawVal;

            // Safe cast values based on their user-defined type [3]
            if (fieldConfig.type === "number") {
              typedVal = parseFloat(rawVal) || 0;
            } else if (fieldConfig.type === "date") {
              typedVal = new Date(rawVal).toISOString();
            }

            customFieldsJson[headerName] = {
              value: typedVal,
              type: fieldConfig.type, // Stores type metadata so we can render custom selectors in our admin/edit panels! [3]
            };
          }
        }
      });

      tradesPayload.push({
        user_id: user.id,
        date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
        pair: pairVal,
        direction: cleanDirection,
        session: sessionVal,
        strategy_id: matchedStrategyId,
        entry_price: entryVal,
        exit_price: exitVal,
        pips: pipsVal,
        pl: plVal,
        risk_pct: riskVal,
        rr_planned: null, // Keep null or calculate later
        rr_actual: rrVal,
        outcome: plVal >= 0 ? "WIN" : "LOSS", // Auto outcome fallback based on sanitized P&L
        notes: notesVal,
        custom_fields: customFieldsJson, // Securely written to PostgreSQL JSONB column [3]
        is_backtest: false,
      });
    }

    // Bulk insert to Supabase [3]
    const { error } = await supabase.from("trades").insert(tradesPayload);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message); // Exposes exact db compilation issues so we can catch them!
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
    setCustomFields({});
    setSuccess(false);
    setErrorMsg("");
  };

  return (
    <div className="w-full bg-slate border border-iron rounded-[10px] p-6 text-bone">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Bulk CSV Importer</h3>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777a88" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      {errorMsg && (
        <div className="bg-graphite border border-ember-gold text-ember-gold text-xs p-3 rounded-sm mb-4 text-center font-mono">
          Database Error: {errorMsg}
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#777a88" strokeWidth="1.5" className="mb-3">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <p className="text-sm font-semibold mb-1">Select CSV File</p>
            <p className="text-[11px] text-ash">Supports OANDA, TradingView, MetaTrader, or custom sheets.</p>
          </div>
        </div>
      )}

      {/* STEP 2: Custom Mapping & Type Builder Wizard [3] */}
      {step === "map" && (
        <div className="space-y-6">
          <div className="bg-graphite/40 border border-iron p-4 rounded-sm">
            <h4 className="text-xs font-bold text-bone uppercase mb-1">Map your columns</h4>
            <p className="text-[10px] text-ash leading-relaxed">
              We found <strong className="text-bone">{csvHeaders.length} columns</strong> and <strong className="text-bone">{csvRows.length} rows</strong>. Please connect your spreadsheet headers to our database parameters [3].
            </p>
          </div>

          <div className="space-y-5 max-h-[380px] overflow-y-auto pr-1 scrollbar-none">
            {/* Standard Fields Section */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-bold text-ash uppercase tracking-wider">Database Fields Mapping</h5>
              {APP_FIELDS.map((field) => {
                const isMapped = !!mapping[field.key];
                return (
                  <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-graphite border border-iron rounded-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-bone">{field.label}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                          field.required ? "bg-ember-gold/20 text-ember-gold" : "bg-steel text-pearl"
                        }`}>
                          {field.required ? "Required" : "Optional"}
                        </span>
                      </div>
                      <p className="text-[10px] text-ash mt-0.5">{field.description}</p>
                    </div>

                    <select
                      value={mapping[field.key] || ""}
                      onChange={(e) => {
                        const newMap = { ...mapping, [field.key]: e.target.value };
                        setMapping(newMap);
                        
                        // Recalculate unmapped columns
                        const newCustomFields = { ...customFields };
                        if (e.target.value) {
                          delete newCustomFields[e.target.value];
                        }
                        setCustomFields(newCustomFields);
                      }}
                      className="bg-inkwell border border-iron text-bone text-xs px-3 py-2 rounded-sm outline-none w-full sm:w-[180px] appearance-none"
                    >
                      <option value="">-- Ignored --</option>
                      {csvHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* DYNAMIC CUSTOM FIELDS SECTION with custom type builder dropdowns [3] */}
            <div className="pt-4 border-t border-iron/50 space-y-3">
              <h5 className="text-[11px] font-bold text-ash uppercase tracking-wider">
                Unmapped Columns (Smart Custom Fields)
              </h5>
              <p className="text-[10px] text-ash leading-relaxed">
                Check any remaining columns to create a brand-new custom field for your account, and choose its variable type [3]:
              </p>

              {csvHeaders.filter(h => !Object.values(mapping).includes(h)).length === 0 ? (
                <p className="text-xs text-ash italic text-center py-2">No unmapped columns remaining.</p>
              ) : (
                <div className="space-y-2">
                  {csvHeaders
                    .filter((h) => !Object.values(mapping).includes(h))
                    .map((h) => {
                      const alertConfig = customFields[h] || { active: false, type: "text" };
                      const isActive = alertConfig.active;

                      return (
                        <div key={h} className="flex items-center justify-between gap-4 p-3 bg-graphite border border-iron rounded-sm">
                          {/* Checked trigger */}
                          <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={(e) => {
                                setCustomFields({
                                  ...customFields,
                                  [h]: { active: e.target.checked, type: alertConfig.type || "text" }
                                });
                              }}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                              isActive ? "bg-white border-white text-inkwell" : "bg-inkwell border-iron"
                            }`}>
                              {isActive && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M1 4L4 7L9 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-bone truncate max-w-[120px]">{h}</span>
                          </label>

                          {/* Variable Type Builder Dropdown (Visible only if checked) [3] */}
                          {isActive && (
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-ash uppercase">Type:</span>
                              <select
                                value={alertConfig.type}
                                onChange={(e) => {
                                  setCustomFields({
                                    ...customFields,
                                    [h]: { active: true, type: e.target.value as any }
                                  });
                                }}
                                className="bg-inkwell border border-iron text-bone text-[11px] px-2 py-1 rounded-sm outline-none appearance-none"
                              >
                                <option value="text">Text (String)</option>
                                <option value="number">Number (Float)</option>
                                <option value="date">Date & Time</option>
                                <option value="select">Dropdown</option>
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-iron/50">
            <button
              onClick={handleReset}
              className="flex-1 bg-graphite border border-iron text-bone h-12 font-bold text-[13px] rounded-sm hover:bg-slate transition-all cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !mapping.pair || !mapping.direction || !mapping.pl}
              className="flex-grow bg-white text-inkwell h-12 font-bold text-[13px] rounded-sm hover:bg-bone transition-all uppercase tracking-wider cursor-pointer"
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-lg text-bone">Import Completed Successfully</h4>
            <p className="text-xs text-ash leading-relaxed">
              We have successfully decrypted and written <strong className="text-bone">{importCount} trades</strong> directly to your private secure ledger [3]!
            </p>
            {Object.values(customFields).filter(f => f.active).length > 0 && (
              <p className="text-[10px] text-ember-gold leading-relaxed">
                Smart mapping registered <strong className="text-white">{Object.values(customFields).filter(f => f.active).length} custom fields</strong> into your account's JSONB block [3]!
              </p>
            )}
          </div>
          <button
            onClick={handleReset}
            className="w-full bg-white text-inkwell h-12 font-bold text-[13px] rounded-sm hover:bg-bone transition-colors uppercase tracking-wider cursor-pointer"
          >
            Start New Import
          </button>
        </div>
      )}
    </div>
  );
}