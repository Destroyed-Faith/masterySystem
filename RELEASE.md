# Mastery System Release Checklist

## Creating a New Release for Forge/Foundry Auto-Update

When you want Forge to detect updates automatically, follow these steps:

### Option 1: GitHub Release (RECOMMENDED for Forge)

1. Go to your GitHub repository: https://github.com/Destroyed-Faith/masterySystem
2. Click "Releases" → "Create a new release"
3. Fill in:
   - **Tag version**: `v0.0.26` (must match system.json version)
   - **Release title**: `v0.0.26 - Improved Character Sheet`
   - **Description**: Copy from CHANGELOG.md
4. Click "Publish release"

### Option 2: Update system.json with Release URLs

Update the `download` URL to point to the latest release:

```json
"download": "https://github.com/Destroyed-Faith/masterySystem/releases/download/v0.0.26/mastery-system.zip"
```

### For Forge Users

After creating a release:
1. In Forge, go to "Configuration" → "Game Systems"
2. Find "Mastery System"
3. Click "Check for Updates"
4. It should now detect v0.0.26

### Automated Release Script

You can create a GitHub Release automatically:

```bash
# Create and push a tag
git tag v0.0.26
git push origin v0.0.26

# Then create the release on GitHub
```

### Current Status

- ✅ `manifest` URL is correct (points to main branch system.json)
- ✅ `download` URL is set (but points to main.zip)
- ❌ No GitHub Releases created yet

### Next Steps

1. **Create your first release on GitHub** for v0.0.26
2. Future versions will be automatically detectable by Forge
3. You can automate this with GitHub Actions if desired

