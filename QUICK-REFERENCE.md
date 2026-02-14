# Quick Reference - Reasoning Effort: None Option

## 🚀 Super Quick Install

### Frontend (3 min)
```bash
cd SillyTavern
mkdir -p public/scripts/extensions/third-party/reasoning-effort-none
# Copy: manifest.json, index.js, style.css
```

### Backend (2 min)
Edit `src/openai.js`:

```javascript
// 1. Add to types:
export const reasoning_effort_types = {
    auto: 'auto',
    none: 'none',  // ADD THIS
    // ... rest
};

// 2. Add to resolver:
case reasoning_effort_types.none:
    return null;

// 3. Check for null:
if (reasoningEffort !== null && reasoningEffort !== undefined) {
    body.reasoning_effort = reasoningEffort;
}
```

Restart server → Done!

## 📋 Current Reasoning Options

After installation, you'll have:
1. **Auto** - API decides
2. **None** - ⭐ NEW! No reasoning (fastest)
3. **Min** - Minimum (GPT-5/o-series)
4. **Low** - Low effort
5. **Medium** - Medium effort
6. **High** - High effort
7. **Max** - Maximum effort

## 🎯 When to Use Each

| Option | Best For | Speed | Quality |
|--------|----------|-------|---------|
| None | Standard GPT, quick tasks | ⚡⚡⚡ Fastest | ⭐ Basic |
| Auto | Let API decide | ⚡⚡ | ⭐⭐⭐ |
| Low | Simple reasoning | ⚡⚡ Fast | ⭐⭐ Good |
| Medium | Balanced tasks | ⚡ Moderate | ⭐⭐⭐ Great |
| High | Complex problems | 🐌 Slow | ⭐⭐⭐⭐ Excellent |

## ✅ Quick Test

1. Select "None" from reasoning effort dropdown
2. Send message: "What is 2+2?"
3. Open DevTools (F12) → Network tab
4. Check request body → No `reasoning_effort` field ✅

## 🔍 Troubleshooting Quick Fixes

| Problem | Fix |
|---------|-----|
| "None" not showing | Refresh browser, check extension enabled |
| Not working | Verify backend changes, restart server |
| API errors | Check for typos in backend code |

## 📦 What You Need

**Files to copy:**
- manifest.json
- index.js  
- style.css

**File to edit:**
- src/openai.js

**Lines to add:**
- `none: 'none'` to types
- `case reasoning_effort_types.none: return null;` to resolver
- Null check before adding to request body

## 🧪 One-Minute Test

```bash
# Frontend installed?
ls public/scripts/extensions/third-party/reasoning-effort-none/

# Backend modified?
grep -n "none: 'none'" src/openai.js

# Extension working?
# Open browser → F12 → Console → Look for:
# [Reasoning Effort None] Extension initialized successfully
```

## 💡 Pro Tips

- ⚡ Use "None" for chat and simple queries
- 🎯 Use "Medium" as default for balanced performance
- 🧠 Use "High" only for complex math/code/analysis
- 💰 "None" may reduce API costs slightly

## 📊 Expected Performance

| Reasoning | Avg Response Time | Use Case |
|-----------|------------------|----------|
| None | 1-3s | Quick answers, chat |
| Low | 2-5s | Simple problems |
| Medium | 3-8s | Standard tasks |
| High | 5-15s+ | Complex analysis |

## 🔄 Maintenance

**After SillyTavern updates:**
1. Extension files usually preserved ✅
2. Backend changes might be lost ⚠️
3. Recheck `src/openai.js` modifications
4. Reapply if needed

**Quick reapply:**
```bash
# Save your changes first:
cp src/openai.js src/openai.js.backup

# After update, check:
grep "none: 'none'" src/openai.js

# If missing, reapply from backup or guide
```

## 🎓 Understanding the Order

The options appear in this order in the dropdown:
```
Auto    ← Let API choose
None    ← ⭐ NEW: Skip reasoning
Min     ← Minimum (GPT-5/o-series specific)
Low     ← Low reasoning
Medium  ← Medium reasoning
High    ← High reasoning
Max     ← Maximum reasoning
```

## ⚙️ Extension Settings

Located in: Extensions menu → Reasoning Effort: None Option

- ☑️ **Enable "None" Option** - Shows/hides the option
- ☐ **Auto-set to None** - Automatically select "none" (optional)

## 🔑 Key Concepts

**Auto vs None:**
- Auto = "API, you decide what reasoning to use"
- None = "Don't use reasoning effort at all"

**When reasoning_effort is sent:**
- Auto: Not sent (undefined)
- None: Not sent (null)
- Others: Sent with value (low/medium/high/etc.)

**Result:**
- None and Auto both skip the parameter
- None is explicit, Auto is implicit

## 📱 File Locations

```
SillyTavern/
├── public/scripts/extensions/third-party/
│   └── reasoning-effort-none/
│       ├── manifest.json
│       ├── index.js
│       └── style.css
└── src/
    └── openai.js  ← Edit this
```

## 🆘 Emergency Rollback

**Undo extension:**
```bash
rm -rf public/scripts/extensions/third-party/reasoning-effort-none
```

**Undo backend:**
```bash
# Restore from backup
cp src/openai.js.backup src/openai.js

# Or manually remove:
# - 'none: 'none'' from types
# - case for 'none' from resolver
```

Restart server → Back to normal!

## ✨ Success Checklist

- [ ] Extension folder created
- [ ] Three files copied (manifest, index, style)
- [ ] Backend modified (types + resolver + null check)
- [ ] Server restarted
- [ ] "None" appears in dropdown
- [ ] Extension shows in Extensions menu
- [ ] Selecting "none" doesn't cause errors
- [ ] Request body checked (no reasoning_effort field)

All checked? You're done! 🎉

---

Need more details? See README.md
Need backend help? See backend-implementation-guide.js
