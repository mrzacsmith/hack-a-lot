import React, { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const LandingPage = () => {
  const [hackathons, setHackathons] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, 'hackathons'),
      where('status', 'in', ['upcoming', 'active']),
      orderBy('startDate', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hackathonsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        registrationDeadline: doc.data().registrationDeadline?.toDate()
      }))
      setHackathons(hackathonsList)
    }, (error) => {
      console.error('Error listening to hackathons:', error)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div>
      {/* Render your component content here */}
    </div>
  )
}

export default LandingPage 