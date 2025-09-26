# PDF.co Integration Setup

Your Water Report App now supports serverless PDF parsing using **PDF.co** - a real, working API! 🚀

## 🔑 API Key Setup

### PDF.co (Primary - Real Working API!)
1. **Sign up:** Visit [PDF.co](https://pdf.co)
2. **Free tier:** 300 API calls/month free (perfect for testing!)
3. **Get API key:** Go to your dashboard and copy your API key
4. **Add to Vercel:** Set environment variable `PDF_CO_API_KEY`

### AWS Textract (Optional - High Accuracy)
1. **AWS Account:** Need AWS account with Textract access
2. **Set up:** Configure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
3. **Note:** More complex setup but highest accuracy

## 🚀 Vercel Environment Variables

1. Go to your Vercel dashboard
2. Navigate to your project → Settings → Environment Variables
3. Add your PDF.co API key:
   ```
   PDF_CO_API_KEY = your_pdfco_api_key_here
   ```
4. Redeploy your app

## 🔄 How It Works

Your app now has a smart fallback system:

1. **First:** Try PDF.co (real working API - if configured)
2. **Second:** Try AWS Textract (if configured)
3. **Third:** Try PDF.js (limited serverless compatibility)
4. **Final:** Graceful fallback with user guidance

## 💰 Pricing

- **PDF.co:** 300 free API calls/month, then paid tiers
- **AWS Textract:** Pay per document processed
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
