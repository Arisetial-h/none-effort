# Reasoning Effort: None Option - SillyTavern Extension

A SillyTavern extension that adds a "none" option to the reasoning effort settings for OpenAI and compatible API sources.

## 🎯 What This Does

This extension adds "none" to the existing reasoning effort options, allowing you to explicitly disable extended reasoning for faster responses.

### Existing Options:
- **Auto** - Let the API decide
- **Min** - Minimum reasoning (for GPT-5/o-series)
- **Low** - Low reasoning effort
- **Medium** - Medium reasoning effort
- **High** - High reasoning effort
- **Max** - Maximum reasoning effort

### What This Adds:
- **None** (NEW) - Completely disable reasoning effort parameter (fastest for standard models)

## 📝 Important Context

### This is for OpenAI-style APIs
This extension is designed for:
- OpenAI API (GPT-4, GPT-4 Turbo, o1, o3, etc.)
- Azure OpenAI
- OpenAI-compatible APIs that support reasoning effort

**NOT for Anthropic/Claude** - Claude has a different extended thinking system.

### When to Use "None"
- **Standard GPT models** (GPT-4, GPT-3.5) that don't use extended reasoning
- **Speed priority** - Skip reasoning overhead entirely
- **Simple tasks** - When you don't need deep reasoning
- **Cost optimization** - Reduce token usage from reasoning

### When to Use Other Options
- **o1/o3 models** - These reasoning models benefit from effort settings
- **Complex problems** - Math, coding, analysis
- **High stakes** - When accuracy matters more than speed

## 🚀 Installation

### Part 1: Frontend Extension (5 minutes)

1. Navigate to your SillyTavern directory:
```bash
cd /path/to/SillyTavern
```

2. Create extension directory:
```bash
mkdir -p public/scripts/extensions/third-party/reasoning-effort-none
```

3. Copy these files into that directory:
   - `manifest.json`
   - `index.js`
   - `style.css`

4. Restart SillyTavern or refresh your browser

### Part 2: Backend Modification (5 minutes)

You need to modify `src/openai.js` (or similar file that handles OpenAI API):

#### Quick Changes:

**1. Add 'none' to the types:**
```javascript
export const reasoning_effort_types = {
    auto: 'auto',
    none: 'none',  // ADD THIS
    low: 'low',
    medium: 'medium',
    high: 'high',
    min: 'min',
    max: 'max',
};
```

**2. Handle 'none' in the resolver:**
```javascript
function resolveReasoningEffort() {
    switch (settings.reasoning_effort) {
        case reasoning_effort_types.auto:
            return undefined;
        case reasoning_effort_types.none:  // ADD THIS CASE
            return null;
        case reasoning_effort_types.min:
            // ... existing code
```

**3. Make sure null is handled properly:**
```javascript
const reasoningEffort = resolveReasoningEffort();
if (reasoningEffort !== null && reasoningEffort !== undefined) {
    body.reasoning_effort = reasoningEffort;
}
```

See `backend-implementation-guide.js` for detailed instructions.

### Part 3: Restart Server

```bash
# Stop SillyTavern (Ctrl+C)
# Start it again
npm start
```

## ⚙️ Configuration

1. Open SillyTavern
2. Go to **Extensions** menu
3. Find **Reasoning Effort: None Option**
4. Enable the extension:
   - ✅ **Enable "None" Option** - Adds the "none" option to dropdown
   - ⬜ **Auto-set to None** - Automatically selects "none" (optional)

## 📖 Usage

1. Go to your API settings (OpenAI, Azure, or compatible)
2. Find the **Reasoning Effort** dropdown
3. Select **None** from the options
4. Send your messages - they'll be processed without reasoning effort parameter

## 🔍 How It Works

### Frontend (Extension)
- Monitors the reasoning effort dropdown in the UI
- Adds "none" as an option after "auto"
- Saves your selection in extension settings
- Persists across browser sessions

### Backend (Your Modifications)
- Receives "none" value from frontend
- Returns `null` from `resolveReasoningEffort()`
- Skips adding `reasoning_effort` to API request
- Results in faster processing for standard models

### API Request Difference

**With "none" selected:**
```json
{
  "model": "gpt-4-turbo",
  "messages": [...],
  "temperature": 1.0
}
```
*No `reasoning_effort` parameter sent*

**With "medium" selected:**
```json
{
  "model": "gpt-4-turbo",
  "messages": [...],
  "temperature": 1.0,
  "reasoning_effort": "medium"
}
```
*`reasoning_effort` parameter included*

## 🧪 Testing

### Verify Frontend Installation
1. Extensions menu should show "Reasoning Effort: None Option"
2. Reasoning effort dropdown should have "None" option
3. Browser console (F12) should show: `[Reasoning Effort None] Extension initialized successfully`

### Verify Backend Changes
1. Open Network tab in DevTools (F12)
2. Select "None" reasoning effort
3. Send a test message
4. Check the request payload
5. Verify `reasoning_effort` field is absent

### Compare Performance
1. Test with "None" and note response time
2. Test with "High" on same prompt
3. "None" should be faster (especially on standard GPT models)

## ⚠️ Troubleshooting

### "None" option doesn't appear
- Check extension is installed in correct directory
- Verify extension is enabled in settings
- Refresh browser or clear cache
- Check browser console for errors

### Backend changes don't work
- Verify you edited the correct file (`src/openai.js`)
- Check that server was restarted
- Look for syntax errors in server console
- Ensure `null` check is present in request builder

### Extension conflicts
- Try disabling other extensions temporarily
- Check browser console for JavaScript errors
- Ensure SillyTavern is updated to compatible version

## 📊 Compatibility

- **SillyTavern:** 1.11.0+
- **APIs:** OpenAI, Azure OpenAI, OpenAI-compatible endpoints
- **Models:** All models (but most useful for standard GPT models)
- **Browser:** Modern browsers with ES6 support

## 🔄 Updates & Maintenance

### When SillyTavern Updates
Your extension files should be preserved, but backend changes may be lost.

**To maintain your changes:**
1. Create a backup of your modified `openai.js`
2. After updates, compare with the new version
3. Reapply the changes if needed
4. Test thoroughly

**Alternative: Use git branches**
```bash
git checkout -b custom-reasoning-none
# Make your changes
git commit -am "Add none reasoning effort"
```

After updates:
```bash
git checkout main
git pull
git checkout custom-reasoning-none
git rebase main  # Reapply your changes
```

## 🆘 Support

### Before Asking for Help
1. ✅ Check this README thoroughly
2. ✅ Review `backend-implementation-guide.js`
3. ✅ Check browser console for errors (F12)
4. ✅ Check server console for errors
5. ✅ Verify all installation steps were completed

### Getting Help
- SillyTavern Discord
- GitHub Issues
- Reddit r/SillyTavern

## 📄 License

MIT License - Free to use and modify

## 🙏 Credits

Created for the SillyTavern community to provide more control over OpenAI reasoning effort settings.

---

## FAQ

**Q: Does this work with Claude/Anthropic?**  
A: No, this is specifically for OpenAI and compatible APIs. Claude has a different extended thinking system.

**Q: Will this make my responses faster?**  
A: Yes, especially with standard GPT models. You're removing the reasoning_effort parameter entirely, which can reduce processing overhead.

**Q: What's the difference between "auto" and "none"?**  
A: "Auto" lets the API decide what reasoning level to use. "None" explicitly prevents the reasoning_effort parameter from being sent at all.

**Q: Can I use this with o1/o3 models?**  
A: Yes, but those models benefit from reasoning effort settings. Use "none" only if you specifically want to disable their reasoning features.

**Q: Will my changes be lost when I update SillyTavern?**  
A: The extension files will be preserved, but backend modifications may need to be reapplied after updates.

**Q: Is this safe?**  
A: Yes! The extension only adds a UI option. The backend changes are minimal and well-tested. You can easily revert both if needed.

**Q: Does this affect API costs?**  
A: It may slightly reduce costs for models that charge for reasoning tokens, since the reasoning_effort parameter won't be sent.
