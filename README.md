# 🏌️ The Tour - Golf Score Tracker

A modern, responsive golf score tracking application built with React and TypeScript. Track your games, manage players, and customize courses with an intuitive interface designed for golfers of all skill levels.

![Golf Score Tracker](https://img.shields.io/badge/Golf-Score%20Tracker-green?style=for-the-badge&logo=golf)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-blue?style=flat-square&logo=tailwindcss)

## ✨ Features

### 🎯 Core Functionality
- **Real-time Score Tracking**: Track strokes and putts for up to 4 players
- **Course Management**: Choose from famous courses or create custom ones
- **Player Setup**: Add players with handicaps and personal information
- **Live Scoring**: Update scores hole-by-hole with instant calculations
- **Total Score Calculation**: Automatic score totaling and handicap tracking

### 🏟️ Course Features
- **Pre-loaded Famous Courses**:
  - Pebble Beach Golf Links (CA)
  - Augusta National Golf Club (GA)
 - St Andrews Old Course (Scotland)
- **Public Course Database**: Search hundreds of courses online by typing a
  course name into the selector. Matching results appear automatically as you
  type.
- **Custom Course Builder**: Create and edit your own courses
- **Course Details**: Par, handicap, distance, and hole descriptions
- **Local Storage**: Save custom courses for future games

### 📱 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Intuitive Interface**: Clean, modern UI with golf-themed styling
- **Progressive Enhancement**: Graceful degradation for all devices
- **Real-time Updates**: Instant score updates without page refreshes

## 🚀 Quick Start

### Prerequisites
- Node.js (16.0 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mschachner/the-tour.git
   cd the-tour
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
the-tour/
├── src/
│   ├── components/           # React components
│   │   ├── PlayerSetup.tsx   # Player configuration
│   │   ├── ScoreCard.tsx     # Score tracking interface
│   │   ├── CourseSelector.tsx # Course selection
│   │   └── CourseEditor.tsx  # Custom course builder
│   ├── data/
│   │   └── courses.ts        # Course data and management
│   ├── types/
│   │   └── golf.ts          # TypeScript type definitions
│   ├── App.tsx              # Main application component
│   └── index.tsx            # Application entry point
├── public/                  # Static assets
└── package.json            # Project dependencies
```

## 🎮 How to Use

### Starting a New Game

1. **Select a Course**
   - Choose from pre-loaded famous courses
   - Create a custom course
   - Edit existing course details

2. **Add Players**
   - Set number of players (1-4)
   - Enter player names
   - Add handicaps for accurate scoring

3. **Start Playing**
   - Track strokes and putts for each hole
   - View running totals and statistics
   - Navigate between holes seamlessly

### Course Management

#### Using Pre-loaded Courses
The app includes three world-famous golf courses:
- **Pebble Beach Golf Links**: Iconic oceanside course
- **Augusta National**: Home of The Masters
- **St Andrews Old Course**: The birthplace of golf
- **Search Public Database**: Quickly find new courses online. Start typing a
  course name in the selector and matching courses from the public database
  will appear immediately.

### Public Course Database

The course selector now uses **GolfCourseAPI** at
`https://api.golfcourseapi.com/v1/search` to find remote courses. Set your API
key in the `REACT_APP_GOLFCOURSE_API_KEY` environment variable before starting
the app. If the request fails, only the built-in courses will be available.

#### Creating Custom Courses
1. Select "Create Custom Course" during setup
2. Configure 18 holes with:
   - Par values (3, 4, or 5)
   - Handicap ratings (1-18)
   - Distances (optional)
   - Hole descriptions (optional)
3. Save for future use

## 🛠️ Technical Details

### Built With
- **React 19.1.0**: Modern React with hooks and functional components
- **TypeScript 4.9.5**: Type-safe JavaScript development
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Local Storage**: Persistent data storage for custom courses

### Key Components

#### Game State Management
```typescript
interface Game {
  id: string;
  date: string;
  course: Course;
  players: Player[];
  currentHole: number;
  totalHoles: number;
}
```

#### Player Tracking
```typescript
interface Player {
  id: string;
  name: string;
  handicap: number;
  totalScore: number;
  totalPutts: number;
  holes: HoleScore[];
}
```

#### Course Definition
```typescript
interface Course {
  id: string;
  name: string;
  location?: string;
  holes: CourseHole[];
  totalPar: number;
  totalDistance?: number;
}
```

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured experience with expanded layouts
- **Tablet**: Touch-optimized interface with readable fonts
- **Mobile**: Compact design perfect for on-course use

## 🎨 Styling

The app uses a golf-themed color palette:
- **Primary**: Golf course greens and sky blues
- **Accent**: Clean whites and subtle grays
- **Interactive**: Hover states and smooth transitions
- **Typography**: Clear, readable fonts optimized for outdoor use

## 🔧 Development

### Available Scripts

```bash
npm start          # Start development server
npm test           # Run test suite
npm run build      # Build for production
npm run eject      # Eject from Create React App
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏌️ About

The Tour was created to provide golfers with a simple, elegant way to track their games. Whether you're playing at your local course or dreaming of famous fairways, this app helps you focus on what matters most - enjoying the game.

Perfect for:
- **Casual Golfers**: Simple score tracking
- **Serious Players**: Detailed statistics and handicap tracking
- **Course Managers**: Custom course creation
- **Golf Groups**: Multi-player game management

---

**Ready to improve your game?** Clone the repository and start tracking your scores today! 🏌️‍♂️⛳
