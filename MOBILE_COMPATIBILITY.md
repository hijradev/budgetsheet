# Google Apps Script Mobile Compatibility Guide

When deploying Google Apps Script (GAS) Web Apps, mobile browsers often block access or functionality due to strict security policies regarding iframes and third-party cookies. Follow this guide to ensure your app works reliably on iOS and Android.

## 1. Code-Level Configuration (doGet)

In your `Code.gs`, ensure your `doGet` function explicitly sets the viewport and allows frame embedding.

```javascript
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Your App Name')
    // 1. Set viewport for responsive design
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    // 2. Allow embedding in iframes (Crucial for mobile cross-domain loading)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

## 2. Deployment Settings

To make the app accessible to the public:
1.  **Execute as:** `Me` (The developer). This ensures the script runs with your permissions to access the database/spreadsheet.
2.  **Who has access:** `Anyone`.
    *   *Note:* If using a Google Workspace account, ensure your Organization Admin allows sharing "Outside the organization".

## 3. Dealing with Common Mobile Issues

### A. Multiple Google Accounts (Account Conflict)
**Symptoms:** "403 Forbidden" or "Authorization Required" even when public.
- **Cause:** Mobile browsers with multiple logged-in Google accounts often fail to pass the correct session cookie to the app's iframe.
- **Solution:** Open the link in **Incognito / Private Mode**. This forces a clean session and is the most reliable way to access GAS apps on mobile.

### B. "Prevent Cross-Site Tracking" (iOS Safari)
**Symptoms:** `google.script.run` fails to execute, or the app hangs on loading.
- **Cause:** Safari's Intelligent Tracking Protection (ITP) blocks cookies for the `googleusercontent.com` iframe.
- **Solution:** 
    1. Go to **Settings > Safari**.
    2. Disable **Prevent Cross-Site Tracking**.
    *Alternatively, use a non-WebKit browser if possible (though all iOS browsers are WebKit-based).*

### C. Chrome "Incognito" Cookie Blocking
**Symptoms:** App loads but cannot save data or call server functions.
- **Cause:** Chrome in Incognito mode sometimes blocks third-party cookies by default.
- **Solution:** Click the "eye" icon or cookie icon in the address bar and select **"Allow cookies"** or **"Turn off blocking"** for that session.

## 4. Summary Checklist for Future Apps
- [ ] Added `viewport` meta tag.
- [ ] Added `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)`.
- [ ] Using the `/exec` URL (not `/dev`).
- [ ] Deployment is set to "Execute as: Me" and "Access: Anyone".
- [ ] Tested in Incognito mode on mobile.
