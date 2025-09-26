# ParseAPI Integration Setup

Your Water Report App now supports serverless PDF parsing using external APIs! 🚀

## 🔑 API Key Setup

### Option 1: ParseAPI (Recommended)
1. **Sign up:** Visit [ParseAPI.com](https://parseapi.com)
2. **Get API key:** Create account and get your API key
3. **Add to Vercel:** Set environment variable `PARSE_API_KEY`

### Option 2: PDF.co (Alternative)
1. **Sign up:** Visit [PDF.co](https://pdf.co)
2. **Free tier:** 300 API calls/month free
3. **Add to Vercel:** Set environment variable `PDF_CO_API_KEY`

### Option 3: Both (Best Redundancy)
Set both API keys for maximum reliability:
- Primary: `PARSE_API_KEY` 
- Fallback: `PDF_CO_API_KEY`

## 🚀 Vercel Environment Variables

1. Go to your Vercel dashboard
2. Navigate to your project → Settings → Environment Variables
3. Add one or both:
   ```
   PARSE_API_KEY = your_parseapi_key_here
   PDF_CO_API_KEY = your_pdfco_key_here
   ```
4. Redeploy your app

## 🔄 How It Works

Your app now has a smart fallback system:

1. **First:** Try ParseAPI (if configured)
2. **Second:** Try PDF.co (if configured) 
3. **Third:** Try PDF.js (limited serverless compatibility)
4. **Final:** Graceful fallback with user guidance

## 💰 Pricing

- **ParseAPI:** Check their pricing page
- **PDF.co:** 300 free API calls/month, then paid tiers
- **PDF.js:** Free but limited in serverless

## ✅ Benefits

- ✅ **Reliable PDF parsing** in serverless environment
- ✅ **No serverless limitations** (DOM, Canvas, etc.)
- ✅ **High accuracy** text extraction
- ✅ **Automatic fallback** if one service fails
- ✅ **Graceful degradation** if no APIs configured

## 🧪 Testing

After setting up API keys:

1. **Deploy your app** to Vercel
2. **Upload a PDF** on `/dashboard`
3. **Check logs** in Vercel dashboard to see which service was used
4. **Verify extraction** - should now work reliably!

## 🔍 Troubleshooting

**No API keys set?**
- App falls back to PDF.js (may fail in serverless)
- Users get helpful guidance for manual extraction

**API calls exhausted?**
- App automatically tries alternative service
- Eventually falls back to PDF.js or manual guidance

**API service down?**
- Automatic fallback to other configured services
- Always maintains app functionality

Your PDF parsing is now production-ready for serverless environments! 🎉
