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
  { key: "pips", label: "Pips Gained/Lost", required: false, description: "Fractional pips" },
  { key: "risk_pct", label: "Risk Percentage (%)", required: false, description: "Percent of balance at risk" },
  { key: "rr_planned", label: "Planned R:R", required: false, description: "Expected Risk-to-Reward" },
  { key: "rr_actual", label: "Actual R:R", required: false, description: "Risk-to-Reward ratio achieved" },
  { key: "outcome", label: "Outcome", required: false, description: "WIN, LOSS, or BE" },
  { key: "emotion", label: "Trading Emotion", required: false, description: "Disciplined, FOMO, etc." },
  { key: "confluence_score", label: "Confluence Score (0-10)", required: false, description: "Strategy rating" },
  { key: "notes", label: "Review Notes", required: false, description: "Detailed contextual logs" },
  { key: "strategy_name", label: "Strategy Name", required: false, description: "Links trade to a Playbook Strategy" },
];

interface CustomFieldConfig {
  active: boolean;
  type: "text" | "number" | "select" | "multi-select" | "date" | "formula";
  formulaString?: string;
}

export default function BulkImporter() {
  const { user } = useUser();
  const [step, setStep] = useState<"upload" | "map" | "confirm">("upload");
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);

  // CSV Data States
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});
  
  // Custom Notion-style properties config state [3]
  const [customFields, setCustomFields] = useState<{ [key: string]: CustomFieldConfig }>({});

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

      const initialCustomFields: { [key: string]: CustomFieldConfig } = {};
      headers.forEach((h) => {
        const isMapped = Object.values(initialMapping).includes(h);
        if (!isMapped) {
          initialCustomFields[h] = { active: false, type: "text", formulaString: "" };
        }
      });

      setMapping(initialMapping);
      setCustomFields(initialCustomFields);
      setStep("map");
    };

    reader.readAsText(file);
  };

  const handleToggleCustomField = (headerName: string) => {
    setCustomFields((prev) => ({
      ...prev,
      [headerName]: {
        ...prev[headerName],
        active: !prev[headerName]?.active,
      },
    }));
  };

  const handleCustomFieldTypeChange = (headerName: string, type: any) => {
    setCustomFields((prev) => ({
      ...prev,
      [headerName]: {
        ...prev[headerName],
        type,
      },
    }));
  };

  const handleFormulaChange = (headerName: string, formula: string) => {
    setCustomFields((prev) => ({
      ...prev,
      [headerName]: {
        ...prev[headerName],
        formulaString: formula,
      },
    }));
  };

  // Safe-sanitized evaluation of custom formulas (prevents arbitrary injection) [1]
  const evaluateFormulaSafe = (formulaStr: string, variables: { [key: string]: number }): number => {
    let processed = formulaStr;
    Object.keys(variables).forEach((key) => {
      const value = variables[key] !== null && !isNaN(variables[key]) ? variables[key] : 0;
      processed = processed.replaceAll(`{${key}}`, value.toString());
    });

    try {
      // Security: Strip out any characters that aren't numbers or basic math operators (+ - * / ( ) .)
      const sanitized = processed.replace(/[^0-9+\-*/().\s]/g, "");
      // Evaluate the clean math string safely
      const computed = Function(`"use strict"; return (${sanitized})`)();
      return isNaN(computed) ? 0 : computed;
    } catch (e) {
      console.error("Formula parsing failed:", e);
      return 0;
    }
  };

  const parseNumericSafe = (value: string | undefined): number => {
    if (!value) return 0;
    const cleaned = value.replace(/[$,\s]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Fixed: Parameters successfully typed as row: string[] to clear the TypeScript assignment error [1, 2]
  const processRow = (row: string[], strategiesList: StrategyOption[]) => {
    const getRawValue = (fieldKey: string) => {
      const mappedHeader = mapping[fieldKey];
      if (!mappedHeader) return undefined;
      const colIdx = csvHeaders.indexOf(mappedHeader);
      return colIdx !== -1 ? row[colIdx] : undefined;
    };

    const pairVal = getRawValue("pair") || "";
    const directionVal = getRawValue("direction")?.toUpperCase() || "LONG";
    const plVal = parseNumericSafe(getRawValue("pl"));

    const cleanDirection = directionVal.includes("SELL") || directionVal.includes("SHORT") ? "SHORT" : "LONG";

    const dateVal = getRawValue("date");
    const sessionVal = getRawValue("session") || "London";
    const entryVal = parseNumericSafe(getRawValue("entry_price")) || null;
    const exitVal = parseNumericSafe(getRawValue("exit_price")) || null;
    const pipsVal = parseNumericSafe(getRawValue("pips")) || null;
    const riskVal = parseNumericSafe(getRawValue("risk_pct")) || null;
    const rrPlannedVal = parseNumericSafe(getRawValue("rr_planned")) || null;
    const rrActualVal = parseNumericSafe(getRawValue("rr_actual")) || null;
    const confluenceVal = parseInt(getRawValue("confluence_score") || "") || null;
    const emotionVal = getRawValue("emotion") || "disciplined";
    const notesVal = getRawValue("notes") || null;
    const strategyNameVal = getRawValue("strategy_name");

    let matchedStrategyId: string | null = null;
    if (strategyNameVal) {
      const match = strategiesList.find(
        (s) => s.name.toLowerCase() === strategyNameVal.toLowerCase() || s.name.toLowerCase().includes(strategyNameVal.toLowerCase())
      );
      if (match) matchedStrategyId = match.id;
    }

    const formulaVariables: { [key: string]: number } = {
      entry_price: entryVal || 0,
      exit_price: exitVal || 0,
      pips: pipsVal || 0,
      pl: plVal,
      risk_pct: riskVal || 0,
      rr_planned: rrPlannedVal || 0,
      rr_actual: rrActualVal || 0,
    };

    const customFieldsJson: { [key: string]: { value: any; type: string; formula?: string } } = {};
    Object.keys(customFields).forEach((headerName) => {
      const fieldConfig = customFields[headerName];
      if (fieldConfig?.active) {
        const colIdx = csvHeaders.indexOf(headerName);
        let rawVal = colIdx !== -1 ? row[colIdx] : undefined;
        let typedVal: any = rawVal || "";

        if (fieldConfig.type === "formula" && fieldConfig.formulaString) {
          typedVal = evaluateFormulaSafe(fieldConfig.formulaString, formulaVariables);
        } else if (fieldConfig.type === "number" && rawVal) {
          typedVal = parseNumericSafe(rawVal);
        } else if (fieldConfig.type === "multi-select" && rawVal) {
          typedVal = rawVal.split(";").map((s) => s.trim());
        }

        customFieldsJson[headerName] = {
          value: typedVal,
          type: fieldConfig.type,
          ...(fieldConfig.type === "formula" ? { formula: fieldConfig.formulaString } : {}),
        };
      }
    });

    return {
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
      rr_planned: rrPlannedVal,
      rr_actual: rrActualVal,
      confluence_score: confluenceVal,
      emotion: emotionVal,
      outcome: plVal >= 0 ? "WIN" : "LOSS",
      notes: notesVal,
      custom_fields: customFieldsJson,
      is_backtest: false,
    };
  };

  const handleImport = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");

    const tradesPayload = csvRows
      .map((row) => processRow(row, strategies))
      .filter((t) => t.pair !== "");

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

  // Fixed: Moved handleReset back inside the main component scope! [1, 2]
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
            Switching journals is seamless. Upload a standard `.csv` file, map your headers, and our system will dynamically build custom properties to match your layout [3].
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

      {/* STEP 2: Notion-Style Property Mapping & Type Builder */}
      {step === "map" && (
        <div className="space-y-6">
          <div className="bg-graphite/40 border border-iron p-4 rounded-sm">
            <h4 className="text-xs font-bold text-bone uppercase mb-1">Notion-Style Property Mapping</h4>
            <p className="text-[10px] text-ash leading-relaxed">
              We found <strong className="text-bone">{csvHeaders.length} columns</strong> and <strong className="text-bone">{csvRows.length} rows</strong> [3]. Connect your headers, or build custom typed properties below [3].
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
                        
                        // Clear from custom fields if mapped to system fields
                        const newCustomFields = { ...customFields };
                        if (e.target.value) {
                          delete newCustomFields[e.target.value];
                        }
                        setCustomFields(newCustomFields);
                      }}
                      className="bg-inkwell border border-iron text-bone text-xs px-3 py-2 rounded-sm outline-none w-full sm:w-[180px] appearance-none"
                    >
                      <option value="">-- Click to Map --</option>
                      {csvHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* DYNAMIC CUSTOM FIELDS SELECTION with Notion Property Types [3] */}
            <div className="pt-4 border-t border-iron/50 space-y-3">
              <h5 className="text-[11px] font-bold text-ash uppercase tracking-wider">
                Unmapped Columns (Notion Property Builder)
              </h5>
              <p className="text-[10px] text-ash leading-relaxed">
                Check any remaining columns to create a brand-new custom property, and select its Notion type [3]:
              </p>

              {csvHeaders.filter(h => !Object.values(mapping).includes(h)).length === 0 ? (
                <p className="text-xs text-ash italic text-center py-2">No unmapped columns remaining.</p>
              ) : (
                <div className="space-y-3">
                  {csvHeaders
                    .filter((h) => !Object.values(mapping).includes(h))
                    .map((h) => {
                      const fieldConfig = customFields[h] || { active: false, type: "text", formulaString: "" };
                      const isActive = fieldConfig.active;

                      return (
                        <div key={h} className="p-3 bg-graphite border border-iron rounded-sm space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            {/* Checkbox trigger */}
                            <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => {
                                  setCustomFields({
                                    ...customFields,
                                    [h]: { ...fieldConfig, active: e.target.checked }
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
                              <span className="text-xs font-semibold text-bone truncate max-w-[150px]">{h}</span>
                            </label>

                            {/* Property Type Dropdown */}
                            {isActive && (
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-ash uppercase">Notion Type:</span>
                                <select
                                  value={fieldConfig.type}
                                  onChange={(e) => {
                                    handleCustomFieldTypeChange(h, e.target.value as any);
                                  }}
                                  className="bg-inkwell border border-iron text-bone text-[11px] px-2 py-1 rounded-sm outline-none appearance-none"
                                >
                                  <option value="text">Text (String)</option>
                                  <option value="number">Number</option>
                                  <option value="select">Select (Dropdown)</option>
                                  <option value="multi-select">Multi-Select</option>
                                  <option value="date">Date & Time</option>
                                  <option value="formula">Formula (f)</option>
                                </select>
                              </div>
                            )}
                          </div>

                          {/* IF TYPE IS FORMULA: Show custom math compiler panel [3] */}
                          {isActive && fieldConfig.type === "formula" && (
                            <div className="bg-inkwell border border-iron p-3 rounded-sm space-y-2">
                              <label className="block text-[9px] font-black text-ember-gold uppercase tracking-wider">
                                Write Mathematical Formula (f)
                              </label>
                              <input
                                type="text"
                                value={fieldConfig.formulaString || ""}
                                onChange={(e) => handleFormulaChange(h, e.target.value)}
                                placeholder="e.g. ({exit_price} - {entry_price}) * 10000"
                                className="w-full bg-graphite border border-iron text-bone font-mono text-[11px] p-2 rounded-sm outline-none"
                              />
                              <p className="text-[9px] text-ash leading-relaxed">
                                Available variables: <code className="text-white font-mono">{`{entry_price}`}</code>, <code className="text-white font-mono">{`{exit_price}`}</code>, <code className="text-white font-mono">{`{pips}`}</code>, <code className="text-white font-mono">{`{pl}`}</code>, <code className="text-white font-mono">{`{risk_pct}`}</code>, <code className="text-white font-mono">{`{rr_actual}`}</code>.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* PREVIEW LEDGER DATA SHEET PORTAL [3] */}
            {csvRows.length > 0 && Object.keys(mapping).length >= 3 && (
              <div className="pt-4 border-t border-iron/50 space-y-2">
                <h5 className="text-[11px] font-bold text-ash uppercase tracking-wider">
                  Pre-Flight Entry Sheet Preview (Row 1)
                </h5>
                <p className="text-[10px] text-ash leading-relaxed">
                  Below is exactly how your first spreadsheet row will map and parse in PostgreSQL before running the bulk import [3]:
                </p>
                <div className="bg-inkwell border border-iron p-4 rounded-sm text-xs font-mono space-y-1 max-h-40 overflow-y-auto pr-1">
                  <p><strong className="text-ash">Pair:</strong> <span className="text-bone">{processRow(csvRows[0], strategies).pair}</span></p>
                  <p><strong className="text-ash">Direction:</strong> <span className="text-bone">{processRow(csvRows[0], strategies).direction}</span></p>
                  <p><strong className="text-ash">Sanitized P&L:</strong> <span className="text-bone">${processRow(csvRows[0], strategies).pl}</span></p>
                  <p><strong className="text-ash">Entry Timestamp:</strong> <span className="text-bone">{processRow(csvRows[0], strategies).date}</span></p>
                  {Object.keys(processRow(csvRows[0], strategies).custom_fields).map((key) => {
                    const customFieldObj = processRow(csvRows[0], strategies).custom_fields[key];
                    return (
                      <p key={key}>
                        <strong className="text-ember-gold">Custom ({key} - {customFieldObj.type}):</strong>{" "}
                        <span className="text-white">{JSON.stringify(customFieldObj.value)}</span>
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
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