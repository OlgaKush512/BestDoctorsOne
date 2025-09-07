# BestDoctor 🏥

AI-powered doctor finder for France with Doctolib integration and Google Reviews analysis

## 🎯 Overview

BestDoctor is a comprehensive web application that helps users find the best doctors in France by:

- Searching doctors on Doctolib based on specialty, location, and date
- Analyzing Google Reviews using AI to provide personalized recommendations
- Matching doctors to specific user requirements (e.g., LGBT-friendly, language preferences)

## 🚀 Features

- **Smart Search**: Filter doctors by specialty, location, and availability
- **AI Analysis**: Advanced review analysis using OpenAI to match user requirements
- **Personalized Recommendations**: Tailored suggestions based on specific needs
- **Real-time Results**: No database storage - fresh results every time
- **Responsive Design**: Modern UI built with Material-UI
- **Multi-language Support**: French interface with English-speaking doctor detection

## 🛠 Tech Stack

### Frontend

- **React 18** with TypeScript
- **Material-UI (MUI)** for components
- **React Router** for navigation
- **Axios** for API calls
- **Vite** for build tooling

### Backend

- **Express.js** with TypeScript
- **OpenAI API** for review analysis
- **Cheerio** for web scraping
- **Helmet** for security
- **Rate limiting** for API protection

### Deployment

- **Vercel** for hosting
- **Environment variables** for configuration

## 📁 Project Structure

```
bestdoctor/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── main.tsx        # App entry point
│   ├── package.json
│   └── vite.config.ts
├── backend/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── index.ts        # Server entry point
│   └── package.json
├── vercel.json             # Vercel deployment config
├── .env.example            # Environment variables template
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key (for AI analysis)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd bestdoctor
```

2. **Install dependencies**

```bash
npm run install:all
```

3. **Setup environment variables**

```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Start development servers**

```bash
npm run dev
```

This will start:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Environment Variables

Create a `.env` file in the root directory:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

## 📖 Usage

### Basic Search

1. Select a medical specialty from the dropdown
2. Enter a city or postal code
3. Choose your preferred appointment date
4. Add specific requirements (optional)
5. Click "Search" to find doctors

### Advanced Requirements

In the additional requirements field, you can specify:

- Language preferences: "English speaking doctor"
- Specific needs: "LGBT-friendly", "transgender care"
- Specializations: "hormone therapy specialist"
- Accessibility: "wheelchair accessible"

### Results

The application will show:

- Doctor information (name, address, phone)
- AI-generated compatibility score (1-10)
- Pros and cons based on review analysis
- Available appointment slots
- Direct link to book on Doctolib

## 🔧 API Endpoints

### POST /api/search-doctors

Search for doctors based on criteria.

**Request Body:**

```json
{
  "specialty": "Endocrinologue",
  "location": "Paris",
  "date": "2024-09-15",
  "additionalRequirements": "LGBT-friendly, English speaking"
}
```

**Response:**

```json
{
  "doctors": [
    {
      "id": "doctor_123",
      "name": "Dr. Marie Dubois",
      "specialty": "Endocrinologue",
      "address": "123 Rue de la Santé, Paris",
      "phone": "01 42 34 56 78",
      "rating": 4.5,
      "reviewCount": 28,
      "aiAnalysis": {
        "score": 8.5,
        "summary": "Highly recommended for transgender care...",
        "pros": ["LGBT-friendly", "Speaks English"],
        "cons": ["Long waiting times"],
        "lgbtFriendly": true,
        "languages": ["French", "English"]
      },
      "availability": ["14:30", "15:00", "16:30"],
      "doctolibUrl": "https://www.doctolib.fr/..."
    }
  ],
  "totalFound": 1
}
```

## 🚀 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**

```bash
npm i -g vercel
```

2. **Login to Vercel**

```bash
vercel login
```

3. **Deploy**

```bash
vercel --prod
```

4. **Set environment variables in Vercel dashboard**

- `OPENAI_API_KEY`
- `NODE_ENV=production`

### Manual Deployment

1. **Build the project**

```bash
npm run build
```

2. **Deploy frontend and backend separately**

- Frontend: Deploy `frontend/dist` to any static hosting
- Backend: Deploy to Node.js hosting service

## 🔒 Security & Privacy

- **Rate Limiting**: API calls are limited to prevent abuse
- **CORS Protection**: Configured for specific origins
- **Helmet Security**: Security headers enabled
- **No Data Storage**: No personal data is stored permanently
- **Environment Variables**: Sensitive data in environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Notes

### Mock Data

The application includes mock data for development when:

- Doctolib scraping fails
- Google Reviews scraping fails
- OpenAI API is not configured

### Web Scraping Considerations

- Doctolib and Google have anti-bot measures
- Consider using official APIs when available
- Implement proper rate limiting and delays
- Use rotating proxies for production

### AI Analysis

- Uses OpenAI GPT-3.5-turbo for review analysis
- Prompts are optimized for French medical context
- Fallback analysis when AI is unavailable

## 🐛 Troubleshooting

### Common Issues

**Frontend not loading:**

- Check if backend is running on port 5000
- Verify CORS configuration

**No search results:**

- Check if OpenAI API key is configured
- Verify internet connection for scraping
- Check browser console for errors

**AI analysis not working:**

- Ensure OPENAI_API_KEY is set correctly
- Check OpenAI API quota and billing
- Review API key permissions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Doctolib](https://www.doctolib.fr) for doctor information
- [OpenAI](https://openai.com) for AI analysis capabilities
- [Material-UI](https://mui.com) for beautiful components
- French healthcare community for inspiration

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Made with ❤️ for better healthcare access in France**
