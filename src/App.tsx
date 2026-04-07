// @ts-nocheck
import React, { useMemo, useState, useEffect } from "react";

const defaultConfig = {
  games: [
    {
      id: "ref",
      code: "REF",
      name: "Referee",
      fields: [
        {
          id: "pos",
          label: "POS",
          options: ["GOAL", "OFFSIDE", "PENALTY", "FOUL", "HANDBALL"],
        },
        {
          id: "team",
          label: "TEAM",
          options: ["LIVERPOOL", "REALMADRID", "BARCELONA", "MILAN", "TURKEY"],
        },
        {
          id: "char",
          label: "CHAR",
          options: ["REF_NORMAL", "REF_YOUNG", "REF_AGGRESSIVE"],
        },
        { id: "source", label: "SOURCE", options: ["AI", "UGC", "STUDIO"] },
        {
          id: "music",
          label: "MUSIC",
          options: ["PHOENIX", "TREND_01", "DRAMATICBEAT"],
        },
        {
          id: "duration",
          label: "DURATION",
          options: ["15S", "20S", "30S", "45S", "59S"],
        },
        {
          id: "ec",
          label: "EC",
          options: ["EC_DOWNLOAD", "EC_PLAY", "EC_STORE", "EC_NONE"],
        },
        { id: "sub", label: "SUB", options: ["SUB_ON", "SUB_OFF"] },
        {
          id: "hook",
          label: "HOOK",
          options: [
            "HOOK_FAIL",
            "HOOK_SHOCK",
            "HOOK_TIMER",
            "HOOK_DECIDE",
            "HOOK_BAIT",
          ],
        },
      ],
    },
    {
      id: "pzl",
      code: "PZL",
      name: "Puzzle",
      fields: [
        {
          id: "scenario",
          label: "SCENARIO",
          options: ["MATCH3", "SORT", "TRAP", "RESCUE"],
        },
        {
          id: "theme",
          label: "THEME",
          options: ["FAIL", "WIN", "SATISFYING", "CHAOS"],
        },
        { id: "source", label: "SOURCE", options: ["AI", "UGC", "STUDIO"] },
        {
          id: "music",
          label: "MUSIC",
          options: ["TREND_01", "CALM_BEAT", "HYPE_LOOP"],
        },
        { id: "duration", label: "DURATION", options: ["15S", "20S", "30S"] },
        {
          id: "ec",
          label: "EC",
          options: ["EC_DOWNLOAD", "EC_PLAY", "EC_NONE"],
        },
        { id: "sub", label: "SUB", options: ["SUB_ON", "SUB_OFF"] },
        {
          id: "hook",
          label: "HOOK",
          options: ["HOOK_FAIL", "HOOK_SHOCK", "HOOK_BAIT"],
        },
      ],
    },
  ],
};

const uid = () => Math.random().toString(36).slice(2, 10);

const cleanCode = (text) =>
  String(text || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "")
    .toUpperCase();

const cleanId = (text) =>
  String(text || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "")
    .toLowerCase();

export default function App() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("creative_naming_config");
      return saved ? JSON.parse(saved) : defaultConfig;
    } catch (e) {
      console.error("load error", e);
      return defaultConfig;
    }
  });

  const [selectedGameId, setSelectedGameId] = useState(() => {
    try {
      const saved = localStorage.getItem("creative_selected_game_id");
      return saved || defaultConfig.games[0].id;
    } catch (e) {
      return defaultConfig.games[0].id;
    }
  });

  const [values, setValues] = useState({});
  const [customValues, setCustomValues] = useState({});
  const [copied, setCopied] = useState(false);

  const [newGameName, setNewGameName] = useState("");
  const [newGameCode, setNewGameCode] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [optionDrafts, setOptionDrafts] = useState({});
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("creative_naming_config", JSON.stringify(config));
    } catch (e) {
      console.error("save error", e);
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem("creative_selected_game_id", selectedGameId);
    } catch (e) {
      console.error("selected game save error", e);
    }
  }, [selectedGameId]);

  const selectedGame = useMemo(() => {
    const found = config.games.find((g) => g.id === selectedGameId);
    return found || config.games[0];
  }, [config.games, selectedGameId]);

  const generatedName = useMemo(() => {
    if (!selectedGame) return "";
    const parts = [selectedGame.code];

    selectedGame.fields.forEach((field) => {
      const value = values[field.id];
      if (!value || value === "-") return;

      if (value === "CUSTOM") {
        const custom = cleanCode(customValues[field.id] || "");
        if (custom) parts.push(custom);
      } else {
        parts.push(value);
      }
    });

    return parts.join("_");
  }, [selectedGame, values, customValues]);

  const updateSelectedGame = (updater) => {
    setConfig((prev) => ({
      ...prev,
      games: prev.games.map((game) =>
        game.id === selectedGameId ? updater(game) : game
      ),
    }));
  };

  const handleGameMetaChange = (field, value) => {
    updateSelectedGame((game) => ({
      ...game,
      [field]: field === "code" ? cleanCode(value) : value,
    }));
  };

  const addGame = () => {
    const name = newGameName.trim();
    const code = cleanCode(newGameCode || newGameName);

    if (!name || !code) return;

    const newGame = {
      id: uid(),
      name,
      code,
      fields: [],
    };

    setConfig((prev) => ({ ...prev, games: [...prev.games, newGame] }));
    setSelectedGameId(newGame.id);
    setNewGameName("");
    setNewGameCode("");
    setValues({});
    setCustomValues({});
    flashSaved("Yeni oyun eklendi");
  };

  const deleteSelectedGame = () => {
    if (config.games.length <= 1) return;

    const nextGames = config.games.filter((g) => g.id !== selectedGameId);
    setConfig((prev) => ({ ...prev, games: nextGames }));
    setSelectedGameId(nextGames[0].id);
    setValues({});
    setCustomValues({});
    flashSaved("Oyun silindi");
  };

  const addField = () => {
    const label = cleanCode(newFieldLabel);
    const id = cleanId(newFieldLabel);

    if (!label || !id || !selectedGame) return;
    if (selectedGame.fields.some((f) => f.id === id)) return;

    const options = newFieldOptions
      .split(",")
      .map((x) => cleanCode(x))
      .filter(Boolean);

    updateSelectedGame((game) => ({
      ...game,
      fields: [...game.fields, { id, label, options }],
    }));

    setNewFieldLabel("");
    setNewFieldOptions("");
    flashSaved("Tag türü eklendi");
  };

  const updateFieldLabel = (fieldId, value) => {
    updateSelectedGame((game) => ({
      ...game,
      fields: game.fields.map((field) =>
        field.id === fieldId ? { ...field, label: cleanCode(value) } : field
      ),
    }));
  };

  const moveField = (fieldId, direction) => {
    updateSelectedGame((game) => {
      const index = game.fields.findIndex((f) => f.id === fieldId);
      if (index === -1) return game;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= game.fields.length) return game;

      const fields = [...game.fields];
      [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
      return { ...game, fields };
    });
  };

  const deleteField = (fieldId) => {
    updateSelectedGame((game) => ({
      ...game,
      fields: game.fields.filter((f) => f.id !== fieldId),
    }));

    setValues((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });

    setCustomValues((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });

    flashSaved("Tag silindi");
  };

  const addOption = (fieldId) => {
    const option = cleanCode(optionDrafts[fieldId] || "");
    if (!option) return;

    updateSelectedGame((game) => ({
      ...game,
      fields: game.fields.map((field) => {
        if (field.id !== fieldId) return field;
        if (field.options.includes(option)) return field;
        return { ...field, options: [...field.options, option] };
      }),
    }));

    setOptionDrafts((prev) => ({ ...prev, [fieldId]: "" }));
    flashSaved("Seçenek eklendi");
  };

  const deleteOption = (fieldId, option) => {
    updateSelectedGame((game) => ({
      ...game,
      fields: game.fields.map((field) =>
        field.id === fieldId
          ? { ...field, options: field.options.filter((o) => o !== option) }
          : field
      ),
    }));

    setValues((prev) => {
      if (prev[fieldId] !== option) return prev;
      return { ...prev, [fieldId]: "-" };
    });

    flashSaved("Seçenek silindi");
  };

  const copyName = async () => {
    try {
      await navigator.clipboard.writeText(generatedName);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      console.error(e);
    }
  };

  const exportConfig = async () => {
    try {
      const text = JSON.stringify(config, null, 2);
      await navigator.clipboard.writeText(text);
      alert("Config JSON kopyalandı. Bunu saklayıp tekrar kullanabilirsin.");
    } catch (e) {
      console.error(e);
    }
  };

  const resetSavedData = () => {
    try {
      localStorage.removeItem("creative_naming_config");
      localStorage.removeItem("creative_selected_game_id");
      setConfig(defaultConfig);
      setSelectedGameId(defaultConfig.games[0].id);
      setValues({});
      setCustomValues({});
      setNewGameName("");
      setNewGameCode("");
      setNewFieldLabel("");
      setNewFieldOptions("");
      setOptionDrafts({});
      flashSaved("Kayıt sıfırlandı");
    } catch (e) {
      console.error(e);
    }
  };

  const flashSaved = (text) => {
    setSaveMessage(text);
    setTimeout(() => setSaveMessage(""), 1200);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Creative Naming System Builder</h1>
        <p style={styles.subtitle}>
          Oyun ekle, oyun kodunu değiştir, tag türlerini düzenle, seçenekleri
          güncelle. Autosave açık. Yaptığın değişiklikler tarayıcıda saklanır.
        </p>

        <div style={styles.layout}>
          <div style={styles.left}>
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Game Manager</h2>

              <div style={styles.row2}>
                <div>
                  <label style={styles.label}>Mevcut Oyun</label>
                  <select
                    style={styles.input}
                    value={selectedGameId}
                    onChange={(e) => {
                      setSelectedGameId(e.target.value);
                      setValues({});
                      setCustomValues({});
                    }}
                  >
                    {config.games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.code} — {game.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "end" }}>
                  <button
                    style={styles.dangerButton}
                    onClick={deleteSelectedGame}
                  >
                    Seçili Oyunu Sil
                  </button>
                </div>
              </div>

              <div style={styles.row2}>
                <div>
                  <label style={styles.label}>Oyun Adı</label>
                  <input
                    style={styles.input}
                    value={selectedGame?.name || ""}
                    onChange={(e) =>
                      handleGameMetaChange("name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label style={styles.label}>İsimlendirme Kısaltması</label>
                  <input
                    style={styles.input}
                    value={selectedGame?.code || ""}
                    onChange={(e) =>
                      handleGameMetaChange("code", e.target.value)
                    }
                    placeholder="örn: REF"
                  />
                </div>
              </div>

              <div style={styles.divider} />

              <div style={styles.row2}>
                <div>
                  <label style={styles.label}>Yeni Oyun Adı</label>
                  <input
                    style={styles.input}
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    placeholder="örn: Beauty"
                  />
                </div>
                <div>
                  <label style={styles.label}>Yeni Oyun Kodu</label>
                  <input
                    style={styles.input}
                    value={newGameCode}
                    onChange={(e) => setNewGameCode(e.target.value)}
                    placeholder="örn: BTY"
                  />
                </div>
              </div>

              <button style={styles.primaryButton} onClick={addGame}>
                Yeni Oyun Ekle
              </button>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Field Manager</h2>

              <div style={styles.row2}>
                <div>
                  <label style={styles.label}>Yeni Tag Türü</label>
                  <input
                    style={styles.input}
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="örn: MECHANIC"
                  />
                </div>
                <div>
                  <label style={styles.label}>İlk Seçenekler</label>
                  <input
                    style={styles.input}
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    placeholder="örn: TAP, SWIPE, HOLD"
                  />
                </div>
              </div>

              <button style={styles.primaryButton} onClick={addField}>
                Tag Türü Ekle
              </button>

              <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
                {selectedGame?.fields.map((field) => (
                  <div key={field.id} style={styles.fieldBox}>
                    <div style={styles.fieldTop}>
                      <div style={{ flex: 1 }}>
                        <label style={styles.label}>Tag Adı</label>
                        <input
                          style={styles.input}
                          value={field.label}
                          onChange={(e) =>
                            updateFieldLabel(field.id, e.target.value)
                          }
                        />
                      </div>

                      <div style={styles.moveButtons}>
                        <button
                          style={styles.smallButton}
                          onClick={() => moveField(field.id, "up")}
                        >
                          ↑
                        </button>
                        <button
                          style={styles.smallButton}
                          onClick={() => moveField(field.id, "down")}
                        >
                          ↓
                        </button>
                        <button
                          style={styles.smallDanger}
                          onClick={() => deleteField(field.id)}
                        >
                          Sil
                        </button>
                      </div>
                    </div>

                    <div style={styles.optionRow}>
                      <input
                        style={styles.input}
                        value={optionDrafts[field.id] || ""}
                        onChange={(e) =>
                          setOptionDrafts((prev) => ({
                            ...prev,
                            [field.id]: e.target.value,
                          }))
                        }
                        placeholder={`${field.label} için yeni seçenek`}
                      />
                      <button
                        style={styles.secondaryButton}
                        onClick={() => addOption(field.id)}
                      >
                        Seçenek Ekle
                      </button>
                    </div>

                    <div style={styles.tagsWrap}>
                      {field.options.map((option) => (
                        <span key={option} style={styles.tagPill}>
                          {option}
                          <button
                            style={styles.pillDelete}
                            onClick={() => deleteOption(field.id, option)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div style={styles.right}>
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Naming Preview</h2>
              <div style={styles.previewBox}>
                {generatedName || selectedGame?.code || ""}
              </div>

              <div style={styles.buttonsRow}>
                <button style={styles.primaryButton} onClick={copyName}>
                  {copied ? "Kopyalandı" : "İsmi Kopyala"}
                </button>
                <button style={styles.secondaryButton} onClick={exportConfig}>
                  Config'i Kopyala
                </button>
                <button
                  style={styles.dangerButtonSmall}
                  onClick={resetSavedData}
                >
                  Kayıtları Sıfırla
                </button>
              </div>

              {saveMessage && <div style={styles.saveBadge}>{saveMessage}</div>}
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Name Builder</h2>
              <div style={{ display: "grid", gap: 14 }}>
                {selectedGame?.fields.map((field) => {
                  const currentValue = values[field.id] || "-";
                  const isCustom = currentValue === "CUSTOM";

                  return (
                    <div key={field.id}>
                      <label style={styles.label}>{field.label}</label>
                      <select
                        style={styles.input}
                        value={currentValue}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [field.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="-">Seçme</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                        <option value="CUSTOM">Custom gir</option>
                      </select>

                      {isCustom && (
                        <input
                          style={{ ...styles.input, marginTop: 8 }}
                          value={customValues[field.id] || ""}
                          onChange={(e) =>
                            setCustomValues((prev) => ({
                              ...prev,
                              [field.id]: e.target.value,
                            }))
                          }
                          placeholder={`${field.label} custom değer`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: 24,
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: 1380,
    margin: "0 auto",
  },
  title: {
    margin: 0,
    fontSize: 32,
    color: "#0f172a",
  },
  subtitle: {
    color: "#475569",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 1.5,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1.3fr 0.9fr",
    gap: 24,
  },
  left: {
    display: "grid",
    gap: 24,
  },
  right: {
    display: "grid",
    gap: 24,
    alignContent: "start",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: 22,
    color: "#0f172a",
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
    fontSize: 14,
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginBottom: 14,
  },
  primaryButton: {
    border: "none",
    background: "#0f172a",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    border: "none",
    background: "#e2e8f0",
    color: "#0f172a",
    padding: "12px 16px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 700,
  },
  dangerButton: {
    border: "none",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 700,
    width: "100%",
  },
  dangerButtonSmall: {
    border: "none",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 700,
  },
  divider: {
    height: 1,
    background: "#e2e8f0",
    margin: "8px 0 14px 0",
  },
  fieldBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 14,
  },
  fieldTop: {
    display: "flex",
    gap: 12,
    alignItems: "end",
  },
  moveButtons: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  smallButton: {
    border: "none",
    background: "#e2e8f0",
    color: "#0f172a",
    borderRadius: 10,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  smallDanger: {
    border: "none",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 10,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  optionRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    marginTop: 12,
  },
  tagsWrap: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },
  tagPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#e2e8f0",
    color: "#0f172a",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
  },
  pillDelete: {
    border: "none",
    background: "transparent",
    color: "#991b1b",
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1,
  },
  previewBox: {
    background: "#0f172a",
    color: "#fff",
    borderRadius: 16,
    padding: 16,
    fontFamily: "monospace",
    fontSize: 18,
    lineHeight: 1.6,
    wordBreak: "break-word",
  },
  buttonsRow: {
    display: "flex",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap",
  },
  saveBadge: {
    marginTop: 12,
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
};
