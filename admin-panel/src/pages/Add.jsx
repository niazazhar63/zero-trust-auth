import React from 'react'
import Form from '../components/Form'

const Add = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4"> Add Manually</h1>
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="">
            <h1 className="text-2xl sm:text-6xl font-bold text-center">Manually Add <span className="text-[#A3DC9A]">Account</span>!!!</h1>

            <div className="my-7 p-3">
                
                <Form />
            </div>

        </div>
    </div>;

    </div>
  )
}

export default Add