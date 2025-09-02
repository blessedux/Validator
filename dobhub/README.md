# DOB Hub - Certificate Public Viewer

## Overview

DOB Hub is a public-facing Next.js application that provides a comprehensive platform for viewing, verifying, and sharing DOB Validator certificates. It serves as the public interface for certificate verification and discovery, leveraging the same backend API as the backoffice and frontend applications.

## Architecture

### Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + Context API
- **API Client**: Custom API client (shared with other apps)
- **UI Components**: Custom components + shadcn/ui
- **Deployment**: Vercel (planned)

### Project Structure

```
dobhub/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (if needed)
│   ├── certificates/      # Certificate pages
│   ├── search/           # Search functionality
│   ├── verify/           # Verification pages
│   └── globals.css       # Global styles
├── components/           # Reusable components
│   ├── ui/              # Base UI components
│   ├── certificate/     # Certificate-specific components
│   └── layout/          # Layout components
├── lib/                 # Utilities and configurations
│   ├── api/            # API client and services
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript type definitions
├── hooks/              # Custom React hooks
├── public/             # Static assets
└── styles/             # Additional styles
```

### API Integration

- **Backend**: Same API endpoints as backoffice/frontend
- **Authentication**: Public access (no authentication required)
- **Rate Limiting**: Implemented for public endpoints
- **Caching**: Static generation + ISR for performance

## Feature List

### Core Features

1. **Certificate Search**
   - Search by certificate ID
   - Search by device name
   - Search by wallet address
   - Advanced search filters
   - Search history

2. **Certificate Viewer**
   - Full certificate display
   - Device information
   - Technical specifications
   - Financial information
   - Documentation links
   - Certificate metadata

3. **Certificate Verification**
   - Real-time verification
   - QR code scanning
   - Verification status display
   - Certificate authenticity check
   - Blockchain verification

4. **Public Certificate Listing**
   - Browse all public certificates
   - Filter by category/type
   - Sort by date, name, status
   - Pagination support
   - Featured certificates

### Advanced Features

5. **Certificate Sharing**
   - Social media sharing
   - Direct link sharing
   - QR code generation
   - Embed codes for websites
   - Email sharing

6. **User Experience**
   - Responsive design
   - Dark/light mode
   - Accessibility features
   - Progressive Web App (PWA)
   - Offline support for viewed certificates

7. **Analytics & SEO**
   - SEO optimization
   - Open Graph tags
   - Structured data
   - Analytics tracking
   - Performance monitoring

## Technical Specifications

### Performance Requirements

- **Page Load Time**: < 2 seconds
- **Time to Interactive**: < 3 seconds
- **Core Web Vitals**: Pass all metrics
- **Mobile Performance**: Optimized for mobile devices
- **SEO Score**: 90+ on Lighthouse

### Security Requirements

- **HTTPS Only**: All connections must be secure
- **CORS Configuration**: Proper cross-origin settings
- **Rate Limiting**: Prevent abuse of public endpoints
- **Input Validation**: Sanitize all user inputs
- **XSS Protection**: Implement security headers

### Accessibility Requirements

- **WCAG 2.1 AA**: Full compliance
- **Screen Reader Support**: Complete compatibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: Meet accessibility standards
- **Focus Management**: Proper focus indicators

### Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Progressive Enhancement**: Graceful degradation for older browsers

## API Endpoints Integration

### Certificate Endpoints

- `GET /api/submissions` - List public certificates
- `GET /api/submissions/[id]` - Get certificate details
- `GET /api/submissions/[id]/verify` - Verify certificate
- `GET /api/submissions/search` - Search certificates

### Additional Endpoints

- `GET /api/health` - Health check
- `GET /api/stats` - Public statistics
- `GET /api/categories` - Certificate categories

## Development Guidelines

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Custom configuration
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Commit message format

### Testing Strategy

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright
- **Visual Regression**: Chromatic (planned)

### Deployment Strategy

- **Environment**: Development, Staging, Production
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics + Custom metrics
- **Error Tracking**: Sentry integration

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- Access to DOB Validator backend API

### Installation

```bash
cd dobhub
pnpm install
```

### Development

```bash
pnpm dev
```

### Building

```bash
pnpm build
pnpm start
```

## Contributing

1. Follow the established code standards
2. Write tests for new features
3. Update documentation as needed
4. Submit pull requests for review

## License

Same license as the main DOB Validator project
