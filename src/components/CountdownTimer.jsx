import { useState, useEffect } from 'react'

function CountdownTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  function calculateTimeLeft() {
    const difference = new Date(endDate) - new Date()
    let timeLeft = {}

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }
    }

    return timeLeft
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  const addLeadingZero = (value) => {
    return value < 10 ? `0${value}` : value
  }

  return (
    <div className="grid grid-cols-4 gap-4 text-center">
      <div className="bg-white rounded-lg p-3 shadow">
        <div className="text-2xl font-bold text-indigo-600">
          {addLeadingZero(timeLeft.days || 0)}
        </div>
        <div className="text-xs text-gray-500 uppercase">Days</div>
      </div>
      <div className="bg-white rounded-lg p-3 shadow">
        <div className="text-2xl font-bold text-indigo-600">
          {addLeadingZero(timeLeft.hours || 0)}
        </div>
        <div className="text-xs text-gray-500 uppercase">Hours</div>
      </div>
      <div className="bg-white rounded-lg p-3 shadow">
        <div className="text-2xl font-bold text-indigo-600">
          {addLeadingZero(timeLeft.minutes || 0)}
        </div>
        <div className="text-xs text-gray-500 uppercase">Minutes</div>
      </div>
      <div className="bg-white rounded-lg p-3 shadow">
        <div className="text-2xl font-bold text-indigo-600">
          {addLeadingZero(timeLeft.seconds || 0)}
        </div>
        <div className="text-xs text-gray-500 uppercase">Seconds</div>
      </div>
    </div>
  )
}

export default CountdownTimer 