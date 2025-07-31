# 📱 Accelerometer Movement Detector

A smart React web application that uses your phone's accelerometer to detect movement and determine if you're holding your device or if it's been placed down.

## ✨ Features

- **Real-time Movement Detection**: Uses the Device Motion API to detect when your phone is moving
- **Smart Holding Detection**: Distinguishes between holding the phone vs. placing it down
- **Visual Status Indicators**: Color-coded status display (Green = Moving, Yellow = Holding, Red = Not held)
- **Live Acceleration Data**: Shows real-time X, Y, Z acceleration values
- **Mobile-Optimized**: Beautiful, responsive design that works great on mobile devices
- **Permission Handling**: Properly requests and handles motion sensor permissions

## 🚀 How It Works

The app uses the **Device Motion API** to access your phone's accelerometer data:

1. **Movement Detection**: Compares acceleration changes over time to detect movement
2. **Holding Detection**: Analyzes gravity patterns to determine if the phone is being held
3. **Smart Thresholds**: Uses configurable sensitivity thresholds for accurate detection

### Status Colors:
- 🟢 **Green**: Phone is being held and moving
- 🟡 **Yellow**: Phone is being held but stationary  
- 🔴 **Red**: Phone is not being held (likely placed down)

## 📱 Browser Compatibility

- ✅ **iOS Safari** (iOS 13+ with permission)
- ✅ **Android Chrome**
- ✅ **Android Firefox**
- ✅ **Samsung Internet**
- ❌ **Desktop browsers** (no accelerometer)

## 🛠️ Installation & Usage

### Prerequisites
- Node.js (v14 or higher)
- A mobile device with accelerometer

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Using the App
1. Open the app on your mobile device
2. Grant motion sensor permissions when prompted
3. Hold your phone and move it around to see the green status
4. Hold it still to see the yellow status
5. Place it on a table to see the red status

## 🔧 Technical Details

### APIs Used
- **Device Motion API**: `devicemotion` event for accelerometer data
- **Permission API**: `DeviceMotionEvent.requestPermission()` for iOS

### Key Components
- **Movement Threshold**: `0.5` - Sensitivity for movement detection
- **Holding Threshold**: `0.1` - Sensitivity for holding detection
- **Sample Rate**: `100ms` - How often to check for changes

### Algorithm
1. **Movement**: Calculates delta between current and previous acceleration values
2. **Holding**: Analyzes gravity patterns and movement consistency
3. **Status**: Combines both signals to determine overall state

## 🎯 Use Cases

- **Fitness Apps**: Detect when user is walking/running vs. stationary
- **Gaming**: Motion-based controls and activity detection
- **Productivity**: Auto-pause when phone is put down
- **Health Monitoring**: Activity level detection
- **Smart Home**: Presence detection based on phone movement

## 🔒 Privacy & Permissions

The app only requests access to motion sensors and does not:
- Collect or store any personal data
- Send data to external servers
- Access camera, microphone, or location
- Require any account creation

## 🐛 Troubleshooting

### "Device Motion API not supported"
- Make sure you're using a mobile device
- Try a different browser (Chrome/Safari recommended)

### "Permission denied"
- Go to your browser settings and allow motion permissions
- On iOS, you may need to refresh the page after granting permission

### No movement detected
- Try adjusting the sensitivity thresholds in the code
- Make sure you're moving the phone enough to trigger detection

## 📄 License

MIT License - feel free to use this code for your own projects!

## 🤝 Contributing

Feel free to submit issues and enhancement requests!
