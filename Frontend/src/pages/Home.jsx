import React from 'react'
import { assets } from '../assets/asstes'

const Home = () => {
  return (
    <div className="mx-8 min-h-[70vh] flex justify-center items-center sm:mx-16 xl:mx-24 relative">
     <div>
         <div className="text-center sm:mt-20 mb-8">
        
        
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-700 sm:leading-16">The Best <span className="text-primary">Authentication</span> <br /> System For SaaS Applications</h1>
        
        


        <p className="my-6 sm:my-8 max-w-2xl m-auto max-sm:text-xs text-gray-500">This is your space to think out loud, to share what is matters, and to write without filters. Whether its one word or a thousand, your story starts right here.</p>
      </div>
      <img
        src={assets.gradientBackground}
        className="absolute -top-50 -z-1 opacity-50"
        alt=""
      />
     </div>
    </div>
  )
}

export default Home