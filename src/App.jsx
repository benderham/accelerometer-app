import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [isMoving, setIsMoving] = useState(false)
  const [isHolding, setIsHolding] = useState(false)
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 })
  const [permission, setPermission] = useState('prompt')
  const [error, setError] = useState(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [gameState, setGameState] = useState('waiting') // 'waiting', 'ready', 'playing', 'failed'
  const [timer, setTimer] = useState(0)
  const [bestTime, setBestTime] = useState(0)
  
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 })
  const timerRef = useRef(null)
  const movementThreshold = 0.5  // More sensitive to movement - harder to stay still
  const holdingThreshold = 0.05  // More strict holding detection
  const failureGracePeriod = 150  // 0.15 seconds grace period - less forgiving
  const failureTimeoutRef = useRef(null)

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

    // Detect if phone is being held - simplified logic
    const gravityMagnitude = Math.sqrt(currentAccel.x * currentAccel.x + currentAccel.y * currentAccel.y + currentAccel.z * currentAccel.z)
    const expectedGravity = 9.8
    const gravityDeviation = Math.abs(gravityMagnitude - expectedGravity)
    
    // Stricter holding detection
    const hasReasonableGravity = gravityDeviation < 3  // More strict gravity detection
    const hasSomeActivity = totalDelta > holdingThreshold || gravityDeviation > 0.5  // More strict
    
    if (hasReasonableGravity && hasSomeActivity) {
      setIsHolding(true)
    } else if (totalDelta < holdingThreshold && gravityDeviation < 1.0) {
      setIsHolding(false)
    }

    lastAcceleration.current = currentAccel
  }

  const requestPermission = async () => {
    setIsRequesting(true)
    setError(null)
    
    try {
      if (!window.DeviceMotionEvent) {
        throw new Error('Device Motion API not supported on this device/browser')
      }

      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const permission = await DeviceMotionEvent.requestPermission()
        setPermission(permission)
        
        if (permission === 'granted') {
          window.addEventListener('devicemotion', handleMotion)
        } else {
          setError('Permission denied for device motion')
        }
      } else {
        setPermission('granted')
        window.addEventListener('devicemotion', handleMotion)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsRequesting(false)
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
  }

  const startGame = () => {
    setGameState('playing')
    setTimer(0)
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 0.1)
    }, 100)
  }

  const failGame = () => {
    setGameState('failed')
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (failureTimeoutRef.current) {
      clearTimeout(failureTimeoutRef.current)
      failureTimeoutRef.current = null
    }
    if (timer > bestTime) {
      setBestTime(timer)
    }
  }

  const tryAgain = () => {
    setGameState('waiting')
    setTimer(0)
  }

  useEffect(() => {
    requestPermission()
  }, [])

  // Game logic - check for failure conditions with grace period
  useEffect(() => {
    if (gameState === 'playing') {
      if (!isHolding || isMoving) {
        // Clear any existing timeout
        if (failureTimeoutRef.current) {
          clearTimeout(failureTimeoutRef.current)
        }
        
        // Set a timeout to fail after grace period
        failureTimeoutRef.current = setTimeout(() => {
          failGame()
        }, failureGracePeriod)
      } else {
        // Clear timeout if conditions are good again
        if (failureTimeoutRef.current) {
          clearTimeout(failureTimeoutRef.current)
          failureTimeoutRef.current = null
        }
      }
    } else {
      // Clear timeout when not playing
      if (failureTimeoutRef.current) {
        clearTimeout(failureTimeoutRef.current)
        failureTimeoutRef.current = null
      }
    }
  }, [gameState, isHolding, isMoving])

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const tenths = Math.floor((time % 1) * 10)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`
  }

  return (
    <div className="App">
      {error && (
        <div className="error-overlay">
          <div className="error-content">
            <p>Error: {error}</p>
            <p>Permission was denied. You can try again or check your Safari settings.</p>
            <button 
              onClick={resetPermission}
              className="start-button"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {permission === 'prompt' && !error && (
        <div className="permission-overlay">
          <div className="permission-content">
            <p>This app needs access to your device's motion sensors.</p>
            <p>Tap the button below to request permission:</p>
            <button 
              onClick={handleUserGesture}
              disabled={isRequesting}
              className="start-button"
            >
              {isRequesting ? 'REQUESTING...' : 'ALLOW MOTION ACCESS'}
            </button>
            <p><small>On iOS, you may need to tap this button to trigger the permission prompt.</small></p>
          </div>
        </div>
      )}

      {permission === 'granted' && !error && (
        <>
          {gameState === 'waiting' && (
            <div className="challenge-screen">
              <h1 className="challenge-title">DO NOTHING</h1>
              <button 
                onClick={startGame}
                className="start-button"
              >
                START
              </button>
            </div>
          )}



          {gameState === 'playing' && (
            <div className="timer-screen">
              <div className="vertical-text">DOING NOTHING FOR</div>
              <div className="timer-display">
                <div className="timer-line">{Math.floor(timer / 60).toString().padStart(2, '0')}</div>
                <div className="timer-line">{Math.floor(timer % 60).toString().padStart(2, '0')}</div>
                <div className="timer-line">{(timer % 1 * 10).toFixed(0)}</div>
              </div>
            </div>
          )}

          {gameState === 'failed' && (
            <div className="challenge-screen">
              <h1 className="challenge-title">You did Nothing for</h1>
              <div className="result-time">{formatTime(timer)}</div>
              {bestTime > 0 && (
                <p className="best-time">Best time: {formatTime(bestTime)}</p>
              )}
              <div className="button-group">
                <button 
                  onClick={tryAgain}
                  className="start-button"
                >
                  TRY AGAIN
                </button>
                <button 
                  className="start-button"
                >
                  SHARE
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
