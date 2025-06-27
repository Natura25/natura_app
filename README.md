# Natura Finance Dashboard

A minimalist dashboard app0lication built with React and Vite, featuring authentication and a clean, modern UI.

## Features

- 🔐 **Authentication System** - Login/logout functionality with protected routes
- 📊 **Dashboard Layout** - Clean, responsive dashboard with sidebar navigation
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎨 **Minimalist UI** - Modern, clean design with smooth animations
- 📈 **Sample Data** - Demo statistics and chart visualization
- 🔄 **State Management** - Context-based authentication state

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Login
- Use any email and password combination to login (demo mode)
- The application will remember your login state using localStorage

### Dashboard
- Navigate between different sections using the sidebar
- View sample statistics and data visualizations
- Responsive design adapts to different screen sizes

### Navigation
- **Overview** - Main dashboard with key metrics
- **Analytics** - Detailed analytics section
- **Reports** - Report generation and viewing
- **Settings** - Application configuration

## Project Structure

```
src/
├── components/
│   ├── App.jsx          # Main application component
│   ├── Login.jsx        # Login form component
│   ├── ProtectedRoute.jsx # Authentication wrapper
│   └── App.css          # Global styles
├── pages/
│   ├── Dashboard.jsx    # Dashboard layout component
│   └── Dashboard.css    # Dashboard styles
├── context/
│   └── AuthContext.jsx  # Authentication context
├── main.jsx            # Application entry point
└── index.css           # Global CSS
```

## Technologies Used

- **React 19** - UI library
- **React Router** - Client-side routing
- **Vite** - Build tool and development server
- **CSS3** - Styling with modern CSS features

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Customization

The application is designed to be easily customizable:

- Modify colors and styling in the CSS files
- Add new dashboard sections in the `menuItems` array
- Extend authentication logic in `AuthContext.jsx`
- Add real API integration for production use

## License

This project is open source and available under the MIT License.
