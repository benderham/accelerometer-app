import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [isMoving, setIsMoving] = useState(false)
  const [isHolding, setIsHolding] = useState(false)
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 })
  const [permission, setPermission] = useState('prompt')
  const [error, setError] = useState(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const [apiTest, setApiTest] = useState('')
  const [debugMode, setDebugMode] = useState(false)
  
  // Simple game state
  const [gameActive, setGameActive] = useState(false)
  const [gameTime, setGameTime] = useState(0)
  const [bestTime, setBestTime] = useState(0)
  
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 })
  const gameTimer = useRef(null)
  const movementThreshold = 0.5
  const holdingThreshold = 0.05
  const gameMovementThreshold = 0.3

  const testAPIs = () => {
    let testResults = '=== API Availability Test ===\n'
    
    // Test Device Motion API
    testResults += `DeviceMotionEvent: ${typeof DeviceMotionEvent !== 'undefined' ? '✅ Available' : '❌ Not Available'}\n`
    
    if (typeof DeviceMotionEvent !== 'undefined') {
      testResults += `requestPermission function: ${typeof DeviceMotionEvent.requestPermission === 'function' ? '✅ Available' : '❌ Not Available'}\n`
    }
    
    // Test Device Orientation API
    testResults += `DeviceOrientationEvent: ${typeof DeviceOrientationEvent !== 'undefined' ? '✅ Available' : '❌ Not Available'}\n`
    
    if (typeof DeviceOrientationEvent !== 'undefined') {
      testResults += `requestPermission function: ${typeof DeviceOrientationEvent.requestPermission === 'function' ? '✅ Available' : '❌ Not Available'}\n`
    }
    
    // Test Permissions API
    testResults += `Permissions API: ${typeof navigator.permissions !== 'undefined' ? '✅ Available' : '❌ Not Available'}\n`
    
    // Test User Agent
    testResults += `User Agent: ${navigator.userAgent}\n`
    
    // Test HTTPS
    testResults += `HTTPS: ${window.location.protocol === 'https:' ? '✅ Yes' : '❌ No (HTTP)'}\n`
    
    // Test Local Network
    testResults += `Local Network: ${window.location.hostname.includes('localhost') || window.location.hostname.includes('192.168') ? '✅ Yes' : '❌ No'}\n`
    
    setApiTest(testResults)
  }

  const handleMotion = (event) => {
    const { accelerationIncludingGravity } = event
    
    if (!accelerationIncludingGravity) return

    const currentAccel = {
      x: accelerationIncludingGravity.x || 0,
      y: accelerationIncludingGravity.y || 0,
      z: accelerationIncludingGravity.z || 0
    }

    setAcceleration(currentAccel)

    // Calculate movement
    const deltaX = Math.abs(currentAccel.x - lastAcceleration.current.x)
    const deltaY = Math.abs(currentAccel.y - lastAcceleration.current.y)
    const deltaZ = Math.abs(currentAccel.z - lastAcceleration.current.z)
    const totalDelta = deltaX + deltaY + deltaZ

    // Detect movement
    if (totalDelta > movementThreshold) {
      setIsMoving(true)
    } else {
      setIsMoving(false)
    }

    // Detect if phone is being held
    const gravityMagnitude = Math.sqrt(currentAccel.x * currentAccel.x + currentAccel.y * currentAccel.y + currentAccel.z * currentAccel.z)
    const expectedGravity = 9.8
    const gravityDeviation = Math.abs(gravityMagnitude - expectedGravity)
    const hasReasonableGravity = gravityDeviation < 3
    const hasSomeActivity = totalDelta > holdingThreshold || gravityDeviation > 0.5
    
    if (hasReasonableGravity && hasSomeActivity) {
      setIsHolding(true)
    } else if (totalDelta < holdingThreshold && gravityDeviation < 0.5) {
      setIsHolding(false)
    }

    // Game logic - simple check
    if (gameActive && (!isHolding || totalDelta > gameMovementThreshold)) {
      endGame()
    }

    lastAcceleration.current = currentAccel
  }

  const startGame = () => {
    setGameActive(true)
    setGameTime(0)
    
    gameTimer.current = setInterval(() => {
      setGameTime(prev => prev + 0.1)
    }, 100)
  }

  const endGame = () => {
    if (gameTimer.current) {
      clearInterval(gameTimer.current)
      gameTimer.current = null
    }
    
    if (gameTime > bestTime) {
      setBestTime(gameTime)
    }
    
    setGameActive(false)
  }

  const resetGame = () => {
    if (gameTimer.current) {
      clearInterval(gameTimer.current)
      gameTimer.current = null
    }
    setGameActive(false)
    setGameTime(0)
  }

  const requestPermission = async () => {
    setIsRequesting(true)
    setError(null)
    let debug = 'Starting permission request...\n'
    
    try {
      if (!window.DeviceMotionEvent) {
        debug += 'DeviceMotionEvent not supported\n'
        throw new Error('Device Motion API not supported on this device/browser')
      }
      
      debug += 'DeviceMotionEvent is supported\n'

      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        debug += 'requestPermission function exists - iOS device detected\n'
        console.log('Requesting motion permission...')
        const permission = await DeviceMotionEvent.requestPermission()
        debug += `Permission result: ${permission}\n`
        console.log('Permission result:', permission)
        setPermission(permission)
        
        if (permission === 'granted') {
          debug += 'Permission granted, adding motion listener\n'
          window.addEventListener('devicemotion', handleMotion)
        } else {
          debug += 'Permission denied\n'
          setError('Permission denied for device motion')
        }
      } else {
        debug += 'No permission required - Android or older iOS\n'
        console.log('No permission required, adding motion listener...')
        setPermission('granted')
        window.addEventListener('devicemotion', handleMotion)
      }
    } catch (err) {
      debug += `Error: ${err.message}\n`
      console.error('Error requesting permission:', err)
      setError(err.message)
    } finally {
      setIsRequesting(false)
      setDebugInfo(debug)
    }
  }

  const handleUserGesture = () => {
    if (!isRequesting) {
      requestPermission()
    }
  }

  const resetPermission = () => {
    setPermission('prompt')
    setError(null)
    setDebugInfo('')
  }

  useEffect(() => {
    testAPIs()
    console.log('App mounted, current permission state:', permission)
    requestPermission()

    return () => {
      if (gameTimer.current) {
        clearInterval(gameTimer.current)
      }
    }
  }, [])

  const getStatusColor = () => {
    if (!isHolding) return '#ff6b6b'
    if (isMoving) return '#51cf66'
    return '#ffd43b'
  }

  const getStatusText = () => {
    if (!isHolding) return 'Phone not being held'
    if (isMoving) return 'Moving'
    return 'Holding (stationary)'
  }

  return (
    <div className="App">
      <div className="container">
        <h1>📱 Accelerometer Movement Detector</h1>
        
        {/* Debug Mode Toggle */}
        <div style={{ 
          margin: '15px 0',
          textAlign: 'center'
        }}>
          <button 
            onClick={() => setDebugMode(!debugMode)}
            style={{
              background: debugMode ? '#ff6b6b' : '#4caf50',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
          >
            {debugMode ? '🔒 Hide Debug Info' : '🔓 Show Debug Info'}
          </button>
        </div>

        {/* Game Mode Section */}
        {permission === 'granted' && !error && (
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            margin: '20px 0',
            borderRadius: '12px',
            border: '2px solid #dee2e6',
            textAlign: 'center'
          }}>
            <h2>🎮 Hold Still Challenge</h2>
            <p>Hold your phone perfectly still for as long as possible!</p>
            
            {!gameActive && (
              <div>
                <p><strong>Best Time:</strong> {bestTime.toFixed(1)} seconds</p>
                <button 
                  onClick={startGame}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    margin: '10px'
                  }}
                >
                  🚀 Start Challenge
                </button>
              </div>
            )}

            {gameActive && (
              <div style={{
                background: '#d4edda',
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid #c3e6cb'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#155724',
                  marginBottom: '10px'
                }}>
                  ⏱️ {gameTime.toFixed(1)}s
                </div>
                <div style={{
                  fontSize: '16px',
                  color: '#6c757d',
                  marginBottom: '10px'
                }}>
                  Best: {bestTime.toFixed(1)}s
                </div>
                <p style={{ marginTop: '10px', fontSize: '14px' }}>
                  💡 Keep your phone still and don't put it down!
                </p>
              </div>
            )}

            {!gameActive && gameTime > 0 && (
              <div style={{
                background: gameTime > bestTime ? '#d4edda' : '#f8d7da',
                padding: '20px',
                borderRadius: '8px',
                border: gameTime > bestTime ? '2px solid #c3e6cb' : '2px solid #f5c6cb'
              }}>
                <div style={{
                  fontSize: '36px',
                  marginBottom: '10px'
                }}>
                  {gameTime > bestTime ? '🎉 NEW RECORD! 🎉' : '💥 GAME OVER 💥'}
                </div>
                <p>Time: {gameTime.toFixed(1)} seconds</p>
                {gameTime > bestTime && <p>That's a new personal best!</p>}
                <button 
                  onClick={resetGame}
                  style={{
                    background: gameTime > bestTime ? '#28a745' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    margin: '5px'
                  }}
                >
                  {gameTime > bestTime ? '🏆 Play Again' : '🔄 Try Again'}
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* API Test Results - Only show in debug mode */}
        {debugMode && (
          <div style={{ 
            background: '#e8f5e8', 
            padding: '15px', 
            margin: '15px 0', 
            borderRadius: '8px', 
            fontSize: '12px',
            textAlign: 'left',
            fontFamily: 'monospace',
            border: '2px solid #4caf50'
          }}>
            <strong>🔍 iOS 18.5 API Compatibility Test:</strong><br/>
            <pre style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>{apiTest}</pre>
          </div>
        )}
        
        {/* Debug info - Only show in debug mode */}
        {debugMode && (
          <div style={{ 
            background: '#f0f0f0', 
            padding: '10px', 
            margin: '10px 0', 
            borderRadius: '8px', 
            fontSize: '12px',
            textAlign: 'left',
            fontFamily: 'monospace'
          }}>
            <strong>Debug Info:</strong><br/>
            Permission: {permission}<br/>
            Error: {error || 'none'}<br/>
            Is Requesting: {isRequesting ? 'yes' : 'no'}<br/>
            DeviceMotionEvent exists: {window.DeviceMotionEvent ? 'yes' : 'no'}<br/>
            requestPermission function: {typeof DeviceMotionEvent?.requestPermission === 'function' ? 'yes' : 'no'}<br/>
            <pre style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>{debugInfo}</pre>
          </div>
        )}
        
        {error && (
          <div className="error">
            <p>Error: {error}</p>
            <p>Permission was denied. You can try again or check your Safari settings.</p>
            <button 
              onClick={resetPermission}
              className="permission-button"
              style={{ marginTop: '10px' }}
            >
              Try Again
            </button>
          </div>
        )}

        {permission === 'prompt' && !error && (
          <div className="permission-prompt">
            <p>This app needs access to your device's motion sensors.</p>
            <p>Tap the button below to request permission:</p>
            <button 
              onClick={handleUserGesture}
              disabled={isRequesting}
              className="permission-button"
            >
              {isRequesting ? 'Requesting...' : 'Allow Motion Access'}
            </button>
            <p><small>On iOS, you may need to tap this button to trigger the permission prompt.</small></p>
          </div>
        )}

        {permission === 'granted' && !error && (
          <>
            <div 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor() }}
            >
              <h2>{getStatusText()}</h2>
            </div>

            <div className="stats">
              <div className="stat-card">
                <h3>Acceleration Data</h3>
                <div className="accel-values">
                  <div>X: {acceleration.x?.toFixed(2) || '0.00'} m/s²</div>
                  <div>Y: {acceleration.y?.toFixed(2) || '0.00'} m/s²</div>
                  <div>Z: {acceleration.z?.toFixed(2) || '0.00'} m/s²</div>
                </div>
              </div>

              <div className="stat-card">
                <h3>Status</h3>
                <div className="status-list">
                  <div className={`status-item ${isHolding ? 'active' : ''}`}>
                    📱 Holding: {isHolding ? 'Yes' : 'No'}
                  </div>
                  <div className={`status-item ${isMoving ? 'active' : ''}`}>
                    🏃 Moving: {isMoving ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>

            <div className="instructions">
              <h3>How it works:</h3>
              <ul>
                <li>🟢 <strong>Green:</strong> Phone is being held and moving</li>
                <li>🟡 <strong>Yellow:</strong> Phone is being held but stationary</li>
                <li>🔴 <strong>Red:</strong> Phone is not being held (likely placed down)</li>
              </ul>
              <p><em>Try moving your phone around, then place it on a table to see the difference!</em></p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
