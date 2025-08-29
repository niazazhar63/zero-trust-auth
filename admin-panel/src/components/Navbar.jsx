import React from 'react'

const Navbar = () => {
  return (
    <div className='flex items-center py-2 px-[4%] justify-between bg-[#B8C46D]'>
        <h1 className='text-2xl font-black text-white'>Admin Panel</h1>
        <button className='bg-gray-500 text-white px-5 py-2 sm:px-7 rounded-full text-xs sm:text-sm cursor-pointer'>Log Out</button>
    </div>
  )
}

export default Navbar